import { apiClient } from '../lib/api-client';
import {
  Invoice,
  CreateInvoiceDto,
  InvoiceFilters,
  InvoiceListResponse,
} from '../types/invoice.types';

const BASE_URL = '/invoices';

export const invoicesService = {
  /**
   * Get all invoices with filters
   */
  getInvoices: async (filters?: InvoiceFilters): Promise<InvoiceListResponse> => {
    const params = new URLSearchParams();

    if (filters?.clientId) params.append('clientId', filters.clientId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.startDate) params.append('startDate', filters.startDate);
    if (filters?.endDate) params.append('endDate', filters.endDate);
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());

    const queryString = params.toString();
    const url = queryString ? `${BASE_URL}?${queryString}` : BASE_URL;

    const response = await apiClient.get<InvoiceListResponse>(url);
    return response.data;
  },

  /**
   * Get invoice by ID
   */
  getInvoiceById: async (id: string): Promise<Invoice> => {
    const response = await apiClient.get<{ data: Invoice }>(`${BASE_URL}/${id}`);
    return response.data.data;
  },

  /**
   * Create new invoice
   */
  createInvoice: async (data: CreateInvoiceDto): Promise<Invoice> => {
    const response = await apiClient.post<{ data: Invoice }>(BASE_URL, data);
    return response.data.data;
  },
};
