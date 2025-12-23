import { apiClient } from '@/lib/api-client';
import {
  InventoryFilters,
  InventoryResponse,
  InventoryItem,
  LowStockResponse,
  AvailableQuantityResponse,
  GroupedInventoryResponse,
} from '../types/inventory.types';

export const inventoryService = {
  /**
   * Get all inventory with optional filters
   */
  async getAll(filters?: InventoryFilters): Promise<InventoryResponse> {
    const params = new URLSearchParams();

    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<InventoryResponse>(`/inventory?${params.toString()}`);
    return response.data;
  },

  /**
   * Get inventory for a specific product across all warehouses
   */
  async getByProduct(productId: string): Promise<{ success: boolean; data: InventoryItem[] }> {
    const response = await apiClient.get<{ success: boolean; data: InventoryItem[] }>(
      `/inventory/product/${productId}`
    );
    return response.data;
  },

  /**
   * Get all inventory in a specific warehouse
   */
  async getByWarehouse(
    warehouseId: string
  ): Promise<{ success: boolean; data: InventoryItem[] }> {
    const response = await apiClient.get<{ success: boolean; data: InventoryItem[] }>(
      `/inventory/warehouse/${warehouseId}`
    );
    return response.data;
  },

  /**
   * Get all low stock items
   */
  async getLowStock(): Promise<LowStockResponse> {
    const response = await apiClient.get<LowStockResponse>('/inventory/low-stock');
    return response.data;
  },

  /**
   * Get available quantity for a product
   */
  async getAvailableQuantity(
    productId: string,
    productVariantId?: string,
    warehouseId?: string
  ): Promise<AvailableQuantityResponse> {
    const params = new URLSearchParams();
    if (productVariantId) params.append('productVariantId', productVariantId);
    if (warehouseId) params.append('warehouseId', warehouseId);

    const response = await apiClient.get<AvailableQuantityResponse>(
      `/inventory/available/${productId}?${params.toString()}`
    );
    return response.data;
  },

  /**
   * Get inventory grouped by product and warehouse with batch details
   */
  async getAllGrouped(filters?: InventoryFilters): Promise<GroupedInventoryResponse> {
    const params = new URLSearchParams();

    if (filters?.productId) params.append('productId', filters.productId);
    if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const response = await apiClient.get<GroupedInventoryResponse>(`/inventory/grouped?${params.toString()}`);
    return response.data;
  },
};
