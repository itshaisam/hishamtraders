# Story 5.5: Balance Sheet Generation

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.5
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 5.4 (Trial Balance)
**Status:** Done

---

## User Story

**As an** admin,
**I want** to generate a balance sheet showing assets, liabilities, and equity,
**So that** I can understand the company's financial position.

---

## Acceptance Criteria

1. `GET /api/v1/reports/balance-sheet` generates balance sheet
2. Parameters: `asOfDate`
3. Report structure:
   - ASSETS (Current Assets, Fixed Assets, Total)
   - LIABILITIES (Current, Long-term, Total)
   - EQUITY (Capital, Retained Earnings, Total)
   - **Equation: Total Assets = Total Liabilities + Total Equity**
4. Retained Earnings = Previous Retained Earnings + Net Profit (Revenue - Expenses)
5. Export to Excel (Story 4.9 pattern)
6. **Authorization:** Only `ADMIN` and `ACCOUNTANT`

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on AccountHead + JournalEntry models.

### Key Corrections

1. **`calculateBalance` must respect account type** — The original code computed `opening + debits - credits` for all accounts. This is only correct for ASSET/EXPENSE. For LIABILITY/EQUITY/REVENUE, the normal balance is credit-side: `opening + credits - debits`.

2. **API path**: `/api/v1/reports/balance-sheet` (not `/api/reports/balance-sheet`)

### Balance Calculation (Correct)

```typescript
function calculateAccountBalance(account: AccountHead, journalLines: JournalEntryLine[]): number {
  const opening = parseFloat(account.openingBalance.toString());
  const debits = journalLines.reduce((sum, l) => sum + parseFloat(l.debitAmount.toString()), 0);
  const credits = journalLines.reduce((sum, l) => sum + parseFloat(l.creditAmount.toString()), 0);

  // ASSET/EXPENSE: debit-normal → opening + debits - credits
  // LIABILITY/EQUITY/REVENUE: credit-normal → opening + credits - debits
  if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
    return opening + debits - credits;
  } else {
    return opening + credits - debits;
  }
}
```

### Module Structure

```
apps/api/src/modules/reports/
  balance-sheet.service.ts      (NEW)
  reports.controller.ts         (EXPAND)
  reports.routes.ts             (EXPAND — add GET /balance-sheet)

apps/web/src/features/accounting/pages/
  BalanceSheetPage.tsx           (NEW)
```

### POST-MVP DEFERRED

- **Server-side caching**: Use TanStack Query.
- **Comparative balance sheet (current vs prior period)**: Deferred.
- **Income Statement as separate report**: Can be derived from same data. Deferred to separate story if needed.
