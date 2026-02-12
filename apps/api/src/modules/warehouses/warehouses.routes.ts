import { Router } from 'express';
import { WarehousesController } from './warehouses.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/permission.middleware.js';
import { auditLog } from './warehouses.middleware.js';

const router = Router();
const controller = new WarehousesController();

// All routes require authentication
router.use(authenticate);

// POST /api/v1/warehouses - Create warehouse (ADMIN only)
router.post(
  '/',
  requirePermission('warehouses', 'create'),
  auditLog('CREATE_WAREHOUSE'),
  controller.create
);

// GET /api/v1/warehouses - Get all warehouses (All authenticated users)
router.get(
  '/',
  requirePermission('warehouses', 'read'),
  controller.findAll
);

// GET /api/v1/warehouses/:id - Get warehouse by ID (All authenticated users)
router.get(
  '/:id',
  requirePermission('warehouses', 'read'),
  controller.findById
);

// PUT /api/v1/warehouses/:id - Update warehouse (ADMIN only)
router.put(
  '/:id',
  requirePermission('warehouses', 'update'),
  auditLog('UPDATE_WAREHOUSE'),
  controller.update
);

// PUT /api/v1/warehouses/:id/gate-pass-config - Update gate pass configuration
router.put(
  '/:id/gate-pass-config',
  requirePermission('warehouses', 'update'),
  auditLog('UPDATE_WAREHOUSE_GP_CONFIG'),
  controller.updateGatePassConfig
);

// DELETE /api/v1/warehouses/:id - Delete warehouse (ADMIN only)
router.delete(
  '/:id',
  requirePermission('warehouses', 'delete'),
  auditLog('DELETE_WAREHOUSE'),
  controller.delete
);

export default router;
