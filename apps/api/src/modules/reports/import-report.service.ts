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
          goodsReceiveNotes: {
            where: { status: 'COMPLETED' },
            include: { costs: true },
          },
        },
        orderBy: { orderDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.purchaseOrder.count({ where }),
    ]);

    // Summary across ALL matching orders (includes both PO and GRN costs)
    const allOrders = await this.prisma.purchaseOrder.findMany({
      where,
      select: {
        totalAmount: true,
        taxAmount: true,
        costs: { select: { type: true, amount: true } },
        goodsReceiveNotes: {
          where: { status: 'COMPLETED' },
          select: { costs: { select: { type: true, amount: true } } },
        },
      },
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
      const taxAmount = parseFloat(o.taxAmount.toString());
      const productCost = parseFloat(o.totalAmount.toString()) - taxAmount;
      summary.totalProductCost += productCost;
      summary.totalTax += taxAmount; // Built-in PO tax
      let costTotal = parseFloat(o.totalAmount.toString()); // totalAmount already includes tax

      // PO-level costs
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

      // GRN-level costs (from completed GRNs)
      for (const grn of (o.goodsReceiveNotes || [])) {
        for (const c of (grn.costs || [])) {
          const amt = parseFloat(c.amount.toString());
          costTotal += amt;
          switch (c.type) {
            case 'SHIPPING': summary.totalShipping += amt; break;
            case 'CUSTOMS': summary.totalCustoms += amt; break;
            case 'TAX': summary.totalTax += amt; break;
            case 'OTHER': summary.totalOther += amt; break;
          }
        }
      }

      summary.totalLanded += costTotal;
    }

    // Round
    summary.totalProductCost = Math.round(summary.totalProductCost * 10000) / 10000;
    summary.totalShipping = Math.round(summary.totalShipping * 10000) / 10000;
    summary.totalCustoms = Math.round(summary.totalCustoms * 10000) / 10000;
    summary.totalTax = Math.round(summary.totalTax * 10000) / 10000;
    summary.totalOther = Math.round(summary.totalOther * 10000) / 10000;
    summary.totalLanded = Math.round(summary.totalLanded * 10000) / 10000;

    const data = orders.map((po: any) => {
      const poTaxAmount = parseFloat(po.taxAmount.toString());
      const productCost = parseFloat(po.totalAmount.toString()) - poTaxAmount;
      let shipping = 0, customs = 0, tax = poTaxAmount, other = 0;

      // PO-level costs
      for (const c of po.costs) {
        const amt = parseFloat(c.amount.toString());
        switch (c.type) {
          case 'SHIPPING': shipping += amt; break;
          case 'CUSTOMS': customs += amt; break;
          case 'TAX': tax += amt; break;
          case 'OTHER': other += amt; break;
        }
      }

      // GRN-level costs
      for (const grn of (po.goodsReceiveNotes || [])) {
        for (const c of (grn.costs || [])) {
          const amt = parseFloat(c.amount.toString());
          switch (c.type) {
            case 'SHIPPING': shipping += amt; break;
            case 'CUSTOMS': customs += amt; break;
            case 'TAX': tax += amt; break;
            case 'OTHER': other += amt; break;
          }
        }
      }

      return {
        id: po.id,
        poNumber: po.poNumber,
        orderDate: po.orderDate.toISOString(),
        supplierName: po.supplier.name,
        productCost,
        shipping: Math.round(shipping * 10000) / 10000,
        customs: Math.round(customs * 10000) / 10000,
        tax: Math.round(tax * 10000) / 10000,
        other: Math.round(other * 10000) / 10000,
        totalLanded: Math.round((productCost + shipping + customs + tax + other) * 10000) / 10000,
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
