# Story 2.6: Stock Receiving from Purchase Orders

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2.6
**Priority:** Critical
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 2.2 (PO Creation), Story 2.4 (Products), Story 2.5 (Warehouses)
**Status:** ✅ Completed

---

## User Story

**As a** warehouse manager,
**I want** to record receipt of goods from a purchase order,
**So that** inventory is updated and PO is marked as complete.

---

## Acceptance Criteria

1. **Database Schema:**
   - [x] Inventory table created: id, productId, productVariantId, warehouseId, quantity, batchNo, binLocation, createdAt, updatedAt
   - [x] StockMovement table created with MovementType and ReferenceType enums

2. **Backend API Endpoints:**
   - [x] POST /api/purchase-orders/:id/receive - Creates stock receipt
   - [x] GET /api/purchase-orders/:id/can-receive - Validates PO is ready for receipt

3. **Stock Receipt Logic:**
   - [x] Receipt includes: warehouseId, receivedDate, items with quantities and bin locations
   - [x] When receipt created, inventory updated (quantity increased)
   - [x] If product doesn't exist in warehouse, create new Inventory record
   - [x] If product exists, increment quantity
   - [x] Batch/lot number auto-generated: YYYYMMDD-XXX or manually entered
   - [x] PO status updated to RECEIVED when goods received
   - [x] StockMovement record created (type=RECEIPT, productId, quantity, referenceType=PO, referenceId=poId)
   - [x] Product variants supported in inventory tracking

4. **Receiving Mismatch Handling:**
   - [x] Accept received quantity as-is (may differ from PO quantity)
   - [x] Frontend form validates received quantity does not exceed ordered quantity
   - [x] Update inventory based on actual received quantity only

5. **Frontend Pages:**
   - [x] PO view page includes "Receive Goods" button (if status = IN_TRANSIT or PENDING)
   - [x] Full-page ReceiveGoodsForm with warehouse selection
   - [x] Goods receipt form lists PO items with input for bin location and batch number per item
   - [x] Receipt confirmation with navigation back to PO view page
   - [x] Form validation and error handling

6. **Authorization:**
   - [x] Only Warehouse Manager and Admin can record goods receipts (role-based authorization)
   - [x] Receive button shown only to authorized users

7. **Audit Logging:**
   - [x] Stock receipt logged in audit trail with RECEIVE_GOODS action
   - [x] Includes warehouse, item count, and user information

---

## Tasks / Subtasks

### Backend Tasks

- [x] **Task 1: Database Schema & Migration (AC: 1)**
  - [x] Create Inventory model: id, productId, productVariantId, warehouseId, quantity, batchNo, binLocation, timestamps
  - [x] Create StockMovement model with MovementType and ReferenceType enums
  - [x] Add foreign keys and relations
  - [x] Run migration: `20251208160901_add_inventory_and_stock_movements`

- [x] **Task 2: Inventory Repository**
  - [x] Create `inventory.repository.ts`
  - [x] Implement `findByProductAndWarehouse()`
  - [x] Implement `create()` and `updateQuantity()` methods
  - [x] Implement `incrementQuantity()` and `decrementQuantity()`
  - [x] Implement `createStockMovement()` and `getStockMovements()`

- [x] **Task 3: Stock Receipt Service (AC: 3)**
  - [x] Create `stock-receipt.service.ts`
  - [x] Implement receipt logic (update/create inventory) with Prisma transactions
  - [x] Generate batch numbers (YYYYMMDD-XXX format)
  - [x] Create stock movements with RECEIPT type
  - [x] Update PO status to RECEIVED
  - [x] Validate PO status before receiving

- [x] **Task 4: Controller & Routes (AC: 2)**
  - [x] Extend `purchase-orders.controller.ts`
  - [x] Implement POST /api/purchase-orders/:id/receive with Zod validation
  - [x] Implement GET /api/purchase-orders/:id/can-receive
  - [x] Add routes with requireRole middleware

- [x] **Task 5: Authorization & Audit (AC: 5, 6)**
  - [x] Apply role guards (ADMIN, WAREHOUSE_MANAGER)
  - [x] Add audit logging with RECEIVE_GOODS action
  - [x] Include warehouse, item count, and user information

### Frontend Tasks

- [x] **Task 6: Stock Receipt Types & API Client**
  - [x] Create types for stock receipt (ReceiveGoodsRequest, ReceiveGoodsItem, CanReceiveResponse)
  - [x] Extend purchaseOrdersService with canReceive() and receiveGoods()
  - [x] Create TanStack Query hooks: useCanReceivePO() and useReceiveGoods()

- [x] **Task 7: Receive Goods Form (AC: 4)**
  - [x] Create `ReceiveGoodsForm.tsx` component
  - [x] Display PO line items in table format
  - [x] Input fields: warehouse (Combobox), bin location per item, batch number per item, received date
  - [x] Quantity validation (cannot exceed ordered quantity)
  - [x] Submit handler with error handling

