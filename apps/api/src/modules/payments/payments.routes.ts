import { Router } from 'express';
import { PaymentsController } from './payments.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();
const controller = new PaymentsController();

// All routes require authentication
router.use(authenticate);

/**
 * POST /api/payments/supplier
 * Create a supplier payment
 * Access: ACCOUNTANT, ADMIN
 */
router.post(
  '/supplier',
  requireRole(['ACCOUNTANT', 'ADMIN']),
  controller.createSupplierPayment
);

/**
 * GET /api/payments/supplier
 * Get all supplier payments with filters
 * Access: All authenticated users (read-only for non-accountants)
 */
router.get('/supplier', controller.getSupplierPayments);

/**
 * GET /api/payments/supplier/:supplierId/history
 * Get payment history for a specific supplier
 * Access: All authenticated users
 */
router.get('/supplier/:supplierId/history', controller.getSupplierPaymentHistory);

/**
 * GET /api/payments/po/:poId/balance
 * Get PO outstanding balance
 * Access: All authenticated users
 */
router.get('/po/:poId/balance', controller.getPOBalance);

export { router as paymentsRoutes };
