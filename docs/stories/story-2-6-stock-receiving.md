# Story 2.6: Stock Receiving from Purchase Orders

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2.6
**Priority:** Critical
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 2.2 (PO Creation), Story 2.4 (Products), Story 2.5 (Warehouses)
**Status:** Draft

---

## User Story

**As a** warehouse manager,
**I want** to record receipt of goods from a purchase order,
**So that** inventory is updated and PO is marked as complete.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Inventory table created: id, productId, warehouseId, quantity, batchNo, binLocation, createdAt, updatedAt

2. **Backend API Endpoints:**
   - [ ] POST /api/purchase-orders/:id/receive - Creates stock receipt
   - [ ] GET /api/purchase-orders/:id/can-receive - Validates PO is ready for receipt

3. **Stock Receipt Logic:**
   - [ ] Receipt includes: warehouseId, receivedDate, items with quantities and bin locations
   - [ ] When receipt created, inventory updated (quantity increased)
   - [ ] If product doesn't exist in warehouse, create new Inventory record
   - [ ] If product exists, increment quantity
   - [ ] Batch/lot number auto-generated: YYYYMMDD-XXX or manually entered
   - [ ] PO status updated to RECEIVED when goods received
   - [ ] StockMovement record created (type=RECEIPT, productId, quantity, referenceType=PO, referenceId=poId)

4. **Receiving Mismatch Handling:**
   - [ ] Accept received quantity as-is (may differ from PO quantity)
   - [ ] Record variance note: over-delivery, under-delivery, or exact match
   - [ ] Update inventory based on actual received quantity only
   - [ ] Adjust landed cost calculation based on actual received quantity
   - [ ] Variance report available for reconciliation with suppliers

5. **Frontend Pages:**
   - [ ] PO detail page includes "Receive Goods" button (if status = IN_TRANSIT or PENDING)
   - [ ] Goods receipt form lists PO items with input for bin location per item
   - [ ] Receipt confirmation with updated inventory

6. **Authorization:**
   - [ ] Only Warehouse Manager and Admin can record goods receipts

7. **Audit Logging:**
   - [ ] Stock receipt logged in audit trail with before/after quantities

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Database Schema & Migration (AC: 1)**
  - [ ] Create Inventory model: id, productId, warehouseId, quantity, batchNo, binLocation, timestamps
  - [ ] Add foreign keys
  - [ ] Run migration

- [ ] **Task 2: Inventory Repository**
  - [ ] Create `inventory.repository.ts`
  - [ ] Implement `findByProductAndWarehouse()`
  - [ ] Implement `create()` and `update()` methods
  - [ ] Implement `incrementQuantity()`

- [ ] **Task 3: Stock Receipt Service (AC: 3)**
  - [ ] Create `stock-receipt.service.ts`
  - [ ] Implement receipt logic (update/create inventory)
  - [ ] Generate batch numbers
  - [ ] Create stock movements
  - [ ] Update PO status to RECEIVED

- [ ] **Task 4: Controller & Routes (AC: 2)**
  - [ ] Extend `purchase-orders.controller.ts`
  - [ ] Implement POST /api/purchase-orders/:id/receive
  - [ ] Implement GET /api/purchase-orders/:id/can-receive
  - [ ] Add routes

- [ ] **Task 5: Authorization & Audit (AC: 5, 6)**
  - [ ] Apply role guards
  - [ ] Add audit logging with before/after quantities

### Frontend Tasks

- [ ] **Task 6: Stock Receipt Types & API Client**
  - [ ] Create types for stock receipt
  - [ ] Extend purchaseOrdersService
  - [ ] Create TanStack Query hooks

- [ ] **Task 7: Receive Goods Form (AC: 4)**
  - [ ] Create `ReceiveGoodsForm.tsx`
  - [ ] Display PO line items
  - [ ] Input fields: warehouse, bin location per item, received date
  - [ ] Submit handler

- [ ] **Task 8: PO Detail Page Integration (AC: 4)**
  - [ ] Add "Receive Goods" button to PO detail page
  - [ ] Show button only when status = IN_TRANSIT or PENDING
  - [ ] Open receipt form modal

- [ ] **Task 9: Testing**
  - [ ] Backend tests (receipt logic, inventory updates)
  - [ ] Frontend tests (form validation, submission)

---

## Dev Notes

### Database Schema (Prisma)

```prisma
model Inventory {
  id          String   @id @default(cuid())
  productId   String
  warehouseId String
  quantity    Int
  batchNo     String?
  binLocation String?

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  product     Product   @relation(fields: [productId], references: [id])
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id])

  @@unique([productId, warehouseId, batchNo])
  @@map("inventory")
}

model StockMovement {
  id            String           @id @default(cuid())
  productId     String
  warehouseId   String
  movementType  MovementType
  quantity      Int
  referenceType ReferenceType?
  referenceId   String?
  movementDate  DateTime         @default(now())
  userId        String
  notes         String?          @db.Text

  product       Product @relation(fields: [productId], references: [id])
  user          User    @relation(fields: [userId], references: [id])

  @@map("stock_movements")
}

enum MovementType {
  RECEIPT
  SALE
  ADJUSTMENT
  TRANSFER
}

enum ReferenceType {
  PO
  INVOICE
  ADJUSTMENT
}
```

### Stock Receipt Logic

```typescript
async receiveGoods(poId: string, data: ReceiveGoodsDto): Promise<void> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId },
    include: { items: true }
  });

  await prisma.$transaction(async (tx) => {
    for (const item of data.items) {
      // Find or create inventory record
      const existing = await tx.inventory.findUnique({
        where: {
          productId_warehouseId_batchNo: {
            productId: item.productId,
            warehouseId: data.warehouseId,
            batchNo: item.batchNo || generateBatchNo()
          }
        }
      });

      if (existing) {
        // Increment quantity
        await tx.inventory.update({
          where: { id: existing.id },
          data: { quantity: existing.quantity + item.quantity }
        });
      } else {
        // Create new inventory record
        await tx.inventory.create({
          data: {
            productId: item.productId,
            warehouseId: data.warehouseId,
            quantity: item.quantity,
            batchNo: item.batchNo || generateBatchNo(),
            binLocation: item.binLocation
          }
        });
      }

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: data.warehouseId,
          movementType: 'RECEIPT',
          quantity: item.quantity,
          referenceType: 'PO',
          referenceId: poId,
          userId: data.userId
        }
      });
    }

    // Update PO status
    await tx.purchaseOrder.update({
      where: { id: poId },
      data: { status: 'RECEIVED' }
    });
  });
}

function generateBatchNo(): string {
  const date = new Date();
  const dateStr = format(date, 'yyyyMMdd');
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `${dateStr}-${random}`;
}
```

---

## Testing

### Backend Testing
- Inventory creation/update logic
- Batch number generation
- Stock movement creation
- PO status update
- Transaction rollback on failure

### Frontend Testing
- Receive goods form validation
- Bin location input per item
- Success notification

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |

---

## Dev Agent Record

*To be populated by dev agent*

---

## QA Results

*To be populated by QA agent*
