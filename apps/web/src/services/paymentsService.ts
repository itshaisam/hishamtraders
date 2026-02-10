import { apiClient } from '@/lib/api-client';
import {
  CreateSupplierPaymentDto,
  CreateClientPaymentDto,
  PaymentFilters,
  PaginatedPaymentsResponse,
  PaymentsResponse,
  POBalanceResponse,
  UnifiedPaymentFilters,
  UnifiedPaymentsResponse,
  PaymentDetail,
  CashFlowReport,
} from '../types/payment.types';

export const paymentsService = {
  /**
   * Create a supplier payment
   */
  createSupplierPayment: async (data: CreateSupplierPaymentDto) => {
    const response = await apiClient.post('/payments/supplier', data);
    return response.data;
  },

  /**
   * Get all supplier payments with filters and pagination
   */
  getSupplierPayments: async (filters: PaymentFilters): Promise<PaginatedPaymentsResponse> => {
    const params: any = {};

    if (filters.supplierId) {
      params.supplierId = filters.supplierId;
    }

    if (filters.method) {
      params.method = filters.method;
    }

    if (filters.paymentReferenceType) {
      params.paymentReferenceType = filters.paymentReferenceType;
    }

    if (filters.dateFrom) {
      params.dateFrom = filters.dateFrom;
    }

    if (filters.dateTo) {
      params.dateTo = filters.dateTo;
    }

    if (filters.page) {
      params.page = filters.page;
    }

    if (filters.limit) {
      params.limit = filters.limit;
    }

    const response = await apiClient.get('/payments/supplier', { params });
    return response.data;
  },

  /**
   * Get payment history for a specific supplier
   */
  getSupplierPaymentHistory: async (supplierId: string): Promise<PaymentsResponse> => {
    const response = await apiClient.get(`/payments/supplier/${supplierId}/history`);
    return response.data;
  },

  /**
   * Get PO outstanding balance
   */
  getPOBalance: async (poId: string): Promise<POBalanceResponse> => {
    const response = await apiClient.get(`/payments/po/${poId}/balance`);
    return response.data;
  },

  /**
   * Create a client payment (Story 3.6)
   */
  createClientPayment: async (data: CreateClientPaymentDto) => {
    const response = await apiClient.post('/payments/client', data);
    return response.data;
  },

  /**
   * Get payment history for a specific client (Story 3.6)
   */
  getClientPaymentHistory: async (clientId: string): Promise<PaymentsResponse> => {
    const response = await apiClient.get(`/payments/client/${clientId}/history`);
    return response.data;
  },

  /**
   * Get outstanding invoices for a client (Story 3.6)
   */
  getClientOutstandingInvoices: async (clientId: string) => {
    const response = await apiClient.get(`/payments/client/${clientId}/outstanding-invoices`);
    return response.data;
  },

  /**
   * Get all client payments with optional client filter (Story 3.6)
   */
  getAllClientPayments: async (clientId?: string) => {
    const response = await apiClient.get('/payments/client', {
      params: clientId ? { clientId } : {},
    });
    return response.data;
  },

  /**
   * Get all payments (unified) with filters (Story 3.8)
   */
  getAllPayments: async (filters: UnifiedPaymentFilters): Promise<UnifiedPaymentsResponse> => {
    const params: Record<string, string> = {};
    if (filters.paymentType && filters.paymentType !== 'ALL') params.paymentType = filters.paymentType;
    if (filters.method) params.method = filters.method;
    if (filters.dateFrom) params.dateFrom = filters.dateFrom;
    if (filters.dateTo) params.dateTo = filters.dateTo;
    if (filters.search) params.search = filters.search;
    if (filters.page) params.page = filters.page.toString();
    if (filters.limit) params.limit = filters.limit.toString();

    const response = await apiClient.get('/payments', { params });
    return response.data;
  },

  /**
   * Get payment details by ID (Story 3.8)
   */
  getPaymentDetails: async (id: string): Promise<{ success: boolean; data: PaymentDetail }> => {
    const response = await apiClient.get(`/payments/${id}`);
    return response.data;
  },

  /**
   * Get cash flow report (Story 3.8)
   */
  getCashFlowReport: async (dateFrom?: string, dateTo?: string): Promise<{ success: boolean; data: CashFlowReport }> => {
    const params: Record<string, string> = {};
    if (dateFrom) params.dateFrom = dateFrom;
    if (dateTo) params.dateTo = dateTo;
    const response = await apiClient.get('/reports/cash-flow', { params });
    return response.data;
  },
};
