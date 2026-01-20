import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { variantsController } from './variants.controller.js';
import { auditVariantAction } from './variants.middleware.js';

const router = Router();

// POST /api/variants - Create variant (Admin, Warehouse Manager)
router.post(
  '/',
  authenticate,
  requirePermission('products', 'create'), // Variants use same permissions as products
  auditVariantAction('CREATE'),
  (req, res, next) => variantsController.create(req, res, next)
);

// GET /api/variants - List all variants with filters (All authenticated users)
router.get(
  '/',
  authenticate,
  (req, res, next) => variantsController.getAll(req, res, next)
);

// GET /api/variants/product/:productId - Get all variants for a product (All authenticated users)
router.get(
  '/product/:productId',
  authenticate,
  (req, res, next) => variantsController.getByProductId(req, res, next)
);

// GET /api/variants/:id - Get variant details (All authenticated users)
router.get(
  '/:id',
  authenticate,
  (req, res, next) => variantsController.getById(req, res, next)
);

// PUT /api/variants/:id - Update variant (Admin, Warehouse Manager)
router.put(
  '/:id',
  authenticate,
  requirePermission('products', 'update'), // Variants use same permissions as products
  auditVariantAction('UPDATE'),
  (req, res, next) => variantsController.update(req, res, next)
);

// DELETE /api/variants/:id - Soft delete variant (Admin, Warehouse Manager)
router.delete(
  '/:id',
  authenticate,
  requirePermission('products', 'delete'), // Variants use same permissions as products
  auditVariantAction('DELETE'),
  (req, res, next) => variantsController.delete(req, res, next)
);

export default router;
