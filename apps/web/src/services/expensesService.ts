import { apiClient } from '../lib/api-client';
import {
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  ExpenseFilters,
  ExpenseSummary,
} from '../types/expense.types';

export const expensesService = {
  async getAll(filters: ExpenseFilters = {}) {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom.toString());
    if (filters.dateTo) params.append('dateTo', filters.dateTo.toString());
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<{
      status: string;
      data: Expense[];
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/api/v1/expenses?${params.toString()}`);

    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get<{ status: string; data: Expense }>(
      `/api/v1/expenses/${id}`
    );
    return response.data.data;
  },

  async create(data: CreateExpenseDto) {
    const response = await apiClient.post<{ status: string; data: Expense }>(
      '/api/v1/expenses',
      data
    );
    return response.data.data;
  },

  async update(id: string, data: UpdateExpenseDto) {
    const response = await apiClient.put<{ status: string; data: Expense }>(
      `/api/v1/expenses/${id}`,
      data
    );
    return response.data.data;
  },

  async delete(id: string) {
    const response = await apiClient.delete<{ status: string; message: string }>(
      `/api/v1/expenses/${id}`
    );
    return response.data;
  },

  async getExpenseSummary(dateFrom?: Date | string, dateTo?: Date | string) {
    const params = new URLSearchParams();
    if (dateFrom) params.append('dateFrom', dateFrom.toString());
    if (dateTo) params.append('dateTo', dateTo.toString());

    const response = await apiClient.get<{ success: boolean; data: ExpenseSummary }>(
      `/api/v1/reports/expense-summary?${params.toString()}`
    );
    return response.data.data;
  },
};
