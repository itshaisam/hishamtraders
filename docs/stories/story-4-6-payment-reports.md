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
   - [ ] GET /api/reports/payments
   - [ ] Filters: date range, clientId, paymentMethod
   - [ ] Shows: Date, Client, Invoice #, Amount, Method, Recorded By
   - [ ] Summary: Total collected, Count, By method breakdown

2. **Receivables Report:**
   - [ ] GET /api/reports/receivables
   - [ ] Shows: Client, Total Outstanding, Overdue Amount, Days Overdue
   - [ ] Sorted by overdue amount desc
   - [ ] Color-coding: green (current), yellow (1-14 days), red (15+ days)

3. **Frontend:**
   - [ ] Payment Reports page with filters
   - [ ] Payment list and receivables summary
   - [ ] Export to Excel

4. **Authorization & Role-Based Access:**
   - [ ] Accountant: Full payment data access
   - [ ] Recovery Agent: Own assigned clients' payments only
   - [ ] Admin: Full access
   - [ ] Sales Officer, Other roles: 403 Forbidden

5. **Performance & Caching:**
   - [ ] Page size default: 50 items
   - [ ] Max items returned: 5,000 per report
   - [ ] Cache TTL: 5 minutes (payment data changes frequently)
   - [ ] API timeout: 15 seconds maximum
   - [ ] Pagination validation: max pageSize = 100

6. **Real-Time Data Updates:**
   - [ ] Cache TTL: 5 minutes
   - [ ] Manual refresh button available
   - [ ] Show "Report generated at" timestamp on page
   - [ ] Cache invalidation: On payment recording, invoice status change
   - [ ] Network error: Show cached data with warning

7. **Error Handling:**
   - [ ] Validate date range (from <= to, max 1 year)
   - [ ] Handle missing allocation data gracefully (show 'Unallocated')
   - [ ] Return HTTP 400 with error details if filters invalid
   - [ ] Max 20,000 rows for Excel export
   - [ ] Display partial data with error toast if calculation fails
   - [ ] Catch and log overpayment calculation errors (negative balance scenarios)

---

## Dev Notes

```typescript
async function getPaymentCollectionReport(filters: {
  dateFrom: Date;
  dateTo: Date;
  clientId?: string;
  paymentMethod?: PaymentMethod;
}) {
  const payments = await prisma.payment.findMany({
    where: {
      paymentType: 'CLIENT',
      date: { gte: filters.dateFrom, lte: filters.dateTo },
      ...(filters.paymentMethod && { method: filters.paymentMethod })
    },
    include: {
      user: true,
      allocations: { include: { invoice: { include: { client: true } } } }
    }
  });

  const items = payments.map(payment => ({
    date: payment.date,
    client: payment.allocations[0]?.invoice.client.name || 'N/A',
    invoiceNumbers: payment.allocations.map(a => a.invoice.invoiceNumber).join(', '),
    amount: parseFloat(payment.amount.toString()),
    method: payment.method,
    recordedBy: payment.user.name
  }));

  const summary = {
    totalCollected: payments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
    count: payments.length,
    byMethod: {} // Group by payment method
  };

  return { items, summary };
}

async function getReceivablesReport() {
  const clients = await prisma.client.findMany({
    where: { balance: { gt: 0 } },
    include: {
      invoices: {
        where: { status: { in: ['UNPAID', 'PARTIAL'] } },
        orderBy: { invoiceDate: 'asc' }
      }
    }
  });

  return clients.map(client => {
    const oldestInvoice = client.invoices[0];
    const daysOverdue = oldestInvoice?.dueDate
      ? differenceInDays(new Date(), oldestInvoice.dueDate)
      : 0;

    const overdueInvoices = client.invoices.filter(
      inv => inv.dueDate && inv.dueDate < new Date()
    );
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total.toString()),
      0
    );

    return {
      clientId: client.id,
      clientName: client.name,
      totalOutstanding: parseFloat(client.balance.toString()),
      overdueAmount,
      daysOverdue: Math.max(0, daysOverdue),
      status: daysOverdue >= 15 ? 'danger' : daysOverdue >= 1 ? 'warning' : 'good'
    };
  }).sort((a, b) => b.overdueAmount - a.overdueAmount);
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
