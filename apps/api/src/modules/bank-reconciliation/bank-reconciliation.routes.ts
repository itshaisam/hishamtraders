import { Router } from 'express';
import { BankReconciliationController } from './bank-reconciliation.controller.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();
const controller = new BankReconciliationController();

// All routes require ADMIN or ACCOUNTANT
router.use(requireRole(['ADMIN', 'ACCOUNTANT']));

// GET  /api/v1/bank-reconciliation         — list sessions
router.get('/', controller.getAll);

// POST /api/v1/bank-reconciliation         — create session
router.post('/', controller.create);

// GET  /api/v1/bank-reconciliation/:id     — get session detail
router.get('/:id', controller.getById);

// POST /api/v1/bank-reconciliation/:id/items — add statement item
router.post('/:id/items', controller.addItem);

// DELETE /api/v1/bank-reconciliation/:id/items/:itemId — delete statement item
router.delete('/:id/items/:itemId', controller.deleteItem);

// GET  /api/v1/bank-reconciliation/:id/unmatched — get unmatched system transactions
router.get('/:id/unmatched', controller.getUnmatchedTransactions);

// POST /api/v1/bank-reconciliation/:id/match    — match a statement item to journal line
router.post('/:id/match', controller.matchItem);

// POST /api/v1/bank-reconciliation/:id/unmatch  — unmatch a statement item
router.post('/:id/unmatch', controller.unmatchItem);

// POST /api/v1/bank-reconciliation/:id/complete — mark session as COMPLETED
router.post('/:id/complete', controller.complete);

export const bankReconciliationRoutes = router;
