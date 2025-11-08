# Story 5.4: Trial Balance Report

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.4
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 5.3 (Auto Journal Entries)
**Status:** Draft - Phase 2

---

## User Story

**As an** accountant,
**I want** to generate a trial balance showing all account balances,
**So that** I can verify debits equal credits and books are balanced.

---

## Acceptance Criteria

1. GET /api/reports/trial-balance generates trial balance
2. Parameters: asOfDate (date to calculate balances)
3. Shows: Account Code, Account Name, Debit Balance, Credit Balance
4. **Summary: Total Debits = Total Credits** (if balanced)
5. If not balanced, display error: "Books not balanced! Difference: X"
6. Report exportable to Excel
7. Frontend displays two-column table (Debits | Credits)
8. **Authorization & Role-Based Access:**
   - [ ] Accountant and Admin can access
   - [ ] Other roles: 403 Forbidden

9. **Performance & Caching:**
   - [ ] Cache trial balance: 10 minutes per date (balances rarely change during day)
   - [ ] Cache invalidation: On journal entry posting
   - [ ] API timeout: 20 seconds maximum
   - [ ] Optimize account balance queries with indexes

10. **Error Handling:**
    - [ ] Handle missing accounts gracefully
    - [ ] Balance calculation errors: Display with specific error message
    - [ ] If not balanced: Log discrepancy for investigation
    - [ ] Return partial data with error flag if calculation fails

---

## Dev Notes

```typescript
interface TrialBalanceItem {
  accountCode: string;
  accountName: string;
  debitBalance: number;
  creditBalance: number;
}

interface TrialBalanceResult {
  asOfDate: Date;
  accounts: TrialBalanceItem[];
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
  difference: number;
}

async function getTrialBalance(asOfDate: Date): Promise<TrialBalanceResult> {
  // Get all accounts with their balances
  const accounts = await prisma.accountHead.findMany({
    where: { status: 'ACTIVE' },
    orderBy: { code: 'asc' }
  });

  // Get all journal entry lines up to asOfDate
  const journalLines = await prisma.journalEntryLine.findMany({
    where: {
      journalEntry: {
        date: { lte: asOfDate },
        status: 'POSTED'
      }
    },
    include: { accountHead: true }
  });

  // Calculate balances
  const balances = new Map<string, { debit: number; credit: number }>();

  accounts.forEach(account => {
    balances.set(account.id, {
      debit: parseFloat(account.openingBalance.toString()),
      credit: 0
    });
  });

  journalLines.forEach(line => {
    const balance = balances.get(line.accountHeadId) || { debit: 0, credit: 0 };
    balance.debit += parseFloat(line.debitAmount.toString());
    balance.credit += parseFloat(line.creditAmount.toString());
    balances.set(line.accountHeadId, balance);
  });

  // Format for trial balance
  const trialBalanceItems: TrialBalanceItem[] = accounts.map(account => {
    const balance = balances.get(account.id) || { debit: 0, credit: 0 };
    const netBalance = balance.debit - balance.credit;

    // Asset/Expense: positive shown as debit, negative as credit
    // Liability/Equity/Revenue: positive shown as credit, negative as debit
    let debitBalance = 0;
    let creditBalance = 0;

    if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
      if (netBalance >= 0) {
        debitBalance = netBalance;
      } else {
        creditBalance = Math.abs(netBalance);
      }
    } else {
      if (netBalance >= 0) {
        creditBalance = netBalance;
      } else {
        debitBalance = Math.abs(netBalance);
      }
    }

    return {
      accountCode: account.code,
      accountName: account.name,
      debitBalance,
      creditBalance
    };
  });

  const totalDebits = trialBalanceItems.reduce((sum, item) => sum + item.debitBalance, 0);
  const totalCredits = trialBalanceItems.reduce((sum, item) => sum + item.creditBalance, 0);
  const difference = Math.abs(totalDebits - totalCredits);
  const isBalanced = difference < 0.01;

  return {
    asOfDate,
    accounts: trialBalanceItems,
    totalDebits,
    totalCredits,
    isBalanced,
    difference
  };
}
```

**Frontend:**
```tsx
export const TrialBalancePage: FC = () => {
  const [asOfDate, setAsOfDate] = useState(new Date());
  const { data, isLoading } = useGetTrialBalance(asOfDate);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Trial Balance</h1>

      <DatePicker value={asOfDate} onChange={setAsOfDate} />

      {data && (
        <>
          <Alert variant={data.isBalanced ? 'success' : 'error'}>
            {data.isBalanced
              ? 'Books are balanced ✓'
              : `Books NOT balanced! Difference: Rs.${data.difference.toFixed(2)}`}
          </Alert>

          <Table>
            <thead>
              <tr>
                <th>Code</th>
                <th>Account Name</th>
                <th>Debit</th>
                <th>Credit</th>
              </tr>
            </thead>
            <tbody>
              {data.accounts.map(acc => (
                <tr key={acc.accountCode}>
                  <td>{acc.accountCode}</td>
                  <td>{acc.accountName}</td>
                  <td>{acc.debitBalance > 0 ? `Rs.${acc.debitBalance.toFixed(2)}` : '-'}</td>
                  <td>{acc.creditBalance > 0 ? `Rs.${acc.creditBalance.toFixed(2)}` : '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="font-bold">
                <td colSpan={2}>TOTALS</td>
                <td>Rs.{data.totalDebits.toFixed(2)}</td>
                <td>Rs.{data.totalCredits.toFixed(2)}</td>
              </tr>
            </tfoot>
          </Table>
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
