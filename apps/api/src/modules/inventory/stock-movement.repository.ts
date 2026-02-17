import { StockMovement, MovementType } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';

export interface StockMovementFilters {
  productId?: string;
  productVariantId?: string;
  warehouseId?: string;
  movementType?: MovementType;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  pageSize?: number;
}

export interface PaginatedStockMovements {
  movements: StockMovement[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export class StockMovementRepository {
  /**
   * Find all stock movements with optional filters and pagination
   */
  async findAll(filters: StockMovementFilters): Promise<PaginatedStockMovements> {
    const {
      productId,
      productVariantId,
      warehouseId,
      movementType,
      dateFrom,
      dateTo,
      page = 1,
      pageSize = 50,
    } = filters;

    // Build where clause
    const where: any = {};

    if (productId) {
      where.productId = productId;
    }

    if (productVariantId) {
      where.productVariantId = productVariantId;
    }

    if (warehouseId) {
      where.warehouseId = warehouseId;
    }

    if (movementType) {
      where.movementType = movementType;
    }

    if (dateFrom || dateTo) {
      where.movementDate = {};
      if (dateFrom) {
        where.movementDate.gte = dateFrom;
      }
      if (dateTo) {
        where.movementDate.lte = dateTo;
      }
    }

    // Get total count
    const total = await prisma.stockMovement.count({ where });

    // Get movements with pagination
    const movements = await prisma.stockMovement.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            sku: true,
          },
        },
        productVariant: {
          select: {
            id: true,
            variantName: true,
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
            email: true,
          },
        },
      },
      orderBy: {
        movementDate: 'asc', // Ascending for running balance calculation
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return {
      movements,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Get movements for a specific product (all warehouses)
   */
  async findByProduct(
    productId: string,
    productVariantId?: string | null
  ): Promise<StockMovement[]> {
    return prisma.stockMovement.findMany({
      where: {
        productId,
        productVariantId: productVariantId ?? undefined,
      },
      include: {
        product: true,
        productVariant: true,
        warehouse: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        movementDate: 'asc',
      },
    });
  }

  /**
   * Get movements for a specific warehouse
   */
  async findByWarehouse(warehouseId: string): Promise<StockMovement[]> {
    return prisma.stockMovement.findMany({
      where: {
        warehouseId,
      },
      include: {
        product: true,
        productVariant: true,
        warehouse: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        movementDate: 'asc',
      },
    });
  }

  /**
   * Get movements for a specific product in a specific warehouse
   */
  async findByProductAndWarehouse(
    productId: string,
    warehouseId: string,
    productVariantId?: string | null
  ): Promise<StockMovement[]> {
    return prisma.stockMovement.findMany({
      where: {
        productId,
        productVariantId: productVariantId ?? undefined,
        warehouseId,
      },
      include: {
        product: true,
        productVariant: true,
        warehouse: true,
        user: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: {
        movementDate: 'asc',
      },
    });
  }
}
