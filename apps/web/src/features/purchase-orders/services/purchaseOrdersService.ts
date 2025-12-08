import { apiClient } from '@/lib/api-client';
import {
  PurchaseOrder,
  CreatePurchaseOrderRequest,
  UpdatePurchaseOrderRequest,
  UpdatePOStatusRequest,
  PurchaseOrderFilters,
  PurchaseOrderListResponse,
  PurchaseOrderResponse,
  PurchaseOrderStatistics,
  AddPOCostRequest,
  POCost,
  LandedCostResult,
  UpdateImportDetailsRequest,
  ReceiveGoodsRequest,
  CanReceiveResponse,
} from '../types/purchase-order.types';

const BASE_URL = '/purchase-orders';

export const purchaseOrdersService = {
  /**
   * Get all purchase orders with pagination and filters
   */
  async getAll(
    filters?: PurchaseOrderFilters
  ): Promise<PurchaseOrderListResponse> {
    const response = await apiClient.get<PurchaseOrderListResponse>(BASE_URL, {
      params: filters,
    });
    return response.data;
  },

  /**
   * Get a specific purchase order by ID
   */
  async getById(id: string): Promise<PurchaseOrderResponse> {
    const response = await apiClient.get<PurchaseOrderResponse>(
      `${BASE_URL}/${id}`
    );
    return response.data;
  },

  /**
   * Create a new purchase order
   */
  async create(
    data: CreatePurchaseOrderRequest
  ): Promise<PurchaseOrderResponse> {
    const response = await apiClient.post<PurchaseOrderResponse>(
      BASE_URL,
      data
    );
    return response.data;
  },

  /**
   * Update a purchase order
   */
  async update(
    id: string,
    data: UpdatePurchaseOrderRequest
  ): Promise<PurchaseOrderResponse> {
    const response = await apiClient.patch<PurchaseOrderResponse>(
      `${BASE_URL}/${id}`,
      data
    );
    return response.data;
  },

  /**
   * Update purchase order status
   */
  async updateStatus(
    id: string,
    statusData: UpdatePOStatusRequest
  ): Promise<PurchaseOrderResponse> {
    const response = await apiClient.patch<PurchaseOrderResponse>(
      `${BASE_URL}/${id}/status`,
      statusData
    );
    return response.data;
  },

  /**
   * Delete a purchase order
   */
  async delete(id: string): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.delete<{
      success: boolean;
      message: string;
    }>(`${BASE_URL}/${id}`);
    return response.data;
  },

  /**
   * Get purchase order statistics
   */
  async getStatistics(): Promise<{
    success: boolean;
    data: PurchaseOrderStatistics;
  }> {
    const response = await apiClient.get<{
      success: boolean;
      data: PurchaseOrderStatistics;
    }>(`${BASE_URL}/statistics`);
    return response.data;
  },

  /**
   * Add a cost to a purchase order
   * Story 2.3
   */
  async addCost(
    poId: string,
    data: AddPOCostRequest
  ): Promise<{ success: boolean; data: POCost; message: string }> {
    const response = await apiClient.post<{
      success: boolean;
      data: POCost;
      message: string;
    }>(`${BASE_URL}/${poId}/costs`, data);
    return response.data;
  },

  /**
   * Get landed cost calculation for a purchase order
   * Story 2.3
   */
  async getLandedCost(
    poId: string
  ): Promise<{ success: boolean; data: LandedCostResult }> {
    const response = await apiClient.get<{
      success: boolean;
      data: LandedCostResult;
    }>(`${BASE_URL}/${poId}/landed-cost`);
    return response.data;
  },

  /**
   * Update import details for a purchase order
   * Story 2.3
   */
  async updateImportDetails(
    poId: string,
    data: UpdateImportDetailsRequest
  ): Promise<PurchaseOrderResponse> {
    const response = await apiClient.patch<PurchaseOrderResponse>(
      `${BASE_URL}/${poId}/import-details`,
      data
    );
    return response.data;
  },

  /**
   * Check if purchase order can be received
   * Story 2.6
   */
  async canReceive(
    poId: string
  ): Promise<{ success: boolean; data: CanReceiveResponse }> {
    const response = await apiClient.get<{
      success: boolean;
      data: CanReceiveResponse;
    }>(`${BASE_URL}/${poId}/can-receive`);
    return response.data;
  },

  /**
   * Receive goods from purchase order
   * Story 2.6
   */
  async receiveGoods(
    poId: string,
    data: ReceiveGoodsRequest
  ): Promise<{ success: boolean; message: string }> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
    }>(`${BASE_URL}/${poId}/receive`, data);
    return response.data;
  },
};
