# Story 5.9: Petty Cash Management

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.9
**Priority:** Low
**Estimated Effort:** 4-6 hours
**Dependencies:** Story 5.3
**Status:** Draft — Phase 2

---

## User Story

**As an** accountant,
**I want** to track petty cash separately with advances and settlements,
**So that** small cash expenses are properly recorded.

---

## Acceptance Criteria

1. Petty Cash account (code 1102) exists in Chart of Accounts (seeded in Story 5.1)
2. `POST /api/v1/petty-cash/advance` — Moves money from bank to petty cash
   - Creates journal entry: Debit Petty Cash (1102), Credit Bank (1101)
3. Expense with `paymentMethod: 'CASH'` auto-creates journal entry via Story 5.3:
   - Debit Expense Account (5XXX), Credit Petty Cash (1102)
4. `GET /api/v1/petty-cash/balance` — Returns current petty cash balance (from AccountHead 1102)
5. Frontend: Petty Cash page showing balance, advance form, recent transactions
6. **Authorization:** Only `ACCOUNTANT` and `ADMIN`

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on AccountHead + JournalEntry models.

### Key Notes

- Petty cash advance is just a journal entry (Debit 1102, Credit bank account)
- Petty cash expenses are handled by the existing Expense module + auto-journal (Story 5.3)
- No new models needed — this story is mostly a UI for managing petty cash workflows

### Module Structure

```
apps/api/src/modules/petty-cash/
  petty-cash.controller.ts      (NEW — advance, balance endpoints)
  petty-cash.service.ts         (NEW — creates journal entries)
  petty-cash.routes.ts          (NEW)

apps/web/src/features/accounting/pages/
  PettyCashPage.tsx             (NEW)
```

### POST-MVP DEFERRED

- **Petty cash settlement workflow**: For MVP, just track advances and expenses. Formal settlement deferred.
- **Receipt attachment**: Expense model has `receiptUrl` but upload not required for MVP.
