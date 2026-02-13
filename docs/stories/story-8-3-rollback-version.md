# Story 8.3: Rollback to Previous Version

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.3
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 8.2
**Status:** Implemented (v3.0)

---

## User Story

**As an** admin,
**I want** to rollback a record to a previous version,
**So that** errors can be corrected without manual re-entry.

---

## Acceptance Criteria

1. **Backend API:**
   - [x] POST /api/v1/change-history/rollback - creates rollback operation
   - [x] Payload: entityType, entityId, targetVersion, reason
   - [x] GET /api/v1/change-history/:entityType/:entityId/can-rollback - validates rollback safety

2. **Rollback Process:**
   - [x] Load snapshot from ChangeHistory for targetVersion
   - [x] Create UPDATE operation with old values
   - [x] Capture new update in ChangeHistory as new version
   - [x] Log rollback action in audit trail with reason

3. **Rollback Validation:**
   - [x] Cannot rollback PAYMENTS (reversal-only policy)
   - [x] Can rollback other entities with warnings if they have dependent records
   - [x] Warnings include: "Related payments not reversed", "Collection data may be affected", "Associated invoices remain"
   - [x] Cannot rollback deleted entities
   - [x] Rollback reason required
   - [x] Validate entity-specific conditions (see Dev Notes for details)

4. **Frontend:**
   - [x] "Restore This Version" button in change history modal
   - [x] Confirmation modal with warning
   - [x] Rollback reason input (required)
   - [x] Shows which fields will change
   - [x] Success/error message after rollback
   - [x] Reloads entity detail page

5. **Authorization:**
   - [x] Only Admin can perform rollbacks
   - [x] Rollback operations logged in audit trail

---

## Dev Notes

### Rollback Safety Rules

Entity-specific rollback policy with dependent record validation:

