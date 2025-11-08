# Story 3.6: Client Payment Recording

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.6
**Priority:** Critical
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 3.2 (Sales Invoice Creation), Story 3.1 (Client Management)
**Status:** Draft

---

## User Story

**As an** accountant,
**I want** to record payments received from clients and allocate them to outstanding invoices,
**So that** client balances are accurate and payment history is tracked.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Payment table exists (shared with supplier payments from Story 2.10)
   - [ ] PaymentAllocation table: id, paymentId, invoiceId, amount, createdAt
   - [ ] Payment type CLIENT differentiated from SUPPLIER

2. **Payment Allocation Logic:**
   - [ ] Payment allocated to invoices AUTOMATICALLY using FIFO (oldest unpaid first)
   - [ ] **No manual allocation in MVP** (always auto-allocate FIFO)
   - [ ] Invoice status updated: PENDING → PARTIAL (if partiallyPaid) → PAID (if fully paid)
   - [ ] **Overpayment handling: Store as NEGATIVE client balance** (e.g., balance = -$10 means $10 credit)
   - [ ] **Overpayment credits must be used for future invoices** (cannot be refunded, only applied)
   - [ ] **Allocation is ONE-WAY, not reversible** (allocated payments cannot be un-allocated)

3. **Backend API Endpoints:**
   - [ ] POST /api/payments/client - Creates client payment with allocations
   - [ ] GET /api/payments/client - Returns client payment history with filters
   - [ ] GET /api/clients/:id/payments - Returns payment history for specific client
   - [ ] GET /api/clients/:id/outstanding-invoices - Returns unpaid/partial invoices

4. **Payment Validation:**
   - [ ] Payment amount must be > 0
   - [ ] If payment method is CHEQUE or BANK_TRANSFER, reference number required (format not validated for MVP)
   - [ ] Payment date cannot be in future (max date = today)
   - [ ] Payment date cannot be before earliest unpaid invoice date
   - [ ] Cannot allocate to VOIDED invoices
   - [ ] Cannot allocate to PAID invoices (already fully allocated)

5. **Client Balance Calculation:**
   - [ ] **Balance = SUM(unpaid invoice totals) - SUM(payment allocations) - SUM(credit adjustments)**
   - [ ] Negative balance means client has CREDIT (overpayment)
   - [ ] Positive balance means client OWES
   - [ ] Balance must be recalculated after each payment allocation (atomic transaction)

6. **Frontend Pages:**
   - [ ] Record Client Payment page with client selection
   - [ ] Display client outstanding invoices when client selected
   - [ ] Allocation mode selector: Automatic (FIFO) or Manual
   - [ ] Manual mode: checkbox selection of invoices with amount inputs
   - [ ] Display total allocated vs payment amount
   - [ ] Payment history table with filters

6. **Authorization:**
   - [ ] Only Accountant and Admin can record client payments
   - [ ] All roles can view payment history (read-only)

7. **Audit Logging:**
   - [ ] Client payments logged in audit trail with allocation details

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Payment Allocation Model (AC: 1)**
  - [ ] Create PaymentAllocation model
  - [ ] Fields: id, paymentId, invoiceId, amount, createdAt
  - [ ] Run migration

- [ ] **Task 2: Payment Allocation Service (AC: 2)**
  - [ ] Create `payment-allocation.service.ts`
  - [ ] Implement FIFO allocation algorithm
  - [ ] Implement manual allocation
  - [ ] Update invoice status based on allocation
  - [ ] Handle overpayment (store as advance)

- [ ] **Task 3: Client Payment Service (AC: 2, 4)**
  - [ ] Extend `payments.service.ts`
  - [ ] Implement `createClientPayment(data)` method
  - [ ] Validate payment amount
  - [ ] Validate allocations don't exceed payment
  - [ ] Validate CHEQUE/BANK_TRANSFER requires reference
  - [ ] Update client balance

- [ ] **Task 4: Controller & Routes (AC: 3)**
  - [ ] Extend `payments.controller.ts`
  - [ ] Implement POST /api/payments/client
  - [ ] Implement GET /api/payments/client (with filters)
  - [ ] Extend `clients.controller.ts` for GET /api/clients/:id/payments
  - [ ] Implement GET /api/clients/:id/outstanding-invoices

