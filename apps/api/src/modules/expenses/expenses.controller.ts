import { Request, Response, NextFunction } from 'express';
import { expenseService } from './expenses.service.js';
import { createExpenseSchema } from './dto/create-expense.dto.js';
import { updateExpenseSchema } from './dto/update-expense.dto.js';
import { expenseFilterSchema } from './dto/expense-filter.dto.js';
import { AuthRequest } from '../../types/auth.types.js';

export class ExpenseController {
  async create(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const validatedData = createExpenseSchema.parse(req.body);
      const expense = await expenseService.create(validatedData, req.user.userId);

      res.status(201).json({
        status: 'success',
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  async getAll(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const filters = expenseFilterSchema.parse(req.query);
      const result = await expenseService.getAll(filters);

      res.status(200).json({
        status: 'success',
        data: result.expenses,
        meta: {
          total: result.total,
          page: filters.page,
          limit: filters.limit,
          totalPages: Math.ceil(result.total / filters.limit),
        },
      });
    } catch (error) {
      next(error);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const expense = await expenseService.getById(id);

      res.status(200).json({
        status: 'success',
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  async update(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      const validatedData = updateExpenseSchema.parse(req.body);
      const expense = await expenseService.update(id, validatedData, req.user.userId);

      res.status(200).json({
        status: 'success',
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }

  async delete(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user?.userId) {
        res.status(401).json({ status: 'error', message: 'Unauthorized' });
        return;
      }

      const { id } = req.params;
      await expenseService.delete(id, req.user.userId);

      res.status(200).json({
        status: 'success',
        message: 'Expense deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}

export const expenseController = new ExpenseController();
