import { Router } from 'express';
import { ReportsController } from './reports.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new ReportsController();

// All report routes require authentication
router.use(authenticate);

// Credit limit reports
router.get('/credit-limits', controller.getCreditLimits);
router.get('/credit-limits/summary', controller.getCreditLimitSummary);

// Tax reports (Story 3.5)
router.get('/tax-summary', controller.getTaxSummary);

// Expense summary (Story 3.7) — existing
router.get('/expense-summary', controller.getExpenseSummary);

// Cash flow report (Story 3.8)
router.get('/cash-flow', controller.getCashFlow);

// Stock reports (Story 4.4)
router.get('/stock', controller.getStockReport);
router.get('/stock-valuation', controller.getStockValuation);

// Sales reports (Story 4.5)
router.get('/sales', controller.getSalesReport);
router.get('/sales-by-client', controller.getSalesByClient);
router.get('/sales-by-product', controller.getSalesByProduct);

// Payment reports (Story 4.6)
router.get('/payments', controller.getPaymentCollections);
router.get('/receivables', controller.getReceivables);

// Import reports (Story 4.7)
router.get('/imports', controller.getImportCostReport);

// Expense reports (Story 4.8)
router.get('/expenses', controller.getExpenseReport);
router.get('/expenses-trend', controller.getExpensesTrend);

// Accounting reports (Epic 5)
router.get('/trial-balance', controller.getTrialBalance);
router.get('/balance-sheet', controller.getBalanceSheet);
router.get('/general-ledger', controller.getGeneralLedger);

// Gate pass reports (Story 6.10)
router.get('/gate-passes/summary', controller.getGatePassSummary);
router.get('/gate-passes', controller.getGatePassActivity);

// Aging analysis (Story 7.3)
router.get('/aging-analysis', controller.getAgingAnalysis);
router.get('/aging-analysis/export', controller.exportAgingAnalysis);

// Collection efficiency (Story 7.8)
router.get('/collection-efficiency', controller.getCollectionEfficiency);
router.get('/collection-efficiency/trend', controller.getCollectionEfficiencyTrend);

// Recovery reports (Story 7.9)
router.get('/recovery/visits', controller.getVisitActivityReport);
router.get('/recovery/collections', controller.getCollectionSummaryReport);
router.get('/recovery/overdue', controller.getOverdueClientsReport);
router.get('/recovery/productivity', controller.getAgentProductivityReport);

// Sales Order, Delivery Note, Purchase Invoice reports (Story 10.10)
router.get('/sales-orders', controller.getSalesOrderReport);
router.get('/delivery-notes', controller.getDeliveryNoteReport);
router.get('/purchase-invoice-aging', controller.getPurchaseInvoiceAging);
router.get('/dashboard/sales-order-stats', controller.getSalesOrderStats);
router.get('/dashboard/delivery-note-stats', controller.getDeliveryNoteStats);
router.get('/dashboard/purchase-invoice-outstanding', controller.getPurchaseInvoiceOutstanding);

// Excel export routes (Story 4.9)
router.get('/stock/export', controller.exportStockReport);
router.get('/stock-valuation/export', controller.exportStockValuation);
router.get('/sales/export', controller.exportSalesReport);
router.get('/sales-by-client/export', controller.exportSalesByClient);
router.get('/sales-by-product/export', controller.exportSalesByProduct);
router.get('/payments/export', controller.exportPaymentCollections);
router.get('/receivables/export', controller.exportReceivables);
router.get('/imports/export', controller.exportImportCostReport);
router.get('/expenses/export', controller.exportExpenseReport);
router.get('/expenses-by-category/export', controller.exportExpensesByCategory);

export { router as reportsRoutes };
