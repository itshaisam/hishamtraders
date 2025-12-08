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
import { AddPOCostRequest, addPOCostSchema } from './dto/add-po-cost.dto.js';
import {
  UpdateImportDetailsRequest,
  updateImportDetailsSchema,
} from './dto/update-import-details.dto.js';
import { ReceiveGoodsDto, receiveGoodsSchema } from './dto/receive-goods.dto.js';
import { StockReceiptService } from '../inventory/stock-receipt.service.js';

export class PurchaseOrderController {
  private stockReceiptService: StockReceiptService;

  constructor(private service: PurchaseOrderService) {
    this.stockReceiptService = new StockReceiptService();
  }

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

  /**
   * Add a cost to a purchase order
   * POST /api/v1/purchase-orders/:id/costs
   */
  async addCost(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const validatedData: AddPOCostRequest = addPOCostSchema.parse(req.body);

      const cost = await this.service.addCost(
        id,
        validatedData,
        req.user?.userId || ''
      );

      logger.info('Cost added to purchase order via API', {
        userId: req.user?.userId,
        poId: id,
        costId: cost.id,
      });

      res.status(201).json({
        success: true,
        data: cost,
        message: 'Cost added successfully',
      });
    } catch (error: any) {
      logger.error('Error adding cost to purchase order', { error });

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
        message: error.message || 'Failed to add cost',
      });
    }
  }

  /**
   * Get landed cost calculation for a purchase order
   * GET /api/v1/purchase-orders/:id/landed-cost
   */
  async getLandedCost(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const landedCost = await this.service.getLandedCost(id);

      res.status(200).json({
        success: true,
        data: landedCost,
      });
    } catch (error: any) {
      logger.error('Error calculating landed cost', { error });

      if (error.message === 'Purchase order not found') {
        return res.status(404).json({
          success: false,
          message: 'Purchase order not found',
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to calculate landed cost',
      });
    }
  }

  /**
   * Update import details for a purchase order
   * PATCH /api/v1/purchase-orders/:id/import-details
   */
  async updateImportDetails(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const validatedData: UpdateImportDetailsRequest =
        updateImportDetailsSchema.parse(req.body);

      const updated = await this.service.updateImportDetails(
        id,
        validatedData,
        req.user?.userId || ''
      );

      logger.info('Import details updated via API', {
        userId: req.user?.userId,
        poId: id,
      });

      res.status(200).json({
        success: true,
        data: updated,
        message: 'Import details updated successfully',
      });
    } catch (error: any) {
      logger.error('Error updating import details', { error });

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
        message: error.message || 'Failed to update import details',
      });
    }
  }

  /**
   * Check if PO can be received
   * GET /api/v1/purchase-orders/:id/can-receive
   */
  async canReceive(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const result = await this.stockReceiptService.canReceivePO(id);

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error: any) {
      logger.error('Error checking if PO can be received', { error });

      res.status(400).json({
        success: false,
        message: error.message || 'Failed to check receive status',
      });
    }
  }

  /**
   * Receive goods from purchase order
   * POST /api/v1/purchase-orders/:id/receive
   */
  async receiveGoods(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const validatedData: ReceiveGoodsDto = receiveGoodsSchema.parse(req.body);

      await this.stockReceiptService.receiveGoods(
        id,
        validatedData,
        req.user?.userId || ''
      );

      logger.info('Goods received via API', {
        userId: req.user?.userId,
        poId: id,
      });

      res.status(200).json({
        success: true,
        message: 'Goods received successfully',
      });
    } catch (error: any) {
      logger.error('Error receiving goods', { error });

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
        message: error.message || 'Failed to receive goods',
      });
    }
  }
}
