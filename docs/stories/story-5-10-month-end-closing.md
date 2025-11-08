# Story 5.10: Month-End Closing

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.10
**Priority:** Medium
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 5.4, Story 5.5
**Status:** Draft - Phase 2

---

## User Story

**As an** accountant,
**I want** to perform month-end closing procedures,
**So that** financial periods are properly closed and books are prepared for next period.

---

## Acceptance Criteria

1. PeriodClose table: id, periodType (MONTH/YEAR), periodDate, closedBy, closedAt, status
2. POST /api/period-close/month closes current month
3. Month-end closing process:
   - Verify trial balance is balanced
   - Generate P&L for month
   - Calculate net profit/loss
   - Create closing journal entry (move net profit to Retained Earnings)
   - Lock all journal entries for period
   - Mark period as CLOSED
4. Cannot create/edit transactions for closed periods
5. Admin can reopen period (requires confirmation + reason)
6. GET /api/period-close returns list of closed periods
7. Frontend Month-End Closing page displays trial balance status, P&L summary
8. **Authorization & Role-Based Access:**
   - [ ] Only Admin can perform month-end closing
   - [ ] Only Admin can reopen closed periods (requires confirmation + reason)
   - [ ] Accountant can view closed periods (read-only)
   - [ ] Other roles: 403 Forbidden
   - [ ] Month-end closing logged in audit trail with details

9. **Performance & Caching:**
   - [ ] Pre-validate trial balance before closing (< 5 seconds)
   - [ ] Lock period atomically (transaction ensures all-or-nothing)
   - [ ] API timeout: 30 seconds maximum (closing involves multiple calculations)
   - [ ] Cache invalidation: Invalidate all GL/TB/BS reports for closed period

10. **Error Handling:**
    - [ ] Validate trial balance is balanced before closing
    - [ ] If not balanced: Display difference and prevent closing
    - [ ] Handle already-closed period: Return 400 error
    - [ ] Validate period date is valid (last day of month)
    - [ ] Catch journal entry locking errors and display to user
    - [ ] Log month-end closing process with detailed error messages

---

## Dev Notes

```prisma
model PeriodClose {
  id           String           @id @default(cuid())
  periodType   PeriodType
  periodDate   DateTime         // Last day of period (e.g., 2025-01-31 for Jan 2025)
  netProfit    Decimal          @db.Decimal(12, 2)
  closedBy     String
  closedAt     DateTime         @default(now())
  status       PeriodCloseStatus @default(CLOSED)
  reopenedAt   DateTime?
  reopenReason String?          @db.Text

  user         User             @relation(fields: [closedBy], references: [id])

  @@unique([periodType, periodDate])
  @@map("period_closes")
}

enum PeriodType {
  MONTH
  YEAR
}

enum PeriodCloseStatus {
  CLOSED
  REOPENED
}
```

