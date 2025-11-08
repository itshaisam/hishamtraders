import { apiClient } from '@/lib/api-client';
import {
  Product,
  CreateProductRequest,
  UpdateProductRequest,
  ProductListResponse,
  ProductDetailResponse,
  ProductFilters,
} from '../types/product.types';

export const productsService = {
  async getAll(filters?: ProductFilters): Promise<ProductListResponse> {
    const params = new URLSearchParams();
    if (filters?.search) params.append('search', filters.search);
    if (filters?.category) params.append('category', filters.category);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<ProductListResponse>(
      `/products?${params.toString()}`
    );
    return response.data;
  },

  async getById(id: string): Promise<ProductDetailResponse> {
    const response = await apiClient.get<ProductDetailResponse>(`/products/${id}`);
    return response.data;
  },

  async create(data: CreateProductRequest): Promise<ProductDetailResponse> {
    const response = await apiClient.post<ProductDetailResponse>('/products', data);
    return response.data;
  },

  async update(id: string, data: UpdateProductRequest): Promise<ProductDetailResponse> {
    const response = await apiClient.put<ProductDetailResponse>(`/products/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete(`/products/${id}`);
    return response.data;
  },
};
