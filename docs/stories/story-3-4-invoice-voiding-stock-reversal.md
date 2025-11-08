# Story 3.4: Invoice Voiding and Stock Reversal

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.4
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 3.2 (Sales Invoice Creation), Story 3.6 (Client Payment Recording)
**Status:** Draft

---

## User Story

**As an** accountant,
**I want** to void incorrect invoices and automatically reverse inventory deductions,
**So that** stock levels remain accurate and client balances are corrected.

---

## Acceptance Criteria

1. **Void Validation:**
   - [ ] **Cannot void invoice if status = PARTIAL or PAID** (any payment recorded blocks voiding)
   - [ ] Cannot void invoice if status is already VOIDED
   - [ ] **Can only void invoices with status = PENDING** (unpaid invoices only)
   - [ ] Only Admin and Accountant can void invoices
   - [ ] Void reason required: free text, minimum 10 characters, maximum 500 characters

2. **Stock Reversal Logic:**
   - [ ] When invoice voided, all inventory deductions reversed (added back)
   - [ ] **If original batch still exists: add quantity back to original batch**
   - [ ] **If original batch was consumed in other sales: create new batch dated today with "REVERSAL" prefix**
   - [ ] **Batch format for reversals: REVERSAL-YYYYMMDD-XXX** (to distinguish from normal batches)
   - [ ] Stock movements created with type ADJUSTMENT and reference to voided invoice
   - [ ] Running balance tracking must reflect void correctly (quantity returns to inventory)

3. **Client Balance Update:**
   - [ ] **For CREDIT invoices: client balance reduced by invoice total** (they owe less)
   - [ ] **For CASH invoices: no balance impact** (already marked PAID, no balance tracking)
   - [ ] Balance calculation: currentBalance - invoiceTotal

4. **Invoice Status Update:**
   - [ ] Invoice status changed to VOIDED
   - [ ] Invoice voidedAt timestamp recorded
   - [ ] Invoice voidedBy user recorded
   - [ ] Void reason required (textarea)

5. **Frontend Implementation:**
   - [ ] Void button visible only for unpaid invoices
   - [ ] Void confirmation modal with reason input
   - [ ] Warning message explaining stock reversal consequences
   - [ ] Voided invoices displayed with distinct styling (strikethrough, red badge)

6. **Audit Logging:**
   - [ ] Invoice void operations logged with reason

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Extend Invoice Model (AC: 4)**
  - [ ] Add voidedAt (DateTime?) field
  - [ ] Add voidedBy (String?) field
  - [ ] Add voidReason (String?) field
  - [ ] Add VOIDED to InvoiceStatus enum
  - [ ] Run migration

- [ ] **Task 2: Stock Reversal Service (AC: 2)**
  - [ ] Create `reverseInvoiceStock()` method
  - [ ] Restore inventory quantities to original batches
  - [ ] Handle case where original batch no longer exists
  - [ ] Create stock movement records (type: ADJUSTMENT)

- [ ] **Task 3: Void Invoice Service (AC: 1, 3, 4)**
  - [ ] Create `voidInvoice(invoiceId, userId, reason)` method
  - [ ] Validate invoice not already voided
  - [ ] Validate no payments recorded (check Payment table)
  - [ ] Call stock reversal service
  - [ ] Update client balance
  - [ ] Update invoice status to VOIDED
  - [ ] Wrap all operations in transaction

- [ ] **Task 4: Controller & Routes (AC: 1)**
  - [ ] Extend `invoices.controller.ts`
  - [ ] Implement DELETE /api/invoices/:id (or PATCH /api/invoices/:id/void)
  - [ ] Validate user role (Admin, Accountant)
  - [ ] Require voidReason in request body

- [ ] **Task 5: Authorization & Audit (AC: 1, 6)**
  - [ ] Apply role guards
  - [ ] Add audit logging with void reason

### Frontend Tasks

