# Story 5.6: General Ledger Report

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.6
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 5.3
**Status:** Done

---

## User Story

**As an** accountant,
**I want** to view all transactions affecting a specific account,
**So that** I can audit account activity and trace transactions.

---

## Acceptance Criteria

1. `GET /api/v1/reports/general-ledger` generates GL report
2. Parameters: `accountHeadId` (required), `dateFrom`, `dateTo`
3. Shows: Date, Journal Entry #, Description, Reference, Debit, Credit, Running Balance
4. Running balance: Opening Balance +/- transactions (cumulative, respecting account type)
5. Includes opening balance row and closing balance row
6. Export to Excel (Story 4.9 pattern)
7. Clicking entry # navigates to journal entry detail
8. Clicking reference navigates to source transaction (invoice, payment, etc.)
9. **Authorization:** Only `ACCOUNTANT` and `ADMIN`

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on JournalEntry + JournalEntryLine models.

### Key Corrections

1. **API path**: `/api/v1/reports/general-ledger` (not `/api/reports/general-ledger`)
2. **Running balance must respect account type** — ASSET/EXPENSE: `+debit -credit`. LIABILITY/EQUITY/REVENUE: `+credit -debit`.
3. **Pagination**: Use offset-based pagination (default 100, max 500). Cursor-based is over-engineered for this.

### General Ledger Logic (Correct)

```typescript
async function getGeneralLedger(
  accountHeadId: string,
  dateFrom?: Date,
  dateTo?: Date
): Promise<{ items: GeneralLedgerItem[]; closingBalance: number }> {
  const account = await prisma.accountHead.findUnique({ where: { id: accountHeadId } });
  if (!account) throw new NotFoundError('Account not found');

  const isDebitNormal = ['ASSET', 'EXPENSE'].includes(account.accountType);
  let runningBalance = parseFloat(account.openingBalance.toString());

  const lines = await prisma.journalEntryLine.findMany({
    where: {
      accountHeadId,
      journalEntry: {
        status: 'POSTED',
        ...(dateFrom && dateTo && { date: { gte: dateFrom, lte: dateTo } }),
      }
    },
    include: { journalEntry: true },
    orderBy: { journalEntry: { date: 'asc' } },
  });

  const items: GeneralLedgerItem[] = [
    { date: dateFrom || new Date(0), entryNumber: '', description: 'Opening Balance',
      debit: 0, credit: 0, runningBalance }
  ];

  lines.forEach(line => {
    const debit = parseFloat(line.debitAmount.toString());
    const credit = parseFloat(line.creditAmount.toString());
    runningBalance += isDebitNormal ? (debit - credit) : (credit - debit);

    items.push({
      date: line.journalEntry.date,
      entryNumber: line.journalEntry.entryNumber,
      description: line.description || line.journalEntry.description,
      referenceType: line.journalEntry.referenceType || undefined,
      referenceId: line.journalEntry.referenceId || undefined,
      debit, credit, runningBalance,
    });
  });

  items.push({
    date: dateTo || new Date(), entryNumber: '', description: 'Closing Balance',
    debit: 0, credit: 0, runningBalance,
  });

  return { items, closingBalance: runningBalance };
}
```

### Module Structure

```
apps/api/src/modules/reports/
  general-ledger.service.ts     (NEW)
  reports.controller.ts         (EXPAND)
  reports.routes.ts             (EXPAND — add GET /general-ledger)

apps/web/src/features/accounting/pages/
  GeneralLedgerPage.tsx          (NEW)
```

### POST-MVP DEFERRED

- **Cursor-based pagination**: Offset pagination is sufficient.
- **Server-side caching with invalidation**: Use TanStack Query.
