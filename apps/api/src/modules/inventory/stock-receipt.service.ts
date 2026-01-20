import { PrismaClient } from '@prisma/client';
import { InventoryRepository } from './inventory.repository.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import logger from '../../lib/logger.js';
import { format } from 'date-fns';

const prisma = new PrismaClient();

export interface ReceiveGoodsItem {
  productId: string;
  productVariantId?: string | null;
  quantity: number;
  binLocation?: string | null;
  batchNo?: string | null;
}

export interface ReceiveGoodsDto {
  warehouseId: string;
  receivedDate?: Date;
  items: ReceiveGoodsItem[];
}

export class StockReceiptService {
  private inventoryRepo: InventoryRepository;

  constructor() {
    this.inventoryRepo = new InventoryRepository();
  }

  /**
   * Generate batch number: YYYYMMDD-XXX
   */
  private generateBatchNo(): string {
    const date = new Date();
    const dateStr = format(date, 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `${dateStr}-${random}`;
  }

  /**
   * Check if PO can be received
   */
  async canReceivePO(poId: string): Promise<{ canReceive: boolean; reason?: string }> {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      select: {
        id: true,
        status: true,
        items: true,
      },
    });

    if (!po) {
      return { canReceive: false, reason: 'Purchase order not found' };
    }

    if (po.status === 'RECEIVED') {
      return { canReceive: false, reason: 'Purchase order already received' };
    }

    if (po.status === 'CANCELLED') {
      return { canReceive: false, reason: 'Purchase order is cancelled' };
    }

    if (!po.items || po.items.length === 0) {
      return { canReceive: false, reason: 'Purchase order has no items' };
    }

    return { canReceive: true };
  }

  /**
   * Receive goods from purchase order
   */
  async receiveGoods(
    poId: string,
    data: ReceiveGoodsDto,
    userId: string
  ): Promise<void> {
    logger.info('Receiving goods', { poId, warehouseId: data.warehouseId, userId });

    // Validate PO
    const canReceive = await this.canReceivePO(poId);
    if (!canReceive.canReceive) {
      throw new BadRequestError(canReceive.reason || 'Cannot receive this purchase order');
    }

    // Fetch PO with items
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: poId },
      include: {
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
      },
    });

    if (!po) {
      throw new NotFoundError('Purchase order not found');
    }

    // Use transaction for atomic operations
    await prisma.$transaction(async (tx) => {
      for (const item of data.items) {
        const batchNo = item.batchNo || this.generateBatchNo();

        // Find existing inventory
        const existing = await this.inventoryRepo.findByProductAndWarehouse(
          item.productId,
          data.warehouseId,
          item.productVariantId,
          batchNo
        );

        if (existing) {
          // Update existing inventory
          await tx.inventory.update({
            where: { id: existing.id },
            data: {
              quantity: existing.quantity + item.quantity,
            },
          });

          logger.info('Updated inventory', {
            inventoryId: existing.id,
            oldQuantity: existing.quantity,
            newQuantity: existing.quantity + item.quantity,
          });
        } else {
          // Create new inventory record
          await tx.inventory.create({
            data: {
              productId: item.productId,
              productVariantId: item.productVariantId || null,
              warehouseId: data.warehouseId,
              quantity: item.quantity,
              batchNo,
              binLocation: item.binLocation || null,
            },
          });

          logger.info('Created new inventory', {
            productId: item.productId,
            warehouseId: data.warehouseId,
            quantity: item.quantity,
          });
        }

        // Create stock movement record
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            productVariantId: item.productVariantId || null,
            warehouseId: data.warehouseId,
            movementType: 'RECEIPT',
            quantity: item.quantity,
            referenceType: 'PO',
            referenceId: poId,
            userId,
            movementDate: data.receivedDate || new Date(),
            notes: `Received from PO ${po.poNumber}`,
          },
        });

        logger.info('Created stock movement', {
          productId: item.productId,
          quantity: item.quantity,
          poId,
        });
      }

      // Update PO status to RECEIVED
      await tx.purchaseOrder.update({
        where: { id: poId },
        data: {
          status: 'RECEIVED',
          updatedBy: userId,
        },
      });

      logger.info('Updated PO status to RECEIVED', { poId });
    });

    logger.info('Goods received successfully', { poId });
  }
}
