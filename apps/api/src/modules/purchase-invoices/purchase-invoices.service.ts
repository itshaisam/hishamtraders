import { prisma, getTenantId } from '../../lib/prisma.js';
import { NotFoundError, BadRequestError } from '../../utils/errors.js';

interface CreatePurchaseInvoiceDto {
  invoiceNumber: string;
  supplierId: string;
  poId?: string | null;
  grnId?: string | null;
  invoiceDate: string;
  dueDate?: string | null;
  taxRate: number;
  notes?: string | null;
  items: Array<{
    productId: string;
    productVariantId?: string | null;
    quantity: number;
    unitCost: number;
  }>;
}

interface ListFilters {
  search?: string;
  status?: string;
  supplierId?: string;
  poId?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  limit?: number;
}

export class PurchaseInvoicesService {
  constructor(private prismaClient: any = prisma) {}

  async list(filters: ListFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;
    const tenantId = getTenantId();

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.supplierId) {
      where.supplierId = filters.supplierId;
    }

    if (filters.poId) {
      where.poId = filters.poId;
    }

    if (filters.search) {
      where.OR = [
        { internalNumber: { contains: filters.search } },
        { invoiceNumber: { contains: filters.search } },
        { supplier: { name: { contains: filters.search } } },
      ];
    }

    if (filters.dateFrom || filters.dateTo) {
      where.invoiceDate = {};
      if (filters.dateFrom) {
        where.invoiceDate.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.invoiceDate.lte = new Date(filters.dateTo + 'T23:59:59.999Z');
      }
    }

