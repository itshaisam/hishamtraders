interface SalesReportFilters {
  dateFrom: Date;
  dateTo: Date;
  clientId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export class SalesReportService {
  constructor(private prisma: any) {}

  async getSalesReport(filters: SalesReportFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      invoiceDate: { gte: filters.dateFrom, lte: filters.dateTo },
    };
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.status) where.status = filters.status;

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        include: { client: { select: { name: true } } },
        orderBy: { invoiceDate: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    // Summary across ALL matching invoices (not just page)
    const allInvoices = await this.prisma.invoice.findMany({
      where,
      select: { total: true, paidAmount: true },
    });

    const summary = {
      totalInvoices: total,
      totalAmount: 0,
      totalPaid: 0,
      totalOutstanding: 0,
    };

    for (const inv of allInvoices) {
      const t = parseFloat(inv.total.toString());
      const p = parseFloat(inv.paidAmount.toString());
      summary.totalAmount += t;
      summary.totalPaid += p;
      summary.totalOutstanding += t - p;
    }

    summary.totalAmount = Math.round(summary.totalAmount * 10000) / 10000;
    summary.totalPaid = Math.round(summary.totalPaid * 10000) / 10000;
    summary.totalOutstanding = Math.round(summary.totalOutstanding * 10000) / 10000;

    const data = invoices.map((inv: any) => {
      const t = parseFloat(inv.total.toString());
      const p = parseFloat(inv.paidAmount.toString());
      return {
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        invoiceDate: inv.invoiceDate.toISOString(),
        clientName: inv.client.name,
        subtotal: parseFloat(inv.subtotal.toString()),
        taxAmount: parseFloat(inv.taxAmount.toString()),
        total: t,
        paidAmount: p,
        outstanding: Math.round((t - p) * 10000) / 10000,
        status: inv.status,
      };
    });

    return {
      data,
      summary,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getSalesByClient(dateFrom: Date, dateTo: Date) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        invoiceDate: { gte: dateFrom, lte: dateTo },
        status: { notIn: ['CANCELLED', 'VOIDED'] },
      },
      include: { client: { select: { id: true, name: true } } },
    });

    const clientMap = new Map<string, { name: string; count: number; revenue: number }>();
    for (const inv of invoices) {
      const existing = clientMap.get(inv.clientId) || { name: inv.client.name, count: 0, revenue: 0 };
      existing.count += 1;
      existing.revenue += parseFloat(inv.total.toString());
      clientMap.set(inv.clientId, existing);
    }

    const data = Array.from(clientMap.entries())
      .map(([clientId, c]) => ({
        clientId,
        clientName: c.name,
        invoiceCount: c.count,
        revenue: Math.round(c.revenue * 10000) / 10000,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return data;
  }

  async getSalesByProduct(dateFrom: Date, dateTo: Date) {
    const items = await this.prisma.invoiceItem.findMany({
      where: {
        invoice: {
          invoiceDate: { gte: dateFrom, lte: dateTo },
          status: { notIn: ['CANCELLED', 'VOIDED'] },
        },
      },
      include: {
        product: { select: { id: true, name: true, sku: true } },
      },
    });

    const productMap = new Map<string, { name: string; sku: string; qty: number; revenue: number }>();
    for (const item of items) {
      const existing = productMap.get(item.productId) || {
        name: item.product.name,
        sku: item.product.sku,
        qty: 0,
        revenue: 0,
      };
      existing.qty += item.quantity;
      existing.revenue += parseFloat(item.total.toString());
      productMap.set(item.productId, existing);
    }

    const data = Array.from(productMap.entries())
      .map(([productId, p]) => ({
        productId,
        productName: p.name,
        sku: p.sku,
        qtySold: p.qty,
        revenue: Math.round(p.revenue * 10000) / 10000,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    return data;
  }
}
