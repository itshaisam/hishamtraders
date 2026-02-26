import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../../middleware/role.middleware.js';
import { DeliveryNotesService } from './delivery-notes.service.js';
import { createDeliveryNoteSchema, cancelDeliveryNoteSchema } from './delivery-notes.validator.js';

const router = Router();
const service = new DeliveryNotesService();

/**
 * GET /api/v1/delivery-notes
 * List delivery notes with filters
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.list({
      search: req.query.search as string,
      status: req.query.status as string,
      clientId: req.query.clientId as string,
      salesOrderId: req.query.salesOrderId as string,
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
 * GET /api/v1/delivery-notes/:id
 * Get delivery note detail
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const dn = await service.getById(req.params.id);
    res.json(dn);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/delivery-notes
 * Create a new delivery note
 */
router.post(
  '/',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createDeliveryNoteSchema.parse(req.body);
      const userId = (req as any).user.id;
      const dn = await service.create(validated, userId);
      res.status(201).json(dn);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/delivery-notes/:id/dispatch
 * Dispatch delivery note (deducts stock, posts COGS)
 */
router.patch(
  '/:id/dispatch',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const dn = await service.dispatch(req.params.id, userId);
      res.json(dn);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/delivery-notes/:id/deliver
 * Mark delivery note as delivered
 */
router.patch(
  '/:id/deliver',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const dn = await service.deliver(req.params.id, userId);
      res.json(dn);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/delivery-notes/:id/cancel
 * Cancel a pending delivery note
 */
router.patch(
  '/:id/cancel',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = cancelDeliveryNoteSchema.parse(req.body);
      const userId = (req as any).user.id;
      const dn = await service.cancel(req.params.id, userId, validated.cancelReason);
      res.json(dn);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