- [ ] **Task 6: Void Invoice Modal**
  - [ ] Create `VoidInvoiceModal.tsx`
  - [ ] Display warning about stock reversal
  - [ ] Require void reason (textarea)
  - [ ] Confirmation checkbox: "I understand this will reverse inventory deductions"

- [ ] **Task 7: Invoice Detail Page Integration (AC: 5)**
  - [ ] Add "Void Invoice" button (visible only if status = PAID or UNPAID)
  - [ ] Hide void button if invoice has payments
  - [ ] Display voided status with badge
  - [ ] Show voidedAt, voidedBy, voidReason if voided

- [ ] **Task 8: Invoice List Styling (AC: 5)**
  - [ ] Apply strikethrough styling to voided invoices
  - [ ] Display VOIDED badge (red)
  - [ ] Filter: show/hide voided invoices

- [ ] **Task 9: Testing**
  - [ ] Backend tests (void validation, stock reversal, balance update)
  - [ ] Frontend tests (void modal, voided invoice display)

---

## Dev Notes

### Database Schema Changes

```prisma
model Invoice {
  id              String         @id @default(cuid())
  invoiceNumber   String         @unique
  clientId        String
  warehouseId     String
  status          InvoiceStatus  @default(UNPAID)
  subtotal        Decimal        @db.Decimal(12, 2)
  tax             Decimal        @db.Decimal(12, 2) @default(0)
  total           Decimal        @db.Decimal(12, 2)
  notes           String?        @db.Text
  invoiceDate     DateTime       @default(now())
  dueDate         DateTime?

  // Void tracking
  voidedAt        DateTime?
  voidedBy        String?
  voidReason      String?        @db.Text

  createdBy       String
  createdAt       DateTime       @default(now())
  updatedAt       DateTime       @updatedAt

  client          Client         @relation(fields: [clientId], references: [id])
  warehouse       Warehouse      @relation(fields: [warehouseId], references: [id])
  creator         User           @relation("CreatedInvoices", fields: [createdBy], references: [id])
  voider          User?          @relation("VoidedInvoices", fields: [voidedBy], references: [id])
  items           InvoiceItem[]
  payments        Payment[]

  @@map("invoices")
}

enum InvoiceStatus {
  UNPAID
  PARTIAL
  PAID
  VOIDED
}
```

### Stock Reversal Algorithm

```typescript
interface InvoiceItemWithBatch {
  productId: string;
  warehouseId: string;
  quantity: number;
  batchNo: string;
}

async function reverseInvoiceStock(
  invoiceId: string,
  userId: string
): Promise<void> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true }
  });

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  for (const item of invoice.items) {
    // Try to find the original batch
    const originalBatch = await prisma.inventory.findFirst({
      where: {
        productId: item.productId,
        warehouseId: invoice.warehouseId,
        batchNo: item.batchNo
      }
    });

    if (originalBatch) {
      // Restore to original batch
      await prisma.inventory.update({
        where: { id: originalBatch.id },
        data: {
          quantity: originalBatch.quantity + item.quantity
        }
      });

      // Create stock movement
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: invoice.warehouseId,
          movementType: 'ADJUSTMENT',
          quantity: item.quantity,
          referenceType: 'INVOICE_VOID',
          referenceId: invoiceId,
          movementDate: new Date(),
          userId: userId,
          notes: `Stock reversed from voided invoice ${invoice.invoiceNumber}`
        }
      });
    } else {
      // Original batch doesn't exist - create new batch with current date
      const newBatchNo = generateBatchNumber();

      await prisma.inventory.create({
        data: {
          productId: item.productId,
          warehouseId: invoice.warehouseId,
          quantity: item.quantity,
          batchNo: newBatchNo,
          receivedDate: new Date(),
          unitCost: item.unitPrice // Use sale price as cost (best estimate)
        }
      });

      // Create stock movement
      await prisma.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: invoice.warehouseId,
          movementType: 'ADJUSTMENT',
          quantity: item.quantity,
          referenceType: 'INVOICE_VOID',
          referenceId: invoiceId,
          movementDate: new Date(),
          userId: userId,
          notes: `Stock reversed from voided invoice ${invoice.invoiceNumber} (new batch created)`
        }
      });
    }
  }
}
```

