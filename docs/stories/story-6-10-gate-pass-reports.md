# Story 6.10: Gate Pass Reports

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.10
**Priority:** Low
**Estimated Effort:** 4-6 hours
**Dependencies:** Story 6.2, Story 6.3
**Status:** Draft - Phase 2

---

## User Story

**As a** warehouse manager,
**I want** gate pass reports showing issued, pending, and completed passes,
**So that** outbound shipment tracking is complete.

---

## Acceptance Criteria

1. **Backend API:**
   - [ ] GET /api/reports/gate-passes - generates gate pass report
   - [ ] Filters: warehouseId, status, date range, purpose, referenceType
   - [ ] Shows: Gate Pass #, Date, Purpose, Reference, Status, Issued By, Approved By, Items Count, Total Quantity
   - [ ] GET /api/reports/gate-passes/:id/details - item-wise details

2. **Report Features:**
   - [ ] Sortable by date, status, warehouse
   - [ ] Exportable to Excel

3. **Frontend:**
   - [ ] Gate Pass Reports page with comprehensive filters
   - [ ] Display gate pass list with action buttons
   - [ ] Click gate pass # to view full details
   - [ ] Click reference # navigates to source document

4. **Authorization:**
   - [ ] All roles can view (read-only for non-warehouse roles)

---

## Dev Notes

```typescript
interface GatePassReportFilters {
  warehouseId?: string;
  status?: GatePassStatus;
  dateFrom?: Date;
  dateTo?: Date;
  purpose?: GatePassPurpose;
  referenceType?: string;
}

async function getGatePassReport(
  filters: GatePassReportFilters
): Promise<any[]> {
  const where: any = {};

  if (filters.warehouseId) {
    where.warehouseId = filters.warehouseId;
  }

  if (filters.status) {
    where.status = filters.status;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.date = {};
    if (filters.dateFrom) where.date.gte = filters.dateFrom;
    if (filters.dateTo) where.date.lte = filters.dateTo;
  }

  if (filters.purpose) {
    where.purpose = filters.purpose;
  }

  if (filters.referenceType) {
    where.referenceType = filters.referenceType;
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
    gatePassNumber: gp.gatePassNumber,
    date: gp.date,
    warehouse: gp.warehouse.name,
    purpose: gp.purpose,
    reference: `${gp.referenceType || ''} ${gp.referenceId || ''}`.trim(),
    status: gp.status,
    issuedBy: gp.issuer.name,
    approvedBy: gp.approver?.name || '-',
    itemsCount: gp.items.length,
    totalQuantity: gp.items.reduce((sum, item) => sum + item.quantity, 0)
  }));
}

async function getGatePassDetails(gatePassId: string): Promise<any> {
  const gatePass = await prisma.gatePass.findUnique({
    where: { id: gatePassId },
    include: {
      warehouse: true,
      issuer: true,
      approver: true,
      items: {
        include: { product: true }
      }
    }
  });

  return {
    gatePassNumber: gatePass!.gatePassNumber,
    date: gatePass!.date,
    warehouse: gatePass!.warehouse.name,
    purpose: gatePass!.purpose,
    referenceType: gatePass!.referenceType,
    referenceId: gatePass!.referenceId,
    status: gatePass!.status,
    issuedBy: gatePass!.issuer.name,
    approvedBy: gatePass!.approver?.name,
    notes: gatePass!.notes,
    items: gatePass!.items.map(item => ({
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

**Frontend:**
```tsx
export const GatePassReportsPage: FC = () => {
  const [filters, setFilters] = useState({
    warehouseId: '',
    status: '',
    dateFrom: startOfMonth(new Date()),
    dateTo: endOfMonth(new Date()),
    purpose: ''
  });

  const { data: gatePasses, isLoading } = useGetGatePassReport(filters);

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      gatePasses?.map(gp => ({
        'Gate Pass #': gp.gatePassNumber,
        Date: format(gp.date, 'yyyy-MM-dd'),
        Warehouse: gp.warehouse,
        Purpose: gp.purpose,
        Reference: gp.reference,
        Status: gp.status,
        'Issued By': gp.issuedBy,
        'Approved By': gp.approvedBy,
        'Items Count': gp.itemsCount,
        'Total Qty': gp.totalQuantity
      })) || []
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Gate Passes');
    XLSX.writeFile(workbook, `gate-passes-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Gate Pass Reports</h1>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="grid grid-cols-4 gap-4">
            <Select
              label="Warehouse"
              value={filters.warehouseId}
              onChange={(e) => setFilters(prev => ({ ...prev, warehouseId: e.target.value }))}
            >
              <option value="">All Warehouses</option>
              {/* Warehouse options */}
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

            <DatePicker
              label="From Date"
              value={filters.dateFrom}
              onChange={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
            />

            <DatePicker
              label="To Date"
              value={filters.dateTo}
              onChange={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
            />
          </div>
        </Card.Body>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Gate Pass #</th>
              <th>Date</th>
              <th>Warehouse</th>
              <th>Purpose</th>
              <th>Reference</th>
              <th>Status</th>
              <th>Issued By</th>
              <th>Items</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {gatePasses?.map(gp => (
              <tr key={gp.gatePassNumber}>
                <td>
                  <Link to={`/gate-passes/${gp.gatePassNumber}`}>
                    {gp.gatePassNumber}
                  </Link>
                </td>
                <td>{format(gp.date, 'PPP')}</td>
                <td>{gp.warehouse}</td>
                <td>{gp.purpose}</td>
                <td>{gp.reference}</td>
                <td>
                  <Badge variant={getStatusVariant(gp.status)}>
                    {gp.status}
                  </Badge>
                </td>
                <td>{gp.issuedBy}</td>
                <td>{gp.itemsCount} ({gp.totalQuantity} units)</td>
                <td>
                  <Button variant="link" size="sm">
                    View Details
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