- [ ] **Task 5: Invoice Status Update (AC: 2)**
  - [ ] Calculate invoice paid amount (sum of allocations)
  - [ ] Update status: UNPAID (paid=0), PARTIAL (0<paid<total), PAID (paid=total)

- [ ] **Task 6: Authorization & Audit (AC: 6, 7)**
  - [ ] Apply role guards
  - [ ] Add audit logging with allocation details

### Frontend Tasks

- [ ] **Task 7: Payment Types & API Client**
  - [ ] Extend `payment.types.ts`
  - [ ] Extend `paymentsService.ts`
  - [ ] Create TanStack Query hooks

- [ ] **Task 8: Record Client Payment Form (AC: 5)**
  - [ ] Create `RecordClientPaymentPage.tsx`
  - [ ] Form fields: client (dropdown), payment amount, payment method, reference/notes, payment date
  - [ ] Allocation mode selector: Automatic (FIFO) / Manual
  - [ ] Display outstanding invoices when client selected

- [ ] **Task 9: Automatic Allocation Display (AC: 2)**
  - [ ] Show preview of FIFO allocation
  - [ ] Table: Invoice # | Date | Total | Outstanding | Will Be Allocated
  - [ ] Highlight which invoices will be fully/partially paid

- [ ] **Task 10: Manual Allocation Interface (AC: 2, 5)**
  - [ ] Checkbox selection for invoices
  - [ ] Amount input for each selected invoice (default: outstanding amount)
  - [ ] Real-time validation: total allocated ≤ payment amount
  - [ ] Display remaining unallocated amount

- [ ] **Task 11: Client Payment History (AC: 3)**
  - [ ] Create `ClientPaymentsPage.tsx`
  - [ ] Display payments in table: Date | Client | Amount | Method | Reference | Invoices Paid | Recorded By
  - [ ] Filters: client, date range, payment method
  - [ ] Pagination

- [ ] **Task 12: Client Detail Page Integration**
  - [ ] Add "Payments" tab to client detail page
  - [ ] Display payment history for that client
  - [ ] Display total paid, outstanding balance
  - [ ] Link to record payment

- [ ] **Task 13: Testing**
  - [ ] Backend tests (FIFO allocation, manual allocation, overpayment, status update)
  - [ ] Frontend tests (form validation, allocation display, history)

---

## Dev Notes

### Database Schema (Prisma)

**PaymentAllocation Model:**

```prisma
model PaymentAllocation {
  id         String   @id @default(cuid())
  paymentId  String
  invoiceId  String
  amount     Decimal  @db.Decimal(12, 2)
  createdAt  DateTime @default(now())

  payment    Payment  @relation(fields: [paymentId], references: [id])
  invoice    Invoice  @relation(fields: [invoiceId], references: [id])

  @@index([paymentId, invoiceId])
  @@map("payment_allocations")
}
```

**Payment Model Extension:**

```prisma
model Payment {
  id            String         @id @default(cuid())
  paymentType   PaymentType
  referenceType ReferenceType?
  referenceId   String?        // Supplier ID or Client ID
  amount        Decimal        @db.Decimal(12, 2)
  method        PaymentMethod
  date          DateTime
  notes         String?        @db.Text
  recordedBy    String

  createdAt     DateTime       @default(now())

  user          User           @relation(fields: [recordedBy], references: [id])
  allocations   PaymentAllocation[] // NEW: for client payment allocations

  @@index([paymentType, referenceType, referenceId])
  @@map("payments")
}

enum PaymentType {
  SUPPLIER
  CLIENT
}

enum ReferenceType {
  PO
  INVOICE
  GENERAL
  CLIENT  // NEW: for client payments
}

enum PaymentMethod {
  CASH
  BANK_TRANSFER
  CHEQUE
}
```

**Invoice Model Extension:**

```prisma
model Invoice {
  // ... existing fields

  allocations   PaymentAllocation[]

  @@map("invoices")
}
```

### FIFO Payment Allocation Algorithm

