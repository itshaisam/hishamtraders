# Story 6.3: Gate Pass Approval and Status Tracking

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.3
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 6.2
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As a** warehouse manager,
**I want** to approve pending gate passes and track their status through completion,
**So that** only authorized shipments leave the warehouse.

---

## Acceptance Criteria

1. **Status Workflow:**
   - [ ] PENDING → APPROVED → IN_TRANSIT → COMPLETED
   - [ ] Cannot skip statuses

2. **Status Transitions:**
   - [ ] `PUT /api/v1/gate-passes/:id/approve` (PENDING → APPROVED, no inventory change)
   - [ ] `PUT /api/v1/gate-passes/:id/dispatch` (APPROVED → IN_TRANSIT, **inventory deducted only in MANUAL mode**)
   - [ ] `PUT /api/v1/gate-passes/:id/complete` (IN_TRANSIT → COMPLETED)
   - [ ] `PUT /api/v1/gate-passes/:id/cancel` (cancels if PENDING/APPROVED/IN_TRANSIT, restores inventory if deducted)

3. **Inventory Deduction:**
   - [ ] In MANUAL mode: Deducted when status → IN_TRANSIT
   - [ ] In AUTO mode: Already deducted when created (Story 6.2)
   - [ ] StockMovement records created (use existing `movementType: 'SALE'` or `'TRANSFER'`)

4. **Frontend:**
   - [ ] Status workflow indicator (use step indicators with `div` + Tailwind CSS — no Stepper component exists)
   - [ ] Action buttons conditional on status
   - [ ] Display timestamps and users for each status
   - [x] Print Gate Pass button (`window.print()` with `@media print` CSS)

5. **Print Layout:**
   - [x] Professional print layout with company header/logo, GP number, status
   - [x] Details section: warehouse, date, purpose, reference (invoice number if linked)
   - [x] Items table with #, Product, SKU, Batch No, Bin Location, Quantity + total
   - [x] Timeline section: Issued By, Approved By, Dispatched By, Completed By
   - [x] Footer: company name + generation timestamp
   - [x] Screen UI wrapped in `no-print`, print layout in `print-only`

6. **Reference Number Resolution:**
   - [x] `getGatePassById` resolves `referenceNumber` (invoice number) when `referenceType=INVOICE`
   - [x] Detail page shows human-readable "Invoice INV-XXXX" instead of raw CUID
   - [x] Linked invoice banner with "View Invoice" navigation link

7. **Alerts:**
   - [ ] Alert for Warehouse Manager when passes await approval (defer alert system, use dashboard indicator for MVP)

8. **Authorization:**
   - [ ] Only Warehouse Manager and Admin
   - [ ] All status changes logged via `AuditService.log()`

---

## Dev Notes

### Implementation Status

**Backend:** Implemented. Status transitions, print layout, and reference number resolution all working.

### Key Corrections

1. **API paths**: All use `/api/v1/gate-passes/:id/...` (not `/api/gate-passes/...`)
2. **`auditLogger.log()`** → Use `AuditService.log()`:
   ```typescript
   await AuditService.log({
     userId,
     action: 'UPDATE',            // All status transitions are updates
     entityType: 'GatePass',
     entityId: gatePassId,
     notes: `Gate pass ${gatePassNumber} status: ${oldStatus} → ${newStatus}`,
   });
   ```
3. **AuditService `action`** must be `'UPDATE'` for all status transitions (not custom strings like `GATE_PASS_APPROVED`)
4. **Stepper/Step/StepLabel** components do NOT exist in the UI library. Use plain divs with Tailwind CSS for the status workflow indicator.
5. **`gatePass.dispatcher`** and **`gatePass.completer`** — GatePass model has `dispatchedBy` and `completedBy` FK fields but no named User relations for them. Either add relations or query User separately.
6. **Cancel inventory restore** — when restoring inventory on cancel, use `movementType: 'ADJUSTMENT'` (exists in enum) and `referenceType: 'ADJUSTMENT'` (exists in enum).

### Status Transition Service

```typescript
async function approveGatePass(
  gatePassId: string,
  userId: string
): Promise<GatePass> {
  const gatePass = await prisma.gatePass.findUniqueOrThrow({
    where: { id: gatePassId }
  });

  if (gatePass.status !== 'PENDING') {
    throw new BadRequestError('Gate pass is not pending approval');
  }

  const updated = await prisma.gatePass.update({
    where: { id: gatePassId },
    data: { status: 'APPROVED', approvedBy: userId },
    include: { items: { include: { product: true } } }
  });

  await AuditService.log({
    userId,
    action: 'UPDATE',
    entityType: 'GatePass',
    entityId: gatePassId,
    notes: `Gate pass ${updated.gatePassNumber} approved`,
  });

  return updated;
}

async function dispatchGatePass(
  gatePassId: string,
  userId: string
): Promise<GatePass> {
  const gatePass = await prisma.gatePass.findUniqueOrThrow({
    where: { id: gatePassId },
    include: { warehouse: true }
  });

  if (gatePass.status !== 'APPROVED') {
    throw new BadRequestError('Gate pass must be approved before dispatch');
  }

  // Deduct inventory if MANUAL mode (AUTO already deducted on creation)
  if (gatePass.warehouse.gatePassMode === 'MANUAL') {
    await deductInventoryForGatePass(gatePassId, userId);
  }

  const updated = await prisma.gatePass.update({
    where: { id: gatePassId },
    data: { status: 'IN_TRANSIT', dispatchedBy: userId }
  });

  await AuditService.log({
    userId,
    action: 'UPDATE',
    entityType: 'GatePass',
    entityId: gatePassId,
    notes: `Gate pass ${gatePass.gatePassNumber} dispatched`,
  });

  return updated;
}

async function completeGatePass(
  gatePassId: string,
  userId: string
): Promise<GatePass> {
  const gatePass = await prisma.gatePass.findUniqueOrThrow({
    where: { id: gatePassId }
  });

  if (gatePass.status !== 'IN_TRANSIT') {
    throw new BadRequestError('Gate pass must be in transit to complete');
  }

  const updated = await prisma.gatePass.update({
    where: { id: gatePassId },
    data: { status: 'COMPLETED', completedBy: userId }
  });

  await AuditService.log({
    userId,
    action: 'UPDATE',
    entityType: 'GatePass',
    entityId: gatePassId,
    notes: `Gate pass ${gatePass.gatePassNumber} completed`,
  });

  return updated;
}
```

