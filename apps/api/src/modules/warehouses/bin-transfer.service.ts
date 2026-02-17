import { prisma, getTenantId } from '../../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { AuditService } from '../../services/audit.service.js';
import logger from '../../lib/logger.js';

interface BinTransferDto {
  productId: string;
  batchNo?: string;
  sourceBin: string;
  destinationBin: string;
  quantity: number;
}

export class BinTransferService {
  async transfer(warehouseId: string, data: BinTransferDto, userId: string) {
    // Validate warehouse
    const warehouse = await prisma.warehouse.findUnique({ where: { id: warehouseId } });
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    // Validate product
    const product = await prisma.product.findUnique({ where: { id: data.productId }, select: { id: true, name: true } });
    if (!product) throw new NotFoundError('Product not found');

    if (data.quantity <= 0) throw new BadRequestError('Quantity must be positive');
    if (data.sourceBin === data.destinationBin) throw new BadRequestError('Source and destination bins must be different');

    // Find source inventory record
    const sourceInventory = await prisma.inventory.findFirst({
      where: {
        productId: data.productId,
        warehouseId,
        binLocation: data.sourceBin,
        ...(data.batchNo ? { batchNo: data.batchNo } : {}),
      },
    });

    if (!sourceInventory || sourceInventory.quantity < data.quantity) {
      throw new BadRequestError(
        `Insufficient stock in bin ${data.sourceBin}. Available: ${sourceInventory?.quantity || 0}, Required: ${data.quantity}`
      );
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // Deduct from source bin
      await tx.inventory.update({
        where: { id: sourceInventory.id },
        data: { quantity: { decrement: data.quantity } },
      });

      // Add to destination bin (find or create)
      const destInventory = await tx.inventory.findFirst({
        where: {
          productId: data.productId,
          warehouseId,
          binLocation: data.destinationBin,
          ...(data.batchNo ? { batchNo: data.batchNo } : {}),
        },
      });

      if (destInventory) {
        await tx.inventory.update({
          where: { id: destInventory.id },
          data: { quantity: { increment: data.quantity } },
        });
      } else {
        await tx.inventory.create({
          data: {
            tenantId: getTenantId(),
            productId: data.productId,
            warehouseId,
            batchNo: data.batchNo || null,
            binLocation: data.destinationBin,
            quantity: data.quantity,
          },
        });
      }

      // Create stock movement record
      await tx.stockMovement.create({
        data: {
          tenantId: getTenantId(),
          productId: data.productId,
          warehouseId,
          movementType: 'ADJUSTMENT',
          quantity: data.quantity,
          referenceType: 'ADJUSTMENT',
          referenceId: null,
          userId,
          notes: `Bin transfer: ${data.sourceBin} → ${data.destinationBin} (${data.quantity} units)`,
        },
      });

      return { sourceBin: data.sourceBin, destinationBin: data.destinationBin, quantity: data.quantity };
    });

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'Inventory',
      entityId: sourceInventory.id,
      notes: `Bin transfer: ${product.name} moved ${data.quantity} units from ${data.sourceBin} to ${data.destinationBin} in ${warehouse.name}`,
    });

    logger.info('Bin transfer completed', { warehouseId, productId: data.productId, ...result });
    return result;
  }
}
