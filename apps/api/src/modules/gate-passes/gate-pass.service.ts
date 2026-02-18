import { Prisma, GatePassStatus } from '@prisma/client';
import { CreateGatePassDto } from './dto/create-gate-pass.dto.js';
import { BadRequestError, NotFoundError } from '../../utils/errors.js';
import { AuditService } from '../../services/audit.service.js';
import { getTenantId } from '../../lib/prisma.js';
import logger from '../../lib/logger.js';

interface GatePassFilters {
  warehouseId?: string;
  status?: GatePassStatus;
  purpose?: string;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class GatePassService {
  constructor(private prisma: any) {}

  /**
   * Generate gate pass number: GP-{WH3}-YYYYMMDD-XXX
   */
  private async generateGatePassNumber(warehouseId: string, date: Date): Promise<string> {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: warehouseId },
      select: { name: true },
    });
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    const whCode = warehouse.name.substring(0, 3).toUpperCase();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');

    // Count existing gate passes for this warehouse on this date
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const count = await this.prisma.gatePass.count({
      where: {
        warehouseId,
        date: { gte: startOfDay, lte: endOfDay },
      },
    });

    const seq = String(count + 1).padStart(3, '0');
    return `GP-${whCode}-${dateStr}-${seq}`;
  }

  /**
   * Create a gate pass manually
   */
  async createGatePass(data: CreateGatePassDto, userId: string) {
    // Validate warehouse exists
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: data.warehouseId },
    });
    if (!warehouse) throw new NotFoundError('Warehouse not found');

    // Validate all products exist
    for (const item of data.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
        select: { id: true },
      });
      if (!product) throw new NotFoundError(`Product ${item.productId} not found`);
    }

    const gatePassNumber = await this.generateGatePassNumber(data.warehouseId, data.date);

    // Determine initial status based on warehouse mode
    const isAutoMode = warehouse.gatePassMode === 'AUTO';
    const initialStatus: GatePassStatus = isAutoMode ? 'APPROVED' : 'PENDING';

    const gatePass = await this.prisma.$transaction(async (tx: any) => {
      const gp = await tx.gatePass.create({
        data: {
          gatePassNumber,
          warehouseId: data.warehouseId,
          date: data.date,
          purpose: data.purpose,
          referenceType: data.referenceType,
          referenceId: data.referenceId,
          status: initialStatus,
          issuedBy: userId,
          approvedBy: isAutoMode ? userId : undefined,
          notes: data.notes,
          tenantId: getTenantId(),
        },
      });

      await tx.gatePassItem.createMany({
        data: data.items.map((item: any) => ({
          gatePassId: gp.id,
          productId: item.productId,
          batchNo: item.batchNo,
          binLocation: item.binLocation,
          quantity: item.quantity,
          description: item.description,
          tenantId: getTenantId(),
        })),
      });

      const created = await tx.gatePass.findUnique({
        where: { id: gp.id },
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          warehouse: { select: { id: true, name: true } },
          issuer: { select: { id: true, name: true } },
        },
      });

      // In AUTO mode, deduct inventory immediately
      if (isAutoMode) {
        await this.deductInventory(tx, created.id, userId);
      }

      return created;
    });

    await AuditService.log({
      userId,
      action: 'CREATE',
      entityType: 'GatePass',
      entityId: gatePass.id,
      notes: `Gate pass ${gatePassNumber} created (${initialStatus}). Purpose: ${data.purpose}. Items: ${data.items.length}`,
    });

    logger.info(`Gate pass created: ${gatePassNumber}`, { id: gatePass.id, status: initialStatus });
    return gatePass;
  }

  /**
   * Auto-create gate pass from an invoice
   */
  async createGatePassFromInvoice(invoiceId: string, userId: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
        warehouse: true,
      },
    });

    if (!invoice) throw new NotFoundError('Invoice not found');

    const gatePassNumber = await this.generateGatePassNumber(
      invoice.warehouseId,
      invoice.invoiceDate
    );

    const isAutoMode = invoice.warehouse.gatePassMode === 'AUTO';
    const initialStatus: GatePassStatus = isAutoMode ? 'APPROVED' : 'PENDING';

    const gp = await this.prisma.gatePass.create({
      data: {
        gatePassNumber,
        warehouseId: invoice.warehouseId,
        date: invoice.invoiceDate,
        purpose: 'SALE',
        referenceType: 'INVOICE',
        referenceId: invoice.id,
        status: initialStatus,
        issuedBy: userId,
        approvedBy: isAutoMode ? userId : undefined,
        notes: `Auto-created from invoice ${invoice.invoiceNumber}`,
        tenantId: getTenantId(),
      },
    });

    await this.prisma.gatePassItem.createMany({
      data: invoice.items.map((item: any) => ({
        gatePassId: gp.id,
        productId: item.productId,
        batchNo: item.batchNo,
        quantity: item.quantity,
        description: `Invoice item: ${item.product.name}`,
        tenantId: getTenantId(),
      })),
    });

    const gatePass = await this.prisma.gatePass.findUnique({
      where: { id: gp.id },
      include: {
        items: true,
        warehouse: { select: { id: true, name: true } },
      },
    });

    // NOTE: Inventory for invoice-linked gate passes is already deducted by the invoice flow.
    // We don't deduct again here.

    logger.info(`Gate pass auto-created from invoice: ${gatePassNumber}`, {
      invoiceId,
      gatePassId: gatePass.id,
    });

    return gatePass;
  }

  /**
   * Deduct inventory for gate pass items
   */
  private async deductInventory(
    tx: Prisma.TransactionClient,
    gatePassId: string,
    userId: string
  ) {
    const gatePass = await tx.gatePass.findUnique({
      where: { id: gatePassId },
      include: { items: true },
    });
    if (!gatePass) return;

    for (const item of gatePass.items) {
      // Find inventory record
      const inventory = await tx.inventory.findFirst({
        where: {
          productId: item.productId,
          warehouseId: gatePass.warehouseId,
          ...(item.batchNo ? { batchNo: item.batchNo } : {}),
        },
      });

      if (!inventory || inventory.quantity < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for product ${item.productId}. Available: ${inventory?.quantity || 0}, Required: ${item.quantity}`
        );
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: { decrement: item.quantity } },
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: gatePass.warehouseId,
          movementType: 'SALE',
          quantity: item.quantity,
          referenceType: gatePass.referenceType || 'INVOICE',
          referenceId: gatePass.referenceId || gatePass.id,
          userId,
          notes: `Gate pass ${gatePass.gatePassNumber} - dispatched`,
          tenantId: getTenantId(),
        },
      });
    }
  }

  /**
   * Restore inventory on gate pass cancellation
   */
  private async restoreInventory(
    tx: Prisma.TransactionClient,
    gatePassId: string,
    userId: string
  ) {
    const gatePass = await tx.gatePass.findUnique({
      where: { id: gatePassId },
      include: { items: true },
    });
    if (!gatePass) return;

    for (const item of gatePass.items) {
      // Find or create inventory record
      const inventory = await tx.inventory.findFirst({
        where: {
          productId: item.productId,
          warehouseId: gatePass.warehouseId,
          ...(item.batchNo ? { batchNo: item.batchNo } : {}),
        },
      });

      if (inventory) {
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { increment: item.quantity } },
        });
      } else {
        await tx.inventory.create({
          data: {
            productId: item.productId,
            warehouseId: gatePass.warehouseId,
            batchNo: item.batchNo,
            quantity: item.quantity,
            tenantId: getTenantId(),
          },
        });
      }

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: gatePass.warehouseId,
          movementType: 'ADJUSTMENT',
          quantity: item.quantity,
          referenceType: 'ADJUSTMENT',
          referenceId: gatePass.id,
          userId,
          notes: `Gate pass ${gatePass.gatePassNumber} cancelled - stock restored`,
          tenantId: getTenantId(),
        },
      });
    }
  }

  /**
   * List gate passes with filters and pagination
   */
  async getGatePasses(filters: GatePassFilters) {
    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.GatePassWhereInput = {};

    if (filters.warehouseId) where.warehouseId = filters.warehouseId;
    if (filters.status) where.status = filters.status;
    if (filters.purpose) where.purpose = filters.purpose as any;
    if (filters.dateFrom || filters.dateTo) {
      where.date = {};
      if (filters.dateFrom) where.date.gte = new Date(filters.dateFrom);
      if (filters.dateTo) where.date.lte = new Date(filters.dateTo);
    }
    if (filters.search) {
      where.gatePassNumber = { contains: filters.search };
    }

    const [data, total] = await Promise.all([
      this.prisma.gatePass.findMany({
        where,
        include: {
          warehouse: { select: { id: true, name: true } },
          issuer: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
          items: {
            include: {
              product: { select: { id: true, name: true, sku: true } },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.gatePass.count({ where }),
    ]);

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get gate pass by ID
   */
  async getGatePassById(id: string) {
    const gatePass = await this.prisma.gatePass.findUnique({
      where: { id },
      include: {
        warehouse: { select: { id: true, name: true, gatePassMode: true } },
        issuer: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
        items: {
          include: {
            product: { select: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (!gatePass) throw new NotFoundError('Gate pass not found');

    // Fetch dispatcher/completer names if set
    let dispatcherName: string | null = null;
    let completerName: string | null = null;

    if (gatePass.dispatchedBy) {
      const dispatcher = await this.prisma.user.findUnique({
        where: { id: gatePass.dispatchedBy },
        select: { name: true },
      });
      dispatcherName = dispatcher?.name || null;
    }
    if (gatePass.completedBy) {
      const completer = await this.prisma.user.findUnique({
        where: { id: gatePass.completedBy },
        select: { name: true },
      });
      completerName = completer?.name || null;
    }

    // Fetch reference number (e.g. invoice number) when linked to an invoice
    let referenceNumber: string | null = null;
    if (gatePass.referenceType === 'INVOICE' && gatePass.referenceId) {
      const invoice = await this.prisma.invoice.findUnique({
        where: { id: gatePass.referenceId },
        select: { invoiceNumber: true },
      });
      referenceNumber = invoice?.invoiceNumber || null;
    }

    return {
      ...gatePass,
      dispatcherName,
      completerName,
      referenceNumber,
    };
  }

  /**
   * Approve a gate pass: PENDING → APPROVED
   */
  async approveGatePass(id: string, userId: string) {
    const gatePass = await this.prisma.gatePass.findUnique({ where: { id } });
    if (!gatePass) throw new NotFoundError('Gate pass not found');
    if (gatePass.status !== 'PENDING') {
      throw new BadRequestError(`Cannot approve gate pass with status ${gatePass.status}`);
    }

    const updated = await this.prisma.gatePass.update({
      where: { id },
      data: { status: 'APPROVED', approvedBy: userId },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        warehouse: { select: { id: true, name: true } },
        issuer: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'GatePass',
      entityId: id,
      changedFields: { status: { old: 'PENDING', new: 'APPROVED' } },
      notes: `Gate pass ${gatePass.gatePassNumber} approved`,
    });

    return updated;
  }

  /**
   * Dispatch a gate pass: APPROVED → IN_TRANSIT
   * In MANUAL mode, this is where inventory gets deducted.
   */
  async dispatchGatePass(id: string, userId: string) {
    const gatePass = await this.prisma.gatePass.findUnique({
      where: { id },
      include: { warehouse: true },
    });
    if (!gatePass) throw new NotFoundError('Gate pass not found');
    if (gatePass.status !== 'APPROVED') {
      throw new BadRequestError(`Cannot dispatch gate pass with status ${gatePass.status}`);
    }

    const updated = await this.prisma.$transaction(async (tx: any) => {
      const result = await tx.gatePass.update({
        where: { id },
        data: { status: 'IN_TRANSIT', dispatchedBy: userId },
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          warehouse: { select: { id: true, name: true } },
          issuer: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
      });

      // In MANUAL mode, deduct inventory on dispatch
      // In AUTO mode, inventory was already deducted at creation
      // For invoice-linked gate passes, inventory is handled by the invoice flow
      if (gatePass.warehouse.gatePassMode === 'MANUAL' && !gatePass.referenceId) {
        await this.deductInventory(tx, id, userId);
      }

      return result;
    });

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'GatePass',
      entityId: id,
      changedFields: { status: { old: 'APPROVED', new: 'IN_TRANSIT' } },
      notes: `Gate pass ${gatePass.gatePassNumber} dispatched`,
    });

    return updated;
  }

  /**
   * Complete a gate pass: IN_TRANSIT → COMPLETED
   */
  async completeGatePass(id: string, userId: string) {
    const gatePass = await this.prisma.gatePass.findUnique({ where: { id } });
    if (!gatePass) throw new NotFoundError('Gate pass not found');
    if (gatePass.status !== 'IN_TRANSIT') {
      throw new BadRequestError(`Cannot complete gate pass with status ${gatePass.status}`);
    }

    const updated = await this.prisma.gatePass.update({
      where: { id },
      data: { status: 'COMPLETED', completedBy: userId },
      include: {
        items: { include: { product: { select: { id: true, name: true, sku: true } } } },
        warehouse: { select: { id: true, name: true } },
        issuer: { select: { id: true, name: true } },
        approver: { select: { id: true, name: true } },
      },
    });

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'GatePass',
      entityId: id,
      changedFields: { status: { old: 'IN_TRANSIT', new: 'COMPLETED' } },
      notes: `Gate pass ${gatePass.gatePassNumber} completed`,
    });

    return updated;
  }

  /**
   * Cancel a gate pass and restore inventory if deducted
   */
  async cancelGatePass(id: string, reason: string, userId: string) {
    const gatePass = await this.prisma.gatePass.findUnique({
      where: { id },
      include: { warehouse: true },
    });
    if (!gatePass) throw new NotFoundError('Gate pass not found');
    if (gatePass.status === 'COMPLETED' || gatePass.status === 'CANCELLED') {
      throw new BadRequestError(`Cannot cancel gate pass with status ${gatePass.status}`);
    }

    const oldStatus = gatePass.status;

    // Determine if inventory was deducted (needs restoration)
    const needsRestore =
      // AUTO mode: inventory deducted at creation (APPROVED or IN_TRANSIT)
      (gatePass.warehouse.gatePassMode === 'AUTO' && !gatePass.referenceId &&
        (gatePass.status === 'APPROVED' || gatePass.status === 'IN_TRANSIT')) ||
      // MANUAL mode: inventory deducted at dispatch (IN_TRANSIT)
      (gatePass.warehouse.gatePassMode === 'MANUAL' && !gatePass.referenceId &&
        gatePass.status === 'IN_TRANSIT');

    const updated = await this.prisma.$transaction(async (tx: any) => {
      if (needsRestore) {
        await this.restoreInventory(tx, id, userId);
      }

      return tx.gatePass.update({
        where: { id },
        data: { status: 'CANCELLED', cancelReason: reason },
        include: {
          items: { include: { product: { select: { id: true, name: true, sku: true } } } },
          warehouse: { select: { id: true, name: true } },
          issuer: { select: { id: true, name: true } },
          approver: { select: { id: true, name: true } },
        },
      });
    });

    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType: 'GatePass',
      entityId: id,
      changedFields: { status: { old: oldStatus, new: 'CANCELLED' } },
      notes: `Gate pass ${gatePass.gatePassNumber} cancelled. Reason: ${reason}. Inventory restored: ${needsRestore}`,
    });

    return updated;
  }
}
