# Story 7.8: Collection Efficiency Metrics

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.8
**Priority:** Medium
**Estimated Effort:** 5-7 hours
**Dependencies:** Epic 3 (Clients), Story 7.1
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As an** accountant,
**I want** to measure collection efficiency across the organization,
**So that** I can identify trends and improve cash flow.

---

## Acceptance Criteria

1. **Collection Efficiency Metrics:**
   - [ ] Collection Rate = (Collections / Receivables) x 100
   - [ ] DSO = (Average A/R / Daily Revenue) x Days in Period (30-day rolling default)
   - [ ] CEI = (Beginning AR + Revenue - Ending AR) / (Beginning AR + Revenue - Ending Current AR) x 100
   - [ ] Average Collection Period = avg days from invoice date to payment date
   - [ ] Overdue Percentage = (Overdue / Total Receivables) x 100

2. **Backend API:**
   - [ ] `GET /api/v1/reports/collection-efficiency` — returns all metrics
   - [ ] `GET /api/v1/reports/collection-efficiency/trend` — 12-month trend
   - [ ] Query params: `dateFrom`, `dateTo`, `recoveryAgentId`
   - [ ] Default period: current month

3. **Benchmarking:**
   - [ ] Target DSO from `prisma.systemSetting` (key: `DSO_TARGET`, default: 30)
   - [ ] Target collection rate from `prisma.systemSetting` (key: `COLLECTION_RATE_TARGET`, default: 90)
   - [ ] Show variance from target

4. **Frontend:**
   - [ ] Collection Efficiency Dashboard with KPI cards and trend indicators
   - [ ] Line chart: DSO trend; Bar chart: monthly collection rate; Pie chart: receivables distribution
   - [ ] Charts via `recharts` (external dependency — must install)
   - [ ] Use `<Card>` with children directly (no `Card.Body`)

5. **Authorization:**
   - [ ] Admin and Accountant can view all metrics
   - [ ] Recovery Agent can view team-filtered metrics

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Pure reporting — no new schema.

### Key Corrections

1. **API paths**: All use `/api/v1/` prefix
2. **`Card.Body`** does not exist — use `<Card>` with children directly
3. **`prisma.configuration`** does not exist — use `prisma.systemSetting` (model: `SystemSetting`, key is `@unique`)
4. **`recharts`**: External dependency, must be installed
5. **InvoiceStatus `'UNPAID'`** does not exist — use `'PENDING'`
6. **INFINITE RECURSION**: `getCollectionEfficiencyMetrics` called itself to get previous period trend data. This causes unbounded recursion. Fixed by adding a `skipTrend` flag.
7. **`invoice.date`**: Invoice model uses `invoiceDate` (not `date`)
8. **`getConfigValue`**: Uses `prisma.systemSetting.findUnique({ where: { key } })` (not `prisma.configuration`)

### Response Interface

```typescript
interface CollectionEfficiencyMetrics {
  period: { from: Date; to: Date };
  collectionRate: number;
  dso: number;
  cei: number;
  averageCollectionPeriod: number;
  overduePercentage: number;
  totalReceivables: number;
  totalOverdue: number;
  totalCollections: number;
  targets: { dso: number; collectionRate: number };
  variance: { dso: number; collectionRate: number };
  trend: {
    collectionRate: { previous: number; change: number };
    dso: { previous: number; change: number };
  };
}
```

### Key Backend Logic (corrected)

