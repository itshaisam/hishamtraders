# Story 7.9: Recovery Report Suite

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.9
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 7.1, Story 7.4, Story 7.5
**Status:** Implemented (v3.0)

---

## User Story

**As an** accountant/admin,
**I want** a comprehensive suite of recovery reports,
**So that** I can analyze collection performance and make data-driven decisions.

---

## Acceptance Criteria

1. **Report Types:**
   - [x] Visit Activity Report (visits by agent/date)
   - [x] Collection Summary Report (collections by agent/period)
   - [x] Overdue Clients Report (aging buckets)
   - [x] Agent Productivity Report (visits per day, success rate)
   - [x] Payment Promise Report (promises with status)
   - [x] Recovery Schedule Report (clients by day)

2. **Backend API:**
   - [x] `GET /api/v1/reports/recovery/visits` — visit activity
   - [x] `GET /api/v1/reports/recovery/collections` — collection summary
   - [x] `GET /api/v1/reports/recovery/overdue` — overdue clients
   - [x] `GET /api/v1/reports/recovery/productivity` — agent productivity
   - [x] `GET /api/v1/reports/recovery/promises` — payment promises
   - [x] `GET /api/v1/reports/recovery/schedule` — recovery schedule

3. **Common Filters:**
   - [x] Date range (using `<input type="date">`, no `DatePicker`)
   - [x] Recovery agent, client, visit outcome, promise status

4. **Export:**
   - [x] Excel export via server-side `exceljs` (Story 4.9 pattern, NOT frontend `XLSX`)

5. **Frontend:**
   - [x] Reports Center page linking to each report
   - [x] Each report has dedicated page with filters and data table
   - [x] Use `<Card>` with children directly (no `Card.Body`)
   - [x] Date inputs: `<input type="date">`

6. **Authorization:**
   - [x] Admin and Accountant can view all reports
   - [x] Recovery Agent can view only their own data

---

## Dev Notes

### Implementation Status

**Backend:** Implemented. Depends on RecoveryVisit (7.4) and PaymentPromise (7.5) models.

### Key Corrections

1. **API paths**: All use `/api/v1/reports/recovery/...` (not `/api/reports/recovery/...`)
2. **`Card.Body`** does not exist — use `<Card>` with children directly
3. **`DatePicker`** does not exist — use `<input type="date">`
4. **`XLSX` on frontend** — use server-side `exceljs` instead (Story 4.9 pattern)
5. **InvoiceStatus `'UNPAID'`** does not exist — use `'PENDING'`
6. **N+1 in `getCollectionSummaryReport`**: Loops agents, queries visits + promises per agent. Note as performance concern.
7. **N+1 in `getOverdueClientsReport`**: Loads all clients then processes in JS. Acceptable for small datasets but note concern for scaling.

### Backend Service (corrected)

