import {
  PrismaClient,
  StockAdjustment,
  AdjustmentType,
  AdjustmentStatus,
} from '@prisma/client';

const prisma = new PrismaClient();

export class StockAdjustmentRepository {
  /**
   * Create a new stock adjustment
   */
  async create(data: {
    productId: string;
    productVariantId?: string | null;
    warehouseId: string;
    adjustmentType: AdjustmentType;
    quantity: number;
    reason: string;
    notes?: string | null;
    createdBy: string;
  }): Promise<StockAdjustment> {
    const adjustment = await prisma.stockAdjustment.create({
      data: {
        productId: data.productId,
        productVariantId: data.productVariantId || null,
        warehouseId: data.warehouseId,
        adjustmentType: data.adjustmentType,
        quantity: data.quantity,
        reason: data.reason,
        notes: data.notes || null,
        status: 'PENDING',
        createdBy: data.createdBy,
      },
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
            sku: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
    return adjustment;
  }

  /**
   * Find adjustment by ID
   */
  async findById(id: string): Promise<StockAdjustment | null> {
    const adjustment = await prisma.stockAdjustment.findUnique({
      where: { id },
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
            sku: true,
          },
        },
        warehouse: {
          select: {
            id: true,
            name: true,
          },
        },
        creator: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        stockMovement: true,
      },
    });
    return adjustment;
  }

  /**
   * Find all adjustments with filters
   */
  async findAll(filters: {
    productId?: string;
    warehouseId?: string;
    status?: AdjustmentStatus;
    createdBy?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.productId) where.productId = filters.productId;
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.status) where.status = filters.status;
    if (filters.createdBy) where.createdBy = filters.createdBy;

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) where.createdAt.gte = filters.startDate;
      if (filters.endDate) where.createdAt.lte = filters.endDate;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
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
              sku: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.stockAdjustment.count({ where }),
    ]);

    return {
      data: adjustments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find pending adjustments (for admin approval queue)
   */
  async findPendingAdjustments(filters: {
    warehouseId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = { status: 'PENDING' };
    if (filters.warehouseId) where.warehouseId = filters.warehouseId;

    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const [adjustments, total] = await Promise.all([
      prisma.stockAdjustment.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'asc' }, // Oldest first for FIFO approval
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
              sku: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.stockAdjustment.count({ where }),
    ]);

    return {
      data: adjustments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update adjustment status to APPROVED with reviewer info and stock movement link
   */
  async approve(
    id: string,
    reviewedBy: string,
    stockMovementId: string
  ): Promise<StockAdjustment> {
    const adjustment = await prisma.stockAdjustment.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy,
        reviewedAt: new Date(),
        stockMovementId,
      },
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
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return adjustment;
  }

  /**
   * Update adjustment status to REJECTED with reason
   */
  async reject(
    id: string,
    reviewedBy: string,
    rejectionReason: string
  ): Promise<StockAdjustment> {
    const adjustment = await prisma.stockAdjustment.update({
      where: { id },
      data: {
        status: 'REJECTED',
        reviewedBy,
        reviewedAt: new Date(),
        rejectionReason,
      },
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
        creator: {
          select: {
            id: true,
            name: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
    return adjustment;
  }
}
