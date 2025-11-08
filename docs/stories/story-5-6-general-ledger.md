# Story 5.6: General Ledger Report

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.6
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 5.3
**Status:** Draft - Phase 2

---

## User Story

**As an** accountant,
**I want** to view all transactions affecting a specific account,
**So that** I can audit account activity and trace transactions.

---

## Acceptance Criteria

1. GET /api/reports/general-ledger - generates GL report
2. Parameters: accountHeadId (required), date range (optional)
3. Shows: Date, Journal Entry #, Description, Reference, Debit, Credit, Running Balance
4. Running balance: Opening Balance + Debits - Credits (cumulative)
5. Includes opening balance row and closing balance row
6. Report exportable to Excel
7. Frontend allows clicking entry # to view full journal entry
8. Frontend allows clicking reference # to view source transaction

9. **Authorization & Role-Based Access:**
   - [ ] Accountant and Admin can access
   - [ ] Other roles: 403 Forbidden

10. **Performance & Caching:**
    - [ ] Cache GL report: 5 minutes per account/date range
    - [ ] Cache invalidation: On journal entry posting
    - [ ] API timeout: 15 seconds maximum
    - [ ] Paginate results if > 1000 items (cursor-based)

11. **Error Handling:**
    - [ ] Handle missing journal entries gracefully
    - [ ] Running balance calculation errors: Log and display alert
    - [ ] Missing reference transactions: Show as 'N/A'
    - [ ] Return partial GL with error flag if calculation fails

---

## Dev Notes

```typescript
interface GeneralLedgerItem {
  date: Date;
  entryNumber: string;
  description: string;
  referenceType?: string;
  referenceId?: string;
  debit: number;
  credit: number;
  runningBalance: number;
}

async function getGeneralLedger(
  accountHeadId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<GeneralLedgerItem[]> {
  const account = await prisma.accountHead.findUnique({
    where: { id: accountHeadId }
  });

  if (!account) {
    throw new NotFoundError('Account not found');
  }

  // Get opening balance
  const openingBalance = parseFloat(account.openingBalance.toString());

  // Get journal entry lines for this account
  const lines = await prisma.journalEntryLine.findMany({
    where: {
      accountHeadId,
      journalEntry: {
        status: 'POSTED',
        ...(dateFrom && { date: { gte: dateFrom } }),
        ...(dateTo && { date: { lte: dateTo } })
      }
    },
    include: {
      journalEntry: true
    },
    orderBy: {
      journalEntry: { date: 'asc' }
    }
  });

  let runningBalance = openingBalance;
  const items: GeneralLedgerItem[] = [];

  // Add opening balance row
  items.push({
    date: dateFrom || new Date(0),
    entryNumber: '',
    description: 'Opening Balance',
    debit: 0,
    credit: 0,
    runningBalance
  });

  // Add transaction lines
  lines.forEach(line => {
    const debit = parseFloat(line.debitAmount.toString());
    const credit = parseFloat(line.creditAmount.toString());

    // Update running balance based on account type
    if (['ASSET', 'EXPENSE'].includes(account.accountType)) {
      runningBalance += debit - credit;
    } else {
      runningBalance += credit - debit;
    }

    items.push({
      date: line.journalEntry.date,
      entryNumber: line.journalEntry.entryNumber,
      description: line.description || line.journalEntry.description,
      referenceType: line.journalEntry.referenceType,
      referenceId: line.journalEntry.referenceId,
      debit,
      credit,
      runningBalance
    });
  });

  // Add closing balance row
  items.push({
    date: dateTo || new Date(),
    entryNumber: '',
    description: 'Closing Balance',
    debit: 0,
    credit: 0,
    runningBalance
  });

  return items;
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
