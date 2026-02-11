import { apiClient } from '../lib/api-client';
import {
  CreditNote,
  CreateCreditNoteDto,
  CreditNoteFilters,
  CreditNoteListResponse,
} from '../types/credit-note.types';

const BASE_URL = '/credit-notes';

export const creditNotesService = {
  getAll: async (filters?: CreditNoteFilters): Promise<CreditNoteListResponse> => {
    const params = new URLSearchParams();

    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.invoiceId) params.append('invoiceId', filters.invoiceId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

    const response = await apiClient.get<CreditNoteListResponse>(url);
    return response.data;
  },

  getById: async (id: string): Promise<CreditNote> => {
    const response = await apiClient.get<{ data: CreditNote }>(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  create: async (data: CreateCreditNoteDto): Promise<CreditNote> => {
    const response = await apiClient.post<{ data: CreditNote }>(BASE_URL, data);
    return response.data.data;
  },

  voidCreditNote: async (id: string, reason: string): Promise<CreditNote> => {
    const response = await apiClient.patch<{ data: CreditNote }>(`${BASE_URL}/${id}/void`, { reason });
    return response.data.data;
  },

  applyCreditNote: async (id: string): Promise<CreditNote> => {
    const response = await apiClient.patch<{ data: CreditNote }>(`${BASE_URL}/${id}/apply`, {});
    return response.data.data;
  },
};
