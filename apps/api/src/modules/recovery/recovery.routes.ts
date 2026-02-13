import { Router } from 'express';
import { RecoveryController } from './recovery.controller.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();
const controller = new RecoveryController();

// GET /api/v1/recovery/schedule - Get recovery schedule
router.get(
  '/schedule',
  requireRole(['ADMIN', 'RECOVERY_AGENT', 'ACCOUNTANT']),
  controller.getSchedule
);

// GET /api/v1/recovery/schedule/today - Get today's route for current user
router.get(
  '/schedule/today',
  requireRole(['ADMIN', 'RECOVERY_AGENT']),
  controller.getTodayRoute
);

// GET /api/v1/recovery/agents - Get recovery agents
router.get(
  '/agents',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  controller.getRecoveryAgents
);

// GET /api/v1/recovery/visits/my - Get my visits (must be before /visits/:id)
router.get(
  '/visits/my',
  requireRole(['ADMIN', 'RECOVERY_AGENT']),
  controller.getMyVisits
);

// POST /api/v1/recovery/visits - Create a visit
router.post(
  '/visits',
  requireRole(['ADMIN', 'RECOVERY_AGENT']),
  controller.createVisit
);

// GET /api/v1/recovery/visits - Get visit history
router.get(
  '/visits',
  requireRole(['ADMIN', 'RECOVERY_AGENT', 'ACCOUNTANT']),
  controller.getVisits
);

// GET /api/v1/recovery/promises/due - Get due promises (must be before /promises/:id)
router.get(
  '/promises/due',
  requireRole(['ADMIN', 'RECOVERY_AGENT', 'ACCOUNTANT']),
  controller.getDuePromises
);

// GET /api/v1/recovery/promises/fulfillment-rate - Get fulfillment rate (must be before /promises/:id)
router.get(
  '/promises/fulfillment-rate',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  controller.getPromiseFulfillmentRate
);

// POST /api/v1/recovery/promises - Create a promise
router.post(
  '/promises',
  requireRole(['ADMIN', 'RECOVERY_AGENT']),
  controller.createPromise
);

// GET /api/v1/recovery/promises - Get client promises
router.get(
  '/promises',
  requireRole(['ADMIN', 'RECOVERY_AGENT', 'ACCOUNTANT']),
  controller.getClientPromises
);

// PUT /api/v1/recovery/promises/:id/fulfill - Fulfill a promise
router.put(
  '/promises/:id/fulfill',
  requireRole(['ADMIN', 'RECOVERY_AGENT', 'ACCOUNTANT']),
  controller.fulfillPromise
);

// PUT /api/v1/recovery/promises/:id/cancel - Cancel a promise
router.put(
  '/promises/:id/cancel',
  requireRole(['ADMIN', 'RECOVERY_AGENT']),
  controller.cancelPromise
);

// GET /api/v1/recovery/dashboard - Recovery dashboard data
router.get(
  '/dashboard',
  requireRole(['ADMIN', 'RECOVERY_AGENT', 'ACCOUNTANT']),
  controller.getDashboard
);

// GET /api/v1/recovery/agents/performance - All agents performance
router.get(
  '/agents/performance',
  requireRole(['ADMIN', 'ACCOUNTANT']),
  controller.getAllAgentsPerformance
);

// GET /api/v1/recovery/agents/:id/performance - Single agent performance
router.get(
  '/agents/:id/performance',
  requireRole(['ADMIN', 'ACCOUNTANT', 'RECOVERY_AGENT']),
  controller.getAgentPerformance
);

export { router as recoveryRoutes };
