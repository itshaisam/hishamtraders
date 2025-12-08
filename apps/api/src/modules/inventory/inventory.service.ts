import { PrismaClient } from '@prisma/client';
import { InventoryRepository } from './inventory.repository';

const prisma = new PrismaClient();

export type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

export interface InventoryFilters {
  productId?: string;
  warehouseId?: string;
  status?: StockStatus;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InventoryItemWithStatus {
  id: string;
  productId: string;
  productVariantId: string | null;
  warehouseId: string;
  quantity: number;
  batchNo: string | null;
  binLocation: string | null;
  createdAt: Date;
  updatedAt: Date;
  product: {
    id: string;
    sku: string;
    name: string;
    reorderLevel: number;
  };
  productVariant?: {
    id: string;
    sku: string;
    variantName: string;
  } | null;
  warehouse: {
    id: string;
    name: string;
    city: string | null;
  };
  status: StockStatus;
}

export class InventoryService {
  private inventoryRepo: InventoryRepository;

  constructor() {
    this.inventoryRepo = new InventoryRepository();
  }

  /**
   * Calculate stock status based on quantity and reorder level
   */
  calculateStockStatus(quantity: number, reorderLevel: number): StockStatus {
    if (quantity === 0) return 'OUT_OF_STOCK';
    if (quantity <= reorderLevel) return 'LOW_STOCK';
    return 'IN_STOCK';
  }

  /**
   * Get all inventory with filters and pagination
   */
  async getAll(filters: InventoryFilters = {}) {
    const { productId, warehouseId, status, search, page = 1, limit = 50 } = filters;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (search) {
      where.OR = [
        { product: { sku: { contains: search, mode: 'insensitive' } } },
        { product: { name: { contains: search, mode: 'insensitive' } } },
        { productVariant: { sku: { contains: search, mode: 'insensitive' } } },
        { productVariant: { variantName: { contains: search, mode: 'insensitive' } } },
      ];
    }

    // Get inventory items
    const [items, total] = await Promise.all([
      prisma.inventory.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true,
              reorderLevel: true,
            },
          },
          productVariant: {
            select: {
              id: true,
              sku: true,
              variantName: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
              city: true,
            },
          },
        },
        skip,
        take: limit,
        orderBy: [{ warehouse: { name: 'asc' } }, { product: { name: 'asc' } }],
      }),
      prisma.inventory.count({ where }),
    ]);

    // Add status to each item and filter by status if needed
    let itemsWithStatus: InventoryItemWithStatus[] = items.map((item) => ({
      ...item,
      status: this.calculateStockStatus(item.quantity, item.product.reorderLevel),
    }));

    // Filter by status if provided
    if (status) {
      itemsWithStatus = itemsWithStatus.filter((item) => item.status === status);
    }

    return {
      data: itemsWithStatus,
      pagination: {
        total: status ? itemsWithStatus.length : total,
        page,
        limit,
        totalPages: Math.ceil((status ? itemsWithStatus.length : total) / limit),
      },
    };
  }

  /**
   * Get inventory for a specific product across all warehouses
   */
  async getByProduct(productId: string) {
    const items = await prisma.inventory.findMany({
      where: { productId },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            reorderLevel: true,
          },
        },
        productVariant: {
          select: {
            id: true,
            sku: true,
            variantName: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: { warehouse: { name: 'asc' } },
    });

    const itemsWithStatus: InventoryItemWithStatus[] = items.map((item) => ({
      ...item,
      status: this.calculateStockStatus(item.quantity, item.product.reorderLevel),
    }));

    return itemsWithStatus;
  }

  /**
   * Get all inventory in a specific warehouse
   */
  async getByWarehouse(warehouseId: string) {
    const items = await prisma.inventory.findMany({
      where: { warehouseId },
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            reorderLevel: true,
          },
        },
        productVariant: {
          select: {
            id: true,
            sku: true,
            variantName: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: { product: { name: 'asc' } },
    });

    const itemsWithStatus: InventoryItemWithStatus[] = items.map((item) => ({
      ...item,
      status: this.calculateStockStatus(item.quantity, item.product.reorderLevel),
    }));

    return itemsWithStatus;
  }

  /**
   * Get all low stock items (quantity <= reorderLevel)
   */
  async getLowStock() {
    const items = await prisma.inventory.findMany({
      include: {
        product: {
          select: {
            id: true,
            sku: true,
            name: true,
            reorderLevel: true,
          },
        },
        productVariant: {
          select: {
            id: true,
            sku: true,
            variantName: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
            city: true,
          },
        },
      },
      orderBy: [{ quantity: 'asc' }, { product: { name: 'asc' } }],
    });

    // Filter items where quantity <= reorderLevel
    const lowStockItems: InventoryItemWithStatus[] = items
      .map((item) => ({
        ...item,
        status: this.calculateStockStatus(item.quantity, item.product.reorderLevel),
      }))
      .filter((item) => item.status === 'LOW_STOCK' || item.status === 'OUT_OF_STOCK');

    return lowStockItems;
  }

  /**
   * Get total quantity for a product across all warehouses
   */
  async getTotalQuantity(productId: string, productVariantId?: string | null): Promise<number> {
    const where: any = { productId };
    if (productVariantId !== undefined) {
      where.productVariantId = productVariantId;
    }

    const result = await prisma.inventory.aggregate({
      where,
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity || 0;
  }

  /**
   * Get available quantity for a product in a specific warehouse
   */
  async getAvailableQuantity(
    productId: string,
    warehouseId: string,
    productVariantId?: string | null
  ): Promise<number> {
    const where: any = { productId, warehouseId };
    if (productVariantId !== undefined) {
      where.productVariantId = productVariantId;
    }

    const result = await prisma.inventory.aggregate({
      where,
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity || 0;
  }
}
