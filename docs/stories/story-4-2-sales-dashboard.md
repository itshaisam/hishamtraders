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
**So that** I can track my sales targets and overdue clients.

---

## Acceptance Criteria

1. **Backend API:**
   - [ ] GET /api/dashboard/sales returns sales metrics
   - [ ] Today's sales (count and total value)
   - [ ] Week's sales (count and total value)
   - [ ] Month's sales (count and total value)
   - [ ] Top 5 clients by revenue (this month)
   - [ ] Overdue invoices count and total amount
   - [ ] Clients approaching credit limit (>80% utilization)
   - [ ] Weekly sales trend (last 7 days)

2. **Frontend Dashboard:**
   - [ ] Sales performance cards (today, week, month)
   - [ ] Weekly sales trend chart
   - [ ] Top clients table
   - [ ] Overdue clients list with color-coding
   - [ ] Credit limit alerts widget
   - [ ] Quick actions: Create Invoice, Record Payment

3. **Authorization & Role-Based Access:**
   - [ ] Sales Officer: Own sales data only (filtered by assigned territory/region)
   - [ ] Accountant: View all sales data
   - [ ] Admin: Full access
   - [ ] Other roles: 403 Forbidden

4. **Performance & Caching:**
   - [ ] Max 50 records for top clients/overdue lists
   - [ ] Weekly trend: return all 7 days (no pagination needed)
   - [ ] Cache TTL: 3 minutes (more frequent updates than admin dashboard)
   - [ ] API timeout: 8 seconds maximum
   - [ ] Pagination: 10 items default for lists

5. **Real-Time Data Updates:**
   - [ ] Auto-refresh every 15 seconds during business hours
   - [ ] Manual refresh button available
   - [ ] Show "Last updated at" timestamp
   - [ ] Pause auto-updates after hours (optional)
   - [ ] Network error: Show cached data with warning

6. **Error Handling:**
   - [ ] Catch and log failures in trend calculation
   - [ ] Return HTTP 400 with error details if filters invalid
   - [ ] Validate date range (from <= to, max 1 year)
   - [ ] Display partial data with error toast if calculation fails

---

## Dev Notes

```typescript
interface SalesDashboardMetrics {
  todaySales: { count: number; total: number };
  weekSales: { count: number; total: number };
  monthSales: { count: number; total: number };
  topClients: Array<{ id: string; name: string; revenue: number }>;
  overdueInvoices: { count: number; total: number };
  creditLimitAlerts: Array<{ clientId: string; clientName: string; utilization: number }>;
  weeklyTrend: Array<{ date: string; sales: number }>;
}

async function getSalesDashboard(): Promise<SalesDashboardMetrics> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const weekAgo = new Date(today);
  weekAgo.setDate(weekAgo.getDate() - 7);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);

  // Today's sales
  const todayInvoices = await prisma.invoice.findMany({
    where: { invoiceDate: { gte: today }, status: { not: 'VOIDED' } }
  });
  const todaySales = {
    count: todayInvoices.length,
    total: todayInvoices.reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)
  };

  // Week's sales
  const weekInvoices = await prisma.invoice.findMany({
    where: { invoiceDate: { gte: weekAgo }, status: { not: 'VOIDED' } }
  });
  const weekSales = {
    count: weekInvoices.length,
    total: weekInvoices.reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)
  };

  // Month's sales
  const monthInvoices = await prisma.invoice.findMany({
    where: { invoiceDate: { gte: monthStart }, status: { not: 'VOIDED' } }
  });
  const monthSales = {
    count: monthInvoices.length,
    total: monthInvoices.reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)
  };

  // Top clients by revenue (this month)
  const clientRevenue = monthInvoices.reduce((acc, inv) => {
    if (!acc[inv.clientId]) {
      acc[inv.clientId] = 0;
    }
    acc[inv.clientId] += parseFloat(inv.total.toString());
    return acc;
  }, {} as Record<string, number>);

  const topClientIds = Object.entries(clientRevenue)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([id]) => id);

  const topClients = await prisma.client.findMany({
    where: { id: { in: topClientIds } }
  });

  // Overdue invoices
  const overdueInvoices = await prisma.invoice.findMany({
    where: {
      status: { in: ['UNPAID', 'PARTIAL'] },
      dueDate: { lt: today }
    }
  });

  // Credit limit alerts (>80%)
  const clients = await prisma.client.findMany({
    where: { status: 'ACTIVE' }
  });
  const creditLimitAlerts = clients
    .filter(c => {
      const balance = parseFloat(c.balance.toString());
      const limit = parseFloat(c.creditLimit.toString());
      return limit > 0 && (balance / limit) > 0.8;
    })
    .map(c => ({
      clientId: c.id,
      clientName: c.name,
      utilization: (parseFloat(c.balance.toString()) / parseFloat(c.creditLimit.toString())) * 100
    }));

  return {
    todaySales,
    weekSales,
    monthSales,
    topClients: topClients.map(c => ({
      id: c.id,
      name: c.name,
      revenue: clientRevenue[c.id]
    })),
    overdueInvoices: {
      count: overdueInvoices.length,
      total: overdueInvoices.reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)
    },
    creditLimitAlerts,
    weeklyTrend: [] // Calculate daily sales for last 7 days
  };
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
