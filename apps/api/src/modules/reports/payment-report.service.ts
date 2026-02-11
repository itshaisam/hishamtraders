import { PrismaClient } from '@prisma/client';

interface PaymentReportFilters {
  dateFrom: Date;
  dateTo: Date;
  clientId?: string;
  method?: string;
  page?: number;
  limit?: number;
}

export class PaymentReportService {
  constructor(private prisma: PrismaClient) {}

  async getPaymentCollectionReport(filters: PaymentReportFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      paymentType: 'CLIENT',
      date: { gte: filters.dateFrom, lte: filters.dateTo },
    };
    if (filters.clientId) where.clientId = filters.clientId;
    if (filters.method) where.method = filters.method;

    const [payments, total] = await Promise.all([
      this.prisma.payment.findMany({
        where,
        include: { client: { select: { name: true } } },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.payment.count({ where }),
    ]);

    // Summary across all matching
    const allPayments = await this.prisma.payment.findMany({
      where,
      select: { amount: true, method: true },
    });

    const byMethodMap = new Map<string, { total: number; count: number }>();
    let totalCollected = 0;

    for (const p of allPayments) {
      const amt = parseFloat(p.amount.toString());
      totalCollected += amt;
      const existing = byMethodMap.get(p.method) || { total: 0, count: 0 };
      existing.total += amt;
      existing.count += 1;
      byMethodMap.set(p.method, existing);
    }

    const summary = {
      totalCollected: Math.round(totalCollected * 100) / 100,
      count: allPayments.length,
      byMethod: Array.from(byMethodMap.entries()).map(([method, v]) => ({
        method,
        total: Math.round(v.total * 100) / 100,
        count: v.count,
      })),
    };

    const data = payments.map((p) => ({
      id: p.id,
      date: p.date.toISOString(),
      clientName: p.client?.name || 'N/A',
      amount: parseFloat(p.amount.toString()),
      method: p.method,
      referenceNumber: p.referenceNumber,
      notes: p.notes,
    }));

    return {
      data,
      summary,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getReceivablesReport() {
    const clients = await this.prisma.client.findMany({
      where: {
        status: 'ACTIVE',
        balance: { gt: 0 },
      },
      select: {
        id: true,
        name: true,
        balance: true,
        creditLimit: true,
        invoices: {
          where: {
            status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
          },
          select: { dueDate: true, total: true, paidAmount: true },
          orderBy: { dueDate: 'asc' },
        },
      },
    });

    const now = new Date();

    const data = clients.map((c) => {
      let overdueAmount = 0;
      let oldestDueDate: Date | null = null;

      for (const inv of c.invoices) {
        if (inv.dueDate < now) {
          const outstanding = parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString());
          if (outstanding > 0) {
            overdueAmount += outstanding;
            if (!oldestDueDate || inv.dueDate < oldestDueDate) {
              oldestDueDate = inv.dueDate;
            }
          }
        }
      }

      const daysPastDue = oldestDueDate
        ? Math.floor((now.getTime() - oldestDueDate.getTime()) / (1000 * 60 * 60 * 24))
        : 0;

      return {
        clientId: c.id,
        clientName: c.name,
        balance: parseFloat(c.balance.toString()),
        creditLimit: parseFloat(c.creditLimit.toString()),
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        oldestDueDate: oldestDueDate ? oldestDueDate.toISOString() : null,
        daysPastDue,
      };
    });

    data.sort((a, b) => b.balance - a.balance);

    return data;
  }
}