### Void Invoice Service

```typescript
interface VoidInvoiceDto {
  reason: string;
}

async function voidInvoice(
  invoiceId: string,
  userId: string,
  data: VoidInvoiceDto
): Promise<Invoice> {
  // Validate invoice exists
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { payments: true }
  });

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  // Validate not already voided
  if (invoice.status === 'VOIDED') {
    throw new BadRequestError('Invoice is already voided');
  }

  // Validate no payments recorded
  if (invoice.payments && invoice.payments.length > 0) {
    throw new BadRequestError(
      'Cannot void invoice with recorded payments. Please void payments first.'
    );
  }

  // Validate reason provided
  if (!data.reason || data.reason.trim().length === 0) {
    throw new BadRequestError('Void reason is required');
  }

  // Perform void operation in transaction
  return await prisma.$transaction(async (tx) => {
    // Reverse stock
    await reverseInvoiceStock(invoiceId, userId);

    // Update client balance
    const client = await tx.client.findUnique({
      where: { id: invoice.clientId }
    });

    if (client) {
      const currentBalance = parseFloat(client.balance.toString());
      const invoiceTotal = parseFloat(invoice.total.toString());
      const newBalance = currentBalance - invoiceTotal;

      await tx.client.update({
        where: { id: invoice.clientId },
        data: { balance: Math.max(0, newBalance) } // Don't allow negative balance
      });
    }

    // Update invoice status
    const voidedInvoice = await tx.invoice.update({
      where: { id: invoiceId },
      data: {
        status: 'VOIDED',
        voidedAt: new Date(),
        voidedBy: userId,
        voidReason: data.reason
      }
    });

    // Log audit
    await auditLogger.log({
      action: 'INVOICE_VOID',
      userId,
      resource: 'Invoice',
      resourceId: invoiceId,
      details: {
        invoiceNumber: invoice.invoiceNumber,
        clientId: invoice.clientId,
        total: invoice.total,
        reason: data.reason
      }
    });

    return voidedInvoice;
  });
}
```

### Validation Schema

```typescript
const voidInvoiceSchema = z.object({
  reason: z.string()
    .min(10, 'Reason must be at least 10 characters')
    .max(500, 'Reason must not exceed 500 characters')
});
```

### Frontend Implementation

**Void Invoice Modal:**

```tsx
import { FC, useState } from 'react';
import { Modal, Button, Textarea, Alert, Checkbox } from '@/components/ui';
import { AlertTriangle } from 'lucide-react';

interface VoidInvoiceModalProps {
  invoice: Invoice;
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}

export const VoidInvoiceModal: FC<VoidInvoiceModalProps> = ({
  invoice,
  onConfirm,
  onCancel
}) => {
  const [reason, setReason] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (!reason.trim() || reason.length < 10) {
      setError('Please provide a detailed reason (at least 10 characters)');
      return;
    }

    if (!confirmed) {
      setError('Please confirm you understand the consequences');
      return;
    }

    onConfirm(reason);
  };

  return (
    <Modal open onClose={onCancel} size="lg">
      <Modal.Header>
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span>Void Invoice {invoice.invoiceNumber}</span>
        </div>
      </Modal.Header>

      <Modal.Body>
        <Alert variant="error" className="mb-4">
          <div className="space-y-2">
            <h4 className="font-semibold">Warning: This action will:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm">
              <li>Mark the invoice as VOIDED (cannot be undone)</li>
              <li>Reverse all inventory deductions (stock will be restored)</li>
              <li>Reduce client balance by Rs.{invoice.total.toFixed(2)}</li>
              <li>Create audit trail records</li>
            </ul>
          </div>
        </Alert>

        <div className="space-y-4">
          <div>
            <h4 className="font-medium mb-2">Invoice Details:</h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Client: {invoice.client.name}</div>
              <div>Amount: Rs.{invoice.total.toFixed(2)}</div>
              <div>Date: {format(invoice.invoiceDate, 'PPP')}</div>
              <div>Status: {invoice.status}</div>
            </div>
          </div>

          <Textarea
            label="Reason for Voiding"
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              setError('');
            }}
            placeholder="Explain why this invoice is being voided..."
            rows={4}
            required
            error={error}
          />

          <Checkbox
            checked={confirmed}
            onChange={(e) => {
              setConfirmed(e.target.checked);
              setError('');
            }}
            label="I understand this will reverse inventory deductions and update client balance"
          />
        </div>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button
          variant="danger"
          onClick={handleSubmit}
          disabled={!reason.trim() || !confirmed}
        >
          Void Invoice
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
```

