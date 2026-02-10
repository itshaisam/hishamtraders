import { Router } from 'express';
import { expenseController } from './expenses.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/expenses - Get all expenses (all roles can view)
router.get('/', expenseController.getAll.bind(expenseController));

// GET /api/expenses/:id - Get expense by ID (all roles can view)
router.get('/:id', expenseController.getById.bind(expenseController));

// POST /api/expenses - Create expense (Admin & Accountant only)
router.post(
  '/',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  expenseController.create.bind(expenseController)
);

// PUT /api/expenses/:id - Update expense (Admin & Accountant only)
router.put(
  '/:id',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  expenseController.update.bind(expenseController)
);

// DELETE /api/expenses/:id - Delete expense (Admin & Accountant only)
router.delete(
  '/:id',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  expenseController.delete.bind(expenseController)
);

export { router as expenseRoutes };
