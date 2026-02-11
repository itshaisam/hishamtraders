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

export { router as reportsRoutes };
