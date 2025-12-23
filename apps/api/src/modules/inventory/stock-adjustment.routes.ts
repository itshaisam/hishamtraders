import { Router } from 'express';
import { StockAdjustmentController } from './stock-adjustment.controller';
import { requireRole } from '../../middleware/authorization.middleware.js';

const router = Router();
const adjustmentController = new StockAdjustmentController();

/**
 * POST /api/inventory/adjustments
 * Create a new stock adjustment (PENDING status)
 * Access: WAREHOUSE_MANAGER, ADMIN
 */
router.post(
  '/',
  requireRole(['WAREHOUSE_MANAGER', 'ADMIN']),
  adjustmentController.createAdjustment
);

/**
 * GET /api/inventory/adjustments
 * Get all stock adjustments with filters
 * WAREHOUSE_MANAGER: Can only view their own adjustments
 * ADMIN: Can view all adjustments
 * Query params: productId, warehouseId, status, createdBy, startDate, endDate, page, limit
 */
router.get(
  '/',
  requireRole(['WAREHOUSE_MANAGER', 'ADMIN']),
  adjustmentController.getAllAdjustments
);

/**
 * GET /api/inventory/adjustments/pending
 * Get pending adjustments for approval queue
 * Access: ADMIN only
 */
router.get(
  '/pending',
  requireRole(['ADMIN']),
  adjustmentController.getPendingAdjustments
);

/**
 * GET /api/inventory/adjustments/:id
 * Get single adjustment by ID
 * WAREHOUSE_MANAGER: Can only view their own
 * ADMIN: Can view all
 */
router.get(
  '/:id',
  requireRole(['WAREHOUSE_MANAGER', 'ADMIN']),
  adjustmentController.getAdjustmentById
);

/**
 * PATCH /api/inventory/adjustments/:id/approve
 * Approve a pending adjustment (updates inventory + creates stock movement)
 * Access: ADMIN only
 */
router.patch(
  '/:id/approve',
  requireRole(['ADMIN']),
  adjustmentController.approveAdjustment
);

/**
 * PATCH /api/inventory/adjustments/:id/reject
 * Reject a pending adjustment with reason
 * Access: ADMIN only
 */
router.patch(
  '/:id/reject',
  requireRole(['ADMIN']),
  adjustmentController.rejectAdjustment
);

export default router;
