# Story 4.5: Sales Reports

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.5
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 3 (Sales)
**Status:** Implemented

---

## User Story

**As a** sales officer,
**I want** detailed sales reports by date, client, and product,
**So that** sales performance can be analyzed and optimized.

---

## Acceptance Criteria

1. **Sales Report API:**
   - [ ] `GET /api/v1/reports/sales` — detailed sales report
   - [ ] Filters: `dateFrom` (required), `dateTo` (required), `clientId`, `productId`, `status`
   - [ ] Shows: Invoice #, Date, Client, Items (product, qty, unit price, total), Invoice Total, Status
   - [ ] Summary: Total invoices, Total amount, Total paid, Total outstanding

2. **Sales by Client:**
   - [ ] `GET /api/v1/reports/sales-by-client`
   - [ ] Filters: `dateFrom` (required), `dateTo` (required)
   - [ ] Shows: Client Name, Total Invoices, Total Revenue
   - [ ] Sorted by revenue desc

3. **Sales by Product:**
   - [ ] `GET /api/v1/reports/sales-by-product`
   - [ ] Filters: `dateFrom` (required), `dateTo` (required)
   - [ ] Shows: Product Name, Quantity Sold, Revenue
   - [ ] Sorted by revenue desc

4. **Frontend:**
   - [ ] Sales Reports page with report type selector (tabs or dropdown)
   - [ ] Date range picker (from/to) — required
   - [ ] Results table with summary row
   - [ ] Export to Excel button (Story 4.9)
   - [ ] Empty state when no results

5. **Authorization:**
   - [ ] `SALES_OFFICER`: All sales data (no territory filtering — see note)
   - [ ] `ACCOUNTANT`: All sales data
   - [ ] `ADMIN`: Full access
   - [ ] Other roles: 403 Forbidden

6. **Performance:**
   - [ ] Offset-based pagination: default `limit=50`, max `limit=100`
   - [ ] TanStack Query with `staleTime: 300000` (5 min)
   - [ ] Date range validation: `dateFrom <= dateTo`, max 1 year span
   - [ ] "Report generated at" timestamp shown on page

---

## Dev Notes

### Implementation Status

**Backend:** No sales report service exists. Reports module at `apps/api/src/modules/reports/`.

**Frontend:** No sales report page exists.

**Route registration:** Add to `apps/api/src/modules/reports/reports.routes.ts`.

### Schema Field Reference

```
Invoice:     id, invoiceNumber, invoiceDate, clientId, total, paidAmount, taxAmount, taxRate,
             status (PENDING | PARTIAL | PAID | OVERDUE | CANCELLED | VOIDED), dueDate, warehouseId
             client → Client relation
             items → InvoiceItem[] relation

InvoiceItem: id, invoiceId, productId, productVariantId, batchNo, quantity, unitPrice, discount, total
             (field is `total`, NOT `totalPrice`)
             product → Product relation

Client:      id, name, balance, creditLimit, status
```

### Key Corrections from Original Doc

1. **`item.totalPrice` does NOT exist** — The field is `item.total`:
   ```typescript
   total: parseFloat(item.total.toString())  // NOT item.totalPrice
   ```

2. **No territory/region filtering** — The schema has no territory, region, or sales assignment concept. For MVP, all sales officers see all sales data. Territory-based filtering is POST-MVP.

3. **`paymentType` filter removed** — Invoice model has no payment type field. The original doc had `'CASH' | 'CREDIT'` filter which doesn't map to any schema field. Use `status` filter instead (PENDING, PARTIAL, PAID, etc.).

4. **API paths** are `/api/v1/reports/sales*` (not `/api/reports/sales*`).

5. **Outstanding calculation** — Use `paidAmount` for accuracy:
   ```typescript
   outstanding: parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString())
   ```

### Sales Report (Correct)
```typescript
async function getSalesReport(filters: {
  dateFrom: Date;
  dateTo: Date;
  clientId?: string;
  productId?: string;
  status?: InvoiceStatus;
}) {
  const invoices = await prisma.invoice.findMany({
    where: {
      invoiceDate: { gte: filters.dateFrom, lte: filters.dateTo },
      status: { not: 'VOIDED' },
      ...(filters.clientId && { clientId: filters.clientId }),
      ...(filters.status && { status: filters.status }),
    },
    include: {
      client: { select: { name: true } },
      items: { include: { product: { select: { name: true } } } }
    },
    orderBy: { invoiceDate: 'desc' },
    skip: offset,
    take: limit,
  });

  const items = invoices.flatMap(inv =>
    inv.items.map(item => ({
      invoiceNumber: inv.invoiceNumber,
      date: inv.invoiceDate,
      client: inv.client.name,
      product: item.product.name,
      quantity: item.quantity,
      unitPrice: parseFloat(item.unitPrice.toString()),
      total: parseFloat(item.total.toString()),  // NOT totalPrice
      status: inv.status
    }))
  );

  const summary = {
    totalInvoices: invoices.length,
    totalAmount: invoices.reduce((sum, inv) => sum + parseFloat(inv.total.toString()), 0),
    paidAmount: invoices.reduce((sum, inv) => sum + parseFloat(inv.paidAmount.toString()), 0),
    outstanding: invoices.reduce((sum, inv) =>
      sum + parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString()), 0),
  };

  return { items, summary };
}
```

### Sales by Product (Correct)
```typescript
async function getSalesByProduct(filters: { dateFrom: Date; dateTo: Date }) {
  const items = await prisma.invoiceItem.findMany({
    where: {
      invoice: {
        invoiceDate: { gte: filters.dateFrom, lte: filters.dateTo },
        status: { not: 'VOIDED' }
      }
    },
    include: { product: { select: { name: true } } }
  });

  const productData: Record<string, { productName: string; quantitySold: number; revenue: number }> = {};
  items.forEach(item => {
    if (!productData[item.productId]) {
      productData[item.productId] = { productName: item.product.name, quantitySold: 0, revenue: 0 };
    }
    productData[item.productId].quantitySold += item.quantity;
    productData[item.productId].revenue += parseFloat(item.total.toString());  // NOT totalPrice
  });

  return Object.values(productData).sort((a, b) => b.revenue - a.revenue);
}
```

### Module Structure

```
apps/api/src/modules/reports/
  sales-report.service.ts       (NEW — getSalesReport, getSalesByClient, getSalesByProduct)
  reports.controller.ts         (EXPAND — add sales report handlers)
  reports.routes.ts             (EXPAND — add GET /sales, /sales-by-client, /sales-by-product)

apps/web/src/features/reports/pages/
  SalesReportPage.tsx           (NEW)
```

### POST-MVP DEFERRED

- **Territory/region filtering**: No schema support. Add when sales territories are defined.
- **Sales officer "own sales" filtering**: Would require `createdBy` tracking on invoices + user FK. Defer.
- **Cursor-based pagination**: Offset pagination is sufficient at current scale.
- **Server-side caching with invalidation**: Use TanStack Query client-side caching.
