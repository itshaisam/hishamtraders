import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { suppliersController } from './suppliers.controller.js';
import { auditSupplierAction } from './suppliers.middleware.js';

const router = Router();

// POST /api/suppliers - Create supplier (Admin, Accountant)
router.post(
  '/',
  authenticate,
  requirePermission('suppliers', 'create'),
  auditSupplierAction('CREATE'),
  (req, res, next) => suppliersController.create(req, res, next)
);

// GET /api/suppliers - List suppliers (All authenticated users)
router.get(
  '/',
  authenticate,
  (req, res, next) => suppliersController.getAll(req, res, next)
);

// GET /api/suppliers/:id - Get supplier details (All authenticated users)
router.get(
  '/:id',
  authenticate,
  (req, res, next) => suppliersController.getById(req, res, next)
);

// PUT /api/suppliers/:id - Update supplier (Admin, Accountant)
router.put(
  '/:id',
  authenticate,
  requirePermission('suppliers', 'update'),
  auditSupplierAction('UPDATE'),
  (req, res, next) => suppliersController.update(req, res, next)
);

// DELETE /api/suppliers/:id - Delete supplier (Admin)
router.delete(
  '/:id',
  authenticate,
  requirePermission('suppliers', 'delete'),
  auditSupplierAction('DELETE'),
  (req, res, next) => suppliersController.delete(req, res, next)
);

export default router;
