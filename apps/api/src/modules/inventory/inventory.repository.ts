import { Inventory, MovementType, ReferenceType } from '@prisma/client';
import { prisma, getTenantId } from '../../lib/prisma.js';

export class InventoryRepository {
  /**
   * Find inventory by product, variant (optional), warehouse, and batch
   */
  async findByProductAndWarehouse(
    productId: string,
    warehouseId: string,
    productVariantId?: string | null,
    batchNo?: string | null
  ): Promise<Inventory | null> {
    const inventory = await prisma.inventory.findFirst({
      where: {
        productId,
        warehouseId,
        productVariantId: productVariantId || null,
        batchNo: batchNo || null,
      },
    });
    return inventory;
  }

  /**
   * Create new inventory record
   */
  async create(data: {
    productId: string;
    productVariantId?: string | null;
    warehouseId: string;
    quantity: number;
    batchNo?: string | null;
    binLocation?: string | null;
  }): Promise<Inventory> {
    const inventory = await prisma.inventory.create({
      data: {
        tenantId: getTenantId(),
        productId: data.productId,
        productVariantId: data.productVariantId || null,
        warehouseId: data.warehouseId,
        quantity: data.quantity,
        batchNo: data.batchNo || null,
        binLocation: data.binLocation || null,
      },
    });
    return inventory;
  }

  /**
   * Update inventory quantity
   */
  async updateQuantity(id: string, quantity: number): Promise<Inventory> {
    const inventory = await prisma.inventory.update({
      where: { id },
      data: { quantity },
    });
    return inventory;
  }

  /**
   * Increment inventory quantity
   */
  async incrementQuantity(id: string, amount: number): Promise<Inventory> {
    const inventory = await prisma.inventory.update({
      where: { id },
      data: { quantity: { increment: amount } },
    });
    return inventory;
  }

  /**
   * Decrement inventory quantity
   */
  async decrementQuantity(id: string, amount: number): Promise<Inventory> {
    const inventory = await prisma.inventory.update({
      where: { id },
      data: { quantity: { decrement: amount } },
    });
    return inventory;
  }

  /**
   * Create stock movement record
   */
  async createStockMovement(data: {
    productId: string;
    productVariantId?: string | null;
    warehouseId: string;
    movementType: MovementType;
    quantity: number;
    referenceType?: ReferenceType | null;
    referenceId?: string | null;
    userId: string;
    notes?: string | null;
  }) {
    const movement = await prisma.stockMovement.create({
      data: {
        tenantId: getTenantId(),
        productId: data.productId,
        productVariantId: data.productVariantId || null,
        warehouseId: data.warehouseId,
        movementType: data.movementType,
        quantity: data.quantity,
        referenceType: data.referenceType || null,
        referenceId: data.referenceId || null,
        userId: data.userId,
        notes: data.notes || null,
      },
    });
    return movement;
  }

  /**
   * Get stock movements for a product
   */
  async getStockMovements(filters: {
    productId?: string;
    warehouseId?: string;
    referenceType?: ReferenceType;
    referenceId?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.productId) where.productId = filters.productId;
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.referenceType) where.referenceType = filters.referenceType;
    if (filters.referenceId) where.referenceId = filters.referenceId;

    if (filters.startDate || filters.endDate) {
      where.movementDate = {};
      if (filters.startDate) where.movementDate.gte = filters.startDate;
      if (filters.endDate) where.movementDate.lte = filters.endDate;
    }

    const movements = await prisma.stockMovement.findMany({
      where,
      orderBy: { movementDate: 'desc' },
      take: filters.limit || 100,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return movements;
  }
}
