# Story 3.8: Payment History and Reports

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.8
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 2.10 (Supplier Payments), Story 3.6 (Client Payment Recording)
**Status:** Draft

---

## User Story

**As an** accountant,
**I want** to view comprehensive payment history and generate cash flow reports,
**So that** I can track all incoming/outgoing payments and analyze business cash flow.

---

## Acceptance Criteria

1. **Payment History View:**
   - [ ] Single unified view for both client and supplier payments
   - [ ] Filter by payment type (CLIENT, SUPPLIER, ALL)
   - [ ] Filter by date range
   - [ ] Filter by payment method (CASH, BANK_TRANSFER, CHEQUE)
   - [ ] **Search limited to name only** (not invoice/reference in MVP)
   - [ ] Pagination (20 records per page)
   - [ ] Overpayment credits displayed as **negative payment rows** (for client payments only)

2. **Payment Details Display:**
   - [ ] Date, Type (Client/Supplier), Party Name, Amount, Method, Reference, Recorded By
   - [ ] For client payments: show allocated invoices in collapsed table
   - [ ] For supplier payments: show linked purchase orders (from Story 2.10 schema)
   - [ ] Click to view full payment details modal with allocation breakdown
   - [ ] **Schema compatibility note:** Confirm Story 2.10 Payment table structure aligns with Story 3.6

3. **Cash Flow Report:**
   - [ ] GET /api/reports/cash-flow endpoint
   - [ ] Date range filter
   - [ ] Calculate total cash IN (sum of client payments, excluding overpayment adjustments)
   - [ ] Calculate total cash OUT (supplier payments + expenses)
   - [ ] Net cash flow = IN - OUT
   - [ ] **Daily/weekly/monthly breakdown OPTIONAL for MVP** (can be deferred if time-constrained)
   - [ ] Group by payment method (supplementary info)

4. **Payment Summary Cards:**
   - [ ] Total received from clients (period)
   - [ ] Total paid to suppliers (period)
   - [ ] Total expenses (period)
   - [ ] Net cash flow (period)

5. **Export Functionality:**
   - [ ] Export payment history to Excel
   - [ ] Export cash flow report to Excel/PDF
   - [ ] Include filters in export filename

6. **Backend API Endpoints:**
   - [ ] GET /api/payments - Returns all payments with filters
   - [ ] GET /api/payments/:id - Returns payment details with allocations/POs
   - [ ] GET /api/reports/cash-flow - Returns cash flow summary

7. **Authorization:**
   - [ ] All roles can view payment history and reports (read-only)
   - [ ] Only Admin and Accountant can export reports

8. **Audit Logging:**
   - [ ] Report generation logged (who accessed what report when)

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Unified Payments Query (AC: 1, 2)**
  - [ ] Extend `payments.service.ts`
  - [ ] Implement `getAllPayments()` with filters
  - [ ] Join with Client/Supplier for party name
  - [ ] Include allocations for client payments
  - [ ] Include PO references for supplier payments
  - [ ] Implement pagination

- [ ] **Task 2: Payment Details Service (AC: 2)**
  - [ ] Implement `getPaymentById(id)` method
  - [ ] Include all related data (allocations, invoices, POs, party info)

- [ ] **Task 3: Cash Flow Report Service (AC: 3)**
  - [ ] Create `cash-flow.service.ts`
  - [ ] Calculate total client payments (IN)
  - [ ] Calculate total supplier payments (OUT)
  - [ ] Fetch total expenses (OUT)
  - [ ] Calculate net cash flow
  - [ ] Group by payment method
  - [ ] Optional: breakdown by day/week/month

- [ ] **Task 4: Controller & Routes (AC: 6)**
  - [ ] Extend `payments.controller.ts`
  - [ ] Implement GET /api/payments (with filters)
  - [ ] Implement GET /api/payments/:id
  - [ ] Extend `reports.controller.ts`
  - [ ] Implement GET /api/reports/cash-flow

