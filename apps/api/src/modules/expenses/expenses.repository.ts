import { prisma } from '../../lib/prisma.js';
import { Expense, ExpenseCategory, Prisma } from '@prisma/client';

export interface ExpenseFilters {
  category?: ExpenseCategory;
  dateFrom?: Date;
  dateTo?: Date;
  page?: number;
  limit?: number;
}

export class ExpenseRepository {
  async create(data: Prisma.ExpenseCreateInput): Promise<Expense> {
    return prisma.expense.create({
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async findAll(filters: ExpenseFilters): Promise<{ expenses: Expense[]; total: number }> {
    const { category, dateFrom, dateTo, page = 1, limit = 20 } = filters;

    const where: Prisma.ExpenseWhereInput = {};

    if (category) {
      where.category = category;
    }

    if (dateFrom || dateTo) {
      where.date = {};
      if (dateFrom) where.date.gte = dateFrom;
      if (dateTo) where.date.lte = dateTo;
    }

    const [expenses, total] = await Promise.all([
      prisma.expense.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { date: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.expense.count({ where }),
    ]);

    return { expenses, total };
  }

  async findById(id: string): Promise<Expense | null> {
    return prisma.expense.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async update(id: string, data: Prisma.ExpenseUpdateInput): Promise<Expense> {
    return prisma.expense.update({
      where: { id },
      data,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async delete(id: string): Promise<void> {
    await prisma.expense.delete({
      where: { id },
    });
  }

  async getExpenseSummary(dateFrom: Date, dateTo: Date) {
    const expenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: dateFrom,
          lte: dateTo,
        },
      },
      select: {
        category: true,
        amount: true,
      },
    });

    // Group by category
    const groupedByCategory: Record<
      string,
      { category: ExpenseCategory; total: number; count: number }
    > = {};

    expenses.forEach((expense) => {
      const category = expense.category;
      const amount = parseFloat(expense.amount.toString());

      if (!groupedByCategory[category]) {
        groupedByCategory[category] = { category, total: 0, count: 0 };
      }

      groupedByCategory[category].total += amount;
      groupedByCategory[category].count += 1;
    });

    const byCategory = Object.values(groupedByCategory);
    const totalExpenses = byCategory.reduce((sum, item) => sum + item.total, 0);

    return {
      totalExpenses,
      byCategory,
    };
  }
}

export const expenseRepository = new ExpenseRepository();
