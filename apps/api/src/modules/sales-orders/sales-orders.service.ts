import { Prisma } from '@prisma/client';
import { prisma, getTenantId } from '../../lib/prisma.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import logger from '../../lib/logger.js';
import { format } from 'date-fns';

interface CreateSalesOrderDto {
  clientId: string;
  warehouseId: string;
  paymentType?: 'CASH' | 'CREDIT';
  expectedDeliveryDate?: string;
  notes?: string;
  items: Array<{
    productId: string;
    productVariantId?: string;
    quantity: number;
    unitPrice: number;
    discount?: number;
  }>;
}

interface SalesOrderFilters {
  search?: string;
  status?: string;
  clientId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export class SalesOrdersService {
  constructor(private prismaClient: any = prisma) {}

  private async generateOrderNumber(tx: any): Promise<string> {
    const dateStr = format(new Date(), 'yyyyMMdd');
    const prefix = `SO-${dateStr}-`;
    const latest = await tx.salesOrder.findFirst({
      where: { orderNumber: { startsWith: prefix } },
      orderBy: { orderNumber: 'desc' },
      select: { orderNumber: true },
    });
    const nextSeq = latest
      ? parseInt(latest.orderNumber.split('-').pop()!) + 1
      : 1;
    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }

  async list(filters?: SalesOrderFilters) {
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.clientId) {
      where.clientId = filters.clientId;
    }

    if (filters?.dateFrom || filters?.dateTo) {
      where.orderDate = {};
      if (filters.dateFrom) where.orderDate.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.orderDate.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
    }

    if (filters?.search) {
      where.OR = [
        { orderNumber: { contains: filters.search } },
        { client: { name: { contains: filters.search } } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prismaClient.salesOrder.findMany({
        where,
        include: {
          client: { select: { id: true, name: true } },
          warehouse: { select: { id: true, name: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { items: true, deliveryNotes: true, invoices: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaClient.salesOrder.count({ where }),
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
    const order = await this.prismaClient.salesOrder.findFirst({
      where: { id },
      include: {
        client: { select: { id: true, name: true, creditLimit: true, balance: true } },
        warehouse: { select: { id: true, name: true } },
        creator: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true, costPrice: true, sellingPrice: true } },
            productVariant: { select: { id: true, variantName: true, sku: true, sellingPrice: true } },
          },
        },
        deliveryNotes: {
          select: { id: true, deliveryNoteNumber: true, status: true, deliveryDate: true },
        },
        invoices: {
          select: { id: true, invoiceNumber: true, status: true, total: true },
        },
      },
    });

    if (!order) throw new NotFoundError('Sales order not found');
    return order;
  }

  async create(data: CreateSalesOrderDto, userId: string) {
    logger.info('Creating sales order', { clientId: data.clientId, userId });

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

    // Get tax rate from system settings
    const taxRateSetting = await this.prismaClient.systemSetting.findFirst({
      where: { key: 'TAX_RATE' },
      select: { value: true },
    });
    const taxRate = taxRateSetting ? parseFloat(taxRateSetting.value) / 100 : 0;

    // Calculate item totals
    const itemsWithTotals = data.items.map(item => {
      const discount = item.discount || 0;
      const discountedPrice = item.unitPrice * (1 - discount / 100);
      const total = Math.round(discountedPrice * item.quantity * 10000) / 10000;
      return { ...item, discount, total };
    });

    const subtotal = Math.round(itemsWithTotals.reduce((sum, i) => sum + i.total, 0) * 10000) / 10000;
    const taxAmount = Math.round(subtotal * taxRate * 10000) / 10000;
    const total = Math.round((subtotal + taxAmount) * 10000) / 10000;

    const tenantId = getTenantId();

    const order = await this.prismaClient.$transaction(async (tx: any) => {
      const orderNumber = await this.generateOrderNumber(tx);

      // Create sales order
      const createdOrder = await tx.salesOrder.create({
        data: {
          orderNumber,
          clientId: data.clientId,
          warehouseId: data.warehouseId,
          paymentType: data.paymentType || 'CASH',
          expectedDeliveryDate: data.expectedDeliveryDate ? new Date(data.expectedDeliveryDate) : null,
          subtotal: new Prisma.Decimal(subtotal.toFixed(4)),
          taxRate: new Prisma.Decimal((taxRate).toFixed(4)),
          taxAmount: new Prisma.Decimal(taxAmount.toFixed(4)),
          total: new Prisma.Decimal(total.toFixed(4)),
          status: 'DRAFT',
          notes: data.notes || null,
          createdBy: userId,
          tenantId,
        },
      });

      // Create items
      await tx.salesOrderItem.createMany({
        data: itemsWithTotals.map(item => ({
          salesOrderId: createdOrder.id,
          productId: item.productId,
          productVariantId: item.productVariantId || null,
          quantity: item.quantity,
          unitPrice: new Prisma.Decimal(item.unitPrice.toFixed(4)),
          discount: new Prisma.Decimal(item.discount.toFixed(2)),
          total: new Prisma.Decimal(item.total.toFixed(4)),
          tenantId,
        })),
      });

      return createdOrder;
    });

    logger.info(`Sales order created: ${order.orderNumber}`, { orderId: order.id });
    return this.getById(order.id);
  }

  async confirm(id: string, userId: string) {
    const order = await this.prismaClient.salesOrder.findFirst({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new NotFoundError('Sales order not found');
    if (order.status !== 'DRAFT') {
      throw new BadRequestError('Only DRAFT orders can be confirmed');
    }

    await this.prismaClient.salesOrder.update({
      where: { id },
      data: { status: 'CONFIRMED', updatedBy: userId },
    });

    logger.info(`Sales order confirmed: ${order.orderNumber}`, { orderId: id });
    return this.getById(id);
  }

  async cancel(id: string, userId: string, reason: string) {
    const order = await this.prismaClient.salesOrder.findFirst({
      where: { id },
    });

    if (!order) throw new NotFoundError('Sales order not found');
    if (!['DRAFT', 'CONFIRMED'].includes(order.status)) {
      throw new BadRequestError('Only DRAFT or CONFIRMED orders can be cancelled');
    }

    await this.prismaClient.salesOrder.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelReason: reason,
        updatedBy: userId,
      },
    });

    logger.info(`Sales order cancelled: ${order.orderNumber}`, { orderId: id });
    return this.getById(id);
  }

  async close(id: string, userId: string) {
    const order = await this.prismaClient.salesOrder.findFirst({
      where: { id },
    });

    if (!order) throw new NotFoundError('Sales order not found');
    if (['DRAFT', 'CANCELLED', 'CLOSED'].includes(order.status)) {
      throw new BadRequestError(`Cannot close order with status ${order.status}`);
    }

    await this.prismaClient.salesOrder.update({
      where: { id },
      data: { status: 'CLOSED', updatedBy: userId },
    });

    logger.info(`Sales order closed: ${order.orderNumber}`, { orderId: id });
    return this.getById(id);
  }

  async getDeliverableItems(id: string) {
    const order = await this.prismaClient.salesOrder.findFirst({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            productVariant: { select: { id: true, variantName: true, sku: true } },
          },
        },
        client: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    if (!order) throw new NotFoundError('Sales order not found');

    const deliverableItems = order.items
      .map((item: any) => ({
        ...item,
        remainingQuantity: item.quantity - item.deliveredQuantity,
      }))
      .filter((item: any) => item.remainingQuantity > 0);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientId: order.clientId,
      client: order.client,
      warehouseId: order.warehouseId,
      warehouse: order.warehouse,
      items: deliverableItems,
    };
  }

  async getInvoiceableItems(id: string) {
    const order = await this.prismaClient.salesOrder.findFirst({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            productVariant: { select: { id: true, variantName: true, sku: true } },
          },
        },
        client: { select: { id: true, name: true } },
        warehouse: { select: { id: true, name: true } },
      },
    });

    if (!order) throw new NotFoundError('Sales order not found');

    const invoiceableItems = order.items
      .map((item: any) => ({
        ...item,
        remainingQuantity: item.quantity - item.invoicedQuantity,
      }))
      .filter((item: any) => item.remainingQuantity > 0);

    return {
      orderId: order.id,
      orderNumber: order.orderNumber,
      clientId: order.clientId,
      client: order.client,
      warehouseId: order.warehouseId,
      warehouse: order.warehouse,
      paymentType: order.paymentType,
      items: invoiceableItems,
    };
  }
}

/**
 * Update sales order status based on delivered/invoiced quantities.
 * Called by DeliveryNote and Invoice services when creating from a SO.
 */
export async function updateSalesOrderStatus(tx: any, salesOrderId: string): Promise<void> {
  const order = await tx.salesOrder.findFirst({
    where: { id: salesOrderId },
    include: { items: true },
  });

  if (!order || order.status === 'CANCELLED' || order.status === 'CLOSED') return;

  const allDelivered = order.items.every((i: any) => i.deliveredQuantity >= i.quantity);
  const someDelivered = order.items.some((i: any) => i.deliveredQuantity > 0);
  const allInvoiced = order.items.every((i: any) => i.invoicedQuantity >= i.quantity);
  const someInvoiced = order.items.some((i: any) => i.invoicedQuantity > 0);

  let newStatus = order.status;
  if (allInvoiced) newStatus = 'INVOICED';
  else if (someInvoiced) newStatus = 'PARTIALLY_INVOICED';
  else if (allDelivered) newStatus = 'DELIVERED';
  else if (someDelivered) newStatus = 'PARTIALLY_DELIVERED';

  if (newStatus !== order.status) {
    await tx.salesOrder.update({
      where: { id: salesOrderId },
      data: { status: newStatus },
    });
  }
}
