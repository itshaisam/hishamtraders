# Story 6.6: Bin-to-Bin Transfer Within Warehouse

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.6
**Priority:** Low
**Estimated Effort:** 4-6 hours
**Dependencies:** Story 6.5
**Status:** Complete — Phase 2 (v3.0 — Implemented)

---

## User Story

**As a** warehouse manager,
**I want** to move stock from one bin location to another within the same warehouse,
**So that** warehouse organization can be optimized.

---

## Acceptance Criteria

1. **Backend API:**
   - [x] `POST /api/v1/warehouses/:id/bin-transfers` — creates bin transfer (routed under warehouses)
   - [x] Payload: `productId`, `fromBin`, `toBin`, `quantity`, `batchNo`, `reason`
   - [x] Validation: sufficient stock in source bin, both bins exist and are active
   - [x] Inventory record updated: decrement source, increment/create destination
   - [x] StockMovement created (`movementType: 'ADJUSTMENT'`)

2. **Frontend:**
   - [x] BinTransferPage with warehouse, product, bin selectors
   - [x] Loads bin locations dynamically for selected warehouse
   - [x] Quantity and reason inputs
   - [x] Success/error feedback via toast

3. **Authorization:**
   - [x] ADMIN and WAREHOUSE_MANAGER roles via requireRole middleware
   - [x] Bin transfers logged via audit middleware

---

## Dev Notes

### Implementation Status

**Backend:** Complete. Service/controller at `apps/api/src/modules/warehouses/bin-transfer.{service,controller}.ts`. Route added to `warehouses.routes.ts`.
**Frontend:** Complete. `apps/web/src/features/warehouses/pages/BinTransferPage.tsx`. Route in App.tsx, sidebar entry added.

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
| 2026-02-12 | 3.0     | Implemented: Backend service/controller, frontend page, routed under warehouses module. All ACs marked complete. | Claude (AI Implementation) |
