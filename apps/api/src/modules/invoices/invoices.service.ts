import { PrismaClient, Prisma } from '@prisma/client';
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
import logger from '../../lib/logger.js';

export class InvoicesService {
  private repository: InvoicesRepository;
  private settingsService: SettingsService;
  private fifoService: FifoDeductionService;
  private creditLimitService: CreditLimitService;
  private stockReversalService: StockReversalService;

  constructor(private prisma: PrismaClient) {
    this.repository = new InvoicesRepository(prisma);
    this.settingsService = new SettingsService(prisma);
    this.fifoService = new FifoDeductionService(prisma);
    this.creditLimitService = new CreditLimitService(prisma);
    this.stockReversalService = new StockReversalService(prisma);
  }

  /**
   * Create a new invoice with inventory deduction
   */
  async createInvoice(data: CreateInvoiceDto, userId: string) {
    // Validate override reason
    validateCreateInvoice(data);

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

    // 5. Get tax rate from settings (check client tax exemption - Story 3.5)
    const taxRate = client.taxExempt ? 0 : await this.settingsService.getTaxRate();

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

    // 8. Check stock availability for all items
    await this.validateStockAvailability(data.items, data.warehouseId);

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
    const invoice = await this.prisma.$transaction(async (tx) => {
      // Create invoice with items
      const createdInvoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          clientId: data.clientId,
          warehouseId: data.warehouseId,
          invoiceDate: data.invoiceDate,
          dueDate,
          paymentType: data.paymentType,
          subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
          taxAmount: new Prisma.Decimal(taxAmount.toFixed(2)),
          taxRate: new Prisma.Decimal(taxRate.toFixed(2)), // Snapshot tax rate (Story 3.5)
          total: new Prisma.Decimal(total.toFixed(2)),
          paidAmount: data.paymentType === 'CASH' ? new Prisma.Decimal(total.toFixed(2)) : new Prisma.Decimal(0),
          status: data.paymentType === 'CASH' ? 'PAID' : 'PENDING',
          notes: data.adminOverride && data.overrideReason
            ? `${data.notes || ''}\n[ADMIN OVERRIDE] ${data.overrideReason}`.trim()
            : data.notes,
        },
        include: {
          items: true,
        },
      });

      // Create invoice items and deduct stock
      for (const item of itemsWithTotals) {
        // Get FIFO deductions for this item
        const deductions = await this.fifoService.deductStockFifo(
          item.productId,
          data.warehouseId,
          item.quantity,
          item.productVariantId
        );

        // Create invoice item (track first batch number for reference)
        await tx.invoiceItem.create({
          data: {
            invoiceId: createdInvoice.id,
            productId: item.productId,
            productVariantId: item.productVariantId,
            batchNo: deductions[0]?.batchNo || null,
            quantity: item.quantity,
            unitPrice: new Prisma.Decimal(item.unitPrice.toFixed(2)),
            discount: new Prisma.Decimal(item.discount.toFixed(2)),
            total: new Prisma.Decimal(item.total.toFixed(2)),
          },
        });

        // Apply inventory deductions
        await this.fifoService.applyDeductions(deductions, tx);

        // Create stock movements for each batch deducted
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

      // Update client balance for CREDIT invoices
      if (data.paymentType === 'CREDIT') {
        await tx.client.update({
          where: { id: data.clientId },
          data: {
            balance: {
              increment: new Prisma.Decimal(total.toFixed(2)),
            },
          },
        });
      }

      return createdInvoice;
    });

    logger.info(`Invoice created successfully: ${invoiceNumber}`, {
      invoiceId: invoice.id,
      total,
      paymentType: data.paymentType,
    });

    // Return full invoice with relations
    return this.repository.findById(invoice.id);
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
    return invoice;
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
    return await this.prisma.$transaction(async (tx) => {
      // 1. Reverse stock
      await this.stockReversalService.reverseInvoiceStock(invoiceId, userId, tx);

      // 2. Update client balance (CREDIT invoices only)
      if (invoice.paymentType === 'CREDIT') {
        const currentBalance = parseFloat(invoice.client.balance.toString());
        const invoiceTotal = parseFloat(invoice.total.toString());
        const newBalance = Math.max(0, currentBalance - invoiceTotal);

        await tx.client.update({
          where: { id: invoice.clientId },
          data: { balance: new Prisma.Decimal(newBalance.toFixed(2)) },
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

      // 4. Log audit
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