- [ ] **Task 5: Authorization & Audit (AC: 7, 8)**
  - [ ] Apply role guards
  - [ ] Add audit logging for report access

### Frontend Tasks

- [ ] **Task 6: Payment History Page (AC: 1, 2)**
  - [ ] Create `PaymentHistoryPage.tsx`
  - [ ] Filter controls: type, date range, method, search
  - [ ] Display payments in table
  - [ ] Click row to view details modal
  - [ ] Pagination

- [ ] **Task 7: Payment Details Modal (AC: 2)**
  - [ ] Create `PaymentDetailsModal.tsx`
  - [ ] Display full payment information
  - [ ] For client payments: show allocated invoices table
  - [ ] For supplier payments: show linked PO(s)

- [ ] **Task 8: Cash Flow Report Page (AC: 3, 4)**
  - [ ] Create `CashFlowReportPage.tsx`
  - [ ] Date range filter
  - [ ] Summary cards: Total IN, Total OUT, Net Flow
  - [ ] Payment method breakdown table
  - [ ] Optional: Chart visualization (bar/line chart)

- [ ] **Task 9: Export Functionality (AC: 5)**
  - [ ] Export payment history to Excel
  - [ ] Export cash flow report to Excel
  - [ ] Include filters in filename (e.g., "payments-2025-01-01-to-2025-01-31.xlsx")

- [ ] **Task 10: API Client & Hooks**
  - [ ] Extend `paymentsService.ts`
  - [ ] Create `reportsService.ts`
  - [ ] Create TanStack Query hooks

- [ ] **Task 11: Testing**
  - [ ] Backend tests (filters, cash flow calculation)
  - [ ] Frontend tests (filters, display, export)

---

## Dev Notes

### Database Query - Unified Payments

```typescript
interface PaymentFilters {
  paymentType?: 'CLIENT' | 'SUPPLIER' | 'ALL';
  dateFrom?: Date;
  dateTo?: Date;
  paymentMethod?: PaymentMethod;
  search?: string; // Client or Supplier name
  page?: number;
  limit?: number;
}

interface PaymentListItem {
  id: string;
  date: Date;
  type: 'CLIENT' | 'SUPPLIER';
  partyName: string;
  amount: number;
  method: PaymentMethod;
  reference: string;
  recordedBy: string;
  recordedByName: string;
}

async function getAllPayments(
  filters: PaymentFilters
): Promise<{ payments: PaymentListItem[]; total: number }> {
  const {
    paymentType = 'ALL',
    dateFrom,
    dateTo,
    paymentMethod,
    search,
    page = 1,
    limit = 20
  } = filters;

  const where: any = {};

  // Payment type filter
  if (paymentType !== 'ALL') {
    where.paymentType = paymentType;
  }

  // Date range filter
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = dateFrom;
    if (dateTo) where.date.lte = dateTo;
  }

  // Payment method filter
  if (paymentMethod) {
    where.method = paymentMethod;
  }

  // Fetch payments
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: {
        user: true,
        allocations: {
          include: {
            invoice: {
              include: {
                client: true
              }
            }
          }
        }
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.payment.count({ where })
  ]);

  // Transform to list items
  const listItems: PaymentListItem[] = await Promise.all(
    payments.map(async (payment) => {
      let partyName = '';

      if (payment.paymentType === 'CLIENT') {
        // Get client name from first allocation
        if (payment.allocations && payment.allocations.length > 0) {
          partyName = payment.allocations[0].invoice.client.name;
        } else if (payment.referenceId) {
          const client = await prisma.client.findUnique({
            where: { id: payment.referenceId }
          });
          partyName = client?.name || 'Unknown Client';
        }
      } else if (payment.paymentType === 'SUPPLIER') {
        // Get supplier name from referenceId
        if (payment.referenceId) {
          const supplier = await prisma.supplier.findUnique({
            where: { id: payment.referenceId }
          });
          partyName = supplier?.name || 'Unknown Supplier';
        }
      }

      return {
        id: payment.id,
        date: payment.date,
        type: payment.paymentType,
        partyName,
        amount: parseFloat(payment.amount.toString()),
        method: payment.method,
        reference: payment.notes || '',
        recordedBy: payment.recordedBy,
        recordedByName: payment.user.name
      };
    })
  );

  // Apply search filter (client/supplier name)
  let filteredItems = listItems;
  if (search) {
    const searchLower = search.toLowerCase();
    filteredItems = listItems.filter(item =>
      item.partyName.toLowerCase().includes(searchLower)
    );
  }

  return {
    payments: filteredItems,
    total: search ? filteredItems.length : total
  };
}
```

