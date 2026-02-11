# Story 4.4: Stock Reports

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.4
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 2 (Inventory)
**Status:** Implemented

---

## User Story

**As a** warehouse manager,
**I want** comprehensive stock reports showing current levels, valuations, and movements,
**So that** inventory planning decisions are data-driven.

---

## Acceptance Criteria

1. **Current Stock Report:**
   - [x] `GET /api/v1/reports/stock` generates current stock report
   - [x] Filters: `warehouseId`, `categoryId`, `status` (all|in-stock|low-stock|out-of-stock), `productId`
   - [x] Shows: Product, SKU, Category, Warehouse, Batch, Quantity, Cost Price, Stock Value
   - [x] Summary: Total line items, Total stock value
   - [x] Sort options: name, quantity, value (default: name)

2. **Stock Valuation Report:**
   - [x] `GET /api/v1/reports/stock-valuation` by category
   - [x] Shows: Category Name, Total Quantity, Total Value, % of Total

3. **Frontend:**
   - [x] Stock Report page with filter sidebar
   - [x] Responsive table with summary row
   - [x] Export to Excel button (Story 4.9)
   - [x] Empty state when no results

4. **Authorization:**
   - [x] `ADMIN`: Full access
   - [x] `ACCOUNTANT`: Full access
   - [x] `WAREHOUSE_MANAGER`: Full access (no per-warehouse filtering — see note)
   - [x] `SALES_OFFICER`: Read-only access (stock levels only, no valuation)
   - [x] `RECOVERY_AGENT`: 403 Forbidden

5. **Performance:**
   - [x] Offset-based pagination: default `limit=50`, max `limit=100`
   - [x] TanStack Query with `staleTime: 300000` (5 min)
   - [x] "Report generated at" timestamp shown on page
   - [x] Refresh button to regenerate on-demand

---

## Dev Notes

### Implementation Status

**Backend:** No stock report service exists. Reports module is at `apps/api/src/modules/reports/` with existing endpoints for credit-limits, tax-summary, expense-summary, cash-flow.

**Frontend:** No stock report page exists.

**Route registration:** Add to `apps/api/src/modules/reports/reports.routes.ts` (base path `/api/v1/reports`).

### Schema Field Reference

```
Inventory: id, productId, productVariantId, warehouseId, quantity, batchNo, binLocation
           (NO unitCost — use Product.costPrice for value calculation)
           product → Product relation
           warehouse → Warehouse relation

Product:   id, sku, name, categoryId, costPrice, sellingPrice, reorderLevel, status
           category → ProductCategory relation (use .category.name for grouping)
           inventory → Inventory[] relation

ProductCategory: id, name

Warehouse: id, name, code, address
```

### Key Corrections from Original Doc

1. **`inventory.unitCost` does NOT exist** — Stock value must use `product.costPrice`:
   ```typescript
   costPrice: parseFloat(inv.product.costPrice.toString()),
   stockValue: inv.quantity * parseFloat(inv.product.costPrice.toString())
   ```

2. **`product.category` is a FK relation** — not a string field. Use `inv.product.category?.name || 'Uncategorized'` for display.

3. **Category filter** uses `categoryId` (string FK), not `category` (string name):
   ```typescript
   if (filters.categoryId) {
     where.product = { categoryId: filters.categoryId };
   }
   ```

4. **No per-warehouse filtering for users** — The schema has no user-warehouse assignment. All warehouse managers see all warehouses. Filter by `warehouseId` is a user-selected filter, not role-enforced.

5. **`status` filter requires aggregation** — "low-stock" and "out-of-stock" cannot be filtered at DB level because they depend on total inventory across all warehouses per product. For MVP, fetch all inventory and filter in application code. Keep result sets manageable with pagination.

6. **API path** is `/api/v1/reports/stock` (not `/api/reports/stock`).

### Current Stock Report (Correct)
```typescript
const inventory = await prisma.inventory.findMany({
  where,
  include: {
    product: {
      select: { id: true, name: true, sku: true, costPrice: true, categoryId: true,
                category: { select: { name: true } } }
    },
    warehouse: { select: { id: true, name: true } }
  },
  skip: offset,
  take: limit,
  orderBy: sortOrder  // e.g. { product: { name: 'asc' } }
});

const items = inventory.map(inv => ({
  productId: inv.product.id,
  productName: inv.product.name,
  sku: inv.product.sku,
  category: inv.product.category?.name || 'Uncategorized',
  warehouse: inv.warehouse.name,
  batchNo: inv.batchNo || 'N/A',
  quantity: inv.quantity,
  costPrice: parseFloat(inv.product.costPrice.toString()),
  stockValue: inv.quantity * parseFloat(inv.product.costPrice.toString())
}));
```

### Stock Valuation by Category (Correct)
```typescript
const inventory = await prisma.inventory.findMany({
  where: { quantity: { gt: 0 } },
  include: { product: { select: { costPrice: true, category: { select: { name: true } } } } }
});

const categoryData: Record<string, { quantity: number; value: number }> = {};
inventory.forEach(inv => {
  const catName = inv.product.category?.name || 'Uncategorized';
  const value = inv.quantity * parseFloat(inv.product.costPrice.toString());
  if (!categoryData[catName]) categoryData[catName] = { quantity: 0, value: 0 };
  categoryData[catName].quantity += inv.quantity;
  categoryData[catName].value += value;
});

const totalValue = Object.values(categoryData).reduce((sum, c) => sum + c.value, 0);
return Object.entries(categoryData).map(([category, data]) => ({
  category,
  totalQuantity: data.quantity,
  totalValue: data.value,
  percentageOfTotal: totalValue > 0 ? Math.round((data.value / totalValue) * 100 * 100) / 100 : 0
}));
```

### Module Structure

```
apps/api/src/modules/reports/
  stock-report.service.ts       (NEW — getStockReport, getStockValuation)
  reports.controller.ts         (EXPAND — add stock report handlers)
  reports.routes.ts             (EXPAND — add GET /stock, GET /stock-valuation)

apps/web/src/features/reports/pages/
  StockReportPage.tsx           (NEW)

apps/web/src/services/
  reportsService.ts             (EXPAND — add getStockReport, getStockValuation)

apps/web/src/hooks/
  useReports.ts                 (EXPAND — add useStockReport, useStockValuation)
```

### POST-MVP DEFERRED

- **Cursor-based pagination**: Offset pagination is sufficient for stock reports. Cursor-based adds complexity with no benefit at current scale.
- **Server-side caching with TTL/invalidation**: Use TanStack Query client-side caching instead.
- **500MB file size limits / retry with exponential backoff**: Over-engineered for Excel export. Handle in Story 4.9.
- **Partial export on timeout**: Just show error and let user narrow filters.
