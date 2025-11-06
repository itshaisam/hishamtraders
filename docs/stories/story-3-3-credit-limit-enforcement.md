# Story 3.3: Credit Limit Enforcement and Warnings

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.3
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 3.1 (Client Management), Story 3.2 (Sales Invoice Creation)
**Status:** Draft

---

## User Story

**As a** sales officer,
**I want** the system to warn me when a client is approaching or exceeding their credit limit,
**So that** bad debt risk is minimized.

---

## Acceptance Criteria

1. **Credit Calculation:**
   - [ ] When creating credit invoice, system calculates: client.balance + new invoice total
   - [ ] If result > 80% of creditLimit, display warning: "Client approaching credit limit (X% utilized)"
   - [ ] If result > 100% of creditLimit, display error: "Credit limit exceeded. Current balance: X, Limit: Y"

2. **Admin Override:**
   - [ ] Admin can override credit limit (requires confirmation with reason)
   - [ ] Non-admin users cannot override (invoice creation blocked)

3. **Credit Limit Display:**
   - [ ] Credit limit utilization displayed on client detail page with progress bar
   - [ ] Dashboard shows list of clients > 80% credit limit utilization

4. **Frontend Warnings:**
   - [ ] Display credit limit warnings prominently during invoice creation
   - [ ] Override requires Admin confirmation modal with reason input

5. **Audit Logging:**
   - [ ] Credit limit overrides logged in audit trail with reason

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Credit Limit Check Service**
  - [ ] Create `credit-limit.service.ts`
  - [ ] Implement `checkCreditLimit(clientId, additionalAmount)` method
  - [ ] Return status: OK, WARNING, EXCEEDED
  - [ ] Calculate utilization percentage

- [ ] **Task 2: Admin Override Logic**
  - [ ] Extend invoice creation to accept `adminOverride` flag
  - [ ] Validate user is Admin when override used
  - [ ] Require `overrideReason` when override flag is true

- [ ] **Task 3: Credit Limit Reports**
  - [ ] Create endpoint GET /api/reports/credit-limits
  - [ ] Return clients with utilization > 80%
  - [ ] Sort by utilization percentage (highest first)

- [ ] **Task 4: Audit Logging**
  - [ ] Log CREDIT_LIMIT_OVERRIDE events
  - [ ] Include client, invoice amount, limit, reason

### Frontend Tasks

- [ ] **Task 5: Credit Limit Warning Component**
  - [ ] Create `CreditLimitWarning.tsx`
  - [ ] Display warning alert (80-100%)
  - [ ] Display error alert (>100%)
  - [ ] Show current balance, limit, new total

- [ ] **Task 6: Admin Override Modal**
  - [ ] Create `AdminOverrideModal.tsx`
  - [ ] Confirm override action
  - [ ] Require reason input (textarea)
  - [ ] Submit with override flag

- [ ] **Task 7: Client Detail Credit Display**
  - [ ] Add credit limit utilization section
  - [ ] Progress bar with color coding
  - [ ] Display: Current Balance / Credit Limit

- [ ] **Task 8: Dashboard Credit Alert Widget**
  - [ ] Create `CreditLimitAlerts.tsx`
  - [ ] Display clients > 80% utilization
  - [ ] Link to client detail page

- [ ] **Task 9: Testing**
  - [ ] Backend tests (credit limit calculation, override validation)
  - [ ] Frontend tests (warning display, admin override)

---

## Dev Notes

### Credit Limit Check Logic

```typescript
interface CreditLimitCheck {
  status: 'OK' | 'WARNING' | 'EXCEEDED';
  currentBalance: number;
  creditLimit: number;
  newTotal: number;
  newBalance: number;
  utilization: number; // Percentage
  message: string;
}

async function checkCreditLimit(
  clientId: string,
  additionalAmount: number
): Promise<CreditLimitCheck> {
  const client = await prisma.client.findUnique({
    where: { id: clientId }
  });

  if (!client) {
    throw new NotFoundError('Client not found');
  }

  const currentBalance = parseFloat(client.balance.toString());
  const creditLimit = parseFloat(client.creditLimit.toString());
  const newBalance = currentBalance + additionalAmount;
  const utilization = creditLimit > 0 ? (newBalance / creditLimit) * 100 : 0;

  let status: 'OK' | 'WARNING' | 'EXCEEDED';
  let message: string;

  if (utilization > 100) {
    status = 'EXCEEDED';
    message = `Credit limit exceeded. Current balance: Rs.${currentBalance.toFixed(2)}, Limit: Rs.${creditLimit.toFixed(2)}, New total: Rs.${newBalance.toFixed(2)}`;
  } else if (utilization > 80) {
    status = 'WARNING';
    message = `Client approaching credit limit (${utilization.toFixed(0)}% utilized)`;
  } else {
    status = 'OK';
    message = 'Credit limit OK';
  }

  return {
    status,
    currentBalance,
    creditLimit,
    newTotal: additionalAmount,
    newBalance,
    utilization,
    message
  };
}
```

### Admin Override Validation

