import { Router } from 'express';
import { StockTransferController } from './stock-transfer.controller.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();
const controller = new StockTransferController();

router.post('/', requireRole(['ADMIN', 'WAREHOUSE_MANAGER']), controller.create);
router.get('/', requireRole(['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER']), controller.findAll);
router.get('/:id', requireRole(['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER']), controller.findById);
router.put('/:id/approve', requireRole(['ADMIN', 'WAREHOUSE_MANAGER']), controller.approve);
router.put('/:id/dispatch', requireRole(['ADMIN', 'WAREHOUSE_MANAGER']), controller.dispatch);
router.put('/:id/receive', requireRole(['ADMIN', 'WAREHOUSE_MANAGER']), controller.receive);
router.put('/:id/cancel', requireRole(['ADMIN', 'WAREHOUSE_MANAGER']), controller.cancel);

export { router as stockTransferRoutes };
