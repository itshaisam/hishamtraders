# Story 10.5: Delivery Note — Backend

**Epic:** Epic 10 - Standardized Sales, Purchasing & Inventory Flow
**Story ID:** STORY-10.5
**Priority:** High
**Estimated Effort:** 12-14 hours
**Dependencies:** Story 10.1 (Schema), Story 10.3 (SO Backend)
**Status:** Completed

---

## User Story

**As a** warehouse manager,
**I want** to create delivery notes to formally dispatch goods to customers,
**So that** stock is deducted only when goods physically leave the warehouse with full traceability.

---

## Acceptance Criteria

### 1. API Endpoints

- [ ] `POST /api/v1/delivery-notes` — Create delivery note
- [ ] `GET /api/v1/delivery-notes` — List with filters (status, clientId, salesOrderId, date range, search)
- [ ] `GET /api/v1/delivery-notes/:id` — Get details with items, linked SO, linked Invoices
- [ ] `PATCH /api/v1/delivery-notes/:id/dispatch` — PENDING → DISPATCHED (**stock deduction trigger**)
- [ ] `PATCH /api/v1/delivery-notes/:id/deliver` — DISPATCHED → DELIVERED
- [ ] `PATCH /api/v1/delivery-notes/:id/cancel` — PENDING → CANCELLED (with reason)

### 2. Delivery Note Creation

- [ ] Auto-generate number: `DN-YYYYMMDD-NNN`
- [ ] Required: clientId, warehouseId, items
- [ ] Optional: salesOrderId, deliveryAddress, driverName, vehicleNo, notes
- [ ] If created from SO: pre-fill items from SO deliverable items
- [ ] Can create standalone DN (without SO) — for walk-in or ad-hoc deliveries
- [ ] Validate: quantity per item ≤ remaining deliverable qty from SO (if SO-linked)
- [ ] Validate: stock availability for all items
- [ ] Status defaults to PENDING

### 3. Dispatch (PENDING → DISPATCHED) — Critical Stock Impact

- [ ] **Stock deduction via FifoDeductionService** (reuse existing FIFO logic)
- [ ] For each item:
  - Call `FifoDeductionService.deductStockFifo()` with product/variant/warehouse/quantity
  - Apply deductions to Inventory records
  - Create `StockMovement` records:
    - `movementType: DELIVERY`
    - `referenceType: DELIVERY_NOTE`
    - `referenceId: deliveryNoteId`
  - Store batchNo on DeliveryNoteItem (first batch used)
- [ ] **COGS journal entry**: DR 5100 (COGS), CR 1300 (Inventory)
  - Amount = sum of (product.costPrice × quantity) for each item
  - Created via `AutoJournalService.onDeliveryDispatched()`
- [ ] Update `SalesOrderItem.deliveredQuantity` for each item (if SO-linked)
- [ ] Update SO status via `updateOrderStatus()` helper
- [ ] Set `dispatchedBy` to current user ID
- [ ] Fail if insufficient stock for any item

### 4. Deliver (DISPATCHED → DELIVERED)

- [ ] Set `completedBy` to current user ID
- [ ] No stock impact (already deducted at dispatch)
- [ ] Confirmation of physical delivery to customer

### 5. Cancel (PENDING → CANCELLED)

- [ ] Only allowed in PENDING status (no stock has been deducted)
- [ ] Requires cancel reason
- [ ] No stock impact

### 6. Authorization

- [ ] ADMIN, WAREHOUSE_MANAGER, SALES_OFFICER can create
- [ ] ADMIN, WAREHOUSE_MANAGER can dispatch
- [ ] ADMIN, WAREHOUSE_MANAGER, SALES_OFFICER can mark as delivered
- [ ] ADMIN, WAREHOUSE_MANAGER can cancel
- [ ] All authenticated users can view

### 7. AutoJournalService Extension

- [ ] New method: `onDeliveryDispatched(tx, deliveryNote, cogsData, userId)`
  - DR 5100 (COGS) — cost of goods delivered
  - CR 1300 (Inventory) — reduce inventory asset value
  - referenceType: 'DELIVERY_NOTE'
  - referenceId: deliveryNote.id

---

## Dev Notes

### Module Structure

```
apps/api/src/modules/delivery-notes/
  delivery-notes.service.ts      (NEW)
  delivery-notes.routes.ts       (NEW)
  delivery-notes.validator.ts    (NEW)
```

