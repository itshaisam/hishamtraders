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
   - [ ] GET /api/dashboard/warehouse returns warehouse metrics
   - [ ] Total items in stock (distinct product count with qty > 0)
   - [ ] Stock value by category
   - [ ] Recent stock movements (last 10 transactions)
   - [ ] Low stock alerts (products at/below reorder level)
   - [ ] Out of stock products list
   - [ ] Pending stock receipts (POs ready to receive)

2. **Frontend Dashboard:**
   - [ ] Stock summary cards
   - [ ] Stock level by category chart
   - [ ] Recent movements table
   - [ ] Low stock alerts list
   - [ ] Pending receipts widget
   - [ ] Quick actions: Record Receipt, Adjust Stock

3. **Authorization & Role-Based Access:**
   - [ ] Warehouse Manager: Own warehouse only
   - [ ] Accountant: All warehouses (read-only)
   - [ ] Admin: Full access
   - [ ] Other roles: 403 Forbidden

4. **Performance & Caching:**
   - [ ] Recent movements: Return 10 items only (paginate if needed)
   - [ ] Low stock alerts: No pagination (assume <500 products)
   - [ ] Cache TTL: 2 minutes (warehouse changes frequently)
   - [ ] API timeout: 8 seconds maximum
   - [ ] Max records returned: 100 total per dashboard call

5. **Real-Time Data Updates:**
   - [ ] Auto-refresh every 10 seconds
   - [ ] Push notifications for critical alerts (low stock, arrivals)
   - [ ] WebSocket connection for live stock movements
   - [ ] Fallback to polling (5-second intervals) if WebSocket unavailable
   - [ ] Show "Last updated at" timestamp

6. **Error Handling:**
   - [ ] Handle missing warehouse associations (default 'Unknown')
   - [ ] Log PO status mismatches
   - [ ] Return 206 Partial Content if some data missing
   - [ ] Display warning badges for problematic records
   - [ ] Catch calculation errors: Show affected metric as 'N/A'

---

## Dev Notes

```typescript
interface WarehouseDashboardMetrics {
  totalItems: number;
  stockValueByCategory: Array<{ category: string; value: number }>;
  recentMovements: Array<{
    date: Date;
    product: string;
    type: string;
    quantity: number;
    user: string;
  }>;
  lowStockAlerts: Array<{
    productId: string;
    productName: string;
    currentQty: number;
    reorderLevel: number;
  }>;
  outOfStock: Array<{ productId: string; productName: string }>;
  pendingReceipts: number;
}

async function getWarehouseDashboard(): Promise<WarehouseDashboardMetrics> {
  // Total items in stock
  const totalItems = await prisma.product.count({
    where: {
      inventory: {
        some: { quantity: { gt: 0 } }
      }
    }
  });

  // Stock value by category
  const products = await prisma.product.findMany({
    include: { inventory: true }
  });
  const categoryValue = products.reduce((acc, product) => {
    const totalQty = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    const avgCost = product.inventory.reduce((sum, inv) =>
      sum + (inv.quantity * parseFloat(inv.unitCost.toString())), 0
    ) / totalQty || 0;

    if (!acc[product.category || 'UNCATEGORIZED']) {
      acc[product.category || 'UNCATEGORIZED'] = 0;
    }
    acc[product.category || 'UNCATEGORIZED'] += totalQty * avgCost;
    return acc;
  }, {} as Record<string, number>);

  // Recent movements
  const recentMovements = await prisma.stockMovement.findMany({
    take: 10,
    orderBy: { movementDate: 'desc' },
    include: { product: true, user: true }
  });

  // Low stock and out of stock
  const lowStockAlerts: any[] = [];
  const outOfStock: any[] = [];

  products.forEach(product => {
    const totalQty = product.inventory.reduce((sum, inv) => sum + inv.quantity, 0);
    if (totalQty === 0) {
      outOfStock.push({ productId: product.id, productName: product.name });
    } else if (totalQty <= product.reorderLevel) {
      lowStockAlerts.push({
        productId: product.id,
        productName: product.name,
        currentQty: totalQty,
        reorderLevel: product.reorderLevel
      });
    }
  });

  // Pending receipts
  const pendingReceipts = await prisma.purchaseOrder.count({
    where: { status: 'IN_TRANSIT' }
  });

  return {
    totalItems,
    stockValueByCategory: Object.entries(categoryValue).map(([category, value]) => ({
      category,
      value
    })),
    recentMovements: recentMovements.map(m => ({
      date: m.movementDate,
      product: m.product.name,
      type: m.movementType,
      quantity: m.quantity,
      user: m.user.name
    })),
    lowStockAlerts,
    outOfStock,
    pendingReceipts
  };
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
