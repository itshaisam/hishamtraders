import { InvoiceStatus, Prisma } from '@prisma/client';
import logger from '../../lib/logger.js';

export interface InvoiceAllocation {
  invoiceId: string;
  invoiceNumber: string;
  allocatedAmount: number;
}

export interface AllocationResult {
  paymentId: string;
  totalAllocated: number;
  overpayment: number;
  allocations: InvoiceAllocation[];
}

/**
 * Payment Allocation Service (Story 3.6)
 * Handles FIFO-based allocation of client payments to outstanding invoices
 */
export class PaymentAllocationService {
  constructor(private prisma: any) {}

  /**
   * Allocate payment to client invoices using FIFO (oldest unpaid first)
   * @param paymentId - The payment to allocate
   * @param clientId - The client whose invoices to allocate against
   * @param paymentAmount - Total payment amount
   * @returns Allocation result with breakdown
   */
  async allocatePaymentToInvoices(
    paymentId: string,
    clientId: string,
    paymentAmount: number
  ): Promise<AllocationResult> {
    // Get all outstanding invoices for this client (FIFO order - oldest first)
    const outstandingInvoices = await this.getOutstandingInvoices(clientId);

    if (outstandingInvoices.length === 0) {
      logger.warn('No outstanding invoices found for client', { clientId, paymentId });
      return {
        paymentId,
        totalAllocated: 0,
        overpayment: paymentAmount,
        allocations: [],
      };
    }

    let remainingAmount = paymentAmount;
    const allocations: InvoiceAllocation[] = [];

    // Allocate to invoices in FIFO order
    for (const invoice of outstandingInvoices) {
      if (remainingAmount <= 0) break;

      const outstandingAmount = parseFloat(invoice.total.toString()) - parseFloat(invoice.paidAmount.toString());
      const allocationAmount = Math.min(remainingAmount, outstandingAmount);

      // Create payment allocation record
      await this.prisma.paymentAllocation.create({
        data: {
          paymentId,
          invoiceId: invoice.id,
          amount: new Prisma.Decimal(allocationAmount.toFixed(4)),
        },
      });

      // Update invoice paid amount
      const newPaidAmount = parseFloat(invoice.paidAmount.toString()) + allocationAmount;
      await this.prisma.invoice.update({
        where: { id: invoice.id },
        data: {
          paidAmount: new Prisma.Decimal(newPaidAmount.toFixed(4)),
          status: this.calculateInvoiceStatus(
            parseFloat(invoice.total.toString()),
            newPaidAmount,
            invoice.dueDate
          ),
        },
      });

      allocations.push({
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        allocatedAmount: allocationAmount,
      });

      remainingAmount -= allocationAmount;

      logger.info('Payment allocated to invoice', {
        paymentId,
        invoiceId: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        allocatedAmount: allocationAmount,
        remainingPayment: remainingAmount,
      });
    }

    const totalAllocated = paymentAmount - remainingAmount;

    return {
      paymentId,
      totalAllocated,
      overpayment: remainingAmount,
      allocations,
    };
  }

  /**
   * Get outstanding invoices for a client (FIFO order - oldest first)
   */
  async getOutstandingInvoices(clientId: string) {
    return this.prisma.invoice.findMany({
      where: {
        clientId,
        status: {
          in: [InvoiceStatus.PENDING, InvoiceStatus.PARTIAL, InvoiceStatus.OVERDUE],
        },
      },
      orderBy: {
        invoiceDate: 'asc', // FIFO: oldest first
      },
    });
  }

  /**
   * Get allocation details for a payment
   */
  async getPaymentAllocations(paymentId: string) {
    return this.prisma.paymentAllocation.findMany({
      where: { paymentId },
      include: {
        invoice: {
          select: {
            invoiceNumber: true,
            invoiceDate: true,
            total: true,
            paidAmount: true,
            status: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Get all payments allocated to a specific invoice
   */
  async getInvoiceAllocations(invoiceId: string) {
    return this.prisma.paymentAllocation.findMany({
      where: { invoiceId },
      include: {
        payment: {
          select: {
            id: true,
            amount: true,
            method: true,
            date: true,
            referenceNumber: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });
  }

  /**
   * Calculate invoice status based on payment
   */
  private calculateInvoiceStatus(
    total: number,
    paidAmount: number,
    dueDate: Date
  ): InvoiceStatus {
    if (paidAmount >= total) {
      return InvoiceStatus.PAID;
    } else if (paidAmount > 0) {
      return InvoiceStatus.PARTIAL;
    } else if (new Date() > dueDate) {
      return InvoiceStatus.OVERDUE;
    } else {
      return InvoiceStatus.PENDING;
    }
  }

  /**
   * Update client balance after payment allocation
   * @param clientId - Client ID
   * @param paymentAmount - Amount to reduce from balance
   */
  async updateClientBalance(clientId: string, paymentAmount: number) {
    const client = await this.prisma.client.findUnique({
      where: { id: clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    const currentBalance = parseFloat(client.balance.toString());
    const newBalance = Math.max(0, currentBalance - paymentAmount);

    await this.prisma.client.update({
      where: { id: clientId },
      data: {
        balance: new Prisma.Decimal(newBalance.toFixed(4)),
      },
    });

    logger.info('Client balance updated after payment', {
      clientId,
      previousBalance: currentBalance,
      paymentAmount,
      newBalance,
    });

    return newBalance;
  }
}
