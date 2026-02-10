# Story 4.6: Payment Collection Reports

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.6
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 3 (Payments)
**Status:** Draft

---

## User Story

**As an** accountant,
**I want** payment collection and outstanding balance reports,
**So that** cash flow and collection effectiveness can be monitored.

---

## Acceptance Criteria

1. **Payment Collection Report:**
   - [ ] `GET /api/v1/reports/payments` — client payment collection report
   - [ ] Filters: `dateFrom` (required), `dateTo` (required), `clientId`, `method`
   - [ ] Shows: Date, Client, Amount, Method, Reference #, Recorded By
   - [ ] Summary: Total collected, Payment count, Breakdown by method

2. **Receivables Report:**
   - [ ] `GET /api/v1/reports/receivables` — outstanding client balances
   - [ ] Shows: Client Name, Total Outstanding, Overdue Amount, Max Days Overdue
   - [ ] Sorted by overdue amount desc
   - [ ] Color-coding: green (current), yellow (1-14 days overdue), red (15+ days)

3. **Frontend:**
   - [ ] Payment Reports page with tab selector (Collection / Receivables)
   - [ ] Payment list with filters and summary
   - [ ] Receivables table with aging color indicators
   - [ ] Export to Excel (Story 4.9)
   - [ ] Empty state when no results

4. **Authorization:**
   - [ ] `ACCOUNTANT`: Full access to all payment data
   - [ ] `RECOVERY_AGENT`: Full access (no per-client filtering — see note)
   - [ ] `ADMIN`: Full access
   - [ ] Other roles: 403 Forbidden

5. **Performance:**
   - [ ] Offset-based pagination: default `limit=50`, max `limit=100`
   - [ ] TanStack Query with `staleTime: 300000` (5 min)
   - [ ] Date range validation: `dateFrom <= dateTo`, max 1 year span
   - [ ] "Report generated at" timestamp shown on page

---

## Dev Notes

### Implementation Status

**Backend:** No payment report service exists. Reports module at `apps/api/src/modules/reports/`.

**Frontend:** No payment report page exists.

**Route registration:** Add to `apps/api/src/modules/reports/reports.routes.ts`.

### Schema Field Reference

```
Payment:   id, paymentType (SUPPLIER | CLIENT), clientId, supplierId, amount, method (PaymentMethod),
           referenceNumber, date, notes, recordedBy
           client → Client relation (direct FK — use this, not allocations chain)
           user → User relation
           allocations → PaymentAllocation[] relation

Client:    id, name, balance (Decimal), creditLimit, status (ACTIVE | INACTIVE)
           invoices → Invoice[] relation

Invoice:   status: PENDING | PARTIAL | PAID | OVERDUE | CANCELLED | VOIDED
           (NO "UNPAID" status — use PENDING for unpaid invoices)
           dueDate, total, paidAmount
```

### Key Corrections from Original Doc

1. **`UNPAID` status does NOT exist** — Overdue query must use `PENDING` and `PARTIAL`:
   ```typescript
   where: {
     status: { in: ['PENDING', 'PARTIAL'] },
     dueDate: { lt: today }
   }
   ```

2. **Payment has `clientId` directly** — No need to traverse `allocations[0]?.invoice.client.name`. Use:
   ```typescript
   include: { client: { select: { name: true } }, user: { select: { name: true } } }
   // Then: payment.client?.name || 'N/A'
   ```

3. **No "own assigned clients" filtering for Recovery Agent** — The schema has no client-agent assignment. For MVP, all recovery agents see all payment data. Per-agent filtering requires a junction table. Defer.

4. **API paths** are `/api/v1/reports/payments` and `/api/v1/reports/receivables` (not `/api/reports/*`).

### Payment Collection Report (Correct)
```typescript
async function getPaymentCollectionReport(filters: {
  dateFrom: Date;
  dateTo: Date;
  clientId?: string;
  method?: PaymentMethod;
}) {
  const payments = await prisma.payment.findMany({
    where: {
      paymentType: 'CLIENT',
      date: { gte: filters.dateFrom, lte: filters.dateTo },
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.method && { method: filters.method }),
    },
    include: {
      client: { select: { name: true } },
      user: { select: { name: true } },
    },
    orderBy: { date: 'desc' },
    skip: offset,
    take: limit,
  });

  const items = payments.map(p => ({
    date: p.date,
    client: p.client?.name || 'N/A',
    amount: parseFloat(p.amount.toString()),
    method: p.method,
    referenceNumber: p.referenceNumber || 'N/A',
    recordedBy: p.user.name,
  }));

  // Summary
  const allPayments = await prisma.payment.findMany({
    where: {
      paymentType: 'CLIENT',
      date: { gte: filters.dateFrom, lte: filters.dateTo },
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.method && { method: filters.method }),
    },
    select: { amount: true, method: true },
  });

  const totalCollected = allPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  const byMethod: Record<string, number> = {};
  allPayments.forEach(p => {
    byMethod[p.method] = (byMethod[p.method] || 0) + parseFloat(p.amount.toString());
  });

  return {
    items,
    summary: { totalCollected, count: allPayments.length, byMethod },
  };
}
```

### Receivables Report (Correct)
```typescript
async function getReceivablesReport() {
  const today = new Date();

  const clients = await prisma.client.findMany({
    where: { balance: { gt: 0 }, status: 'ACTIVE' },
    include: {
      invoices: {
        where: { status: { in: ['PENDING', 'PARTIAL'] } },  // NOT 'UNPAID'
        select: { dueDate: true, total: true, paidAmount: true },
        orderBy: { dueDate: 'asc' },
      }
    }
  });

  return clients.map(client => {
    const overdueInvoices = client.invoices.filter(
      inv => inv.dueDate && inv.dueDate < today
    );
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString()),
      0
    );

    // Max days overdue from oldest overdue invoice
    const oldestOverdue = overdueInvoices[0];
    const daysOverdue = oldestOverdue?.dueDate
      ? Math.floor((today.getTime() - oldestOverdue.dueDate.getTime()) / (1000 * 60 * 60 * 24))
      : 0;

    return {
      clientId: client.id,
      clientName: client.name,
      totalOutstanding: parseFloat(client.balance.toString()),
      overdueAmount,
      daysOverdue: Math.max(0, daysOverdue),
      status: daysOverdue >= 15 ? 'danger' : daysOverdue >= 1 ? 'warning' : 'good',
    };
  }).sort((a, b) => b.overdueAmount - a.overdueAmount);
}
```

### Module Structure

```
apps/api/src/modules/reports/
  payment-report.service.ts     (NEW — getPaymentCollectionReport, getReceivablesReport)
  reports.controller.ts         (EXPAND — add payment report handlers)
  reports.routes.ts             (EXPAND — add GET /payments, GET /receivables)

apps/web/src/features/reports/pages/
  PaymentReportPage.tsx         (NEW)
```

### POST-MVP DEFERRED

- **Recovery Agent per-client filtering**: Requires client-agent assignment model. Defer.
- **Server-side cache invalidation**: Use TanStack Query client-side caching.
- **Overpayment calculation logging**: Edge case — handle if it comes up in production.