```typescript
async function closeMonth(
  periodDate: Date,
  userId: string
): Promise<PeriodClose> {
  // Verify trial balance is balanced
  const trialBalance = await getTrialBalance(periodDate);
  if (!trialBalance.isBalanced) {
    throw new BadRequestError('Cannot close month: Trial balance is not balanced');
  }

  // Calculate net profit
  const balanceSheet = await getBalanceSheet(periodDate);
  const netProfit = balanceSheet.equity.retainedEarnings;

  // Create closing journal entry
  if (netProfit !== 0) {
    const lines = netProfit > 0
      ? [
          // Debit: Net Profit (Revenue Summary)
          { accountHeadId: await getAccountByCode('4000'), debitAmount: netProfit, creditAmount: 0 },
          // Credit: Retained Earnings
          { accountHeadId: await getAccountByCode('3200'), debitAmount: 0, creditAmount: netProfit }
        ]
      : [
          // Debit: Retained Earnings (if loss)
          { accountHeadId: await getAccountByCode('3200'), debitAmount: Math.abs(netProfit), creditAmount: 0 },
          // Credit: Expense Summary
          { accountHeadId: await getAccountByCode('5000'), debitAmount: 0, creditAmount: Math.abs(netProfit) }
        ];

    await createJournalEntry({
      date: periodDate,
      description: `Month-end closing entry for ${format(periodDate, 'MMMM yyyy')}`,
      lines
    }, userId);
  }

  // Lock all journal entries for the period
  const periodStart = new Date(periodDate.getFullYear(), periodDate.getMonth(), 1);
  await prisma.journalEntry.updateMany({
    where: {
      date: {
        gte: periodStart,
        lte: periodDate
      }
    },
    data: {
      // Add isLocked field or use status
      status: 'POSTED' // Already posted, cannot be edited
    }
  });

  // Create period close record
  const periodClose = await prisma.periodClose.create({
    data: {
      periodType: 'MONTH',
      periodDate,
      netProfit,
      closedBy: userId
    }
  });

  // Log audit
  await auditLogger.log({
    action: 'MONTH_END_CLOSE',
    userId,
    resource: 'PeriodClose',
    resourceId: periodClose.id,
    details: {
      period: format(periodDate, 'MMMM yyyy'),
      netProfit
    }
  });

  return periodClose;
}

async function reopenPeriod(
  periodCloseId: string,
  reason: string,
  userId: string
): Promise<PeriodClose> {
  if (!reason || reason.length < 10) {
    throw new BadRequestError('Reopen reason required (min 10 characters)');
  }

  const periodClose = await prisma.periodClose.update({
    where: { id: periodCloseId },
    data: {
      status: 'REOPENED',
      reopenedAt: new Date(),
      reopenReason: reason
    }
  });

  await auditLogger.log({
    action: 'PERIOD_REOPEN',
    userId,
    resource: 'PeriodClose',
    resourceId: periodCloseId,
    details: { reason }
  });

  return periodClose;
}

// Validation middleware for transaction creation
async function validatePeriodNotClosed(date: Date): Promise<void> {
  const closedPeriod = await prisma.periodClose.findFirst({
    where: {
      periodDate: { gte: date },
      status: 'CLOSED'
    }
  });

  if (closedPeriod) {
    throw new BadRequestError(
      `Cannot create transaction for closed period: ${format(closedPeriod.periodDate, 'MMMM yyyy')}`
    );
  }
}
```

**Frontend:**
```tsx
export const MonthEndClosingPage: FC = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const { data: trialBalance } = useGetTrialBalance(selectedMonth);
  const { data: balanceSheet } = useGetBalanceSheet(selectedMonth);
  const closeMonthMutation = useCloseMonth();

  const handleCloseMonth = () => {
    if (!trialBalance?.isBalanced) {
      toast.error('Cannot close month: Trial balance is not balanced');
      return;
    }

    if (!confirm(`Close month ${format(selectedMonth, 'MMMM yyyy')}? This cannot be undone without admin approval.`)) {
      return;
    }

    closeMonthMutation.mutate(selectedMonth);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Month-End Closing</h1>

      <Card className="mb-6">
        <Card.Header>Select Month to Close</Card.Header>
        <Card.Body>
          <DatePicker
            value={selectedMonth}
            onChange={setSelectedMonth}
            dateFormat="MMMM yyyy"
            showMonthYearPicker
          />
        </Card.Body>
      </Card>

      {trialBalance && balanceSheet && (
        <>
          <Card className="mb-6">
            <Card.Header>Pre-Close Verification</Card.Header>
            <Card.Body className="space-y-4">
              <Alert variant={trialBalance.isBalanced ? 'success' : 'error'}>
                Trial Balance: {trialBalance.isBalanced ? 'Balanced ✓' : 'NOT Balanced ✗'}
              </Alert>

              <div>
                <h3 className="font-semibold mb-2">Profit & Loss Summary</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-gray-600">Total Revenue</div>
                    <div className="text-lg font-bold text-green-600">
                      Rs.{balanceSheet.equity.retainedEarnings > 0 ? balanceSheet.equity.retainedEarnings.toFixed(2) : '0.00'}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Net Profit/Loss</div>
                    <div className={cn('text-lg font-bold', {
                      'text-green-600': balanceSheet.equity.retainedEarnings > 0,
                      'text-red-600': balanceSheet.equity.retainedEarnings < 0
                    })}>
                      Rs.{balanceSheet.equity.retainedEarnings.toFixed(2)}
                    </div>
                  </div>
                </div>
              </div>
            </Card.Body>
          </Card>

          <Button
            onClick={handleCloseMonth}
            disabled={!trialBalance.isBalanced}
            variant="primary"
          >
            Close Month {format(selectedMonth, 'MMMM yyyy')}
          </Button>
        </>
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
