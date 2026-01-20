import { Router } from 'express';
import { StockMovementController } from './stock-movement.controller.js';
import { authenticate } from '../../middleware/auth.middleware.js';

const router = Router();
const controller = new StockMovementController();

// All routes require authentication
router.use(authenticate);

// GET /api/inventory/movements - List all movements with filters
router.get('/', controller.getAll);

// GET /api/inventory/movements/product/:productId - Get movements for a product
router.get('/product/:productId', controller.getByProduct);

// GET /api/inventory/movements/warehouse/:warehouseId - Get movements for a warehouse
router.get('/warehouse/:warehouseId', controller.getByWarehouse);

// GET /api/inventory/movements/product/:productId/warehouse/:warehouseId - Get movements for product in warehouse
router.get('/product/:productId/warehouse/:warehouseId', controller.getByProductAndWarehouse);

export { router as stockMovementRoutes };
