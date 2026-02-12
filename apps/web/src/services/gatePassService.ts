import { apiClient } from '../lib/api-client';
import {
  GatePass,
  GatePassListResponse,
  GatePassFilters,
  CreateGatePassDto,
} from '../types/gate-pass.types';

const BASE_URL = '/gate-passes';

export const gatePassService = {
  getAll: async (filters?: GatePassFilters): Promise<GatePassListResponse> => {
    const params = new URLSearchParams();
    if (filters?.warehouseId) params.append('warehouseId', filters.warehouseId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.purpose) params.append('purpose', filters.purpose);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', String(filters.page));
    if (filters?.limit) params.append('limit', String(filters.limit));

    const queryString = params.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;
    const response = await apiClient.get<GatePassListResponse>(url);
    return response.data;
  },

  getById: async (id: string): Promise<GatePass> => {
    const response = await apiClient.get<{ data: GatePass }>(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  create: async (data: CreateGatePassDto): Promise<GatePass> => {
    const response = await apiClient.post<{ data: GatePass }>(BASE_URL, data);
    return response.data.data;
  },

  approve: async (id: string): Promise<GatePass> => {
    const response = await apiClient.put<{ data: GatePass }>(`${BASE_URL}/${id}/approve`);
    return response.data.data;
  },

  dispatch: async (id: string): Promise<GatePass> => {
    const response = await apiClient.put<{ data: GatePass }>(`${BASE_URL}/${id}/dispatch`);
    return response.data.data;
  },

  complete: async (id: string): Promise<GatePass> => {
    const response = await apiClient.put<{ data: GatePass }>(`${BASE_URL}/${id}/complete`);
    return response.data.data;
  },

  cancel: async (id: string, reason: string): Promise<GatePass> => {
    const response = await apiClient.put<{ data: GatePass }>(`${BASE_URL}/${id}/cancel`, { reason });
    return response.data.data;
  },

  updateWarehouseGatePassConfig: async (warehouseId: string, gatePassMode: string): Promise<any> => {
    const response = await apiClient.put(`/warehouses/${warehouseId}/gate-pass-config`, { gatePassMode });
    return response.data.data;
  },
};
