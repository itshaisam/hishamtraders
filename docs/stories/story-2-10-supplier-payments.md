# Story 2.10: Supplier Payment Recording

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2.10
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 2.1 (Supplier Management), Story 2.2 (PO Creation)
**Status:** Draft

---

## User Story

**As an** accountant,
**I want** to record payments made to suppliers and link them to purchase orders,
**So that** supplier balances are tracked and payment history is visible.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Payment table created: id, supplierId, paymentType (SUPPLIER/CLIENT), paymentReferenceType (PO/INVOICE/GENERAL), referenceId, amount, method (CASH/BANK_TRANSFER/CHEQUE), date, notes, recordedBy, createdAt
   - [ ] Enum PaymentType: SUPPLIER, CLIENT
   - [ ] Enum PaymentReferenceType: PO, INVOICE, GENERAL
   - [ ] Enum PaymentMethod: CASH, BANK_TRANSFER, CHEQUE
   - [ ] Relations to Supplier, User (recordedBy)

2. **Backend API Endpoints:**
   - [ ] POST /api/payments/supplier - Creates supplier payment
   - [ ] GET /api/payments/supplier - Returns supplier payment history with filters
   - [ ] GET /api/suppliers/:id/payments - Returns payment history for specific supplier

3. **Payment Logic:**
   - [ ] Payment can be linked to specific PO or treated as advance/general payment
   - [ ] Payment method validation (if CHEQUE or BANK_TRANSFER, reference number required in notes)
   - [ ] PO outstanding balance calculated: PO totalAmount - sum(payments linked to PO)

4. **Frontend Pages:**
   - [ ] Record Supplier Payment page with supplier/PO selection
   - [ ] Display PO outstanding amount when PO selected
   - [ ] Payment history table with filters

5. **Authorization:**
   - [ ] Only Accountant and Admin can record supplier payments
   - [ ] All roles can view payment history (read-only)

6. **Audit Logging:**
   - [ ] Supplier payments logged in audit trail

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Database Schema & Migration (AC: 1)**
  - [ ] Create Payment model: id, supplierId, paymentType, paymentReferenceType, referenceId, amount, method, date, notes, recordedBy, createdAt
  - [ ] Add PaymentType enum (SUPPLIER, CLIENT)
  - [ ] Add PaymentReferenceType enum (PO, INVOICE, GENERAL) - NOTE: Different from StockMovement's ReferenceType
  - [ ] Add PaymentMethod enum (CASH, BANK_TRANSFER, CHEQUE)
  - [ ] Add relations to Supplier and User models
  - [ ] Run migration: `npx prisma migrate dev --name add_supplier_payments`

- [ ] **Task 2: Payment Repository**
  - [ ] Create `payments.repository.ts`
  - [ ] Implement `create()` method
  - [ ] Implement `getSupplierPayments(filters)` method
  - [ ] Implement `getPaymentsBySupplier(supplierId)` method
  - [ ] Implement `getPOBalance(poId)` method (calculate outstanding)

- [ ] **Task 3: Payment Service (AC: 3)**
  - [ ] Create `payments.service.ts`
  - [ ] Validate payment method requirements (cheque/bank transfer needs reference)
  - [ ] Calculate PO outstanding balance
  - [ ] Validate amount > 0

- [ ] **Task 4: Controller & Routes (AC: 2)**
  - [ ] Create `payments.controller.ts`
  - [ ] Implement POST /api/payments/supplier
  - [ ] Implement GET /api/payments/supplier
  - [ ] Extend `suppliers.controller.ts` for GET /api/suppliers/:id/payments
  - [ ] Create `payments.routes.ts`

- [ ] **Task 5: Authorization & Audit (AC: 5, 6)**
  - [ ] Apply role guards (Accountant, Admin for write operations)
  - [ ] Add audit logging with payment details

### Frontend Tasks

- [ ] **Task 6: Payment Types & API Client**
  - [ ] Create `payment.types.ts`
  - [ ] Create `paymentsService.ts`
  - [ ] Create TanStack Query hooks

- [ ] **Task 7: Record Supplier Payment Form (AC: 4)**
  - [ ] Create `RecordSupplierPaymentPage.tsx`
  - [ ] Form fields: supplier (dropdown), PO (dropdown, optional), amount, payment method (dropdown), reference/notes, payment date
  - [ ] Display PO outstanding balance when PO selected
  - [ ] Validation: amount > 0, reference required for cheque/bank transfer

- [ ] **Task 8: Supplier Payment History (AC: 2)**
  - [ ] Create `SupplierPaymentsPage.tsx`
  - [ ] Display payments in table: Date | Supplier | PO # | Amount | Method | Reference | Recorded By
  - [ ] Filters: supplier, date range, payment method
  - [ ] Pagination

- [ ] **Task 9: Supplier Detail Page Integration**
  - [ ] Add "Payments" tab to supplier detail page
  - [ ] Display payment history for that supplier
  - [ ] Display total paid, outstanding balance

