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
   - [ ] Cannot rollback if entity has dependent transactions
   - [ ] Cannot rollback deleted entities
   - [ ] Rollback reason required

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

```typescript
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
  const canRollback = await validateRollback(entityType, entityId);
  if (!canRollback) {
    throw new BadRequestError('Cannot rollback: entity has dependent records');
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
    // Handle other entity types...
  }

  // Log rollback
  await auditLogger.log({
    action: 'ROLLBACK',
    userId,
    resource: entityType,
    resourceId: entityId,
    details: { targetVersion, reason }
  });
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
