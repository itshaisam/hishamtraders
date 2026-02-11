import { PrismaClient } from '@prisma/client';

interface ExpenseReportFilters {
  dateFrom: Date;
  dateTo: Date;
  category?: string;
  page?: number;
  limit?: number;
}

export class ExpenseReportService {
  constructor(private prisma: PrismaClient) {}

  async getExpenseReport(filters: ExpenseReportFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 50;
    const skip = (page - 1) * limit;

    const where: any = {
      date: { gte: filters.dateFrom, lte: filters.dateTo },
    };
    if (filters.category) where.category = filters.category;

    const [expenses, total] = await Promise.all([
      this.prisma.expense.findMany({
        where,
        include: { user: { select: { name: true } } },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.expense.count({ where }),
    ]);

    // Summary across all
    const allExpenses = await this.prisma.expense.findMany({
      where,
      select: { amount: true },
    });

    let totalExpenses = 0;
    for (const e of allExpenses) {
      totalExpenses += parseFloat(e.amount.toString());
    }

    const count = allExpenses.length;
    const summary = {
      totalExpenses: Math.round(totalExpenses * 100) / 100,
      count,
      average: count > 0 ? Math.round((totalExpenses / count) * 100) / 100 : 0,
    };

    const data = expenses.map((e) => ({
      id: e.id,
      date: e.date.toISOString(),
      category: e.category,
      description: e.description,
      amount: parseFloat(e.amount.toString()),
      paymentMethod: e.paymentMethod,
      recordedBy: e.user.name,
    }));

    return {
      data,
      summary,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getExpensesTrend() {
    // Last 12 months
    const now = new Date();
    const months: { month: string; total: number }[] = [];

    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59);

      const expenses = await this.prisma.expense.findMany({
        where: { date: { gte: start, lte: end } },
        select: { amount: true },
      });

      const total = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);

      const monthLabel = `${start.getFullYear()}-${String(start.getMonth() + 1).padStart(2, '0')}`;
      months.push({ month: monthLabel, total: Math.round(total * 100) / 100 });
    }

    return months;
  }
}
