import { Prisma } from '@prisma/client';
import { prisma, getTenantId } from '../../lib/prisma.js';
import { AutoJournalService } from '../../services/auto-journal.service.js';
import { LandedCostService } from '../purchase-orders/landed-cost.service.js';
import { InventoryRepository } from '../inventory/inventory.repository.js';
import { GoodsReceiptsRepository, GRNFilters } from './goods-receipts.repository.js';
import { CreateGRNDto } from './dto/create-grn.dto.js';
import { AddGRNCostRequest } from './dto/add-grn-cost.dto.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import logger from '../../lib/logger.js';
import { format } from 'date-fns';

export class GoodsReceiptsService {
  private inventoryRepo: InventoryRepository;

  constructor(private repository: GoodsReceiptsRepository) {
    this.inventoryRepo = new InventoryRepository();
  }

  private generateBatchNo(): string {
    const dateStr = format(new Date(), 'yyyyMMdd');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    return `${dateStr}-${random}`;
  }

  async list(filters?: GRNFilters) {
    return this.repository.findAll(filters);
  }

  async getById(id: string) {
    const grn = await this.repository.findById(id);
    if (!grn) throw new NotFoundError('Goods Receipt Note not found');
    return grn;
  }

  async create(data: CreateGRNDto, userId: string) {
    logger.info('Creating GRN', { poId: data.poId, userId });

    // Validate PO exists and is receivable
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: data.poId },
      include: {
        items: { include: { product: true, productVariant: true } },
        supplier: { select: { name: true } },
      },
    });

    if (!po) throw new NotFoundError('Purchase order not found');

    const receivableStatuses = ['PENDING', 'IN_TRANSIT', 'PARTIALLY_RECEIVED'];
    if (!receivableStatuses.includes(po.status)) {
      throw new BadRequestError(
        `Cannot receive goods for ${po.status} purchase order. Only PENDING, IN_TRANSIT, or PARTIALLY_RECEIVED orders can be received.`
      );
    }

    // Build PO item map for validation
    const poItemMap = new Map(po.items.map((item: any) => [item.id, item]));

    // Validate each GRN item
    for (const grnItem of data.items) {
      const poItem = poItemMap.get(grnItem.poItemId) as any;
      if (!poItem) {
        throw new BadRequestError(`PO Item ${grnItem.poItemId} not found in this purchase order`);
      }

      const remaining = poItem.quantity - poItem.receivedQuantity;
      if (grnItem.quantity > remaining) {
        throw new BadRequestError(
          `Cannot receive ${grnItem.quantity} of ${poItem.product?.name || grnItem.productId}. Only ${remaining} remaining.`
        );
      }

      if (grnItem.productId !== poItem.productId) {
        throw new BadRequestError(`Product mismatch for PO Item ${grnItem.poItemId}`);
      }
    }

    const grnNumber = await this.repository.generateGRNNumber();
    const tenantId = getTenantId();
    const receivedDate = data.receivedDate || new Date();

    const grn = await prisma.$transaction(async (tx: any) => {
      // 1. Create GRN
      const createdGRN = await tx.goodsReceiveNote.create({
        data: {
          grnNumber,
          poId: data.poId,
          warehouseId: data.warehouseId,
          receivedDate,
          status: 'COMPLETED',
          notes: data.notes || null,
          createdBy: userId,
          tenantId,
        },
      });

      // 2. Create GRN items
      await tx.goodsReceiveNoteItem.createMany({
        data: data.items.map((item) => ({
          grnId: createdGRN.id,
          poItemId: item.poItemId,
          productId: item.productId,
          productVariantId: item.productVariantId || null,
          quantity: item.quantity,
          binLocation: item.binLocation || null,
          batchNo: item.batchNo || null,
          tenantId,
        })),
      });

      // 3. Update inventory + create stock movements for each item
      let totalReceivedValue = 0;
      for (const grnItem of data.items) {
        const poItem = poItemMap.get(grnItem.poItemId) as any;
        const batchNo = grnItem.batchNo || this.generateBatchNo();

        // Find or create inventory
        const existing = await this.inventoryRepo.findByProductAndWarehouse(
          grnItem.productId,
          data.warehouseId,
          grnItem.productVariantId,
          batchNo,
        );

        if (existing) {
          await tx.inventory.update({
            where: { id: existing.id },
            data: { quantity: existing.quantity + grnItem.quantity },
          });
        } else {
          await tx.inventory.create({
            data: {
              tenantId,
              productId: grnItem.productId,
              productVariantId: grnItem.productVariantId || null,
              warehouseId: data.warehouseId,
              quantity: grnItem.quantity,
              batchNo,
              binLocation: grnItem.binLocation || null,
            },
          });
        }

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: grnItem.productId,
            productVariantId: grnItem.productVariantId || null,
            warehouseId: data.warehouseId,
            movementType: 'RECEIPT',
            quantity: grnItem.quantity,
            referenceType: 'PO',
            referenceId: data.poId,
            userId,
            movementDate: receivedDate,
            notes: `Received via GRN ${grnNumber} from PO ${po.poNumber}`,
          },
        });

        // Update POItem receivedQuantity
        await tx.pOItem.update({
          where: { id: grnItem.poItemId },
          data: { receivedQuantity: { increment: grnItem.quantity } },
        });

        totalReceivedValue += grnItem.quantity * Number(poItem.unitCost);
      }

      // 4. Determine PO status
      const updatedPOItems = await tx.pOItem.findMany({
        where: { poId: data.poId },
      });

      const allFullyReceived = updatedPOItems.every(
        (item: any) => item.receivedQuantity >= item.quantity
      );

      const newPOStatus = allFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';

      await tx.purchaseOrder.update({
        where: { id: data.poId },
        data: { status: newPOStatus, updatedBy: userId },
      });

      // 5. Calculate landed cost and update product costPrice
      const landedCostService = new LandedCostService(tx);
      let landedCostMap: Record<string, number> = {};
      try {
        const landedCost = await landedCostService.calculateLandedCost(data.poId);
        for (const item of landedCost.breakdown) {
          const key = item.variantId || item.productId;
          landedCostMap[key] = item.landedCostPerUnit;
        }
      } catch {
        // No additional costs, fall back to PO item unitCost
      }

      for (const grnItem of data.items) {
        const poItem = poItemMap.get(grnItem.poItemId) as any;
        const key = grnItem.productVariantId || grnItem.productId;
        const newCost = landedCostMap[key] || Number(poItem.unitCost);

        if (grnItem.productVariantId) {
          await tx.productVariant.update({
            where: { id: grnItem.productVariantId },
            data: { costPrice: new Prisma.Decimal(newCost.toFixed(4)) },
          });
        } else {
          await tx.product.update({
            where: { id: grnItem.productId },
            data: { costPrice: new Prisma.Decimal(newCost.toFixed(4)) },
          });
        }
      }

      // 6. Auto journal entry: DR Inventory + DR Tax Payable, CR A/P
      const proportionalTax = Math.round(totalReceivedValue * Number(po.taxRate) / 100 * 10000) / 10000;
      await AutoJournalService.onGoodsReceived(tx, {
        poId: data.poId,
        poNumber: po.poNumber,
        totalAmount: totalReceivedValue + proportionalTax,
        taxAmount: proportionalTax,
        date: receivedDate,
      }, userId);

      return createdGRN;
    });

    logger.info(`GRN created: ${grnNumber}`, { grnId: grn.id, poId: data.poId });
    return this.repository.findById(grn.id);
  }

  async addCost(grnId: string, costData: AddGRNCostRequest, userId: string) {
    const grn = await this.repository.findById(grnId);
    if (!grn) throw new NotFoundError('Goods Receipt Note not found');

    if (grn.status !== 'COMPLETED') {
      throw new BadRequestError('Costs can only be added to COMPLETED Goods Receipt Notes');
    }

    if (costData.amount <= 0) {
      throw new BadRequestError('Cost amount must be greater than 0');
    }

    // Get PO number for journal description
    const poNumber = grn.purchaseOrder?.poNumber || '';

    logger.info(`Adding ${costData.type} cost to GRN: ${grn.grnNumber}`, {
      userId,
      amount: costData.amount,
    });

    const cost = await prisma.$transaction(async (tx: any) => {
      // 1. Create GRNCost record
      const costRecord = await tx.gRNCost.create({
        data: {
          tenantId: getTenantId(),
          grnId,
          type: costData.type,
          amount: costData.amount,
          description: costData.description,
          createdBy: userId,
        },
      });

      // 2. Journal entry: DR Inventory (1300) / CR A/P (2100)
      await AutoJournalService.onGRNCostAdded(tx, {
        grnId,
        grnNumber: grn.grnNumber,
        poNumber,
        amount: costData.amount,
        type: costData.type,
        date: new Date(),
      }, userId);

      // 3. Recalculate landed cost and update product costPrice
      const landedCostService = new LandedCostService(tx);
      try {
        const landedCost = await landedCostService.calculateGRNLandedCost(grnId);
        for (const item of landedCost.breakdown) {
          const newCost = item.landedCostPerUnit;
          if (item.variantId) {
            await tx.productVariant.update({
              where: { id: item.variantId },
              data: { costPrice: new Prisma.Decimal(newCost.toFixed(4)) },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { costPrice: new Prisma.Decimal(newCost.toFixed(4)) },
            });
          }
        }
        logger.info(`Recalculated product cost prices after adding cost to GRN: ${grn.grnNumber}`);
      } catch (err) {
        logger.warn('Could not recalculate landed cost after adding GRN cost', { err });
      }

      return costRecord;
    });

    logger.info(`Cost added with journal entry for GRN: ${grn.grnNumber}`, {
      userId,
      costId: cost.id,
    });

    return cost;
  }

  async getLandedCost(grnId: string) {
    const grn = await this.repository.findById(grnId);
    if (!grn) throw new NotFoundError('Goods Receipt Note not found');

    const landedCostService = new LandedCostService(prisma);
    return landedCostService.calculateGRNLandedCost(grnId);
  }

  async cancel(id: string, userId: string) {
    const grn = await this.repository.findById(id);
    if (!grn) throw new NotFoundError('Goods Receipt Note not found');

    if (grn.status !== 'COMPLETED') {
      throw new BadRequestError('Only COMPLETED GRNs can be cancelled');
    }

    const tenantId = getTenantId();

    await prisma.$transaction(async (tx: any) => {
      // 1. Reverse inventory for each GRN item
      for (const item of grn.items) {
        // Find the inventory record and decrement
        const existing = await this.inventoryRepo.findByProductAndWarehouse(
          item.productId,
          grn.warehouseId,
          item.productVariantId,
          item.batchNo,
        );

        if (existing) {
          await tx.inventory.update({
            where: { id: existing.id },
            data: { quantity: { decrement: item.quantity } },
          });
        }

        // Create reversal stock movement
        await tx.stockMovement.create({
          data: {
            tenantId,
            productId: item.productId,
            productVariantId: item.productVariantId || null,
            warehouseId: grn.warehouseId,
            movementType: 'ADJUSTMENT',
            quantity: -item.quantity,
            referenceType: 'PO',
            referenceId: grn.poId,
            userId,
            movementDate: new Date(),
            notes: `Reversal: GRN ${grn.grnNumber} cancelled`,
          },
        });

        // Revert POItem receivedQuantity
        await tx.pOItem.update({
          where: { id: item.poItemId },
          data: { receivedQuantity: { decrement: item.quantity } },
        });
      }

      // 2. Reverse journal entries for each GRNCost
      if (grn.costs && grn.costs.length > 0) {
        for (const cost of grn.costs) {
          await AutoJournalService.onGRNCostReversed(tx, {
            grnId: id,
            grnNumber: grn.grnNumber,
            amount: Number(cost.amount),
            type: cost.type,
            date: new Date(),
          }, userId);
        }
      }

      // 3. Reverse main goods-received journal entry
      let cancelledValue = 0;
      for (const item of grn.items) {
        const poItem = await tx.pOItem.findUnique({ where: { id: item.poItemId } });
        cancelledValue += item.quantity * Number(poItem.unitCost);
      }
      const po = await tx.purchaseOrder.findUnique({ where: { id: grn.poId } });
      const cancelledTax = Math.round(cancelledValue * Number(po.taxRate) / 100 * 10000) / 10000;

      await AutoJournalService.onGoodsReceivedReversed(tx, {
        poId: grn.poId,
        poNumber: po.poNumber,
        totalAmount: cancelledValue + cancelledTax,
        taxAmount: cancelledTax,
        date: new Date(),
      }, userId);

      // 4. Re-evaluate PO status
      const updatedPOItems = await tx.pOItem.findMany({
        where: { poId: grn.poId },
      });

      const totalReceived = updatedPOItems.reduce((s: number, i: any) => s + i.receivedQuantity, 0);
      let newStatus: string;
      if (totalReceived === 0) {
        newStatus = po?.shipDate ? 'IN_TRANSIT' : 'PENDING';
      } else {
        const allFullyReceived = updatedPOItems.every((i: any) => i.receivedQuantity >= i.quantity);
        newStatus = allFullyReceived ? 'RECEIVED' : 'PARTIALLY_RECEIVED';
      }

      await tx.purchaseOrder.update({
        where: { id: grn.poId },
        data: { status: newStatus, updatedBy: userId },
      });

      // 5. Update GRN status
      await tx.goodsReceiveNote.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    });

    logger.info(`GRN cancelled: ${grn.grnNumber}`, { grnId: id });
    return this.repository.findById(id);
  }
}
