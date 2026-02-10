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

// Expense reports (Story 3.7)
router.get('/expense-summary', controller.getExpenseSummary);

// Cash flow report (Story 3.8)
router.get('/cash-flow', controller.getCashFlow);

export { router as reportsRoutes };
