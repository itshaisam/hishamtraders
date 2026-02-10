# Story 4.2: Sales Dashboard

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.2
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 3 (Sales & Payments)
**Status:** Draft

---

## User Story

**As a** sales officer,
**I want** a sales-focused dashboard showing performance metrics,
**So that** I can track sales activity and monitor overdue clients.

---

## Acceptance Criteria

1. **Backend API:**
   - [ ] `GET /api/v1/sales/stats` returns sales metrics (expand existing endpoint)
   - [ ] Today's sales: count and total value (invoices today, excluding `VOIDED`)
   - [ ] Week's sales: count and total (last 7 days)
   - [ ] Month's sales: count and total (current month)
   - [ ] Top 5 clients by revenue (this month)
   - [ ] Overdue invoices: count and total (`status IN ('PENDING', 'PARTIAL') AND dueDate < today`)
   - [ ] Clients approaching credit limit (balance/creditLimit > 80%)
   - [ ] Weekly sales trend (last 7 days, daily totals)

2. **Frontend Dashboard:**
   - [ ] Sales performance cards (today, week, month — count + value)
   - [ ] Weekly sales trend bar/line chart
   - [ ] Top clients table (name, revenue)
   - [ ] Overdue invoices list with aging color-coding
   - [ ] Credit limit alerts widget
   - [ ] Quick actions: Create Invoice, Record Payment
   - [ ] Empty state handling when no data

3. **Authorization:**
   - [ ] `SALES_OFFICER`: All sales data (no territory filtering — see note)
   - [ ] `ACCOUNTANT`: All sales data (read-only)
   - [ ] `ADMIN`: Full access (also available via Admin Dashboard tab)
   - [ ] Other roles: 403 Forbidden

4. **Performance:**
   - [ ] TanStack Query with `staleTime: 180000` (3 min), `refetchInterval: 60000` (1 min)
   - [ ] `Promise.all()` for parallel metric queries
   - [ ] Top clients/overdue: max 50 records

---

## Dev Notes

### Implementation Status

**Backend:** Scaffold exists at `apps/api/src/services/dashboard.service.ts` — `getSalesStats()` returns mock zeros. Needs real implementation.

**Frontend:** `apps/web/src/components/dashboards/SalesDashboard.tsx` exists (content not yet checked — likely similar scaffold).

**Route:** `GET /api/v1/sales/stats` already registered with `requireRole(['ADMIN', 'SALES_OFFICER'])`.

### Schema Field Reference

```
Invoice:  invoiceDate, total, status (PENDING | PARTIAL | PAID | OVERDUE | CANCELLED | VOIDED)
          dueDate, paidAmount, clientId
          (NO "UNPAID" status — use PENDING for unpaid invoices)

Client:   id, name, balance (Decimal), creditLimit (Decimal), status (ACTIVE | INACTIVE)
          invoices → Invoice[] relation

InvoiceItem: invoiceId, productId, quantity, unitPrice, discount, total
             product → Product relation
```

### Key Corrections from Original Doc

1. **`UNPAID` status does NOT exist** — overdue query should use:
   ```typescript
   where: {
     status: { in: ['PENDING', 'PARTIAL'] },
     dueDate: { lt: today }
   }
   ```

2. **No territory/region filtering** — The schema has no territory, region, or sales assignment concept on User or Client. For MVP, all sales officers see all sales data. Territory-based filtering is POST-MVP.

3. **API path** is `GET /api/v1/sales/stats` (not `GET /api/dashboard/sales`).

### Credit Limit Alerts Calculation
```typescript
const activeClients = await prisma.client.findMany({
  where: { status: 'ACTIVE', creditLimit: { gt: 0 } },
  select: { id: true, name: true, balance: true, creditLimit: true }
});
const alerts = activeClients
  .filter(c => {
    const utilization = parseFloat(c.balance.toString()) / parseFloat(c.creditLimit.toString());
    return utilization > 0.8;
  })
  .map(c => ({
    clientId: c.id,
    clientName: c.name,
    balance: parseFloat(c.balance.toString()),
    creditLimit: parseFloat(c.creditLimit.toString()),
    utilization: Math.round(
      (parseFloat(c.balance.toString()) / parseFloat(c.creditLimit.toString())) * 100
    ),
  }));
```

### Existing Report to Reuse
The credit limit report already exists at `apps/api/src/modules/reports/credit-limit-report.service.ts` with `getHighUtilizationClients(threshold)`. Reuse this for the alerts widget instead of re-implementing.

### POST-MVP DEFERRED

- **Territory/region filtering**: No schema support. Add when sales territories are defined.
- **Sales officer "own sales" filtering**: Would require `createdBy` tracking on invoices + user FK. Defer.
- **Auto-refresh pause after hours**: Over-engineered. Use standard refetchInterval.
- **WebSocket**: Not needed. TanStack Query polling is sufficient.
