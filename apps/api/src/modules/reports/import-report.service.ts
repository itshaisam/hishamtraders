interface ImportReportFilters {
  dateFrom?: Date;
  dateTo?: Date;
  supplierId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class ImportReportService {
  constructor(private prisma: any) {}

  async getImportCostReport(filters: ImportReportFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (filters.dateFrom || filters.dateTo) {
      where.orderDate = {};
      if (filters.dateFrom) where.orderDate.gte = filters.dateFrom;
      if (filters.dateTo) where.orderDate.lte = filters.dateTo;
    }
    if (filters.supplierId) where.supplierId = filters.supplierId;
    if (filters.status) where.status = filters.status;

    const [orders, total] = await Promise.all([
      this.prisma.purchaseOrder.findMany({
        where,
        include: {
          supplier: { select: { name: true } },
          costs: true,
        },
        orderBy: { orderDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    // Summary across ALL matching orders
    const allOrders = await this.prisma.purchaseOrder.findMany({
      where,
      select: { totalAmount: true, costs: { select: { type: true, amount: true } } },
    });

    const summary = {
      totalPOs: total,
      totalProductCost: 0,
      totalShipping: 0,
      totalCustoms: 0,
      totalTax: 0,
      totalOther: 0,
      totalLanded: 0,
    };

    for (const o of allOrders) {
      const productCost = parseFloat(o.totalAmount.toString());
      summary.totalProductCost += productCost;
      let costTotal = productCost;
      for (const c of o.costs) {
        const amt = parseFloat(c.amount.toString());
        costTotal += amt;
        switch (c.type) {
          case 'SHIPPING': summary.totalShipping += amt; break;
          case 'CUSTOMS': summary.totalCustoms += amt; break;
          case 'TAX': summary.totalTax += amt; break;
          case 'OTHER': summary.totalOther += amt; break;
        }
      }
      summary.totalLanded += costTotal;
    }

    // Round
    summary.totalProductCost = Math.round(summary.totalProductCost * 100) / 100;
    summary.totalShipping = Math.round(summary.totalShipping * 100) / 100;
    summary.totalCustoms = Math.round(summary.totalCustoms * 100) / 100;
    summary.totalTax = Math.round(summary.totalTax * 100) / 100;
    summary.totalOther = Math.round(summary.totalOther * 100) / 100;
    summary.totalLanded = Math.round(summary.totalLanded * 100) / 100;

    const data = orders.map((po: any) => {
      const productCost = parseFloat(po.totalAmount.toString());
      let shipping = 0, customs = 0, tax = 0, other = 0;
      for (const c of po.costs) {
        const amt = parseFloat(c.amount.toString());
        switch (c.type) {
          case 'SHIPPING': shipping += amt; break;
          case 'CUSTOMS': customs += amt; break;
          case 'TAX': tax += amt; break;
          case 'OTHER': other += amt; break;
        }
      }
      return {
        id: po.id,
        poNumber: po.poNumber,
        orderDate: po.orderDate.toISOString(),
        supplierName: po.supplier.name,
        productCost,
        shipping: Math.round(shipping * 100) / 100,
        customs: Math.round(customs * 100) / 100,
        tax: Math.round(tax * 100) / 100,
        other: Math.round(other * 100) / 100,
        totalLanded: Math.round((productCost + shipping + customs + tax + other) * 100) / 100,
        status: po.status,
      };
    });

    return {
      data,
      summary,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }
}
