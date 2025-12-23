import { apiClient } from '@/lib/api-client';
import {
  AdjustmentFilters,
  AdjustmentResponse,
  SingleAdjustmentResponse,
  CreateAdjustmentDto,
  RejectAdjustmentDto,
} from '../types/stock-adjustment.types';

export const stockAdjustmentService = {
  /**
   * Create a new stock adjustment (PENDING status)
   */
  async create(data: CreateAdjustmentDto): Promise<SingleAdjustmentResponse> {
    const response = await apiClient.post<SingleAdjustmentResponse>(
      '/inventory/adjustments',
      data
    );
    return response.data;
  },

  /**
   * Get all adjustments with optional filters
   */
  async getAll(filters?: AdjustmentFilters): Promise<AdjustmentResponse> {
    const params = new URLSearchParams();

    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.createdBy) params.append('createdBy', filters.createdBy);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<AdjustmentResponse>(
      `/inventory/adjustments?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get pending adjustments (for admin approval queue)
   */
  async getPending(filters?: {
    warehouseId?: string;
    page?: number;
    limit?: number;
  }): Promise<AdjustmentResponse> {
    const params = new URLSearchParams();

    if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<AdjustmentResponse>(
      `/inventory/adjustments/pending?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get single adjustment by ID
   */
  async getById(id: string): Promise<SingleAdjustmentResponse> {
    const response = await apiClient.get<SingleAdjustmentResponse>(
      `/inventory/adjustments/${id}`
    );
    return response.data;
  },

  /**
   * Approve a pending adjustment
   */
  async approve(id: string): Promise<SingleAdjustmentResponse> {
    const response = await apiClient.patch<SingleAdjustmentResponse>(
      `/inventory/adjustments/${id}/approve`
    );
    return response.data;
  },

  /**
   * Reject a pending adjustment with reason
   */
  async reject(id: string, data: RejectAdjustmentDto): Promise<SingleAdjustmentResponse> {
    const response = await apiClient.patch<SingleAdjustmentResponse>(
      `/inventory/adjustments/${id}/reject`,
      data
    );
    return response.data;
  },
};
