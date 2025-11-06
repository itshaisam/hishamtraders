# Story 2.7: Real-Time Inventory Tracking

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2.7
**Priority:** Critical
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 2.4 (Products), Story 2.5 (Warehouses), Story 2.6 (Stock Receiving)
**Status:** Draft

---

## User Story

**As a** warehouse manager,
**I want** to see real-time inventory quantities by product and warehouse,
**So that** I know exactly what stock is available at all times.

---

## Acceptance Criteria

1. **Backend API Endpoints:**
   - [ ] GET /api/inventory - Returns inventory across all warehouses with filters (productId, warehouseId, low stock, out of stock)
   - [ ] GET /api/inventory/product/:productId - Returns stock for specific product across all warehouses
   - [ ] GET /api/inventory/warehouse/:warehouseId - Returns all stock in specific warehouse

2. **Stock Status Calculation:**
   - [ ] Stock status calculated: in-stock (qty > reorderLevel), low-stock (qty <= reorderLevel but > 0), out-of-stock (qty = 0)
   - [ ] GET /api/inventory/low-stock - Returns products at or below reorder level

3. **Auto-Update Logic:**
   - [ ] Inventory quantities updated automatically by stock movements (receipts, sales, adjustments)

4. **Frontend Pages:**
   - [ ] Inventory View displays filterable table: Product | SKU | Warehouse | Bin | Quantity | Status
   - [ ] Status displayed with color coding (green/yellow/red)
   - [ ] Search by SKU or product name
   - [ ] Display last updated timestamp

5. **Authorization:**
   - [ ] All roles can view inventory (read-only for Sales/Recovery, read-write for Warehouse/Admin)

6. **Data Refresh:**
   - [ ] Inventory view updates on data refetch (TanStack Query cache invalidation)

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Inventory Repository & Service (AC: 1)**
  - [ ] Create `inventory.service.ts`
  - [ ] Implement `getAll(filters)` method
  - [ ] Implement `getByProduct(productId)` method
  - [ ] Implement `getByWarehouse(warehouseId)` method
  - [ ] Implement `getLowStock()` method

- [ ] **Task 2: Stock Status Calculation (AC: 2)**
  - [ ] Calculate status based on quantity vs reorderLevel
  - [ ] Return status with each inventory record

- [ ] **Task 3: Controller & Routes (AC: 1, 2)**
  - [ ] Create `inventory.controller.ts`
  - [ ] Implement all endpoints
  - [ ] Create `inventory.routes.ts`

- [ ] **Task 4: Authorization (AC: 5)**
  - [ ] All authenticated users can read inventory
  - [ ] No write operations in this story (handled in other stories)

### Frontend Tasks

- [ ] **Task 5: Inventory Types & API Client (AC: 1, 4)**
  - [ ] Create `inventory.types.ts`
  - [ ] Create `inventoryService.ts`
  - [ ] Create TanStack Query hooks

- [ ] **Task 6: Inventory View Page (AC: 4)**
  - [ ] Create `InventoryPage.tsx`
  - [ ] Responsive table/card view
  - [ ] Filters: warehouse, status (in-stock/low/out-of-stock)
   - [ ] Search by SKU or product name
  - [ ] Status badges with color coding
  - [ ] Last updated timestamp
  - [ ] Pagination

- [ ] **Task 7: Low Stock Alert Widget (AC: 2)**
  - [ ] Create `LowStockAlert.tsx` component
  - [ ] Display on dashboard
  - [ ] Show count of low stock items
  - [ ] Link to filtered inventory view

- [ ] **Task 8: Testing**
  - [ ] Backend tests (stock status calculation, filters)
  - [ ] Frontend tests (inventory display, filters, search)

---

## Dev Notes

### Stock Status Calculation

```typescript
type StockStatus = 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';

function calculateStockStatus(quantity: number, reorderLevel: number): StockStatus {
  if (quantity === 0) return 'OUT_OF_STOCK';
  if (quantity <= reorderLevel) return 'LOW_STOCK';
  return 'IN_STOCK';
}
```

### Backend API Response

```typescript
interface InventoryItem {
  id: string;
  product: {
    id: string;
    sku: string;
    name: string;
    reorderLevel: number;
  };
  warehouse: {
    id: string;
    name: string;
  };
  quantity: number;
  binLocation: string | null;
  batchNo: string | null;
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
  updatedAt: string;
}
```

### Frontend Implementation

**Inventory Table with Status Colors:**

```tsx
<Table>
  <TableRow>
    <TableCell>{item.product.sku}</TableCell>
    <TableCell>{item.product.name}</TableCell>
    <TableCell>{item.warehouse.name}</TableCell>
    <TableCell>{item.binLocation || '-'}</TableCell>
    <TableCell>{item.quantity}</TableCell>
    <TableCell>
      <Badge
        variant={
          item.status === 'IN_STOCK' ? 'success' :
          item.status === 'LOW_STOCK' ? 'warning' :
          'danger'
        }
      >
        {item.status.replace('_', ' ')}
      </Badge>
    </TableCell>
    <TableCell>{format(item.updatedAt, 'PPpp')}</TableCell>
  </TableRow>
</Table>
```

**TanStack Query Hook:**

```typescript
export const useInventory = (filters?: InventoryFilters) => {
  return useQuery({
    queryKey: ['inventory', filters],
    queryFn: () => inventoryService.getAll(filters),
    staleTime: 30 * 1000, // 30 seconds (real-time requirement)
    refetchInterval: 60 * 1000, // Auto-refetch every 1 minute
  });
};
```

---

## Testing

### Backend Testing
- Stock status calculation
- Filter by warehouse
- Filter by stock status
- Low stock endpoint

### Frontend Testing
- Inventory display
- Status badge colors
- Search functionality
- Filter controls

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |

---

## Dev Agent Record

*To be populated by dev agent*

---

## QA Results

*To be populated by QA agent*
