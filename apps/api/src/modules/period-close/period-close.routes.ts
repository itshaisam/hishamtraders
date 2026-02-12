import { Router } from 'express';
import { PeriodCloseController } from './period-close.controller.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();
const controller = new PeriodCloseController();

// List all closed periods — ADMIN and ACCOUNTANT
router.get('/', requireRole(['ADMIN', 'ACCOUNTANT']), controller.list.bind(controller));

// Get P&L summary for a month — ADMIN and ACCOUNTANT
router.get('/pnl', requireRole(['ADMIN', 'ACCOUNTANT']), controller.getMonthPnL.bind(controller));

// Close a month — ADMIN only
router.post('/month', requireRole(['ADMIN']), controller.closeMonth.bind(controller));

// Reopen a period — ADMIN only
router.post('/:id/reopen', requireRole(['ADMIN']), controller.reopen.bind(controller));

export { router as periodCloseRoutes };
