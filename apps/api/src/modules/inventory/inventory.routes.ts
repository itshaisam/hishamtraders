import { Router } from 'express';
import { InventoryController } from './inventory.controller.js';

const router = Router();
const inventoryController = new InventoryController();

// All routes require authentication (applied globally in index.ts)
// All authenticated users can view inventory (read-only)

/**
 * GET /api/inventory
 * Get all inventory with optional filters
 * Query params: productId, warehouseId, status, search, page, limit
 */
router.get(
  '/',
  inventoryController.getAll.bind(inventoryController)
);

/**
 * GET /api/inventory/grouped
 * Get inventory grouped by product and warehouse with expandable batch details
 * Query params: productId, warehouseId, status, search, page, limit
 */
router.get(
  '/grouped',
  inventoryController.getAllGrouped.bind(inventoryController)
);

/**
 * GET /api/inventory/low-stock
 * Get all low stock items
 */
router.get(
  '/low-stock',
  inventoryController.getLowStock.bind(inventoryController)
);

/**
 * GET /api/inventory/expiry-alerts
 * Get inventory items expiring within N days (Story 6.7)
 * Query params: days (default 30), warehouseId (optional)
 */
router.get(
  '/expiry-alerts',
  inventoryController.getExpiryAlerts.bind(inventoryController)
);

/**
 * GET /api/inventory/available/:productId
 * Get available quantity for a product
 * Query params: productVariantId, warehouseId (optional)
 */
router.get(
  '/available/:productId',
  inventoryController.getAvailableQuantity.bind(inventoryController)
);

/**
 * GET /api/inventory/product/:productId
 * Get inventory for a specific product across all warehouses
 */
router.get(
  '/product/:productId',
  inventoryController.getByProduct.bind(inventoryController)
);

/**
 * GET /api/inventory/warehouse/:warehouseId
 * Get all inventory in a specific warehouse
 */
router.get(
  '/warehouse/:warehouseId',
  inventoryController.getByWarehouse.bind(inventoryController)
);

export default router;
