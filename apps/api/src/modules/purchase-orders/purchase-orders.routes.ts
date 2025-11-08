import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { requireRole } from '../../middleware/role.middleware.js';
import { PurchaseOrderController } from './purchase-orders.controller.js';
import { PurchaseOrderService } from './purchase-orders.service.js';
import { PurchaseOrderRepository } from './purchase-orders.repository.js';
import { auditPurchaseOrderAction } from './purchase-orders.middleware.js';

const prisma = new PrismaClient();
const router = Router();

// Initialize repository, service, and controller
const repository = new PurchaseOrderRepository(prisma);
const service = new PurchaseOrderService(repository);
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
 * Accessible to: ADMIN, ACCOUNTANT
 */
router.post(
  '/',
  requireRole(['ADMIN', 'ACCOUNTANT']),
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
  requireRole(['ADMIN', 'ACCOUNTANT']),
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
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
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

export default router;
