import { PrismaClient } from '@prisma/client';
import { format } from 'date-fns';
import { AuditService } from '../../services/audit.service.js';
import logger from '../../lib/logger.js';

/**
 * Stock Reversal Service
 * Handles reversing inventory deductions when invoices are voided
 * Story 3.4: Invoice Voiding and Stock Reversal
 */
export class StockReversalService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate a unique batch number for reversed stock
   * Format: REVERSAL-YYYYMMDD-XXX
   */
  private generateReversalBatchNo(): string {
    const dateStr = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `REVERSAL-${dateStr}-${random}`;
  }

  /**
   * Reverse stock deductions for a voided invoice
   * @param invoiceId - ID of the invoice being voided
   * @param userId - ID of the user performing the void operation
   * @param tx - Prisma transaction client (must be used within a transaction)
   */
  async reverseInvoiceStock(
    invoiceId: string,
    userId: string,
    tx: any // Prisma transaction client
  ): Promise<void> {
    // Fetch the invoice with items
    const invoice = await tx.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
        warehouse: true,
      },
    });

    if (!invoice) {
      throw new Error('Invoice not found');
    }

    logger.info('Reversing stock for voided invoice', {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      itemCount: invoice.items.length,
    });

    // Process each invoice item
    for (const item of invoice.items) {
      // Try to find the original batch
      const originalBatch = await tx.inventory.findFirst({
        where: {
          productId: item.productId,
          productVariantId: item.productVariantId,
          warehouseId: invoice.warehouseId,
          batchNo: item.batchNo,
        },
      });

      if (originalBatch) {
        // Original batch exists - add quantity back to it
        await tx.inventory.update({
          where: { id: originalBatch.id },
          data: {
            quantity: {
              increment: item.quantity,
            },
          },
        });

        logger.info('Stock restored to original batch', {
          inventoryId: originalBatch.id,
          batchNo: originalBatch.batchNo,
          quantityAdded: item.quantity,
          newQuantity: originalBatch.quantity + item.quantity,
        });

        // Create stock movement for the restoration
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            productVariantId: item.productVariantId,
            warehouseId: invoice.warehouseId,
            movementType: 'ADJUSTMENT',
            quantity: item.quantity,
            referenceType: 'INVOICE',
            referenceId: invoiceId,
            userId,
            notes: `Stock reversed from voided invoice ${invoice.invoiceNumber} - Restored to batch ${item.batchNo || 'N/A'}`,
          },
        });
      } else {
        // Original batch doesn't exist - create new batch with REVERSAL prefix
        const reversalBatchNo = this.generateReversalBatchNo();

        await tx.inventory.create({
          data: {
            productId: item.productId,
            productVariantId: item.productVariantId,
            warehouseId: invoice.warehouseId,
            quantity: item.quantity,
            batchNo: reversalBatchNo,
            binLocation: null, // No bin location for reversed stock
          },
        });

        logger.info('Stock reversed to new REVERSAL batch', {
          batchNo: reversalBatchNo,
          originalBatchNo: item.batchNo,
          quantity: item.quantity,
          reason: 'Original batch no longer exists',
        });

        // Create stock movement for the new batch creation
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            productVariantId: item.productVariantId,
            warehouseId: invoice.warehouseId,
            movementType: 'ADJUSTMENT',
            quantity: item.quantity,
            referenceType: 'INVOICE',
            referenceId: invoiceId,
            userId,
            notes: `Stock reversed from voided invoice ${invoice.invoiceNumber} - New batch ${reversalBatchNo} created (original batch ${item.batchNo || 'N/A'} not found)`,
          },
        });
      }
    }

    // Audit log for stock reversal
    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'Inventory',
      entityId: invoiceId,
      changedFields: {
        operation: { old: null, new: 'STOCK_REVERSAL' },
        itemsReversed: { old: null, new: invoice.items.length },
      },
      notes: `Stock reversed for voided invoice ${invoice.invoiceNumber}. ${invoice.items.length} item(s) restored to inventory in warehouse ${invoice.warehouse?.name || invoice.warehouseId}.`,
    });

    logger.info('Stock reversal completed successfully', {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      itemsProcessed: invoice.items.length,
    });
  }
}
