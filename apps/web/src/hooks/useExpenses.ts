import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { expensesService } from '../services/expensesService';
import {
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseFilters,
} from '../types/expense.types';
import toast from 'react-hot-toast';

export const useExpenses = (filters: ExpenseFilters = {}) => {
  return useQuery({
    queryKey: ['expenses', filters],
    queryFn: () => expensesService.getAll(filters),
  });
};

export const useExpense = (id: string) => {
  return useQuery({
    queryKey: ['expenses', id],
    queryFn: () => expensesService.getById(id),
    enabled: !!id,
  });
};

export const useCreateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateExpenseDto) => expensesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create expense');
    },
  });
};

export const useUpdateExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateExpenseDto }) =>
      expensesService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense updated successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update expense');
    },
  });
};

export const useDeleteExpense = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => expensesService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast.success('Expense deleted successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to delete expense');
    },
  });
};

export const useExpenseSummary = (dateFrom?: Date | string, dateTo?: Date | string) => {
  return useQuery({
    queryKey: ['expense-summary', dateFrom, dateTo],
    queryFn: () => expensesService.getExpenseSummary(dateFrom, dateTo),
  });
};
