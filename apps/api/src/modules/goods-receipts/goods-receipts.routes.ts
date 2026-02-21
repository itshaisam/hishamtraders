import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { requireRole } from '../../middleware/role.middleware.js';
import { GoodsReceiptsController } from './goods-receipts.controller.js';
import { GoodsReceiptsService } from './goods-receipts.service.js';
import { GoodsReceiptsRepository } from './goods-receipts.repository.js';

const router = Router();

const repository = new GoodsReceiptsRepository(prisma);
const service = new GoodsReceiptsService(repository);
const controller = new GoodsReceiptsController(service);

/**
 * GET /api/v1/goods-receipts
 * List GRNs with search, filters, pagination
 */
router.get('/', (req, res) => controller.list(req, res));

/**
 * GET /api/v1/goods-receipts/:id
 * Get GRN detail
 */
router.get('/:id', (req, res) => controller.getById(req, res));

/**
 * GET /api/v1/goods-receipts/:id/landed-cost
 * Get landed cost breakdown for a GRN
 */
router.get('/:id/landed-cost', (req, res) => controller.getLandedCost(req, res));

/**
 * POST /api/v1/goods-receipts
 * Create a new GRN (validates, updates inventory, updates PO status)
 */
router.post(
  '/',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
  (req, res) => controller.create(req, res),
);

/**
 * POST /api/v1/goods-receipts/:id/costs
 * Add a cost to a completed GRN
 */
router.post(
  '/:id/costs',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  (req, res) => controller.addCost(req, res),
);

/**
 * PATCH /api/v1/goods-receipts/:id/cancel
 * Cancel a GRN (reverses inventory, updates PO)
 */
router.patch(
  '/:id/cancel',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
  (req, res) => controller.cancel(req, res),
);

export default router;
