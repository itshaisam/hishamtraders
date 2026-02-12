import { Router } from 'express';
import { accountHeadController } from './account-heads.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/v1/account-heads/tree - Get tree view (all roles can view)
router.get('/tree', accountHeadController.getTree.bind(accountHeadController));

// GET /api/v1/account-heads - Get all account heads (all roles can view)
router.get('/', accountHeadController.getAll.bind(accountHeadController));

// GET /api/v1/account-heads/:id - Get account head by ID (all roles can view)
router.get('/:id', accountHeadController.getById.bind(accountHeadController));

// POST /api/v1/account-heads - Create account head (Admin & Accountant only)
router.post(
  '/',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  accountHeadController.create.bind(accountHeadController)
);

// PUT /api/v1/account-heads/:id - Update account head (Admin & Accountant only)
router.put(
  '/:id',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  accountHeadController.update.bind(accountHeadController)
);

// DELETE /api/v1/account-heads/:id - Delete account head (Admin only)
router.delete(
  '/:id',
  requireRole(['ADMIN']),
  accountHeadController.delete.bind(accountHeadController)
);

export { router as accountHeadRoutes };
