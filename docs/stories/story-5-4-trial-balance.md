# Story 5.4: Trial Balance Report

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.4
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 5.3 (Auto Journal Entries)
**Status:** Draft — Phase 2

---

## User Story

**As an** accountant,
**I want** to generate a trial balance showing all account balances,
**So that** I can verify debits equal credits and books are balanced.

---

## Acceptance Criteria

1. `GET /api/v1/reports/trial-balance` generates trial balance
2. Parameters: `asOfDate` (date to calculate balances up to)
3. Shows: Account Code, Account Name, Account Type, Debit Balance, Credit Balance
4. **Summary: Total Debits = Total Credits** (if balanced)
5. If not balanced, display error with difference amount
6. Export to Excel (Story 4.9 pattern)
7. **Authorization:** Only `ACCOUNTANT` and `ADMIN`

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on AccountHead + JournalEntry models.

**Frontend:** No trial balance page exists.

### Key Corrections

1. **Opening balance placement** — Opening balance should be placed on the normal side for the account type:
   - ASSET/EXPENSE: opening balance goes to debit side
   - LIABILITY/EQUITY/REVENUE: opening balance goes to credit side
   The original code put ALL opening balances on the debit side, which is wrong.

2. **API path**: `/api/v1/reports/trial-balance` (not `/api/reports/trial-balance`)

### Trial Balance Logic (Correct)

```typescript
async function getTrialBalance(asOfDate: Date): Promise<TrialBalanceResult> {
  const accounts = await prisma.accountHead.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { code: 'asc' },
  });

  // Get all posted journal lines up to asOfDate
  const journalLines = await prisma.journalEntryLine.findMany({
    where: {
      journalEntry: { date: { lte: asOfDate }, status: 'POSTED' }
    },
  });

  // Aggregate debits/credits per account
  const linesByAccount = new Map<string, { totalDebit: number; totalCredit: number }>();
  journalLines.forEach(line => {
    const existing = linesByAccount.get(line.accountHeadId) || { totalDebit: 0, totalCredit: 0 };
    existing.totalDebit += parseFloat(line.debitAmount.toString());
    existing.totalCredit += parseFloat(line.creditAmount.toString());
    linesByAccount.set(line.accountHeadId, existing);
  });

  const trialBalanceItems = accounts.map(account => {
    const lines = linesByAccount.get(account.id) || { totalDebit: 0, totalCredit: 0 };
    const opening = parseFloat(account.openingBalance.toString());
    const isDebitNormal = ['ASSET', 'EXPENSE'].includes(account.accountType);

    // Net balance = opening (on normal side) + debits - credits
    let netBalance: number;
    if (isDebitNormal) {
      netBalance = opening + lines.totalDebit - lines.totalCredit;
    } else {
      netBalance = opening + lines.totalCredit - lines.totalDebit;
    }

    // Place on appropriate side
    return {
      accountCode: account.code,
      accountName: account.name,
      accountType: account.accountType,
      debitBalance: netBalance > 0 && isDebitNormal ? netBalance : (!isDebitNormal && netBalance < 0 ? Math.abs(netBalance) : 0),
      creditBalance: netBalance > 0 && !isDebitNormal ? netBalance : (isDebitNormal && netBalance < 0 ? Math.abs(netBalance) : 0),
    };
  }).filter(item => item.debitBalance > 0 || item.creditBalance > 0); // Skip zero-balance accounts

  const totalDebits = trialBalanceItems.reduce((sum, i) => sum + i.debitBalance, 0);
  const totalCredits = trialBalanceItems.reduce((sum, i) => sum + i.creditBalance, 0);

  return {
    asOfDate,
    accounts: trialBalanceItems,
    totalDebits,
    totalCredits,
    isBalanced: Math.abs(totalDebits - totalCredits) < 0.01,
    difference: Math.abs(totalDebits - totalCredits),
  };
}
```

### Module Structure

```
apps/api/src/modules/reports/
  trial-balance.service.ts      (NEW)
  reports.controller.ts         (EXPAND)
  reports.routes.ts             (EXPAND — add GET /trial-balance)

apps/web/src/features/accounting/pages/
  TrialBalancePage.tsx           (NEW)
```

### POST-MVP DEFERRED

- **Server-side caching with invalidation on journal posting**: Use TanStack Query.
