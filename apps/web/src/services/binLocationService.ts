import { apiClient } from '../lib/api-client';

export interface BinLocation {
  id: string;
  warehouseId: string;
  code: string;
  zone: string | null;
  description: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBinDto {
  code: string;
  zone?: string;
  description?: string;
}

export interface UpdateBinDto {
  code?: string;
  zone?: string;
  description?: string;
  isActive?: boolean;
}

export const binLocationService = {
  getAll: async (warehouseId: string, params?: { search?: string; isActive?: string; page?: number; limit?: number }) => {
    const searchParams = new URLSearchParams();
    if (params?.search) searchParams.set('search', params.search);
    if (params?.isActive !== undefined) searchParams.set('isActive', params.isActive);
    if (params?.page) searchParams.set('page', String(params.page));
    if (params?.limit) searchParams.set('limit', String(params.limit));
    const query = searchParams.toString();
    const response = await apiClient.get(`/warehouses/${warehouseId}/bins${query ? `?${query}` : ''}`);
    return response.data;
  },

  create: async (warehouseId: string, data: CreateBinDto) => {
    const response = await apiClient.post(`/warehouses/${warehouseId}/bins`, data);
    return response.data;
  },

  update: async (warehouseId: string, binId: string, data: UpdateBinDto) => {
    const response = await apiClient.put(`/warehouses/${warehouseId}/bins/${binId}`, data);
    return response.data;
  },

  delete: async (warehouseId: string, binId: string) => {
    const response = await apiClient.delete(`/warehouses/${warehouseId}/bins/${binId}`);
    return response.data;
  },
};