### Cash Flow Report Service

```typescript
interface CashFlowFilters {
  dateFrom: Date;
  dateTo: Date;
  breakdownBy?: 'DAY' | 'WEEK' | 'MONTH' | 'NONE';
}

interface CashFlowResult {
  totalCashIn: number;
  totalCashOut: number;
  netCashFlow: number;
  byPaymentMethod: Array<{
    method: PaymentMethod;
    cashIn: number;
    cashOut: number;
    net: number;
  }>;
  breakdown?: Array<{
    period: string; // e.g., "2025-01-15" or "2025-W03" or "2025-01"
    cashIn: number;
    cashOut: number;
    net: number;
  }>;
}

async function getCashFlowReport(filters: CashFlowFilters): Promise<CashFlowResult> {
  const { dateFrom, dateTo, breakdownBy = 'NONE' } = filters;

  // Fetch client payments (cash IN)
  const clientPayments = await prisma.payment.findMany({
    where: {
      paymentType: 'CLIENT',
      date: { gte: dateFrom, lte: dateTo }
    },
    select: { amount: true, method: true, date: true }
  });

  // Fetch supplier payments (cash OUT)
  const supplierPayments = await prisma.payment.findMany({
    where: {
      paymentType: 'SUPPLIER',
      date: { gte: dateFrom, lte: dateTo }
    },
    select: { amount: true, method: true, date: true }
  });

  // Fetch expenses (cash OUT)
  const expenses = await prisma.expense.findMany({
    where: {
      date: { gte: dateFrom, lte: dateTo }
    },
    select: { amount: true, paymentMethod: true, date: true }
  });

  // Calculate totals
  const totalCashIn = clientPayments.reduce(
    (sum, p) => sum + parseFloat(p.amount.toString()),
    0
  );

  const totalSupplierPayments = supplierPayments.reduce(
    (sum, p) => sum + parseFloat(p.amount.toString()),
    0
  );

  const totalExpenses = expenses.reduce(
    (sum, e) => sum + parseFloat(e.amount.toString()),
    0
  );

  const totalCashOut = totalSupplierPayments + totalExpenses;
  const netCashFlow = totalCashIn - totalCashOut;

  // Group by payment method
  const methodGroups: Record<PaymentMethod, { cashIn: number; cashOut: number }> = {
    CASH: { cashIn: 0, cashOut: 0 },
    BANK_TRANSFER: { cashIn: 0, cashOut: 0 },
    CHEQUE: { cashIn: 0, cashOut: 0 }
  };

  // Client payments (IN)
  clientPayments.forEach(p => {
    methodGroups[p.method].cashIn += parseFloat(p.amount.toString());
  });

  // Supplier payments (OUT)
  supplierPayments.forEach(p => {
    methodGroups[p.method].cashOut += parseFloat(p.amount.toString());
  });

  // Expenses (OUT)
  expenses.forEach(e => {
    methodGroups[e.paymentMethod].cashOut += parseFloat(e.amount.toString());
  });

  const byPaymentMethod = Object.entries(methodGroups).map(([method, data]) => ({
    method: method as PaymentMethod,
    cashIn: data.cashIn,
    cashOut: data.cashOut,
    net: data.cashIn - data.cashOut
  }));

  // Optional: breakdown by period
  let breakdown: Array<{ period: string; cashIn: number; cashOut: number; net: number }> | undefined;

  if (breakdownBy !== 'NONE') {
    // TODO: Implement daily/weekly/monthly breakdown
    // For MVP, this can be skipped and added later
  }

  return {
    totalCashIn,
    totalCashOut,
    netCashFlow,
    byPaymentMethod,
    breakdown
  };
}
```

