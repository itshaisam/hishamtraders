# Story 6.5: Bin Location Management

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.5
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 2 (Warehouses)
**Status:** Draft - Phase 2

---

## User Story

**As a** warehouse manager,
**I want** to define and manage bin locations within warehouses,
**So that** products can be stored in specific physical locations for efficient picking.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] BinLocation table: warehouseId, code, aisle, rack, shelf, capacity, status
   - [ ] Bin code format: {Aisle}-{Rack}-{Shelf} (e.g., A-01-05)

2. **Backend API:**
   - [ ] POST /api/warehouses/:id/bins - creates bin
   - [ ] GET /api/warehouses/:id/bins - list all bins
   - [ ] GET /api/bins/:id - bin details with products
   - [ ] PUT /api/bins/:id - updates bin
   - [ ] DELETE /api/bins/:id - soft-deletes (only if no stock)

3. **Validation:**
   - [ ] Code format validation: `{A-Z0-9}+-{0-9}{2}-{0-9}{2}` (e.g., A-01-05)
   - [ ] Code unique within warehouse
   - [ ] Capacity optional and >= 0 (0 = unlimited)
   - [ ] **Bin Status Lifecycle:** ACTIVE → INACTIVE → SOFT-DELETE
     - Can only DELETE (soft-delete) if INACTIVE
     - Can only DELETE if no active stock assigned
     - Can transfer FROM/TO only ACTIVE bins
   - [ ] **Deactivation:** Can deactivate ACTIVE bin only if empty (no stock)

4. **Frontend:**
   - [ ] Warehouse detail page with Bin Management section
   - [ ] Grid/list view with stock utilization
   - [ ] Add Bin modal
   - [ ] Display products in each bin
   - [ ] Bulk bin creation (CSV upload optional)

5. **Authorization:**
   - [ ] Admin and Warehouse Manager
   - [ ] Bin CRUD logged in audit trail

---

## Dev Notes

```prisma
model BinLocation {
  id          String        @id @default(cuid())
  warehouseId String
  code        String
  aisle       String?
  rack        String?
  shelf       String?
  capacity    Int?
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

```typescript
async function createBinLocation(
  warehouseId: string,
  data: CreateBinDto,
  userId: string
): Promise<BinLocation> {
  // Validate code format: {A-Z0-9}+-{0-9}{2}-{0-9}{2} (e.g., A-01-05)
  const codeRegex = /^[A-Z0-9]+-[0-9]{2}-[0-9]{2}$/;
  if (!codeRegex.test(data.code.toUpperCase())) {
    throw new BadRequestError(
      'Invalid bin code format. Expected: {Aisle}-{Rack}-{Shelf} ' +
      '(e.g., A-01-05 where Rack and Shelf are 2-digit numbers)'
    );
  }

  // Validate code uniqueness within warehouse
  const existing = await prisma.binLocation.findUnique({
    where: { warehouseId_code: { warehouseId, code: data.code.toUpperCase() } }
  });

  if (existing) {
    throw new BadRequestError('Bin code already exists in this warehouse');
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
      aisle: data.aisle || aisle,
      rack: data.rack || rack,
      shelf: data.shelf || shelf,
      capacity: data.capacity,
      description: data.description,
      status: 'ACTIVE'
    }
  });

  await auditLogger.log({
    action: 'BIN_LOCATION_CREATED',
    userId,
    resource: 'BinLocation',
    resourceId: binLocation.id,
    details: { code: binLocation.code, warehouseId }
  });

  return binLocation;
}

async function getBinsWithStock(warehouseId: string): Promise<any[]> {
  const bins = await prisma.binLocation.findMany({
    where: { warehouseId, status: 'ACTIVE' },
    orderBy: { code: 'asc' }
  });

  // Get stock for each bin
  const binsWithStock = await Promise.all(
    bins.map(async (bin) => {
      const inventory = await prisma.inventory.findMany({
        where: {
          warehouseId,
          binLocation: bin.code
        },
        include: { product: true }
      });

      const totalQty = inventory.reduce((sum, inv) => sum + inv.quantity, 0);
      const utilization = bin.capacity
        ? (totalQty / bin.capacity) * 100
        : null;

      return {
        ...bin,
        currentStock: totalQty,
        utilization,
        products: inventory.map(inv => ({
          productName: inv.product.name,
          quantity: inv.quantity,
          batchNo: inv.batchNo
        }))
      };
    })
  );

  return binsWithStock;
}

// Deactivate bin (requires empty bin)
async function deactivateBinLocation(
  binId: string,
  userId: string
): Promise<BinLocation> {
  const bin = await prisma.binLocation.findUnique({
    where: { id: binId },
    include: {
      _count: {
        inventory: { where: { quantity: { gt: 0 } } } // Active stock count
      }
    }
  });

  if (!bin) {
    throw new NotFoundError('Bin not found');
  }

  if (bin._count.inventory > 0) {
    throw new BadRequestError(
      'Cannot deactivate bin with active stock. ' +
      'Move all inventory out first.'
    );
  }

  const updated = await prisma.binLocation.update({
    where: { id: binId },
    data: { status: 'INACTIVE' }
  });

  await auditLogger.log({
    action: 'BIN_LOCATION_DEACTIVATED',
    userId,
    resource: 'BinLocation',
    resourceId: binId,
    details: { code: bin.code, warehouseId: bin.warehouseId }
  });

  return updated;
}

// Delete (soft-delete) bin (requires INACTIVE status)
async function deleteBinLocation(
  binId: string,
  userId: string
): Promise<void> {
  const bin = await prisma.binLocation.findUnique({
    where: { id: binId }
  });

  if (!bin) {
    throw new NotFoundError('Bin not found');
  }

  // Only allow deletion if INACTIVE
  if (bin.status !== 'INACTIVE') {
    throw new BadRequestError(
      'Bin must be INACTIVE before deletion. ' +
      'Deactivate first, move stock, then delete.'
    );
  }

  // Soft delete
  await prisma.binLocation.update({
    where: { id: binId },
    data: {
      isDeleted: true,
      deletedAt: new Date()
    }
  });

  await auditLogger.log({
    action: 'BIN_LOCATION_DELETED',
    userId,
    resource: 'BinLocation',
    resourceId: binId,
    details: { code: bin.code }
  });
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