```typescript
interface AllocationDto {
  invoiceId: string;
  amount: number;
}

interface FIFOAllocationResult {
  allocations: AllocationDto[];
  totalAllocated: number;
  remainingAmount: number;
}

async function allocatePaymentFIFO(
  clientId: string,
  paymentAmount: number
): Promise<FIFOAllocationResult> {
  // Fetch outstanding invoices (FIFO: oldest first)
  const outstandingInvoices = await prisma.invoice.findMany({
    where: {
      clientId,
      status: { in: ['UNPAID', 'PARTIAL'] }
    },
    include: {
      allocations: true
    },
    orderBy: { invoiceDate: 'asc' } // FIFO: oldest first
  });

  let remainingAmount = paymentAmount;
  const allocations: AllocationDto[] = [];

  for (const invoice of outstandingInvoices) {
    if (remainingAmount <= 0) break;

    // Calculate outstanding amount for this invoice
    const totalInvoice = parseFloat(invoice.total.toString());
    const totalAllocated = invoice.allocations.reduce(
      (sum, alloc) => sum + parseFloat(alloc.amount.toString()),
      0
    );
    const outstanding = totalInvoice - totalAllocated;

    if (outstanding <= 0) continue;

    // Allocate as much as possible to this invoice
    const amountToAllocate = Math.min(remainingAmount, outstanding);

    allocations.push({
      invoiceId: invoice.id,
      amount: amountToAllocate
    });

    remainingAmount -= amountToAllocate;
  }

  return {
    allocations,
    totalAllocated: paymentAmount - remainingAmount,
    remainingAmount
  };
}
```

### Create Client Payment Service

```typescript
interface CreateClientPaymentDto {
  clientId: string;
  amount: number;
  method: PaymentMethod;
  date: Date;
  notes?: string;
  allocationMode: 'AUTO' | 'MANUAL';
  manualAllocations?: AllocationDto[]; // Required if mode = MANUAL
}

async function createClientPayment(
  data: CreateClientPaymentDto,
  userId: string
): Promise<Payment> {
  // Validate amount
  if (data.amount <= 0) {
    throw new BadRequestError('Payment amount must be greater than 0');
  }

  // Validate reference for CHEQUE/BANK_TRANSFER
  if (['CHEQUE', 'BANK_TRANSFER'].includes(data.method)) {
    if (!data.notes || data.notes.trim().length === 0) {
      throw new BadRequestError('Reference number required for cheque or bank transfer');
    }
  }

  // Determine allocations
  let allocations: AllocationDto[];
  let remainingAmount: number;

  if (data.allocationMode === 'AUTO') {
    const fifoResult = await allocatePaymentFIFO(data.clientId, data.amount);
    allocations = fifoResult.allocations;
    remainingAmount = fifoResult.remainingAmount;
  } else {
    // Manual allocations
    if (!data.manualAllocations || data.manualAllocations.length === 0) {
      throw new BadRequestError('Manual allocations required for MANUAL mode');
    }

    allocations = data.manualAllocations;

    // Validate total doesn't exceed payment amount
    const totalAllocated = allocations.reduce((sum, a) => sum + a.amount, 0);
    if (totalAllocated > data.amount) {
      throw new BadRequestError('Allocated amount exceeds payment amount');
    }

    remainingAmount = data.amount - totalAllocated;
  }

  // Validate allocations don't exceed invoice outstanding
  for (const allocation of allocations) {
    const invoice = await prisma.invoice.findUnique({
      where: { id: allocation.invoiceId },
      include: { allocations: true }
    });

    if (!invoice) {
      throw new NotFoundError(`Invoice ${allocation.invoiceId} not found`);
    }

    if (invoice.status === 'VOIDED') {
      throw new BadRequestError(`Cannot allocate to voided invoice ${invoice.invoiceNumber}`);
    }

    const totalInvoice = parseFloat(invoice.total.toString());
    const totalAllocated = invoice.allocations.reduce(
      (sum, alloc) => sum + parseFloat(alloc.amount.toString()),
      0
    );
    const outstanding = totalInvoice - totalAllocated;

    if (allocation.amount > outstanding) {
      throw new BadRequestError(
        `Allocation to invoice ${invoice.invoiceNumber} exceeds outstanding amount`
      );
    }
  }

  // Create payment with allocations in transaction
  return await prisma.$transaction(async (tx) => {
    // Create payment
    const payment = await tx.payment.create({
      data: {
        paymentType: 'CLIENT',
        referenceType: 'CLIENT',
        referenceId: data.clientId,
        amount: data.amount,
        method: data.method,
        date: data.date,
        notes: data.notes,
        recordedBy: userId
      }
    });

    // Create allocations
    for (const allocation of allocations) {
      await tx.paymentAllocation.create({
        data: {
          paymentId: payment.id,
          invoiceId: allocation.invoiceId,
          amount: allocation.amount
        }
      });
    }

    // Update invoice statuses
    for (const allocation of allocations) {
      const invoice = await tx.invoice.findUnique({
        where: { id: allocation.invoiceId },
        include: { allocations: true }
      });

      if (!invoice) continue;

      const totalInvoice = parseFloat(invoice.total.toString());
      const totalAllocated = invoice.allocations.reduce(
        (sum, alloc) => sum + parseFloat(alloc.amount.toString()),
        0
      ) + allocation.amount; // Include new allocation

      let newStatus: InvoiceStatus;
      if (totalAllocated >= totalInvoice) {
        newStatus = 'PAID';
      } else if (totalAllocated > 0) {
        newStatus = 'PARTIAL';
      } else {
        newStatus = 'UNPAID';
      }

      await tx.invoice.update({
        where: { id: allocation.invoiceId },
        data: { status: newStatus }
      });
    }

    // Update client balance
    const client = await tx.client.findUnique({
      where: { id: data.clientId }
    });

    if (client) {
      const currentBalance = parseFloat(client.balance.toString());
      const newBalance = currentBalance - data.amount;

      await tx.client.update({
        where: { id: data.clientId },
        data: { balance: Math.max(0, newBalance) }
      });
    }

    // Log audit
    await auditLogger.log({
      action: 'CLIENT_PAYMENT_RECORDED',
      userId,
      resource: 'Payment',
      resourceId: payment.id,
      details: {
        clientId: data.clientId,
        amount: data.amount,
        method: data.method,
        allocations: allocations.map(a => ({
          invoiceId: a.invoiceId,
          amount: a.amount
        })),
        remainingAmount
      }
    });

    return payment;
  });
}
```

