import { PaymentType, PaymentMethod, PaymentReferenceType, Prisma } from '@prisma/client';
import { prisma, getTenantId } from '../../lib/prisma.js';
import { PaymentsRepository, PaymentFilters, UnifiedPaymentFilters } from './payments.repository.js';
import { PaymentAllocationService, AllocationResult } from './payment-allocation.service.js';
import { NotFoundError } from '../../utils/errors.js';
import { AutoJournalService } from '../../services/auto-journal.service.js';
import { validatePeriodNotClosed } from '../../utils/period-lock.js';
import logger from '../../lib/logger.js';
import { recoveryService } from '../recovery/recovery.service.js';

export interface CreateSupplierPaymentDto {
  supplierId: string;
  paymentReferenceType?: PaymentReferenceType;
  referenceId?: string;
  amount: number;
  method: PaymentMethod;
  date: Date;
  notes?: string;
  recordedBy: string;
  bankAccountId?: string;
}

export interface CreateClientPaymentDto {
  clientId: string;
  amount: number;
  method: PaymentMethod;
  referenceNumber?: string; // For cheque/bank transfer
  date: Date;
  notes?: string;
  recordedBy: string;
  bankAccountId?: string;
}

export class PaymentsService {
  private repository: PaymentsRepository;
  private allocationService: PaymentAllocationService;

  constructor() {
    this.repository = new PaymentsRepository();
    this.allocationService = new PaymentAllocationService(prisma);
  }