### Dispatch Logic (Core)

```typescript
async dispatch(id: string, userId: string): Promise<DeliveryNote> {
  return this.prisma.$transaction(async (tx: any) => {
    const dn = await tx.deliveryNote.findFirst({
      where: { id },
      include: { items: { include: { product: true, productVariant: true } } },
    });

    if (!dn) throw new NotFoundError('Delivery Note not found');
    if (dn.status !== 'PENDING') throw new BadRequestError('Only PENDING delivery notes can be dispatched');

    // 1. Deduct stock via FIFO for each item
    const fifoService = new FifoDeductionService(tx);
    let totalCogs = 0;

    for (const item of dn.items) {
      // Check availability
      const available = await fifoService.getAvailableQuantity(
        item.productId, item.productVariantId, dn.warehouseId
      );
      if (available < item.quantity) {
        throw new BadRequestError(`Insufficient stock for ${item.product.name}`);
      }

      // Deduct FIFO
      const deductions = await fifoService.deductStockFifo(
        item.productId, item.productVariantId, dn.warehouseId, item.quantity
      );
      await fifoService.applyDeductions(deductions);

      // Create stock movements
      for (const d of deductions) {
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            productVariantId: item.productVariantId,
            warehouseId: dn.warehouseId,
            movementType: 'DELIVERY',
            quantity: -d.quantity,
            referenceType: 'DELIVERY_NOTE',
            referenceId: dn.id,
            movementDate: new Date(),
            userId,
            notes: `Delivery Note ${dn.deliveryNoteNumber}`,
            tenantId: getTenantId(),
          },
        });
      }

      // Store batch on DN item
      if (deductions.length > 0) {
        await tx.deliveryNoteItem.update({
          where: { id: item.id },
          data: { batchNo: deductions[0].batchNo },
        });
      }

      // Accumulate COGS
      const costPrice = item.productVariant?.costPrice || item.product.costPrice || 0;
      totalCogs += Number(costPrice) * item.quantity;
    }

    // 2. Post COGS journal entry
    if (totalCogs > 0) {
      await AutoJournalService.onDeliveryDispatched(
        tx,
        { id: dn.id, deliveryNoteNumber: dn.deliveryNoteNumber, totalCogs, date: new Date() },
        userId
      );
    }

    // 3. Update SO item delivered quantities (if SO-linked)
    if (dn.salesOrderId) {
      for (const item of dn.items) {
        if (item.salesOrderItemId) {
          await tx.salesOrderItem.update({
            where: { id: item.salesOrderItemId },
            data: { deliveredQuantity: { increment: item.quantity } },
          });
        }
      }
      // Update SO status
      await updateOrderStatus(tx, dn.salesOrderId);
    }

    // 4. Update DN status
    return tx.deliveryNote.update({
      where: { id },
      data: { status: 'DISPATCHED', dispatchedBy: userId },
    });
  });
}
```

### AutoJournalService Addition

```typescript
// Add to apps/api/src/services/auto-journal.service.ts
async onDeliveryDispatched(
  tx: PrismaLike,
  data: { id: string; deliveryNoteNumber: string; totalCogs: number; date: Date },
  userId: string
): Promise<string | null> {
  return createAutoJournalEntry(tx, {
    date: data.date,
    description: `COGS for Delivery Note ${data.deliveryNoteNumber}`,
    referenceType: 'DELIVERY_NOTE',
    referenceId: data.id,
    userId,
    lines: [
      { accountCode: '5100', debit: data.totalCogs, credit: 0, description: 'Cost of Goods Sold' },
      { accountCode: '1300', debit: 0, credit: data.totalCogs, description: 'Inventory reduction' },
    ],
  });
}
```

### Reusable Services

- **FifoDeductionService** (`apps/api/src/modules/inventory/fifo-deduction.service.ts`) — stock deduction
- **AutoJournalService** (`apps/api/src/services/auto-journal.service.ts`) — COGS journal entry
- **StockMovement creation** — follow pattern from `invoices.service.ts`
- **Order status update** — from Story 10.3 helper

### Key Patterns

- Constructor DI: `private prisma: any`
- Imports use `.js` extension
- Use `getTenantId()` for creates
- Use `BadRequestError`, `NotFoundError` from `utils/errors.js`
- Number generation follows GRN pattern (`findFirst` + increment)
- All stock operations happen within a `$transaction`

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 1.0 | Initial story creation | Claude (AI Planning) |
