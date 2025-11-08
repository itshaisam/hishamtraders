# Story 4.5: Sales Reports

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.5
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 3 (Sales)
**Status:** Draft

---

## User Story

**As a** sales officer,
**I want** detailed sales reports by date, client, and product,
**So that** sales performance can be analyzed and optimized.

---

## Acceptance Criteria

1. **Sales Report API:**
   - [ ] GET /api/reports/sales - detailed sales report
   - [ ] Filters: date range (required), clientId, productId, paymentType
   - [ ] Shows: Invoice #, Date, Client, Product, Qty, Price, Total, Type, Status
   - [ ] Summary: Total invoices, Total amount, Paid, Outstanding

2. **Sales by Client:**
   - [ ] GET /api/reports/sales-by-client
   - [ ] Shows: Client, Total Invoices, Total Revenue
   - [ ] Sorted by revenue desc

3. **Sales by Product:**
   - [ ] GET /api/reports/sales-by-product
   - [ ] Shows: Product, Quantity Sold, Revenue
   - [ ] Sorted by revenue desc

4. **Frontend:**
   - [ ] Sales Reports page with report type selector
   - [ ] Date range picker (from/to)
   - [ ] Results table with summary
   - [ ] Export to Excel button

5. **Authorization & Role-Based Access:**
   - [ ] Sales Officer: Own sales data only (filtered by assigned territory/region)
   - [ ] Accountant: View all sales data
   - [ ] Admin: Full access
   - [ ] Recovery Agent, Other roles: 403 Forbidden

6. **Performance & Caching:**
   - [ ] Page size default: 100 items
   - [ ] Max items returned: 10,000 per report
   - [ ] Cache TTL: 15 minutes (less frequent updates than dashboard)
   - [ ] API timeout: 20 seconds maximum
   - [ ] Pagination validation: max pageSize = 100
   - [ ] Implement cursor-based pagination for datasets > 1000 items

7. **Real-Time Data Updates:**
   - [ ] Cache TTL: 15 minutes (manual refresh recommended)
   - [ ] Manual refresh button available
   - [ ] Show "Report generated at" timestamp on page
   - [ ] Network error: Show cached data with warning banner
   - [ ] Cache invalidation: On invoice creation, voiding, payment

8. **Error Handling:**
   - [ ] Validate date range (from <= to, max 1 year)
   - [ ] Handle missing client/product data (show as 'Unknown')
   - [ ] Return HTTP 400 with error details if filters invalid
   - [ ] Max 50,000 rows for Excel export (validate before download)
   - [ ] Display partial data with error toast if calculation fails
   - [ ] Catch and log trend calculation failures

---

## Dev Notes

```typescript
interface SalesReportFilters {
  dateFrom: Date;
  dateTo: Date;
  clientId?: string;
  productId?: string;
  paymentType?: 'CASH' | 'CREDIT';
}

async function getSalesReport(filters: SalesReportFilters) {
  const invoices = await prisma.invoice.findMany({
    where: {
      invoiceDate: { gte: filters.dateFrom, lte: filters.dateTo },
      status: { not: 'VOIDED' },
      ...(filters.clientId && { clientId: filters.clientId })
    },
    include: {
      client: true,
      items: { include: { product: true } }
    }
  });

  const items = invoices.flatMap(inv =>
    inv.items.map(item => ({
      invoiceNumber: inv.invoiceNumber,
      date: inv.invoiceDate,
      client: inv.client.name,
      product: item.product.name,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice.toString()),
      total: parseFloat(item.totalPrice.toString()),
      status: inv.status
    }))
  );

  const summary = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0),
    paidAmount: invoices
      .filter(inv => inv.status === 'PAID')
      .reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0),
    outstanding: invoices
      .filter(inv => inv.status !== 'PAID')
      .reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0)
  };

  return { items, summary };
}

async function getSalesByClient(filters: { dateFrom: Date; dateTo: Date }) {
  const invoices = await prisma.invoice.findMany({
    where: {
      invoiceDate: { gte: filters.dateFrom, lte: filters.dateTo },
      status: { not: 'VOIDED' }
    },
    include: { client: true }
  });

  const clientData = invoices.reduce((acc, inv) => {
    if (!acc[inv.clientId]) {
      acc[inv.clientId] = {
        clientName: inv.client.name,
        totalInvoices: 0,
        totalRevenue: 0
      };
    }
    acc[inv.clientId].totalInvoices++;
    acc[inv.clientId].totalRevenue += parseFloat(inv.total.toString());
    return acc;
  }, {} as Record<string, any>);

  return Object.values(clientData).sort((a: any, b: any) => b.totalRevenue - a.totalRevenue);
}

async function getSalesByProduct(filters: { dateFrom: Date; dateTo: Date }) {
  const items = await prisma.invoiceItem.findMany({
    where: {
      invoice: {
        invoiceDate: { gte: filters.dateFrom, lte: filters.dateTo },
        status: { not: 'VOIDED' }
      }
    },
    include: { product: true }
  });

  const productData = items.reduce((acc, item) => {
    if (!acc[item.productId]) {
      acc[item.productId] = {
        productName: item.product.name,
        quantitySold: 0,
        revenue: 0
      };
    }
    acc[item.productId].quantitySold += item.quantity;
    acc[item.productId].revenue += parseFloat(item.totalPrice.toString());
    return acc;
  }, {} as Record<string, any>);

  return Object.values(productData).sort((a: any, b: any) => b.revenue - a.revenue);
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
