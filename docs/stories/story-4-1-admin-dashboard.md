# Story 4.1: Admin Dashboard

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.1
**Priority:** Critical
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 1, Epic 2, Epic 3
**Status:** Draft

---

## User Story

**As an** admin,
**I want** a comprehensive dashboard showing overall business health,
**So that** I can monitor key metrics and make informed decisions.

---

## Acceptance Criteria

1. **Backend API — Admin Metrics:**
   - [ ] `GET /api/v1/admin/stats` returns comprehensive metrics (expand existing endpoint)
   - [ ] Total stock value: `SUM(inventory.quantity * product.costPrice)` joined across products
   - [ ] Today's revenue: invoices created today, excluding `VOIDED`
   - [ ] Month's revenue: invoices this month, excluding `VOIDED`
   - [ ] Total receivables: `SUM(client.balance)` where balance > 0
   - [ ] Total payables: PO `totalAmount` minus supplier payments (queried via `Payment` where `paymentReferenceType = PO`)
   - [ ] Low stock product count (total inventory qty <= `product.reorderLevel`)
   - [ ] Out of stock product count (total inventory qty == 0)
   - [ ] Pending containers: POs with status `IN_TRANSIT`
   - [ ] Top 5 products by revenue (this month)
   - [ ] Recent audit activity (last 10 `AuditLog` entries)
   - [ ] Revenue trend (last 30 days, daily totals)

2. **Frontend Dashboard Display:**
   - [ ] Metric cards: stock value, today's revenue, month's revenue, receivables, payables
   - [ ] Revenue line chart (last 30 days) — install `recharts`
   - [ ] Top products table (name, qty sold, revenue)
   - [ ] Low/out of stock alerts widget
   - [ ] Pending containers count
   - [ ] Recent activity widget (from `AuditLog`)
   - [ ] Quick action buttons: New PO, New Invoice, New Product
   - [ ] Empty state handling when no data exists

3. **Authorization:**
   - [ ] Only `ADMIN` role can access (existing `requireRole(['ADMIN'])` on route)
   - [ ] Return 403 for all other roles

4. **Performance:**
   - [ ] TanStack Query with `staleTime: 300000` (5 min) and `refetchInterval: 30000` (30s auto-refresh)
   - [ ] Use `Promise.all()` for parallel DB queries in the service
   - [ ] "Last updated" timestamp displayed on dashboard

---

## Dev Notes

### Implementation Status

**Backend:** Scaffold exists at `apps/api/src/services/dashboard.service.ts` — `getAdminStats()` currently returns only `totalUsers`, `auditLogCount`, `dbConnected`. Needs expansion.

**Frontend:** Admin dashboard exists at `apps/web/src/components/dashboards/AdminDashboard.tsx` with tabs for all role views. Overview tab shows basic metric cards with "Coming soon" placeholders. Needs replacement with real metrics.

**Route:** Already registered at `GET /api/v1/admin/stats` via `apps/api/src/routes/dashboard.routes.ts`

### Existing Code to Reuse/Expand

| What | Where |
|------|-------|
| Dashboard service (expand) | `apps/api/src/services/dashboard.service.ts` |
| Dashboard controller | `apps/api/src/controllers/dashboard.controller.ts` |
| Dashboard routes | `apps/api/src/routes/dashboard.routes.ts` |
| Admin dashboard UI (expand) | `apps/web/src/components/dashboards/AdminDashboard.tsx` |
| Dashboard router (role switch) | `apps/web/src/components/DashboardRouter.tsx` |
| Prisma singleton | `apps/api/src/lib/prisma.ts` — already used by dashboard service |

### Schema Field Reference (Correct Names)

```
Inventory: id, productId, productVariantId, warehouseId, quantity, batchNo, binLocation
           (NO unitCost field — use Product.costPrice instead)

Product:   id, sku, name, categoryId, costPrice, sellingPrice, reorderLevel, status
           category → ProductCategory relation (use .category.name for grouping)
           inventory → Inventory[] relation

PurchaseOrder: id, poNumber, supplierId, status (POStatus), totalAmount (NOT totalCost)
               NO payments relation — query Payment WHERE referenceType=PO AND referenceId=po.id

AuditLog:  id, userId, action, entityType (NOT resource), entityId, timestamp (NOT createdAt)
           user → User relation

Invoice:   status uses InvoiceStatus: PENDING, PARTIAL, PAID, OVERDUE, CANCELLED, VOIDED
           (NO "UNPAID" status)

Client:    balance (Decimal) — positive = owes money, negative/zero = credit
```

### Key Metric Calculations

#### Stock Value (Correct)
```typescript
// JOIN inventory with product to get cost
const inventoryWithCost = await prisma.inventory.findMany({
  where: { quantity: { gt: 0 } },
  include: { product: { select: { costPrice: true } } }
});
const stockValue = inventoryWithCost.reduce(
  (sum, inv) => sum + inv.quantity * parseFloat(inv.product.costPrice.toString()), 0
);
```

#### Total Payables (Correct — no PO.payments relation)
```typescript
// POs that are not cancelled
const pos = await prisma.purchaseOrder.findMany({
  where: { status: { not: 'CANCELLED' } },
  select: { id: true, totalAmount: true }
});
// Get all supplier payments linked to POs
const poPaidAmounts = await prisma.payment.groupBy({
  by: ['referenceId'],
  where: { paymentType: 'SUPPLIER', paymentReferenceType: 'PO', referenceId: { in: pos.map(p => p.id) } },
  _sum: { amount: true },
});
// Calculate outstanding per PO
const totalPayables = pos.reduce((sum, po) => {
  const paid = poPaidAmounts.find(p => p.referenceId === po.id)?._sum.amount || 0;
  return sum + parseFloat(po.totalAmount.toString()) - parseFloat(paid.toString());
}, 0);
```

#### Recent Activity (Correct field names)
```typescript
const recentActivity = await prisma.auditLog.findMany({
  take: 10,
  orderBy: { timestamp: 'desc' },  // NOT createdAt
  include: { user: { select: { name: true } } }
});
// Map: log.entityType (NOT log.resource), log.timestamp, log.user.name
```

### POST-MVP DEFERRED

- **WebSocket live updates**: Use TanStack Query refetchInterval instead
- **Partial data with 202 status**: Just return 200 with nulls for failed metrics
- **Revenue trend chart library**: Can be deferred if basic metric cards are sufficient for first release
- **Cache invalidation triggers**: TanStack Query staleTime handles this adequately