### Cancel with Inventory Restore

```typescript
async function cancelGatePass(
  gatePassId: string,
  reason: string,
  userId: string
): Promise<GatePass> {
  const gatePass = await prisma.gatePass.findUniqueOrThrow({
    where: { id: gatePassId },
    include: { items: true, warehouse: true }
  });

  const cancellableStatuses = ['PENDING', 'APPROVED', 'IN_TRANSIT'];
  if (!cancellableStatuses.includes(gatePass.status)) {
    throw new BadRequestError(
      `Cannot cancel gate pass in ${gatePass.status} status`
    );
  }

  // Determine if inventory was already deducted
  const inventoryDeducted =
    (gatePass.warehouse.gatePassMode === 'AUTO' && gatePass.status !== 'PENDING') ||
    (gatePass.warehouse.gatePassMode === 'MANUAL' && gatePass.status === 'IN_TRANSIT');

  if (inventoryDeducted) {
    await restoreInventoryForGatePass(gatePassId, userId);
  }

  const updated = await prisma.gatePass.update({
    where: { id: gatePassId },
    data: {
      status: 'CANCELLED',
      notes: `${gatePass.notes || ''}\n[CANCELLED] ${reason}`
    }
  });

  await AuditService.log({
    userId,
    action: 'UPDATE',
    entityType: 'GatePass',
    entityId: gatePassId,
    notes: `Gate pass ${gatePass.gatePassNumber} cancelled (was ${gatePass.status}). Reason: ${reason}`,
  });

  return updated;
}

async function restoreInventoryForGatePass(
  gatePassId: string,
  userId: string
): Promise<void> {
  const gatePass = await prisma.gatePass.findUniqueOrThrow({
    where: { id: gatePassId },
    include: { items: true }
  });

  await prisma.$transaction(async (tx) => {
    for (const item of gatePass.items) {
      const inventory = await tx.inventory.findFirst({
        where: {
          productId: item.productId,
          warehouseId: gatePass.warehouseId,
          ...(item.batchNo && { batchNo: item.batchNo })
        }
      });

      if (inventory) {
        await tx.inventory.update({
          where: { id: inventory.id },
          data: { quantity: { increment: item.quantity } }
        });
      }

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: gatePass.warehouseId,
          movementType: 'ADJUSTMENT',     // Use existing enum value
          quantity: item.quantity,
          referenceType: 'ADJUSTMENT',    // Use existing enum value
          referenceId: gatePassId,
          movementDate: new Date(),
          userId,
          notes: `Gate Pass ${gatePass.gatePassNumber} cancelled — inventory restored`
        }
      });
    }
  });
}
```

### Frontend Status Indicator

```tsx
// Use plain divs with Tailwind — NO Stepper/Step/StepLabel components
const statusSteps = ['PENDING', 'APPROVED', 'IN_TRANSIT', 'COMPLETED'];

<div className="flex items-center gap-2">
  {statusSteps.map((step, index) => {
    const isCurrent = step === gatePass.status;
    const isCompleted = statusSteps.indexOf(gatePass.status) > index;
    return (
      <div key={step} className="flex items-center gap-2">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm
          ${isCompleted ? 'bg-green-500 text-white' :
            isCurrent ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-600'}`}>
          {index + 1}
        </div>
        <span className="text-sm">{step.replace('_', ' ')}</span>
        {index < statusSteps.length - 1 && <div className="w-8 h-px bg-gray-300" />}
      </div>
    );
  })}
</div>
```

### Schema Note: Missing User Relations

GatePass has `dispatchedBy` and `completedBy` fields but the original schema only defines relations for `issuer` and `approver`. To query dispatcher/completer names, either:
- **Option A**: Add named relations (requires `User` model changes)
- **Option B**: Query User separately by ID when displaying

For MVP, use Option B to avoid excessive User model relation bloat.

### Module Structure

```
apps/api/src/modules/gate-passes/
  gate-pass.service.ts        (EXPAND — add approve, dispatch, complete, cancel)

apps/web/src/features/gate-passes/pages/
  GatePassDetailPage.tsx       (NEW)
```

### POST-MVP DEFERRED

- **Alert model**: No `Alert` model exists in schema. For MVP, use dashboard indicators (count of pending gate passes) instead of a formal alert system.
- ~~**PDF/Print**: Defer to browser print (`window.print()`).~~ **DONE** — Print layout implemented with `@media print` CSS, `window.print()`, company header/logo, items table, timeline, and footer.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), auditLogger→AuditService with action:'UPDATE', use existing enum values for cancel restore (ADJUSTMENT), replaced Stepper/Step/StepLabel with plain Tailwind divs, noted missing dispatcher/completer relations, deferred alert system | Claude (AI Review) |
| 2026-02-12 | 2.1     | Added AC 5-6: Print layout implemented (company header, items table, timeline, footer), reference number resolution for invoice-linked gate passes, "View Invoice" link | Claude (Implementation) |
