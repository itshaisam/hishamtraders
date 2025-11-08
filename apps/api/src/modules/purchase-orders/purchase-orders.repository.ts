import { PrismaClient, PurchaseOrder, POItem, POStatus } from '@prisma/client';
import { PurchaseOrderFilters } from './dto/purchase-order-filter.dto';
import { CreatePurchaseOrderRequest, POItemInput } from './dto/create-purchase-order.dto';
import { UpdatePurchaseOrderRequest } from './dto/update-purchase-order.dto';

export class PurchaseOrderRepository {
  constructor(private prisma: PrismaClient) {}

  /**
   * Generate next PO number in format PO-YYYY-NNN
   */
  private async generatePONumber(): Promise<string> {
    const year = new Date().getFullYear();

    // Find the last PO number for this year
    const lastPO = await this.prisma.purchaseOrder.findFirst({
      where: {
        poNumber: {
          startsWith: `PO-${year}-`,
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    let nextNumber = 1;
    if (lastPO) {
      const match = lastPO.poNumber.match(/PO-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }

    return `PO-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  /**
   * Create a new purchase order with items
   */
  async create(
    data: CreatePurchaseOrderRequest,
    userId: string
  ): Promise<PurchaseOrder> {
    const poNumber = await this.generatePONumber();

    // Calculate total amount from items
    const totalAmount = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    );

    // Create PO and items in transaction
    const po = await this.prisma.$transaction(async (tx) => {
      const createdPO = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId: data.supplierId,
          orderDate: new Date(data.orderDate),
          expectedArrivalDate: data.expectedArrivalDate ? new Date(data.expectedArrivalDate) : null,
          status: 'PENDING' as POStatus,
          totalAmount: totalAmount,
          notes: data.notes,
        },
      });

      // Create line items
      await tx.pOItem.createMany({
        data: data.items.map((item) => ({
          poId: createdPO.id,
          productId: item.productId,
          quantity: item.quantity,
          unitCost: item.unitCost,
          totalCost: item.quantity * item.unitCost,
        })),
      });

      return createdPO;
    });

    return po;
  }

  /**
   * Find all purchase orders with pagination and filters
   */
  async findAll(filters?: PurchaseOrderFilters) {
    const {
      search = '',
      status,
      supplierId,
      page = 1,
      limit = 10,
      startDate,
      endDate,
    } = filters || {};

    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { poNumber: { contains: search } },
        { supplier: { name: { contains: search } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (supplierId) {
      where.supplierId = supplierId;
    }

    if (startDate || endDate) {
      where.orderDate = {};
      if (startDate) {
        where.orderDate.gte = new Date(startDate);
      }
      if (endDate) {
        where.orderDate.lte = new Date(endDate);
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: true,
          items: {
            include: {
              product: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Find a purchase order by ID with items
   */
  async findById(id: string) {
    return this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Find a purchase order by PO number
   */
  async findByPoNumber(poNumber: string) {
    return this.prisma.purchaseOrder.findUnique({
      where: { poNumber },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Update a purchase order
   */
  async update(
    id: string,
    data: UpdatePurchaseOrderRequest
  ): Promise<PurchaseOrder> {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: {
        expectedArrivalDate: data.expectedArrivalDate ? new Date(data.expectedArrivalDate) : undefined,
        status: data.status,
        notes: data.notes,
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Update only the status of a purchase order
   */
  async updateStatus(id: string, status: POStatus): Promise<PurchaseOrder> {
    return this.prisma.purchaseOrder.update({
      where: { id },
      data: { status },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
      },
    });
  }

  /**
   * Delete a purchase order (cascade delete items)
   */
  async delete(id: string): Promise<void> {
    await this.prisma.purchaseOrder.delete({
      where: { id },
    });
  }

  /**
   * Get PO statistics
   */
  async getStatistics() {
    const [totalPOs, pendingPOs, totalValue] = await Promise.all([
      this.prisma.purchaseOrder.count(),
      this.prisma.purchaseOrder.count({
        where: { status: 'PENDING' },
      }),
      this.prisma.purchaseOrder.aggregate({
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      totalPOs,
      pendingPOs,
      totalValue: totalValue._sum.totalAmount || 0,
    };
  }
}