```typescript
const ROLLBACK_SAFETY_RULES: Record<string, {
  canRollback: boolean;
  blockedIfCondition: string;
  warning?: string;
}> = {
  PRODUCT: {
    canRollback: true,
    blockedIfCondition: 'has InvoiceItem records linked to non-voided invoices',
    warning: 'Rollback may affect already invoiced items'
  },
  INVOICE: {
    canRollback: true,
    blockedIfCondition: 'has PaymentAllocation records with amount > 0',
    warning: 'Rollback will not reverse associated payment allocations - manual adjustment needed'
  },
  CLIENT: {
    canRollback: true,
    blockedIfCondition: 'has active invoices (PENDING or PARTIAL status)',
    warning: 'Contact information changes may affect collection'
  },
  PAYMENT: {
    canRollback: false,
    blockedIfCondition: 'always blocked',
    warning: 'Payments cannot be rolled back - create reversal instead'
  },
  PURCHASE_ORDER: {
    canRollback: true,
    blockedIfCondition: 'has POItem records where goods have been received (PO status = RECEIVED)',
    warning: 'Rollback will not reverse received goods'
  }
};

async function validateRollback(
  entityType: string,
  entityId: string,
  targetVersion: number
): Promise<{
  canRollback: boolean;
  warning?: string;
  blockedReason?: string;
}> {
  const rule = ROLLBACK_SAFETY_RULES[entityType];

  if (!rule) {
    throw new BadRequestError(`Rollback not supported for ${entityType}`);
  }

  // PAYMENT: never rollback
  if (!rule.canRollback) {
    return {
      canRollback: false,
      blockedReason: rule.warning
    };
  }

  // Check entity-specific conditions
  if (entityType === 'INVOICE') {
    // Invoice uses `allocations` (PaymentAllocation[]), NOT `payments`
    const invoice = await prisma.invoice.findUnique({
      where: { id: entityId },
      include: { allocations: true }
    });
    if (invoice && invoice.allocations.some(a => Number(a.amount) > 0)) {
      return {
        canRollback: true,
        warning: rule.warning // Allow with warning
      };
    }
  } else if (entityType === 'PRODUCT') {
    // Product -> invoiceItems relation exists on the Product model
    const product = await prisma.product.findUnique({
      where: { id: entityId },
      include: {
        invoiceItems: {
          include: { invoice: { select: { status: true } } }
        }
      }
    });
    const hasActiveInvoiceItems = product?.invoiceItems.some(
      item => item.invoice.status !== 'VOIDED' && item.invoice.status !== 'CANCELLED'
    );
    if (hasActiveInvoiceItems) {
      return {
        canRollback: true,
        warning: rule.warning // Allow with warning
      };
    }
  } else if (entityType === 'CLIENT') {
    // Client has `invoices` relation. Use PENDING/PARTIAL status (NOT 'UNPAID' -- that enum value does not exist).
    // Client does NOT have `paymentPromises` relation.
    const client = await prisma.client.findUnique({
      where: { id: entityId },
      include: {
        invoices: { where: { status: { in: ['PENDING', 'PARTIAL'] } } }
      }
    });
    if (client && client.invoices.length > 0) {
      return {
        canRollback: true,
        warning: rule.warning // Allow with warning
      };
    }
  } else if (entityType === 'PURCHASE_ORDER') {
    // PurchaseOrder has `items` (POItem[]), NOT `receivedItems`.
    // Check PO status to determine if goods received.
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: entityId },
      include: { items: true }
    });
    if (po && po.status === 'RECEIVED') {
      return {
        canRollback: true,
        warning: rule.warning // Allow with warning
      };
    }
  }

  return { canRollback: true };
}

async function rollbackToVersion(
  entityType: string,
  entityId: string,
  targetVersion: number,
  reason: string,
  userId: string
): Promise<void> {
  // Get target version snapshot
  const historyEntry = await prisma.changeHistory.findUnique({
    where: {
      entityType_entityId_version: {
        entityType,
        entityId,
        version: targetVersion
      }
    }
  });

  if (!historyEntry) {
    throw new NotFoundError('Version not found');
  }

  // Validate rollback is safe
  const validation = await validateRollback(entityType, entityId, targetVersion);
  if (!validation.canRollback) {
    throw new BadRequestError(`Cannot rollback: ${validation.blockedReason}`);
  }

  // Log warning if present (to audit trail)
  if (validation.warning) {
    await AuditService.log({
      userId,
      action: 'UPDATE',
      entityType,
      entityId,
      notes: `Rollback warning: ${validation.warning}. Target version: ${targetVersion}. Reason: ${reason}`
    });
  }

  // Perform rollback -- use consistent UPPER_CASE entity type keys in switch
  const snapshot = historyEntry.snapshot as any;

  switch (entityType) {
    case 'PRODUCT':
      await prisma.product.update({
        where: { id: entityId },
        data: snapshot
      });
      break;
    case 'INVOICE':
      await prisma.invoice.update({
        where: { id: entityId },
        data: snapshot
      });
      break;
    case 'CLIENT':
      await prisma.client.update({
        where: { id: entityId },
        data: snapshot
      });
      break;
    case 'PURCHASE_ORDER':
      await prisma.purchaseOrder.update({
        where: { id: entityId },
        data: snapshot
      });
      break;
    case 'SUPPLIER':
      await prisma.supplier.update({
        where: { id: entityId },
        data: snapshot
      });
      break;
    default:
      throw new BadRequestError(`Rollback not implemented for ${entityType}`);
  }

  // Capture the rollback as a new ChangeHistory version
  // ChangeHistory fields: entityType, entityId, version, changedBy, snapshot, changeReason
  const existingVersions = await prisma.changeHistory.findMany({
    where: { entityType, entityId },
    orderBy: { version: 'desc' },
    take: 1
  });
  const nextVersion = (existingVersions[0]?.version || 0) + 1;

  await prisma.changeHistory.create({
    data: {
      entityType,
      entityId,
      version: nextVersion,
      changedBy: userId,
      snapshot: snapshot, // Store the restored state
      changeReason: `Rollback to version ${targetVersion}: ${reason}`
    }
  });

  // Log rollback in audit trail using AuditService
  await AuditService.log({
    userId,
    action: 'UPDATE',
    entityType,
    entityId,
    notes: `Rolled back to version ${targetVersion}. Reason: ${reason}. ` +
           `Restored fields: ${Object.keys(snapshot).join(', ')}` +
           (validation.warning ? `. Warning: ${validation.warning}` : '')
  });
}
```

