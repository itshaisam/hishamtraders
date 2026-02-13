import { Router } from 'express';
import { AlertController } from './alert.controller.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();
const controller = new AlertController();

// GET /api/v1/alerts - Get alerts for the authenticated user (all roles)
router.get(
  '/',
  requireRole(['ADMIN', 'ACCOUNTANT', 'SALES_OFFICER', 'WAREHOUSE_MANAGER', 'RECOVERY_AGENT']),
  controller.getAlerts
);

// GET /api/v1/alerts/unread-count - Get unacknowledged alert count (all roles)
router.get(
  '/unread-count',
  requireRole(['ADMIN', 'ACCOUNTANT', 'SALES_OFFICER', 'WAREHOUSE_MANAGER', 'RECOVERY_AGENT']),
  controller.getUnreadCount
);

// GET /api/v1/alerts/overdue-clients - Get overdue clients (restricted roles)
router.get(
  '/overdue-clients',
  requireRole(['ADMIN', 'ACCOUNTANT', 'RECOVERY_AGENT']),
  controller.getOverdueClients
);

// POST /api/v1/alerts/check-overdue - Trigger overdue check (admin only)
router.post(
  '/check-overdue',
  requireRole(['ADMIN']),
  controller.checkOverdue
);

// PUT /api/v1/alerts/:id/acknowledge - Acknowledge an alert (all roles)
router.put(
  '/:id/acknowledge',
  requireRole(['ADMIN', 'ACCOUNTANT', 'SALES_OFFICER', 'WAREHOUSE_MANAGER', 'RECOVERY_AGENT']),
  controller.acknowledgeAlert
);

export { router as alertRoutes };
