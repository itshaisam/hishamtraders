import { apiClient } from '@/lib/api-client';
import { UnitOfMeasure, CreateUomRequest, UpdateUomRequest } from '@/types/uom.types';

export const uomsService = {
  async getAll() {
    const response = await apiClient.get<{ data: UnitOfMeasure[] }>('/uoms');
    return response.data;
  },

  async getById(id: string) {
    const response = await apiClient.get<{ data: UnitOfMeasure }>(`/uoms/${id}`);
    return response.data;
  },

  async create(data: CreateUomRequest) {
    const response = await apiClient.post<{ data: UnitOfMeasure }>('/uoms', data);
    return response.data;
  },

  async update(id: string, data: UpdateUomRequest) {
    const response = await apiClient.put<{ data: UnitOfMeasure }>(`/uoms/${id}`, data);
    return response.data;
  },

  async delete(id: string) {
    await apiClient.delete(`/uoms/${id}`);
  },
};
