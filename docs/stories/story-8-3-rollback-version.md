# Story 8.3: Rollback to Previous Version

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.3
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 8.2
**Status:** Draft - Phase 2

---

## User Story

**As an** admin,
**I want** to rollback a record to a previous version,
**So that** errors can be corrected without manual re-entry.

---

## Acceptance Criteria

1. **Backend API:**
   - [ ] POST /api/change-history/rollback - creates rollback operation
   - [ ] Payload: entityType, entityId, targetVersion, reason
   - [ ] GET /api/change-history/:entityType/:entityId/can-rollback - validates rollback safety

2. **Rollback Process:**
   - [ ] Load snapshot from ChangeHistory for targetVersion
   - [ ] Create UPDATE operation with old values
   - [ ] Capture new update in ChangeHistory as new version
   - [ ] Log rollback action in audit trail with reason

3. **Rollback Validation:**
   - [ ] Cannot rollback PAYMENTS (reversal-only policy)
   - [ ] Can rollback other entities with warnings if they have dependent records
   - [ ] Warnings include: "Related payments not reversed", "Collection data may be affected", "Associated invoices remain"
   - [ ] Cannot rollback deleted entities
   - [ ] Rollback reason required
   - [ ] Validate entity-specific conditions (see Dev Notes for details)

4. **Frontend:**
   - [ ] "Restore This Version" button in change history modal
   - [ ] Confirmation modal with warning
   - [ ] Rollback reason input (required)
   - [ ] Shows which fields will change
   - [ ] Success/error message after rollback
   - [ ] Reloads entity detail page

5. **Authorization:**
   - [ ] Only Admin can perform rollbacks
   - [ ] Rollback operations logged in audit trail

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
    blockedIfCondition: 'invoices with status != DRAFT',
    warning: 'Rollback may affect already invoiced items'
  },
  INVOICE: {
    canRollback: true,
    blockedIfCondition: 'payments applied > 0',
    warning: 'Rollback will not reverse associated payments - manual adjustment needed'
  },
  CLIENT: {
    canRollback: true,
    blockedIfCondition: 'active invoices or pending promises',
    warning: 'Contact information changes may affect collection'
  },
  PAYMENT: {
    canRollback: false,
    blockedIfCondition: 'always blocked',
    warning: 'Payments cannot be rolled back - create reversal instead'
  },
  PURCHASE_ORDER: {
    canRollback: true,
    blockedIfCondition: 'goods received',
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
    const invoice = await prisma.invoice.findUnique({
      where: { id: entityId },
      include: { payments: true }
    });
    if (invoice && invoice.payments.some(p => p.amount > 0)) {
      return {
        canRollback: true,
        warning: rule.warning // Allow with warning
      };
    }
  } else if (entityType === 'PRODUCT') {
    const product = await prisma.product.findUnique({
      where: { id: entityId },
      include: { invoiceItems: { where: { invoice: { status: { not: 'DRAFT' } } } } }
    });
    if (product && product.invoiceItems.length > 0) {
      return {
        canRollback: true,
        warning: rule.warning // Allow with warning
      };
    }
  } else if (entityType === 'CLIENT') {
    const client = await prisma.client.findUnique({
      where: { id: entityId },
      include: {
        invoices: { where: { status: { in: ['UNPAID', 'PARTIAL'] } } },
        paymentPromises: { where: { status: 'PENDING' } }
      }
    });
    if (client && (client.invoices.length > 0 || client.paymentPromises.length > 0)) {
      return {
        canRollback: true,
        warning: rule.warning // Allow with warning
      };
    }
  } else if (entityType === 'PURCHASE_ORDER') {
    const po = await prisma.purchaseOrder.findUnique({
      where: { id: entityId },
      include: { receivedItems: true }
    });
    if (po && po.receivedItems.length > 0) {
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
    await auditLogger.log({
      action: 'ROLLBACK_WARNING',
      userId,
      resource: entityType,
      resourceId: entityId,
      details: { warning: validation.warning, targetVersion, reason }
    });
  }

  // Perform rollback
  const snapshot = historyEntry.snapshot as any;

  switch (entityType) {
    case 'Product':
      await prisma.product.update({
        where: { id: entityId },
        data: snapshot
      });
      break;
    case 'Invoice':
      await prisma.invoice.update({
        where: { id: entityId },
        data: snapshot
      });
      break;
    case 'Client':
      await prisma.client.update({
        where: { id: entityId },
        data: snapshot
      });
      break;
    case 'PurchaseOrder':
      await prisma.purchaseOrder.update({
        where: { id: entityId },
        data: snapshot
      });
      break;
    default:
      throw new BadRequestError(`Rollback not implemented for ${entityType}`);
  }

  // Create new ChangeHistory entry for rollback action
  await prisma.changeHistory.create({
    data: {
      entityType,
      entityId,
      version: historyEntry.version + 1,
      action: 'ROLLBACK',
      userId,
      snapshot: snapshot, // Store the restored state
      changedFields: Object.keys(snapshot).join(',')
    }
  });

  // Log rollback in audit trail
  await auditLogger.log({
    action: 'ROLLBACK',
    userId,
    resource: entityType,
    resourceId: entityId,
    details: {
      targetVersion,
      reason,
      warning: validation.warning,
      rolledBackFields: Object.keys(snapshot)
    }
  });
}
```

### Implementation Notes

1. **Rollback Validation**: Entity-specific rules determine if rollback is allowed
2. **PAYMENT Exception**: Payments cannot be rolled back - must use reversal process instead
3. **Warnings**: Allow rollback with warnings when dependent records exist (not blocking)
4. **Audit Logging**: Both warning logs and rollback logs created
5. **Version Increment**: New ChangeHistory entry created to capture rollback as a new version
6. **Snapshot Storage**: Original snapshot stored to enable rollback chain if needed

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
