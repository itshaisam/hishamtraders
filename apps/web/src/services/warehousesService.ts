import { apiClient } from '@/lib/api-client';
import {
  Warehouse,
  CreateWarehouseRequest,
  UpdateWarehouseRequest,
  WarehouseFilters,
  WarehousesResponse,
  WarehouseResponse,
} from '@/types/warehouse.types';

export const warehousesService = {
  /**
   * Get all warehouses with optional filters
   */
  async getAll(filters?: WarehouseFilters): Promise<WarehousesResponse> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get(`/warehouses?${params.toString()}`);
    return response.data;
  },

  /**
   * Get warehouse by ID
   */
  async getById(id: string): Promise<WarehouseResponse> {
    const response = await apiClient.get(`/warehouses/${id}`);
    return response.data;
  },

  /**
   * Create a new warehouse
   */
  async create(data: CreateWarehouseRequest): Promise<WarehouseResponse> {
    const response = await apiClient.post('/warehouses', data);
    return response.data;
  },

  /**
   * Update an existing warehouse
   */
  async update(id: string, data: UpdateWarehouseRequest): Promise<WarehouseResponse> {
    const response = await apiClient.put(`/warehouses/${id}`, data);
    return response.data;
  },

  /**
   * Delete a warehouse
   */
  async delete(id: string): Promise<void> {
    await apiClient.delete(`/warehouses/${id}`);
  },
};
