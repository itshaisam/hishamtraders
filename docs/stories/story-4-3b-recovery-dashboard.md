# Story 4.3b — Recovery Dashboard

**Epic:** 4 — Dashboards & Reporting
**Priority:** High
**Status:** Done
**Depends On:** Story 4.1 (Admin Dashboard)

---

## Description

Replace the placeholder Recovery Dashboard with real overdue/collections data. The Recovery Dashboard helps recovery agents track overdue clients, monitor collections, and manage follow-ups. Accessible as a tab within the Admin Dashboard and via the `/recovery/stats` API endpoint (guarded by ADMIN or RECOVERY_AGENT roles).

## What Was Removed

- **Weekly Target** section with hardcoded PKR 4.0M (no target/schedule model exists)
- **"Today's Schedule"** card (no schedule model)
- **"Follow-up Calls"** and **"View Schedule"** buttons (no call tracking or schedule system)

## Acceptance Criteria

1. **4 Metric Cards**: Total Outstanding, Overdue Clients count, Collected This Week, Collected This Month
2. **Aging Breakdown** — 4 buckets (1-7d, 8-30d, 31-60d, 60+d) with color-coded summary cards and a stacked bar showing proportions
3. **Overdue Clients Table** — Name, Phone, Contact Person, Outstanding Amount, Days Overdue, # Invoices. Color-coded rows by severity. Max 50 rows with scroll.
4. **Recent Collections Feed** — Last 10 client payments with name, amount, method, date
5. **Quick Actions**: Record Payment (`/payments/client`), View Clients (`/clients`), View Invoices (`/invoices`). Uses `<Link>` components.
6. Data refreshes every 30 seconds with 1-minute stale time (recovery needs fresher data)

## Backend Changes

**File:** `apps/api/src/services/dashboard.service.ts` — `getRecoveryStats()`

### Queries (via Promise.all)

| Metric | Source |
|--------|--------|
| `totalOutstanding` | SUM(Client.balance) where balance > 0 |
| `overdueCount` | COUNT(DISTINCT clientId) from overdue invoices |
| `collectedThisWeek` | SUM(Payment.amount) where paymentType='CLIENT', date >= weekStart |
| `collectedThisMonth` | SUM(Payment.amount) where paymentType='CLIENT', date >= monthStart |
| `overdueClientsList` | Aggregated by client: name, phone, contactPerson, totalOverdue, invoiceCount, daysOverdue. Top 50 by amount DESC |
| `agingBuckets` | Overdue invoices bucketed: 1-7d, 8-30d, 31-60d, 60+d (count + amount per bucket) |
| `recentCollections` | Last 10 CLIENT payments with client name |

### Response Shape

```typescript
{
  totalOutstanding: number;
  overdueCount: number;
  collectedThisWeek: number;
  collectedThisMonth: number;
  overdueClientsList: Array<{
    clientId, name, phone, contactPerson, totalOverdue, overdueInvoiceCount, oldestDueDate, daysOverdue
  }>;
  agingBuckets: {
    days1to7: { count: number; amount: number };
    days8to30: { count: number; amount: number };
    days31to60: { count: number; amount: number };
    days60plus: { count: number; amount: number };
  };
  recentCollections: Array<{ id, clientName, amount, method, date }>;
}
```

## Frontend Changes

**File:** `apps/web/src/components/dashboards/RecoveryDashboard.tsx`

- Full rewrite with typed interfaces
- Color-coded overdue severity (green/yellow/orange/red based on days overdue)
- 3-column layout: overdue table (2 cols) + recent collections (1 col)
- TanStack Query with `staleTime: 60000`, `refetchInterval: 30000`
- Last updated timestamp displayed
- Quick Actions use React Router `<Link>` components

## Files Modified

- `apps/api/src/services/dashboard.service.ts`
- `apps/web/src/components/dashboards/RecoveryDashboard.tsx`

## Testing

1. Navigate to `/dashboard` as ADMIN, click "Recovery View" tab
2. Verify all 4 metric cards show real data
3. Verify aging breakdown cards show invoice counts and amounts
4. Verify stacked bar visualization appears when there are overdue invoices
5. Verify overdue clients table shows client details with phone numbers
6. Verify rows are color-coded by severity (red for 60+d, orange for 31-60d, etc.)
7. Verify recent collections feed shows latest 10 client payments
8. Quick action links navigate correctly
