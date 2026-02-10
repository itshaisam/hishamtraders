# Story 4.7: Import/Container Reports

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.7
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 2 (Import & Inventory)
**Status:** Draft

---

## User Story

**As an** accountant,
**I want** import cost analysis reports showing landed cost breakdown,
**So that** procurement costs and profitability can be understood.

---

## Acceptance Criteria

1. **Import Cost Report:**
   - [ ] `GET /api/v1/reports/imports` — import cost analysis
   - [ ] Filters: `dateFrom` (required), `dateTo` (required), `supplierId`, `status`
   - [ ] Shows: PO #, Supplier, Container #, Ship Date, Expected Arrival, Product Cost, Shipping, Customs, Tax, Other Costs, Total Landed Cost, Status
   - [ ] Summary: Total POs, Total product cost, Total additional costs, Total landed cost

2. **Supplier PO Summary:**
   - [ ] `GET /api/v1/reports/supplier-summary/:supplierId`
   - [ ] Shows: Total POs, Total Ordered Value, Total Paid, Outstanding

3. **Frontend:**
   - [ ] Import Reports page with filters
   - [ ] PO list with landed cost breakdown columns
   - [ ] Export to Excel (Story 4.9)
   - [ ] Empty state when no results

4. **Authorization:**
   - [ ] `ACCOUNTANT`: Full import cost data access
   - [ ] `ADMIN`: Full access
   - [ ] `WAREHOUSE_MANAGER`: Read-only (PO status and dates, no cost data)
   - [ ] Other roles: 403 Forbidden

5. **Performance:**
   - [ ] Offset-based pagination: default `limit=50`, max `limit=100`
   - [ ] TanStack Query with `staleTime: 600000` (10 min — import data changes infrequently)
   - [ ] Date range validation: `dateFrom <= dateTo`, max 1 year span

---

## Dev Notes

### Implementation Status

**Backend:** No import report service exists. Reports module at `apps/api/src/modules/reports/`.

**Frontend:** No import report page exists.

**Route registration:** Add to `apps/api/src/modules/reports/reports.routes.ts`.

### Schema Field Reference

```
PurchaseOrder: id, poNumber, supplierId, status (POStatus: PENDING | IN_TRANSIT | RECEIVED | CANCELLED),
               totalAmount (NOT totalCost), containerNo (NOT containerNumber),
               shipDate (NOT shipmentDate), expectedArrivalDate (NOT expectedArrival),
               createdAt
               supplier → Supplier relation
               items → POItem[] relation
               costs → POCost[] relation
               (NO payments relation — query Payment model separately)

POCost:        id, poId, type (POCostType: SHIPPING | CUSTOMS | TAX | OTHER), amount, description
               purchaseOrder → PurchaseOrder relation

POItem:        id, poId, productId, quantity, unitCost, totalCost
               product → Product relation

Payment:       paymentType (SUPPLIER | CLIENT), paymentReferenceType, referenceId, amount
               (query WHERE paymentType='SUPPLIER' AND paymentReferenceType='PO' AND referenceId=po.id)
```

### Key Corrections from Original Doc

1. **`po.totalCost` does NOT exist** — The field is `po.totalAmount`:
   ```typescript
   const productCost = parseFloat(po.totalAmount.toString());
   ```

2. **`po.payments` relation does NOT exist** — Query `Payment` model separately:
   ```typescript
   const payments = await prisma.payment.groupBy({
     by: ['referenceId'],
     where: { paymentType: 'SUPPLIER', paymentReferenceType: 'PO', referenceId: { in: poIds } },
     _sum: { amount: true },
   });
   ```

3. **`po.containerNumber` → `po.containerNo`**
4. **`po.shipmentDate` → `po.shipDate`**
5. **`po.expectedArrival` → `po.expectedArrivalDate`**

6. **API path** is `/api/v1/reports/imports` (not `/api/reports/imports`).

### Import Cost Report (Correct)
```typescript
async function getImportCostReport(filters: {
  dateFrom: Date;
  dateTo: Date;
  supplierId?: string;
  status?: POStatus;
}) {
  const pos = await prisma.purchaseOrder.findMany({
    where: {
      createdAt: { gte: filters.dateFrom, lte: filters.dateTo },
      ...(filters.supplierId && { supplierId: filters.supplierId }),
      ...(filters.status && { status: filters.status }),
    },
    include: {
      supplier: { select: { name: true } },
      costs: true,  // POCost[] — type: SHIPPING | CUSTOMS | TAX | OTHER
    },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  });

  return pos.map(po => {
    const productCost = parseFloat(po.totalAmount.toString());  // NOT totalCost
    const additionalCosts = po.costs.reduce(
      (sum, cost) => sum + parseFloat(cost.amount.toString()), 0
    );

    return {
      poNumber: po.poNumber,
      supplier: po.supplier.name,
      containerNo: po.containerNo || 'N/A',     // NOT containerNumber
      shipDate: po.shipDate,                      // NOT shipmentDate
      expectedArrivalDate: po.expectedArrivalDate, // NOT expectedArrival
      productCost,
      shipping: parseFloat(po.costs.find(c => c.type === 'SHIPPING')?.amount?.toString() || '0'),
      customs: parseFloat(po.costs.find(c => c.type === 'CUSTOMS')?.amount?.toString() || '0'),
      tax: parseFloat(po.costs.find(c => c.type === 'TAX')?.amount?.toString() || '0'),
      otherCosts: parseFloat(
        po.costs.filter(c => c.type === 'OTHER')
          .reduce((sum, c) => sum + parseFloat(c.amount.toString()), 0).toString()
      ),
      totalLandedCost: productCost + additionalCosts,
      status: po.status,
    };
  });
}
```

### Supplier PO Summary (Correct — no po.payments)
```typescript
async function getSupplierSummary(supplierId: string) {
  const pos = await prisma.purchaseOrder.findMany({
    where: { supplierId, status: { not: 'CANCELLED' } },
    select: { id: true, totalAmount: true },
  });

  const poIds = pos.map(p => p.id);

  // Query payments separately — PO has NO payments relation
  const paidAmounts = await prisma.payment.groupBy({
    by: ['referenceId'],
    where: {
      paymentType: 'SUPPLIER',
      paymentReferenceType: 'PO',
      referenceId: { in: poIds },
    },
    _sum: { amount: true },
  });

  const totalOrderedValue = pos.reduce(
    (sum, po) => sum + parseFloat(po.totalAmount.toString()), 0  // NOT totalCost
  );
  const totalPaid = paidAmounts.reduce(
    (sum, p) => sum + parseFloat(p._sum.amount?.toString() || '0'), 0
  );

  return {
    totalPOs: pos.length,
    totalOrderedValue,
    totalPaid,
    outstanding: totalOrderedValue - totalPaid,
  };
}
```

### Module Structure

```
apps/api/src/modules/reports/
  import-report.service.ts      (NEW — getImportCostReport, getSupplierSummary)
  reports.controller.ts         (EXPAND — add import report handlers)
  reports.routes.ts             (EXPAND — add GET /imports, GET /supplier-summary/:supplierId)

apps/web/src/features/reports/pages/
  ImportReportPage.tsx          (NEW)
```

### POST-MVP DEFERRED

- **Landed cost caching**: Not needed — POCost is small data, recalculating is trivial.
- **Server-side cache invalidation**: Use TanStack Query client-side caching.
- **Warehouse Manager cost access**: For MVP, WM sees PO status only. Full cost visibility deferred to role refinement.
