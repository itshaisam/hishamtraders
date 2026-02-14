import logger from '../../lib/logger.js';
import { prisma } from '../../lib/prisma.js';
import { changeHistoryService } from '../../services/change-history.service.js';
import { AutoJournalService } from '../../services/auto-journal.service.js';
import { PurchaseOrderRepository } from './purchase-orders.repository.js';
import { PurchaseOrderFilters } from './dto/purchase-order-filter.dto.js';
import { CreatePurchaseOrderRequest } from './dto/create-purchase-order.dto.js';
import { UpdatePurchaseOrderRequest } from './dto/update-purchase-order.dto.js';
import { AddPOCostRequest } from './dto/add-po-cost.dto.js';
import { UpdateImportDetailsRequest } from './dto/update-import-details.dto.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { POStatus } from '@prisma/client';
import { variantsRepository } from '../variants/variants.repository.js';
import { LandedCostService } from './landed-cost.service.js';

export class PurchaseOrderService {
  constructor(
    private repository: PurchaseOrderRepository,
    private landedCostService: LandedCostService
  ) {}

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

        // Validate product variant if provided
        if (item.productVariantId) {
          const variant = await variantsRepository.findById(item.productVariantId);
          if (!variant) {
            throw new BadRequestError(`Product variant ${item.productVariantId} not found`);
          }
          if (variant.status !== 'ACTIVE') {
            throw new BadRequestError(`Product variant ${item.productVariantId} is inactive`);
          }
          // Ensure variant belongs to the specified product
          if (variant.productId !== item.productId) {
            throw new BadRequestError(`Variant ${item.productVariantId} does not belong to product ${item.productId}`);
          }
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

      // Capture snapshot before update
      await changeHistoryService.captureSnapshot('PURCHASE_ORDER', id, po as any, userId);

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

  /**
   * Add a cost to a purchase order
   * Only allowed when PO status is IN_TRANSIT or RECEIVED
   */
  async addCost(poId: string, costData: AddPOCostRequest, userId: string) {
    try {
      // Validate PO exists
      const po = await this.repository.findById(poId);
      if (!po) {
        throw new NotFoundError('Purchase order not found');
      }

      // Validate PO status - costs can only be added when PO is IN_TRANSIT or RECEIVED
      if (po.status !== 'IN_TRANSIT' && po.status !== 'RECEIVED') {
        throw new BadRequestError(
          `Cannot add costs to ${po.status} purchase order. Costs can only be added when status is IN_TRANSIT or RECEIVED.`
        );
      }

      // Validate amount
      if (costData.amount <= 0) {
        throw new BadRequestError('Cost amount must be greater than 0');
      }

      logger.info(`Adding ${costData.type} cost to PO: ${po.poNumber}`, {
        userId,
        amount: costData.amount,
      });

      // Use transaction to create cost record + journal entry atomically
      const cost = await prisma.$transaction(async (tx) => {
        const costRecord = await tx.pOCost.create({
          data: {
            poId,
            type: costData.type,
            amount: costData.amount,
            description: costData.description,
            createdBy: userId,
          },
        });

        // Create journal entry: DR Inventory (1300) / CR A/P (2100)
        await AutoJournalService.onPOCostAdded(tx, {
          poId,
          poNumber: po.poNumber,
          amount: costData.amount,
          type: costData.type,
          date: new Date(),
        }, userId);

        return costRecord;
      });

      logger.info(`Cost added with journal entry for PO: ${po.poNumber}`, {
        userId,
        costId: cost.id,
      });

      return cost;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Error adding cost to purchase order', { error, poId, userId });
      throw new BadRequestError('Failed to add cost to purchase order');
    }
  }

  /**
   * Get all costs for a purchase order
   */
  async getCosts(poId: string) {
    try {
      // Validate PO exists
      const po = await this.repository.findById(poId);
      if (!po) {
        throw new NotFoundError('Purchase order not found');
      }

      return await this.repository.getCosts(poId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error fetching costs for purchase order', { error, poId });
      throw new BadRequestError('Failed to fetch costs');
    }
  }

  /**
   * Update import details for a purchase order
   * Only allowed when PO status is IN_TRANSIT or RECEIVED
   */
  async updateImportDetails(
    poId: string,
    details: UpdateImportDetailsRequest,
    userId: string
  ) {
    try {
      // Validate PO exists
      const po = await this.repository.findById(poId);
      if (!po) {
        throw new NotFoundError('Purchase order not found');
      }

      // Validate PO status
      if (po.status !== 'IN_TRANSIT' && po.status !== 'RECEIVED') {
        throw new BadRequestError(
          `Cannot update import details for ${po.status} purchase order. Import details can only be updated when status is IN_TRANSIT or RECEIVED.`
        );
      }

      logger.info(`Updating import details for PO: ${po.poNumber}`, {
        userId,
      });

      const updated = await this.repository.updateImportDetails(poId, details, userId);

      logger.info(`Import details updated for PO: ${po.poNumber}`, {
        userId,
      });

      return updated;
    } catch (error) {
      if (error instanceof NotFoundError || error instanceof BadRequestError) {
        throw error;
      }
      logger.error('Error updating import details', { error, poId, userId });
      throw new BadRequestError('Failed to update import details');
    }
  }

  /**
   * Get landed cost calculation for a purchase order
   */
  async getLandedCost(poId: string) {
    try {
      // Validate PO exists
      const po = await this.repository.findById(poId);
      if (!po) {
        throw new NotFoundError('Purchase order not found');
      }

      return await this.landedCostService.calculateLandedCost(poId);
    } catch (error) {
      if (error instanceof NotFoundError) {
        throw error;
      }
      logger.error('Error calculating landed cost', { error, poId });
      throw new BadRequestError('Failed to calculate landed cost');
    }
  }
}