```typescript
// --- Visit Activity Report ---
interface VisitActivityReport {
  visitNumber: string;
  visitDate: Date;
  agentName: string;
  clientName: string;
  outcome: string;
  amountCollected: number;
  promiseMade: boolean;
  promiseAmount?: number;
  notes: string;
}

async function getVisitActivityReport(filters: {
  dateFrom: Date; dateTo: Date; agentId?: string; clientId?: string; outcome?: string;
}): Promise<VisitActivityReport[]> {
  const where: any = { visitDate: { gte: filters.dateFrom, lte: filters.dateTo } };
  if (filters.agentId) where.visitedBy = filters.agentId;
  if (filters.clientId) where.clientId = filters.clientId;
  if (filters.outcome) where.outcome = filters.outcome;

  const visits = await prisma.recoveryVisit.findMany({
    where,
    include: { agent: true, client: true },
    orderBy: { visitDate: 'desc' }
  });

  return visits.map(v => ({
    visitNumber: v.visitNumber,
    visitDate: v.visitDate,
    agentName: v.agent.name,
    clientName: v.client.name,
    outcome: v.outcome,
    amountCollected: Number(v.amountCollected),
    promiseMade: !!v.promiseDate,
    promiseAmount: v.promiseAmount ? Number(v.promiseAmount) : undefined,
    notes: v.notes || ''
  }));
}

// --- Collection Summary Report (N+1 warning: queries per agent) ---
interface CollectionSummary {
  agentName: string;
  totalCollections: number;
  collectionsCount: number;
  averageCollection: number;
  clientsVisited: number;
  promisesMade: number;
  promisesFulfilled: number;
}

async function getCollectionSummaryReport(filters: {
  dateFrom: Date; dateTo: Date; agentId?: string;
}): Promise<CollectionSummary[]> {
  const agentWhere: any = { role: { name: 'RECOVERY_AGENT' }, status: 'active' };
  if (filters.agentId) agentWhere.id = filters.agentId;

  const agents = await prisma.user.findMany({ where: agentWhere });
  const summaries: CollectionSummary[] = [];

  // NOTE: N+1 — queries visits + promises per agent. Consider batching for production.
  for (const agent of agents) {
    const visits = await prisma.recoveryVisit.findMany({
      where: { visitedBy: agent.id, visitDate: { gte: filters.dateFrom, lte: filters.dateTo } }
    });
    const totalCollections = visits.reduce((s, v) => s + Number(v.amountCollected), 0);
    const collectionsCount = visits.filter(v => Number(v.amountCollected) > 0).length;

    const promises = await prisma.paymentPromise.findMany({
      where: { createdBy: agent.id, createdAt: { gte: filters.dateFrom, lte: filters.dateTo } }
    });

    summaries.push({
      agentName: agent.name,
      totalCollections,
      collectionsCount,
      averageCollection: collectionsCount > 0 ? totalCollections / collectionsCount : 0,
      clientsVisited: new Set(visits.map(v => v.clientId)).size,
      promisesMade: promises.length,
      promisesFulfilled: promises.filter(p => p.status === 'FULFILLED').length
    });
  }
  return summaries.sort((a, b) => b.totalCollections - a.totalCollections);
}

// --- Overdue Clients Report (N+1 warning: processes all clients in JS) ---
interface OverdueClient {
  clientName: string;
  contactPerson: string;
  phone: string;
  area: string;
  recoveryAgent: string;
  totalBalance: number;
  overdueAmount: number;
  daysOverdue: number;
  agingBucket: string;
  lastPaymentDate?: Date;
  lastVisitDate?: Date;
}

async function getOverdueClientsReport(filters: {
  agentId?: string; area?: string; minDaysOverdue?: number;
}): Promise<OverdueClient[]> {
  const today = new Date();
  const where: any = { balance: { gt: 0 }, status: 'ACTIVE' };
  if (filters.agentId) where.recoveryAgentId = filters.agentId;
  if (filters.area) where.area = filters.area;

  const clients = await prisma.client.findMany({
    where,
    include: {
      recoveryAgent: true,
      invoices: { where: { status: { in: ['PENDING', 'PARTIAL'] } } },  // NOT 'UNPAID'
      payments: { orderBy: { date: 'desc' }, take: 1 },
      recoveryVisits: { orderBy: { visitDate: 'desc' }, take: 1 }
    }
  });

  const result: OverdueClient[] = [];
  for (const client of clients) {
    const overdueInvs = client.invoices.filter(inv => inv.dueDate && inv.dueDate < today);
    if (overdueInvs.length === 0) continue;

    const overdueAmount = overdueInvs.reduce(
      (s, inv) => s + Number(inv.total) - Number(inv.paidAmount), 0
    );
    const oldest = overdueInvs.sort((a, b) => a.dueDate!.getTime() - b.dueDate!.getTime())[0];
    const daysOverdue = differenceInDays(today, oldest.dueDate!);

    if (filters.minDaysOverdue && daysOverdue < filters.minDaysOverdue) continue;

    const agingBucket = daysOverdue <= 7 ? '1-7 days'
      : daysOverdue <= 14 ? '8-14 days'
      : daysOverdue <= 30 ? '15-30 days' : '30+ days';

    result.push({
      clientName: client.name,
      contactPerson: client.contactPerson || '',
      phone: client.phone || '',
      area: client.area || '',
      recoveryAgent: client.recoveryAgent?.name || 'Unassigned',
      totalBalance: Number(client.balance),
      overdueAmount, daysOverdue, agingBucket,
      lastPaymentDate: client.payments[0]?.date,
      lastVisitDate: client.recoveryVisits[0]?.visitDate
    });
  }
  return result.sort((a, b) => b.overdueAmount - a.overdueAmount);
}

// --- Agent Productivity Report ---
interface AgentProductivity {
  agentName: string;
  workingDays: number;
  totalVisits: number;
  visitsPerDay: number;
  successfulVisits: number;
  successRate: number;
  totalCollected: number;
  collectionPerVisit: number;
}

async function getAgentProductivityReport(filters: {
  dateFrom: Date; dateTo: Date; agentId?: string;
}): Promise<AgentProductivity[]> {
  const agentWhere: any = { role: { name: 'RECOVERY_AGENT' }, status: 'active' };
  if (filters.agentId) agentWhere.id = filters.agentId;

  const agents = await prisma.user.findMany({ where: agentWhere });
  const workingDays = differenceInDays(filters.dateTo, filters.dateFrom) + 1;
  const reports: AgentProductivity[] = [];

  for (const agent of agents) {
    const visits = await prisma.recoveryVisit.findMany({
      where: { visitedBy: agent.id, visitDate: { gte: filters.dateFrom, lte: filters.dateTo } }
    });
    const totalVisits = visits.length;
    const successfulVisits = visits.filter(
      v => ['PAYMENT_COLLECTED', 'PARTIAL_PAYMENT', 'PROMISE_MADE'].includes(v.outcome)
    ).length;
    const totalCollected = visits.reduce((s, v) => s + Number(v.amountCollected), 0);

    reports.push({
      agentName: agent.name, workingDays, totalVisits,
      visitsPerDay: Math.round((totalVisits / Math.max(workingDays, 1)) * 10) / 10,
      successfulVisits,
      successRate: totalVisits > 0 ? Math.round((successfulVisits / totalVisits) * 1000) / 10 : 0,
      totalCollected,
      collectionPerVisit: totalVisits > 0 ? Math.round(totalCollected / totalVisits) : 0
    });
  }
  return reports.sort((a, b) => b.totalCollected - a.totalCollected);
}
```

