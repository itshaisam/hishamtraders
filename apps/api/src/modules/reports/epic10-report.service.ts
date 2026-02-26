import { prisma } from '../../lib/prisma.js';

export class Epic10ReportService {
  constructor(private prismaClient: any = prisma) {}

  /**
   * Sales Order Report — list with filters and summary
   */
  async getSalesOrderReport(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    clientId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.orderDate = {};
      if (filters.dateFrom) where.orderDate.gte = filters.dateFrom;
      if (filters.dateTo) where.orderDate.lte = filters.dateTo;
    }

    const [data, total, statusCounts] = await Promise.all([
      this.prismaClient.salesOrder.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { orderDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaClient.salesOrder.count({ where }),
      this.prismaClient.salesOrder.groupBy({
        by: ['status'],
        where: filters.dateFrom || filters.dateTo ? {
          orderDate: where.orderDate,
        } : {},
        _count: true,
        _sum: { total: true },
      }),
    ]);

    const summary = {
      totalOrders: total,
      totalValue: data.reduce((sum: number, o: any) => sum + Number(o.total), 0),
      byStatus: statusCounts.map((sc: any) => ({
        status: sc.status,
        count: sc._count,
        value: Number(sc._sum.total) || 0,
      })),
    };

    return {
      data: data.map((o: any) => ({
        id: o.id,
        orderNumber: o.orderNumber,
        clientName: o.client?.name || '-',
        warehouseName: o.warehouse?.name || '-',
        orderDate: o.orderDate,
        expectedDeliveryDate: o.expectedDeliveryDate,
        itemCount: o._count.items,
        subtotal: Number(o.subtotal),
        total: Number(o.total),
        status: o.status,
        paymentType: o.paymentType,
      })),
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Delivery Note Report — list with filters and summary
   */
  async getDeliveryNoteReport(filters: {
    dateFrom?: Date;
    dateTo?: Date;
    status?: string;
    clientId?: string;
    warehouseId?: string;
    page?: number;
    limit?: number;
  }) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters.warehouseId) {
      where.warehouseId = filters.warehouseId;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.deliveryDate = {};
      if (filters.dateFrom) where.deliveryDate.gte = filters.dateFrom;
      if (filters.dateTo) where.deliveryDate.lte = filters.dateTo;
    }

    const [data, total, statusCounts] = await Promise.all([
      this.prismaClient.deliveryNote.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          salesOrder: { select: { id: true, orderNumber: true } },
          creator: { select: { id: true, name: true } },
          dispatcher: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { deliveryDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaClient.deliveryNote.count({ where }),
      this.prismaClient.deliveryNote.groupBy({
        by: ['status'],
        where: filters.dateFrom || filters.dateTo ? {
          deliveryDate: where.deliveryDate,
        } : {},
        _count: true,
      }),
    ]);

    const totalDispatched = statusCounts.find((sc: any) => sc.status === 'DISPATCHED')?._count || 0;
    const totalDelivered = statusCounts.find((sc: any) => sc.status === 'DELIVERED')?._count || 0;
    const totalCount = statusCounts.reduce((sum: number, sc: any) => sum + sc._count, 0);

    const summary = {
      totalNotes: total,
      totalDispatched,
      totalDelivered,
      deliveryRate: totalCount > 0 ? Math.round((totalDelivered / totalCount) * 100) : 0,
      byStatus: statusCounts.map((sc: any) => ({
        status: sc.status,
        count: sc._count,
      })),
    };

    return {
      data: data.map((dn: any) => ({
        id: dn.id,
        deliveryNoteNumber: dn.deliveryNoteNumber,
        clientName: dn.client?.name || '-',
        warehouseName: dn.warehouse?.name || '-',
        soNumber: dn.salesOrder?.orderNumber || '-',
        deliveryDate: dn.deliveryDate,
        status: dn.status,
        itemCount: dn._count.items,
        dispatchedBy: dn.dispatcher?.name || '-',
        createdBy: dn.creator?.name || '-',
      })),
      summary,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Purchase Invoice Aging Report — grouped by supplier
   */
  async getPurchaseInvoiceAging() {
    const now = new Date();

    const invoices = await this.prismaClient.purchaseInvoice.findMany({
      where: {
        status: { in: ['PENDING', 'PARTIAL'] },
      },
      include: {
        supplier: { select: { id: true, name: true } },
      },
      orderBy: { invoiceDate: 'asc' },
    });

    // Group by supplier and calculate aging buckets
    const supplierMap: Record<string, {
      supplierId: string;
      supplierName: string;
      current: number;    // 0-30 days
      days31_60: number;
      days61_90: number;
      days90Plus: number;
      totalOutstanding: number;
      invoiceCount: number;
    }> = {};

    for (const pi of invoices) {
      const supplierId = pi.supplierId;
      const outstanding = Number(pi.total) - Number(pi.paidAmount);

      if (outstanding <= 0) continue;

      if (!supplierMap[supplierId]) {
        supplierMap[supplierId] = {
          supplierId,
          supplierName: pi.supplier?.name || '-',
          current: 0,
          days31_60: 0,
          days61_90: 0,
          days90Plus: 0,
          totalOutstanding: 0,
          invoiceCount: 0,
        };
      }

      const daysDiff = Math.floor(
        (now.getTime() - new Date(pi.invoiceDate).getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysDiff <= 30) {
        supplierMap[supplierId].current += outstanding;
      } else if (daysDiff <= 60) {
        supplierMap[supplierId].days31_60 += outstanding;
      } else if (daysDiff <= 90) {
        supplierMap[supplierId].days61_90 += outstanding;
      } else {
        supplierMap[supplierId].days90Plus += outstanding;
      }

      supplierMap[supplierId].totalOutstanding += outstanding;
      supplierMap[supplierId].invoiceCount += 1;
    }

    const data = Object.values(supplierMap).sort(
      (a, b) => b.totalOutstanding - a.totalOutstanding
    );

    const totals = {
      current: data.reduce((s, d) => s + d.current, 0),
      days31_60: data.reduce((s, d) => s + d.days31_60, 0),
      days61_90: data.reduce((s, d) => s + d.days61_90, 0),
      days90Plus: data.reduce((s, d) => s + d.days90Plus, 0),
      totalOutstanding: data.reduce((s, d) => s + d.totalOutstanding, 0),
      totalInvoices: data.reduce((s, d) => s + d.invoiceCount, 0),
      supplierCount: data.length,
    };

    return { data, totals };
  }

  /**
   * Dashboard stats for Sales Orders
   */
  async getSalesOrderStats() {
    const statusCounts = await this.prismaClient.salesOrder.groupBy({
      by: ['status'],
      _count: true,
      _sum: { total: true },
    });

    return statusCounts.map((sc: any) => ({
      status: sc.status,
      count: sc._count,
      value: Number(sc._sum.total) || 0,
    }));
  }

  /**
   * Dashboard stats for Delivery Notes
   */
  async getDeliveryNoteStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [pendingCount, todayDispatched] = await Promise.all([
      this.prismaClient.deliveryNote.count({
        where: { status: 'PENDING' },
      }),
      this.prismaClient.deliveryNote.count({
        where: {
          status: { in: ['DISPATCHED', 'DELIVERED'] },
          updatedAt: { gte: today, lt: tomorrow },
        },
      }),
    ]);

    return { pendingCount, todayDispatched };
  }

  /**
   * Dashboard stats for Purchase Invoices outstanding
   */
  async getPurchaseInvoiceStats() {
    const invoices = await this.prismaClient.purchaseInvoice.findMany({
      where: { status: { in: ['PENDING', 'PARTIAL'] } },
      select: { total: true, paidAmount: true },
    });

    const totalOutstanding = invoices.reduce(
      (sum: number, pi: any) => sum + (Number(pi.total) - Number(pi.paidAmount)),
      0
    );

    return {
      outstandingCount: invoices.length,
      totalOutstanding,
    };
  }
}
