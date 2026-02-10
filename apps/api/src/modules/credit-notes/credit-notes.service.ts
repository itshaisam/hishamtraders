import { PrismaClient, Prisma } from '@prisma/client';
import { format } from 'date-fns';
import { CreditNotesRepository, CreditNoteFilters } from './credit-notes.repository.js';
import { CreateCreditNoteDto } from './dto/create-credit-note.dto.js';
import { generateCreditNoteNumber } from '../../utils/credit-note-number.util.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { AuditService } from '../../services/audit.service.js';
import logger from '../../lib/logger.js';

export class CreditNotesService {
  private repository: CreditNotesRepository;

  constructor(private prisma: PrismaClient) {
    this.repository = new CreditNotesRepository(prisma);
  }

  /**
   * Create a credit note (sales return) in a transaction
   */
  async createCreditNote(dto: CreateCreditNoteDto, userId: string) {
    // 1. Fetch invoice with items, client, warehouse
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: dto.invoiceId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            productVariant: { select: { id: true, variantName: true, sku: true } },
          },
        },
        client: true,
        warehouse: true,
      },
    });

    if (!invoice) {
      throw new NotFoundError('Invoice not found');
    }

    // 2. Validate invoice status
    if (invoice.status !== 'PAID' && invoice.status !== 'PARTIAL') {
      throw new BadRequestError(
        `Cannot create return for invoice with status ${invoice.status}. Only PAID or PARTIAL invoices are eligible.`
      );
    }

    // 3. Validate each item and calculate totals
    const creditNoteItems: Array<{
      invoiceItemId: string;
      productId: string;
      productVariantId: string | null;
      batchNo: string | null;
      quantityReturned: number;
      unitPrice: number;
      discount: number;
      total: number;
    }> = [];

    for (const dtoItem of dto.items) {
      const invoiceItem = invoice.items.find((i) => i.id === dtoItem.invoiceItemId);
      if (!invoiceItem) {
        throw new BadRequestError(`Invoice item ${dtoItem.invoiceItemId} not found on this invoice`);
      }

      // Calculate already returned from non-voided credit notes
      const alreadyReturned = await this.prisma.creditNoteItem.aggregate({
        _sum: { quantityReturned: true },
        where: {
          invoiceItemId: dtoItem.invoiceItemId,
          creditNote: { status: { not: 'VOIDED' } },
        },
      });

      const returnedSoFar = alreadyReturned._sum.quantityReturned || 0;
      const maxReturnable = invoiceItem.quantity - returnedSoFar;

      if (dtoItem.quantityReturned > maxReturnable) {
        const productName =
          invoiceItem.productVariant?.variantName ||
          invoiceItem.product.name;
        throw new BadRequestError(
          `Cannot return ${dtoItem.quantityReturned} of "${productName}". Maximum returnable: ${maxReturnable} (original: ${invoiceItem.quantity}, already returned: ${returnedSoFar})`
        );
      }

      // Calculate line total respecting original discount %
      const unitPrice = Number(invoiceItem.unitPrice);
      const discount = Number(invoiceItem.discount);
      const lineSubtotal = dtoItem.quantityReturned * unitPrice;
      const discountAmount = lineSubtotal * (discount / 100);
      const lineTotal = lineSubtotal - discountAmount;

      creditNoteItems.push({
        invoiceItemId: dtoItem.invoiceItemId,
        productId: invoiceItem.productId,
        productVariantId: invoiceItem.productVariantId,
        batchNo: invoiceItem.batchNo,
        quantityReturned: dtoItem.quantityReturned,
        unitPrice,
        discount,
        total: lineTotal,
      });
    }

    // 4. Calculate totals
    const subtotal = creditNoteItems.reduce((sum, item) => sum + item.total, 0);
    const taxRate = Number(invoice.taxRate);
    const taxAmount = (subtotal * taxRate) / 100;
    const totalAmount = subtotal + taxAmount;

    // 5. Execute in transaction
    const creditNote = await this.prisma.$transaction(async (tx) => {
      // Generate credit note number
      const creditNoteNumber = await generateCreditNoteNumber(this.prisma);

      // Create CreditNote
      const cn = await tx.creditNote.create({
        data: {
          creditNoteNumber,
          invoiceId: dto.invoiceId,
          clientId: invoice.clientId,
          reason: dto.reason,
          subtotal: new Prisma.Decimal(subtotal.toFixed(2)),
          taxRate: new Prisma.Decimal(taxRate.toFixed(2)),
          taxAmount: new Prisma.Decimal(taxAmount.toFixed(2)),
          totalAmount: new Prisma.Decimal(totalAmount.toFixed(2)),
          createdBy: userId,
        },
      });

      // Create CreditNoteItems
      for (const item of creditNoteItems) {
        await tx.creditNoteItem.create({
          data: {
            creditNoteId: cn.id,
            invoiceItemId: item.invoiceItemId,
            productId: item.productId,
            productVariantId: item.productVariantId,
            batchNo: item.batchNo,
            quantityReturned: item.quantityReturned,
            unitPrice: new Prisma.Decimal(item.unitPrice.toFixed(2)),
            discount: new Prisma.Decimal(item.discount.toFixed(2)),
            total: new Prisma.Decimal(item.total.toFixed(2)),
          },
        });

        // Restock inventory: find original batch or create RETURN batch
        const originalBatch = await tx.inventory.findFirst({
          where: {
            productId: item.productId,
            productVariantId: item.productVariantId,
            warehouseId: invoice.warehouseId,
            batchNo: item.batchNo,
          },
        });

        if (originalBatch) {
          await tx.inventory.update({
            where: { id: originalBatch.id },
            data: { quantity: { increment: item.quantityReturned } },
          });
        } else {
          const returnBatchNo = `RETURN-${format(new Date(), 'yyyyMMdd')}-${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;
          await tx.inventory.create({
            data: {
              productId: item.productId,
              productVariantId: item.productVariantId,
              warehouseId: invoice.warehouseId,
              quantity: item.quantityReturned,
              batchNo: returnBatchNo,
            },
          });
        }

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            productVariantId: item.productVariantId,
            warehouseId: invoice.warehouseId,
            movementType: 'SALES_RETURN',
            quantity: item.quantityReturned,
            referenceType: 'CREDIT_NOTE',
            referenceId: cn.id,
            userId,
            notes: `Credit note ${creditNoteNumber} - Return from invoice ${invoice.invoiceNumber}`,
          },
        });
      }

      // Decrement client balance
      await tx.client.update({
        where: { id: invoice.clientId },
        data: {
          balance: { decrement: new Prisma.Decimal(totalAmount.toFixed(2)) },
        },
      });

      logger.info('Credit note created', {
        creditNoteId: cn.id,
        creditNoteNumber,
        invoiceNumber: invoice.invoiceNumber,
        totalAmount,
        itemCount: creditNoteItems.length,
      });

      return cn;
    });

    // Audit log (outside transaction)
    await AuditService.log({
      userId,
      action: 'CREATE',
      entityType: 'CreditNote',
      entityId: creditNote.id,
      changedFields: {
        invoiceId: { old: null, new: dto.invoiceId },
        totalAmount: { old: null, new: totalAmount },
        itemsReturned: { old: null, new: creditNoteItems.length },
      },
      notes: `Credit note ${creditNote.creditNoteNumber} created for invoice ${invoice.invoiceNumber}. Total: ${totalAmount}. Reason: ${dto.reason}`,
    });

    return this.repository.findById(creditNote.id);
  }

  async getCreditNotes(filters: CreditNoteFilters) {
    return this.repository.findAll(filters);
  }

  async getCreditNoteById(id: string) {
    const cn = await this.repository.findById(id);
    if (!cn) {
      throw new NotFoundError('Credit note not found');
    }
    return cn;
  }
}
