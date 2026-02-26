import { apiClient } from '../lib/api-client';
import {
  DeliveryNote,
  CreateDeliveryNoteDto,
  DeliveryNoteFilters,
  DeliveryNoteListResponse,
} from '../types/delivery-note.types';

const BASE_URL = '/delivery-notes';

export const deliveryNoteService = {
  getAll: async (filters?: DeliveryNoteFilters): Promise<DeliveryNoteListResponse> => {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.salesOrderId) params.append('salesOrderId', filters.salesOrderId);
    if (filters?.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters?.dateTo) params.append('dateTo', filters.dateTo);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

    const response = await apiClient.get<DeliveryNoteListResponse>(url);
    return response.data;
  },

  getById: async (id: string): Promise<DeliveryNote> => {
    const response = await apiClient.get<DeliveryNote>(`${BASE_URL}/${id}`);
    return response.data;
  },

  create: async (data: CreateDeliveryNoteDto): Promise<DeliveryNote> => {
    const response = await apiClient.post<DeliveryNote>(BASE_URL, data);
    return response.data;
  },

  dispatch: async (id: string): Promise<DeliveryNote> => {
    const response = await apiClient.patch<DeliveryNote>(`${BASE_URL}/${id}/dispatch`);
    return response.data;
  },

  deliver: async (id: string): Promise<DeliveryNote> => {
    const response = await apiClient.patch<DeliveryNote>(`${BASE_URL}/${id}/deliver`);
    return response.data;
  },

  cancel: async (id: string, cancelReason: string): Promise<DeliveryNote> => {
    const response = await apiClient.patch<DeliveryNote>(`${BASE_URL}/${id}/cancel`, { cancelReason });
    return response.data;
  },
};
