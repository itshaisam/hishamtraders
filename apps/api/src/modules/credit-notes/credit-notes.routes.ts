import { Router } from 'express';
import { CreditNotesController } from './credit-notes.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/authorization.middleware.js';

const router = Router();
const controller = new CreditNotesController();

// All routes require authentication
router.use(authenticate);

/**
 * Get all credit notes with filters
 * Accessible by: All authenticated users
 */
router.get('/', controller.getCreditNotes);

/**
 * Get credit note by ID
 * Accessible by: All authenticated users
 */
router.get('/:id', controller.getCreditNoteById);

/**
 * Create credit note (sales return)
 * Accessible by: ADMIN, ACCOUNTANT only
 */
router.post(
  '/',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  controller.createCreditNote
);

/**
 * Void a credit note (reverse stock + balance)
 * Accessible by: ADMIN, ACCOUNTANT only
 */
router.patch(
  '/:id/void',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  controller.voidCreditNote
);

/**
 * Apply a credit note (bookkeeping status change)
 * Accessible by: ADMIN, ACCOUNTANT only
 */
router.patch(
  '/:id/apply',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  controller.applyCreditNote
);

export { router as creditNoteRoutes };
