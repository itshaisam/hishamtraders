# Story 5.9: Petty Cash Management

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.9
**Priority:** Low
**Estimated Effort:** 4-6 hours
**Dependencies:** Story 5.3
**Status:** Draft - Phase 2

---

## User Story

**As an** accountant,
**I want** to track petty cash separately with advances and settlements,
**So that** small cash expenses are properly recorded.

---

## Acceptance Criteria

1. Petty Cash account (code 1102) in Chart of Accounts
2. POST /api/petty-cash/advance - moves money from bank to petty cash
   - Debit: Petty Cash (1102)
   - Credit: Bank Account (1101)
3. Expense paid from petty cash:
   - Debit: Expense Account (5XXX)
   - Credit: Petty Cash (1102)
4. POST /api/petty-cash/settlement - settles petty cash (records expenses, replenishes)
5. GET /api/account-heads/1102/balance - returns petty cash balance
6. Frontend Petty Cash page shows balance, advance, expense, settle
7. **Authorization & Role-Based Access:**
   - [ ] Only Accountant and Admin can manage petty cash
   - [ ] Other roles: 403 Forbidden
   - [ ] Petty cash operations logged in audit trail

8. **Performance & Caching:**
   - [ ] Cache petty cash balance: 5 minutes
   - [ ] Cache invalidation: On advance/expense/settlement
   - [ ] API timeout: 10 seconds maximum

9. **Error Handling:**
   - [ ] Validate advance amount > 0
   - [ ] Prevent advance if bank balance insufficient
   - [ ] Validate expense amount matches receipts total
   - [ ] Handle missing expense category gracefully
   - [ ] Display validation errors with specific reason

---

## Dev Notes

```typescript
async function recordPettyCashAdvance(data: {
  amount: number;
  bankAccountId: string;
  date: Date;
}, userId: string): Promise<JournalEntry> {
  const lines = [
    // Debit: Petty Cash
    {
      accountHeadId: await getAccountByCode('1102'),
      debitAmount: data.amount,
      creditAmount: 0,
      description: 'Petty cash advance'
    },
    // Credit: Bank Account
    {
      accountHeadId: data.bankAccountId,
      debitAmount: 0,
      creditAmount: data.amount,
      description: 'Bank transfer to petty cash'
    }
  ];

  return await createJournalEntry({
    date: data.date,
    description: 'Petty cash advance from bank',
    lines
  }, userId);
}

async function recordPettyCashExpense(data: {
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: Date;
}, userId: string): Promise<JournalEntry> {
  const expenseAccountCode = getCategoryAccountCode(data.category);

  const lines = [
    // Debit: Expense Account
    {
      accountHeadId: await getAccountByCode(expenseAccountCode),
      debitAmount: data.amount,
      creditAmount: 0,
      description: data.description
    },
    // Credit: Petty Cash
    {
      accountHeadId: await getAccountByCode('1102'),
      debitAmount: 0,
      creditAmount: data.amount,
      description: 'Paid from petty cash'
    }
  ];

  return await createJournalEntry({
    date: data.date,
    description: `Petty cash expense: ${data.description}`,
    lines
  }, userId);
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
