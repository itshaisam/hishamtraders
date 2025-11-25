import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { brandsController } from './brands.controller';

const router = Router();

// POST /api/brands - Create brand (Admin only)
router.post(
  '/',
  authenticate,
  requirePermission('brands', 'create'),
  (req, res, next) => brandsController.create(req, res, next)
);

// GET /api/brands - List all active brands (All authenticated users)
router.get(
  '/',
  authenticate,
  (req, res, next) => brandsController.getAll(req, res, next)
);

// GET /api/brands/:id - Get brand details (All authenticated users)
router.get(
  '/:id',
  authenticate,
  (req, res, next) => brandsController.getById(req, res, next)
);

// PUT /api/brands/:id - Update brand (Admin only)
router.put(
  '/:id',
  authenticate,
  requirePermission('brands', 'update'),
  (req, res, next) => brandsController.update(req, res, next)
);

// DELETE /api/brands/:id - Delete brand (Admin only)
router.delete(
  '/:id',
  authenticate,
  requirePermission('brands', 'delete'),
  (req, res, next) => brandsController.delete(req, res, next)
);

export default router;
