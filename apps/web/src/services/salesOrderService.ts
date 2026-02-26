import { apiClient } from '../lib/api-client';
import {
  SalesOrder,
  CreateSalesOrderDto,
  SalesOrderFilters,
  SalesOrderListResponse,
} from '../types/sales-order.types';

const BASE_URL = '/sales-orders';

export const salesOrderService = {
  getAll: async (filters?: SalesOrderFilters): Promise<SalesOrderListResponse> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

    const response = await apiClient.get<SalesOrderListResponse>(url);
    return response.data;
  },

  getById: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.get<SalesOrder>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateSalesOrderDto): Promise<SalesOrder> => {
    const response = await apiClient.post<SalesOrder>(BASE_URL, data);
    return response.data;
  },

  confirm: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.patch<SalesOrder>(`${BASE_URL}/${id}/confirm`);
    return response.data;
  },

  cancel: async (id: string, cancelReason: string): Promise<SalesOrder> => {
    const response = await apiClient.patch<SalesOrder>(`${BASE_URL}/${id}/cancel`, { cancelReason });
    return response.data;
  },

  close: async (id: string): Promise<SalesOrder> => {
    const response = await apiClient.patch<SalesOrder>(`${BASE_URL}/${id}/close`);
    return response.data;
  },

  getDeliverableItems: async (id: string): Promise<any> => {
    const response = await apiClient.get(`${BASE_URL}/${id}/deliverable-items`);
    return response.data;
  },

  getInvoiceableItems: async (id: string): Promise<any> => {
    const response = await apiClient.get(`${BASE_URL}/${id}/invoiceable-items`);
    return response.data;
  },
};
