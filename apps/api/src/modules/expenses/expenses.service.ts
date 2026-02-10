import { Expense } from '@prisma/client';
import { expenseRepository, ExpenseFilters } from './expenses.repository.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { AuditService } from '../../services/audit.service.js';

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

    await AuditService.log({
      userId,
      action: 'CREATE',
      entityType: 'Expense',
      entityId: expense.id,
      notes: `Expense created: ${data.category} - ${data.amount} via ${data.paymentMethod}`,
    });

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

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'Expense',
      entityId: id,
      changedFields: Object.keys(updateData).reduce((acc: Record<string, any>, key) => {
        acc[key] = { old: (existing as any)[key], new: (updateData as any)[key] };
        return acc;
      }, {}),
      notes: `Expense updated: ${expense.category}`,
    });

    return expense;
  }

  async delete(id: string, userId: string): Promise<void> {
    // Validate expense exists
    const existing = await this.getById(id);

    // Delete expense
    await expenseRepository.delete(id);

    await AuditService.log({
      userId,
      action: 'DELETE',
      entityType: 'Expense',
      entityId: id,
      notes: `Expense deleted: ${existing.category} - ${existing.amount} - ${existing.description}`,
    });
  }

  async getExpenseSummary(dateFrom: Date, dateTo: Date) {
    return expenseRepository.getExpenseSummary(dateFrom, dateTo);
  }
}

export const expenseService = new ExpenseService();
