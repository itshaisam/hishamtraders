import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../../middleware/role.middleware.js';
import { PurchaseInvoicesService } from './purchase-invoices.service.js';
import { createPurchaseInvoiceSchema, cancelPurchaseInvoiceSchema } from './purchase-invoices.validator.js';

const router = Router();
const service = new PurchaseInvoicesService();

/**
 * GET /api/v1/purchase-invoices
 * List purchase invoices with filters
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.list({
      search: req.query.search as string,
      status: req.query.status as string,
      supplierId: req.query.supplierId as string,
      poId: req.query.poId as string,
      dateFrom: req.query.dateFrom as string,
      dateTo: req.query.dateTo as string,
      page: req.query.page ? parseInt(req.query.page as string) : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
    });
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/purchase-invoices/:id
 * Get purchase invoice detail
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const pi = await service.getById(req.params.id);
    res.json(pi);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/purchase-invoices/:id/matching
 * Get 3-way matching data (PO vs GRN vs PI)
 */
router.get('/:id/matching', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const matching = await service.getMatching(req.params.id);
    res.json(matching);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/purchase-invoices
 * Create a new purchase invoice
 */
router.post(
  '/',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createPurchaseInvoiceSchema.parse(req.body);
      const userId = (req as any).user.userId;
      const pi = await service.create(validated, userId);
      res.status(201).json(pi);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/purchase-invoices/:id/cancel
 * Cancel a purchase invoice
 */
router.patch(
  '/:id/cancel',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = cancelPurchaseInvoiceSchema.parse(req.body);
      const userId = (req as any).user.userId;
      const pi = await service.cancel(req.params.id, userId, validated.cancelReason);
      res.json(pi);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
