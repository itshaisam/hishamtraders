# Story 10.9: Invoice Conditional Stock Deduction

**Epic:** Epic 10 - Standardized Sales, Purchasing & Inventory Flow
**Story ID:** STORY-10.9
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 10.5 (DN Backend), Story 10.2 (Settings)
**Status:** Not Started

---

## User Story

**As a** system,
**I want** the Invoice service to conditionally skip stock deduction when a Delivery Note has already handled it,
**So that** stock isn't double-deducted when operating in full mode (SO → DN → Invoice).

---

## Acceptance Criteria

### 1. Setting Check

- [ ] Before stock deduction in `createInvoice()`, check `sales.requireDeliveryNote` setting
- [ ] Use `getWorkflowSetting('sales.requireDeliveryNote')` helper from Story 10.2

### 2. When `sales.requireDeliveryNote` = TRUE (Full Mode)

- [ ] **Skip** FIFO stock deduction (DN already did it at dispatch)
- [ ] **Skip** StockMovement creation (DN already created DELIVERY movements)
- [ ] **Skip** COGS journal entry (DN already posted DR COGS / CR Inventory)
- [ ] **DO** create A/R journal entry: DR 1200 (A/R), CR 4100 (Sales Revenue) + CR 2200 (Tax Payable)
- [ ] **DO** store `deliveryNoteId` on Invoice record
- [ ] **DO** validate that referenced DN exists and is DISPATCHED or DELIVERED
- [ ] **DO** validate that DN items cover invoice items (quantities and products match)

### 3. When `sales.requireDeliveryNote` = FALSE (Simple Mode — Current Behavior)

- [ ] **DO** deduct stock via FIFO (existing logic)
- [ ] **DO** create StockMovement records (type: SALE, ref: INVOICE)
- [ ] **DO** create COGS journal entry: DR 5100 (COGS), CR 1300 (Inventory) — NEW from Story 10.1
- [ ] **DO** create A/R journal entry (existing)
- [ ] **DO** auto-create GatePass (existing)
- [ ] This is identical to current behavior + COGS fix from Story 10.1

### 4. Sales Order Tracking

- [ ] If Invoice has `salesOrderId`, update `SalesOrderItem.invoicedQuantity` for each item
- [ ] Update SO status via `updateOrderStatus()` helper
- [ ] Validate: invoice quantity per item ≤ remaining invoiceable qty from SO

### 5. Invoice from DN Flow

- [ ] When creating Invoice from DN: auto-populate `deliveryNoteId` and `salesOrderId`
- [ ] Items pre-filled from DN items (product, variant, quantity)
- [ ] Prices come from SO items (if SO exists) or require manual entry
- [ ] Discount preserved from SO items

### 6. Invoice from SO (Simple Mode — No DN)

- [ ] When `requireDeliveryNote` = FALSE and SO exists:
  - Create Invoice directly from SO items
  - Skip DN entirely
  - Stock deducts at Invoice time (current behavior)
  - Update `SalesOrderItem.invoicedQuantity`
  - Store `salesOrderId` on Invoice

### 7. Backward Compatibility

- [ ] Invoices created without SO or DN (existing flow) continue to work identically
- [ ] `salesOrderId = null` and `deliveryNoteId = null` for existing invoices
- [ ] No migration needed for existing data

---

## Dev Notes

### Key File

`apps/api/src/modules/invoices/invoices.service.ts` — Main modification target

### Conceptual Change

```typescript
// In createInvoice() method:

const requireDN = await getWorkflowSetting('sales.requireDeliveryNote');

if (requireDN && dto.deliveryNoteId) {
  // FULL MODE: DN already handled stock
  // 1. Validate DN exists and is dispatched/delivered
  const dn = await tx.deliveryNote.findFirst({
    where: { id: dto.deliveryNoteId, status: { in: ['DISPATCHED', 'DELIVERED'] } },
  });
  if (!dn) throw new BadRequestError('Delivery Note must be dispatched before invoicing');

  // 2. Skip stock deduction — DN already did it
  // 3. Skip COGS posting — DN already did it
  // 4. Only post A/R journal: DR A/R, CR Sales + Tax
  await AutoJournalService.onInvoiceCreated(tx, invoice, userId);
  // Note: onInvoiceCreated() should NOT include COGS when DN mode
  // → Either pass a flag or create a separate method

} else {
  // SIMPLE MODE: Current behavior
  // 1. Deduct stock via FIFO
  // 2. Create stock movements
  // 3. Post COGS: DR 5100, CR 1300 (from Story 10.1)
  // 4. Post A/R: DR 1200, CR 4100 + 2200
  // 5. Auto-create GatePass
}

// After invoice creation (both modes):
if (dto.salesOrderId) {
  // Update SO item invoiced quantities
  for (const item of dto.items) {
    if (item.salesOrderItemId) {
      await tx.salesOrderItem.update({
        where: { id: item.salesOrderItemId },
        data: { invoicedQuantity: { increment: item.quantity } },
      });
    }
  }
  await updateOrderStatus(tx, dto.salesOrderId);
}
```

### AutoJournalService Consideration

The `onInvoiceCreated()` method needs to handle two modes:
1. **Simple mode**: A/R + Sales + Tax + **COGS** (from Story 10.1)
2. **Full mode**: A/R + Sales + Tax only (COGS already posted by DN)

Options:
- Pass a `skipCogs: boolean` parameter
- Or split into `onInvoiceCreatedWithCogs()` and `onInvoiceCreatedNoCogs()`
- Recommended: Add optional `options: { skipCogs?: boolean }` parameter

### Invoice DTO Extension

```typescript
// Add optional fields to CreateInvoiceDto:
interface CreateInvoiceDto {
  // ... existing fields ...
  salesOrderId?: string;
  deliveryNoteId?: string;
  items: Array<{
    // ... existing fields ...
    salesOrderItemId?: string;  // Link back to SO item for quantity tracking
  }>;
}
```

### Frontend Integration

- Create Invoice page should detect source (SO or DN) from URL params
- When creating from DN: `/invoices/create?deliveryNoteId=xxx`
- When creating from SO (simple mode): `/invoices/create?salesOrderId=xxx`
- Pre-fill items, prices, discounts from source document

### Files to Modify

| File | Change |
|------|--------|
| `apps/api/src/modules/invoices/invoices.service.ts` | Conditional stock deduction, SO tracking |
| `apps/api/src/services/auto-journal.service.ts` | Add `skipCogs` option to `onInvoiceCreated()` |
| `apps/api/src/modules/invoices/invoices.routes.ts` | Add salesOrderId, deliveryNoteId to validation |
| `apps/web/src/features/invoices/pages/CreateInvoicePage.tsx` | Handle SO/DN pre-fill from URL params |

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 1.0 | Initial story creation | Claude (AI Planning) |
