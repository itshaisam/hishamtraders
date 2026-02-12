import { Router } from 'express';
import { journalEntryController } from './journal-entries.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/journal-entries - List all journal entries (Admin & Accountant)
router.get(
  '/',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  journalEntryController.getAll.bind(journalEntryController)
);

// GET /api/v1/journal-entries/:id - Get by ID (Admin & Accountant)
router.get(
  '/:id',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  journalEntryController.getById.bind(journalEntryController)
);

// POST /api/v1/journal-entries - Create draft entry (Admin & Accountant)
router.post(
  '/',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  journalEntryController.create.bind(journalEntryController)
);

// PUT /api/v1/journal-entries/:id - Update draft entry (Admin & Accountant)
router.put(
  '/:id',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  journalEntryController.update.bind(journalEntryController)
);

// POST /api/v1/journal-entries/:id/post - Post entry (Admin & Accountant)
router.post(
  '/:id/post',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  journalEntryController.post.bind(journalEntryController)
);

// DELETE /api/v1/journal-entries/:id - Delete draft entry (Admin only)
router.delete(
  '/:id',
  requireRole(['ADMIN']),
  journalEntryController.delete.bind(journalEntryController)
);

export { router as journalEntryRoutes };
