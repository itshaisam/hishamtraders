# Story 4.3: Warehouse Dashboard

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.3
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 2 (Inventory)
**Status:** Draft

---

## User Story

**As a** warehouse manager,
**I want** a warehouse-focused dashboard showing stock levels and movements,
**So that** I can manage inventory effectively and identify issues quickly.

---

## Acceptance Criteria

1. **Backend API:**
   - [ ] `GET /api/v1/warehouse/stats` returns warehouse metrics (expand existing endpoint)
   - [ ] Total items in stock: distinct product count where total inventory qty > 0
   - [ ] Stock value by category: grouped by `product.category.name` (FK join), value = `SUM(inventory.quantity * product.costPrice)`
   - [ ] Recent stock movements: last 10 `StockMovement` records with product name, type, qty, user
   - [ ] Low stock alerts: products where total inventory qty > 0 AND <= `product.reorderLevel`
   - [ ] Out of stock: products where total inventory qty == 0
   - [ ] Pending receipts: PO count with status `IN_TRANSIT`

2. **Frontend Dashboard:**
   - [ ] Stock summary cards (total items, stock value, low stock count, out of stock count)
   - [ ] Stock value by category chart (bar or pie)
   - [ ] Recent movements table
   - [ ] Low stock alerts list with reorder level comparison
   - [ ] Pending receipts count widget
   - [ ] Quick actions: Record Receipt, Adjust Stock
   - [ ] Empty state handling

3. **Authorization:**
   - [ ] `WAREHOUSE_MANAGER`: All warehouse data (see note on filtering)
   - [ ] `ADMIN`: Full access (also available via Admin Dashboard tab)
   - [ ] Other roles: 403 Forbidden

4. **Performance:**
   - [ ] TanStack Query with `staleTime: 120000` (2 min), `refetchInterval: 30000` (30s)
   - [ ] `Promise.all()` for parallel metric queries
   - [ ] Low stock / out of stock: max 100 products returned
   - [ ] Recent movements: 10 records default

---

## Dev Notes

### Implementation Status

**Backend:** Scaffold exists at `apps/api/src/services/dashboard.service.ts` — `getWarehouseStats()` returns mock zeros. Needs real implementation.

**Frontend:** `apps/web/src/components/dashboards/WarehouseDashboard.tsx` exists (likely scaffold).

**Route:** `GET /api/v1/warehouse/stats` already registered with `requireRole(['ADMIN', 'WAREHOUSE_MANAGER'])`.

### Schema Field Reference

```
Inventory: id, productId, productVariantId, warehouseId, quantity, batchNo, binLocation
           (NO unitCost — use Product.costPrice for value calculation)
           product → Product relation
           warehouse → Warehouse relation

Product:   id, name, sku, categoryId, costPrice, sellingPrice, reorderLevel, status
           category → ProductCategory relation (category.name for grouping)
           inventory → Inventory[] relation

ProductCategory: id, name

StockMovement: id, productId, movementType (MovementType), quantity, referenceType, referenceId,
               movementDate, userId, notes
               product → Product relation
               user → User relation
               MovementType: RECEIPT | SALE | ADJUSTMENT | TRANSFER

PurchaseOrder: status → POStatus: PENDING | IN_TRANSIT | RECEIVED | CANCELLED
               (use count WHERE status = 'IN_TRANSIT' for pending receipts)
```

### Key Corrections from Original Doc

1. **`inventory.unitCost` does NOT exist** — Stock value must be calculated as:
   ```typescript
   const inventoryWithProduct = await prisma.inventory.findMany({
     where: { quantity: { gt: 0 } },
     include: { product: { select: { costPrice: true, categoryId: true, category: { select: { name: true } } } } }
   });
   ```

2. **`product.category` is a FK relation** — not a string. Use `product.category?.name || 'Uncategorized'` for grouping.

3. **No per-warehouse filtering in MVP** — The schema has no user-warehouse assignment. All warehouse managers see all warehouses. Per-warehouse filtering requires adding a `warehouseId` FK to the `User` model or a junction table. Defer.

4. **API path** is `GET /api/v1/warehouse/stats` (not `GET /api/dashboard/warehouse`).

### Stock Value by Category (Correct)
```typescript
const categoryValues: Record<string, number> = {};
inventoryWithProduct.forEach(inv => {
  const categoryName = inv.product.category?.name || 'Uncategorized';
  const value = inv.quantity * parseFloat(inv.product.costPrice.toString());
  categoryValues[categoryName] = (categoryValues[categoryName] || 0) + value;
});
```

### Low Stock / Out of Stock (Correct)
```typescript
const products = await prisma.product.findMany({
  where: { status: 'ACTIVE' },
  include: {
    inventory: { select: { quantity: true } },
    category: { select: { name: true } },
  }
});

const lowStock: any[] = [];
const outOfStock: any[] = [];

products.forEach(p => {
  const totalQty = p.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
  if (totalQty === 0) {
    outOfStock.push({ productId: p.id, name: p.name, sku: p.sku, category: p.category?.name });
  } else if (totalQty <= p.reorderLevel) {
    lowStock.push({ productId: p.id, name: p.name, sku: p.sku, currentQty: totalQty, reorderLevel: p.reorderLevel });
  }
});
```

### POST-MVP DEFERRED

- **Per-warehouse filtering**: Requires user-warehouse assignment model. Defer.
- **WebSocket / push notifications**: Overkill. Use TanStack Query polling.
- **206 Partial Content responses**: Just return 200 with null/empty for failed sections.
- **Bin occupancy visualization**: Defer to Story 6.5 (Bin Management).