### Payment Details Query

```typescript
interface PaymentDetails {
  id: string;
  type: 'CLIENT' | 'SUPPLIER';
  amount: number;
  method: PaymentMethod;
  date: Date;
  notes: string;
  recordedBy: string;
  recordedByName: string;
  createdAt: Date;

  // For client payments
  client?: {
    id: string;
    name: string;
  };
  allocations?: Array<{
    invoiceId: string;
    invoiceNumber: string;
    amount: number;
  }>;

  // For supplier payments
  supplier?: {
    id: string;
    name: string;
  };
  purchaseOrders?: Array<{
    poId: string;
    poNumber: string;
  }>;
}

async function getPaymentById(id: string): Promise<PaymentDetails | null> {
  const payment = await prisma.payment.findUnique({
    where: { id },
    include: {
      user: true,
      allocations: {
        include: {
          invoice: {
            include: {
              client: true
            }
          }
        }
      }
    }
  });

  if (!payment) return null;

  const details: PaymentDetails = {
    id: payment.id,
    type: payment.paymentType,
    amount: parseFloat(payment.amount.toString()),
    method: payment.method,
    date: payment.date,
    notes: payment.notes || '',
    recordedBy: payment.recordedBy,
    recordedByName: payment.user.name,
    createdAt: payment.createdAt
  };

  if (payment.paymentType === 'CLIENT') {
    // Add client and allocations
    if (payment.allocations && payment.allocations.length > 0) {
      details.client = {
        id: payment.allocations[0].invoice.client.id,
        name: payment.allocations[0].invoice.client.name
      };

      details.allocations = payment.allocations.map(alloc => ({
        invoiceId: alloc.invoice.id,
        invoiceNumber: alloc.invoice.invoiceNumber,
        amount: parseFloat(alloc.amount.toString())
      }));
    }
  } else if (payment.paymentType === 'SUPPLIER') {
    // Add supplier
    if (payment.referenceId) {
      const supplier = await prisma.supplier.findUnique({
        where: { id: payment.referenceId }
      });

      if (supplier) {
        details.supplier = {
          id: supplier.id,
          name: supplier.name
        };
      }

      // If referenceType is PO, find linked PO(s)
      if (payment.referenceType === 'PO') {
        const po = await prisma.purchaseOrder.findUnique({
          where: { id: payment.referenceId }
        });

        if (po) {
          details.purchaseOrders = [{
            poId: po.id,
            poNumber: po.poNumber
          }];
        }
      }
    }
  }

  return details;
}
```

### Frontend Implementation

**Payment History Page:**

