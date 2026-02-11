import { useQuery } from '@tanstack/react-query';
import {
  reportsService,
  StockReportFilters,
  SalesReportFilters,
  PaymentReportFilters,
  ImportReportFilters,
  ExpenseReportFilters,
} from '../services/reportsService';

const STALE_5MIN = 300_000;

// Stock
export const useStockReport = (filters: StockReportFilters = {}) =>
  useQuery({
    queryKey: ['reports', 'stock', filters],
    queryFn: () => reportsService.getStockReport(filters),
    staleTime: STALE_5MIN,
  });

export const useStockValuation = () =>
  useQuery({
    queryKey: ['reports', 'stock-valuation'],
    queryFn: () => reportsService.getStockValuation(),
    staleTime: STALE_5MIN,
  });

// Sales
export const useSalesReport = (filters: SalesReportFilters) =>
  useQuery({
    queryKey: ['reports', 'sales', filters],
    queryFn: () => reportsService.getSalesReport(filters),
    staleTime: STALE_5MIN,
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });

export const useSalesByClient = (filters: { dateFrom: string; dateTo: string }) =>
  useQuery({
    queryKey: ['reports', 'sales-by-client', filters],
    queryFn: () => reportsService.getSalesByClient(filters),
    staleTime: STALE_5MIN,
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });

export const useSalesByProduct = (filters: { dateFrom: string; dateTo: string }) =>
  useQuery({
    queryKey: ['reports', 'sales-by-product', filters],
    queryFn: () => reportsService.getSalesByProduct(filters),
    staleTime: STALE_5MIN,
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });

// Payments
export const usePaymentCollections = (filters: PaymentReportFilters) =>
  useQuery({
    queryKey: ['reports', 'payments', filters],
    queryFn: () => reportsService.getPaymentCollections(filters),
    staleTime: STALE_5MIN,
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });

export const useReceivables = () =>
  useQuery({
    queryKey: ['reports', 'receivables'],
    queryFn: () => reportsService.getReceivables(),
    staleTime: STALE_5MIN,
  });

// Imports
export const useImportCostReport = (filters: ImportReportFilters = {}) =>
  useQuery({
    queryKey: ['reports', 'imports', filters],
    queryFn: () => reportsService.getImportCostReport(filters),
    staleTime: STALE_5MIN,
  });

// Expenses
export const useExpenseReport = (filters: ExpenseReportFilters) =>
  useQuery({
    queryKey: ['reports', 'expenses', filters],
    queryFn: () => reportsService.getExpenseReport(filters),
    staleTime: STALE_5MIN,
    enabled: !!filters.dateFrom && !!filters.dateTo,
  });

export const useExpensesTrend = () =>
  useQuery({
    queryKey: ['reports', 'expenses-trend'],
    queryFn: () => reportsService.getExpensesTrend(),
    staleTime: STALE_5MIN,
  });
