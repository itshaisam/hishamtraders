# Story 6.7: Batch/Lot Tracking with Expiry Alerts

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.7
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 2 (Inventory)
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As a** warehouse manager,
**I want** to track batch numbers and expiry dates for products,
**So that** we can use FIFO and avoid selling expired goods.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Inventory table expanded: `expiryDate` (DateTime, nullable) — NEW field
   - [ ] Product table expanded: `hasExpiry` (Boolean, default false), `shelfLifeDays` (Int, nullable) — NEW fields

2. **Stock Receiving:**
   - [ ] When receiving stock, if `product.hasExpiry = true`:
   - [ ] Prompt for expiry date or auto-calculate: `receivedDate + shelfLifeDays`

3. **Expiry Monitoring:**
   - [ ] `GET /api/v1/inventory/expiring` — products expiring within X days (default 60)
   - [ ] Response includes priority classification:
     - 60 days: LOW
     - 30 days: MEDIUM
     - 7 days: HIGH
     - Expired: CRITICAL

4. **FIFO with Expiry (FEFO):**
   - [ ] When creating invoice, FIFO considers expiry (earliest expiry first)
   - [ ] Warn if batch expiring within 30 days
   - [ ] Block sale of expired batches

5. **Frontend:**
   - [ ] Inventory view displays expiry date
   - [ ] Color-coded expiry status (green/yellow/orange/red)
   - [ ] Expiring Stock page
   - [ ] Dashboard "Near Expiry" widget

6. **Authorization:**
   - [ ] Warehouse Manager configures expiry settings
   - [ ] Expiry date changes logged via `AuditService.log()`

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on Inventory + Product models (Epic 2).

### Key Corrections

1. **API path**: Use `/api/v1/inventory/expiring` (not `/api/inventory/expiring`)
2. **`prisma.alert.create()`** — There is NO `Alert` model in the schema. Alerts/notifications are deferred to post-MVP. For MVP, the expiry endpoint returns data and the frontend displays it — no persisted alert records.
3. **MySQL NULLS LAST** — Prisma's `orderBy: { expiryDate: { sort: 'asc', nulls: 'last' } }` with `nulls` option does NOT work on MySQL. MySQL has no native NULLS FIRST/LAST support. Use `orderBy: [{ expiryDate: 'asc' }]` and handle nulls in application code, OR use `prisma.$queryRaw` with `ORDER BY ISNULL(expiryDate), expiryDate ASC`.
4. **`differenceInDays`** — Import from `date-fns` (already used elsewhere in the project).

### Schema Changes Required

**Add to existing Product model:**
```prisma
// ADD to Product model:
hasExpiry      Boolean  @default(false)
shelfLifeDays  Int?
```

**Add to existing Inventory model:**
```prisma
// ADD to Inventory model:
expiryDate     DateTime?
```

### FIFO with Expiry (FEFO — Corrected for MySQL)

```typescript
async function deductStockFIFO(
  productId: string,
  warehouseId: string,
  quantityNeeded: number
): Promise<BatchDeduction[]> {
  // MySQL doesn't support NULLS LAST — use raw query or two-step approach
  // Approach: query expiring inventory first, then non-expiring
  const expiringInventory = await prisma.inventory.findMany({
    where: {
      productId,
      warehouseId,
      quantity: { gt: 0 },
      expiryDate: { not: null, gt: new Date() }  // Non-expired, has expiry
    },
    orderBy: [
      { expiryDate: 'asc' },   // Earliest expiry first
      { createdAt: 'asc' }     // FIFO within same expiry
    ]
  });

  const nonExpiringInventory = await prisma.inventory.findMany({
    where: {
      productId,
      warehouseId,
      quantity: { gt: 0 },
      expiryDate: null  // No expiry date
    },
    orderBy: { createdAt: 'asc' }  // FIFO
  });

  // Combine: expiring first, then non-expiring
  const inventoryRecords = [...expiringInventory, ...nonExpiringInventory];

  let remainingQty = quantityNeeded;
  const deductions: BatchDeduction[] = [];

  for (const record of inventoryRecords) {
    if (remainingQty === 0) break;

    // Warn if expiring soon (within 30 days)
    if (record.expiryDate) {
      const daysToExpiry = differenceInDays(record.expiryDate, new Date());
      if (daysToExpiry <= 30) {
        // Return warning to caller (don't console.warn in production)
      }
    }

    const qtyToDeduct = Math.min(remainingQty, record.quantity);
    deductions.push({
      batchNo: record.batchNo!,
      quantityDeducted: qtyToDeduct,
      inventoryId: record.id,
      expiryDate: record.expiryDate
    });
    remainingQty -= qtyToDeduct;
  }

  if (remainingQty > 0) {
    throw new BadRequestError('Insufficient non-expired stock');
  }

  return deductions;
}
```

### Get Expiring Products

```typescript
async function getExpiringProducts(
  daysAhead: number = 60
): Promise<ExpiringProductItem[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const inventory = await prisma.inventory.findMany({
    where: {
      expiryDate: {
        lte: futureDate,
        gt: new Date()      // Not already expired
      },
      quantity: { gt: 0 }
    },
    include: {
      product: true,
      warehouse: true
    },
    orderBy: { expiryDate: 'asc' }
  });

  return inventory.map(inv => {
    const daysToExpiry = differenceInDays(inv.expiryDate!, new Date());
    let priority: 'HIGH' | 'MEDIUM' | 'LOW';

    if (daysToExpiry <= 7) priority = 'HIGH';
    else if (daysToExpiry <= 30) priority = 'MEDIUM';
    else priority = 'LOW';

    return {
      productName: inv.product.name,
      batchNo: inv.batchNo,
      warehouse: inv.warehouse.name,
      quantity: inv.quantity,
      expiryDate: inv.expiryDate!,
      daysToExpiry,
      priority
    };
  });
}
```

### Module Structure

```
apps/api/src/modules/inventory/
  inventory.service.ts      (EXPAND — add getExpiringProducts, deductStockFIFO with expiry)
  inventory.controller.ts   (EXPAND — add GET /expiring endpoint)
  inventory.routes.ts       (EXPAND)

apps/web/src/features/inventory/pages/
  ExpiringStockPage.tsx      (NEW)
```

### POST-MVP DEFERRED

- **Alert model & daily cron job**: No Alert model exists. For MVP, expiry data is fetched on-demand via API. Automated daily alerts deferred.
- **Dashboard "Near Expiry" widget**: Can be added to dashboard using the same API endpoint.
- **CRITICAL expired stock**: For MVP, return expired items in a separate query. Formal blocking enforcement can be added later.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), removed prisma.alert (model doesn't exist), fixed MySQL NULLS LAST incompatibility (split into two queries), removed console.warn, deferred daily cron job and Alert model | Claude (AI Review) |
