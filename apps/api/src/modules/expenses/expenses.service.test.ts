import { describe, it, expect, vi, beforeEach } from 'vitest';
import { expenseService } from './expenses.service.js';
import { expenseRepository } from './expenses.repository.js';
import { auditLogger } from '../audit/audit.service.js';
import { ExpenseCategory, PaymentMethod } from '@prisma/client';
import { BadRequestError, NotFoundError } from '../../shared/errors.js';

// Mock dependencies
vi.mock('./expenses.repository');
vi.mock('../audit/audit.service');

describe('ExpenseService', () => {
  const mockUserId = 'user-123';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('create', () => {
    it('should create an expense successfully', async () => {
      const createData = {
        category: ExpenseCategory.RENT,
        amount: 5000,
        description: 'Monthly office rent',
        date: new Date('2025-01-01'),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
      };

      const mockExpense = {
        id: 'expense-123',
        ...createData,
        recordedBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        receiptUrl: null,
        user: {
          id: mockUserId,
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      vi.mocked(expenseRepository.create).mockResolvedValue(mockExpense as any);
      vi.mocked(auditLogger.log).mockResolvedValue(undefined);

      const result = await expenseService.create(createData, mockUserId);

      expect(result).toEqual(mockExpense);
      expect(expenseRepository.create).toHaveBeenCalledWith({
        category: createData.category,
        amount: createData.amount,
        description: createData.description,
        date: createData.date,
        paymentMethod: createData.paymentMethod,
        receiptUrl: undefined,
        user: {
          connect: {
            id: mockUserId,
          },
        },
      });
      expect(auditLogger.log).toHaveBeenCalled();
    });

    it('should throw BadRequestError if amount is not positive', async () => {
      const createData = {
        category: ExpenseCategory.RENT,
        amount: 0,
        description: 'Invalid amount',
        date: new Date(),
        paymentMethod: PaymentMethod.CASH,
      };

      await expect(expenseService.create(createData, mockUserId)).rejects.toThrow(
        BadRequestError
      );
      await expect(expenseService.create(createData, mockUserId)).rejects.toThrow(
        'Amount must be greater than 0'
      );
    });

    it('should throw BadRequestError if date is in the future', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      const createData = {
        category: ExpenseCategory.UTILITIES,
        amount: 100,
        description: 'Future expense',
        date: futureDate,
        paymentMethod: PaymentMethod.CASH,
      };

      await expect(expenseService.create(createData, mockUserId)).rejects.toThrow(
        BadRequestError
      );
      await expect(expenseService.create(createData, mockUserId)).rejects.toThrow(
        'Date cannot be in the future'
      );
    });

    it('should throw BadRequestError if description is too short', async () => {
      const createData = {
        category: ExpenseCategory.MISC,
        amount: 50,
        description: 'AB',
        date: new Date(),
        paymentMethod: PaymentMethod.CASH,
      };

      await expect(expenseService.create(createData, mockUserId)).rejects.toThrow(
        BadRequestError
      );
      await expect(expenseService.create(createData, mockUserId)).rejects.toThrow(
        'Description must be at least 3 characters'
      );
    });
  });

  describe('getAll', () => {
    it('should return paginated expenses', async () => {
      const mockExpenses = [
        {
          id: 'expense-1',
          category: ExpenseCategory.RENT,
          amount: 5000,
          description: 'Office rent',
          date: new Date(),
          paymentMethod: PaymentMethod.BANK_TRANSFER,
          recordedBy: mockUserId,
          createdAt: new Date(),
          updatedAt: new Date(),
          receiptUrl: null,
          user: {
            id: mockUserId,
            name: 'Test User',
            email: 'test@example.com',
          },
        },
      ];

      vi.mocked(expenseRepository.findAll).mockResolvedValue({
        expenses: mockExpenses as any,
        total: 1,
      });

      const result = await expenseService.getAll({ page: 1, limit: 20 });

      expect(result.expenses).toHaveLength(1);
      expect(result.total).toBe(1);
      expect(expenseRepository.findAll).toHaveBeenCalledWith({ page: 1, limit: 20 });
    });
  });

  describe('getById', () => {
    it('should return expense if found', async () => {
      const mockExpense = {
        id: 'expense-123',
        category: ExpenseCategory.SALARIES,
        amount: 10000,
        description: 'Staff salaries',
        date: new Date(),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        recordedBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        receiptUrl: null,
        user: {
          id: mockUserId,
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      vi.mocked(expenseRepository.findById).mockResolvedValue(mockExpense as any);

      const result = await expenseService.getById('expense-123');

      expect(result).toEqual(mockExpense);
      expect(expenseRepository.findById).toHaveBeenCalledWith('expense-123');
    });

    it('should throw NotFoundError if expense not found', async () => {
      vi.mocked(expenseRepository.findById).mockResolvedValue(null);

      await expect(expenseService.getById('non-existent')).rejects.toThrow(NotFoundError);
      await expect(expenseService.getById('non-existent')).rejects.toThrow('Expense not found');
    });
  });

  describe('update', () => {
    it('should update an expense successfully', async () => {
      const existingExpense = {
        id: 'expense-123',
        category: ExpenseCategory.SUPPLIES,
        amount: 200,
        description: 'Office supplies',
        date: new Date(),
        paymentMethod: PaymentMethod.CASH,
        recordedBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        receiptUrl: null,
        user: {
          id: mockUserId,
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      const updateData = {
        amount: 250,
        description: 'Office supplies - Updated',
      };

      vi.mocked(expenseRepository.findById).mockResolvedValue(existingExpense as any);
      vi.mocked(expenseRepository.update).mockResolvedValue({
        ...existingExpense,
        ...updateData,
      } as any);
      vi.mocked(auditLogger.log).mockResolvedValue(undefined);

      const result = await expenseService.update('expense-123', updateData, mockUserId);

      expect(result.amount).toBe(250);
      expect(result.description).toBe('Office supplies - Updated');
      expect(auditLogger.log).toHaveBeenCalled();
    });

    it('should throw NotFoundError if expense does not exist', async () => {
      vi.mocked(expenseRepository.findById).mockResolvedValue(null);

      await expect(
        expenseService.update('non-existent', { amount: 100 }, mockUserId)
      ).rejects.toThrow(NotFoundError);
    });
  });

  describe('delete', () => {
    it('should delete an expense successfully', async () => {
      const existingExpense = {
        id: 'expense-123',
        category: ExpenseCategory.MARKETING,
        amount: 1000,
        description: 'Marketing campaign',
        date: new Date(),
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        recordedBy: mockUserId,
        createdAt: new Date(),
        updatedAt: new Date(),
        receiptUrl: null,
        user: {
          id: mockUserId,
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      vi.mocked(expenseRepository.findById).mockResolvedValue(existingExpense as any);
      vi.mocked(expenseRepository.delete).mockResolvedValue(undefined);
      vi.mocked(auditLogger.log).mockResolvedValue(undefined);

      await expenseService.delete('expense-123', mockUserId);

      expect(expenseRepository.delete).toHaveBeenCalledWith('expense-123');
      expect(auditLogger.log).toHaveBeenCalled();
    });

    it('should throw NotFoundError if expense does not exist', async () => {
      vi.mocked(expenseRepository.findById).mockResolvedValue(null);

      await expect(expenseService.delete('non-existent', mockUserId)).rejects.toThrow(
        NotFoundError
      );
    });
  });

  describe('getExpenseSummary', () => {
    it('should return expense summary grouped by category', async () => {
      const mockSummary = {
        totalExpenses: 16200,
        byCategory: [
          { category: ExpenseCategory.RENT, total: 5000, count: 1 },
          { category: ExpenseCategory.UTILITIES, total: 1200, count: 2 },
          { category: ExpenseCategory.SALARIES, total: 10000, count: 1 },
        ],
      };

      vi.mocked(expenseRepository.getExpenseSummary).mockResolvedValue(mockSummary);

      const dateFrom = new Date('2025-01-01');
      const dateTo = new Date('2025-01-31');

      const result = await expenseService.getExpenseSummary(dateFrom, dateTo);

      expect(result.totalExpenses).toBe(16200);
      expect(result.byCategory).toHaveLength(3);
      expect(expenseRepository.getExpenseSummary).toHaveBeenCalledWith(dateFrom, dateTo);
    });
  });
});
