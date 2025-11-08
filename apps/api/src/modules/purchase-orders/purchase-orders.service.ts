import logger from '../../lib/logger.js';
import { PurchaseOrderRepository } from './purchase-orders.repository.js';
import { PurchaseOrderFilters } from './dto/purchase-order-filter.dto.js';
import { CreatePurchaseOrderRequest } from './dto/create-purchase-order.dto.js';
import { UpdatePurchaseOrderRequest } from './dto/update-purchase-order.dto.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { POStatus } from '@prisma/client';

export class PurchaseOrderService {
  constructor(private repository: PurchaseOrderRepository) {}

  /**
   * Create a new purchase order
   */
  async createPurchaseOrder(
    data: CreatePurchaseOrderRequest,
    userId: string
  ) {
    try {
      logger.info(`Creating purchase order for supplier: ${data.supplierId}`, {
        userId,
        itemCount: data.items.length,
      });

      // Validate all items have valid quantities and costs
      for (const item of data.items) {
        if (item.quantity <= 0) {
          throw new BadRequestError('Quantity must be greater than 0');
        }
        if (item.unitCost <= 0) {
          throw new BadRequestError('Unit cost must be greater than 0');
        }
      }

      const po = await this.repository.create(data, userId);

      logger.info(`Purchase order created successfully: ${po.poNumber}`, {
        userId,
        poId: po.id,
      });

      return po;
    } catch (error) {
      if (error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Error creating purchase order', { error, userId });
      throw new BadRequestError('Failed to create purchase order');
    }
  }

  /**
   * Get all purchase orders with filters
   */
  async getPurchaseOrders(filters?: PurchaseOrderFilters) {
    try {
      logger.info('Fetching purchase orders', { filters });

      const result = await this.repository.findAll(filters);

      return result;
    } catch (error) {
      logger.error('Error fetching purchase orders', { error });
      throw new BadRequestError('Failed to fetch purchase orders');
    }
  }

  /**
   * Get a specific purchase order
   */
  async getPurchaseOrder(id: string) {
    try {
      const po = await this.repository.findById(id);

      if (!po) {
        throw new NotFoundError('Purchase order not found');
      }

      return po;
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error fetching purchase order', { error, id });
      throw new BadRequestError('Failed to fetch purchase order');
    }
  }

  /**
   * Update a purchase order
   */
  async updatePurchaseOrder(id: string, data: UpdatePurchaseOrderRequest, userId: string) {
    try {
      const po = await this.repository.findById(id);

      if (!po) {
        throw new NotFoundError('Purchase order not found');
      }

      // Validate status transition
      if (data.status) {
        this.validateStatusTransition(po.status, data.status);
      }

      logger.info(`Updating purchase order: ${po.poNumber}`, {
        userId,
        updates: Object.keys(data),
      });

      const updated = await this.repository.update(id, data);

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Error updating purchase order', { error, id, userId });
      throw new BadRequestError('Failed to update purchase order');
    }
  }

  /**
   * Update purchase order status
   */
  async updatePurchaseOrderStatus(
    id: string,
    status: POStatus,
    userId: string
  ) {
    try {
      const po = await this.repository.findById(id);

      if (!po) {
        throw new NotFoundError('Purchase order not found');
      }

      // Validate status transition
      this.validateStatusTransition(po.status, status);

      logger.info(`Updating PO status: ${po.poNumber} -> ${status}`, {
        userId,
      });

      return await this.repository.updateStatus(id, status);
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Error updating purchase order status', { error, id, userId });
      throw new BadRequestError('Failed to update purchase order status');
    }
  }

  /**
   * Delete a purchase order
   */
  async deletePurchaseOrder(id: string, userId: string) {
    try {
      const po = await this.repository.findById(id);

      if (!po) {
        throw new NotFoundError('Purchase order not found');
      }

      // Only PENDING orders can be deleted
      if (po.status !== 'PENDING') {
        throw new BadRequestError(
          `Cannot delete ${po.status} purchase order. Only PENDING orders can be deleted.`
        );
      }

      logger.info(`Deleting purchase order: ${po.poNumber}`, {
        userId,
      });

      await this.repository.delete(id);

      logger.info(`Purchase order deleted: ${po.poNumber}`, {
        userId,
      });
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Error deleting purchase order', { error, id, userId });
      throw new BadRequestError('Failed to delete purchase order');
    }
  }

  /**
   * Validate status transitions
   * PENDING -> IN_TRANSIT or CANCELLED
   * IN_TRANSIT -> RECEIVED or CANCELLED
   * RECEIVED -> terminal (no transitions)
   * CANCELLED -> terminal (no transitions)
   */
  private validateStatusTransition(currentStatus: POStatus, newStatus: POStatus) {
    const validTransitions: Record<POStatus, POStatus[]> = {
      PENDING: ['IN_TRANSIT', 'CANCELLED'],
      IN_TRANSIT: ['RECEIVED', 'CANCELLED'],
      RECEIVED: [],
      CANCELLED: [],
    };

    if (!validTransitions[currentStatus].includes(newStatus)) {
      throw new BadRequestError(
        `Invalid status transition from ${currentStatus} to ${newStatus}`
      );
    }
  }

  /**
   * Get purchase order statistics
   */
  async getStatistics() {
    try {
      return await this.repository.getStatistics();
    } catch (error) {
      logger.error('Error fetching purchase order statistics', { error });
      throw new BadRequestError('Failed to fetch statistics');
    }
  }
}
