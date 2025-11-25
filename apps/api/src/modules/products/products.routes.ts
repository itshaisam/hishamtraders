import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { productsController } from './products.controller';
import { auditProductAction } from './products.middleware';

const router = Router();

// POST /api/products - Create product (Admin, Warehouse Manager)
router.post(
  '/',
  authenticate,
  requirePermission('products', 'create'),
  auditProductAction('CREATE'),
  (req, res, next) => productsController.create(req, res, next)
);

// GET /api/products - List products (All authenticated users)
router.get(
  '/',
  authenticate,
  (req, res, next) => productsController.getAll(req, res, next)
);

// GET /api/products/:id - Get product details (All authenticated users)
router.get(
  '/:id',
  authenticate,
  (req, res, next) => productsController.getById(req, res, next)
);

// PUT /api/products/:id - Update product (Admin, Warehouse Manager)
router.put(
  '/:id',
  authenticate,
  requirePermission('products', 'update'),
  auditProductAction('UPDATE'),
  (req, res, next) => productsController.update(req, res, next)
);

// DELETE /api/products/:id - Delete product (Admin)
router.delete(
  '/:id',
  authenticate,
  requirePermission('products', 'delete'),
  auditProductAction('DELETE'),
  (req, res, next) => productsController.delete(req, res, next)
);

export default router;
