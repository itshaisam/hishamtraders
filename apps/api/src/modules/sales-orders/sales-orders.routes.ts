import { Router, Request, Response, NextFunction } from 'express';
import { requireRole } from '../../middleware/role.middleware.js';
import { SalesOrdersService } from './sales-orders.service.js';
import { createSalesOrderSchema, cancelSalesOrderSchema } from './sales-orders.validator.js';

const router = Router();
const service = new SalesOrdersService();

/**
 * GET /api/v1/sales-orders
 * List sales orders with filters
 */
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.list({
      search: req.query.search as string,
      status: req.query.status as string,
      clientId: req.query.clientId as string,
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
 * GET /api/v1/sales-orders/:id
 * Get sales order detail
 */
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await service.getById(req.params.id);
    res.json(order);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/sales-orders/:id/deliverable-items
 * Get items with remaining deliverable quantities
 */
router.get('/:id/deliverable-items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getDeliverableItems(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/v1/sales-orders/:id/invoiceable-items
 * Get items with remaining invoiceable quantities
 */
router.get('/:id/invoiceable-items', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.getInvoiceableItems(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/v1/sales-orders
 * Create a new sales order
 */
router.post(
  '/',
  requireRole(['ADMIN', 'SALES_OFFICER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = createSalesOrderSchema.parse(req.body);
      const userId = (req as any).user.id;
      const order = await service.create(validated, userId);
      res.status(201).json(order);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/sales-orders/:id/confirm
 * Confirm a draft sales order
 */
router.patch(
  '/:id/confirm',
  requireRole(['ADMIN', 'SALES_OFFICER']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const order = await service.confirm(req.params.id, userId);
      res.json(order);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/sales-orders/:id/cancel
 * Cancel a sales order
 */
router.patch(
  '/:id/cancel',
  requireRole(['ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const validated = cancelSalesOrderSchema.parse(req.body);
      const userId = (req as any).user.id;
      const order = await service.cancel(req.params.id, userId, validated.cancelReason);
      res.json(order);
    } catch (error) {
      next(error);
    }
  }
);

/**
 * PATCH /api/v1/sales-orders/:id/close
 * Manually close a sales order
 */
router.patch(
  '/:id/close',
  requireRole(['ADMIN']),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const order = await service.close(req.params.id, userId);
      res.json(order);
    } catch (error) {
      next(error);
    }
  }
);

export default router;
