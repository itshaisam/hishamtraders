import { prisma } from '../lib/prisma.js';
import { Prisma } from '@prisma/client';
import { AuditService } from './audit.service.js';
import { BadRequestError, NotFoundError } from '../utils/errors.js';

/**
 * Whitelisted fields per entity type.
 * Only these fields are stored in the snapshot to avoid bloat / sensitive data.
 */
const ENTITY_SNAPSHOT_WHITELIST: Record<string, string[]> = {
  PRODUCT: [
    'id', 'name', 'sku', 'categoryId', 'brandId', 'uomId',
    'costPrice', 'sellingPrice', 'reorderLevel', 'binLocation', 'status',
  ],
  CLIENT: [
    'id', 'name', 'contactPerson', 'email', 'phone',
    'city', 'area', 'creditLimit', 'paymentTermsDays', 'balance',
    'status', 'taxExempt', 'taxExemptReason',
  ],
  SUPPLIER: [
    'id', 'name', 'contactPerson', 'email', 'phone',
    'address', 'countryId', 'paymentTermId', 'status',
  ],
  PURCHASE_ORDER: [
    'id', 'poNumber', 'supplierId', 'orderDate',
    'expectedArrivalDate', 'totalAmount', 'status',
    'containerNo', 'notes',
  ],
  INVOICE: [
    'id', 'invoiceNumber', 'clientId', 'warehouseId',
    'invoiceDate', 'dueDate', 'paymentType',
    'subtotal', 'taxAmount', 'taxRate', 'total', 'paidAmount',
    'status', 'notes',
  ],
  PAYMENT: [
    'id', 'supplierId', 'clientId', 'paymentType',
    'paymentReferenceType', 'referenceId', 'amount',
    'method', 'referenceNumber', 'date', 'notes', 'recordedBy',
  ],
};

class ChangeHistoryService {
  /**
   * Capture the current state of an entity before it gets updated.
   * Keeps a maximum of 2 previous versions per entity.
   */
  async captureSnapshot(
    entityType: string,
    entityId: string,
    currentData: Record<string, unknown>,
    changedBy?: string,
    changeReason?: string
  ): Promise<void> {
    try {
      const whitelist = ENTITY_SNAPSHOT_WHITELIST[entityType];
      if (!whitelist) return; // Entity type not tracked

      // Filter to whitelisted fields only
      const snapshot: Record<string, unknown> = {};
      for (const key of whitelist) {
        if (key in currentData) {
          const value = currentData[key];
          // Convert Decimal to number for JSON serialization
          if (value !== null && typeof value === 'object' && 'toNumber' in (value as any)) {
            snapshot[key] = (value as any).toNumber();
          } else {
            snapshot[key] = value;
          }
        }
      }

      // Get existing versions for this entity
      const existingVersions = await prisma.changeHistory.findMany({
        where: { entityType, entityId },
        orderBy: { version: 'desc' },
      });

      const newVersion = (existingVersions[0]?.version ?? 0) + 1;

      // Create new version
      await prisma.changeHistory.create({
        data: {
          entityType,
          entityId,
          version: newVersion,
          changedBy,
          snapshot: snapshot as Prisma.InputJsonValue,
          changeReason,
        },
      });

      // Keep only last 2 versions — delete older ones
      if (existingVersions.length >= 2) {
        const idsToDelete = existingVersions.slice(1).map((v) => v.id);
        if (idsToDelete.length > 0) {
          await prisma.changeHistory.deleteMany({
            where: { id: { in: idsToDelete } },
          });
        }
      }
    } catch (error) {
      // Snapshot failure should not break the main operation
      console.error('Change history snapshot failed:', error);
    }
  }

