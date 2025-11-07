# Story 4.8: Expense Reports

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.8
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 3 (Expense Tracking)
**Status:** Draft

---

## User Story

**As an** accountant,
**I want** detailed expense reports by category and period,
**So that** cost control can be maintained.

---

## Acceptance Criteria

1. **Expense Report:**
   - [ ] GET /api/reports/expenses
   - [ ] Filters: date range (required), category
   - [ ] Shows: Date, Category, Amount, Description, Paid To, Method

2. **Expense by Category:**
   - [ ] GET /api/reports/expenses-by-category
   - [ ] Shows: Category, Total Amount, Count, % of Total

3. **Expense Trend:**
   - [ ] GET /api/reports/expenses-trend
   - [ ] Monthly trend (last 12 months)
   - [ ] Shows: Month, Total Expenses

4. **Frontend:**
   - [ ] Expense Reports page with filters
   - [ ] Detailed list and category summary
   - [ ] Optional monthly trend chart
   - [ ] Export to Excel

5. **Authorization:**
   - [ ] Accountant, Admin

---

## Dev Notes

```typescript
async function getExpenseReport(filters: {
  dateFrom: Date;
  dateTo: Date;
  category?: ExpenseCategory;
}) {
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: filters.dateFrom, lte: filters.dateTo },
      ...(filters.category && { category: filters.category })
    },
    include: { user: true },
    orderBy: { date: 'desc' }
  });

  return expenses.map(exp => ({
    date: exp.date,
    category: exp.category,
    amount: parseFloat(exp.amount.toString()),
    description: exp.description,
    paymentMethod: exp.paymentMethod,
    recordedBy: exp.user.name
  }));
}

async function getExpensesByCategory(filters: { dateFrom: Date; dateTo: Date }) {
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: filters.dateFrom, lte: filters.dateTo }
    }
  });

  const categoryData = expenses.reduce((acc, exp) => {
    if (!acc[exp.category]) {
      acc[exp.category] = { total: 0, count: 0 };
    }
    acc[exp.category].total += parseFloat(exp.amount.toString());
    acc[exp.category].count++;
    return acc;
  }, {} as Record<string, { total: number; count: number }>);

  const totalExpenses = Object.values(categoryData).reduce((sum, c) => sum + c.total, 0);

  return Object.entries(categoryData).map(([category, data]) => ({
    category,
    totalAmount: data.total,
    count: data.count,
    percentage: totalExpenses > 0 ? (data.total / totalExpenses) * 100 : 0
  }));
}

async function getExpensesTrend() {
  const twelveMonthsAgo = new Date();
  twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 12);

  const expenses = await prisma.expense.findMany({
    where: { date: { gte: twelveMonthsAgo } },
    select: { date: true, amount: true }
  });

  const monthlyData = expenses.reduce((acc, exp) => {
    const monthKey = format(exp.date, 'yyyy-MM');
    if (!acc[monthKey]) {
      acc[monthKey] = 0;
    }
    acc[monthKey] += parseFloat(exp.amount.toString());
    return acc;
  }, {} as Record<string, number>);

  return Object.entries(monthlyData)
    .map(([month, total]) => ({ month, total }))
    .sort((a, b) => a.month.localeCompare(b.month));
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
