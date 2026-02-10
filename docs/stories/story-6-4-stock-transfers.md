# Story 6.4: Stock Transfer Between Warehouses

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.4
**Priority:** High
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 6.2
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As a** warehouse manager,
**I want** to transfer inventory from one warehouse to another,
**So that** stock can be redistributed based on demand.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] StockTransfer table with status workflow (see Dev Notes)
   - [ ] StockTransferItem table for line items
   - [ ] Transfer number format: `ST-YYYYMMDD-XXX`

2. **Status Workflow:**
   - [ ] PENDING → APPROVED → IN_TRANSIT → RECEIVED
   - [ ] When APPROVED: Gate pass auto-created for source warehouse (status depends on warehouse gate pass mode)
   - [ ] When IN_TRANSIT: Inventory decremented from source (if not already deducted in AUTO mode)
   - [ ] When RECEIVED: Inventory incremented at destination using `product.costPrice` (not `inventory.unitCost` — doesn't exist)

3. **Backend API:**
   - [ ] `POST /api/v1/stock-transfers` — creates transfer
   - [ ] `PUT /api/v1/stock-transfers/:id/approve` — approves + creates gate pass
   - [ ] `PUT /api/v1/stock-transfers/:id/receive` — completes transfer
   - [ ] `GET /api/v1/stock-transfers` — list with filters

4. **Batch Tracking:**
   - [ ] Each StockTransferItem = ONE batch from ONE bin location
   - [ ] Batch/lot numbers maintained across transfer
   - [ ] If warehouse has same product in multiple bins, create separate line items per bin

5. **Frontend:**
   - [ ] Stock Transfer page
   - [ ] Create Transfer form
   - [ ] Status progress indicator (Tailwind divs, not Stepper)
   - [ ] Destination warehouse can mark as received

6. **Authorization:**
   - [ ] Warehouse Manager and Admin
   - [ ] Transfers logged via `AuditService.log()`

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on Story 6.2 (Gate Pass creation).

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