    const [data, total] = await Promise.all([
      this.prismaClient.purchaseInvoice.findMany({
        where,
        include: {
          supplier: { select: { id: true, name: true } },
          purchaseOrder: { select: { id: true, poNumber: true } },
          goodsReceiveNote: { select: { id: true, grnNumber: true } },
          creator: { select: { id: true, name: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prismaClient.purchaseInvoice.count({ where }),
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
    const pi = await this.prismaClient.purchaseInvoice.findFirst({
      where: { id },
      include: {
        supplier: { select: { id: true, name: true } },
        purchaseOrder: { select: { id: true, poNumber: true, status: true } },
        goodsReceiveNote: { select: { id: true, grnNumber: true, status: true } },
        creator: { select: { id: true, name: true, email: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            productVariant: { select: { id: true, variantName: true, sku: true } },
          },
        },
      },
    });

    if (!pi) {
      throw new NotFoundError('Purchase Invoice not found');
    }

    return pi;
  }

  async create(dto: CreatePurchaseInvoiceDto, userId: string) {
    const tenantId = getTenantId();

    // Validate supplier exists
    const supplier = await this.prismaClient.supplier.findFirst({
      where: { id: dto.supplierId },
    });
    if (!supplier) {
      throw new NotFoundError('Supplier not found');
    }

    // Validate PO if provided
    if (dto.poId) {
      const po = await this.prismaClient.purchaseOrder.findFirst({
        where: { id: dto.poId },
      });
      if (!po) {
        throw new NotFoundError('Purchase Order not found');
      }
    }

    // Validate GRN if provided
    if (dto.grnId) {
      const grn = await this.prismaClient.goodsReceiveNote.findFirst({
        where: { id: dto.grnId },
      });
      if (!grn) {
        throw new NotFoundError('Goods Receive Note not found');
      }
    }

    // Calculate totals
    const subtotal = dto.items.reduce((sum, item) => sum + item.quantity * item.unitCost, 0);
    const taxRate = dto.taxRate / 100;
    const taxAmount = subtotal * taxRate;
    const total = subtotal + taxAmount;

    return await this.prismaClient.$transaction(async (tx: any) => {
      const internalNumber = await this.generateInternalNumber(tx, new Date(dto.invoiceDate));

      const pi = await tx.purchaseInvoice.create({
        data: {
          internalNumber,
          invoiceNumber: dto.invoiceNumber,
          supplierId: dto.supplierId,
          poId: dto.poId || null,
          grnId: dto.grnId || null,
          invoiceDate: new Date(dto.invoiceDate),
          dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
          subtotal,
          taxRate: dto.taxRate,
          taxAmount,
          total,
          notes: dto.notes || null,
          createdBy: userId,
          tenantId,
          items: {
            create: dto.items.map((item) => ({
              productId: item.productId,
              productVariantId: item.productVariantId || null,
              quantity: item.quantity,
              unitCost: item.unitCost,
              total: item.quantity * item.unitCost,
              tenantId,
            })),
          },
        },
        include: {
          supplier: { select: { id: true, name: true } },
          purchaseOrder: { select: { id: true, poNumber: true } },
          goodsReceiveNote: { select: { id: true, grnNumber: true } },
          creator: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
              productVariant: { select: { id: true, variantName: true, sku: true } },
            },
          },
        },
      });

      return pi;
    });
  }

  async cancel(id: string, userId: string, cancelReason: string) {
    const pi = await this.prismaClient.purchaseInvoice.findFirst({
      where: { id },
    });

    if (!pi) {
      throw new NotFoundError('Purchase Invoice not found');
    }

    if (pi.status !== 'PENDING' && pi.status !== 'PARTIAL') {
      throw new BadRequestError('Only PENDING or PARTIAL purchase invoices can be cancelled');
    }

    return await this.prismaClient.purchaseInvoice.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        supplier: { select: { id: true, name: true } },
        purchaseOrder: { select: { id: true, poNumber: true } },
        goodsReceiveNote: { select: { id: true, grnNumber: true } },
        creator: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            productVariant: { select: { id: true, variantName: true, sku: true } },
          },
        },
      },
    });
  }

  async getMatching(id: string) {
    const pi = await this.prismaClient.purchaseInvoice.findFirst({
      where: { id },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
            productVariant: { select: { id: true, variantName: true, sku: true } },
          },
        },
        purchaseOrder: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, sku: true } },
                productVariant: { select: { id: true, variantName: true, sku: true } },
              },
            },
          },
        },
        goodsReceiveNote: {
          include: {
            items: {
              include: {
                product: { select: { id: true, name: true, sku: true } },
                productVariant: { select: { id: true, variantName: true, sku: true } },
                poItem: { select: { unitCost: true } },
              },
            },
          },
        },
      },
    });

    if (!pi) {
      throw new NotFoundError('Purchase Invoice not found');
    }

    // Build product-level comparison
    const variances = pi.items.map((piItem: any) => {
      const poItem = pi.purchaseOrder?.items.find(
        (i: any) => i.productId === piItem.productId && i.productVariantId === piItem.productVariantId
      );
      const grnItem = pi.goodsReceiveNote?.items.find(
        (i: any) => i.productId === piItem.productId && i.productVariantId === piItem.productVariantId
      );

      const poQty = poItem?.quantity || 0;
      const grnQty = grnItem?.quantity || 0;
      const piQty = piItem.quantity;
      const poUnitCost = poItem ? Number(poItem.unitCost) : 0;
      const piUnitCost = Number(piItem.unitCost);

      return {
        productId: piItem.productId,
        productName: piItem.product.name,
        productSku: piItem.product.sku,
        variantName: piItem.productVariant?.variantName || null,
        poQty,
        grnQty,
        piQty,
        poUnitCost,
        piUnitCost,
        qtyMatch: poQty === grnQty && grnQty === piQty,
        costMatch: poItem ? poUnitCost === piUnitCost : true,
      };
    });

    return {
      poItems: pi.purchaseOrder?.items || [],
      grnItems: pi.goodsReceiveNote?.items || [],
      piItems: pi.items,
      variances,
    };
  }

  /**
   * Update paid amount and auto-update status.
   * Called from payments service when supplier payment references a PI.
   */
  async updatePaidAmount(tx: any, purchaseInvoiceId: string, paymentAmount: number) {
    const pi = await tx.purchaseInvoice.findFirst({
      where: { id: purchaseInvoiceId },
    });

    if (!pi) {
      throw new NotFoundError('Purchase Invoice not found');
    }

    if (pi.status === 'CANCELLED') {
      throw new BadRequestError('Cannot record payment against a cancelled Purchase Invoice');
    }

    const newPaidAmount = Number(pi.paidAmount) + paymentAmount;
    const total = Number(pi.total);

    let status = pi.status;
    if (newPaidAmount >= total) {
      status = 'PAID';
    } else if (newPaidAmount > 0) {
      status = 'PARTIAL';
    }

    return await tx.purchaseInvoice.update({
      where: { id: purchaseInvoiceId },
      data: {
        paidAmount: newPaidAmount,
        status,
      },
    });
  }

  private async generateInternalNumber(tx: any, date: Date): Promise<string> {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const dateStr = `${year}${month}${day}`;
    const prefix = `PI-${dateStr}-`;

    const latest = await tx.purchaseInvoice.findFirst({
      where: { internalNumber: { startsWith: prefix } },
      orderBy: { internalNumber: 'desc' },
    });

    const nextSeq = latest
      ? parseInt(latest.internalNumber.split('-').pop()!) + 1
      : 1;

    return `${prefix}${String(nextSeq).padStart(3, '0')}`;
  }
}
