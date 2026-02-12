import { apiClient } from '../lib/api-client';

export const stockCountService = {
  getAll: async (params?: { warehouseId?: string; status?: string; search?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.warehouseId) searchParams.set('warehouseId', params.warehouseId);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.search) searchParams.set('search', params.search);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    return (await apiClient.get(`/stock-counts${query ? `?${query}` : ''}`)).data;
  },
  getById: async (id: string) => (await apiClient.get(`/stock-counts/${id}`)).data,
  create: async (data: { warehouseId: string; countDate: string; notes?: string }) =>
    (await apiClient.post('/stock-counts', data)).data,
  start: async (id: string) => (await apiClient.put(`/stock-counts/${id}/start`)).data,
  updateItems: async (id: string, items: Array<{ itemId: string; countedQuantity: number; notes?: string }>) =>
    (await apiClient.put(`/stock-counts/${id}/items`, { items })).data,
  complete: async (id: string) => (await apiClient.put(`/stock-counts/${id}/complete`)).data,
  cancel: async (id: string) => (await apiClient.put(`/stock-counts/${id}/cancel`)).data,
};
