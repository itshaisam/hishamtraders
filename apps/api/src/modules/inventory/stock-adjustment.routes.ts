import { Router } from 'express';
import { StockAdjustmentController } from './stock-adjustment.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();
const adjustmentController = new StockAdjustmentController();

// All routes require authentication
router.use(authenticate);

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
 * Get all stock adjustments with filters (read-only access for history viewing)
 * SALES_OFFICER: Can view all adjustments (read-only)
 * WAREHOUSE_MANAGER: Can view their own adjustments
 * ADMIN: Can view all adjustments
 * Query params: productId, warehouseId, status, createdBy, startDate, endDate, page, limit
 */
router.get(
  '/',
  requireRole(['WAREHOUSE_MANAGER', 'ADMIN', 'SALES_OFFICER']),
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
 * Get single adjustment by ID (read-only access)
 * SALES_OFFICER: Can view all adjustments (read-only)
 * WAREHOUSE_MANAGER: Can view their own
 * ADMIN: Can view all
 */
router.get(
  '/:id',
  requireRole(['WAREHOUSE_MANAGER', 'ADMIN', 'SALES_OFFICER']),
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
