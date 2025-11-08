# Story 6.4: Stock Transfer Between Warehouses

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.4
**Priority:** High
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 6.2
**Status:** Draft - Phase 2

---

## User Story

**As a** warehouse manager,
**I want** to transfer inventory from one warehouse to another,
**So that** stock can be redistributed based on demand.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] StockTransfer table with status workflow
   - [ ] StockTransferItem table for line items
   - [ ] Transfer number format: ST-YYYYMMDD-XXX

2. **Status Workflow:**
   - [ ] PENDING → APPROVED → IN_TRANSIT → RECEIVED
   - [ ] When APPROVED: Gate pass auto-created for source warehouse
   - [ ] When IN_TRANSIT: Inventory decremented from source
   - [ ] When RECEIVED: Inventory incremented at destination

3. **Backend API:**
   - [ ] POST /api/stock-transfers - creates transfer
   - [ ] PUT /api/stock-transfers/:id/approve - approves
   - [ ] PUT /api/stock-transfers/:id/receive - completes
   - [ ] GET /api/stock-transfers - list with filters

4. **Batch Tracking:**
   - [ ] Batch/lot numbers maintained across transfer

5. **Frontend:**
   - [ ] Stock Transfer page
   - [ ] Create Transfer form
   - [ ] Status progress indicator
   - [ ] Destination warehouse can mark as received

6. **Authorization:**
   - [ ] Warehouse Manager and Admin
   - [ ] Transfers logged in audit trail

---

## Dev Notes

```prisma
model StockTransfer {
  id               String              @id @default(cuid())
  transferNumber   String              @unique
  fromWarehouseId  String
  toWarehouseId    String
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
  items            StockTransferItem[]
  gatePass         GatePass?           @relation

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

```typescript
async function createStockTransfer(
  data: CreateStockTransferDto,
  userId: string
): Promise<StockTransfer> {
  // Validate warehouses are different
  if (data.fromWarehouseId === data.toWarehouseId) {
    throw new BadRequestError('Cannot transfer to same warehouse');
  }

  // Generate transfer number
  const transferNumber = await generateTransferNumber();

  const transfer = await prisma.stockTransfer.create({
    data: {
      transferNumber,
      fromWarehouseId: data.fromWarehouseId,
      toWarehouseId: data.toWarehouseId,
      requestedBy: userId,
      notes: data.notes,
      items: {
        create: data.items
      }
    },
    include: { items: { include: { product: true } } }
  });

  return transfer;
}

async function approveStockTransfer(
  transferId: string,
  userId: string
): Promise<StockTransfer> {
  const transfer = await prisma.stockTransfer.findUnique({
    where: { id: transferId },
    include: { items: true }
  });

  if (transfer?.status !== 'PENDING') {
    throw new BadRequestError('Transfer must be pending to approve');
  }

  // Create gate pass for source warehouse
  const gatePass = await createGatePass({
    warehouseId: transfer.fromWarehouseId,
    purpose: 'TRANSFER',
    referenceType: 'STOCK_TRANSFER',
    referenceId: transferId,
    items: transfer.items.map(item => ({
      productId: item.productId,
      batchNo: item.batchNo,
      binLocation: item.fromBinLocation,
      quantity: item.quantity
    }))
  }, userId);

  const updated = await prisma.stockTransfer.update({
    where: { id: transferId },
    data: {
      status: 'APPROVED',
      approvedBy: userId
    }
  });

  return updated;
}

async function receiveStockTransfer(
  transferId: string,
  userId: string
): Promise<StockTransfer> {
  const transfer = await prisma.stockTransfer.findUnique({
    where: { id: transferId },
    include: { items: true, gatePass: true }
  });

  if (transfer?.status !== 'IN_TRANSIT') {
    throw new BadRequestError('Transfer must be in transit to receive');
  }

  await prisma.$transaction(async (tx) => {
    // Increment inventory at destination
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
        await tx.inventory.create({
          data: {
            productId: item.productId,
            warehouseId: transfer.toWarehouseId,
            quantity: item.quantity,
            batchNo: item.batchNo,
            binLocation: item.toBinLocation,
            unitCost: 0 // Copy from source inventory
          }
        });
      }

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: transfer.toWarehouseId,
          movementType: 'TRANSFER_IN',
          quantity: item.quantity,
          referenceType: 'STOCK_TRANSFER',
          referenceId: transferId,
          movementDate: new Date(),
          userId
        }
      });
    }

    // Update transfer status
    await tx.stockTransfer.update({
      where: { id: transferId },
      data: {
        status: 'RECEIVED',
        receivedBy: userId
      }
    });

    // Complete gate pass
    if (transfer.gatePass) {
      await tx.gatePass.update({
        where: { id: transfer.gatePass.id },
        data: { status: 'COMPLETED', completedBy: userId }
      });
    }
  });

  return transfer;
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