- [x] **Task 8: PO View Page Integration (AC: 4)**
  - [x] Create `ReceiveGoodsPage.tsx` full-page component
  - [x] Add "Receive Goods" button to POViewPage
  - [x] Show button only when status = IN_TRANSIT or PENDING and user has permission
  - [x] Add route: /purchase-orders/:id/receive
  - [x] Navigate to ReceiveGoodsPage instead of modal

- [x] **Task 9: Build & Integration**
  - [x] Backend builds successfully
  - [x] Frontend builds successfully (date-fns dependency added)
  - [x] Integration tested

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

### Implementation Summary

**Date Completed:** December 8, 2025
**Developer:** Claude Code Assistant
**Actual Effort:** ~10 hours

### Database Changes

1. **Migration:** `20251208160901_add_inventory_and_stock_movements`
   - Created `Inventory` table with support for product variants, batch numbers, and bin locations
   - Created `StockMovement` table for audit trail of all inventory changes
   - Added `MovementType` enum (RECEIPT, SALE, ADJUSTMENT, TRANSFER)
   - Added `ReferenceType` enum (PO, INVOICE, ADJUSTMENT, TRANSFER)
   - Added relations to Product, ProductVariant, Warehouse, and User models
   - Unique constraint on (productId, productVariantId, warehouseId, batchNo)

### Backend Implementation

**Files Created:**
- `apps/api/src/modules/inventory/inventory.repository.ts` - Data access layer for inventory and stock movements
- `apps/api/src/modules/inventory/stock-receipt.service.ts` - Business logic for receiving goods
- `apps/api/src/modules/purchase-orders/dto/receive-goods.dto.ts` - Zod validation schema

**Files Modified:**
- `apps/api/src/modules/purchase-orders/purchase-orders.controller.ts` - Added canReceive() and receiveGoods() endpoints
- `apps/api/src/modules/purchase-orders/purchase-orders.routes.ts` - Added routes with role-based authorization
- `apps/api/src/modules/purchase-orders/purchase-orders.middleware.ts` - Added RECEIVE_GOODS audit logging
- `prisma/schema.prisma` - Added Inventory and StockMovement models

**Key Features:**
- Atomic transactions ensure all inventory updates succeed or fail together
- Batch number auto-generation in YYYYMMDD-XXX format
- Support for partial receipts (received quantity can differ from ordered)
- Stock movement records created for full audit trail
- PO status automatically updated to RECEIVED

### Frontend Implementation

**Files Created:**
- `apps/web/src/features/purchase-orders/components/ReceiveGoodsForm.tsx` - Form component for receiving goods
- `apps/web/src/features/purchase-orders/pages/ReceiveGoodsPage.tsx` - Full-page wrapper for receive goods flow

**Files Modified:**
- `apps/web/src/features/purchase-orders/types/purchase-order.types.ts` - Added ReceiveGoodsRequest, ReceiveGoodsItem, CanReceiveResponse types
- `apps/web/src/features/purchase-orders/services/purchaseOrdersService.ts` - Added canReceive() and receiveGoods() API methods
- `apps/web/src/features/purchase-orders/hooks/usePurchaseOrders.ts` - Added useCanReceivePO() and useReceiveGoods() hooks
- `apps/web/src/features/purchase-orders/pages/POViewPage.tsx` - Added "Receive Goods" button with permission check
- `apps/web/src/App.tsx` - Added /purchase-orders/:id/receive route

**Key Features:**
- Warehouse selection using Combobox component
- Per-item bin location and batch number input
- Quantity validation (cannot exceed ordered quantity)
- Real-time form validation with error messages
- Success toast notification and navigation to PO view
- Permission-based button visibility (ADMIN and WAREHOUSE_MANAGER only)
- Responsive design following established patterns

### Testing & Validation

- ✅ Backend builds successfully
- ✅ Frontend builds successfully
- ✅ Migration runs without errors
- ✅ TypeScript compilation passes
- ✅ All acceptance criteria met
- ✅ Authorization properly enforced
- ✅ Audit logging captures all required information

### Dependencies Added

- `date-fns` - For batch number date formatting (backend)

### Notable Implementation Decisions

1. **Full-page form pattern:** Following user feedback from Story 2.5, used full-page forms instead of modals
2. **Product variant support:** Inventory tracking supports both products and product variants
3. **Flexible receiving:** Frontend allows adjusting receive quantities per item
4. **Batch number flexibility:** Auto-generated if not provided, but can be manually entered
5. **Transaction safety:** All inventory updates wrapped in Prisma transactions for atomicity

### Related Stories

- **Depends on:** Story 2.2 (PO Creation), Story 2.4 (Products), Story 2.5 (Warehouses)
- **Enables:** Story 2.7 (Inventory Tracking), Story 2.9 (Stock Movements)

### Next Steps

The system now supports complete stock receiving workflow. Recommended next stories:
1. Story 2.7 - Inventory Tracking (view current stock levels)
2. Story 2.9 - Stock Movements (view movement history)

---

## QA Results

*To be populated by QA agent*
