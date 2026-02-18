import { Prisma, TransferStatus } from '@prisma/client';
import { prisma, getTenantId } from '../../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { AuditService } from '../../services/audit.service.js';
import logger from '../../lib/logger.js';

interface CreateTransferDto {
  sourceWarehouseId: string;
  destinationWarehouseId: string;
  notes?: string;
  items: Array<{ productId: string; batchNo?: string; quantity: number; notes?: string }>;
}

interface TransferFilters {
  sourceWarehouseId?: string;
  destinationWarehouseId?: string;
  status?: TransferStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export class StockTransferService {

  private async generateTransferNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await prisma.stockTransfer.count({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
    });
    const seq = String(count + 1).padStart(3, '0');
    return `ST-${dateStr}-${seq}`;
  }

  async create(data: CreateTransferDto, userId: string) {
    if (data.sourceWarehouseId === data.destinationWarehouseId) {
      throw new BadRequestError('Source and destination warehouses must be different');
    }

    // Validate warehouses
    const [source, dest] = await Promise.all([
      prisma.warehouse.findUnique({ where: { id: data.sourceWarehouseId } }),
      prisma.warehouse.findUnique({ where: { id: data.destinationWarehouseId } }),
    ]);
    if (!source) throw new NotFoundError('Source warehouse not found');
    if (!dest) throw new NotFoundError('Destination warehouse not found');

    if (!data.items || data.items.length === 0) {
      throw new BadRequestError('At least one item is required');
    }

    // Validate products exist and quantities > 0
    for (const item of data.items) {
      if (item.quantity <= 0) throw new BadRequestError('Quantity must be positive');
      const product = await prisma.product.findUnique({ where: { id: item.productId } });
      if (!product) throw new NotFoundError(`Product ${item.productId} not found`);
    }

    const transferNumber = await this.generateTransferNumber();

    const created = await prisma.stockTransfer.create({
      data: {
        transferNumber,
        sourceWarehouseId: data.sourceWarehouseId,
        destinationWarehouseId: data.destinationWarehouseId,
        status: 'PENDING',
        requestedBy: userId,
        notes: data.notes?.trim() || null,
        tenantId: getTenantId(),
      },
    });

    await prisma.stockTransferItem.createMany({
      data: data.items.map((item: any) => ({
        stockTransferId: created.id,
        productId: item.productId,
        batchNo: item.batchNo || null,
        quantity: item.quantity,
        notes: item.notes?.trim() || null,
        tenantId: getTenantId(),
      })),
    });

    const transfer = (await prisma.stockTransfer.findUnique({
      where: { id: created.id },
      include: {
        sourceWarehouse: { select: { id: true, name: true } },
        destinationWarehouse: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    }))!;

    await AuditService.log({
      userId,
      action: 'CREATE',
      entityType: 'StockTransfer',
      entityId: transfer.id,
      notes: `Stock transfer ${transferNumber} created. ${data.items.length} items from ${source.name} to ${dest.name}`,
    });

    logger.info(`Stock transfer created: ${transferNumber}`, { id: transfer.id });
    return transfer;
  }

  async getAll(filters: TransferFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.StockTransferWhereInput = {};
    if (filters.sourceWarehouseId) where.sourceWarehouseId = filters.sourceWarehouseId;
    if (filters.destinationWarehouseId) where.destinationWarehouseId = filters.destinationWarehouseId;
    if (filters.status) where.status = filters.status;
    if (filters.search) where.transferNumber = { contains: filters.search };

    const [data, total] = await Promise.all([
      prisma.stockTransfer.findMany({
        where,
        include: {
          sourceWarehouse: { select: { id: true, name: true } },
          destinationWarehouse: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockTransfer.count({ where }),
    ]);

    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        sourceWarehouse: { select: { id: true, name: true } },
        destinationWarehouse: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });
    if (!transfer) throw new NotFoundError('Stock transfer not found');

    // Fetch dispatcher/completer names (no direct relation in schema)
    let dispatcherName: string | null = null;
    let completerName: string | null = null;
    if (transfer.dispatchedBy) {
      const user = await prisma.user.findUnique({ where: { id: transfer.dispatchedBy }, select: { name: true } });
      dispatcherName = user?.name || null;
    }
    if (transfer.completedBy) {
      const user = await prisma.user.findUnique({ where: { id: transfer.completedBy }, select: { name: true } });
      completerName = user?.name || null;
    }

    return { ...transfer, dispatcherName, completerName };
  }

  async approve(id: string, userId: string) {
    const transfer = await prisma.stockTransfer.findUnique({ where: { id } });
    if (!transfer) throw new NotFoundError('Stock transfer not found');
    if (transfer.status !== 'PENDING') throw new BadRequestError(`Cannot approve transfer with status ${transfer.status}`);

    const updated = await prisma.stockTransfer.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: userId },
      include: {
        sourceWarehouse: { select: { id: true, name: true } },
        destinationWarehouse: { select: { id: true, name: true } },
        requester: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'StockTransfer',
      entityId: id,
      changedFields: { status: { old: 'PENDING', new: 'APPROVED' } },
      notes: `Stock transfer ${transfer.transferNumber} approved`,
    });

    return updated;
  }

