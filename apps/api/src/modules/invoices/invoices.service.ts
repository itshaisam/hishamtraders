import { Prisma } from '@prisma/client';
import { addDays } from 'date-fns';
import { InvoicesRepository } from './invoices.repository.js';
import { SettingsService } from '../settings/settings.service.js';
import { FifoDeductionService } from '../inventory/fifo-deduction.service.js';
import { CreditLimitService } from '../clients/credit-limit.service.js';
import { StockReversalService } from './stock-reversal.service.js';
import { CreateInvoiceDto, validateCreateInvoice } from './dto/create-invoice.dto.js';
import { InvoiceFilterDto } from './dto/invoice-filter.dto.js';
import { VoidInvoiceDto } from './dto/void-invoice.dto.js';
import { generateInvoiceNumber } from '../../utils/invoice-number.util.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../../utils/errors.js';
import { AuditService } from '../../services/audit.service.js';
import { changeHistoryService } from '../../services/change-history.service.js';
import { AutoJournalService } from '../../services/auto-journal.service.js';
import { GatePassService } from '../gate-passes/gate-pass.service.js';
import { validatePeriodNotClosed } from '../../utils/period-lock.js';
import { getWorkflowSetting } from '../../utils/workflow-settings.js';
import { updateSalesOrderStatus } from '../sales-orders/sales-orders.service.js';
import logger from '../../lib/logger.js';

export class InvoicesService {
  private repository: InvoicesRepository;
  private settingsService: SettingsService;
  private fifoService: FifoDeductionService;
  private creditLimitService: CreditLimitService;
  private stockReversalService: StockReversalService;
  private gatePassService: GatePassService;

  constructor(private prisma: any) {
    this.repository = new InvoicesRepository(prisma);
    this.settingsService = new SettingsService(prisma);
    this.fifoService = new FifoDeductionService(prisma);
    this.creditLimitService = new CreditLimitService(prisma);
    this.stockReversalService = new StockReversalService(prisma);
    this.gatePassService = new GatePassService(prisma);
  }

  /**
   * Create a new invoice with inventory deduction
   */
  async createInvoice(data: CreateInvoiceDto, userId: string) {
    // Validate override reason
    validateCreateInvoice(data);

    // Period lock check
    await validatePeriodNotClosed(data.invoiceDate);

    logger.info('Creating invoice', { clientId: data.clientId, itemCount: data.items.length });

    // 1. Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(this.prisma);

    // 2. Fetch client for payment terms and credit limit
    const client = await this.prisma.client.findUnique({
      where: { id: data.clientId },
    });

    if (!client) {
      throw new NotFoundError('Client not found');
    }

    // 3. Fetch warehouse
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: data.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundError('Warehouse not found');
    }

    // 4. Calculate due date
    const dueDate = addDays(data.invoiceDate, client.paymentTermsDays);

    // 5. Get tax rate: use custom rate if provided, otherwise fetch from settings (check client tax exemption - Story 3.5)
    const taxRate = client.taxExempt
      ? 0
      : (data.taxRate !== undefined && data.taxRate !== null ? data.taxRate : await this.settingsService.getTaxRate());

    // 6. Validate and calculate line item totals
    const itemsWithTotals = await this.calculateLineItemTotals(data.items);

    // 7. Calculate invoice totals
    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    // Log tax exemption if applicable
    if (client.taxExempt) {
      logger.info(`Client ${client.id} is tax-exempt. Tax rate: 0%`, {
        clientName: client.name,
        reason: client.taxExemptReason,
      });
    }

    // 8. Workflow setting enforcement
    const requireSO = await getWorkflowSetting('sales.requireSalesOrder');
    const requireDN = await getWorkflowSetting('sales.requireDeliveryNote');
    const allowDirect = await getWorkflowSetting('sales.allowDirectInvoice');

    // 8a. Enforce: Sales Order required
    if (requireSO && !data.salesOrderId) {
      throw new BadRequestError('Sales Order is required. Create an invoice from a confirmed Sales Order, or disable "Require Sales Order" in Workflow Settings.');
    }

    // 8b. Enforce: Delivery Note required
    if (requireDN && !data.deliveryNoteId) {
      throw new BadRequestError('Delivery Note is required. Create an invoice from a dispatched Delivery Note, or disable "Require Delivery Note" in Workflow Settings.');
    }

    // 8c. Enforce: Direct invoice not allowed (must have SO or DN)
    if (!allowDirect && !data.salesOrderId && !data.deliveryNoteId) {
      throw new BadRequestError('Direct invoice creation is disabled. Create invoices from Sales Orders or Delivery Notes.');
    }

    // 8d. DN mode: skip stock deduction (DN already deducted stock)
    const skipStockDeduction = requireDN && !!data.deliveryNoteId;