- [ ] **Task 10: Testing**
  - [ ] Backend tests (payment creation, PO balance calculation, validation)
  - [ ] Frontend tests (form validation, outstanding balance display)

---

## Dev Notes

### Database Schema (Prisma)

```prisma
model Payment {
  id                   String                @id @default(cuid())
  supplierId           String?               // Direct link to supplier
  paymentType          PaymentType
  paymentReferenceType PaymentReferenceType? // Renamed to avoid conflict with StockMovement's ReferenceType
  referenceId          String?
  amount               Decimal               @db.Decimal(12, 2)
  method               PaymentMethod
  date                 DateTime
  notes                String?               @db.Text
  recordedBy           String

  createdAt            DateTime              @default(now())

  supplier             Supplier?             @relation(fields: [supplierId], references: [id])
  user                 User                  @relation(fields: [recordedBy], references: [id])

  @@index([paymentType, paymentReferenceType, referenceId])
  @@index([supplierId])
  @@index([date])
  @@map("payments")
}

enum PaymentType {
  SUPPLIER
  CLIENT
}

enum PaymentReferenceType {
  PO
  INVOICE
  GENERAL
}

enum PaymentMethod {
  CASH
  BANK_TRANSFER
  CHEQUE
}
```

### PO Outstanding Balance Calculation

```typescript
async getPOBalance(poId: string): Promise<{ total: number; paid: number; outstanding: number }> {
  const po = await prisma.purchaseOrder.findUnique({
    where: { id: poId }
  });

  if (!po) throw new NotFoundError('Purchase order not found');

  const payments = await prisma.payment.findMany({
    where: {
      paymentType: 'SUPPLIER',
      paymentReferenceType: 'PO',
      referenceId: poId
    }
  });

  const totalPaid = payments.reduce((sum, payment) =>
    sum + parseFloat(payment.amount.toString()), 0
  );

  const totalAmount = parseFloat(po.totalAmount.toString());
  const outstanding = totalAmount - totalPaid;

  return {
    total: totalAmount,
    paid: totalPaid,
    outstanding: outstanding > 0 ? outstanding : 0
  };
}
```

### Payment Validation

```typescript
const createSupplierPaymentSchema = z.object({
  supplierId: z.string().cuid(), // Required - direct link to supplier
  paymentReferenceType: z.enum(['PO', 'GENERAL']),
  referenceId: z.string().cuid().optional(), // PO ID if paymentReferenceType = PO
  amount: z.number().positive('Amount must be greater than 0'),
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CHEQUE']),
  date: z.date(),
  notes: z.string().optional()
}).refine(data => {
  // If method is CHEQUE or BANK_TRANSFER, notes (reference) must be provided
  if (['CHEQUE', 'BANK_TRANSFER'].includes(data.method)) {
    return !!data.notes && data.notes.length > 0;
  }
  return true;
}, {
  message: 'Reference number required for cheque or bank transfer',
  path: ['notes']
});
```

### Frontend Implementation

**Record Supplier Payment Form:**

```tsx
<Form>
  <Select
    label="Supplier"
    name="supplierId"
    options={suppliers}
    required
  />

  <Select
    label="Link to Purchase Order (Optional)"
    name="poId"
    options={supplierPOs}
    onChange={(poId) => fetchPOBalance(poId)}
  />

  {selectedPO && (
    <Alert variant="info">
      PO Total: ${poBalance.total.toFixed(2)} |
      Paid: ${poBalance.paid.toFixed(2)} |
      Outstanding: ${poBalance.outstanding.toFixed(2)}
    </Alert>
  )}

  <Input
    type="number"
    label="Payment Amount"
    name="amount"
    step="0.01"
    required
  />

  <Select
    label="Payment Method"
    name="method"
    options={[
      { value: 'CASH', label: 'Cash' },
      { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
      { value: 'CHEQUE', label: 'Cheque' }
    ]}
    required
  />

  {(method === 'BANK_TRANSFER' || method === 'CHEQUE') && (
    <Input
      label="Reference Number"
      name="notes"
      placeholder="Enter cheque/transaction reference"
      required
    />
  )}

  <DatePicker
    label="Payment Date"
    name="date"
    defaultValue={new Date()}
    required
  />

  <Textarea
    label="Additional Notes"
    name="notes"
    placeholder="Additional payment details..."
  />

  <Button type="submit">Record Payment</Button>
</Form>
```

**TanStack Query Hook:**

```typescript
export const useCreateSupplierPayment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierPaymentDto) => paymentsService.createSupplierPayment(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supplierPayments'] });
      queryClient.invalidateQueries({ queryKey: ['poBalance'] });
      toast.success('Supplier payment recorded successfully!');
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
- Payment creation with valid data
- Validation: amount > 0
- Validation: reference required for cheque/bank transfer
- PO outstanding balance calculation
- Audit logging

### Frontend Testing
- Payment form validation
- PO balance display when PO selected
- Reference field required for cheque/bank transfer
- Payment history display

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
