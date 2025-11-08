# Story 6.6: Bin-to-Bin Transfer Within Warehouse

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.6
**Priority:** Low
**Estimated Effort:** 4-6 hours
**Dependencies:** Story 6.5
**Status:** Draft - Phase 2

---

## User Story

**As a** warehouse manager,
**I want** to move stock from one bin location to another within the same warehouse,
**So that** warehouse organization can be optimized.

---

## Acceptance Criteria

1. **Backend API:**
   - [ ] POST /api/inventory/bin-transfer - creates bin transfer
   - [ ] Payload: productId, warehouseId, fromBinLocation, toBinLocation, quantity, batchNo, reason
   - [ ] Validation: sufficient stock in source bin
   - [ ] Inventory record updated: bin location changed
   - [ ] StockMovement created (type=BIN_TRANSFER)
   - [ ] GET /api/inventory/bin-transfers - transfer history

2. **Frontend:**
   - [ ] Bin Transfer page
   - [ ] Select warehouse, product
   - [ ] Display current bin locations with quantities
   - [ ] Select source/destination bins, quantity, reason
   - [ ] Display transfer history

3. **Authorization:**
   - [ ] Warehouse Manager and Admin
   - [ ] Bin transfers logged in audit trail

---

## Dev Notes

```typescript
interface BinTransferDto {
  productId: string;
  warehouseId: string;
  fromBinLocation: string;
  toBinLocation: string;
  quantity: number;
  batchNo?: string;
  reason: string;
}

async function createBinTransfer(
  data: BinTransferDto,
  userId: string
): Promise<void> {
  // Validate bins exist and are ACTIVE
  const [fromBin, toBin] = await Promise.all([
    prisma.binLocation.findUnique({
      where: { warehouseId_code: { warehouseId: data.warehouseId, code: data.fromBinLocation } }
    }),
    prisma.binLocation.findUnique({
      where: { warehouseId_code: { warehouseId: data.warehouseId, code: data.toBinLocation } }
    })
  ]);

  // Both bins must exist, be ACTIVE, and not deleted
  if (!fromBin || fromBin.status !== 'ACTIVE' || fromBin.isDeleted) {
    throw new BadRequestError('Source bin not found, inactive, or deleted');
  }

  if (!toBin || toBin.status !== 'ACTIVE' || toBin.isDeleted) {
    throw new BadRequestError('Destination bin not found, inactive, or deleted');
  }

  // Find inventory in source bin
  const sourceInventory = await prisma.inventory.findFirst({
    where: {
      productId: data.productId,
      warehouseId: data.warehouseId,
      binLocation: data.fromBinLocation,
      ...(data.batchNo && { batchNo: data.batchNo })
    }
  });

  if (!sourceInventory || sourceInventory.quantity < data.quantity) {
    throw new BadRequestError('Insufficient stock in source bin');
  }

  await prisma.$transaction(async (tx) => {
    // Decrement source bin
    await tx.inventory.update({
      where: { id: sourceInventory.id },
      data: { quantity: { decrement: data.quantity } }
    });

    // Increment destination bin (or create if doesn't exist)
    const destInventory = await tx.inventory.findFirst({
      where: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        binLocation: data.toBinLocation,
        ...(data.batchNo && { batchNo: data.batchNo })
      }
    });

    if (destInventory) {
      await tx.inventory.update({
        where: { id: destInventory.id },
        data: { quantity: { increment: data.quantity } }
      });
    } else {
      await tx.inventory.create({
        data: {
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: data.quantity,
          binLocation: data.toBinLocation,
          batchNo: data.batchNo,
          unitCost: sourceInventory.unitCost
        }
      });
    }

    // Create stock movement record
    await tx.stockMovement.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        movementType: 'BIN_TRANSFER',
        quantity: 0, // Net zero movement (just location change)
        movementDate: new Date(),
        userId,
        notes: `Bin transfer: ${data.fromBinLocation} → ${data.toBinLocation}. Reason: ${data.reason}`
      }
    });
  });

  await auditLogger.log({
    action: 'BIN_TRANSFER',
    userId,
    resource: 'Inventory',
    details: {
      productId: data.productId,
      fromBin: data.fromBinLocation,
      toBin: data.toBinLocation,
      quantity: data.quantity,
      reason: data.reason
    }
  });
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
