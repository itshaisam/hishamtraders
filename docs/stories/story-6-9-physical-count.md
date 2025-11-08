# Story 6.9: Physical Stock Count / Cycle Counting

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.9
**Priority:** Medium
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 2 (Inventory)
**Status:** Draft - Phase 2

---

## User Story

**As a** warehouse manager,
**I want** to perform physical stock counts and reconcile with system records,
**So that** inventory accuracy is maintained.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] StockCount table: countNumber, warehouseId, countDate, countType (FULL/CYCLE), status, countedBy
   - [ ] StockCountItem table: stockCountId, productId, binLocation, batchNo, systemQty, countedQty, variance, notes

2. **Count Process:**
   - [ ] POST /api/stock-counts creates count session
   - [ ] GET /api/stock-counts/:id/items returns items to count
   - [ ] PUT /api/stock-counts/:id/items/:itemId updates counted quantity
   - [ ] Variance = countedQty - systemQty

3. **Count Completion:**
   - [ ] When COMPLETED:
   - [ ] For each variance, create StockAdjustment (type=PHYSICAL_COUNT or CORRECTION)
   - [ ] **Calculate adjustment value:** |variance| × product cost price
   - [ ] Adjustment goes through approval workflow (may be auto-approved if below threshold)
   - [ ] Update inventory quantities when adjustment is approved
   - [ ] Generate variance report

4. **Backend API:**
   - [ ] GET /api/stock-counts/:id/report - variance report

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
   - [ ] Stock count completion logged

---

## Dev Notes

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

```typescript
async function createStockCount(
  data: CreateStockCountDto,
  userId: string
): Promise<StockCount> {
  // Generate count number
  const countNumber = await generateCountNumber();

  // Get inventory items to count
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

  // Create stock count with items
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

  return stockCount;
}

async function updateCountedQty(
  stockCountId: string,
  itemId: string,
  countedQty: number
): Promise<StockCountItem> {
  const item = await prisma.stockCountItem.findUnique({
    where: { id: itemId }
  });

  const variance = countedQty - item!.systemQty;

  return await prisma.stockCountItem.update({
    where: { id: itemId },
    data: {
      countedQty,
      variance
    }
  });
}

async function completeStockCount(
  stockCountId: string,
  userId: string
): Promise<StockCount> {
  const stockCount = await prisma.stockCount.findUnique({
    where: { id: stockCountId },
    include: { items: true }
  });

  if (stockCount?.status === 'COMPLETED') {
    throw new BadRequestError('Stock count already completed');
  }

  await prisma.$transaction(async (tx) => {
    // Process each item with variance
    for (const item of stockCount!.items) {
      if (item.variance !== 0) {
        // Get product cost to calculate adjustment value
        const product = await tx.product.findUnique({
          where: { id: item.productId }
        });

        // Calculate adjustment value: |variance| × cost
        const adjustmentValue = Math.abs(item.variance) *
          parseFloat(product!.costPrice.toString());

        // Determine adjustment type
        const adjustmentType = item.variance > 0 ? 'CORRECTION' : 'WASTAGE';

        // Get approval threshold from configuration
        const config = await tx.configuration.findUnique({
          where: { key: 'ADJUSTMENT_APPROVAL_THRESHOLD' }
        });
        const threshold = config ? parseFloat(config.value) : 1000;

        // Determine if approval needed based on value
        const requiresApproval = adjustmentValue >= threshold;
        const status = requiresApproval ? 'PENDING' : 'APPROVED';

        // Create stock adjustment through normal workflow
        const adjustment = await tx.stockAdjustment.create({
          data: {
            productId: item.productId,
            warehouseId: stockCount!.warehouseId,
            type: adjustmentType,
            quantity: Math.abs(item.variance),
            reason: `Physical count variance: ${item.notes || 'No notes'}`,
            value: adjustmentValue, // Calculate actual value
            status,
            requestedBy: userId,
            ...(status === 'APPROVED' && {
              approvedBy: userId,
              approvedAt: new Date()
            })
          }
        });

        // Update inventory only if adjustment approved
        if (status === 'APPROVED') {
          const inventory = await tx.inventory.findFirst({
            where: {
              productId: item.productId,
              warehouseId: stockCount!.warehouseId,
              ...(item.batchNo && { batchNo: item.batchNo })
            }
          });

          await tx.inventory.update({
            where: { id: inventory!.id },
            data: { quantity: item.countedQty } // Set to actual counted qty
          });

          // Create stock movement
          await tx.stockMovement.create({
            data: {
              productId: item.productId,
              warehouseId: stockCount!.warehouseId,
              movementType: 'PHYSICAL_COUNT',
              quantity: item.variance,
              referenceType: 'STOCK_COUNT',
              referenceId: stockCountId,
              movementDate: new Date(),
              userId,
              notes: `Physical count adjustment: ${item.variance > 0 ? '+' : ''}${item.variance}`
            }
          });
        }
      }
    }

    // Mark count as completed
    await tx.stockCount.update({
      where: { id: stockCountId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date()
      }
    });
  });

  await auditLogger.log({
    action: 'STOCK_COUNT_COMPLETED',
    userId,
    resource: 'StockCount',
    resourceId: stockCountId
  });

  return stockCount!;
}

async function getVarianceReport(stockCountId: string): Promise<any> {
  const stockCount = await prisma.stockCount.findUnique({
    where: { id: stockCountId },
    include: {
      items: {
        where: { variance: { not: 0 } },
        include: { product: true }
      }
    }
  });

  const totalVarianceValue = stockCount!.items.reduce((sum, item) => {
    const value = Math.abs(item.variance) * parseFloat(item.product.costPrice.toString());
    return sum + value;
  }, 0);

  return {
    countNumber: stockCount!.countNumber,
    countDate: stockCount!.countDate,
    itemsWithVariance: stockCount!.items.length,
    totalVarianceValue,
    items: stockCount!.items.map(item => ({
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

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
