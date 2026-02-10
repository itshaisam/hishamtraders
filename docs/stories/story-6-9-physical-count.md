# Story 6.9: Physical Stock Count / Cycle Counting

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.9
**Priority:** Medium
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 2 (Inventory), Story 6.8 (Adjustment Approval)
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As a** warehouse manager,
**I want** to perform physical stock counts and reconcile with system records,
**So that** inventory accuracy is maintained.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] `StockCount` table: countNumber, warehouseId, countDate, countType (FULL/CYCLE), status, countedBy
   - [ ] `StockCountItem` table: stockCountId, productId, binLocation, batchNo, systemQty, countedQty, variance, notes

2. **Count Process:**
   - [ ] `POST /api/v1/stock-counts` — creates count session (populates items from current inventory)
   - [ ] `GET /api/v1/stock-counts/:id/items` — returns items to count
   - [ ] `PUT /api/v1/stock-counts/:id/items/:itemId` — updates counted quantity
   - [ ] Variance = countedQty - systemQty

3. **Count Completion:**
   - [ ] `PUT /api/v1/stock-counts/:id/complete`
   - [ ] For each variance: create StockAdjustment (type=CORRECTION for overage, WASTAGE for shortage)
   - [ ] Calculate adjustment value: `|variance| × product.costPrice`
   - [ ] Adjustment goes through approval workflow (Story 6.8 — may be auto-approved if below threshold)
   - [ ] Update inventory quantities when adjustment is approved

4. **Backend API:**
   - [ ] `GET /api/v1/stock-counts/:id/report` — variance report

5. **Frontend:**
   - [ ] Stock Count page
   - [ ] Create new count (full or cycle)
   - [ ] Display items with system qty
   - [ ] Input counted qty
   - [ ] Highlight variances
   - [ ] Complete count button
   - [ ] Variance report
   - [ ] Notes per item

6. **Authorization:**
   - [ ] Warehouse Manager and Admin
   - [ ] Stock count completion logged via `AuditService.log()`

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on Inventory model and Story 6.8 (Adjustment Approval).

### Key Corrections

1. **API paths**: All use `/api/v1/stock-counts` (not `/api/stock-counts`)
2. **`movementType: 'PHYSICAL_COUNT'`** — NOT in MovementType enum. Use existing `'ADJUSTMENT'` (physical count variance is an adjustment).
3. **`referenceType: 'STOCK_COUNT'`** — NOT in ReferenceType enum. Use existing `'ADJUSTMENT'` and include stock count ID in `notes`.
4. **`prisma.configuration`** — Does NOT exist. Use `prisma.systemSetting` (same as Story 6.8).
5. **`auditLogger.log()`** → `AuditService.log()` with correct action values.
6. **Adjustment creation in completion** — Reuse `createStockAdjustment()` from Story 6.8 which handles threshold checks and auto-approval logic.

### Schema (Proposed — NEW models)

```prisma
model StockCount {
  id          String         @id @default(cuid())
  countNumber String         @unique
  warehouseId String
  countDate   DateTime       @default(now())
  countType   CountType
  status      CountStatus    @default(IN_PROGRESS)
  countedBy   String
  createdAt   DateTime       @default(now())
  completedAt DateTime?

  warehouse   Warehouse      @relation(fields: [warehouseId], references: [id])
  counter     User           @relation(fields: [countedBy], references: [id])
  items       StockCountItem[]

  @@map("stock_counts")
}

model StockCountItem {
  id           String      @id @default(cuid())
  stockCountId String
  productId    String
  binLocation  String?
  batchNo      String?
  systemQty    Int
  countedQty   Int         @default(0)
  variance     Int         @default(0)
  notes        String?     @db.Text

  stockCount   StockCount  @relation(fields: [stockCountId], references: [id], onDelete: Cascade)
  product      Product     @relation(fields: [productId], references: [id])

  @@map("stock_count_items")
}

enum CountType {
  FULL
  CYCLE
}

enum CountStatus {
  IN_PROGRESS
  COMPLETED
}
```

**Warehouse model** needs new relation:
```prisma
// ADD to Warehouse model:
stockCounts StockCount[]
```

**User model** needs new relation:
```prisma
// ADD to User model:
stockCounts StockCount[]
```

**Product model** needs new relation:
```prisma
// ADD to Product model:
stockCountItems StockCountItem[]
```

### Create Stock Count

```typescript
async function createStockCount(
  data: CreateStockCountDto,
  userId: string
): Promise<StockCount> {
  const countNumber = await generateCountNumber();

  const inventoryItems = await prisma.inventory.findMany({
    where: {
      warehouseId: data.warehouseId,
      quantity: { gt: 0 },
      ...(data.countType === 'CYCLE' && data.productIds && {
        productId: { in: data.productIds }
      })
    },
    include: { product: true }
  });

  const stockCount = await prisma.stockCount.create({
    data: {
      countNumber,
      warehouseId: data.warehouseId,
      countType: data.countType,
      countedBy: userId,
      items: {
        create: inventoryItems.map(inv => ({
          productId: inv.productId,
          binLocation: inv.binLocation,
          batchNo: inv.batchNo,
          systemQty: inv.quantity,
          countedQty: 0,
          variance: 0
        }))
      }
    },
    include: { items: { include: { product: true } } }
  });

  await AuditService.log({
    userId,
    action: 'CREATE',
    entityType: 'StockCount',
    entityId: stockCount.id,
    notes: `Stock count ${countNumber} created (${data.countType})`,
  });

  return stockCount;
}
```

