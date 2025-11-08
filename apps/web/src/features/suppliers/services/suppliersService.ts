import { apiClient } from '@/lib/api-client';
import {
  Supplier,
  CreateSupplierRequest,
  UpdateSupplierRequest,
  SupplierListResponse,
  SupplierDetailResponse,
  SupplierFilters,
} from '../types/supplier.types';

export const suppliersService = {
  async getAll(filters?: SupplierFilters): Promise<SupplierListResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<SupplierListResponse>(
      `/suppliers?${params.toString()}`
    );
    return response.data;
  },

  async getById(id: string): Promise<SupplierDetailResponse> {
    const response = await apiClient.get<SupplierDetailResponse>(`/suppliers/${id}`);
    return response.data;
  },

  async create(data: CreateSupplierRequest): Promise<SupplierDetailResponse> {
    const response = await apiClient.post<SupplierDetailResponse>('/suppliers', data);
    return response.data;
  },

  async update(id: string, data: UpdateSupplierRequest): Promise<SupplierDetailResponse> {
    const response = await apiClient.put<SupplierDetailResponse>(`/suppliers/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/suppliers/${id}`);
    return response.data;
  },
};
