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
   - [ ] GET /api/reports/imports
   - [ ] Filters: date range, supplierId, status
   - [ ] Shows: PO #, Supplier, Container #, Ship Date, Arrival, Product Cost, Additional Costs, Total Landed Cost, Status
   - [ ] Landed cost breakdown per PO

2. **Supplier Performance:**
   - [ ] GET /api/suppliers/:id/po-summary
   - [ ] Shows: Total POs, Total Ordered Value, Total Paid, Outstanding

3. **Frontend:**
   - [ ] Import Reports page with filters
   - [ ] PO list with cost breakdown
   - [ ] Export to Excel

4. **Authorization:**
   - [ ] Accountant, Admin

---

## Dev Notes

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
      ...(filters.status && { status: filters.status })
    },
    include: {
      supplier: true,
      items: true,
      costs: true,
      payments: true
    }
  });

  return pos.map(po => {
    const productCost = parseFloat(po.totalCost.toString());
    const additionalCosts = po.costs.reduce(
      (sum, cost) => sum + parseFloat(cost.amount.toString()),
      0
    );
    const totalLandedCost = productCost + additionalCosts;

    return {
      poNumber: po.poNumber,
      supplier: po.supplier.name,
      containerNumber: po.containerNumber || 'N/A',
      shipDate: po.shipmentDate,
      arrivalDate: po.expectedArrival,
      productCost,
      shipping: po.costs.find(c => c.type === 'SHIPPING')?.amount || 0,
      customs: po.costs.find(c => c.type === 'CUSTOMS')?.amount || 0,
      tax: po.costs.find(c => c.type === 'TAX')?.amount || 0,
      totalLandedCost,
      status: po.status
    };
  });
}

async function getSupplierSummary(supplierId: string) {
  const pos = await prisma.purchaseOrder.findMany({
    where: { supplierId },
    include: { payments: true }
  });

  const totalPOs = pos.length;
  const totalOrderedValue = pos.reduce(
    (sum, po) => sum + parseFloat(po.totalCost.toString()),
    0
  );
  const totalPaid = pos.reduce((sum, po) => {
    return sum + po.payments.reduce(
      (pSum, payment) => pSum + parseFloat(payment.amount.toString()),
      0
    );
  }, 0);

  return {
    totalPOs,
    totalOrderedValue,
    totalPaid,
    outstanding: totalOrderedValue - totalPaid
  };
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
