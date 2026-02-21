import { PurchaseOrder, POItem, POStatus, POCost } from '@prisma/client';
import { PurchaseOrderFilters } from './dto/purchase-order-filter.dto.js';
import { CreatePurchaseOrderRequest, POItemInput } from './dto/create-purchase-order.dto.js';
import { UpdatePurchaseOrderRequest } from './dto/update-purchase-order.dto.js';
import { AddPOCostRequest } from './dto/add-po-cost.dto.js';
import { UpdateImportDetailsRequest } from './dto/update-import-details.dto.js';
import { SettingsService } from '../settings/settings.service.js';

export class PurchaseOrderRepository {
  private settingsService: SettingsService;

  constructor(private prisma: any) {
    this.settingsService = new SettingsService(prisma);
  }

  /**
   * Transform Prisma Decimal values to numbers for JSON serialization
   * Prevents Decimal.toJSON() from converting to string
   */
  private transformDecimals(po: any) {
    return {
      ...po,
      taxRate: po.taxRate != null ? Number(po.taxRate) : 0,
      taxAmount: po.taxAmount != null ? Number(po.taxAmount) : 0,
      totalAmount: typeof po.totalAmount === 'number' ? po.totalAmount : Number(po.totalAmount),
      items: po.items?.map((item: any) => ({
        ...item,
        unitCost: typeof item.unitCost === 'number' ? item.unitCost : Number(item.unitCost),
        totalCost: typeof item.totalCost === 'number' ? item.totalCost : Number(item.totalCost),
        receivedQuantity: item.receivedQuantity ?? 0,
      })) || [],
    };
  }

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

    // Calculate subtotal from items
    const subtotal = data.items.reduce(
      (sum, item) => sum + item.quantity * item.unitCost,
      0
    );

    // Fetch tax rate from settings
    const taxRate = await this.settingsService.getTaxRate();
    const taxAmount = Math.round(subtotal * taxRate / 100 * 10000) / 10000;
    const totalAmount = subtotal + taxAmount;

    // Create PO and items in transaction
    const po = await this.prisma.$transaction(async (tx: any) => {
      const createdPO = await tx.purchaseOrder.create({
        data: {
          poNumber,
          supplierId: data.supplierId,
          orderDate: new Date(data.orderDate),
          expectedArrivalDate: data.expectedArrivalDate ? new Date(data.expectedArrivalDate) : null,
          status: 'PENDING' as POStatus,
          taxRate,
          taxAmount,
          totalAmount,
          notes: data.notes,
        },
      });

      // Create line items
      await tx.pOItem.createMany({
        data: data.items.map((item) => ({
          poId: createdPO.id,
          productId: item.productId,
          productVariantId: item.productVariantId || null,
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
      data: data.map((po: any) => this.transformDecimals(po)),
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
    const po = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
            productVariant: true,
          },
        },
        costs: true,
        goodsReceiveNotes: {
          include: {
            warehouse: { select: { id: true, name: true } },
            creator: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });
    return po ? this.transformDecimals(po) : null;
  }

  /**
   * Find a purchase order by PO number
   */
  async findByPoNumber(poNumber: string) {
    const po = await this.prisma.purchaseOrder.findFirst({
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
    return po ? this.transformDecimals(po) : null;
  }

  /**
   * Update a purchase order
   */
  async update(
    id: string,
    data: UpdatePurchaseOrderRequest
  ) {
    const po = await this.prisma.purchaseOrder.update({
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
    return this.transformDecimals(po);
  }

  /**
   * Update only the status of a purchase order
   */
  async updateStatus(id: string, status: POStatus) {
    const po = await this.prisma.purchaseOrder.update({
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
    return this.transformDecimals(po);
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

  /**
   * Add a cost to a purchase order
   */
  async addCost(poId: string, costData: AddPOCostRequest, userId: string): Promise<POCost> {
    const cost = await this.prisma.pOCost.create({
      data: {
        poId,
        type: costData.type,
        amount: costData.amount,
        description: costData.description,
        createdBy: userId,
      },
    });

    return cost;
  }

  /**
   * Get all costs for a purchase order
   */
  async getCosts(poId: string): Promise<POCost[]> {
    const costs = await this.prisma.pOCost.findMany({
      where: { poId },
      orderBy: { createdAt: 'desc' },
    });

    return costs;
  }

  /**
   * Update import details (container number, ship/arrival dates)
   */
  async updateImportDetails(
    poId: string,
    details: UpdateImportDetailsRequest,
    userId: string
  ): Promise<PurchaseOrder> {
    const po = await this.prisma.purchaseOrder.update({
      where: { id: poId },
      data: {
        containerNo: details.containerNo,
        shipDate: details.shipDate,
        arrivalDate: details.arrivalDate,
        updatedBy: userId,
      },
      include: {
        supplier: true,
        items: {
          include: {
            product: true,
          },
        },
        costs: true,
      },
    });

    return this.transformDecimals(po);
  }
}