    // 8e. Validate DN if provided in full mode
    if (skipStockDeduction) {
      const dn = await this.prisma.deliveryNote.findFirst({
        where: { id: data.deliveryNoteId, status: { in: ['DISPATCHED', 'DELIVERED'] } },
      });
      if (!dn) {
        throw new BadRequestError('Delivery Note must be dispatched or delivered before invoicing');
      }
    }

    // 8f. Check stock availability only in simple mode (no DN)
    if (!skipStockDeduction) {
      await this.validateStockAvailability(data.items, data.warehouseId);
    }

    // 9. Credit limit check for CREDIT sales
    if (data.paymentType === 'CREDIT') {
      await this.validateCreditLimitWithOverride(
        client.id,
        total,
        userId,
        data.adminOverride,
        data.overrideReason
      );
    }

    // 10. Create invoice with transaction
    const invoice = await this.prisma.$transaction(async (tx: any) => {
      // Create invoice with items
      const createdInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: data.clientId,
          warehouseId: data.warehouseId,
          invoiceDate: data.invoiceDate,
          dueDate,
          paymentType: data.paymentType,
          subtotal: new Prisma.Decimal(subtotal.toFixed(4)),
          taxAmount: new Prisma.Decimal(taxAmount.toFixed(4)),
          taxRate: new Prisma.Decimal(taxRate.toFixed(4)),
          total: new Prisma.Decimal(total.toFixed(4)),
          paidAmount: data.paymentType === 'CASH' ? new Prisma.Decimal(total.toFixed(4)) : new Prisma.Decimal(0),
          status: data.paymentType === 'CASH' ? 'PAID' : 'PENDING',
          salesOrderId: data.salesOrderId || null,
          deliveryNoteId: data.deliveryNoteId || null,
          notes: data.adminOverride && data.overrideReason
            ? `${data.notes || ''}\n[ADMIN OVERRIDE] ${data.overrideReason}`.trim()
            : data.notes,
        },
        include: {
          items: true,
        },
      });

      // Create invoice items — conditionally deduct stock
      for (const item of itemsWithTotals) {
        if (skipStockDeduction) {
          // FULL MODE: DN already handled stock — just create invoice item
          await tx.invoiceItem.create({
            data: {
              invoiceId: createdInvoice.id,
              productId: item.productId,
              productVariantId: item.productVariantId,
              batchNo: null,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice.toFixed(4)),
              discount: new Prisma.Decimal(item.discount.toFixed(4)),
              total: new Prisma.Decimal(item.total.toFixed(4)),
            },
          });
        } else {
          // SIMPLE MODE: Deduct stock via FIFO
          const deductions = await this.fifoService.deductStockFifo(
            item.productId,
            data.warehouseId,
            item.quantity,
            item.productVariantId
          );

          await tx.invoiceItem.create({
            data: {
              invoiceId: createdInvoice.id,
              productId: item.productId,
              productVariantId: item.productVariantId,
              batchNo: deductions[0]?.batchNo || null,
              quantity: item.quantity,
              unitPrice: new Prisma.Decimal(item.unitPrice.toFixed(4)),
              discount: new Prisma.Decimal(item.discount.toFixed(4)),
              total: new Prisma.Decimal(item.total.toFixed(4)),
            },
          });

          await this.fifoService.applyDeductions(deductions, tx);

          for (const deduction of deductions) {
            await tx.stockMovement.create({
              data: {
                productId: item.productId,
                productVariantId: item.productVariantId,
                warehouseId: data.warehouseId,
                movementType: 'SALE',
                quantity: deduction.quantityDeducted,
                referenceType: 'INVOICE',
                referenceId: createdInvoice.id,
                userId,
                notes: `Invoice ${invoiceNumber} - Batch ${deduction.batchNo || 'N/A'}`,
              },
            });
          }
        }
      }

      // Update client balance for CREDIT invoices
      if (data.paymentType === 'CREDIT') {
        await tx.client.update({
          where: { id: data.clientId },
          data: {
            balance: {
              increment: new Prisma.Decimal(total.toFixed(4)),
            },
          },
        });
      }

      // Auto journal entry: DR A/R, CR Sales Revenue + Tax Payable + optionally COGS
      await AutoJournalService.onInvoiceCreated(tx, {
        id: createdInvoice.id,
        invoiceNumber,
        total,
        subtotal,
        taxAmount,
        date: data.invoiceDate,
        items: itemsWithTotals.map((i: any) => ({ productId: i.productId, quantity: i.quantity })),
      }, userId, { skipCogs: skipStockDeduction });

      // Update Sales Order item invoicedQuantity if SO linked
      if (data.salesOrderId) {
        for (const item of data.items) {
          if (item.salesOrderItemId) {
            await tx.salesOrderItem.update({
              where: { id: item.salesOrderItemId },
              data: { invoicedQuantity: { increment: item.quantity } },
            });
          }
        }
        await updateSalesOrderStatus(tx, data.salesOrderId);
      }

      return createdInvoice;
    });

    logger.info(`Invoice created successfully: ${invoiceNumber}`, {
      invoiceId: invoice.id,
      total,
      paymentType: data.paymentType,
      mode: skipStockDeduction ? 'full (DN)' : 'simple',
    });

    // Auto-create gate pass only in simple mode (no DN)
    let gatePassInfo: { id: string; gatePassNumber: string; status: string } | null = null;
    if (!skipStockDeduction) {
      try {
        const gp = await this.gatePassService.createGatePassFromInvoice(invoice.id, userId);
        gatePassInfo = { id: gp.id, gatePassNumber: gp.gatePassNumber, status: gp.status };
      } catch (gpError: any) {
        logger.warn('Failed to auto-create gate pass for invoice', {
          invoiceId: invoice.id,
          error: gpError.message,
        });
      }
    }

    // Return full invoice with relations + gate pass info
    const fullInvoice = await this.repository.findById(invoice.id);
    return { ...fullInvoice, gatePass: gatePassInfo };
  }

  /**
   * Calculate line item totals with discounts
   */
  private async calculateLineItemTotals(items: CreateInvoiceDto['items']) {
    return items.map((item) => {
      const lineSubtotal = item.quantity * item.unitPrice;
      const discountAmount = lineSubtotal * (item.discount / 100);
      const lineTotal = lineSubtotal - discountAmount;

      return {
        ...item,
        total: lineTotal,
      };
    });
  }

  /**
   * Validate stock availability for all items
   */
  private async validateStockAvailability(items: CreateInvoiceDto['items'], warehouseId: string) {
    for (const item of items) {
      const available = await this.fifoService.getAvailableQuantity(
        item.productId,
        warehouseId,
        item.productVariantId
      );

      if (available < item.quantity) {
        // Get product name for better error message
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          select: { name: true, sku: true },
        });

        throw new BadRequestError(
          `Insufficient stock for ${product?.name || 'product'}. Available: ${available}, Required: ${item.quantity}`
        );
      }
    }
  }

  /**
   * Validate credit limit with admin override support
   */
  private async validateCreditLimitWithOverride(
    clientId: string,
    invoiceTotal: number,
    userId: string,
    adminOverride: boolean = false,
    overrideReason?: string
  ) {
    // Get warning threshold from settings (default 80%)
    const warningThreshold = 80;

    // Check credit limit
    const creditCheck = await this.creditLimitService.checkCreditLimit(
      clientId,
      invoiceTotal,
      warningThreshold
    );

    // If credit limit exceeded, require admin override
    if (creditCheck.status === 'EXCEEDED') {
      if (!adminOverride) {
        throw new BadRequestError(creditCheck.message + ' Admin override required.');
      }

      // Validate user is Admin
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user || user.role.name !== 'ADMIN') {
        throw new ForbiddenError('Only Admin users can override credit limits');
      }

      if (!overrideReason || overrideReason.trim().length < 10) {
        throw new BadRequestError('Override reason must be at least 10 characters');
      }

      if (overrideReason.trim().length > 500) {
        throw new BadRequestError('Override reason must not exceed 500 characters');
      }

      // Log credit limit override to audit log
      await this.prisma.auditLog.create({
        data: {
          userId,
          action: 'CREDIT_LIMIT_OVERRIDE',
          entityType: 'Invoice',
          entityId: null, // Will be set after invoice creation
          notes: overrideReason,
          changedFields: {
            clientId,
            invoiceAmount: invoiceTotal,
            currentBalance: creditCheck.currentBalance,
            creditLimit: creditCheck.creditLimit,
            newBalance: creditCheck.newBalance,
            utilization: creditCheck.utilization,
          },
        },
      });

      logger.warn('Credit limit override approved', {
        userId,
        clientId,
        utilization: creditCheck.utilization.toFixed(2) + '%',
        reason: overrideReason,
      });
    } else if (creditCheck.status === 'WARNING') {
      // Log warning but allow creation
      logger.warn('Client approaching credit limit', {
        clientId,
        utilization: creditCheck.utilization.toFixed(2) + '%',
        message: creditCheck.message,
      });
    }
  }

  /**
   * Get all invoices with filters
   */
  async getInvoices(filters: InvoiceFilterDto) {
    return this.repository.findAll(filters);
  }

  /**
   * Get invoice by ID
   */
  async getInvoiceById(id: string) {
    const invoice = await this.repository.findById(id);
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // Attach associated gate pass info if exists
    const gatePass = await this.prisma.gatePass.findFirst({
      where: { referenceType: 'INVOICE', referenceId: id },
      select: { id: true, gatePassNumber: true, status: true },
    });

    return { ...invoice, gatePass: gatePass || null };
  }

  /**
   * Get returnable quantities for each item in an invoice.
   * Subtracts already-returned quantities (from non-voided credit notes).
   */
  async getReturnableQuantities(invoiceId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { items: { select: { id: true, quantity: true } } },
    });
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    const result: Record<string, { originalQty: number; alreadyReturned: number; maxReturnable: number }> = {};

    for (const item of invoice.items) {
      const agg = await this.prisma.creditNoteItem.aggregate({
        _sum: { quantityReturned: true },
        where: {
          invoiceItemId: item.id,
          creditNote: { status: { not: 'VOIDED' } },
        },
      });
      const returned = agg._sum.quantityReturned || 0;
      result[item.id] = {
        originalQty: item.quantity,
        alreadyReturned: returned,
        maxReturnable: item.quantity - returned,
      };
    }

    return result;
  }

  /**
   * Get invoice by invoice number
   */
  async getInvoiceByNumber(invoiceNumber: string) {
    const invoice = await this.repository.findByInvoiceNumber(invoiceNumber);
    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }
    return invoice;
  }

  /**
   * Void an invoice and reverse stock deductions
   * Story 3.4: Invoice Voiding and Stock Reversal
   */
  async voidInvoice(invoiceId: string, userId: string, dto: VoidInvoiceDto) {
    // Validate invoice exists
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        client: true,
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // Capture snapshot before voiding
    await changeHistoryService.captureSnapshot('INVOICE', invoiceId, invoice as any, userId);

    // Validate not already voided
    if (invoice.status === 'VOIDED') {
      throw new BadRequestError('Invoice is already voided');
    }

    // Validate no payments recorded
    const hasPayments = await this.prisma.paymentAllocation.count({
      where: { invoiceId },
    });

    if (hasPayments > 0) {
      throw new BadRequestError(
        'Cannot void invoice with recorded payments. Please void payments first.'
      );
    }

    // Validate status is PENDING
    if (invoice.status !== 'PENDING') {
      throw new BadRequestError('Can only void invoices with PENDING status');
    }

    // Execute void operation in transaction
    return await this.prisma.$transaction(async (tx: any) => {
      // 1. Reverse stock
      await this.stockReversalService.reverseInvoiceStock(invoiceId, userId, tx);

      // 2. Update client balance (CREDIT invoices only)
      if (invoice.paymentType === 'CREDIT') {
        const currentBalance = parseFloat(invoice.client.balance.toString());
        const invoiceTotal = parseFloat(invoice.total.toString());
        const newBalance = Math.max(0, currentBalance - invoiceTotal);

        await tx.client.update({
          where: { id: invoice.clientId },
          data: { balance: new Prisma.Decimal(newBalance.toFixed(4)) },
        });

        logger.info('Client balance updated for voided invoice', {
          clientId: invoice.clientId,
          oldBalance: currentBalance,
          newBalance,
          reduction: invoiceTotal,
        });
      }

      // 3. Update invoice status
      const voidedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'VOIDED',
          voidedAt: new Date(),
          voidedBy: userId,
          voidReason: dto.reason,
        },
        include: {
          client: true,
          items: true,
          warehouse: true,
          voider: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      // 4. Auto journal entry: reverse the original (including COGS reversal)
      await AutoJournalService.onInvoiceVoided(tx, {
        id: invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        total: parseFloat(invoice.total.toString()),
        subtotal: parseFloat(invoice.subtotal.toString()),
        taxAmount: parseFloat(invoice.taxAmount.toString()),
        items: invoice.items.map((i: any) => ({ productId: i.productId, quantity: i.quantity })),
      }, userId);

      // 5. Log audit
      await AuditService.log({
        userId,
        action: 'DELETE',
        entityType: 'Invoice',
        entityId: invoiceId,
        changedFields: {
          status: { old: 'PENDING', new: 'VOIDED' },
          voidReason: { old: null, new: dto.reason },
        },
        notes: `Invoice ${invoice.invoiceNumber} voided. Reason: ${dto.reason}. ${invoice.items.length} item(s) stock reversed. Total: ${invoice.total}`,
      });

      logger.info('Invoice voided successfully', {
        invoiceId,
        invoiceNumber: invoice.invoiceNumber,
        userId,
        reason: dto.reason,
        itemsReversed: invoice.items.length,
      });

      return voidedInvoice;
    });
  }
}
