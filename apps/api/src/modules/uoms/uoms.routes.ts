import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { requirePermission } from '../../middleware/permission.middleware';
import { uomsController } from './uoms.controller';

const router = Router();

// POST /api/uoms - Create UOM (Admin only)
router.post(
  '/',
  authenticate,
  requirePermission('uoms', 'create'),
  (req, res, next) => uomsController.create(req, res, next)
);

// GET /api/uoms - List all active UOMs (All authenticated users)
router.get(
  '/',
  authenticate,
  (req, res, next) => uomsController.getAll(req, res, next)
);

// GET /api/uoms/:id - Get UOM details (All authenticated users)
router.get(
  '/:id',
  authenticate,
  (req, res, next) => uomsController.getById(req, res, next)
);

// PUT /api/uoms/:id - Update UOM (Admin only)
router.put(
  '/:id',
  authenticate,
  requirePermission('uoms', 'update'),
  (req, res, next) => uomsController.update(req, res, next)
);

// DELETE /api/uoms/:id - Delete UOM (Admin only)
router.delete(
  '/:id',
  authenticate,
  requirePermission('uoms', 'delete'),
  (req, res, next) => uomsController.delete(req, res, next)
);

export default router;