**Invoice Detail Page Integration:**

```tsx
export const InvoiceDetailPage: FC = () => {
  const { id } = useParams();
  const { data: invoice } = useGetInvoice(id!);
  const voidInvoiceMutation = useVoidInvoice();
  const [showVoidModal, setShowVoidModal] = useState(false);

  const canVoid =
    invoice?.status !== 'VOIDED' &&
    invoice?.payments?.length === 0 &&
    (currentUser.role === 'ADMIN' || currentUser.role === 'ACCOUNTANT');

  const handleVoid = (reason: string) => {
    voidInvoiceMutation.mutate(
      { invoiceId: id!, reason },
      {
        onSuccess: () => {
          setShowVoidModal(false);
          toast.success('Invoice voided successfully');
        }
      }
    );
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className={cn(
            'text-2xl font-bold',
            invoice?.status === 'VOIDED' && 'line-through text-gray-400'
          )}>
            Invoice {invoice?.invoiceNumber}
          </h1>
          <Badge
            variant={
              invoice?.status === 'VOIDED' ? 'error' :
              invoice?.status === 'PAID' ? 'success' :
              invoice?.status === 'PARTIAL' ? 'warning' :
              'default'
            }
          >
            {invoice?.status}
          </Badge>
        </div>

        {canVoid && (
          <Button
            variant="outline"
            color="red"
            onClick={() => setShowVoidModal(true)}
          >
            <XCircle className="h-4 w-4 mr-2" />
            Void Invoice
          </Button>
        )}
      </div>

      {invoice?.status === 'VOIDED' && (
        <Alert variant="error" className="mb-4">
          <div>
            <h4 className="font-semibold">Invoice Voided</h4>
            <div className="text-sm mt-2 space-y-1">
              <div>Voided on: {format(invoice.voidedAt!, 'PPP')}</div>
              <div>Voided by: {invoice.voider?.name}</div>
              <div className="mt-2">
                <strong>Reason:</strong> {invoice.voidReason}
              </div>
            </div>
          </div>
        </Alert>
      )}

      {/* Invoice details... */}

      {showVoidModal && invoice && (
        <VoidInvoiceModal
          invoice={invoice}
          onConfirm={handleVoid}
          onCancel={() => setShowVoidModal(false)}
        />
      )}
    </div>
  );
};
```

**TanStack Query Hook:**

```typescript
export const useVoidInvoice = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invoiceId, reason }: { invoiceId: string; reason: string }) =>
      invoicesService.voidInvoice(invoiceId, reason),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      queryClient.invalidateQueries({ queryKey: ['invoice', variables.invoiceId] });
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['clients'] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to void invoice');
    },
  });
};
```

---

## Testing

### Backend Testing
- Void invoice with no payments (success)
- Attempt to void invoice with payments (error)
- Attempt to void already voided invoice (error)
- Stock reversal to original batch
- Stock reversal when original batch doesn't exist (create new batch)
- Client balance reduction
- Non-admin/accountant cannot void (authorization)
- Void reason required validation
- Audit logging verification

### Frontend Testing
- Void button hidden for voided invoices
- Void button hidden when invoice has payments
- Void button hidden for non-admin/accountant users
- Void modal confirmation required
- Reason validation (min 10 characters)
- Voided invoice styling (strikethrough, red badge)
- Voided invoice details display

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