  /**
   * Create a supplier payment with validation
   */
  async createSupplierPayment(dto: CreateSupplierPaymentDto) {
    // Period lock check
    await validatePeriodNotClosed(dto.date);

    // Validation: Amount must be greater than 0
    if (dto.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    // Validation: If method is CHEQUE or BANK_TRANSFER, reference (notes) is required
    if (
      (dto.method === PaymentMethod.CHEQUE || dto.method === PaymentMethod.BANK_TRANSFER) &&
      (!dto.notes || dto.notes.trim().length === 0)
    ) {
      throw new Error('Reference number required for cheque or bank transfer');
    }

    // Validation: If paymentReferenceType is PO, referenceId (PO ID) is required
    if (dto.paymentReferenceType === PaymentReferenceType.PO && !dto.referenceId) {
      throw new Error('PO ID is required when payment reference type is PO');
    }

    // Create payment
    const payment = await this.repository.create({
      paymentType: PaymentType.SUPPLIER,
      paymentReferenceType: dto.paymentReferenceType || null,
      referenceId: dto.referenceId || null,
      amount: dto.amount,
      method: dto.method,
      date: dto.date,
      notes: dto.notes || null,
      tenantId: getTenantId(),
      user: {
        connect: { id: dto.recordedBy },
      },
      supplier: dto.supplierId
        ? {
            connect: { id: dto.supplierId },
          }
        : undefined,
      ...(dto.bankAccountId && {
        bankAccount: { connect: { id: dto.bankAccountId } },
      }),
    } as any);

    // Auto journal entry: DR A/P, CR Bank
    await AutoJournalService.onSupplierPayment(
      { id: payment.id, amount: dto.amount, date: dto.date, referenceNumber: dto.notes, bankAccountId: dto.bankAccountId },
      dto.recordedBy
    );

    return payment;
  }

  /**
   * Get all supplier payments with filters
   */
  async getSupplierPayments(filters: PaymentFilters) {
    return this.repository.findAll({
      ...filters,
      paymentType: PaymentType.SUPPLIER,
    });
  }

  /**
   * Get payments for a specific supplier
   */
  async getSupplierPaymentHistory(supplierId: string) {
    return this.repository.findBySupplier(supplierId);
  }

  /**
   * Get PO outstanding balance
   */
  async getPOBalance(poId: string) {
    return this.repository.getPOBalance(poId);
  }

  /**
   * Get payment by ID
   */
  async getPaymentById(id: string) {
    const payment = await this.repository.findById(id);
    if (!payment) {
      throw new Error('Payment not found');
    }
    return payment;
  }

  /**
   * Create a client payment with FIFO allocation (Story 3.6)
   */
  async createClientPayment(dto: CreateClientPaymentDto): Promise<{ payment: any; allocation: AllocationResult }> {
    // Period lock check
    await validatePeriodNotClosed(dto.date);

    // Validation: Amount must be greater than 0
    if (dto.amount <= 0) {
      throw new Error('Payment amount must be greater than 0');
    }

    // Validation: If method is CHEQUE or BANK_TRANSFER, reference number is required
    if (
      (dto.method === PaymentMethod.CHEQUE || dto.method === PaymentMethod.BANK_TRANSFER) &&
      (!dto.referenceNumber || dto.referenceNumber.trim().length === 0)
    ) {
      throw new Error('Reference number required for cheque or bank transfer');
    }

    // Verify client exists
    const client = await prisma.client.findUnique({
      where: { id: dto.clientId },
    });

    if (!client) {
      throw new Error('Client not found');
    }

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        clientId: dto.clientId,
        paymentType: PaymentType.CLIENT,
        amount: new Prisma.Decimal(dto.amount.toFixed(4)),
        method: dto.method,
        referenceNumber: dto.referenceNumber || null,
        date: dto.date,
        notes: dto.notes || null,
        recordedBy: dto.recordedBy,
        tenantId: getTenantId(),
        ...(dto.bankAccountId && { bankAccountId: dto.bankAccountId }),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
            balance: true,
          },
        },
      },
    });

    logger.info('Client payment created', {
      paymentId: payment.id,
      clientId: dto.clientId,
      clientName: client.name,
      amount: dto.amount,
      method: dto.method,
      recordedBy: dto.recordedBy,
    });

    // Allocate payment to invoices using FIFO
    const allocation = await this.allocationService.allocatePaymentToInvoices(
      payment.id,
      dto.clientId,
      dto.amount
    );

    // Update client balance
    await this.allocationService.updateClientBalance(dto.clientId, allocation.totalAllocated);

    logger.info('Client payment allocated', {
      paymentId: payment.id,
      totalAllocated: allocation.totalAllocated,
      overpayment: allocation.overpayment,
      invoicesAllocated: allocation.allocations.length,
    });

    // Auto journal entry: DR Bank, CR A/R
    await AutoJournalService.onClientPayment(
      { id: payment.id, amount: dto.amount, date: dto.date, referenceNumber: dto.referenceNumber, bankAccountId: dto.bankAccountId },
      dto.recordedBy
    );

    // Match payment to pending promises (best-effort, FIFO)
    try {
      await recoveryService.matchPaymentToPromises(
        dto.clientId,
        dto.amount,
        dto.date,
        dto.recordedBy
      );
    } catch (err) {
      logger.warn('Failed to match payment to promises', { clientId: dto.clientId, error: err });
    }

    return { payment, allocation };
  }

  /**
   * Get client payment history
   */
  async getClientPaymentHistory(clientId: string) {
    return prisma.payment.findMany({
      where: {
        clientId,
        paymentType: PaymentType.CLIENT,
      },
      include: {
        allocations: {
          include: {
            invoice: {
              select: {
                invoiceNumber: true,
                total: true,
                paidAmount: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * Get outstanding invoices for a client
   */
  async getClientOutstandingInvoices(clientId: string) {
    return this.allocationService.getOutstandingInvoices(clientId);
  }

  /**
   * Get all client payments with optional client filter (Story 3.6)
   */
  async getAllClientPayments(clientId?: string) {
    return prisma.payment.findMany({
      where: {
        paymentType: PaymentType.CLIENT,
        ...(clientId && { clientId }),
      },
      include: {
        client: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        allocations: {
          include: {
            invoice: {
              select: {
                invoiceNumber: true,
                total: true,
                paidAmount: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  /**
   * Get all payments (unified: both client and supplier) with filters
   * Story 3.8: Payment History
   */
  async getAllPayments(filters: UnifiedPaymentFilters) {
    const result = await this.repository.findAllUnified(filters);

    return {
      payments: result.payments.map((p: any) => ({
        id: p.id,
        date: p.date,
        type: p.paymentType,
        partyName: p.client?.name || p.supplier?.name || 'Unknown',
        partyId: p.clientId || p.supplierId,
        amount: parseFloat(p.amount.toString()),
        method: p.method,
        referenceNumber: p.referenceNumber || '',
        notes: p.notes || '',
        recordedByName: p.user.name,
        allocations: p.allocations,
      })),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  /**
   * Get payment details with full related data
   * Story 3.8: Payment Details Modal
   */
  async getPaymentDetails(id: string) {
    const payment = await this.repository.findByIdDetailed(id);
    if (!payment) {
      throw new NotFoundError('Payment not found');
    }

    // For supplier payments with PO reference, look up the PO
    let purchaseOrder = null;
    if (payment.paymentType === 'SUPPLIER' && payment.paymentReferenceType === 'PO' && payment.referenceId) {
      purchaseOrder = await prisma.purchaseOrder.findUnique({
        where: { id: payment.referenceId },
        select: { id: true, poNumber: true, totalAmount: true, status: true },
      });
    }

    return {
      ...payment,
      amount: parseFloat(payment.amount.toString()),
      purchaseOrder,
    };
  }
}