### Complete Stock Count (Corrected)

```typescript
async function completeStockCount(
  stockCountId: string,
  userId: string
): Promise<StockCount> {
  const stockCount = await prisma.stockCount.findUniqueOrThrow({
    where: { id: stockCountId },
    include: { items: true }
  });

  if (stockCount.status === 'COMPLETED') {
    throw new BadRequestError('Stock count already completed');
  }

  await prisma.$transaction(async (tx) => {
    for (const item of stockCount.items) {
      if (item.variance !== 0) {
        const product = await tx.product.findUniqueOrThrow({
          where: { id: item.productId }
        });

        // Value = |variance| × product.costPrice
        const adjustmentValue = Math.abs(item.variance) *
          parseFloat(product.costPrice.toString());

        // Determine adjustment type
        const adjustmentType = item.variance > 0 ? 'CORRECTION' : 'WASTAGE';

        // Get threshold from SystemSetting (NOT prisma.configuration)
        const setting = await tx.systemSetting.findUnique({
          where: { key: 'ADJUSTMENT_APPROVAL_THRESHOLD' }
        });
        const threshold = setting ? parseFloat(setting.value) : 1000;

        const requiresApproval = adjustmentValue >= threshold;
        const status = requiresApproval ? 'PENDING' : 'APPROVED';

        const adjustment = await tx.stockAdjustment.create({
          data: {
            productId: item.productId,
            warehouseId: stockCount.warehouseId,
            type: adjustmentType,
            quantity: Math.abs(item.variance),
            reason: `Physical count variance: ${item.notes || 'No notes'}`,
            value: adjustmentValue,
            status,
            requestedBy: userId,
            ...(status === 'APPROVED' && {
              approvedBy: userId,
              approvedAt: new Date()
            })
          }
        });

        // Only update inventory if auto-approved
        if (status === 'APPROVED') {
          const inventory = await tx.inventory.findFirst({
            where: {
              productId: item.productId,
              warehouseId: stockCount.warehouseId,
              ...(item.batchNo && { batchNo: item.batchNo })
            }
          });

          if (inventory) {
            await tx.inventory.update({
              where: { id: inventory.id },
              data: { quantity: item.countedQty }  // Set to actual counted qty
            });
          }

          // Use existing enum values (not PHYSICAL_COUNT/STOCK_COUNT)
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: stockCount.warehouseId,
              movementType: 'ADJUSTMENT',     // Use existing enum
              quantity: item.variance,
              referenceType: 'ADJUSTMENT',    // Use existing enum
              referenceId: adjustment.id,
              movementDate: new Date(),
              userId,
              notes: `Physical count adjustment: ${item.variance > 0 ? '+' : ''}${item.variance} (count: ${stockCount.countNumber})`
            }
          });
        }
      }
    }

    await tx.stockCount.update({
      where: { id: stockCountId },
      data: { status: 'COMPLETED', completedAt: new Date() }
    });
  });

  await AuditService.log({
    userId,
    action: 'UPDATE',
    entityType: 'StockCount',
    entityId: stockCountId,
    notes: `Stock count ${stockCount.countNumber} completed`,
  });

  return stockCount;
}
```

### Variance Report

```typescript
async function getVarianceReport(stockCountId: string) {
  const stockCount = await prisma.stockCount.findUniqueOrThrow({
    where: { id: stockCountId },
    include: {
      items: {
        where: { variance: { not: 0 } },
        include: { product: true }
      }
    }
  });

  const totalVarianceValue = stockCount.items.reduce((sum, item) => {
    const value = Math.abs(item.variance) * parseFloat(item.product.costPrice.toString());
    return sum + value;
  }, 0);

  return {
    countNumber: stockCount.countNumber,
    countDate: stockCount.countDate,
    itemsWithVariance: stockCount.items.length,
    totalVarianceValue,
    items: stockCount.items.map(item => ({
      productName: item.product.name,
      systemQty: item.systemQty,
      countedQty: item.countedQty,
      variance: item.variance,
      varianceType: item.variance > 0 ? 'OVERAGE' : 'SHORTAGE',
      notes: item.notes
    }))
  };
}
```

### Module Structure

```
apps/api/src/modules/stock-counts/
  stock-count.controller.ts   (NEW)
  stock-count.service.ts      (NEW)
  stock-count.routes.ts       (NEW)

apps/web/src/features/inventory/pages/
  StockCountPage.tsx           (NEW)
  StockCountDetailPage.tsx     (NEW)
  VarianceReportPage.tsx       (NEW)
```

### POST-MVP DEFERRED

- **Barcode scanning integration**: Manual entry for MVP.
- **Scheduled cycle count reminders**: Deferred.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), use existing enum values ADJUSTMENT (not PHYSICAL_COUNT/STOCK_COUNT), prisma.configuration→SystemSetting, auditLogger→AuditService with correct action values, documented all required model relations | Claude (AI Review) |
