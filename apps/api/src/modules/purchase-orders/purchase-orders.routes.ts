import { Router } from 'express';
import { prisma } from '../../lib/prisma.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { PurchaseOrderController } from './purchase-orders.controller.js';
import { PurchaseOrderService } from './purchase-orders.service.js';
import { PurchaseOrderRepository } from './purchase-orders.repository.js';
import { LandedCostService } from './landed-cost.service.js';
import { auditPurchaseOrderAction } from './purchase-orders.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';
const router = Router();

// Initialize repository, service, and controller
const repository = new PurchaseOrderRepository(prisma);
const landedCostService = new LandedCostService(prisma);
const service = new PurchaseOrderService(repository, landedCostService);
const controller = new PurchaseOrderController(service);

/**
 * GET /api/v1/purchase-orders/statistics
 * Get purchase order statistics
 * Accessible to: All authenticated users
 */
router.get(
  '/statistics',
  (req, res) => controller.getStatistics(req, res)
);

/**
 * GET /api/v1/purchase-orders
 * Get all purchase orders with pagination and filters
 * Accessible to: All authenticated users
 */
router.get(
  '/',
  (req, res) => controller.getAll(req, res)
);

/**
 * POST /api/v1/purchase-orders
 * Create a new purchase order
 * Accessible to: ADMIN, ACCOUNTANT, WAREHOUSE_MANAGER
 */
router.post(
  '/',
  requirePermission('purchaseOrders', 'create'),
  auditPurchaseOrderAction('CREATE'),
  (req, res) => controller.create(req, res)
);

/**
 * GET /api/v1/purchase-orders/:id
 * Get a specific purchase order
 * Accessible to: All authenticated users
 */
router.get(
  '/:id',
  (req, res) => controller.getById(req, res)
);

/**
 * PATCH /api/v1/purchase-orders/:id
 * Update a purchase order
 * Accessible to: ADMIN, ACCOUNTANT
 */
router.patch(
  '/:id',
  requirePermission('purchaseOrders', 'update'),
  auditPurchaseOrderAction('UPDATE'),
  (req, res) => controller.update(req, res)
);

/**
 * PATCH /api/v1/purchase-orders/:id/status
 * Update only the status of a purchase order
 * Accessible to: ADMIN, WAREHOUSE_MANAGER
 */
router.patch(
  '/:id/status',
  requirePermission('purchaseOrders', 'update'),
  auditPurchaseOrderAction('UPDATE'),
  (req, res) => controller.updateStatus(req, res)
);

/**
 * DELETE /api/v1/purchase-orders/:id
 * Delete a purchase order (only PENDING orders can be deleted)
 * Accessible to: ADMIN, ACCOUNTANT
 */
router.delete(
  '/:id',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  auditPurchaseOrderAction('DELETE'),
  (req, res) => controller.delete(req, res)
);

/**
 * POST /api/v1/purchase-orders/:id/costs
 * Add a cost to a purchase order
 * Accessible to: ADMIN, ACCOUNTANT
 */
router.post(
  '/:id/costs',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  auditPurchaseOrderAction('ADD_COST'),
  (req, res) => controller.addCost(req, res)
);

/**
 * GET /api/v1/purchase-orders/:id/landed-cost
 * Get landed cost calculation for a purchase order
 * Accessible to: All authenticated users
 */
router.get(
  '/:id/landed-cost',
  (req, res) => controller.getLandedCost(req, res)
);

/**
 * PATCH /api/v1/purchase-orders/:id/import-details
 * Update import details for a purchase order
 * Accessible to: ADMIN, ACCOUNTANT
 */
router.patch(
  '/:id/import-details',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  auditPurchaseOrderAction('UPDATE_IMPORT_DETAILS'),
  (req, res) => controller.updateImportDetails(req, res)
);

/**
 * GET /api/v1/purchase-orders/:id/can-receive
 * Check if purchase order can be received
 * Accessible to: ADMIN, WAREHOUSE_MANAGER
 */
router.get(
  '/:id/can-receive',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
  (req, res) => controller.canReceive(req, res)
);

/**
 * POST /api/v1/purchase-orders/:id/receive
 * Receive goods from purchase order
 * Accessible to: ADMIN, WAREHOUSE_MANAGER
 */
router.post(
  '/:id/receive',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
  auditPurchaseOrderAction('RECEIVE_GOODS'),
  (req, res) => controller.receiveGoods(req, res)
);

export default router;
