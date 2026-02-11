import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();
const controller = new AuditController();

router.use(authenticate);

// Admin only
router.get('/', requireRole(['ADMIN']), controller.getAuditLogs);

export { router as auditRoutes };
