# Story 6.5: Bin Location Management

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.5
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 2 (Warehouses)
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As a** warehouse manager,
**I want** to define and manage bin locations within warehouses,
**So that** products can be stored in specific physical locations for efficient picking.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] BinLocation table: warehouseId, code, aisle, rack, shelf, capacity, status
   - [ ] Bin code format: `{Aisle}-{Rack}-{Shelf}` (e.g., `A-01-05`)

2. **Backend API:**
   - [ ] `POST /api/v1/warehouses/:id/bins` — creates bin
   - [ ] `GET /api/v1/warehouses/:id/bins` — list all bins with stock info
   - [ ] `GET /api/v1/bins/:id` — bin details with products
   - [ ] `PUT /api/v1/bins/:id` — updates bin
   - [ ] `DELETE /api/v1/bins/:id` — soft-deletes (only if INACTIVE and no stock)

3. **Validation:**
   - [ ] Code format: `{A-Z0-9}+-{0-9}{2}-{0-9}{2}` (e.g., `A-01-05`)
   - [ ] Code unique within warehouse (composite unique constraint)
   - [ ] Capacity optional and >= 0 (0 = unlimited)
   - [ ] **Bin Status Lifecycle:** ACTIVE → INACTIVE (soft-delete via status change, NOT separate fields)
   - [ ] Can only deactivate if bin has no active stock
   - [ ] Can only transfer FROM/TO ACTIVE bins

4. **Frontend:**
   - [ ] Warehouse detail page with Bin Management section
   - [ ] Grid/list view with stock utilization
   - [ ] Add Bin modal
   - [ ] Display products in each bin

5. **Authorization:**
   - [ ] Admin and Warehouse Manager
   - [ ] Bin CRUD logged via `AuditService.log()`

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on Warehouse model (Epic 2).

### Key Corrections

1. **API paths**: Use `/api/v1/warehouses/:id/bins` and `/api/v1/bins/:id` (not `/api/warehouses/...`)
2. **`auditLogger.log()`** → `AuditService.log()` with correct fields:
   ```typescript
   await AuditService.log({
     userId,
     action: 'CREATE',       // or 'UPDATE' or 'DELETE'
     entityType: 'BinLocation',
     entityId: binLocation.id,
     notes: `Bin ${code} created in warehouse ${warehouseId}`,
   });
   ```
3. **`isDeleted` / `deletedAt`** — These fields were referenced in code but NOT defined in the BinLocation schema. **Decision**: Use `status: INACTIVE` as soft-delete instead of separate boolean fields. Simpler and consistent.
4. **`_count` with filtered relation** — `include: { _count: { inventory: { where: ... } } }` is INVALID Prisma syntax. Prisma `_count` only supports `select` with boolean, not filtered counts. Use a separate query to count active stock instead.
5. **AuditService `action`** must be: `CREATE | UPDATE | DELETE | VIEW` — not custom strings like `BIN_LOCATION_CREATED`

### Schema (Proposed — NEW model)

```prisma
model BinLocation {
  id          String        @id @default(cuid())
  warehouseId String
  code        String
  aisle       String?
  rack        String?
  shelf       String?
  capacity    Int?          // null or 0 = unlimited
  description String?       @db.Text
  status      BinStatus     @default(ACTIVE)
  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  warehouse   Warehouse     @relation(fields: [warehouseId], references: [id])

  @@unique([warehouseId, code])
  @@index([warehouseId, status])
  @@map("bin_locations")
}

enum BinStatus {
  ACTIVE
  INACTIVE
  FULL
}
```

**NOTE**: No `isDeleted` or `deletedAt` fields. Use `status: INACTIVE` for soft-delete.

**Warehouse model** needs new relation:
```prisma
// ADD to Warehouse model:
binLocations BinLocation[]
```

### Bin Creation Service