### Implementation Notes

1. **Rollback Validation**: Entity-specific rules determine if rollback is allowed.
2. **PAYMENT Exception**: Payments cannot be rolled back -- must use reversal process instead.
3. **Warnings**: Allow rollback with warnings when dependent records exist (not blocking).
4. **Audit Logging**: Uses `AuditService.log()` with `action: 'UPDATE'` and descriptive `notes` (since custom action strings like `ROLLBACK` are not supported).
5. **Version Increment**: New ChangeHistory entry created to capture rollback as a new version.
6. **Snapshot Storage**: Original snapshot stored to enable rollback chain if needed.
7. **Consistent Entity Type Keys**: Safety rules and switch cases both use UPPER_CASE keys (`PRODUCT`, `INVOICE`, etc.) to avoid case mismatch bugs.

---

### Key Corrections (from v1.0)

1. **API path:** Changed `/api/change-history/` to `/api/v1/change-history/` to match the project's API base URL convention.
2. **`auditLogger.log()` replaced with `AuditService.log()`:** The actual service is `AuditService` with static method `log()`. It accepts `{ userId, action, entityType, entityId?, notes? }` -- NOT `resource`, `resourceId`, `details`.
3. **`action: 'ROLLBACK'` and `action: 'ROLLBACK_WARNING'` replaced with `action: 'UPDATE'`:** The `AuditService` only accepts: `CREATE | UPDATE | DELETE | VIEW | LOGIN | LOGOUT | PERMISSION_CHECK`. Custom action strings are invalid. Rollback context is recorded in the `notes` field instead.
4. **`invoice.payments` replaced with `invoice.allocations`:** Invoice has `allocations` (PaymentAllocation[]) relation, NOT `payments`. PaymentAllocation is the join table between Payment and Invoice.
5. **`client.invoices` status `'UNPAID'` replaced with `'PENDING'`:** The `InvoiceStatus` enum values are: `PENDING | PARTIAL | PAID | OVERDUE | CANCELLED | VOIDED`. There is no `UNPAID` status.
6. **`client.paymentPromises` removed:** Client model has NO `paymentPromises` relation. That feature depends on Story 7.5 which may not be implemented. Removed from validation logic entirely.
7. **`purchaseOrder.receivedItems` replaced with `items` + status check:** PurchaseOrder has `items` (POItem[]) and `costs` (POCost[]) relations, NOT `receivedItems`. Checking `po.status === 'RECEIVED'` is the correct way to determine if goods were received.
8. **`product.invoiceItems` query fixed:** Product DOES have an `invoiceItems` relation (InvoiceItem[]). However, the original code used `where: { invoice: { status: { not: 'DRAFT' } } }` -- there is no `DRAFT` status. Changed to filter out `VOIDED` and `CANCELLED` instead.
9. **ChangeHistory create fields fixed:** The original used `action`, `userId`, `changedFields` which are not fields on the ChangeHistory model. Corrected to use `changedBy`, `snapshot`, `changeReason` (the actual model fields from Story 8.2).
10. **Case consistency fixed:** Safety rules used UPPER_CASE keys (`'PRODUCT'`, `'INVOICE'`) but the switch statement used PascalCase (`'Product'`, `'Invoice'`). Unified to UPPER_CASE throughout.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: corrected API paths, fixed AuditService call signature, fixed Invoice/Client/PO relation names, corrected enum values, fixed ChangeHistory field names, unified entity type casing | Claude (Tech Review) |
| 2026-02-13 | 3.0     | Implemented: rollback API (POST /rollback, GET /can-rollback), entity-specific safety validation, admin-only authorization, frontend confirmation UI with field preview and reason input | Claude (Implementation) |