```typescript
async function getConfigValue(key: string, defaultValue: number): Promise<number> {
  const setting = await prisma.systemSetting.findUnique({ where: { key } });
  return setting ? parseFloat(setting.value) : defaultValue;
}

async function getCollectionEfficiencyMetrics(
  dateFrom: Date,
  dateTo: Date,
  recoveryAgentId?: string,
  skipTrend: boolean = false          // CRITICAL: prevents infinite recursion
): Promise<CollectionEfficiencyMetrics> {
  const dsoTarget = await getConfigValue('DSO_TARGET', 30);
  const collectionRateTarget = await getConfigValue('COLLECTION_RATE_TARGET', 90);

  const clientWhere: any = { status: 'ACTIVE' };
  if (recoveryAgentId) clientWhere.recoveryAgentId = recoveryAgentId;

  // Total receivables at end of period
  const clients = await prisma.client.findMany({
    where: clientWhere,
    include: {
      invoices: { where: { status: { in: ['PENDING', 'PARTIAL'] } } }  // NOT 'UNPAID'
    }
  });

  let totalReceivables = 0;
  let totalOverdue = 0;
  for (const client of clients) {
    totalReceivables += Number(client.balance);
    for (const inv of client.invoices) {
      if (inv.dueDate && inv.dueDate < dateTo) {
        totalOverdue += Number(inv.total) - Number(inv.paidAmount);
      }
    }
  }

  // Collections during period
  const paymentWhere: any = { date: { gte: dateFrom, lte: dateTo } };
  if (recoveryAgentId) paymentWhere.client = { recoveryAgentId };
  const payments = await prisma.payment.findMany({ where: paymentWhere });
  const totalCollections = payments.reduce((s, p) => s + Number(p.amount), 0);

  const collectionRate = totalReceivables > 0 ? (totalCollections / totalReceivables) * 100 : 0;
  const overduePercentage = totalReceivables > 0 ? (totalOverdue / totalReceivables) * 100 : 0;

  // DSO calculation
  const daysInPeriod = Math.max(differenceInDays(dateTo, dateFrom), 1);
  const beginningClients = await prisma.client.findMany({ where: clientWhere, select: { balance: true } });
  const beginningReceivables = beginningClients.reduce((s, c) => s + Number(c.balance), 0);
  const avgReceivables = (beginningReceivables + totalReceivables) / 2;

  // Revenue: use invoiceDate (NOT 'date')
  const invoiceWhere: any = { invoiceDate: { gte: dateFrom, lte: dateTo } };
  if (recoveryAgentId) invoiceWhere.client = { recoveryAgentId };
  const invoices = await prisma.invoice.findMany({ where: invoiceWhere });
  const totalRevenue = invoices.reduce((s, inv) => s + Number(inv.total), 0);
  const revenuePerDay = totalRevenue / daysInPeriod;
  const dso = revenuePerDay > 0 ? avgReceivables / revenuePerDay : 0;

  // CEI
  const currentReceivables = totalReceivables - totalOverdue;
  const ceiDenom = beginningReceivables + totalRevenue - currentReceivables;
  const cei = ceiDenom > 0
    ? ((beginningReceivables + totalRevenue - totalReceivables) / ceiDenom) * 100
    : 0;

  // Average Collection Period (uses invoiceDate, not 'date')
  const paymentsWithAlloc = await prisma.payment.findMany({
    where: paymentWhere,
    include: { allocations: { include: { invoice: true } } }
  });
  let totalDays = 0, invCount = 0;
  for (const payment of paymentsWithAlloc) {
    for (const alloc of payment.allocations) {
      totalDays += differenceInDays(payment.date, alloc.invoice.invoiceDate);
      invCount++;
    }
  }
  const avgCollectionPeriod = invCount > 0 ? Math.round(totalDays / invCount) : 0;

  // Trend: get previous period (with skipTrend=true to prevent recursion)
  let trend = { collectionRate: { previous: 0, change: 0 }, dso: { previous: 0, change: 0 } };
  if (!skipTrend) {
    const prevFrom = subMonths(dateFrom, 1);
    const prevTo = subMonths(dateTo, 1);
    const prev = await getCollectionEfficiencyMetrics(prevFrom, prevTo, recoveryAgentId, true);
    trend = {
      collectionRate: { previous: prev.collectionRate, change: Math.round((collectionRate - prev.collectionRate) * 10) / 10 },
      dso: { previous: prev.dso, change: Math.round(dso - prev.dso) }
    };
  }

  return {
    period: { from: dateFrom, to: dateTo },
    collectionRate: Math.round(collectionRate * 10) / 10,
    dso: Math.round(dso),
    cei: Math.round(cei * 10) / 10,
    averageCollectionPeriod: avgCollectionPeriod,
    overduePercentage: Math.round(overduePercentage * 10) / 10,
    totalReceivables, totalOverdue, totalCollections,
    targets: { dso: dsoTarget, collectionRate: collectionRateTarget },
    variance: { dso: Math.round(dso - dsoTarget), collectionRate: Math.round((collectionRate - collectionRateTarget) * 10) / 10 },
    trend
  };
}
```

### Module Structure

```
apps/api/src/modules/reports/
  collection-efficiency.controller.ts   (NEW)
  collection-efficiency.service.ts      (NEW)

apps/web/src/features/reports/pages/
  CollectionEfficiencyPage.tsx          (NEW)
```

### Frontend Notes

- **KPI cards**: Collection Rate (with trend arrow), DSO (lower is better), CEI score, Avg Collection Period. Each shows target and variance.
- **Summary cards**: Total Receivables, Total Overdue (with % of receivables), Total Collections.
- **Charts**: DSO trend (LineChart), Collection Rate trend (BarChart), Receivables pie (current vs overdue). All via `recharts`.
- Use `<Card>` directly, no `Card.Body`.

### POST-MVP DEFERRED

- **Year-over-year comparison**
- **12-month rolling average overlay on charts**
- **Export to Excel** endpoint (server-side `exceljs`)

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), Card.Body removed, prisma.configuration→prisma.systemSetting, UNPAID→PENDING, invoice.date→invoiceDate, fixed infinite recursion with skipTrend flag, recharts as external dep, trimmed frontend to notes | Claude (AI Review) |
