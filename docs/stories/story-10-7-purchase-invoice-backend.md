# Story 10.7: Purchase Invoice — Backend

**Epic:** Epic 10 - Standardized Sales, Purchasing & Inventory Flow
**Story ID:** STORY-10.7
**Priority:** Medium
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 10.1 (Schema)
**Status:** Not Started

---

## User Story

**As an** accountant,
**I want** to record supplier invoices and match them against Purchase Orders and GRNs,
**So that** I can verify 3-way matching before authorizing payment and maintain accurate accounts payable records.

---

## Acceptance Criteria

### 1. API Endpoints

- [ ] `POST /api/v1/purchase-invoices` — Create purchase invoice
- [ ] `GET /api/v1/purchase-invoices` — List with filters (status, supplierId, poId, date range, search)
- [ ] `GET /api/v1/purchase-invoices/:id` — Get details with items, linked PO/GRN
- [ ] `GET /api/v1/purchase-invoices/:id/matching` — 3-way matching data
- [ ] `PATCH /api/v1/purchase-invoices/:id/cancel` — Cancel PI

### 2. Purchase Invoice Creation

- [ ] Auto-generate internal number: `PI-YYYYMMDD-NNN`
- [ ] Required: supplierId, invoiceNumber (supplier's own number), invoiceDate, items
- [ ] Optional: poId, grnId, dueDate, notes
- [ ] If created from GRN: pre-fill items from GRN items with costs from PO/landed cost
- [ ] If created from PO: pre-fill items from PO items
- [ ] Can create standalone PI (without PO/GRN) — for services, ad-hoc purchases
- [ ] Calculate subtotal, taxRate, taxAmount, total
- [ ] Status defaults to PENDING
- [ ] paidAmount defaults to 0

### 3. No Journal Entries

- [ ] Purchase Invoice creation does NOT create journal entries
- [ ] GRN already posted DR Inventory / CR A/P — PI is reconciliation only
- [ ] Decision: GRNI clearing account pattern deferred to future enhancement

### 4. 3-Way Matching

- [ ] `GET /api/v1/purchase-invoices/:id/matching` returns:
  ```json
  {
    "poItems": [{ "productId", "quantity", "unitCost" }],
    "grnItems": [{ "productId", "quantity" }],
    "piItems": [{ "productId", "quantity", "unitCost" }],
    "variances": [{ "productId", "poQty", "grnQty", "piQty", "qtyMatch", "costMatch" }]
  }
  ```
- [ ] Highlight mismatches: quantity variance and cost variance
- [ ] Matching is informational — does not block PI creation

### 5. Payment Linking

- [ ] Supplier payments can reference Purchase Invoice via `paymentReferenceType: 'PURCHASE_INVOICE'`
- [ ] When payment recorded against PI: update `paidAmount`
- [ ] Status auto-updates: PENDING → PARTIAL → PAID based on paidAmount vs total

### 6. Cancel

- [ ] Only PENDING/PARTIAL status can be cancelled
- [ ] Does not affect inventory or journal entries (PI has no stock/accounting impact)
- [ ] Sets status to CANCELLED

### 7. Authorization

- [ ] ADMIN, ACCOUNTANT can create and cancel
- [ ] ADMIN, WAREHOUSE_MANAGER can view
- [ ] All authenticated users can view

---

## Dev Notes

### Module Structure

```
apps/api/src/modules/purchase-invoices/
  purchase-invoices.service.ts      (NEW)
  purchase-invoices.routes.ts       (NEW)
  purchase-invoices.validator.ts    (NEW)
```

### 3-Way Matching Logic

```typescript
async getMatching(purchaseInvoiceId: string) {
  const pi = await this.prisma.purchaseInvoice.findFirst({
    where: { id: purchaseInvoiceId },
    include: {
      items: { include: { product: true, productVariant: true } },
      purchaseOrder: { include: { items: { include: { product: true, productVariant: true } } } },
      goodsReceiveNote: { include: { items: { include: { product: true, productVariant: true } } } },
    },
  });

  if (!pi) throw new NotFoundError('Purchase Invoice not found');

  // Build product-level comparison
  const variances = pi.items.map(piItem => {
    const poItem = pi.purchaseOrder?.items.find(
      i => i.productId === piItem.productId && i.productVariantId === piItem.productVariantId
    );
    const grnItem = pi.goodsReceiveNote?.items.find(
      i => i.productId === piItem.productId && i.productVariantId === piItem.productVariantId
    );

    return {
      productId: piItem.productId,
      productName: piItem.product.name,
      poQty: poItem?.quantity || 0,
      poUnitCost: poItem?.unitCost || 0,
      grnQty: grnItem?.quantity || 0,
      piQty: piItem.quantity,
      piUnitCost: piItem.unitCost,
      qtyMatch: (poItem?.quantity || 0) === (grnItem?.quantity || 0) && (grnItem?.quantity || 0) === piItem.quantity,
      costMatch: poItem ? Number(poItem.unitCost) === Number(piItem.unitCost) : true,
    };
  });

  return { poItems: pi.purchaseOrder?.items, grnItems: pi.goodsReceiveNote?.items, piItems: pi.items, variances };
}
```

### Supplier Payment Integration

Modify `payments.service.ts` to support PI reference:
- When `paymentReferenceType === 'PURCHASE_INVOICE'`:
  - Find PI by `referenceId`
  - Increment `paidAmount` by payment amount
  - Update PI status (PARTIAL or PAID)

### Number Generation

Follow existing GRN pattern:
```typescript
async function generateInternalNumber(tx: any, date: Date): Promise<string> {
  const dateStr = format(date, 'yyyyMMdd');
  const prefix = `PI-${dateStr}-`;
  const latest = await tx.purchaseInvoice.findFirst({
    where: { internalNumber: { startsWith: prefix } },
    orderBy: { internalNumber: 'desc' },
  });
  const nextSeq = latest ? parseInt(latest.internalNumber.split('-').pop()!) + 1 : 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}
```

### Key Patterns

- No stock impact — PI is purely financial reconciliation
- No journal entries — GRN already handled A/P
- Constructor DI: `private prisma: any`
- Error classes from `utils/errors.js`
- Follow `goods-receipts.service.ts` patterns

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 1.0 | Initial story creation | Claude (AI Planning) |