```typescript
async function createInvoiceWithOverride(
  data: CreateInvoiceDto,
  userId: string
): Promise<Invoice> {
  // Check credit limit
  const creditCheck = await checkCreditLimit(data.clientId, data.total);

  if (creditCheck.status === 'EXCEEDED') {
    if (!data.adminOverride) {
      throw new BadRequestError(creditCheck.message);
    }

    // Validate user is Admin
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.role !== 'ADMIN') {
      throw new ForbiddenError('Only Admin can override credit limits');
    }

    if (!data.overrideReason) {
      throw new BadRequestError('Override reason is required');
    }

    // Log override
    await auditLogger.log({
      action: 'CREDIT_LIMIT_OVERRIDE',
      userId,
      resource: 'Invoice',
      details: {
        clientId: data.clientId,
        invoiceAmount: data.total,
        currentBalance: creditCheck.currentBalance,
        creditLimit: creditCheck.creditLimit,
        utilization: creditCheck.utilization,
        reason: data.overrideReason
      }
    });
  }

  // Proceed with invoice creation
  return createInvoice(data, userId);
}
```

### Frontend Implementation

**Credit Limit Warning Component:**

```tsx
interface CreditLimitWarningProps {
  creditCheck: CreditLimitCheck;
  isAdmin: boolean;
  onOverride: (reason: string) => void;
}

export const CreditLimitWarning: FC<CreditLimitWarningProps> = ({
  creditCheck,
  isAdmin,
  onOverride
}) => {
  const [showOverrideModal, setShowOverrideModal] = useState(false);

  if (creditCheck.status === 'OK') return null;

  return (
    <>
      <Alert
        variant={creditCheck.status === 'WARNING' ? 'warning' : 'error'}
        className="mb-4"
      >
        <AlertTriangle className="h-4 w-4" />
        <div>
          <h4 className="font-semibold">
            {creditCheck.status === 'WARNING' ? 'Credit Limit Warning' : 'Credit Limit Exceeded'}
          </h4>
          <p>{creditCheck.message}</p>
          <div className="mt-2 text-sm">
            <div>Current Balance: Rs.{creditCheck.currentBalance.toFixed(2)}</div>
            <div>Credit Limit: Rs.{creditCheck.creditLimit.toFixed(2)}</div>
            <div>New Balance: Rs.{creditCheck.newBalance.toFixed(2)}</div>
            <div className="font-bold">
              Utilization: {creditCheck.utilization.toFixed(1)}%
            </div>
          </div>
          {creditCheck.status === 'EXCEEDED' && isAdmin && (
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={() => setShowOverrideModal(true)}
            >
              Admin Override
            </Button>
          )}
        </div>
      </Alert>

      {showOverrideModal && (
        <AdminOverrideModal
          onConfirm={onOverride}
          onCancel={() => setShowOverrideModal(false)}
        />
      )}
    </>
  );
};
```

**Admin Override Modal:**

```tsx
export const AdminOverrideModal: FC<{
  onConfirm: (reason: string) => void;
  onCancel: () => void;
}> = ({ onConfirm, onCancel }) => {
  const [reason, setReason] = useState('');

  const handleSubmit = () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for override');
      return;
    }
    onConfirm(reason);
  };

  return (
    <Modal open onClose={onCancel}>
      <Modal.Header>Admin Override - Credit Limit</Modal.Header>
      <Modal.Body>
        <Alert variant="warning">
          <ShieldAlert className="h-4 w-4" />
          <p>
            You are about to override the credit limit restriction.
            This action will be logged in the audit trail.
          </p>
        </Alert>

        <Textarea
          label="Reason for Override"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Explain why this override is necessary..."
          rows={4}
          required
          className="mt-4"
        />
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" onClick={handleSubmit}>
          Confirm Override
        </Button>
      </Modal.Footer>
    </Modal>
  );
};
```

**Credit Utilization Progress Bar:**

```tsx
export const CreditUtilizationDisplay: FC<{ client: Client }> = ({ client }) => {
  const utilization = (client.balance / client.creditLimit) * 100;

  const getColor = () => {
    if (utilization >= 100) return 'bg-red-600';
    if (utilization >= 80) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Credit Utilization</span>
        <span className="font-semibold">{utilization.toFixed(1)}%</span>
      </div>

      <div className="h-4 bg-gray-200 rounded-full overflow-hidden">
        <div
          className={cn('h-full transition-all', getColor())}
          style={{ width: `${Math.min(utilization, 100)}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-gray-600">
        <span>Balance: Rs.{client.balance.toFixed(2)}</span>
        <span>Limit: Rs.{client.creditLimit.toFixed(2)}</span>
      </div>
    </div>
  );
};
```

---

## Testing

### Backend Testing
- Credit limit calculation accuracy
- Warning threshold (80%)
- Exceeded threshold (100%)
- Admin override validation
- Non-admin override rejection
- Audit logging verification

### Frontend Testing
- Warning alert display (80-100%)
- Error alert display (>100%)
- Admin override modal
- Non-admin button hidden
- Override reason required validation

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
