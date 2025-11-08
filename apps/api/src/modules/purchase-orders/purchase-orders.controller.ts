import { Request, Response } from 'express';
import logger from '../../lib/logger.js';
import { PurchaseOrderService } from './purchase-orders.service.js';
import {
  CreatePurchaseOrderRequest,
  createPurchaseOrderSchema,
} from './dto/create-purchase-order.dto.js';
import {
  UpdatePurchaseOrderRequest,
  updatePurchaseOrderSchema,
  UpdatePOStatusRequest,
} from './dto/update-purchase-order.dto.js';
import {
  PurchaseOrderFilters,
  purchaseOrderFilterSchema,
} from './dto/purchase-order-filter.dto.js';

export class PurchaseOrderController {
  constructor(private service: PurchaseOrderService) {}

  /**
   * Create a new purchase order
   * POST /api/v1/purchase-orders
   */
  async create(req: Request, res: Response) {
    try {
      const validatedData: CreatePurchaseOrderRequest =
        createPurchaseOrderSchema.parse(req.body);

      const po = await this.service.createPurchaseOrder(
        validatedData,
        req.user?.userId || ''
      );

      logger.info('Purchase order created via API', {
        userId: req.user?.userId,
        poId: po.id,
      });

      res.status(201).json({
        success: true,
        data: po,
        message: 'Purchase order created successfully',
      });
    } catch (error: any) {
      logger.error('Error creating purchase order', { error });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          errors: error.errors,
          message: 'Validation failed',
        });
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to create purchase order',
      });
    }
  }

  /**
   * Get all purchase orders
   * GET /api/v1/purchase-orders
   */
  async getAll(req: Request, res: Response) {
    try {
      const filters: PurchaseOrderFilters = purchaseOrderFilterSchema.parse(
        req.query
      );

      const result = await this.service.getPurchaseOrders(filters);

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
      });
    } catch (error: any) {
      logger.error('Error fetching purchase orders', { error });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          errors: error.errors,
          message: 'Invalid filters',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch purchase orders',
      });
    }
  }

  /**
   * Get a specific purchase order
   * GET /api/v1/purchase-orders/:id
   */
  async getById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const po = await this.service.getPurchaseOrder(id);

      res.status(200).json({
        success: true,
        data: po,
      });
    } catch (error: any) {
      logger.error('Error fetching purchase order', { error });

      if (error.message === 'Purchase order not found') {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to fetch purchase order',
      });
    }
  }

  /**
   * Update a purchase order
   * PATCH /api/v1/purchase-orders/:id
   */
  async update(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const validatedData: UpdatePurchaseOrderRequest =
        updatePurchaseOrderSchema.parse(req.body);

      const updated = await this.service.updatePurchaseOrder(
        id,
        validatedData,
        req.user?.userId || ''
      );

      logger.info('Purchase order updated via API', {
        userId: req.user?.userId,
        poId: id,
      });

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Purchase order updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating purchase order', { error });

      if (error.name === 'ZodError') {
        return res.status(400).json({
          success: false,
          errors: error.errors,
          message: 'Validation failed',
        });
      }

      if (error.message === 'Purchase order not found') {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found',
        });
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update purchase order',
      });
    }
  }

  /**
   * Update purchase order status
   * PATCH /api/v1/purchase-orders/:id/status
   */
  async updateStatus(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { status }: UpdatePOStatusRequest = req.body;

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Status is required',
        });
      }

      const updated = await this.service.updatePurchaseOrderStatus(
        id,
        status,
        req.user?.userId || ''
      );

      logger.info('Purchase order status updated via API', {
        userId: req.user?.userId,
        poId: id,
        newStatus: status,
      });

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Purchase order status updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating purchase order status', { error });

      if (error.message === 'Purchase order not found') {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found',
        });
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to update purchase order status',
      });
    }
  }

  /**
   * Delete a purchase order
   * DELETE /api/v1/purchase-orders/:id
   */
  async delete(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await this.service.deletePurchaseOrder(id, req.user?.userId || '');

      logger.info('Purchase order deleted via API', {
        userId: req.user?.userId,
        poId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Purchase order deleted successfully',
      });
    } catch (error: any) {
      logger.error('Error deleting purchase order', { error });

      if (error.message === 'Purchase order not found') {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found',
        });
      }

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to delete purchase order',
      });
    }
  }

  /**
   * Get purchase order statistics
   * GET /api/v1/purchase-orders/statistics
   */
  async getStatistics(req: Request, res: Response) {
    try {
      const stats = await this.service.getStatistics();

      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error: any) {
      logger.error('Error fetching purchase order statistics', { error });

      res.status(500).json({
        success: false,
        message: 'Failed to fetch statistics',
      });
    }
  }
}
