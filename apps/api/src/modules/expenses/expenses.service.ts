import { Expense } from '@prisma/client';
import { expenseRepository, ExpenseFilters } from './expenses.repository.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';

export class ExpenseService {
  async create(data: CreateExpenseDto, userId: string): Promise<Expense> {
    // Validation (additional to Zod schema)
    if (data.amount <= 0) {
      throw new BadRequestError('Amount must be greater than 0');
    }

    if (data.date > new Date()) {
      throw new BadRequestError('Date cannot be in the future');
    }

    if (!data.description || data.description.trim().length < 3) {
      throw new BadRequestError('Description must be at least 3 characters');
    }

    // Create expense
    const expense = await expenseRepository.create({
      category: data.category,
      amount: data.amount,
      description: data.description.trim(),
      date: data.date,
      paymentMethod: data.paymentMethod,
      receiptUrl: data.receiptUrl,
      user: {
        connect: {
          id: userId,
        },
      },
    });

    // TODO: Add audit logging in future iteration

    return expense;
  }

  async getAll(filters: ExpenseFilters): Promise<{ expenses: Expense[]; total: number }> {
    return expenseRepository.findAll(filters);
  }

  async getById(id: string): Promise<Expense> {
    const expense = await expenseRepository.findById(id);

    if (!expense) {
      throw new NotFoundError('Expense not found');
    }

    return expense;
  }

  async update(id: string, data: UpdateExpenseDto, userId: string): Promise<Expense> {
    // Validate expense exists
    const existing = await this.getById(id);

    // Validation
    if (data.amount !== undefined && data.amount <= 0) {
      throw new BadRequestError('Amount must be greater than 0');
    }

    if (data.date && data.date > new Date()) {
      throw new BadRequestError('Date cannot be in the future');
    }

    if (data.description && data.description.trim().length < 3) {
      throw new BadRequestError('Description must be at least 3 characters');
    }

    // Prepare update data
    const updateData: any = {};
    if (data.category !== undefined) updateData.category = data.category;
    if (data.amount !== undefined) updateData.amount = data.amount;
    if (data.description !== undefined) updateData.description = data.description.trim();
    if (data.date !== undefined) updateData.date = data.date;
    if (data.paymentMethod !== undefined) updateData.paymentMethod = data.paymentMethod;
    if (data.receiptUrl !== undefined) updateData.receiptUrl = data.receiptUrl;

    // Update expense
    const expense = await expenseRepository.update(id, updateData);

    // TODO: Add audit logging in future iteration

    return expense;
  }

  async delete(id: string, userId: string): Promise<void> {
    // Validate expense exists
    const existing = await this.getById(id);

    // Delete expense
    await expenseRepository.delete(id);

    // TODO: Add audit logging in future iteration
  }

  async getExpenseSummary(dateFrom: Date, dateTo: Date) {
    return expenseRepository.getExpenseSummary(dateFrom, dateTo);
  }
}

export const expenseService = new ExpenseService();
