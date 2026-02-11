import { apiClient } from '../lib/api-client';

// ---- Stock Reports ----
export interface StockReportFilters {
  warehouseId?: string;
  categoryId?: string;
  status?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  page?: number;
  limit?: number;
}

export interface StockReportRow {
  productId: string;
  sku: string;
  productName: string;
  categoryName: string;
  warehouseName: string;
  quantity: number;
  reorderLevel: number;
  costPrice: number;
  value: number;
  status: string;
}

export interface StockReportResponse {
  data: StockReportRow[];
  summary: { totalItems: number; totalValue: number };
  meta: { total: number; page: number; limit: number; totalPages: number };
}

export interface StockValuationRow {
  categoryId: string;
  categoryName: string;
  totalQuantity: number;
  totalValue: number;
  percentage: number;
}

// ---- Sales Reports ----
export interface SalesReportFilters {
  dateFrom: string;
  dateTo: string;
  clientId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface SalesReportRow {
  id: string;
  invoiceNumber: string;
  invoiceDate: string;
  clientName: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  outstanding: number;
  status: string;
}

export interface SalesReportSummary {
  totalInvoices: number;
  totalAmount: number;
  totalPaid: number;
  totalOutstanding: number;
}

export interface SalesByClientRow {
  clientId: string;
  clientName: string;
  invoiceCount: number;
  revenue: number;
}

export interface SalesByProductRow {
  productId: string;
  productName: string;
  sku: string;
  qtySold: number;
  revenue: number;
}

// ---- Payment Reports ----
export interface PaymentReportFilters {
  dateFrom: string;
  dateTo: string;
  clientId?: string;
  method?: string;
  page?: number;
  limit?: number;
}

export interface PaymentCollectionRow {
  id: string;
  date: string;
  clientName: string;
  amount: number;
  method: string;
  referenceNumber: string | null;
  notes: string | null;
}

export interface PaymentCollectionSummary {
  totalCollected: number;
  count: number;
  byMethod: { method: string; total: number; count: number }[];
}

export interface ReceivableRow {
  clientId: string;
  clientName: string;
  balance: number;
  creditLimit: number;
  overdueAmount: number;
  oldestDueDate: string | null;
  daysPastDue: number;
}

// ---- Import Reports ----
export interface ImportReportFilters {
  dateFrom?: string;
  dateTo?: string;
  supplierId?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface ImportCostRow {
  id: string;
  poNumber: string;
  orderDate: string;
  supplierName: string;
  productCost: number;
  shipping: number;
  customs: number;
  tax: number;
  other: number;
  totalLanded: number;
  status: string;
}

export interface ImportReportSummary {
  totalPOs: number;
  totalProductCost: number;
  totalShipping: number;
  totalCustoms: number;
  totalTax: number;
  totalOther: number;
  totalLanded: number;
}

// ---- Expense Reports ----
export interface ExpenseReportFilters {
  dateFrom: string;
  dateTo: string;
  category?: string;
  page?: number;
  limit?: number;
}

export interface ExpenseReportRow {
  id: string;
  date: string;
  category: string;
  description: string;
  amount: number;
  paymentMethod: string;
  recordedBy: string;
}

export interface ExpenseReportSummary {
  totalExpenses: number;
  count: number;
  average: number;
}

export interface ExpenseTrendRow {
  month: string;
  total: number;
}

// ---- Service ----
export const reportsService = {
  // Stock
  async getStockReport(filters: StockReportFilters = {}) {
    const params = new URLSearchParams();
    if (filters.warehouseId) params.append('warehouseId', filters.warehouseId);
    if (filters.categoryId) params.append('categoryId', filters.categoryId);
    if (filters.status && filters.status !== 'all') params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    const res = await apiClient.get<{ success: boolean; data: StockReportRow[]; summary: StockReportResponse['summary']; meta: StockReportResponse['meta'] }>(`/reports/stock?${params}`);
    return res.data;
  },

  async getStockValuation() {
    const res = await apiClient.get<{ success: boolean; data: StockValuationRow[] }>('/reports/stock-valuation');
    return res.data;
  },

  // Sales
  async getSalesReport(filters: SalesReportFilters) {
    const params = new URLSearchParams();
    params.append('dateFrom', filters.dateFrom);
    params.append('dateTo', filters.dateTo);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    const res = await apiClient.get<{ success: boolean; data: SalesReportRow[]; summary: SalesReportSummary; meta: StockReportResponse['meta'] }>(`/reports/sales?${params}`);
    return res.data;
  },

  async getSalesByClient(filters: { dateFrom: string; dateTo: string }) {
    const params = new URLSearchParams();
    params.append('dateFrom', filters.dateFrom);
    params.append('dateTo', filters.dateTo);
    const res = await apiClient.get<{ success: boolean; data: SalesByClientRow[] }>(`/reports/sales-by-client?${params}`);
    return res.data;
  },

  async getSalesByProduct(filters: { dateFrom: string; dateTo: string }) {
    const params = new URLSearchParams();
    params.append('dateFrom', filters.dateFrom);
    params.append('dateTo', filters.dateTo);
    const res = await apiClient.get<{ success: boolean; data: SalesByProductRow[] }>(`/reports/sales-by-product?${params}`);
    return res.data;
  },

  // Payments
  async getPaymentCollections(filters: PaymentReportFilters) {
    const params = new URLSearchParams();
    params.append('dateFrom', filters.dateFrom);
    params.append('dateTo', filters.dateTo);
    if (filters.clientId) params.append('clientId', filters.clientId);
    if (filters.method) params.append('method', filters.method);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    const res = await apiClient.get<{ success: boolean; data: PaymentCollectionRow[]; summary: PaymentCollectionSummary; meta: StockReportResponse['meta'] }>(`/reports/payments?${params}`);
    return res.data;
  },

  async getReceivables() {
    const res = await apiClient.get<{ success: boolean; data: ReceivableRow[] }>('/reports/receivables');
    return res.data;
  },

  // Imports
  async getImportCostReport(filters: ImportReportFilters = {}) {
    const params = new URLSearchParams();
    if (filters.dateFrom) params.append('dateFrom', filters.dateFrom);
    if (filters.dateTo) params.append('dateTo', filters.dateTo);
    if (filters.supplierId) params.append('supplierId', filters.supplierId);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    const res = await apiClient.get<{ success: boolean; data: ImportCostRow[]; summary: ImportReportSummary; meta: StockReportResponse['meta'] }>(`/reports/imports?${params}`);
    return res.data;
  },

  // Expenses
  async getExpenseReport(filters: ExpenseReportFilters) {
    const params = new URLSearchParams();
    params.append('dateFrom', filters.dateFrom);
    params.append('dateTo', filters.dateTo);
    if (filters.category) params.append('category', filters.category);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    const res = await apiClient.get<{ success: boolean; data: ExpenseReportRow[]; summary: ExpenseReportSummary; meta: StockReportResponse['meta'] }>(`/reports/expenses?${params}`);
    return res.data;
  },

  async getExpensesTrend() {
    const res = await apiClient.get<{ success: boolean; data: ExpenseTrendRow[] }>('/reports/expenses-trend');
    return res.data;
  },
};
