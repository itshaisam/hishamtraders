# Story 6.10: Gate Pass Reports

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.10
**Priority:** Low
**Estimated Effort:** 4-6 hours
**Dependencies:** Story 6.2, Story 6.3
**Status:** Complete — Phase 2 (v3.0 — Implemented)

---

## User Story

**As a** warehouse manager,
**I want** gate pass reports showing issued, pending, and completed passes,
**So that** outbound shipment tracking is complete.

---

## Acceptance Criteria

1. **Backend API:**
   - [x] `GET /api/v1/reports/gate-passes` — activity report with pagination
   - [x] Filters: warehouseId, status, dateFrom, dateTo, purpose
   - [x] Shows: Gate Pass #, Date, Purpose, Reference, Status, Issued By, Approved By, Items Count, Total Quantity
   - [x] `GET /api/v1/reports/gate-passes/summary` — aggregate stats by status, purpose, warehouse

2. **Report Features:**
   - [x] Paginated results with sorting by date
   - [ ] Excel export deferred to post-MVP

3. **Frontend:**
   - [x] GatePassReportPage with summary cards (total, pending, approved, completed)
   - [x] Purpose breakdown section
   - [x] Comprehensive filters (warehouse, status, purpose, date range)
   - [x] Activity table with pagination

4. **Authorization:**
   - [x] All authenticated users can view reports

---

## Dev Notes

### Implementation Status

**Backend:** Complete. Service at `apps/api/src/modules/reports/gate-pass-report.service.ts`. Controller/routes extended in existing reports module.
**Frontend:** Complete. `apps/web/src/features/reports/pages/GatePassReportPage.tsx`. Route in App.tsx, sidebar entry added.

### Key Corrections

1. **API paths**: Use `/api/v1/reports/gate-passes` (not `/api/reports/gate-passes`)
2. **`Card.Body`** — Does NOT exist as a component. Use plain `<div className="p-6">` or `<Card padding="md">` wrapper.
3. **Excel export** — Use `exceljs` on the server side (same pattern as Story 4.9), not `XLSX` (xlsx/sheetjs) on the client.
4. **`gp.issuer.name`** — Requires `include: { issuer: true }` in the query. Verify User model has a `name` field.
5. **Frontend components** — Use existing components: `Card`, `Button`, `Badge`, `Table`, `Select`. No custom `DatePicker` exists — use standard `<input type="date">` or a date input component.

### Gate Pass Report Service

```typescript
interface GatePassReportFilters {
  warehouseId?: string;
  status?: GatePassStatus;
  dateFrom?: Date;
  dateTo?: Date;
  purpose?: GatePassPurpose;
}

async function getGatePassReport(filters: GatePassReportFilters) {
  const where: any = {};

  if (filters.warehouseId) where.warehouseId = filters.warehouseId;
  if (filters.status) where.status = filters.status;
  if (filters.purpose) where.purpose = filters.purpose;

  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = filters.dateFrom;
    if (filters.dateTo) where.date.lte = filters.dateTo;
  }

  const gatePasses = await prisma.gatePass.findMany({
    where,
    include: {
      warehouse: true,
      issuer: true,
      approver: true,
      items: true
    },
    orderBy: { date: 'desc' }
  });

  return gatePasses.map(gp => ({
    id: gp.id,
    gatePassNumber: gp.gatePassNumber,
    date: gp.date,
    warehouse: gp.warehouse.name,
    purpose: gp.purpose,
    referenceType: gp.referenceType,
    referenceId: gp.referenceId,
    status: gp.status,
    issuedBy: gp.issuer.name,
    approvedBy: gp.approver?.name || '-',
    itemsCount: gp.items.length,
    totalQuantity: gp.items.reduce((sum, item) => sum + item.quantity, 0)
  }));
}
```

### Gate Pass Details

```typescript
async function getGatePassDetails(gatePassId: string) {
  const gatePass = await prisma.gatePass.findUniqueOrThrow({
    where: { id: gatePassId },
    include: {
      warehouse: true,
      issuer: true,
      approver: true,
      items: { include: { product: true } }
    }
  });

  return {
    gatePassNumber: gatePass.gatePassNumber,
    date: gatePass.date,
    warehouse: gatePass.warehouse.name,
    purpose: gatePass.purpose,
    referenceType: gatePass.referenceType,
    referenceId: gatePass.referenceId,
    status: gatePass.status,
    issuedBy: gatePass.issuer.name,
    approvedBy: gatePass.approver?.name,
    notes: gatePass.notes,
    items: gatePass.items.map(item => ({
      productName: item.product.name,
      sku: item.product.sku,
      batchNo: item.batchNo,
      binLocation: item.binLocation,
      quantity: item.quantity,
      description: item.description
    }))
  };
}
```

### Frontend (Corrected — No Card.Body)

```tsx
export default function GatePassReportsPage() {
  const [filters, setFilters] = useState({
    warehouseId: '',
    status: '',
    dateFrom: '',
    dateTo: '',
    purpose: ''
  });

  const { data: gatePasses, isLoading } = useGatePassReport(filters);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gate Pass Reports</h1>
        <Button onClick={handleExport}>Export to Excel</Button>
      </div>

      {/* Filters — use Card component (no Card.Body) */}
      <Card className="mb-6">
        <div className="grid grid-cols-4 gap-4">
          <Select
            label="Warehouse"
            value={filters.warehouseId}
            onChange={(e) => setFilters(prev => ({ ...prev, warehouseId: e.target.value }))}
          >
            <option value="">All Warehouses</option>
          </Select>

          <Select
            label="Status"
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          >
            <option value="">All Statuses</option>
            <option value="PENDING">Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="COMPLETED">Completed</option>
          </Select>

          <input
            type="date"
            className="border rounded px-3 py-2"
            value={filters.dateFrom}
            onChange={(e) => setFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
          />

          <input
            type="date"
            className="border rounded px-3 py-2"
            value={filters.dateTo}
            onChange={(e) => setFilters(prev => ({ ...prev, dateTo: e.target.value }))}
          />
        </div>
      </Card>

      {/* Results table */}
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <table className="min-w-full divide-y divide-gray-200">
          {/* ... standard table markup ... */}
        </table>
      )}
    </div>
  );
}
```

### Module Structure

```
apps/api/src/modules/reports/
  gate-pass-report.service.ts   (NEW)
  reports.controller.ts         (EXPAND — add getGatePassReport, getGatePassDetails)
  reports.routes.ts             (EXPAND — add GET /gate-passes, GET /gate-passes/:id/details)

apps/web/src/features/reports/pages/
  GatePassReportsPage.tsx        (NEW)
```

### POST-MVP DEFERRED

- **PDF export**: For MVP, Excel only.
- **Aggregate summary stats** (total passes by status per month): Deferred.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), replaced Card.Body with plain Card+div, replaced XLSX with exceljs (Story 4.9 pattern), replaced DatePicker with input[type=date], noted User.name dependency | Claude (AI Review) |
| 2026-02-12 | 3.0     | Implemented: Backend activity report + summary endpoints, frontend report page with summary cards, filters, and paginated table. Excel export deferred. All feasible ACs marked complete. | Claude (AI Implementation) |
