import { apiClient } from '../../../lib/api-client';
import {
  ProductVariant,
  CreateVariantDto,
  UpdateVariantDto,
  VariantFilterParams,
  VariantResponse,
  VariantsListResponse,
} from '../types/variant.types';

export const variantsService = {
  getVariants: async (filters: VariantFilterParams): Promise<VariantsListResponse> => {
    const params = new URLSearchParams();

    if (filters.productId) params.append('productId', filters.productId);
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<VariantsListResponse>(
      `/variants?${params.toString()}`
    );
    return response.data;
  },

  getVariantById: async (id: string): Promise<VariantResponse> => {
    const response = await apiClient.get<VariantResponse>(`/variants/${id}`);
    return response.data;
  },

  getVariantsByProductId: async (
    productId: string,
    status?: 'ACTIVE' | 'INACTIVE'
  ): Promise<{ success: boolean; data: ProductVariant[]; total: number }> => {
    const params = status ? `?status=${status}` : '';
    const response = await apiClient.get<{ success: boolean; data: ProductVariant[]; total: number }>(
      `/variants/product/${productId}${params}`
    );
    return response.data;
  },

  createVariant: async (data: CreateVariantDto): Promise<VariantResponse> => {
    const response = await apiClient.post<VariantResponse>('/variants', data);
    return response.data;
  },

  updateVariant: async (id: string, data: UpdateVariantDto): Promise<VariantResponse> => {
    const response = await apiClient.patch<VariantResponse>(`/variants/${id}`, data);
    return response.data;
  },

  deleteVariant: async (id: string): Promise<{ success: boolean; message: string }> => {
    const response = await apiClient.delete<{ success: boolean; message: string }>(
      `/variants/${id}`
    );
    return response.data;
  },
};
