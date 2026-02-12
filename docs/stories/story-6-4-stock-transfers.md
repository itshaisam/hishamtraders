# Story 6.4: Stock Transfer Between Warehouses

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.4
**Priority:** High
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 6.2
**Status:** Complete — Phase 2 (v3.0 — Implemented)

---

## User Story

**As a** warehouse manager,
**I want** to transfer inventory from one warehouse to another,
**So that** stock can be redistributed based on demand.

---

## Acceptance Criteria

1. **Database Schema:**
   - [x] StockTransfer table with status workflow (TransferStatus enum: PENDING|APPROVED|IN_TRANSIT|COMPLETED|CANCELLED)
   - [x] StockTransferItem table for line items
   - [x] Transfer number format: `ST-YYYYMMDD-XXX`

2. **Status Workflow:**
   - [x] PENDING → APPROVED → IN_TRANSIT → COMPLETED (implemented as COMPLETED rather than RECEIVED)
   - [x] When dispatched (IN_TRANSIT): Gate pass auto-created for source warehouse via GatePassService
   - [x] When IN_TRANSIT: Inventory decremented from source, TRANSFER stock movements created
   - [x] When COMPLETED (received): Inventory incremented at destination, RECEIPT stock movements created

3. **Backend API:**
   - [x] `POST /api/v1/stock-transfers` — creates transfer
   - [x] `PUT /api/v1/stock-transfers/:id/approve` — approves transfer
   - [x] `PUT /api/v1/stock-transfers/:id/dispatch` — dispatches (IN_TRANSIT), deducts source, creates gate pass
   - [x] `PUT /api/v1/stock-transfers/:id/receive` — completes transfer, adds to destination
   - [x] `PUT /api/v1/stock-transfers/:id/cancel` — cancels (restores inventory if IN_TRANSIT)
   - [x] `GET /api/v1/stock-transfers` — list with filters
   - [x] `GET /api/v1/stock-transfers/:id` — get by ID

4. **Batch Tracking:**
   - [x] Each StockTransferItem tracks productId, batchNo, quantity, receivedQuantity
   - [x] Batch/lot numbers maintained across transfer
   - [x] Per-item received quantities supported on receive

5. **Frontend:**
   - [x] StockTransferListPage with filters and status badges
   - [x] CreateStockTransferPage with warehouse selection and line items
   - [x] StockTransferDetailPage with status workflow actions and receive form
   - [x] Destination warehouse can mark as received with per-item quantities

6. **Authorization:**
   - [x] ADMIN and WAREHOUSE_MANAGER roles via requireRole middleware
   - [x] Transfers logged via AuditService.log()

---

## Dev Notes

### Implementation Status

**Backend:** Complete. Module at `apps/api/src/modules/stock-transfers/` (service, controller, routes). Registered in `index.ts`.
**Frontend:** Complete. Pages at `apps/web/src/features/stock-transfers/pages/` (List, Create, Detail). Routes in App.tsx, sidebar entry added.

### Key Corrections

1. **API paths**: All use `/api/v1/stock-transfers` (not `/api/stock-transfers`)
2. **`inventory.unitCost`** — Inventory model has NO `unitCost` field. When creating inventory at destination, use `product.costPrice` from Product model.
3. **`movementType: 'TRANSFER_IN'`** — NOT in MovementType enum. Use existing `TRANSFER` for both outbound and inbound. Differentiate by `quantity` sign (+/-) or `notes`.
4. **`referenceType: 'STOCK_TRANSFER'`** — NOT in ReferenceType enum. Use existing `TRANSFER`.
5. **`gatePass @relation`** on StockTransfer needs a FK field (`gatePassId`) and the GatePass model needs a `stockTransferId` FK or vice versa.
6. **`auditLogger.log()`** → `AuditService.log()` with correct action enum values.

### Schema (Proposed — NEW models)

```prisma
model StockTransfer {
  id               String              @id @default(cuid())
  transferNumber   String              @unique
  fromWarehouseId  String
  toWarehouseId    String
  gatePassId       String?             @unique  // FK to gate pass (optional until approved)
  transferDate     DateTime            @default(now())
  status           StockTransferStatus @default(PENDING)
  requestedBy      String
  approvedBy       String?
  receivedBy       String?
  notes            String?             @db.Text
  createdAt        DateTime            @default(now())
  updatedAt        DateTime            @updatedAt

  fromWarehouse    Warehouse           @relation("TransfersFrom", fields: [fromWarehouseId], references: [id])
  toWarehouse      Warehouse           @relation("TransfersTo", fields: [toWarehouseId], references: [id])
  requester        User                @relation("RequestedTransfers", fields: [requestedBy], references: [id])
  gatePass         GatePass?           @relation(fields: [gatePassId], references: [id])
  items            StockTransferItem[]

  @@map("stock_transfers")
}

model StockTransferItem {
  id              String        @id @default(cuid())
  transferId      String
  productId       String
  batchNo         String?
  fromBinLocation String?
  toBinLocation   String?
  quantity        Int

  transfer        StockTransfer @relation(fields: [transferId], references: [id], onDelete: Cascade)
  product         Product       @relation(fields: [productId], references: [id])

  @@map("stock_transfer_items")
}

enum StockTransferStatus {
  PENDING
  APPROVED
  IN_TRANSIT
  RECEIVED
  CANCELLED
}
```

**Warehouse model** needs new relations:
```prisma
// ADD to Warehouse model:
transfersFrom StockTransfer[] @relation("TransfersFrom")
transfersTo   StockTransfer[] @relation("TransfersTo")
```

**User model** needs new relation:
```prisma
// ADD to User model:
requestedTransfers StockTransfer[] @relation("RequestedTransfers")
```

