# Story 7.10: Recovery Dashboard Enhancements

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.10
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** All previous Epic 7 stories (7.1-7.9), especially Story 7.6 (Alert model)
**Status:** Implemented (v3.0)

---

## User Story

**As a** recovery agent/admin,
**I want** a comprehensive recovery dashboard with key metrics and actionable insights,
**So that** I can quickly assess recovery status and prioritize my work.

---

## Acceptance Criteria

1. **Dashboard Widgets:**
   - [x] Today's Schedule (clients to visit based on recoveryDay)
   - [x] Due Promises (promises due today or overdue)
   - [x] Collection Metrics (today / this week / this month)
   - [x] Overdue Summary (total amount by aging buckets)
   - [x] Recent Visits (last 5 visits)
   - [x] Alert Summary (unacknowledged alerts count + critical count)
   - [x] Promise Fulfillment Rate (last 30 days)
   - [x] Top 5 Overdue Clients

2. **Backend API:**
   - [x] `GET /api/v1/dashboard/recovery` — returns all dashboard data in one response
   - [x] Role-scoped: Recovery Agent sees only their data; Admin sees all

3. **Interactive Features:**
   - [x] Click widget to navigate to detail page
   - [x] Quick actions: Log Visit, Record Payment, View Client
   - [x] Auto-refresh every 5 minutes, manual refresh button

4. **Frontend:**
   - [x] Recovery Dashboard page with widget-based grid layout
   - [x] Overdue summary pie chart via `recharts` (external dependency — must install)
   - [x] Use `<Card>` with children directly (no `Card.Body`)
   - [x] Responsive grid for mobile

5. **Authorization:**
   - [x] Recovery Agent: only their assigned clients and data
   - [x] Admin/Accountant: organization-wide metrics

---

## Dev Notes

### Implementation Status

**Backend:** Implemented. This is the final "glue" story — aggregates data from earlier Epic 7 stories' models.

### Key Corrections

1. **API path**: `GET /api/v1/dashboard/recovery` (not `/api/dashboard/recovery`)
2. **`Card.Body`** does not exist — use `<Card>` with children directly
3. **`recharts`**: External dependency, must be installed
4. **InvoiceStatus `'UNPAID'`** does not exist — use `'PENDING'`
5. **`prisma.alert`**: Depends on Story 7.6 which defines the Alert model. Must implement 7.6 first.
6. **Performance concern**: The dashboard service issues many queries (schedule, promises, 3x payments, clients with invoices, visits, alerts, fulfillment). Consider caching responses or combining queries where possible.
7. **`format(today, 'EEEE').toUpperCase()`**: Gives English day names (e.g., "MONDAY"). This works with the `RecoveryDay` enum but note locale dependency — always use English locale for date-fns `format`.

### Response Interface

```typescript
interface RecoveryDashboardData {
  todaysSchedule: {
    totalClients: number;
    totalOutstanding: number;
    clients: Array<{
      clientId: string; clientName: string; phone: string;
      overdueAmount: number; daysOverdue: number;
    }>;
  };
  duePromises: {
    totalPromises: number; totalAmount: number; overduePromises: number;
    promises: Array<{
      promiseId: string; clientName: string;
      promiseAmount: number; promiseDate: Date; isOverdue: boolean;
    }>;
  };
  collectionMetrics: { today: number; thisWeek: number; thisMonth: number };
  overdueSummary: {
    total: number;
    buckets: { days1to7: number; days8to14: number; days15to30: number; days30plus: number };
  };
  recentVisits: Array<{
    visitNumber: string; clientName: string; visitDate: Date;
    outcome: string; amountCollected: number;
  }>;
  alerts: { totalUnacknowledged: number; criticalCount: number };
  promiseFulfillmentRate: number;
  topOverdueClients: Array<{
    clientId: string; clientName: string; overdueAmount: number; daysOverdue: number;
  }>;
}
```

### Key Backend Logic (corrected)

