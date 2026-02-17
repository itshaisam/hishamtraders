import { Prisma, CountStatus } from '@prisma/client';
import { prisma, getTenantId } from '../../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';
import { AuditService } from '../../services/audit.service.js';
import logger from '../../lib/logger.js';

interface CreateCountDto {
  warehouseId: string;
  countDate: string;
  notes?: string;
}

interface CountFilters {
  warehouseId?: string;
  status?: CountStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export class StockCountService {

  private async generateCountNumber(): Promise<string> {
    const today = new Date();
    const dateStr = today.toISOString().slice(0, 10).replace(/-/g, '');
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);
    const count = await prisma.stockCount.count({
      where: { createdAt: { gte: startOfDay, lte: endOfDay } },
    });
    return `SC-${dateStr}-${String(count + 1).padStart(3, '0')}`;
  }

  async create(data: CreateCountDto, userId: string) {
    const warehouse = await prisma.warehouse.findUnique({ where: { id: data.warehouseId } });
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    // Get current inventory for this warehouse
    const inventoryItems = await prisma.inventory.findMany({
      where: { warehouseId: data.warehouseId, quantity: { gt: 0 } },
      include: { product: { select: { id: true, name: true, sku: true } } },
    });

    if (inventoryItems.length === 0) {
      throw new BadRequestError('No inventory items found in this warehouse');
    }

    const countNumber = await this.generateCountNumber();

    const stockCount = await (prisma.stockCount as any).create({
      data: {
        countNumber,
        warehouseId: data.warehouseId,
        status: 'PLANNED',
        countDate: new Date(data.countDate),
        notes: data.notes?.trim() || null,
        createdBy: userId,
        tenantId: getTenantId(),
        items: {
          create: inventoryItems.map((inv: any) => ({
            productId: inv.productId,
            batchNo: inv.batchNo,
            binLocation: inv.binLocation,
            systemQuantity: inv.quantity,
            tenantId: getTenantId(),
          })),
        },
      },
      include: {
        warehouse: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });

    await AuditService.log({
      userId, action: 'CREATE', entityType: 'StockCount', entityId: stockCount.id,
      notes: `Stock count ${countNumber} created for ${warehouse.name}. ${inventoryItems.length} items.`,
    });

    logger.info(`Stock count created: ${countNumber}`, { id: stockCount.id });
    return stockCount;
  }

  async getAll(filters: CountFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.StockCountWhereInput = {};
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.status) where.status = filters.status;
    if (filters.search) where.countNumber = { contains: filters.search };

    const [data, total] = await Promise.all([
      prisma.stockCount.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.stockCount.count({ where }),
    ]);

    return { data, pagination: { total, page, limit, totalPages: Math.ceil(total / limit) } };
  }

  async getById(id: string) {
    const stockCount = await prisma.stockCount.findUnique({
      where: { id },
      include: {
        warehouse: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        items: {
          include: { product: { select: { id: true, name: true, sku: true } } },
          orderBy: { createdAt: 'asc' },
        },
      },
    });
    if (!stockCount) throw new NotFoundError('Stock count not found');
    return stockCount;
  }

  async startCount(id: string, userId: string) {
    const stockCount = await prisma.stockCount.findUnique({ where: { id } });
    if (!stockCount) throw new NotFoundError('Stock count not found');
    if (stockCount.status !== 'PLANNED') throw new BadRequestError(`Cannot start count with status ${stockCount.status}`);

    const updated = await prisma.stockCount.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
      include: {
        warehouse: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });

    await AuditService.log({
      userId, action: 'UPDATE', entityType: 'StockCount', entityId: id,
      changedFields: { status: { old: 'PLANNED', new: 'IN_PROGRESS' } },
      notes: `Stock count ${stockCount.countNumber} started`,
    });

    return updated;
  }

  async updateItems(id: string, items: Array<{ itemId: string; countedQuantity: number; notes?: string }>, userId: string) {
    const stockCount = await prisma.stockCount.findUnique({ where: { id } });
    if (!stockCount) throw new NotFoundError('Stock count not found');
    if (stockCount.status !== 'IN_PROGRESS') throw new BadRequestError('Can only update items during an in-progress count');

    for (const item of items) {
      if (item.countedQuantity < 0) throw new BadRequestError('Counted quantity cannot be negative');

      const existing = await prisma.stockCountItem.findFirst({
        where: { id: item.itemId, stockCountId: id },
      });
      if (!existing) throw new BadRequestError(`Count item ${item.itemId} not found`);

      await prisma.stockCountItem.update({
        where: { id: item.itemId },
        data: {
          countedQuantity: item.countedQuantity,
          variance: item.countedQuantity - existing.systemQuantity,
          notes: item.notes?.trim() || null,
        },
      });
    }

    return this.getById(id);
  }

  async complete(id: string, userId: string) {
    const stockCount = await prisma.stockCount.findUnique({
      where: { id },
      include: { items: { include: { product: { select: { id: true, name: true } } } } },
    });
    if (!stockCount) throw new NotFoundError('Stock count not found');
    if (stockCount.status !== 'IN_PROGRESS') throw new BadRequestError(`Cannot complete count with status ${stockCount.status}`);

    // Check all items have been counted
    const uncounted = stockCount.items.filter((i) => i.countedQuantity === null);
    if (uncounted.length > 0) {
      throw new BadRequestError(`${uncounted.length} items have not been counted yet`);
    }

    const updated = await prisma.$transaction(async (tx: any) => {
      // Create stock adjustments for items with variance
      const itemsWithVariance = stockCount.items.filter((i: any) => i.variance !== null && i.variance !== 0);

      for (const item of itemsWithVariance) {
        await tx.stockAdjustment.create({
          data: {
            productId: item.productId,
            warehouseId: stockCount.warehouseId,
            adjustmentType: 'CORRECTION',
            quantity: item.variance!,
            reason: `Physical stock count ${stockCount.countNumber}: system=${item.systemQuantity}, counted=${item.countedQuantity}`,
            notes: item.notes,
            status: 'PENDING',
            createdBy: userId,
            tenantId: getTenantId(),
          },
        });
      }

      return tx.stockCount.update({
        where: { id },
        data: { status: 'COMPLETED', completedBy: userId },
        include: {
          warehouse: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        },
      });
    });

    await AuditService.log({
      userId, action: 'UPDATE', entityType: 'StockCount', entityId: id,
      changedFields: { status: { old: 'IN_PROGRESS', new: 'COMPLETED' } },
      notes: `Stock count ${stockCount.countNumber} completed. Adjustments created for items with variances.`,
    });

    return updated;
  }

  async cancel(id: string, userId: string) {
    const stockCount = await prisma.stockCount.findUnique({ where: { id } });
    if (!stockCount) throw new NotFoundError('Stock count not found');
    if (stockCount.status === 'COMPLETED' || stockCount.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot cancel count with status ${stockCount.status}`);
    }

    const oldStatus = stockCount.status;
    const updated = await prisma.stockCount.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        warehouse: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true } },
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
      },
    });

    await AuditService.log({
      userId, action: 'UPDATE', entityType: 'StockCount', entityId: id,
      changedFields: { status: { old: oldStatus, new: 'CANCELLED' } },
      notes: `Stock count ${stockCount.countNumber} cancelled`,
    });

    return updated;
  }
}
