import { Router } from 'express';
import { StockCountController } from './stock-count.controller.js';
import { requireRole } from '../../middleware/role.middleware.js';

const router = Router();
const controller = new StockCountController();

router.post('/', requireRole(['ADMIN', 'WAREHOUSE_MANAGER']), controller.create);
router.get('/', requireRole(['ADMIN', 'WAREHOUSE_MANAGER']), controller.findAll);
router.get('/:id', requireRole(['ADMIN', 'WAREHOUSE_MANAGER']), controller.findById);
router.put('/:id/start', requireRole(['ADMIN', 'WAREHOUSE_MANAGER']), controller.start);
router.put('/:id/items', requireRole(['ADMIN', 'WAREHOUSE_MANAGER']), controller.updateItems);
router.put('/:id/complete', requireRole(['ADMIN', 'WAREHOUSE_MANAGER']), controller.complete);
router.put('/:id/cancel', requireRole(['ADMIN', 'WAREHOUSE_MANAGER']), controller.cancel);

export { router as stockCountRoutes };