  async dispatch(id: string, userId: string) {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: { items: true, sourceWarehouse: true, destinationWarehouse: true },
    });
    if (!transfer) throw new NotFoundError('Stock transfer not found');
    if (transfer.status !== 'APPROVED') throw new BadRequestError(`Cannot dispatch transfer with status ${transfer.status}`);

    const updated = await prisma.$transaction(async (tx: any) => {
      // Deduct inventory from source warehouse
      for (const item of transfer.items) {
        const inventory = await tx.inventory.findFirst({
          where: {
            productId: item.productId,
            warehouseId: transfer.sourceWarehouseId,
            ...(item.batchNo ? { batchNo: item.batchNo } : {}),
          },
        });
        if (!inventory || inventory.quantity < item.quantity) {
          throw new BadRequestError(
            `Insufficient stock for product ${item.productId}. Available: ${inventory?.quantity || 0}, Required: ${item.quantity}`
          );
        }

        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { decrement: item.quantity } },
        });

        // Create TRANSFER stock movement (outbound)
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: transfer.sourceWarehouseId,
            movementType: 'TRANSFER',
            quantity: item.quantity,
            referenceType: 'TRANSFER',
            referenceId: transfer.id,
            userId,
            notes: `Transfer ${transfer.transferNumber} dispatched to ${transfer.destinationWarehouse.name}`,
            tenantId: getTenantId(),
          },
        });
      }

      return tx.stockTransfer.update({
        where: { id },
        data: { status: 'IN_TRANSIT', dispatchedBy: userId },
        include: {
          sourceWarehouse: { select: { id: true, name: true } },
          destinationWarehouse: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
      });
    });

    // Auto-create gate pass for the dispatch
    try {
      const { GatePassService } = await import('../gate-passes/gate-pass.service.js');
      const gatePassService = new GatePassService(prisma as any);
      await gatePassService.createGatePass({
        warehouseId: transfer.sourceWarehouseId,
        date: new Date(),
        purpose: 'TRANSFER' as any,
        referenceType: 'TRANSFER' as any,
        referenceId: transfer.id,
        notes: `Auto-created for stock transfer ${transfer.transferNumber}`,
        items: transfer.items.map((item) => ({
          productId: item.productId,
          batchNo: item.batchNo || undefined,
          quantity: item.quantity,
        })),
      }, userId);
    } catch (err) {
      logger.warn('Failed to auto-create gate pass for transfer', { transferId: id, error: (err as Error).message });
    }

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'StockTransfer',
      entityId: id,
      changedFields: { status: { old: 'APPROVED', new: 'IN_TRANSIT' } },
      notes: `Stock transfer ${transfer.transferNumber} dispatched`,
    });

    return updated;
  }

  async receive(id: string, receivedItems: Array<{ itemId: string; receivedQuantity: number }>, userId: string) {
    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: { items: true, destinationWarehouse: true },
    });
    if (!transfer) throw new NotFoundError('Stock transfer not found');
    if (transfer.status !== 'IN_TRANSIT') throw new BadRequestError(`Cannot receive transfer with status ${transfer.status}`);

    const updated = await prisma.$transaction(async (tx: any) => {
      for (const received of receivedItems) {
        const item = transfer.items.find((i) => i.id === received.itemId);
        if (!item) throw new BadRequestError(`Transfer item ${received.itemId} not found`);
        if (received.receivedQuantity < 0) throw new BadRequestError('Received quantity cannot be negative');
        if (received.receivedQuantity > item.quantity) throw new BadRequestError(`Received quantity cannot exceed sent quantity (${item.quantity})`);

        // Update received quantity on transfer item
        await tx.stockTransferItem.update({
          where: { id: received.itemId },
          data: { receivedQuantity: received.receivedQuantity },
        });

        // Add to destination warehouse inventory
        if (received.receivedQuantity > 0) {
          const existing = await tx.inventory.findFirst({
            where: {
              productId: item.productId,
              warehouseId: transfer.destinationWarehouseId,
              ...(item.batchNo ? { batchNo: item.batchNo } : {}),
            },
          });

          if (existing) {
            await tx.inventory.update({
              where: { id: existing.id },
              data: { quantity: { increment: received.receivedQuantity } },
            });
          } else {
            await tx.inventory.create({
              data: {
                productId: item.productId,
                warehouseId: transfer.destinationWarehouseId,
                batchNo: item.batchNo,
                quantity: received.receivedQuantity,
                tenantId: getTenantId(),
              },
            });
          }

          // Create RECEIPT stock movement (inbound)
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: transfer.destinationWarehouseId,
              movementType: 'RECEIPT',
              quantity: received.receivedQuantity,
              referenceType: 'TRANSFER',
              referenceId: transfer.id,
              userId,
              notes: `Transfer ${transfer.transferNumber} received`,
              tenantId: getTenantId(),
            },
          });
        }
      }

      return tx.stockTransfer.update({
        where: { id },
        data: { status: 'COMPLETED', completedBy: userId },
        include: {
          sourceWarehouse: { select: { id: true, name: true } },
          destinationWarehouse: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
      });
    });

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'StockTransfer',
      entityId: id,
      changedFields: { status: { old: 'IN_TRANSIT', new: 'COMPLETED' } },
      notes: `Stock transfer ${transfer.transferNumber} received/completed`,
    });

    return updated;
  }

  async cancel(id: string, reason: string, userId: string) {
    if (!reason || reason.trim().length < 5) throw new BadRequestError('Cancellation reason is required (minimum 5 characters)');

    const transfer = await prisma.stockTransfer.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!transfer) throw new NotFoundError('Stock transfer not found');
    if (transfer.status === 'COMPLETED' || transfer.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot cancel transfer with status ${transfer.status}`);
    }

    const oldStatus = transfer.status;

    const updated = await prisma.$transaction(async (tx: any) => {
      // If IN_TRANSIT, restore source warehouse inventory
      if (transfer.status === 'IN_TRANSIT') {
        for (const item of transfer.items) {
          const inventory = await tx.inventory.findFirst({
            where: {
              productId: item.productId,
              warehouseId: transfer.sourceWarehouseId,
              ...(item.batchNo ? { batchNo: item.batchNo } : {}),
            },
          });

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { quantity: { increment: item.quantity } },
            });
          } else {
            await tx.inventory.create({
              data: {
                productId: item.productId,
                warehouseId: transfer.sourceWarehouseId,
                batchNo: item.batchNo,
                quantity: item.quantity,
                tenantId: getTenantId(),
              },
            });
          }

          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: transfer.sourceWarehouseId,
              movementType: 'ADJUSTMENT',
              quantity: item.quantity,
              referenceType: 'TRANSFER',
              referenceId: transfer.id,
              userId,
              notes: `Transfer ${transfer.transferNumber} cancelled - stock restored`,
              tenantId: getTenantId(),
            },
          });
        }
      }

      return tx.stockTransfer.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          notes: transfer.notes
            ? `${transfer.notes}\nCancelled: ${reason.trim()}`
            : `Cancelled: ${reason.trim()}`,
        },
        include: {
          sourceWarehouse: { select: { id: true, name: true } },
          destinationWarehouse: { select: { id: true, name: true } },
          requester: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
      });
    });

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'StockTransfer',
      entityId: id,
      changedFields: { status: { old: oldStatus, new: 'CANCELLED' } },
      notes: `Stock transfer ${transfer.transferNumber} cancelled. Reason: ${reason}`,
    });

    return updated;
  }
}