  /**
   * Get version history for an entity.
   */
  async getHistory(entityType: string, entityId: string) {
    const history = await prisma.changeHistory.findMany({
      where: { entityType, entityId },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { version: 'desc' },
    });

    return history.map((h) => ({
      id: h.id,
      version: h.version,
      changedBy: h.user,
      changedAt: h.changedAt,
      snapshot: h.snapshot,
      changeReason: h.changeReason,
    }));
  }
  /**
   * Validate whether rollback is safe for a given entity.
   */
  async canRollback(
    entityType: string,
    entityId: string
  ): Promise<{ canRollback: boolean; warning?: string; blockedReason?: string }> {
    // PAYMENT: never rollback
    if (entityType === 'PAYMENT') {
      return { canRollback: false, blockedReason: 'Payments cannot be rolled back — create reversal instead' };
    }

    // Must have at least one version to rollback to
    const versions = await prisma.changeHistory.findMany({
      where: { entityType, entityId },
      take: 1,
    });
    if (versions.length === 0) {
      return { canRollback: false, blockedReason: 'No previous versions available' };
    }

    // Entity-specific checks
    if (entityType === 'INVOICE') {
      const invoice = await prisma.invoice.findUnique({
        where: { id: entityId },
        include: { allocations: true },
      });
      if (!invoice) return { canRollback: false, blockedReason: 'Invoice not found' };
      if (invoice.allocations.some((a) => Number(a.amount) > 0)) {
        return { canRollback: true, warning: 'Rollback will not reverse associated payment allocations — manual adjustment needed' };
      }
    } else if (entityType === 'PRODUCT') {
      const product = await prisma.product.findUnique({
        where: { id: entityId },
        include: {
          invoiceItems: { include: { invoice: { select: { status: true } } } },
        },
      });
      if (!product) return { canRollback: false, blockedReason: 'Product not found' };
      const hasActive = product.invoiceItems.some(
        (item) => item.invoice.status !== 'VOIDED' && item.invoice.status !== 'CANCELLED'
      );
      if (hasActive) {
        return { canRollback: true, warning: 'Rollback may affect already invoiced items' };
      }
    } else if (entityType === 'CLIENT') {
      const client = await prisma.client.findUnique({
        where: { id: entityId },
        include: { invoices: { where: { status: { in: ['PENDING', 'PARTIAL'] } } } },
      });
      if (!client) return { canRollback: false, blockedReason: 'Client not found' };
      if (client.invoices.length > 0) {
        return { canRollback: true, warning: 'Contact information changes may affect collection' };
      }
    } else if (entityType === 'PURCHASE_ORDER') {
      const po = await prisma.purchaseOrder.findUnique({
        where: { id: entityId },
        include: { items: true },
      });
      if (!po) return { canRollback: false, blockedReason: 'Purchase order not found' };
      if (po.status === 'RECEIVED') {
        return { canRollback: true, warning: 'Rollback will not reverse received goods' };
      }
    } else if (entityType === 'SUPPLIER') {
      const supplier = await prisma.supplier.findUnique({ where: { id: entityId } });
      if (!supplier) return { canRollback: false, blockedReason: 'Supplier not found' };
    } else {
      throw new BadRequestError(`Rollback not supported for ${entityType}`);
    }

    return { canRollback: true };
  }

  /**
   * Rollback an entity to a previous version.
   */
  async rollbackToVersion(
    entityType: string,
    entityId: string,
    targetVersion: number,
    reason: string,
    userId: string
  ): Promise<{ fieldsRestored: string[] }> {
    // 1. Find the target version snapshot
    const historyEntry = await prisma.changeHistory.findUnique({
      where: {
        entityType_entityId_version: { entityType, entityId, version: targetVersion },
      },
    });
    if (!historyEntry) {
      throw new NotFoundError('Version not found');
    }

    // 2. Validate
    const validation = await this.canRollback(entityType, entityId);
    if (!validation.canRollback) {
      throw new BadRequestError(`Cannot rollback: ${validation.blockedReason}`);
    }

    const snapshot = historyEntry.snapshot as Record<string, unknown>;
    // Remove id from snapshot — we don't want to overwrite the primary key
    const { id: _id, ...updateData } = snapshot;

    // 3. Capture current state before rollback (as a new version)
    const currentEntity = await this.fetchEntity(entityType, entityId);
    if (currentEntity) {
      await this.captureSnapshot(entityType, entityId, currentEntity, userId, `Before rollback to version ${targetVersion}`);
    }

    // 4. Perform rollback
    switch (entityType) {
      case 'PRODUCT':
        await prisma.product.update({ where: { id: entityId }, data: updateData });
        break;
      case 'INVOICE':
        await prisma.invoice.update({ where: { id: entityId }, data: updateData });
        break;
      case 'CLIENT':
        await prisma.client.update({ where: { id: entityId }, data: updateData });
        break;
      case 'PURCHASE_ORDER':
        await prisma.purchaseOrder.update({ where: { id: entityId }, data: updateData });
        break;
      case 'SUPPLIER':
        await prisma.supplier.update({ where: { id: entityId }, data: updateData });
        break;
      default:
        throw new BadRequestError(`Rollback not implemented for ${entityType}`);
    }

    // 5. Audit log
    const restoredFields = Object.keys(updateData);
    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType,
      entityId,
      notes: `Rolled back to version ${targetVersion}. Reason: ${reason}. Restored fields: ${restoredFields.join(', ')}${validation.warning ? `. Warning: ${validation.warning}` : ''}`,
    });

    return { fieldsRestored: restoredFields };
  }

  /**
   * Fetch current entity data for snapshot capture before rollback.
   */
  private async fetchEntity(entityType: string, entityId: string): Promise<Record<string, unknown> | null> {
    switch (entityType) {
      case 'PRODUCT':
        return prisma.product.findUnique({ where: { id: entityId } }) as any;
      case 'CLIENT':
        return prisma.client.findUnique({ where: { id: entityId } }) as any;
      case 'SUPPLIER':
        return prisma.supplier.findUnique({ where: { id: entityId } }) as any;
      case 'PURCHASE_ORDER':
        return prisma.purchaseOrder.findUnique({ where: { id: entityId } }) as any;
      case 'INVOICE':
        return prisma.invoice.findUnique({ where: { id: entityId } }) as any;
      default:
        return null;
    }
  }
}

export const changeHistoryService = new ChangeHistoryService();
