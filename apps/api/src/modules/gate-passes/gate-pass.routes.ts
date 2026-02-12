import { Router } from 'express';
import { GatePassController } from './gate-pass.controller.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();
const controller = new GatePassController();

// POST /api/v1/gate-passes - Create gate pass
router.post(
  '/',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
  controller.create
);

// GET /api/v1/gate-passes - List gate passes
router.get(
  '/',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER']),
  controller.findAll
);

// GET /api/v1/gate-passes/:id - Get gate pass by ID
router.get(
  '/:id',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER']),
  controller.findById
);

// PUT /api/v1/gate-passes/:id/approve - Approve gate pass
router.put(
  '/:id/approve',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
  controller.approve
);

// PUT /api/v1/gate-passes/:id/dispatch - Dispatch gate pass
router.put(
  '/:id/dispatch',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
  controller.dispatch
);

// PUT /api/v1/gate-passes/:id/complete - Complete gate pass
router.put(
  '/:id/complete',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
  controller.complete
);

// PUT /api/v1/gate-passes/:id/cancel - Cancel gate pass
router.put(
  '/:id/cancel',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
  controller.cancel
);

export { router as gatePassRoutes };
