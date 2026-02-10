# Story 4.3a — Accountant Dashboard

**Epic:** 4 — Dashboards & Reporting
**Priority:** High
**Status:** Done
**Depends On:** Story 4.1 (Admin Dashboard)

---

## Description

Replace the placeholder Accountant Dashboard with real financial data. The Accountant Dashboard provides a financial overview including cash flow metrics, receivables aging, revenue vs expenses comparison, and recent payment activity. It is accessible as a tab within the Admin Dashboard and via the `/accountant/stats` API endpoint (guarded by ADMIN or ACCOUNTANT roles).

## Acceptance Criteria

1. **6 Metric Cards** display real data: Cash Inflow, Cash Outflow, Net Cash Flow (derived), Receivables, Payables, Pending Invoices
2. **Cash Flow Trend Chart** shows a bar chart of daily cash inflow/outflow for the last 7 days using recharts
3. **Receivables Aging** shows 4 aging buckets (Current, 1-7 days, 8-30 days, 30+ days) with progress bars and PKR amounts
4. **Revenue vs Expenses** shows monthly revenue, expenses, and net profit with margin percentage
5. **Recent Payments Table** shows last 10 payments with date, type (IN/OUT), name, amount, method, reference
6. **Quick Actions** link to Record Payment, View Expenses, and Cash Flow Report
7. Data refreshes every 60 seconds with 2-minute stale time

## Backend Changes

**File:** `apps/api/src/services/dashboard.service.ts` — `getAccountantStats()`

### Queries (via Promise.all)

| Metric | Source |
|--------|--------|
| `cashInflow` | SUM(Payment.amount) where paymentType='CLIENT', date >= monthStart |
| `cashOutflow` | SUM(Payment.amount) where paymentType='SUPPLIER' + SUM(Expense.amount), date >= monthStart |
| `totalReceivables` | SUM(Client.balance) where balance > 0 |
| `totalPayables` | PO totals minus supplier payments (same logic as admin) |
| `pendingPayments` | COUNT(Invoice) where status IN ('PENDING','PARTIAL') |
| `monthRevenue` | SUM(Invoice.total) where invoiceDate >= monthStart, not VOIDED |
| `monthExpenses` | SUM(Expense.amount) where date >= monthStart |
| `receivablesAging` | Invoices bucketed by dueDate: current, 1-7d, 8-30d, 30+d |
| `recentPayments` | Last 10 payments with client/supplier name |
| `cashFlowTrend` | Daily cash in/out for last 7 days (raw SQL with date series) |

### Response Shape

```typescript
{
  cashInflow: number;
  cashOutflow: number;
  totalReceivables: number;
  totalPayables: number;
  pendingPayments: number;
  monthRevenue: number;
  monthExpenses: number;
  receivablesAging: { current: number; days1to7: number; days8to30: number; days30plus: number };
  recentPayments: Array<{ id, type, name, amount, method, reference, date }>;
  cashFlowTrend: Array<{ date: string; inflow: number; outflow: number }>;
}
```

## Frontend Changes

**File:** `apps/web/src/components/dashboards/AccountantDashboard.tsx`

- Full rewrite with typed interfaces
- Uses recharts BarChart for cash flow trend
- TanStack Query with `staleTime: 120000`, `refetchInterval: 60000`
- Last updated timestamp displayed
- Quick Actions use React Router `<Link>` components

## Files Modified

- `apps/api/src/services/dashboard.service.ts`
- `apps/web/src/components/dashboards/AccountantDashboard.tsx`

## Testing

1. Navigate to `/dashboard` as ADMIN, click "Accountant View" tab
2. Verify all 6 metric cards show real data
3. Verify cash flow chart renders with last 7 days
4. Verify receivables aging bars reflect actual invoice data
5. Verify revenue vs expenses shows current month figures
6. Verify recent payments table shows latest 10 payments
7. Quick action links navigate correctly
