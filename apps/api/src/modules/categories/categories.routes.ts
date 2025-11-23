import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requireRole } from '../../middleware/role.middleware';
import { categoriesController } from './categories.controller';

const router = Router();

// POST /api/categories - Create category (Admin only)
router.post(
  '/',
  authenticate,
  requireRole(['ADMIN']),
  (req, res, next) => categoriesController.create(req, res, next)
);

// GET /api/categories - List all active categories (All authenticated users)
router.get(
  '/',
  authenticate,
  (req, res, next) => categoriesController.getAll(req, res, next)
);

// GET /api/categories/:id - Get category details (All authenticated users)
router.get(
  '/:id',
  authenticate,
  (req, res, next) => categoriesController.getById(req, res, next)
);

// PUT /api/categories/:id - Update category (Admin only)
router.put(
  '/:id',
  authenticate,
  requireRole(['ADMIN']),
  (req, res, next) => categoriesController.update(req, res, next)
);

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete(
  '/:id',
  authenticate,
  requireRole(['ADMIN']),
  (req, res, next) => categoriesController.delete(req, res, next)
);

export default router;
