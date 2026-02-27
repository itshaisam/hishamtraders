import { apiClient as api } from '@/lib/api-client';
import { GRNFilters, CreateGRNRequest, GRNListResponse, GRNDetailResponse, AddGRNCostRequest } from '../types/goods-receipt.types';

const BASE = '/goods-receipts';

export const goodsReceiptsService = {
  list: async (filters?: GRNFilters): Promise<GRNListResponse> => {
    const params = new URLSearchParams();
    if (filters?.search) params.set('search', filters.search);
    if (filters?.poId) params.set('poId', filters.poId);
    if (filters?.warehouseId) params.set('warehouseId', filters.warehouseId);
    if (filters?.supplierId) params.set('supplierId', filters.supplierId);
    if (filters?.status) params.set('status', filters.status);
    if (filters?.startDate) params.set('startDate', filters.startDate);
    if (filters?.endDate) params.set('endDate', filters.endDate);
    if (filters?.page) params.set('page', String(filters.page));
    if (filters?.limit) params.set('limit', String(filters.limit));

    const { data } = await api.get(`${BASE}?${params.toString()}`);
    return data;
  },

  getById: async (id: string): Promise<GRNDetailResponse> => {
    const { data } = await api.get(`${BASE}/${id}`);
    return data;
  },

  create: async (request: CreateGRNRequest): Promise<GRNDetailResponse> => {
    const { data } = await api.post(BASE, request);
    return data;
  },

  cancel: async (id: string): Promise<GRNDetailResponse> => {
    const { data } = await api.patch(`${BASE}/${id}/cancel`);
    return data;
  },

  addCost: async (grnId: string, request: AddGRNCostRequest) => {
    const { data } = await api.post(`${BASE}/${grnId}/costs`, request);
    return data;
  },

  getLandedCost: async (grnId: string) => {
    const { data } = await api.get(`${BASE}/${grnId}/landed-cost`);
    return data;
  },
};
