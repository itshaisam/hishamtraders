import { Router, Request, Response, NextFunction } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { suppliersController } from './suppliers.controller';
import { auditSupplierAction } from './suppliers.middleware';

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

// POST /api/suppliers - Create supplier (Admin, Accountant)
router.post(
  '/',
  authenticate,
  authorize(['ADMIN', 'ACCOUNTANT']),
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
  authorize(['ADMIN', 'ACCOUNTANT']),
  auditSupplierAction('UPDATE'),
  (req, res, next) => suppliersController.update(req, res, next)
);

// DELETE /api/suppliers/:id - Delete supplier (Admin, Accountant)
router.delete(
  '/:id',
  authenticate,
  authorize(['ADMIN', 'ACCOUNTANT']),
  auditSupplierAction('DELETE'),
  (req, res, next) => suppliersController.delete(req, res, next)
);

export default router;
