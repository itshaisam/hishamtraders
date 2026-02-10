# Story 6.8: Stock Adjustment Approval Workflow

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.8
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 2.8 (Stock Adjustments)
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As an** admin,
**I want** stock adjustments to require approval for large quantities,
**So that** inventory shrinkage is properly authorized.

---

## Acceptance Criteria

1. **Configuration:**
   - [ ] Approval threshold stored in `SystemSetting` table (key: `ADJUSTMENT_APPROVAL_THRESHOLD`, default: 1000)

2. **Existing Schema:**
   - [ ] `StockAdjustment` model already exists with `status` (PENDING/APPROVED/REJECTED), `AdjustmentType` enum
   - [ ] Add fields if missing: `approvedBy`, `approvedAt`, `value` (Decimal)

3. **Adjustment Creation:**
   - [ ] If value < threshold: status = APPROVED (immediately applied)
   - [ ] If value >= threshold: status = PENDING (awaits approval)
   - [ ] Value calculated as: `quantity × product.costPrice`

4. **Backend API:**
   - [ ] `PUT /api/v1/inventory/adjustments/:id/approve` — approves adjustment
   - [ ] `PUT /api/v1/inventory/adjustments/:id/reject` — rejects adjustment
   - [ ] `GET /api/v1/inventory/adjustments/pending` — pending approvals

5. **Frontend:**
   - [ ] Stock Adjustment form displays "Requires Approval" notice
   - [ ] Pending Adjustments page (Admin only)
   - [ ] Approval modal with details

6. **Authorization:**
   - [ ] Only Admin can approve/reject
   - [ ] Adjustment approvals logged via `AuditService.log()`

---

## Dev Notes

### Implementation Status

**Backend:** Partially exists. `StockAdjustment` model, `AdjustmentType` enum (WASTAGE, DAMAGE, THEFT, CORRECTION), and `AdjustmentStatus` enum (PENDING, APPROVED, REJECTED) already exist in schema. Need to add approval workflow logic.

### Key Corrections

1. **API paths**: Use `/api/v1/inventory/adjustments/...` (not `/api/inventory/adjustments/...`)
2. **`prisma.configuration`** — There is NO `Configuration` model. Use existing `SystemSetting` model (from Story 3.10):
   ```typescript
   const setting = await prisma.systemSetting.findUnique({
     where: { key: 'ADJUSTMENT_APPROVAL_THRESHOLD' }
   });
   const threshold = setting ? parseFloat(setting.value) : 1000;
   ```
3. **`prisma.alert.create()`** — No `Alert` model exists. For MVP, pending adjustments are shown on the Pending Adjustments page. No push notifications.
4. **`auditLogger.log()`** → `AuditService.log()`:
   ```typescript
   await AuditService.log({
     userId,
     action: 'UPDATE',
     entityType: 'StockAdjustment',
     entityId: adjustmentId,
     notes: `Adjustment approved: ${product.name}, ${adjustment.type}, qty ${adjustment.quantity}`,
   });
   ```
5. **`referenceType: 'STOCK_ADJUSTMENT'`** on StockMovement — NOT in ReferenceType enum. Use existing `'ADJUSTMENT'`.
6. **StockAdjustment schema** — Verify existing model has `value` and `approvedBy`/`approvedAt` fields. If not, add them via migration.

### Schema Check / Changes

**Existing StockAdjustment model** — verify it has these fields. Add if missing:
```prisma
// Fields that may need to be ADDED to existing StockAdjustment:
value       Decimal    @db.Decimal(12, 2)   // quantity × costPrice
approvedBy  String?
approvedAt  DateTime?

approver    User?      @relation("ApprovedAdjustments", fields: [approvedBy], references: [id])
```

**Existing enums (already in schema):**
```prisma
enum AdjustmentType {
  WASTAGE
  DAMAGE
  THEFT
  CORRECTION
}

enum AdjustmentStatus {
  PENDING
  APPROVED
  REJECTED
}
```

### Adjustment Creation Service (Corrected)