**Product model** needs new relation:
```prisma
// ADD to Product model:
stockTransferItems StockTransferItem[]
```

**GatePass model** needs new relation:
```prisma
// ADD to GatePass model:
stockTransfer StockTransfer?
```

### Transfer Service

```typescript
async function createStockTransfer(
  data: CreateStockTransferDto,
  userId: string
): Promise<StockTransfer> {
  if (data.fromWarehouseId === data.toWarehouseId) {
    throw new BadRequestError('Cannot transfer to same warehouse');
  }

  const transferNumber = await generateTransferNumber();

  const transfer = await prisma.stockTransfer.create({
    data: {
      transferNumber,
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      requestedBy: userId,
      notes: data.notes,
      items: { create: data.items }
    },
    include: { items: { include: { product: true } } }
  });

  await AuditService.log({
    userId,
    action: 'CREATE',
    entityType: 'StockTransfer',
    entityId: transfer.id,
    notes: `Transfer ${transferNumber} created`,
  });

  return transfer;
}

async function approveStockTransfer(
  transferId: string,
  userId: string
): Promise<StockTransfer> {
  const transfer = await prisma.stockTransfer.findUniqueOrThrow({
    where: { id: transferId },
    include: { items: true }
  });

  if (transfer.status !== 'PENDING') {
    throw new BadRequestError('Transfer must be pending to approve');
  }

  // Create gate pass for source warehouse
  const gatePass = await createGatePass({
    warehouseId: transfer.fromWarehouseId,
    purpose: 'TRANSFER',
    referenceType: 'TRANSFER',    // Use existing ReferenceType enum value
    referenceId: transferId,
    items: transfer.items.map(item => ({
      productId: item.productId,
      batchNo: item.batchNo ?? undefined,
      binLocation: item.fromBinLocation ?? undefined,
      quantity: item.quantity
    }))
  }, userId);

  const updated = await prisma.stockTransfer.update({
    where: { id: transferId },
    data: {
      status: 'APPROVED',
      approvedBy: userId,
      gatePassId: gatePass.id
    }
  });

  await AuditService.log({
    userId,
    action: 'UPDATE',
    entityType: 'StockTransfer',
    entityId: transferId,
    notes: `Transfer ${transfer.transferNumber} approved, gate pass ${gatePass.gatePassNumber} created`,
  });

  return updated;
}
```

### Receive Transfer (Increment Destination)

```typescript
async function receiveStockTransfer(
  transferId: string,
  userId: string
): Promise<StockTransfer> {
  const transfer = await prisma.stockTransfer.findUniqueOrThrow({
    where: { id: transferId },
    include: { items: { include: { product: true } }, gatePass: true }
  });

  if (transfer.status !== 'IN_TRANSIT') {
    throw new BadRequestError('Transfer must be in transit to receive');
  }

  await prisma.$transaction(async (tx) => {
    for (const item of transfer.items) {
      const existing = await tx.inventory.findFirst({
        where: {
          productId: item.productId,
          warehouseId: transfer.toWarehouseId,
          ...(item.batchNo && { batchNo: item.batchNo })
        }
      });

      if (existing) {
        await tx.inventory.update({
          where: { id: existing.id },
          data: { quantity: { increment: item.quantity } }
        });
      } else {
        // Create new inventory record at destination
        // NOTE: Inventory has NO unitCost field — just create with quantity
        await tx.inventory.create({
          data: {
            productId: item.productId,
            warehouseId: transfer.toWarehouseId,
            quantity: item.quantity,
            batchNo: item.batchNo,
            binLocation: item.toBinLocation,
          }
        });
      }

      // Create stock movement for receiving
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: transfer.toWarehouseId,
          movementType: 'TRANSFER',      // Use existing enum value (not TRANSFER_IN)
          quantity: item.quantity,
          referenceType: 'TRANSFER',     // Use existing enum value (not STOCK_TRANSFER)
          referenceId: transferId,
          movementDate: new Date(),
          userId
        }
      });
    }

    await tx.stockTransfer.update({
      where: { id: transferId },
      data: { status: 'RECEIVED', receivedBy: userId }
    });

    // Complete gate pass
    if (transfer.gatePass) {
      await tx.gatePass.update({
        where: { id: transfer.gatePass.id },
        data: { status: 'COMPLETED', completedBy: userId }
      });
    }
  });

  await AuditService.log({
    userId,
    action: 'UPDATE',
    entityType: 'StockTransfer',
    entityId: transferId,
    notes: `Transfer ${transfer.transferNumber} received at destination`,
  });

  return transfer;
}
```

### Module Structure

```
apps/api/src/modules/stock-transfers/
  stock-transfer.controller.ts  (NEW)
  stock-transfer.service.ts     (NEW)
  stock-transfer.routes.ts      (NEW)

apps/web/src/features/stock-transfers/pages/
  StockTransferListPage.tsx      (NEW)
  CreateStockTransferPage.tsx    (NEW)
  StockTransferDetailPage.tsx    (NEW)
```

### POST-MVP DEFERRED

- **Partial receiving**: For MVP, all items received at once. Partial line-item receiving deferred.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), removed inventory.unitCost (doesn't exist), use existing enum values TRANSFER/TRANSFER (not TRANSFER_IN/STOCK_TRANSFER), added gatePassId FK to StockTransfer, auditLogger→AuditService, documented all required relation additions | Claude (AI Review) |
| 2026-02-12 | 3.0     | Implemented: Full backend (service/controller/routes), frontend (List/Create/Detail pages), Prisma migration, gate pass auto-creation on dispatch, cancel with inventory restore. All ACs marked complete. | Claude (AI Implementation) |