### Get Outstanding Invoices

```typescript
interface OutstandingInvoiceDto {
  id: string;
  invoiceNumber: string;
  invoiceDate: Date;
  total: number;
  allocated: number;
  outstanding: number;
  status: InvoiceStatus;
}

async function getOutstandingInvoices(
  clientId: string
): Promise<OutstandingInvoiceDto[]> {
  const invoices = await prisma.invoice.findMany({
    where: {
      clientId,
      status: { in: ['UNPAID', 'PARTIAL'] }
    },
    include: {
      allocations: true
    },
    orderBy: { invoiceDate: 'asc' }
  });

  return invoices.map(invoice => {
    const total = parseFloat(invoice.total.toString());
    const allocated = invoice.allocations.reduce(
      (sum, alloc) => sum + parseFloat(alloc.amount.toString()),
      0
    );
    const outstanding = total - allocated;

    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      invoiceDate: invoice.invoiceDate,
      total,
      allocated,
      outstanding,
      status: invoice.status
    };
  });
}
```

### Validation Schema

```typescript
const createClientPaymentSchema = z.object({
  clientId: z.string().min(1, 'Client is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE']),
  date: z.date(),
  notes: z.string().optional(),
  allocationMode: z.enum(['AUTO', 'MANUAL']),
  manualAllocations: z.array(z.object({
    invoiceId: z.string(),
    amount: z.number().positive()
  })).optional()
}).refine(data => {
  // If method is CHEQUE or BANK_TRANSFER, notes (reference) must be provided
  if (['CHEQUE', 'BANK_TRANSFER'].includes(data.method)) {
    return !!data.notes && data.notes.length > 0;
  }
  return true;
}, {
  message: 'Reference number required for cheque or bank transfer',
  path: ['notes']
}).refine(data => {
  // If manual mode, allocations required
  if (data.allocationMode === 'MANUAL') {
    return data.manualAllocations && data.manualAllocations.length > 0;
  }
  return true;
}, {
  message: 'Manual allocations required for MANUAL mode',
  path: ['manualAllocations']
});
```

