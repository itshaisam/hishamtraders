# Story 5.5: Balance Sheet Generation

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.5
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 5.4 (Trial Balance)
**Status:** Draft - Phase 2

---

## User Story

**As an** admin,
**I want** to generate a balance sheet showing assets, liabilities, and equity,
**So that** I can understand the company's financial position.

---

## Acceptance Criteria

1. GET /api/reports/balance-sheet generates balance sheet
2. Parameters: asOfDate
3. Report structure:
   - ASSETS (Current Assets, Fixed Assets, Total)
   - LIABILITIES (Current, Long-term, Total)
   - EQUITY (Capital, Retained Earnings, Total)
   - **Equation: Total Assets = Total Liabilities + Total Equity**
4. Retained Earnings = Previous Retained Earnings + Net Profit
5. Net Profit = Revenue - Expenses
6. Report exportable to Excel
7. Only Admin and Accountant can access

---

## Dev Notes

```typescript
interface BalanceSheetResult {
  asOfDate: Date;
  assets: {
    currentAssets: AccountBalance[];
    fixedAssets: AccountBalance[];
    totalAssets: number;
  };
  liabilities: {
    currentLiabilities: AccountBalance[];
    longTermLiabilities: AccountBalance[];
    totalLiabilities: number;
  };
  equity: {
    capital: number;
    retainedEarnings: number;
    totalEquity: number;
  };
  isBalanced: boolean;
}

async function getBalanceSheet(asOfDate: Date): Promise<BalanceSheetResult> {
  const accounts = await prisma.accountHead.findMany({
    where: { status: 'ACTIVE' },
    include: { journalLines: { where: { journalEntry: { date: { lte: asOfDate }, status: 'POSTED' } } } }
  });

  const calculateBalance = (account: any) => {
    const opening = parseFloat(account.openingBalance.toString());
    const debits = account.journalLines.reduce((sum: number, line: any) =>
      sum + parseFloat(line.debitAmount.toString()), 0);
    const credits = account.journalLines.reduce((sum: number, line: any) =>
      sum + parseFloat(line.creditAmount.toString()), 0);
    return opening + debits - credits;
  };

  // Assets
  const assetAccounts = accounts.filter(a => a.accountType === 'ASSET');
  const currentAssets = assetAccounts
    .filter(a => parseInt(a.code) < 1400)
    .map(a => ({ code: a.code, name: a.name, balance: calculateBalance(a) }));
  const fixedAssets = assetAccounts
    .filter(a => parseInt(a.code) >= 1400)
    .map(a => ({ code: a.code, name: a.name, balance: calculateBalance(a) }));

  const totalAssets =
    currentAssets.reduce((sum, a) => sum + a.balance, 0) +
    fixedAssets.reduce((sum, a) => sum + a.balance, 0);

  // Liabilities
  const liabilityAccounts = accounts.filter(a => a.accountType === 'LIABILITY');
  const currentLiabilities = liabilityAccounts
    .filter(a => parseInt(a.code) < 2300)
    .map(a => ({ code: a.code, name: a.name, balance: calculateBalance(a) }));
  const longTermLiabilities = liabilityAccounts
    .filter(a => parseInt(a.code) >= 2300)
    .map(a => ({ code: a.code, name: a.name, balance: calculateBalance(a) }));

  const totalLiabilities =
    currentLiabilities.reduce((sum, a) => sum + a.balance, 0) +
    longTermLiabilities.reduce((sum, a) => sum + a.balance, 0);

  // Equity
  const capitalAccount = accounts.find(a => a.code === '3100');
  const capital = capitalAccount ? calculateBalance(capitalAccount) : 0;

  // Calculate Net Profit
  const revenueAccounts = accounts.filter(a => a.accountType === 'REVENUE');
  const expenseAccounts = accounts.filter(a => a.accountType === 'EXPENSE');
  const totalRevenue = revenueAccounts.reduce((sum, a) => sum + calculateBalance(a), 0);
  const totalExpenses = expenseAccounts.reduce((sum, a) => sum + calculateBalance(a), 0);
  const netProfit = totalRevenue - totalExpenses;

  const retainedEarnings = netProfit; // Simplified; in reality, add previous retained earnings
  const totalEquity = capital + retainedEarnings;

  return {
    asOfDate,
    assets: { currentAssets, fixedAssets, totalAssets },
    liabilities: { currentLiabilities, longTermLiabilities, totalLiabilities },
    equity: { capital, retainedEarnings, totalEquity },
    isBalanced: Math.abs(totalAssets - (totalLiabilities + totalEquity)) < 0.01
  };
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
