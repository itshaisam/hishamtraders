import { prisma, getTenantId } from '../../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { FifoDeductionService } from '../inventory/fifo-deduction.service.js';
import { AutoJournalService } from '../../services/auto-journal.service.js';
import { updateSalesOrderStatus } from '../sales-orders/sales-orders.service.js';
import logger from '../../lib/logger.js';
import { format } from 'date-fns';

interface CreateDeliveryNoteDto {
  salesOrderId?: string;
  clientId: string;
  warehouseId: string;
  deliveryAddress?: string;
  driverName?: string;
  vehicleNo?: string;
  notes?: string;
  items: Array<{
    salesOrderItemId?: string;
    productId: string;
    productVariantId?: string;
    quantity: number;
  }>;
}

interface DeliveryNoteFilters {
  search?: string;
  status?: string;
  clientId?: string;
  salesOrderId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export class DeliveryNotesService {
  constructor(private prismaClient: any = prisma) {}

  private async generateDNNumber(tx: any): Promise<string> {
    const dateStr = format(new Date(), 'yyyyMMdd');
    const prefix = `DN-${dateStr}-`;
    const latest = await tx.deliveryNote.findFirst({
      where: { deliveryNoteNumber: { startsWith: prefix } },
      orderBy: { deliveryNoteNumber: 'desc' },
      select: { deliveryNoteNumber: true },
    });
    const nextSeq = latest
      ? parseInt(latest.deliveryNoteNumber.split('-').pop()!) + 1
      : 1;
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  async list(filters?: DeliveryNoteFilters) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) where.status = filters.status;
    if (filters?.clientId) where.clientId = filters.clientId;
    if (filters?.salesOrderId) where.salesOrderId = filters.salesOrderId;

    if (filters?.dateFrom || filters?.dateTo) {
      where.deliveryDate = {};
      if (filters.dateFrom) where.deliveryDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.deliveryDate.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
    }

    if (filters?.search) {
      where.OR = [
        { deliveryNoteNumber: { contains: filters.search } },
        { client: { name: { contains: filters.search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prismaClient.deliveryNote.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          salesOrder: { select: { id: true, orderNumber: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaClient.deliveryNote.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(id: string) {
    const dn = await this.prismaClient.deliveryNote.findFirst({
      where: { id },
      include: {
        client: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
        salesOrder: { select: { id: true, orderNumber: true, status: true } },
        creator: { select: { id: true, name: true, email: true } },
        dispatcher: { select: { id: true, name: true } },
        completer: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            productVariant: { select: { id: true, variantName: true, sku: true } },
            salesOrderItem: {
              select: { id: true, quantity: true, deliveredQuantity: true },
            },
          },
        },
        invoices: {
          select: { id: true, invoiceNumber: true, status: true, total: true },
        },
      },
    });

    if (!dn) throw new NotFoundError('Delivery Note not found');
    return dn;
  }

  async create(data: CreateDeliveryNoteDto, userId: string) {
    logger.info('Creating delivery note', { clientId: data.clientId, userId });

    // Validate client
    const client = await this.prismaClient.client.findFirst({
      where: { id: data.clientId },
    });
    if (!client) throw new NotFoundError('Client not found');

    // Validate warehouse
    const warehouse = await this.prismaClient.warehouse.findFirst({
      where: { id: data.warehouseId },
    });
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    // If SO-linked, validate remaining deliverable quantities
    if (data.salesOrderId) {
      const so = await this.prismaClient.salesOrder.findFirst({
        where: { id: data.salesOrderId },
        include: { items: true },
      });
      if (!so) throw new NotFoundError('Sales Order not found');
      if (!['CONFIRMED', 'PARTIALLY_DELIVERED'].includes(so.status)) {
        throw new BadRequestError('Sales Order must be CONFIRMED or PARTIALLY_DELIVERED');
      }

      for (const dnItem of data.items) {
        if (dnItem.salesOrderItemId) {
          const soItem = so.items.find((i: any) => i.id === dnItem.salesOrderItemId);
          if (!soItem) {
            throw new BadRequestError(`Sales Order item ${dnItem.salesOrderItemId} not found`);
          }
          const remaining = soItem.quantity - soItem.deliveredQuantity;
          if (dnItem.quantity > remaining) {
            throw new BadRequestError(
              `Quantity ${dnItem.quantity} exceeds remaining deliverable quantity ${remaining} for SO item`
            );
          }
        }
      }
    }

    const tenantId = getTenantId();

    const dn = await this.prismaClient.$transaction(async (tx: any) => {
      const deliveryNoteNumber = await this.generateDNNumber(tx);

      const created = await tx.deliveryNote.create({
        data: {
          deliveryNoteNumber,
          salesOrderId: data.salesOrderId || null,
          clientId: data.clientId,
          warehouseId: data.warehouseId,
          deliveryAddress: data.deliveryAddress || null,
          driverName: data.driverName || null,
          vehicleNo: data.vehicleNo || null,
          notes: data.notes || null,
          status: 'PENDING',
          createdBy: userId,
          tenantId,
        },
      });

      await tx.deliveryNoteItem.createMany({
        data: data.items.map(item => ({
          deliveryNoteId: created.id,
          salesOrderItemId: item.salesOrderItemId || null,
          productId: item.productId,
          productVariantId: item.productVariantId || null,
          quantity: item.quantity,
          tenantId,
        })),
      });

      return created;
    });

    logger.info(`Delivery note created: ${dn.deliveryNoteNumber}`, { dnId: dn.id });
    return this.getById(dn.id);
  }

  async dispatch(id: string, userId: string) {
    return this.prismaClient.$transaction(async (tx: any) => {
      const dn = await tx.deliveryNote.findFirst({
        where: { id },
        include: {
          items: {
            include: {
              product: { select: { id: true, name: true, costPrice: true } },
              productVariant: { select: { id: true, variantName: true, costPrice: true } },
            },
          },
        },
      });

      if (!dn) throw new NotFoundError('Delivery Note not found');
      if (dn.status !== 'PENDING') {
        throw new BadRequestError('Only PENDING delivery notes can be dispatched');
      }

      const fifoService = new FifoDeductionService(tx);
      const tenantId = getTenantId();
      const cogsItems: Array<{ productId: string; quantity: number }> = [];

      for (const item of dn.items) {
        // Check stock availability
        const available = await fifoService.getAvailableQuantity(
          item.productId,
          dn.warehouseId,
          item.productVariantId
        );
        if (available < item.quantity) {
          throw new BadRequestError(
            `Insufficient stock for ${item.product.name}: available ${available}, requested ${item.quantity}`
          );
        }

        // Deduct stock via FIFO
        const deductions = await fifoService.deductStockFifo(
          item.productId,
          dn.warehouseId,
          item.quantity,
          item.productVariantId
        );
        await fifoService.applyDeductions(deductions, tx);

        // Create stock movements
        for (const deduction of deductions) {
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              productVariantId: item.productVariantId,
              warehouseId: dn.warehouseId,
              movementType: 'DELIVERY',
              quantity: deduction.quantityDeducted,
              referenceType: 'DELIVERY_NOTE',
              referenceId: dn.id,
              userId,
              notes: `Delivery Note ${dn.deliveryNoteNumber} - Batch ${deduction.batchNo || 'N/A'}`,
            },
          });
        }

        // Store batch on DN item (first batch used)
        if (deductions.length > 0) {
          await tx.deliveryNoteItem.update({
            where: { id: item.id },
            data: { batchNo: deductions[0].batchNo },
          });
        }

        // Accumulate COGS data
        cogsItems.push({ productId: item.productId, quantity: item.quantity });

        // Update SO item delivered quantity (if SO-linked)
        if (item.salesOrderItemId) {
          await tx.salesOrderItem.update({
            where: { id: item.salesOrderItemId },
            data: { deliveredQuantity: { increment: item.quantity } },
          });
        }
      }

      // Post COGS journal entry
      await AutoJournalService.onDeliveryDispatched(
        tx,
        {
          id: dn.id,
          deliveryNoteNumber: dn.deliveryNoteNumber,
          date: new Date(),
          items: cogsItems,
        },
        userId
      );

      // Update SO status if linked
      if (dn.salesOrderId) {
        await updateSalesOrderStatus(tx, dn.salesOrderId);
      }

      // Update DN status
      await tx.deliveryNote.update({
        where: { id },
        data: { status: 'DISPATCHED', dispatchedBy: userId },
      });

      return this.getById(id);
    });
  }

  async deliver(id: string, userId: string) {
    const dn = await this.prismaClient.deliveryNote.findFirst({
      where: { id },
    });

    if (!dn) throw new NotFoundError('Delivery Note not found');
    if (dn.status !== 'DISPATCHED') {
      throw new BadRequestError('Only DISPATCHED delivery notes can be marked as delivered');
    }

    await this.prismaClient.deliveryNote.update({
      where: { id },
      data: { status: 'DELIVERED', completedBy: userId },
    });

    logger.info(`Delivery note delivered: ${dn.deliveryNoteNumber}`, { dnId: id });
    return this.getById(id);
  }

  async cancel(id: string, userId: string, reason: string) {
    const dn = await this.prismaClient.deliveryNote.findFirst({
      where: { id },
    });

    if (!dn) throw new NotFoundError('Delivery Note not found');
    if (dn.status !== 'PENDING') {
      throw new BadRequestError('Only PENDING delivery notes can be cancelled');
    }

    await this.prismaClient.deliveryNote.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
      },
    });

    logger.info(`Delivery note cancelled: ${dn.deliveryNoteNumber}`, { dnId: id });
    return this.getById(id);
  }
}
