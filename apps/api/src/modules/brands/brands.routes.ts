import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { brandsController } from './brands.controller';

const router = Router();

// Helper middleware to check authorization
const authorize = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;

    if (!user) {
      return res.status(401).json({ success: false, error: 'Unauthorized' });
    }

    if (allowedRoles.includes(user.role)) {
      return next();
    }

    return res.status(403).json({ success: false, error: 'Forbidden' });
  };
};

// POST /api/brands - Create brand (Admin only)
router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
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
  authorize(['ADMIN']),
  (req, res, next) => brandsController.update(req, res, next)
);

// DELETE /api/brands/:id - Delete brand (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  (req, res, next) => brandsController.delete(req, res, next)
);

export default router;
