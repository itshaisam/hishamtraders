# Story 6.7: Batch/Lot Tracking with Expiry Alerts

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.7
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 2 (Inventory)
**Status:** Draft - Phase 2

---

## User Story

**As a** warehouse manager,
**I want** to track batch numbers and expiry dates for products,
**So that** we can use FIFO and avoid selling expired goods.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Inventory table expanded: expiryDate (nullable)
   - [ ] Product table expanded: hasExpiry (boolean), shelfLifeDays (integer)

2. **Stock Receiving:**
   - [ ] When receiving stock, if product.hasExpiry = true:
   - [ ] Prompt for expiry date or auto-calculate: receivedDate + shelfLifeDays

3. **Expiry Monitoring:**
   - [ ] GET /api/inventory/expiring - products expiring within X days (default 60)
   - [ ] Automated daily job creates alerts:
     - 60 days: LOW_PRIORITY
     - 30 days: MEDIUM_PRIORITY
     - 7 days: HIGH_PRIORITY
     - Expired: CRITICAL

4. **FIFO with Expiry:**
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
   - [ ] Expiry date changes logged

---

## Dev Notes

```prisma
model Product {
  // ... existing fields
  hasExpiry      Boolean  @default(false)
  shelfLifeDays  Int?

  // ... relations
}

model Inventory {
  // ... existing fields
  expiryDate     DateTime?

  // ... relations
}
```

```typescript
// FIFO with Expiry Consideration
async function deductStockFIFO(
  productId: string,
  warehouseId: string,
  quantityNeeded: number
): Promise<BatchDeduction[]> {
  const inventoryRecords = await prisma.inventory.findMany({
    where: {
      productId,
      warehouseId,
      quantity: { gt: 0 },
      // Exclude expired batches
      OR: [
        { expiryDate: null },
        { expiryDate: { gt: new Date() } }
      ]
    },
    // Order by expiry date (FEFO - First Expiry First Out)
    // NULLs go LAST (non-expiring products picked last)
    // Then by creation date (FIFO within same expiry)
    orderBy: [
      {
        expiryDate: {
          sort: 'asc',
          nulls: 'last' // Non-expiring products picked LAST
        }
      },
      { createdAt: 'asc' } // Within same expiry, FIFO
    ]
  });

  let remainingQty = quantityNeeded;
  const deductions: BatchDeduction[] = [];

  for (const record of inventoryRecords) {
    if (remainingQty === 0) break;

    // Warn if expiring soon (within 30 days)
    if (record.expiryDate) {
      const daysToExpiry = differenceInDays(record.expiryDate, new Date());
      if (daysToExpiry <= 30) {
        // Log warning or return warning to user
        console.warn(`Batch ${record.batchNo} expires in ${daysToExpiry} days`);
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

// Get Expiring Products
async function getExpiringProducts(daysAhead: number = 60): Promise<any[]> {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + daysAhead);

  const inventory = await prisma.inventory.findMany({
    where: {
      expiryDate: {
        lte: futureDate,
        gt: new Date()
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
    let priority: string;

    if (daysToExpiry <= 7) {
      priority = 'HIGH';
    } else if (daysToExpiry <= 30) {
      priority = 'MEDIUM';
    } else {
      priority = 'LOW';
    }

    return {
      productName: inv.product.name,
      batchNo: inv.batchNo,
      warehouse: inv.warehouse.name,
      quantity: inv.quantity,
      expiryDate: inv.expiryDate,
      daysToExpiry,
      priority
    };
  });
}

// Daily Expiry Alert Job (runs via cron)
async function checkExpiryAlerts(): Promise<void> {
  const expiring = await getExpiringProducts(60);

  for (const item of expiring) {
    // Create alert based on priority
    await prisma.alert.create({
      data: {
        type: 'EXPIRY_WARNING',
        priority: item.priority,
        message: `${item.productName} (Batch ${item.batchNo}) expires in ${item.daysToExpiry} days`,
        targetUsers: ['WAREHOUSE_MANAGER', 'ADMIN']
      }
    });
  }
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
