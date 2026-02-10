# Story 6.6: Bin-to-Bin Transfer Within Warehouse

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.6
**Priority:** Low
**Estimated Effort:** 4-6 hours
**Dependencies:** Story 6.5
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As a** warehouse manager,
**I want** to move stock from one bin location to another within the same warehouse,
**So that** warehouse organization can be optimized.

---

## Acceptance Criteria

1. **Backend API:**
   - [ ] `POST /api/v1/inventory/bin-transfer` — creates bin transfer
   - [ ] Payload: `productId`, `warehouseId`, `fromBinLocation`, `toBinLocation`, `quantity`, `batchNo`, `reason`
   - [ ] Validation: sufficient stock in source bin, both bins ACTIVE
   - [ ] Inventory record updated: decrement source, increment/create destination
   - [ ] StockMovement created (`movementType: 'ADJUSTMENT'`)
   - [ ] `GET /api/v1/inventory/bin-transfers` — transfer history

2. **Frontend:**
   - [ ] Bin Transfer page
   - [ ] Select warehouse, product
   - [ ] Display current bin locations with quantities
   - [ ] Select source/destination bins, quantity, reason
   - [ ] Display transfer history

3. **Authorization:**
   - [ ] Warehouse Manager and Admin
   - [ ] Bin transfers logged via `AuditService.log()`

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on Story 6.5 (BinLocation model).

### Key Corrections

1. **API paths**: Use `/api/v1/inventory/bin-transfer` (not `/api/inventory/bin-transfer`)
2. **`inventory.unitCost`** — Inventory model has NO `unitCost` field. When creating new inventory record at destination, omit `unitCost` entirely.
3. **`movementType: 'BIN_TRANSFER'`** — NOT in MovementType enum. Use existing `'ADJUSTMENT'` (closest match — internal location change).
4. **`binLocation.isDeleted`** — BinLocation has NO `isDeleted` field (see Story 6.5 revision). Check `status !== 'ACTIVE'` instead.
5. **`auditLogger.log()`** → `AuditService.log()` with correct fields:
   ```typescript
   await AuditService.log({
     userId,
     action: 'CREATE',
     entityType: 'BinTransfer',       // NOT 'resource'
     entityId: undefined,             // No dedicated model — log as note
     notes: `Bin transfer: ${fromBin} → ${toBin}, product ${productId}, qty ${quantity}. Reason: ${reason}`,
   });
   ```

### Bin Transfer Service (Corrected)

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

  // Check status — NO isDeleted field (use status check)
  if (!fromBin || fromBin.status !== 'ACTIVE') {
    throw new BadRequestError('Source bin not found or inactive');
  }

  if (!toBin || toBin.status !== 'ACTIVE') {
    throw new BadRequestError('Destination bin not found or inactive');
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
      // NOTE: Inventory has NO unitCost field — omit it
      await tx.inventory.create({
        data: {
          productId: data.productId,
          warehouseId: data.warehouseId,
          quantity: data.quantity,
          binLocation: data.toBinLocation,
          batchNo: data.batchNo,
        }
      });
    }

    // Create stock movement record
    await tx.stockMovement.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        movementType: 'ADJUSTMENT',    // Use existing enum (not BIN_TRANSFER)
        quantity: 0,                   // Net zero movement (just location change)
        movementDate: new Date(),
        userId,
        notes: `Bin transfer: ${data.fromBinLocation} → ${data.toBinLocation}. Reason: ${data.reason}`
      }
    });
  });

  await AuditService.log({
    userId,
    action: 'CREATE',
    entityType: 'BinTransfer',
    notes: `Bin transfer: ${data.fromBinLocation} → ${data.toBinLocation}, qty ${data.quantity}. Reason: ${data.reason}`,
  });
}
```

### Module Structure

```
apps/api/src/modules/bins/
  bin.service.ts        (EXPAND — add createBinTransfer, getBinTransferHistory)

apps/web/src/features/warehouse/pages/
  BinTransferPage.tsx    (NEW)
```

### POST-MVP DEFERRED

- **BinTransfer model**: For MVP, bin transfers are recorded only via StockMovement + AuditLog. A dedicated BinTransfer model could be added later for better querying/reporting.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), removed inventory.unitCost (doesn't exist), use ADJUSTMENT enum instead of BIN_TRANSFER, removed binLocation.isDeleted (use status check), auditLogger→AuditService | Claude (AI Review) |
