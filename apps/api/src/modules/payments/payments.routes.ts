import { Router } from 'express';
import { PaymentsController } from './payments.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();
const controller = new PaymentsController();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/payments
 * Get all payments (unified) with filters (Story 3.8)
 * Access: All authenticated users
 */
router.get('/', controller.getAllPayments);

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

/**
 * GET /api/payments/client
 * Get all client payments with optional client filter (Story 3.6)
 * Access: All authenticated users
 */
router.get('/client', controller.getAllClientPayments);

/**
 * POST /api/payments/client
 * Create a client payment (Story 3.6)
 * Access: ACCOUNTANT, ADMIN
 */
router.post(
  '/client',
  requireRole(['ACCOUNTANT', 'ADMIN']),
  controller.createClientPayment
);

/**
 * GET /api/payments/client/:clientId/history
 * Get payment history for a specific client (Story 3.6)
 * Access: All authenticated users
 */
router.get('/client/:clientId/history', controller.getClientPaymentHistory);

/**
 * GET /api/payments/client/:clientId/outstanding-invoices
 * Get outstanding invoices for a client (Story 3.6)
 * Access: All authenticated users
 */
router.get('/client/:clientId/outstanding-invoices', controller.getClientOutstandingInvoices);

/**
 * GET /api/payments/:id
 * Get payment details with allocations (Story 3.8)
 * Access: All authenticated users
 * NOTE: Must come AFTER all named routes to avoid matching "supplier"/"client" as :id
 */
router.get('/:id', controller.getPaymentDetails);

export { router as paymentsRoutes };
