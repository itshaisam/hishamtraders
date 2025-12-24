import { PrismaClient } from '@prisma/client';
import logger from '../../lib/logger.js';
import { BadRequestError } from '../../utils/errors.js';

export interface BatchDeduction {
  inventoryId: string;
  batchNo: string | null;
  quantityDeducted: number;
}

export class FifoDeductionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check if sufficient stock is available for a product in a warehouse
   */
  async checkStockAvailability(
    productId: string,
    warehouseId: string,
    quantityNeeded: number,
    productVariantId?: string | null
  ): Promise<boolean> {
    const where: any = {
      productId,
      warehouseId,
      quantity: { gt: 0 },
      productVariantId: productVariantId || null, // Explicitly handle null/undefined
    };

    const totalAvailable = await this.prisma.inventory.aggregate({
      where,
      _sum: {
        quantity: true,
      },
    });

    const available = totalAvailable._sum.quantity || 0;
    return available >= quantityNeeded;
  }

  /**
   * Get available quantity for a product in a warehouse
   */
  async getAvailableQuantity(
    productId: string,
    warehouseId: string,
    productVariantId?: string | null
  ): Promise<number> {
    const where: any = {
      productId,
      warehouseId,
      quantity: { gt: 0 },
      productVariantId: productVariantId || null, // Explicitly handle null/undefined
    };

    logger.debug('FIFO getAvailableQuantity query:', {
      productId,
      warehouseId,
      productVariantId: productVariantId || null,
    });

    const totalAvailable = await this.prisma.inventory.aggregate({
      where,
      _sum: {
        quantity: true,
      },
    });

    logger.debug('FIFO getAvailableQuantity result:', {
      available: totalAvailable._sum.quantity || 0,
    });

    return totalAvailable._sum.quantity || 0;
  }

  /**
   * Deduct stock using FIFO (First In, First Out) logic
   * Returns array of batch deductions made
   *
   * @param productId - Product ID
   * @param warehouseId - Warehouse ID
   * @param quantityNeeded - Quantity to deduct
   * @param productVariantId - Optional product variant ID
   * @returns Array of batch deductions
   * @throws BadRequestError if insufficient stock
   */
  async deductStockFifo(
    productId: string,
    warehouseId: string,
    quantityNeeded: number,
    productVariantId?: string | null
  ): Promise<BatchDeduction[]> {
    // Get inventory records ordered by createdAt (FIFO - oldest first)
    const where: any = {
      productId,
      warehouseId,
      quantity: { gt: 0 },
      productVariantId: productVariantId || null, // Explicitly handle null/undefined
    };

    const inventoryRecords = await this.prisma.inventory.findMany({
      where,
      orderBy: { createdAt: 'asc' }, // FIFO: oldest batches first
    });

    if (inventoryRecords.length === 0) {
      throw new BadRequestError(`No stock available for product ${productId} in warehouse ${warehouseId}`);
    }

    // Calculate total available
    const totalAvailable = inventoryRecords.reduce((sum, record) => sum + record.quantity, 0);

    if (totalAvailable < quantityNeeded) {
      throw new BadRequestError(
        `Insufficient stock. Need ${quantityNeeded}, available: ${totalAvailable}`
      );
    }

    // Deduct from batches using FIFO logic
    let remainingQty = quantityNeeded;
    const deductions: BatchDeduction[] = [];

    for (const record of inventoryRecords) {
      if (remainingQty === 0) break;

      const qtyToDeduct = Math.min(remainingQty, record.quantity);

      deductions.push({
        inventoryId: record.id,
        batchNo: record.batchNo,
        quantityDeducted: qtyToDeduct,
      });

      remainingQty -= qtyToDeduct;

      logger.debug(`FIFO deduction: Batch ${record.batchNo || 'N/A'}, deducted ${qtyToDeduct}, remaining ${remainingQty}`);
    }

    if (remainingQty > 0) {
      // This should not happen if our availability check was correct
      throw new BadRequestError(
        `Failed to deduct full quantity. ${remainingQty} units remaining after processing all batches`
      );
    }

    return deductions;
  }

  /**
   * Apply FIFO deductions to inventory (updates database)
   * Should be called within a Prisma transaction
   *
   * @param deductions - Array of deductions to apply
   * @param tx - Prisma transaction client
   */
  async applyDeductions(
    deductions: BatchDeduction[],
    tx: any // Prisma transaction client
  ): Promise<void> {
    for (const deduction of deductions) {
      await tx.inventory.update({
        where: { id: deduction.inventoryId },
        data: {
          quantity: { decrement: deduction.quantityDeducted },
        },
      });

      logger.debug(`Applied deduction: ${deduction.quantityDeducted} units from batch ${deduction.batchNo || 'N/A'}`);
    }
  }
}
