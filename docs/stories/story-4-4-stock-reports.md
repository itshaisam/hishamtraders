# Story 4.4: Stock Reports

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.4
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 2 (Inventory)
**Status:** Draft

---

## User Story

**As a** warehouse manager,
**I want** comprehensive stock reports showing current levels, valuations, and movements,
**So that** inventory planning decisions are data-driven.

---

## Acceptance Criteria

1. **Current Stock Report:**
   - [ ] GET /api/reports/stock generates current stock report
   - [ ] Filters: warehouseId, category, status, productId
   - [ ] Shows: Product, SKU, Category, Warehouse, Batch, Quantity, Cost, Value
   - [ ] Summary: Total items, Total stock value
   - [ ] Sort options: name, quantity, value

2. **Stock Valuation Report:**
   - [ ] GET /api/reports/stock-valuation by category
   - [ ] Shows: Category, Total Quantity, Total Value, % of Total

3. **Frontend:**
   - [ ] Stock Report page with filters
   - [ ] Responsive table with summary
   - [ ] Export to Excel button
   - [ ] Performance: <5 seconds for 1000 products

4. **Authorization & Role-Based Access:**
   - [ ] All roles: Read access to stock reports
   - [ ] Accountant/Admin: Can export to Excel
   - [ ] Warehouse Manager: Can access own warehouse only (filter enforced server-side)
   - [ ] Recovery Agent: 403 Forbidden (no access)

5. **Performance & Caching:**
   - [ ] Page size default: 50 items
   - [ ] Max items returned: 5,000 per report (enforce client-side limit)
   - [ ] Implement cursor-based pagination for large datasets
   - [ ] Cache TTL: 10 minutes for generated reports
   - [ ] API timeout: 15 seconds maximum for large datasets
   - [ ] Pagination validation: max pageSize = 100

6. **Real-Time Data Updates:**
   - [ ] Cache TTL: 10 minutes
   - [ ] Cache invalidation: On any inventory transaction (receipt, sale, adjustment)
   - [ ] Show "Report generated at" timestamp on page
   - [ ] Refresh button to regenerate on-demand
   - [ ] Show loading spinner during refresh (>2 seconds)

7. **Excel Export Error Handling:**
   - [ ] Validation: Max 10,000 rows per export
   - [ ] Timeout: 30 seconds maximum per export
   - [ ] Memory limit: 500MB max file size
   - [ ] Retry mechanism: 3 automatic attempts with exponential backoff (1s, 2s, 4s)
   - [ ] Error logging: Log all export failures with filters used
   - [ ] User feedback: Display error toast with specific reason (timeout, size, validation)
   - [ ] Partial export: If timeout after 1000 rows, allow user to export what's available

---

## Dev Notes

```typescript
interface StockReportFilters {
  warehouseId?: string;
  category?: string;
  status?: 'all' | 'in-stock' | 'low-stock' | 'out-of-stock';
  productId?: string;
  sortBy?: 'name' | 'quantity' | 'value';
}

interface StockReportItem {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  warehouse: string;
  batchNo: string;
  quantity: number;
  costPrice: number;
  stockValue: number;
}

interface StockReportResult {
  items: StockReportItem[];
  summary: {
    totalItems: number;
    totalStockValue: number;
  };
}

async function getStockReport(filters: StockReportFilters): Promise<StockReportResult> {
  const where: any = {};

  if (filters.warehouseId) {
    where.warehouseId = filters.warehouseId;
  }

  if (filters.productId) {
    where.productId = filters.productId;
  }

  if (filters.category) {
    where.product = { category: filters.category };
  }

  if (filters.status === 'in-stock') {
    where.quantity = { gt: 0 };
  } else if (filters.status === 'out-of-stock') {
    where.quantity = 0;
  }

  const inventory = await prisma.inventory.findMany({
    where,
    include: {
      product: true,
      warehouse: true
    }
  });

  let items: StockReportItem[] = inventory.map(inv => ({
    productId: inv.product.id,
    productName: inv.product.name,
    sku: inv.product.sku,
    category: inv.product.category || 'N/A',
    warehouse: inv.warehouse.name,
    batchNo: inv.batchNo || 'N/A',
    quantity: inv.quantity,
    costPrice: parseFloat(inv.unitCost.toString()),
    stockValue: inv.quantity * parseFloat(inv.unitCost.toString())
  }));

  // Apply sorting
  if (filters.sortBy === 'name') {
    items.sort((a, b) => a.productName.localeCompare(b.productName));
  } else if (filters.sortBy === 'quantity') {
    items.sort((a, b) => b.quantity - a.quantity);
  } else if (filters.sortBy === 'value') {
    items.sort((a, b) => b.stockValue - a.stockValue);
  }

  const summary = {
    totalItems: items.length,
    totalStockValue: items.reduce((sum, item) => sum + item.stockValue, 0)
  };

  return { items, summary };
}

// Stock Valuation by Category
async function getStockValuation(): Promise<any> {
  const inventory = await prisma.inventory.findMany({
    where: { quantity: { gt: 0 } },
    include: { product: true }
  });

  const categoryData = inventory.reduce((acc, inv) => {
    const category = inv.product.category || 'UNCATEGORIZED';
    const value = inv.quantity * parseFloat(inv.unitCost.toString());

    if (!acc[category]) {
      acc[category] = { quantity: 0, value: 0 };
    }

    acc[category].quantity += inv.quantity;
    acc[category].value += value;

    return acc;
  }, {} as Record<string, { quantity: number; value: number }>);

  const totalValue = Object.values(categoryData).reduce((sum, c) => sum + c.value, 0);

  return Object.entries(categoryData).map(([category, data]) => ({
    category,
    totalQuantity: data.quantity,
    totalValue: data.value,
    percentageOfTotal: totalValue > 0 ? (data.value / totalValue) * 100 : 0
  }));
}
```

**Frontend - Export to Excel:**

```typescript
const handleExport = () => {
  const worksheet = XLSX.utils.json_to_sheet(
    data.items.map(item => ({
      Product: item.productName,
      SKU: item.sku,
      Category: item.category,
      Warehouse: item.warehouse,
      Batch: item.batchNo,
      Quantity: item.quantity,
      'Cost Price': item.costPrice,
      'Stock Value': item.stockValue
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Report');
  XLSX.writeFile(workbook, `stock-report-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
