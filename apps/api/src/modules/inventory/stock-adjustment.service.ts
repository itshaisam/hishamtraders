import { PrismaClient, AdjustmentType, AdjustmentStatus } from '@prisma/client';
import { StockAdjustmentRepository } from './stock-adjustment.repository.js';
import { InventoryRepository } from './inventory.repository.js';
import { AuditService } from '../../services/audit.service.js';
import { AutoJournalService } from '../../services/auto-journal.service.js';

const prisma = new PrismaClient();

export interface CreateAdjustmentDto {
  productId: string;
  productVariantId?: string | null;
  warehouseId: string;
  adjustmentType: AdjustmentType;
  quantity: number;
  reason: string;
  notes?: string | null;
}

export interface AdjustmentFilters {
  productId?: string;
  warehouseId?: string;
  status?: AdjustmentStatus;
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export class StockAdjustmentService {
  private adjustmentRepo: StockAdjustmentRepository;
  private inventoryRepo: InventoryRepository;

  constructor() {
    this.adjustmentRepo = new StockAdjustmentRepository();
    this.inventoryRepo = new InventoryRepository();
  }

  /**
   * Create a new stock adjustment (PENDING status)
   * Inventory is NOT updated until admin approves
   */
  async createAdjustment(data: CreateAdjustmentDto, userId: string) {
    // Validate reason length
    if (!data.reason || data.reason.trim().length < 10) {
      throw new Error('Reason must be at least 10 characters');
    }

    // Validate quantity is not zero
    if (data.quantity === 0) {
      throw new Error('Quantity cannot be zero');
    }

    // Validate product exists
    const product = await prisma.product.findUnique({
      where: { id: data.productId },
      select: { id: true, name: true },
    });
    if (!product) {
      throw new Error('Product not found');
    }

    // Validate variant if provided
    if (data.productVariantId) {
      const variant = await prisma.productVariant.findUnique({
        where: { id: data.productVariantId },
        select: { id: true },
      });
      if (!variant) {
        throw new Error('Product variant not found');
      }
    }

    // Validate warehouse exists
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: data.warehouseId },
      select: { id: true, name: true },
    });
    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    // Create PENDING adjustment (no inventory update yet)
    const adjustment = await this.adjustmentRepo.create({
      productId: data.productId,
      productVariantId: data.productVariantId,
      warehouseId: data.warehouseId,
      adjustmentType: data.adjustmentType,
      quantity: data.quantity,
      reason: data.reason.trim(),
      notes: data.notes?.trim() || null,
      createdBy: userId,
    });

    // Story 6.8: Auto-approve if quantity is within threshold
    try {
      const thresholdSetting = await prisma.systemSetting.findUnique({
        where: { key: 'stock_adjustment_auto_approve_threshold' },
      });
      if (thresholdSetting) {
        const threshold = parseInt(thresholdSetting.value, 10);
        if (!isNaN(threshold) && Math.abs(data.quantity) <= threshold) {
          return await this.approveAdjustment(adjustment.id, userId);
        }
      }
    } catch {
      // If auto-approval fails, fall through and return the pending adjustment
    }

    return adjustment;
  }

  /**
   * Get all adjustments with filters
   */
  async getAll(filters: AdjustmentFilters) {
    return this.adjustmentRepo.findAll(filters);
  }

  /**
   * Get single adjustment by ID
   */
  async getById(id: string) {
    const adjustment = await this.adjustmentRepo.findById(id);
    if (!adjustment) {
      throw new Error('Adjustment not found');
    }
    return adjustment;
  }

  /**
   * Get pending adjustments (for admin approval queue)
   */
  async getPendingAdjustments(filters: { warehouseId?: string; page?: number; limit?: number }) {
    return this.adjustmentRepo.findPendingAdjustments(filters);
  }

  /**
   * Approve adjustment - Updates inventory and creates stock movement
   * All operations in atomic transaction
   */
  async approveAdjustment(id: string, adminId: string) {
    // Fetch adjustment
    const adjustment = await this.adjustmentRepo.findById(id);
    if (!adjustment) {
      throw new Error('Adjustment not found');
    }

    // Validate status
    if (adjustment.status !== 'PENDING') {
      throw new Error('Only pending adjustments can be approved');
    }

    // Check current inventory
    const inventory = await this.inventoryRepo.findByProductAndWarehouse(
      adjustment.productId,
      adjustment.warehouseId,
      adjustment.productVariantId,
      null // No batch tracking for adjustments (always null)
    );

    const currentQuantity = inventory?.quantity || 0;
    const newQuantity = currentQuantity + adjustment.quantity;

    // Prevent negative stock
    if (newQuantity < 0) {
      throw new Error(
        `Adjustment would result in negative stock. Current: ${currentQuantity}, Adjustment: ${adjustment.quantity}`
      );
    }

    // Execute in transaction to ensure atomicity
    const result = await prisma.$transaction(async (tx) => {
      let updatedInventory;

      // 1. Update or create inventory
      if (inventory) {
        updatedInventory = await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: newQuantity },
        });
      } else if (adjustment.quantity > 0) {
        // Create new inventory record only if quantity is positive
        updatedInventory = await tx.inventory.create({
          data: {
            productId: adjustment.productId,
            productVariantId: adjustment.productVariantId,
            warehouseId: adjustment.warehouseId,
            quantity: adjustment.quantity,
            batchNo: null,
            binLocation: null,
          },
        });
      } else {
        throw new Error('Cannot create inventory with negative quantity');
      }

      // 2. Create stock movement
      const stockMovement = await tx.stockMovement.create({
        data: {
          productId: adjustment.productId,
          productVariantId: adjustment.productVariantId,
          warehouseId: adjustment.warehouseId,
          movementType: 'ADJUSTMENT',
          quantity: Math.abs(adjustment.quantity),
          referenceType: 'ADJUSTMENT',
          referenceId: id,
          userId: adminId,
          notes: `${adjustment.adjustmentType}: ${adjustment.reason}`,
        },
      });

      // 3. Auto journal entry for stock adjustments (DECREASE only)
      const variantCost = adjustment.productVariantId
        ? (await tx.productVariant.findUnique({
            where: { id: adjustment.productVariantId },
            select: { costPrice: true },
          }))?.costPrice
        : null;
      const productCost = variantCost
        ?? (await tx.product.findUnique({
            where: { id: adjustment.productId },
            select: { costPrice: true },
          }))?.costPrice;

      await AutoJournalService.onStockAdjustmentApproved(tx, {
        id,
        adjustmentType: adjustment.adjustmentType,
        quantity: Math.abs(adjustment.quantity),
        costPrice: parseFloat((productCost || 0).toString()),
        reason: adjustment.reason,
      }, adminId);

      // 4. Update adjustment status to APPROVED
      const approvedAdjustment = await tx.stockAdjustment.update({
        where: { id },
        data: {
          status: 'APPROVED',
          reviewedBy: adminId,
          reviewedAt: new Date(),
          stockMovementId: stockMovement.id,
        },
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
            },
          },
          warehouse: {
            select: {
              id: true,
              name: true,
            },
          },
          creator: {
            select: {
              id: true,
              name: true,
            },
          },
          reviewer: {
            select: {
              id: true,
              name: true,
            },
          },
          stockMovement: true,
        },
      });

      return {
        adjustment: approvedAdjustment,
        inventory: updatedInventory,
        stockMovement,
      };
    });

    // Audit log for approval
    await AuditService.log({
      userId: adminId,
      action: 'UPDATE',
      entityType: 'StockAdjustment',
      entityId: id,
      changedFields: {
        status: { old: 'PENDING', new: 'APPROVED' },
        inventory: {
          old: currentQuantity,
          new: newQuantity
        },
      },
      notes: `Approved ${adjustment.adjustmentType} adjustment of ${adjustment.quantity} units for ${result.adjustment.product.name}. Reason: ${adjustment.reason}`,
    });

    return result.adjustment;
  }

  /**
   * Reject adjustment - No inventory update, just mark as rejected
   */
  async rejectAdjustment(id: string, adminId: string, rejectionReason: string) {
    // Validate rejection reason
    if (!rejectionReason || rejectionReason.trim().length < 10) {
      throw new Error('Rejection reason must be at least 10 characters');
    }

    // Fetch adjustment
    const adjustment = await this.adjustmentRepo.findById(id);
    if (!adjustment) {
      throw new Error('Adjustment not found');
    }

    // Validate status
    if (adjustment.status !== 'PENDING') {
      throw new Error('Only pending adjustments can be rejected');
    }

    // Update status to REJECTED (no inventory update, no stock movement)
    const rejectedAdjustment = await this.adjustmentRepo.reject(
      id,
      adminId,
      rejectionReason.trim()
    );

    // Audit log for rejection
    await AuditService.log({
      userId: adminId,
      action: 'UPDATE',
      entityType: 'StockAdjustment',
      entityId: id,
      changedFields: {
        status: { old: 'PENDING', new: 'REJECTED' },
      },
      notes: `Rejected stock adjustment. Rejection reason: ${rejectionReason}`,
    });

    return rejectedAdjustment;
  }
}
