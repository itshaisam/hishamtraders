import { Router } from 'express';
import { InvoicesController } from './invoices.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/authorization.middleware.js';

const router = Router();
const controller = new InvoicesController();

/**
 * Public route: Get invoice PDF via share token (no auth required)
 * This MUST be defined before the authenticate middleware
 */
router.get('/public/:token', controller.getPublicPdf);

// All remaining routes require authentication
router.use(authenticate);

/**
 * Get all invoices with filters
 * Accessible by: All authenticated users
 */
router.get('/', controller.getInvoices);

/**
 * Get returnable quantities for invoice items (accounts for previous returns)
 * Accessible by: All authenticated users
 */
router.get('/:id/returnable', controller.getReturnableQuantities);

/**
 * Get invoice by ID
 * Accessible by: All authenticated users
 */
router.get('/:id', controller.getInvoiceById);

/**
 * Void an invoice (Story 3.4)
 * Accessible by: ADMIN, ACCOUNTANT only
 */
router.patch(
  '/:id/void',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  controller.voidInvoice
);

/**
 * Create invoice
 * Accessible by: SALES_OFFICER, ACCOUNTANT, ADMIN
 */
router.post(
  '/',
  requireRole(['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT']),
  controller.createInvoice
);

/**
 * Generate a shareable PDF link for an invoice
 * Accessible by: All authenticated users
 */
router.post('/:id/share-token', controller.generateShareToken);

export { router as invoiceRoutes };
