import { apiClient } from '../lib/api-client';
import {
  PurchaseInvoice,
  CreatePurchaseInvoiceDto,
  PurchaseInvoiceFilters,
  PurchaseInvoiceListResponse,
  ThreeWayMatchResponse,
} from '../types/purchase-invoice.types';

const BASE_URL = '/purchase-invoices';

export const purchaseInvoiceService = {
  getAll: async (filters?: PurchaseInvoiceFilters): Promise<PurchaseInvoiceListResponse> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.supplierId) params.append('supplierId', filters.supplierId);
    if (filters?.poId) params.append('poId', filters.poId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

    const response = await apiClient.get<PurchaseInvoiceListResponse>(url);
    return response.data;
  },

  getById: async (id: string): Promise<PurchaseInvoice> => {
    const response = await apiClient.get<PurchaseInvoice>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreatePurchaseInvoiceDto): Promise<PurchaseInvoice> => {
    const response = await apiClient.post<PurchaseInvoice>(BASE_URL, data);
    return response.data;
  },

  getMatching: async (id: string): Promise<ThreeWayMatchResponse> => {
    const response = await apiClient.get<ThreeWayMatchResponse>(`${BASE_URL}/${id}/matching`);
    return response.data;
  },

  cancel: async (id: string, cancelReason: string): Promise<PurchaseInvoice> => {
    const response = await apiClient.patch<PurchaseInvoice>(`${BASE_URL}/${id}/cancel`, { cancelReason });
    return response.data;
  },
};
