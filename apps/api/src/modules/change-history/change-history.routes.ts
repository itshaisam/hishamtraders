import { Router } from 'express';
import { ChangeHistoryController } from './change-history.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/authorization.middleware.js';

const router = Router();
const controller = new ChangeHistoryController();

router.use(authenticate);

// Rollback — admin only
router.post('/rollback', requireRole(['Admin']), controller.rollback);

// Can-rollback check — must come before /:entityType/:entityId to avoid matching
router.get('/:entityType/:entityId/can-rollback', controller.canRollback);

// Version history
router.get('/:entityType/:entityId', controller.getHistory);

export { router as changeHistoryRoutes };
