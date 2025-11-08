import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { productsController } from './products.controller';
import { auditProductAction } from './products.middleware';

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

// POST /api/products - Create product (Admin, Warehouse Manager)
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'WAREHOUSE_MANAGER']),
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
  authorize(['ADMIN', 'WAREHOUSE_MANAGER']),
  auditProductAction('UPDATE'),
  (req, res, next) => productsController.update(req, res, next)
);

// DELETE /api/products/:id - Delete product (Admin, Warehouse Manager)
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'WAREHOUSE_MANAGER']),
  auditProductAction('DELETE'),
  (req, res, next) => productsController.delete(req, res, next)
);

export default router;
