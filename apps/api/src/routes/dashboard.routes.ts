import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireRole } from '../middleware/role.middleware.js';

const router = Router();
const dashboardController = new DashboardController();

// All routes require authentication
router.use(authenticate);

// Admin-only stats
router.get('/admin/stats', requireRole(['ADMIN']), dashboardController.getAdminStats);

// Warehouse Manager stats
router.get('/warehouse/stats', requireRole(['ADMIN', 'WAREHOUSE_MANAGER']), dashboardController.getWarehouseStats);

// Sales Officer stats
router.get('/sales/stats', requireRole(['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT']), dashboardController.getSalesStats);

// Accountant stats
router.get('/accountant/stats', requireRole(['ADMIN', 'ACCOUNTANT']), dashboardController.getAccountantStats);

// Recovery Agent stats
router.get('/recovery/stats', requireRole(['ADMIN', 'RECOVERY_AGENT']), dashboardController.getRecoveryStats);

export default router;