```typescript
async function getRecoveryDashboard(
  userId: string, role: string
): Promise<RecoveryDashboardData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  const clientWhere: any = { status: 'ACTIVE' };
  if (role === 'RECOVERY_AGENT') clientWhere.recoveryAgentId = userId;

  // --- Today's Schedule ---
  // Note: format(today, 'EEEE') returns English day name. Use { locale: enUS } if needed.
  const dayOfWeek = format(today, 'EEEE').toUpperCase() as RecoveryDay;
  const todaysClients = await prisma.client.findMany({
    where: { ...clientWhere, recoveryDay: dayOfWeek, balance: { gt: 0 } },
    include: {
      invoices: {
        where: { status: { in: ['PENDING', 'PARTIAL'] }, dueDate: { lt: endOfToday } }  // NOT 'UNPAID'
      }
    },
    take: 10, orderBy: { balance: 'desc' }
  });

  // --- Due Promises ---
  const promiseWhere: any = { status: 'PENDING', promiseDate: { lte: endOfToday } };
  if (role === 'RECOVERY_AGENT') promiseWhere.createdBy = userId;
  const duePromises = await prisma.paymentPromise.findMany({
    where: promiseWhere, include: { client: true },
    orderBy: { promiseDate: 'asc' }, take: 10
  });

  // --- Collection Metrics (today / week / month) ---
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());
  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const paymentWhere: any = {};
  if (role === 'RECOVERY_AGENT') paymentWhere.client = { recoveryAgentId: userId };

  const [todayPay, weekPay, monthPay] = await Promise.all([
    prisma.payment.findMany({ where: { ...paymentWhere, date: { gte: today, lte: endOfToday } } }),
    prisma.payment.findMany({ where: { ...paymentWhere, date: { gte: startOfWeek, lte: endOfToday } } }),
    prisma.payment.findMany({ where: { ...paymentWhere, date: { gte: startOfMonth, lte: endOfToday } } }),
  ]);

  // --- Overdue Summary (by aging buckets) ---
  const allClients = await prisma.client.findMany({
    where: clientWhere,
    include: { invoices: { where: { status: { in: ['PENDING', 'PARTIAL'] } } } }  // NOT 'UNPAID'
  });

  const overdueSummary = { total: 0, buckets: { days1to7: 0, days8to14: 0, days15to30: 0, days30plus: 0 } };
  for (const client of allClients) {
    for (const inv of client.invoices) {
      if (!inv.dueDate || inv.dueDate >= today) continue;
      const d = differenceInDays(today, inv.dueDate);
      const amt = Number(inv.total) - Number(inv.paidAmount);
      overdueSummary.total += amt;
      if (d <= 7) overdueSummary.buckets.days1to7 += amt;
      else if (d <= 14) overdueSummary.buckets.days8to14 += amt;
      else if (d <= 30) overdueSummary.buckets.days15to30 += amt;
      else overdueSummary.buckets.days30plus += amt;
    }
  }

  // --- Recent Visits ---
  const visitWhere: any = {};
  if (role === 'RECOVERY_AGENT') visitWhere.visitedBy = userId;
  const recentVisits = await prisma.recoveryVisit.findMany({
    where: visitWhere, include: { client: true },
    orderBy: { visitDate: 'desc' }, take: 5
  });

  // --- Alerts (depends on Story 7.6 Alert model) ---
  const alertWhere: any = { acknowledged: false };
  if (role === 'RECOVERY_AGENT') alertWhere.targetUserId = userId;
  const alerts = await prisma.alert.findMany({ where: alertWhere });

  // --- Promise Fulfillment Rate (last 30 days) ---
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);
  const fulfillWhere: any = {
    promiseDate: { gte: thirtyDaysAgo, lte: endOfToday },
    status: { in: ['FULFILLED', 'PARTIAL', 'BROKEN'] }
  };
  if (role === 'RECOVERY_AGENT') fulfillWhere.createdBy = userId;
  const promises = await prisma.paymentPromise.findMany({ where: fulfillWhere });
  const fulfilled = promises.filter(p => p.status === 'FULFILLED').length;
  const partial = promises.filter(p => p.status === 'PARTIAL').length;
  const rate = promises.length > 0 ? ((fulfilled + partial * 0.5) / promises.length) * 100 : 0;

  // --- Top 5 Overdue Clients ---
  const topOverdue = allClients
    .map(c => {
      const overdue = c.invoices.filter(inv => inv.dueDate && inv.dueDate < today);
      const amt = overdue.reduce((s, inv) => s + Number(inv.total) - Number(inv.paidAmount), 0);
      const days = overdue.length > 0
        ? Math.max(...overdue.map(inv => differenceInDays(today, inv.dueDate!))) : 0;
      return { clientId: c.id, clientName: c.name, overdueAmount: amt, daysOverdue: days };
    })
    .filter(c => c.overdueAmount > 0)
    .sort((a, b) => b.overdueAmount - a.overdueAmount)
    .slice(0, 5);

  // Assemble response (mapping omitted for brevity — see interface above)
  return { todaysSchedule: { /* ... */ }, duePromises: { /* ... */ },
    collectionMetrics: { today: sum(todayPay), thisWeek: sum(weekPay), thisMonth: sum(monthPay) },
    overdueSummary, recentVisits: recentVisits.map(/* ... */),
    alerts: { totalUnacknowledged: alerts.length, criticalCount: alerts.filter(a => a.priority === 'CRITICAL').length },
    promiseFulfillmentRate: Math.round(rate * 10) / 10,
    topOverdueClients: topOverdue
  };
}
```

### Module Structure

```
apps/api/src/modules/dashboard/
  recovery-dashboard.controller.ts    (NEW)
  recovery-dashboard.service.ts       (NEW)

apps/web/src/features/dashboard/pages/
  RecoveryDashboardPage.tsx           (NEW)
```

### Frontend Notes

- **Layout**: 3-column grid for collection metrics (today/week/month). 2-column grid for Today's Schedule + Due Promises. 3-column grid for Overdue Summary (pie chart via `recharts`), Promise Fulfillment (progress bar), Alerts summary. 2-column grid for Top Overdue Clients table + Recent Visits list.
- **Quick actions**: "Log Visit" and "Call" buttons on each scheduled client. "Record Payment" on due promises.
- **Auto-refresh**: `refetchInterval: 5 * 60 * 1000` on React Query. Manual refresh button with "Last updated" timestamp.
- **Navigation**: Click any widget to go to its detail page (e.g., click alerts widget to go to `/alerts`).
- Use `<Card>` directly (no `Card.Body`). `recharts` for PieChart in overdue summary.

### POST-MVP DEFERRED

- **Drag-and-drop widget layout** (Phase 3)
- **Caching** dashboard response (Redis or in-memory, TTL ~1 min) to reduce query load
- **Swipeable widgets** for mobile
- **Locale-aware day names** (currently assumes English)

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API path (/api/v1/), Card.Body removed, UNPAID→PENDING, noted dependency on Story 7.6 for Alert model, recharts as external dep, noted performance concern with many queries, noted English locale for day names, trimmed frontend to notes | Claude (AI Review) |
| 2026-02-12 | 3.0     | Implemented: all acceptance criteria completed | Claude (AI Implementation) |
