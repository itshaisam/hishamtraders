import { Request, Response } from 'express';
import { InventoryService, InventoryFilters } from './inventory.service.js';
import { prisma } from '../../lib/prisma.js';

export class InventoryController {
  private inventoryService: InventoryService;

  constructor() {
    this.inventoryService = new InventoryService();
  }

  /**
   * GET /api/inventory
   * Get all inventory with optional filters
   */
  async getAll(req: Request, res: Response) {
    try {
      const filters: InventoryFilters = {
        productId: req.query.productId as string,
        warehouseId: req.query.warehouseId as string,
        status: req.query.status as any,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };

      const result = await this.inventoryService.getAll(filters);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Error fetching inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch inventory',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/inventory/product/:productId
   * Get inventory for a specific product across all warehouses
   */
  async getByProduct(req: Request, res: Response) {
    try {
      const { productId } = req.params;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required',
        });
      }

      const inventory = await this.inventoryService.getByProduct(productId);

      res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error: any) {
      console.error('Error fetching product inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch product inventory',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/inventory/warehouse/:warehouseId
   * Get all inventory in a specific warehouse
   */
  async getByWarehouse(req: Request, res: Response) {
    try {
      const { warehouseId } = req.params;

      if (!warehouseId) {
        return res.status(400).json({
          success: false,
          message: 'Warehouse ID is required',
        });
      }

      const inventory = await this.inventoryService.getByWarehouse(warehouseId);

      res.status(200).json({
        success: true,
        data: inventory,
      });
    } catch (error: any) {
      console.error('Error fetching warehouse inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch warehouse inventory',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/inventory/low-stock
   * Get all low stock items
   */
  async getLowStock(req: Request, res: Response) {
    try {
      const lowStockItems = await this.inventoryService.getLowStock();

      res.status(200).json({
        success: true,
        data: lowStockItems,
        count: lowStockItems.length,
      });
    } catch (error: any) {
      console.error('Error fetching low stock items:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch low stock items',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/inventory/available/:productId
   * Get total available quantity for a product across all warehouses
   */
  async getAvailableQuantity(req: Request, res: Response) {
    try {
      const { productId } = req.params;
      const { productVariantId, warehouseId } = req.query;

      if (!productId) {
        return res.status(400).json({
          success: false,
          message: 'Product ID is required',
        });
      }

      let quantity: number;

      if (warehouseId) {
        // Get quantity for specific warehouse
        quantity = await this.inventoryService.getAvailableQuantity(
          productId,
          warehouseId as string,
          productVariantId as string | undefined
        );
      } else {
        // Get total quantity across all warehouses
        quantity = await this.inventoryService.getTotalQuantity(
          productId,
          productVariantId as string | undefined
        );
      }

      res.status(200).json({
        success: true,
        data: {
          productId,
          productVariantId: productVariantId || null,
          warehouseId: warehouseId || null,
          quantity,
        },
      });
    } catch (error: any) {
      console.error('Error fetching available quantity:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available quantity',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/inventory/expiry-alerts
   * Get inventory items expiring within N days (Story 6.7)
   */
  async getExpiryAlerts(req: Request, res: Response) {
    try {
      const days = req.query.days ? parseInt(req.query.days as string) : 30;
      const warehouseId = req.query.warehouseId as string | undefined;

      const alertDate = new Date();
      alertDate.setDate(alertDate.getDate() + days);

      const where: any = {
        expiryDate: { lte: alertDate },
        quantity: { gt: 0 },
      };
      if (warehouseId) where.warehouseId = warehouseId;

      const items = await prisma.inventory.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true } },
          warehouse: { select: { id: true, name: true } },
        },
        orderBy: { expiryDate: 'asc' },
      });

      res.status(200).json({
        success: true,
        data: items,
        count: items.length,
      });
    } catch (error: any) {
      console.error('Error fetching expiry alerts:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch expiry alerts',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/inventory/grouped
   * Get inventory grouped by product and warehouse with batch details
   */
  async getAllGrouped(req: Request, res: Response) {
    try {
      const filters: InventoryFilters = {
        productId: req.query.productId as string,
        warehouseId: req.query.warehouseId as string,
        status: req.query.status as any,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      };

      const result = await this.inventoryService.getAllGrouped(filters);

      res.status(200).json({
        success: true,
        ...result,
      });
    } catch (error: any) {
      console.error('Error fetching grouped inventory:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch grouped inventory',
        error: error.message,
      });
    }
  }
}
