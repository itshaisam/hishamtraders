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
   - [ ] Code unique within warehouse
   - [ ] Capacity optional

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
  data: CreateBinDto
): Promise<BinLocation> {
  // Validate code uniqueness within warehouse
  const existing = await prisma.binLocation.findUnique({
    where: { warehouseId_code: { warehouseId, code: data.code } }
  });

  if (existing) {
    throw new BadRequestError('Bin code already exists in this warehouse');
  }

  return await prisma.binLocation.create({
    data: {
      warehouseId,
      code: data.code,
      aisle: data.aisle,
      rack: data.rack,
      shelf: data.shelf,
      capacity: data.capacity,
      description: data.description
    }
  });
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
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