### Frontend Implementation

**Record Client Payment Form:**

```tsx
export const RecordClientPaymentPage: FC = () => {
  const [clientId, setClientId] = useState('');
  const [paymentAmount, setPaymentAmount] = useState(0);
  const [allocationMode, setAllocationMode] = useState<'AUTO' | 'MANUAL'>('AUTO');
  const [manualAllocations, setManualAllocations] = useState<Record<string, number>>({});

  const { data: clients } = useGetClients();
  const { data: outstandingInvoices } = useGetOutstandingInvoices(clientId, {
    enabled: !!clientId
  });
  const createPaymentMutation = useCreateClientPayment();

  // Calculate FIFO preview for AUTO mode
  const fifoPreview = useMemo(() => {
    if (allocationMode !== 'AUTO' || !outstandingInvoices) return [];

    let remaining = paymentAmount;
    return outstandingInvoices.map(invoice => {
      const willAllocate = Math.min(remaining, invoice.outstanding);
      remaining -= willAllocate;
      return { ...invoice, willAllocate };
    }).filter(inv => inv.willAllocate > 0);
  }, [allocationMode, paymentAmount, outstandingInvoices]);

  // Calculate total allocated for MANUAL mode
  const totalAllocated = useMemo(() => {
    return Object.values(manualAllocations).reduce((sum, amt) => sum + amt, 0);
  }, [manualAllocations]);

  const handleSubmit = (data: any) => {
    const payload: CreateClientPaymentDto = {
      clientId,
      amount: paymentAmount,
      method: data.method,
      date: data.date,
      notes: data.notes,
      allocationMode,
      manualAllocations: allocationMode === 'MANUAL'
        ? Object.entries(manualAllocations).map(([invoiceId, amount]) => ({
            invoiceId,
            amount
          }))
        : undefined
    };

    createPaymentMutation.mutate(payload);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Record Client Payment</h1>

      <Form onSubmit={handleSubmit}>
        <Card className="mb-6">
          <Card.Header>Payment Details</Card.Header>
          <Card.Body className="space-y-4">
            <Select
              label="Client"
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              required
            >
              <option value="">Select client...</option>
              {clients?.map(client => (
                <option key={client.id} value={client.id}>
                  {client.name} (Balance: Rs.{client.balance.toFixed(2)})
                </option>
              ))}
            </Select>

            <Input
              type="number"
              label="Payment Amount"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(parseFloat(e.target.value))}
              step="0.01"
              min="0.01"
              required
            />

            <Select label="Payment Method" name="method" required>
              <option value="CASH">Cash</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CHEQUE">Cheque</option>
            </Select>

            <Input
              label="Reference Number (for Cheque/Bank Transfer)"
              name="notes"
              placeholder="Cheque number or transaction reference"
            />

            <DatePicker
              label="Payment Date"
              name="date"
              defaultValue={new Date()}
              required
            />
          </Card.Body>
        </Card>

        {clientId && outstandingInvoices && outstandingInvoices.length > 0 && (
          <Card className="mb-6">
            <Card.Header>
              <div className="flex items-center justify-between">
                <span>Invoice Allocation</span>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant={allocationMode === 'AUTO' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setAllocationMode('AUTO')}
                  >
                    Automatic (FIFO)
                  </Button>
                  <Button
                    type="button"
                    variant={allocationMode === 'MANUAL' ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => setAllocationMode('MANUAL')}
                  >
                    Manual
                  </Button>
                </div>
              </div>
            </Card.Header>
            <Card.Body>
              {allocationMode === 'AUTO' ? (
                <div>
                  <Alert variant="info" className="mb-4">
                    Payment will be automatically allocated to oldest invoices first (FIFO).
                  </Alert>

                  <Table>
                    <thead>
                      <tr>
                        <th>Invoice #</th>
                        <th>Date</th>
                        <th>Total</th>
                        <th>Outstanding</th>
                        <th>Will Allocate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {fifoPreview.map(invoice => (
                        <tr key={invoice.id} className="bg-green-50">
                          <td>{invoice.invoiceNumber}</td>
                          <td>{format(invoice.invoiceDate, 'PPP')}</td>
                          <td>Rs.{invoice.total.toFixed(2)}</td>
                          <td>Rs.{invoice.outstanding.toFixed(2)}</td>
                          <td className="font-bold text-green-600">
                            Rs.{invoice.willAllocate.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ) : (
                <div>
                  <Alert variant="info" className="mb-4">
                    Select invoices and enter amounts to allocate manually.
                  </Alert>

                  <Table>
                    <thead>
                      <tr>
                        <th>Select</th>
                        <th>Invoice #</th>
                        <th>Date</th>
                        <th>Outstanding</th>
                        <th>Allocate Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outstandingInvoices.map(invoice => (
                        <tr key={invoice.id}>
                          <td>
                            <Checkbox
                              checked={invoice.id in manualAllocations}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setManualAllocations(prev => ({
                                    ...prev,
                                    [invoice.id]: invoice.outstanding
                                  }));
                                } else {
                                  setManualAllocations(prev => {
                                    const { [invoice.id]: _, ...rest } = prev;
                                    return rest;
                                  });
                                }
                              }}
                            />
                          </td>
                          <td>{invoice.invoiceNumber}</td>
                          <td>{format(invoice.invoiceDate, 'PPP')}</td>
                          <td>Rs.{invoice.outstanding.toFixed(2)}</td>
                          <td>
                            {invoice.id in manualAllocations && (
                              <Input
                                type="number"
                                value={manualAllocations[invoice.id]}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value);
                                  if (value <= invoice.outstanding) {
                                    setManualAllocations(prev => ({
                                      ...prev,
                                      [invoice.id]: value
                                    }));
                                  }
                                }}
                                step="0.01"
                                min="0.01"
                                max={invoice.outstanding}
                                size="sm"
                              />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <div className="mt-4 flex justify-between items-center">
                    <div>
                      <strong>Total Allocated:</strong> Rs.{totalAllocated.toFixed(2)}
                    </div>
                    <div>
                      <strong>Remaining:</strong> Rs.{(paymentAmount - totalAllocated).toFixed(2)}
                    </div>
                    {totalAllocated > paymentAmount && (
                      <Alert variant="error" size="sm">
                        Allocated amount exceeds payment!
                      </Alert>
                    )}
                  </div>
                </div>
              )}
            </Card.Body>
          </Card>
        )}

        <Button
          type="submit"
          loading={createPaymentMutation.isPending}
          disabled={!clientId || paymentAmount <= 0}
        >
          Record Payment
        </Button>
      </Form>
    </div>
  );
};
```

**TanStack Query Hooks:**

```typescript
export const useGetOutstandingInvoices = (
  clientId: string,
  options?: { enabled?: boolean }
) => {
  return useQuery({
    queryKey: ['outstandingInvoices', clientId],
    queryFn: () => clientsService.getOutstandingInvoices(clientId),
    enabled: options?.enabled
  });
};

export const useCreateClientPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateClientPaymentDto) =>
      paymentsService.createClientPayment(data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['clientPayments'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['outstandingInvoices', variables.clientId] });
      toast.success('Client payment recorded successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to record payment');
    },
  });
};
```

---

## Testing

### Backend Testing
- FIFO allocation algorithm (oldest invoice first)
- Manual allocation validation (total ≤ payment amount)
- Invoice status update (UNPAID → PARTIAL → PAID)
- Overpayment handling
- Cannot allocate to VOIDED invoice
- Client balance reduction
- Reference required for CHEQUE/BANK_TRANSFER
- Audit logging

### Frontend Testing
- Client selection and outstanding invoices display
- Automatic (FIFO) allocation preview
- Manual allocation with checkbox selection
- Amount validation (allocated ≤ payment)
- Payment history display
- Form validation (amount > 0, reference for cheque/bank)

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
