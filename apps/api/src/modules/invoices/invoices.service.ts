import { PrismaClient, Prisma } from '@prisma/client';
import { addDays } from 'date-fns';
import { InvoicesRepository } from './invoices.repository.js';
import { SettingsService } from '../settings/settings.service.js';
import { FifoDeductionService } from '../inventory/fifo-deduction.service.js';
import { CreateInvoiceDto, validateCreateInvoice } from './dto/create-invoice.dto.js';
import { InvoiceFilterDto } from './dto/invoice-filter.dto.js';
import { generateInvoiceNumber } from '../../utils/invoice-number.util.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import logger from '../../lib/logger.js';

export class InvoicesService {
  private repository: InvoicesRepository;
  private settingsService: SettingsService;
  private fifoService: FifoDeductionService;

  constructor(private prisma: PrismaClient) {
    this.repository = new InvoicesRepository(prisma);
    this.settingsService = new SettingsService(prisma);
    this.fifoService = new FifoDeductionService(prisma);
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

    // 5. Get tax rate from settings
    const taxRate = await this.settingsService.getTaxRate();

    // 6. Validate and calculate line item totals
    const itemsWithTotals = await this.calculateLineItemTotals(data.items);

    // 7. Calculate invoice totals
    const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
    const taxAmount = (subtotal * taxRate) / 100;
    const total = subtotal + taxAmount;

    // 8. Check stock availability for all items
    await this.validateStockAvailability(data.items, data.warehouseId);

    // 9. Credit limit check for CREDIT sales
    if (data.paymentType === 'CREDIT') {
      await this.validateCreditLimit(client, total, data.adminOverride);
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
   * Validate credit limit
   */
  private async validateCreditLimit(
    client: any,
    invoiceTotal: number,
    adminOverride: boolean = false
  ) {
    const newBalance = Number(client.balance) + invoiceTotal;
    const creditLimit = Number(client.creditLimit);
    const utilization = (newBalance / creditLimit) * 100;

    if (utilization > 100 && !adminOverride) {
      throw new BadRequestError(
        `Credit limit exceeded. Current balance: ${client.balance}, Invoice total: ${invoiceTotal}, Credit limit: ${creditLimit}. Admin override required.`
      );
    }

    if (utilization > 80 && utilization <= 100) {
      logger.warn('Client approaching credit limit', {
        clientId: client.id,
        utilization: utilization.toFixed(2) + '%',
      });
    }

    if (adminOverride) {
      logger.warn('Credit limit override used', {
        clientId: client.id,
        utilization: utilization.toFixed(2) + '%',
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
}
