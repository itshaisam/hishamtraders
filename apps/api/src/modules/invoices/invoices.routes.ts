import { Router } from 'express';
import { InvoicesController } from './invoices.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/authorization.middleware.js';

const router = Router();
const controller = new InvoicesController();

// All routes require authentication
router.use(authenticate);

/**
 * Get all invoices with filters
 * Accessible by: All authenticated users
 */
router.get('/', controller.getInvoices);

/**
 * Get invoice by ID
 * Accessible by: All authenticated users
 */
router.get('/:id', controller.getInvoiceById);

/**
 * Create invoice
 * Accessible by: SALES_OFFICER, ACCOUNTANT, ADMIN
 */
router.post(
  '/',
  requireRole(['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT']),
  controller.createInvoice
);

export { router as invoiceRoutes };
