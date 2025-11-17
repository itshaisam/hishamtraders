import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { categoriesController } from './categories.controller';

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

// POST /api/categories - Create category (Admin only)
router.post(
  '/',
  authenticate,
  authorize(['ADMIN']),
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
  authorize(['ADMIN']),
  (req, res, next) => categoriesController.update(req, res, next)
);

// DELETE /api/categories/:id - Delete category (Admin only)
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN']),
  (req, res, next) => categoriesController.delete(req, res, next)
);

export default router;