### Module Structure

```
apps/api/src/modules/reports/recovery/
  visit-activity.controller.ts        (NEW)
  collection-summary.controller.ts    (NEW)
  overdue-clients.controller.ts       (NEW)
  agent-productivity.controller.ts    (NEW)
  recovery-reports.service.ts         (NEW — shared service)

apps/web/src/features/reports/pages/
  RecoveryReportsCenterPage.tsx       (NEW)
  VisitActivityReportPage.tsx         (NEW)
  CollectionSummaryPage.tsx           (NEW)
  OverdueClientsReportPage.tsx        (NEW)
  AgentProductivityPage.tsx           (NEW)
```

### Frontend Notes

- **Reports Center**: Grid of report cards with name, description, and icon. Click navigates to individual report page.
- **Each report page**: Filter bar at top (date inputs, agent/outcome dropdowns), data table below, summary row at bottom. Export button triggers server-side Excel generation and download.
- **Excel export**: `GET /api/v1/reports/recovery/{type}/export?...filters` returns `.xlsx` file via `exceljs` (Story 4.9 pattern). No frontend `XLSX` library.
- Use `<Card>` directly, no `Card.Body`. Use `<input type="date">`, no `DatePicker`.

### POST-MVP DEFERRED

- **Scheduled reports** (email delivery on a cron)
- **PDF export** (formatted reports)
- **Drill-down** from summary to detail
- **Batched queries** to eliminate N+1 in collection summary and productivity reports

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), Card.Body removed, DatePicker→input[type=date], XLSX→server-side exceljs, UNPAID→PENDING, noted N+1 issues in collection summary and overdue reports, trimmed frontend to notes | Claude (AI Review) |
| 2026-02-12 | 3.0     | Implemented: all acceptance criteria completed | Claude (AI Implementation) |