```typescript
async function createStockAdjustment(
  data: CreateAdjustmentDto,
  userId: string
): Promise<StockAdjustment> {
  const product = await prisma.product.findUniqueOrThrow({
    where: { id: data.productId }
  });

  const value = data.quantity * parseFloat(product.costPrice.toString());

  // Get threshold from SystemSetting (NOT prisma.configuration)
  const setting = await prisma.systemSetting.findUnique({
    where: { key: 'ADJUSTMENT_APPROVAL_THRESHOLD' }
  });
  const threshold = setting ? parseFloat(setting.value) : 1000;

  const requiresApproval = value >= threshold;
  const status = requiresApproval ? 'PENDING' : 'APPROVED';

  const adjustment = await prisma.stockAdjustment.create({
    data: {
      productId: data.productId,
      warehouseId: data.warehouseId,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      value,
      status,
      requestedBy: userId,
      ...(status === 'APPROVED' && { approvedBy: userId, approvedAt: new Date() })
    }
  });

  // If auto-approved, apply immediately
  if (status === 'APPROVED') {
    await applyStockAdjustment(adjustment.id);
  }

  await AuditService.log({
    userId,
    action: 'CREATE',
    entityType: 'StockAdjustment',
    entityId: adjustment.id,
    notes: `Adjustment created: ${product.name}, ${data.type}, qty ${data.quantity}, value Rs.${value.toFixed(2)}, ${requiresApproval ? 'PENDING approval' : 'auto-approved'}`,
  });

  return adjustment;
}
```

### Approve / Reject

```typescript
async function approveAdjustment(
  adjustmentId: string,
  userId: string
): Promise<StockAdjustment> {
  const adjustment = await prisma.stockAdjustment.findUniqueOrThrow({
    where: { id: adjustmentId }
  });

  if (adjustment.status !== 'PENDING') {
    throw new BadRequestError('Adjustment must be pending to approve');
  }

  const updated = await prisma.stockAdjustment.update({
    where: { id: adjustmentId },
    data: {
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date()
    }
  });

  await applyStockAdjustment(adjustmentId);

  await AuditService.log({
    userId,
    action: 'UPDATE',
    entityType: 'StockAdjustment',
    entityId: adjustmentId,
    notes: `Adjustment approved`,
  });

  return updated;
}
```

### Apply Adjustment to Inventory

```typescript
async function applyStockAdjustment(adjustmentId: string): Promise<void> {
  const adjustment = await prisma.stockAdjustment.findUniqueOrThrow({
    where: { id: adjustmentId }
  });

  await prisma.$transaction(async (tx) => {
    const inventory = await tx.inventory.findFirst({
      where: {
        productId: adjustment.productId,
        warehouseId: adjustment.warehouseId
      }
    });

    const quantityChange = ['WASTAGE', 'DAMAGE', 'THEFT'].includes(adjustment.type)
      ? -adjustment.quantity
      : adjustment.quantity;

    if (inventory) {
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: { increment: quantityChange } }
      });
    }

    await tx.stockMovement.create({
      data: {
        productId: adjustment.productId,
        warehouseId: adjustment.warehouseId,
        movementType: 'ADJUSTMENT',
        quantity: quantityChange,
        referenceType: 'ADJUSTMENT',    // Use existing enum (not STOCK_ADJUSTMENT)
        referenceId: adjustmentId,
        movementDate: new Date(),
        userId: adjustment.approvedBy!,
        notes: `${adjustment.type}: ${adjustment.reason}`
      }
    });
  });
}
```

### Module Structure

```
apps/api/src/modules/inventory/
  stock-adjustment.service.ts    (EXPAND — add approval workflow)
  stock-adjustment.controller.ts (EXPAND — add approve/reject/pending endpoints)

apps/web/src/features/inventory/pages/
  PendingAdjustmentsPage.tsx      (NEW)
```

### POST-MVP DEFERRED

- **Alert model & push notifications**: No Alert model. Pending adjustments visible on dedicated page only.
- **Email notifications on pending approval**: Deferred.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), prisma.configuration→SystemSetting, removed prisma.alert (doesn't exist), auditLogger→AuditService with correct action values, referenceType STOCK_ADJUSTMENT→ADJUSTMENT, noted StockAdjustment model already exists in schema | Claude (AI Review) |
