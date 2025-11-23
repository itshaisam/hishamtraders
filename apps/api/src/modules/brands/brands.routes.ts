import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { brandsController } from './brands.controller';

const router = Router();

// POST /api/brands - Create brand (Admin only)
router.post(
  '/',
  authenticate,
  requireRole(['ADMIN']),
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
  requireRole(['ADMIN']),
  (req, res, next) => brandsController.update(req, res, next)
);

// DELETE /api/brands/:id - Delete brand (Admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole(['ADMIN']),
  (req, res, next) => brandsController.delete(req, res, next)
);

export default router;
