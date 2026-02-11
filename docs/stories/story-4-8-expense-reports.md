# Story 4.8: Expense Reports

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.8
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 3 (Expense Tracking)
**Status:** Implemented

---

## User Story

**As an** accountant,
**I want** detailed expense reports by category and period,
**So that** cost control can be maintained.

---

## Acceptance Criteria

1. **Expense Report:**
   - [ ] `GET /api/v1/reports/expenses` — detailed expense list
   - [ ] Filters: `dateFrom` (required), `dateTo` (required), `category`
   - [ ] Shows: Date, Category, Amount, Description, Payment Method, Recorded By
   - [ ] Summary: Total expenses, Count, Average per expense

2. **Expense by Category:**
   - [ ] Expand existing `GET /api/v1/reports/expense-summary` endpoint
   - [ ] Shows: Category, Total Amount, Count, % of Total
   - [ ] Already partially implemented (see note)

3. **Expense Trend:**
   - [ ] `GET /api/v1/reports/expenses-trend` — monthly trend
   - [ ] Shows: Month, Total Expenses (last 12 months)
   - [ ] Optional: line chart on frontend

4. **Frontend:**
   - [ ] Expense Reports page with tabs (Detail / By Category / Trend)
   - [ ] Date range picker for detail and category views
   - [ ] Responsive table with summary row
   - [ ] Export to Excel (Story 4.9)
   - [ ] Empty state when no results

5. **Authorization:**
   - [ ] `ACCOUNTANT`: Full expense data access
   - [ ] `ADMIN`: Full access
   - [ ] Other roles: 403 Forbidden

6. **Performance:**
   - [ ] Offset-based pagination: default `limit=50`, max `limit=100` (detail view)
   - [ ] TanStack Query with `staleTime: 300000` (5 min)
   - [ ] Date range validation: `dateFrom <= dateTo`, max 1 year span

---

## Dev Notes

### Implementation Status

**Backend:** Partial — `GET /api/v1/reports/expense-summary` already exists in `apps/api/src/modules/reports/reports.controller.ts`. It groups expenses by category with date range filter. Needs expansion for detail list and trend.

**Frontend:** No expense report page exists.

**Route registration:** Expand `apps/api/src/modules/reports/reports.routes.ts`.

### Schema Field Reference

```
Expense:  id, category (ExpenseCategory), amount (Decimal), description (Text), date (DateTime),
          paymentMethod (PaymentMethod), receiptUrl, recordedBy, createdAt, updatedAt
          user → User relation (via recordedBy FK)
          (NO paidTo field)

ExpenseCategory enum: RENT | UTILITIES | SALARIES | SUPPLIES | MAINTENANCE | MARKETING | TRANSPORT | MISC

PaymentMethod enum: CASH | BANK_TRANSFER | CHEQUE | MOBILE_PAYMENT | OTHER
```

### Key Corrections from Original Doc

1. **Expense has NO `paidTo` field** — Removed from "Shows" list. The model only tracks category, amount, description, date, paymentMethod, and recordedBy (user).

2. **`expense-summary` endpoint already exists** — No need to create from scratch. Expand it or keep it as-is and add the detail + trend endpoints.

3. **API paths** are `/api/v1/reports/expenses*` (not `/api/reports/expenses*`).

### Expense Detail Report (Correct)
```typescript
async function getExpenseReport(filters: {
  dateFrom: Date;
  dateTo: Date;
  category?: ExpenseCategory;
}) {
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: filters.dateFrom, lte: filters.dateTo },
      ...(filters.category && { category: filters.category }),
    },
    include: { user: { select: { name: true } } },
    orderBy: { date: 'desc' },
    skip: offset,
    take: limit,
  });

  const items = expenses.map(exp => ({
    date: exp.date,
    category: exp.category,
    amount: parseFloat(exp.amount.toString()),
    description: exp.description,
    paymentMethod: exp.paymentMethod,
    recordedBy: exp.user.name,
  }));

  // Summary (all matching, not paginated)
  const allExpenses = await prisma.expense.aggregate({
    where: {
      date: { gte: filters.dateFrom, lte: filters.dateTo },
      ...(filters.category && { category: filters.category }),
    },
    _sum: { amount: true },
    _count: true,
  });

  return {
    items,
    summary: {
      totalExpenses: parseFloat(allExpenses._sum.amount?.toString() || '0'),
      count: allExpenses._count,
      average: allExpenses._count > 0
        ? parseFloat(allExpenses._sum.amount?.toString() || '0') / allExpenses._count
        : 0,
    },
  };
}
```

### Expense Trend (Correct)
```typescript
async function getExpensesTrend() {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: twelveMonthsAgo } },
    select: { date: true, amount: true },
  });

  const monthlyData: Record<string, number> = {};
  expenses.forEach(exp => {
    const monthKey = `${exp.date.getFullYear()}-${String(exp.date.getMonth() + 1).padStart(2, '0')}`;
    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + parseFloat(exp.amount.toString());
  });

  return Object.entries(monthlyData)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
```

### Module Structure

```
apps/api/src/modules/reports/
  expense-report.service.ts     (NEW — getExpenseReport, getExpensesTrend)
  reports.controller.ts         (EXPAND — add expense detail + trend handlers)
  reports.routes.ts             (EXPAND — add GET /expenses, GET /expenses-trend)
                                (expense-summary already exists)

apps/web/src/features/reports/pages/
  ExpenseReportPage.tsx         (NEW)
```

### POST-MVP DEFERRED

- **Server-side caching / pre-calculated aggregations**: Use TanStack Query client-side caching.
- **Expense trend chart**: Optional — table view is sufficient for MVP. Chart can be added with recharts later.
