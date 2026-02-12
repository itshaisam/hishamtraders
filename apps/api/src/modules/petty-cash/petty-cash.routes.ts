import { Router } from 'express';
import { PettyCashController } from './petty-cash.controller.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();
const controller = new PettyCashController();

// GET /api/v1/petty-cash/balance
router.get('/balance', controller.getBalance);

// GET /api/v1/petty-cash/transactions
router.get('/transactions', controller.getTransactions);

// POST /api/v1/petty-cash/advance (ADMIN/ACCOUNTANT only)
router.post('/advance', requireRole(['ADMIN', 'ACCOUNTANT']), controller.createAdvance);

export const pettyCashRoutes = router;
