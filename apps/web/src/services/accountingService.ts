import { apiClient } from '../lib/api-client';
import {
  AccountHead,
  CreateAccountHeadDto,
  UpdateAccountHeadDto,
  AccountHeadFilters,
} from '../types/accounting.types';

export const accountingService = {
  async getAccountHeads(filters: AccountHeadFilters = {}) {
    const params = new URLSearchParams();

    if (filters.accountType) params.append('accountType', filters.accountType);
    if (filters.status) params.append('status', filters.status);
    if (filters.parentId) params.append('parentId', filters.parentId);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<{
      status: string;
      data: AccountHead[];
      meta: {
        total: number;
        page: number;
        limit: number;
        totalPages: number;
      };
    }>(`/account-heads?${params.toString()}`);

    return response.data;
  },

  async getAccountHeadTree() {
    const response = await apiClient.get<{
      status: string;
      data: AccountHead[];
    }>('/account-heads/tree');

    return response.data.data;
  },

  async getAccountHeadById(id: string) {
    const response = await apiClient.get<{
      status: string;
      data: AccountHead;
    }>(`/account-heads/${id}`);

    return response.data.data;
  },

  async createAccountHead(data: CreateAccountHeadDto) {
    const response = await apiClient.post<{
      status: string;
      data: AccountHead;
    }>('/account-heads', data);

    return response.data.data;
  },

  async updateAccountHead(id: string, data: UpdateAccountHeadDto) {
    const response = await apiClient.put<{
      status: string;
      data: AccountHead;
    }>(`/account-heads/${id}`, data);

    return response.data.data;
  },

  async deleteAccountHead(id: string) {
    const response = await apiClient.delete<{
      status: string;
      message: string;
    }>(`/account-heads/${id}`);

    return response.data;
  },
};
