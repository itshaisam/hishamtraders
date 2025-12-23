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

export interface BatchDetail {
  batchNo: string;
  quantity: number;
  binLocation: string | null;
  createdAt: Date;
}

export interface GroupedInventoryItem {
  id: string;
  product: {
    id: string;
    sku: string;
    name: string;
    reorderLevel: number;
  };
  productVariant: {
    id: string;
    sku: string;
    variantName: string;
  } | null;
  warehouse: {
    id: string;
    name: string;
    city: string | null;
  };
  totalQuantity: number;
  status: StockStatus;
  batches: BatchDetail[];
  lastUpdated: Date;
}

export interface GroupedInventoryResponse {
  data: GroupedInventoryItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
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
      const searchLower = search.toLowerCase();
      where.OR = [
        { product: { sku: { contains: searchLower } } },
        { product: { name: { contains: searchLower } } },
        { productVariant: { sku: { contains: searchLower } } },
        { productVariant: { variantName: { contains: searchLower } } },
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

  /**
   * Get inventory grouped by product and warehouse with expandable batch details
   */
  async getAllGrouped(filters: InventoryFilters = {}): Promise<GroupedInventoryResponse> {
    const { productId, warehouseId, status, search, page = 1, limit = 50 } = filters;

    // Build where clause
    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        { product: { sku: { contains: searchLower } } },
        { product: { name: { contains: searchLower } } },
        { productVariant: { sku: { contains: searchLower } } },
        { productVariant: { variantName: { contains: searchLower } } },
      ];
    }

    // Get all inventory items matching filters
    const allItems = await prisma.inventory.findMany({
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
      orderBy: [{ warehouse: { name: 'asc' } }, { product: { name: 'asc' } }],
    });

    // Group by productId + productVariantId + warehouseId
    const groupedMap = new Map<string, GroupedInventoryItem>();

    for (const item of allItems) {
      const groupKey = `${item.productId}-${item.productVariantId || 'null'}-${item.warehouseId}`;

      if (!groupedMap.has(groupKey)) {
        groupedMap.set(groupKey, {
          id: groupKey,
          product: item.product,
          productVariant: item.productVariant,
          warehouse: item.warehouse,
          totalQuantity: 0,
          status: 'IN_STOCK' as StockStatus,
          batches: [],
          lastUpdated: item.updatedAt,
        });
      }

      const group = groupedMap.get(groupKey)!;
      group.totalQuantity += item.quantity;
      group.batches.push({
        batchNo: item.batchNo || 'N/A',
        quantity: item.quantity,
        binLocation: item.binLocation,
        createdAt: item.createdAt,
      });

      // Update last updated if this item is newer
      if (item.updatedAt > group.lastUpdated) {
        group.lastUpdated = item.updatedAt;
      }
    }

    // Convert map to array
    let groupedItems = Array.from(groupedMap.values());

    // Calculate stock status for each group based on total quantity
    groupedItems = groupedItems.map((item) => ({
      ...item,
      status: this.calculateStockStatus(item.totalQuantity, item.product.reorderLevel),
    }));

    // Filter by status if requested
    if (status) {
      groupedItems = groupedItems.filter((item) => item.status === status);
    }

    // Pagination
    const total = groupedItems.length;
    const skip = (page - 1) * limit;
    const paginatedItems = groupedItems.slice(skip, skip + limit);

    return {
      data: paginatedItems,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
