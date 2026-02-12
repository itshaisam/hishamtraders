import { apiClient } from '../lib/api-client';
import { CreateTransferDto, TransferFilters } from '../types/stock-transfer.types';

export const stockTransferService = {
  getAll: async (filters?: TransferFilters) => {
    const params = new URLSearchParams();
    if (filters?.sourceWarehouseId) params.set('sourceWarehouseId', filters.sourceWarehouseId);
    if (filters?.destinationWarehouseId) params.set('destinationWarehouseId', filters.destinationWarehouseId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.search) params.set('search', filters.search);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));
    const query = params.toString();
    const res = await apiClient.get(`/stock-transfers${query ? `?${query}` : ''}`);
    return res.data;
  },
  getById: async (id: string) => {
    const res = await apiClient.get(`/stock-transfers/${id}`);
    return res.data;
  },
  create: async (data: CreateTransferDto) => {
    const res = await apiClient.post('/stock-transfers', data);
    return res.data;
  },
  approve: async (id: string) => {
    const res = await apiClient.put(`/stock-transfers/${id}/approve`);
    return res.data;
  },
  dispatch: async (id: string) => {
    const res = await apiClient.put(`/stock-transfers/${id}/dispatch`);
    return res.data;
  },
  receive: async (id: string, items: Array<{ itemId: string; receivedQuantity: number }>) => {
    const res = await apiClient.put(`/stock-transfers/${id}/receive`, { items });
    return res.data;
  },
  cancel: async (id: string, reason: string) => {
    const res = await apiClient.put(`/stock-transfers/${id}/cancel`, { reason });
    return res.data;
  },
};