```typescript
async function createBinLocation(
  warehouseId: string,
  data: CreateBinDto,
  userId: string
): Promise<BinLocation> {
  // Validate code format
  const codeRegex = /^[A-Z0-9]+-[0-9]{2}-[0-9]{2}$/;
  if (!codeRegex.test(data.code.toUpperCase())) {
    throw new BadRequestError(
      'Invalid bin code format. Expected: {Aisle}-{Rack}-{Shelf} (e.g., A-01-05)'
    );
  }

  // Validate capacity
  if (data.capacity !== undefined && data.capacity < 0) {
    throw new BadRequestError('Capacity must be zero or positive');
  }

  // Parse code into components
  const [aisle, rack, shelf] = data.code.toUpperCase().split('-');

  const binLocation = await prisma.binLocation.create({
    data: {
      warehouseId,
      code: data.code.toUpperCase(),
      aisle,
      rack,
      shelf,
      capacity: data.capacity,
      description: data.description,
    }
  });

  await AuditService.log({
    userId,
    action: 'CREATE',
    entityType: 'BinLocation',
    entityId: binLocation.id,
    notes: `Bin ${binLocation.code} created in warehouse`,
  });

  return binLocation;
}
```

### Get Bins With Stock (Corrected — No _count Hack)

```typescript
async function getBinsWithStock(warehouseId: string): Promise<any[]> {
  const bins = await prisma.binLocation.findMany({
    where: { warehouseId, status: 'ACTIVE' },
    orderBy: { code: 'asc' }
  });

  // Get all inventory for this warehouse's bins in one query (avoid N+1)
  const allInventory = await prisma.inventory.findMany({
    where: {
      warehouseId,
      binLocation: { in: bins.map(b => b.code) },
      quantity: { gt: 0 }
    },
    include: { product: true }
  });

  // Group inventory by bin code
  const inventoryByBin = new Map<string, typeof allInventory>();
  for (const inv of allInventory) {
    const key = inv.binLocation ?? '';
    if (!inventoryByBin.has(key)) inventoryByBin.set(key, []);
    inventoryByBin.get(key)!.push(inv);
  }

  return bins.map(bin => {
    const binInventory = inventoryByBin.get(bin.code) ?? [];
    const totalQty = binInventory.reduce((sum, inv) => sum + inv.quantity, 0);
    const utilization = bin.capacity ? (totalQty / bin.capacity) * 100 : null;

    return {
      ...bin,
      currentStock: totalQty,
      utilization,
      products: binInventory.map(inv => ({
        productName: inv.product.name,
        quantity: inv.quantity,
        batchNo: inv.batchNo
      }))
    };
  });
}
```

### Deactivate / Delete Bin (Corrected)

```typescript
// Deactivate bin (requires empty bin)
async function deactivateBinLocation(
  binId: string,
  userId: string
): Promise<BinLocation> {
  const bin = await prisma.binLocation.findUniqueOrThrow({
    where: { id: binId }
  });

  if (bin.status !== 'ACTIVE') {
    throw new BadRequestError('Bin must be ACTIVE to deactivate');
  }

  // Check for active stock — separate query instead of invalid _count syntax
  const stockCount = await prisma.inventory.count({
    where: {
      warehouseId: bin.warehouseId,
      binLocation: bin.code,
      quantity: { gt: 0 }
    }
  });

  if (stockCount > 0) {
    throw new BadRequestError(
      'Cannot deactivate bin with active stock. Move all inventory out first.'
    );
  }

  const updated = await prisma.binLocation.update({
    where: { id: binId },
    data: { status: 'INACTIVE' }
  });

  await AuditService.log({
    userId,
    action: 'UPDATE',
    entityType: 'BinLocation',
    entityId: binId,
    notes: `Bin ${bin.code} deactivated`,
  });

  return updated;
}

// "Delete" = set INACTIVE (no separate isDeleted/deletedAt fields)
// The deactivate function above IS the soft-delete
```

### Module Structure

```
apps/api/src/modules/bins/
  bin.controller.ts     (NEW)
  bin.service.ts        (NEW)
  bin.routes.ts         (NEW)

apps/web/src/features/warehouse/pages/
  WarehouseDetailPage.tsx  (EXPAND — add Bin Management section)
```

### POST-MVP DEFERRED

- **Bulk bin creation (CSV upload)**: Manual creation only for MVP.
- **Bin capacity enforcement**: Track utilization but don't block stock placement.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), removed isDeleted/deletedAt (use status:INACTIVE instead), fixed invalid _count Prisma syntax (use separate count query), fixed N+1 in getBinsWithStock, auditLogger→AuditService with correct action values | Claude (AI Review) |
