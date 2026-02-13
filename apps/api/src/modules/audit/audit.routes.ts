import { Router } from 'express';
import { AuditController } from './audit.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();
const controller = new AuditController();

router.use(authenticate);

// Export must come before /:id to avoid matching 'export' as an id
router.get('/export', requireRole(['ADMIN']), controller.exportAuditLogs);

// Detail endpoint - accessible to all authenticated users (controller checks ownership)
router.get('/:id', controller.getAuditLogDetail);

// List endpoint - accessible to all authenticated users (controller filters by role)
router.get('/', controller.getAuditLogs);

export { router as auditRoutes };