```tsx
export const PaymentHistoryPage: FC = () => {
  const [filters, setFilters] = useState({
    paymentType: 'ALL',
    dateFrom: startOfMonth(new Date()),
    dateTo: endOfMonth(new Date()),
    paymentMethod: '',
    search: '',
    page: 1
  });

  const { data, isLoading } = useGetAllPayments(filters);
  const [selectedPaymentId, setSelectedPaymentId] = useState<string | null>(null);

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      data?.payments.map(p => ({
        Date: format(p.date, 'yyyy-MM-dd'),
        Type: p.type,
        'Party Name': p.partyName,
        Amount: p.amount,
        Method: p.method,
        Reference: p.reference,
        'Recorded By': p.recordedByName
      })) || []
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Payments');

    const filename = `payments-${format(filters.dateFrom, 'yyyy-MM-dd')}-to-${format(filters.dateTo, 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(workbook, filename);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Payment History</h1>
        <Button onClick={handleExport} disabled={!data || data.payments.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Select
              label="Payment Type"
              value={filters.paymentType}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentType: e.target.value, page: 1 }))}
            >
              <option value="ALL">All Payments</option>
              <option value="CLIENT">Client Payments (IN)</option>
              <option value="SUPPLIER">Supplier Payments (OUT)</option>
            </Select>

            <DatePicker
              label="From Date"
              value={filters.dateFrom}
              onChange={(date) => setFilters(prev => ({ ...prev, dateFrom: date, page: 1 }))}
            />

            <DatePicker
              label="To Date"
              value={filters.dateTo}
              onChange={(date) => setFilters(prev => ({ ...prev, dateTo: date, page: 1 }))}
            />

            <Select
              label="Payment Method"
              value={filters.paymentMethod}
              onChange={(e) => setFilters(prev => ({ ...prev, paymentMethod: e.target.value, page: 1 }))}
            >
              <option value="">All Methods</option>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </Select>
          </div>

          <div className="mt-4">
            <Input
              placeholder="Search by client or supplier name..."
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
            />
          </div>
        </Card.Body>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : (
        <>
          <Table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Party</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Reference</th>
                <th>Recorded By</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data?.payments.map(payment => (
                <tr key={payment.id} className="cursor-pointer hover:bg-gray-50">
                  <td>{format(payment.date, 'PPP')}</td>
                  <td>
                    <Badge variant={payment.type === 'CLIENT' ? 'success' : 'error'}>
                      {payment.type === 'CLIENT' ? 'IN' : 'OUT'}
                    </Badge>
                  </td>
                  <td>{payment.partyName}</td>
                  <td className={cn(
                    'font-semibold',
                    payment.type === 'CLIENT' ? 'text-green-600' : 'text-red-600'
                  )}>
                    {payment.type === 'CLIENT' ? '+' : '-'}Rs.{payment.amount.toFixed(2)}
                  </td>
                  <td>{payment.method}</td>
                  <td className="text-sm text-gray-600">{payment.reference || '-'}</td>
                  <td>{payment.recordedByName}</td>
                  <td>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={() => setSelectedPaymentId(payment.id)}
                    >
                      View Details
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>

          <Pagination
            currentPage={filters.page}
            totalPages={Math.ceil((data?.total || 0) / 20)}
            onPageChange={(page) => setFilters(prev => ({ ...prev, page }))}
          />
        </>
      )}

      {selectedPaymentId && (
        <PaymentDetailsModal
          paymentId={selectedPaymentId}
          onClose={() => setSelectedPaymentId(null)}
        />
      )}
    </div>
  );
};
```

**Cash Flow Report Page:**

```tsx
export const CashFlowReportPage: FC = () => {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const { data: cashFlow, isLoading } = useGetCashFlowReport(dateRange);

  const handleExport = () => {
    if (!cashFlow) return;

    const summaryData = [
      { Metric: 'Total Cash IN', Amount: `Rs.${cashFlow.totalCashIn.toFixed(2)}` },
      { Metric: 'Total Cash OUT', Amount: `Rs.${cashFlow.totalCashOut.toFixed(2)}` },
      { Metric: 'Net Cash Flow', Amount: `Rs.${cashFlow.netCashFlow.toFixed(2)}` }
    ];

    const methodData = cashFlow.byPaymentMethod.map(m => ({
      'Payment Method': m.method,
      'Cash IN': `Rs.${m.cashIn.toFixed(2)}`,
      'Cash OUT': `Rs.${m.cashOut.toFixed(2)}`,
      'Net': `Rs.${m.net.toFixed(2)}`
    }));

    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.json_to_sheet(summaryData);
    const ws2 = XLSX.utils.json_to_sheet(methodData);

    XLSX.utils.book_append_sheet(wb, ws1, 'Summary');
    XLSX.utils.book_append_sheet(wb, ws2, 'By Payment Method');

    const filename = `cash-flow-${format(dateRange.from, 'yyyy-MM-dd')}-to-${format(dateRange.to, 'yyyy-MM-dd')}.xlsx`;
    XLSX.writeFile(wb, filename);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Cash Flow Report</h1>
        <Button onClick={handleExport} disabled={!cashFlow}>
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="flex gap-4">
            <DatePicker
              label="From Date"
              value={dateRange.from}
              onChange={(date) => setDateRange(prev => ({ ...prev, from: date }))}
            />
            <DatePicker
              label="To Date"
              value={dateRange.to}
              onChange={(date) => setDateRange(prev => ({ ...prev, to: date }))}
            />
          </div>
        </Card.Body>
      </Card>

      {isLoading ? (
        <Spinner />
      ) : cashFlow ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <Card.Body>
                <div className="text-sm text-gray-600">Total Cash IN</div>
                <div className="text-2xl font-bold text-green-600 mt-2">
                  Rs.{cashFlow.totalCashIn.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Client payments received
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <div className="text-sm text-gray-600">Total Cash OUT</div>
                <div className="text-2xl font-bold text-red-600 mt-2">
                  Rs.{cashFlow.totalCashOut.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Supplier payments + Expenses
                </div>
              </Card.Body>
            </Card>

            <Card>
              <Card.Body>
                <div className="text-sm text-gray-600">Net Cash Flow</div>
                <div className={cn(
                  'text-2xl font-bold mt-2',
                  cashFlow.netCashFlow >= 0 ? 'text-green-600' : 'text-red-600'
                )}>
                  Rs.{cashFlow.netCashFlow.toFixed(2)}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  {cashFlow.netCashFlow >= 0 ? 'Positive' : 'Negative'} cash flow
                </div>
              </Card.Body>
            </Card>
          </div>

          <Card>
            <Card.Header>Cash Flow by Payment Method</Card.Header>
            <Card.Body>
              <Table>
                <thead>
                  <tr>
                    <th>Payment Method</th>
                    <th>Cash IN</th>
                    <th>Cash OUT</th>
                    <th>Net</th>
                  </tr>
                </thead>
                <tbody>
                  {cashFlow.byPaymentMethod.map(method => (
                    <tr key={method.method}>
                      <td className="font-medium">{method.method}</td>
                      <td className="text-green-600">Rs.{method.cashIn.toFixed(2)}</td>
                      <td className="text-red-600">Rs.{method.cashOut.toFixed(2)}</td>
                      <td className={cn(
                        'font-semibold',
                        method.net >= 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        Rs.{method.net.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </Card.Body>
          </Card>
        </>
      ) : (
        <Alert>No cash flow data found for selected period</Alert>
      )}
    </div>
  );
};
```

**TanStack Query Hooks:**

```typescript
export const useGetAllPayments = (filters: PaymentFilters) => {
  return useQuery({
    queryKey: ['allPayments', filters],
    queryFn: () => paymentsService.getAllPayments(filters)
  });
};

export const useGetPaymentDetails = (id: string) => {
  return useQuery({
    queryKey: ['paymentDetails', id],
    queryFn: () => paymentsService.getPaymentDetails(id),
    enabled: !!id
  });
};

export const useGetCashFlowReport = (dateRange: { from: Date; to: Date }) => {
  return useQuery({
    queryKey: ['cashFlowReport', dateRange],
    queryFn: () => reportsService.getCashFlowReport(dateRange)
  });
};
```

---

## Testing

### Backend Testing
- Unified payments query with filters
- Payment type filter (CLIENT, SUPPLIER, ALL)
- Date range filter
- Payment method filter
- Search by client/supplier name
- Cash flow calculation (IN, OUT, NET)
- Group by payment method accuracy
- Payment details with allocations/POs
- Audit logging for report access

### Frontend Testing
- Payment history display with filters
- Payment details modal (client vs supplier)
- Cash flow summary cards
- Payment method breakdown table
- Excel export functionality
- Filter combinations
- Pagination

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |

---

## Dev Agent Record

*To be populated by dev agent*

---

## QA Results

*To be populated by QA agent*
