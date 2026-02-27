import { GRNStatus } from '@prisma/client';

export interface GRNFilters {
  search?: string;
  poId?: string;
  warehouseId?: string;
  supplierId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export class GoodsReceiptsRepository {
  constructor(private prisma: any) {}

  private transformDecimals(grn: any) {
    return {
      ...grn,
      purchaseOrder: grn.purchaseOrder
        ? {
            ...grn.purchaseOrder,
            totalAmount: Number(grn.purchaseOrder.totalAmount),
            taxRate: Number(grn.purchaseOrder.taxRate),
            taxAmount: Number(grn.purchaseOrder.taxAmount),
            items: grn.purchaseOrder.items?.map((item: any) => ({
              ...item,
              unitCost: Number(item.unitCost),
              totalCost: Number(item.totalCost),
            })) || [],
          }
        : undefined,
      items: grn.items?.map((item: any) => ({
        ...item,
        poItem: item.poItem
          ? { ...item.poItem, unitCost: Number(item.poItem.unitCost) }
          : undefined,
      })) || [],
      costs: grn.costs?.map((cost: any) => ({
        ...cost,
        amount: Number(cost.amount),
      })) || [],
    };
  }

  async generateGRNNumber(): Promise<string> {
    const year = new Date().getFullYear();
    const lastGRN = await this.prisma.goodsReceiveNote.findFirst({
      where: { grnNumber: { startsWith: `GRN-${year}-` } },
      orderBy: { createdAt: 'desc' },
    });

    let nextNumber = 1;
    if (lastGRN) {
      const match = lastGRN.grnNumber.match(/GRN-\d+-(\d+)/);
      if (match) {
        nextNumber = parseInt(match[1], 10) + 1;
      }
    }
    return `GRN-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  async findAll(filters?: GRNFilters) {
    const {
      search = '',
      poId,
      warehouseId,
      supplierId,
      status,
      startDate,
      endDate,
      page = 1,
      limit = 10,
    } = filters || {};

    const skip = (page - 1) * limit;
    const where: any = {};

    if (search) {
      where.OR = [
        { grnNumber: { contains: search } },
        { purchaseOrder: { poNumber: { contains: search } } },
        { purchaseOrder: { supplier: { name: { contains: search } } } },
      ];
    }

    if (poId) where.poId = poId;
    if (warehouseId) where.warehouseId = warehouseId;
    if (supplierId) where.purchaseOrder = { ...where.purchaseOrder, supplierId };
    if (status) where.status = status;

    if (startDate || endDate) {
      where.receivedDate = {};
      if (startDate) where.receivedDate.gte = new Date(startDate);
      if (endDate) where.receivedDate.lte = new Date(endDate);
    }

    const [data, total] = await Promise.all([
      this.prisma.goodsReceiveNote.findMany({
        where,
        include: {
          purchaseOrder: {
            include: { supplier: { select: { id: true, name: true } } },
          },
          warehouse: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
              poItem: { select: { unitCost: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.goodsReceiveNote.count({ where }),
    ]);

    return {
      data: data.map((grn: any) => this.transformDecimals(grn)),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string) {
    const grn = await this.prisma.goodsReceiveNote.findUnique({
      where: { id },
      include: {
        purchaseOrder: {
          include: {
            supplier: true,
            items: {
              include: {
                product: true,
                productVariant: true,
              },
            },
          },
        },
        warehouse: true,
        creator: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            productVariant: { select: { id: true, variantName: true, sku: true } },
            poItem: { select: { id: true, quantity: true, receivedQuantity: true, unitCost: true } },
          },
        },
        costs: { orderBy: { createdAt: 'desc' } },
      },
    });

    return grn ? this.transformDecimals(grn) : null;
  }
}
