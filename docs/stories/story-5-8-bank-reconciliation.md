# Story 5.8: Bank Reconciliation

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.8
**Priority:** Medium
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 5.7
**Status:** Done

---

## User Story

**As an** accountant,
**I want** to reconcile bank statements with system records,
**So that** discrepancies can be identified and resolved.

---

## Acceptance Criteria

1. **Schema:** `BankReconciliation` and `BankReconciliationItem` models (see Dev Notes)
2. `POST /api/v1/bank-reconciliation` — Create reconciliation session
3. `GET /api/v1/bank-reconciliation/:id/unmatched` — Return unmatched transactions
4. `POST /api/v1/bank-reconciliation/:id/match` — Mark transaction as matched
5. `POST /api/v1/bank-reconciliation/:id/complete` — Mark reconciliation as COMPLETED
6. Status workflow: `IN_PROGRESS` → `COMPLETED`
7. Frontend: Upload bank statement (CSV) or manual entry
8. Frontend: Display system transactions for period alongside statement items
9. Frontend: Match statement items to system entries
10. **Authorization:** Only `ACCOUNTANT` and `ADMIN`

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on AccountHead + JournalEntry models.

### Database Schema (Proposed)

```prisma
model BankReconciliation {
  id               String                    @id @default(cuid())
  bankAccountId    String
  statementDate    DateTime
  statementBalance Decimal                   @db.Decimal(12, 2)
  systemBalance    Decimal                   @db.Decimal(12, 2)
  status           ReconciliationStatus      @default(IN_PROGRESS)
  reconciledBy     String
  createdAt        DateTime                  @default(now())
  completedAt      DateTime?

  bankAccount      AccountHead               @relation(fields: [bankAccountId], references: [id])
  user             User                      @relation(fields: [reconciledBy], references: [id])
  items            BankReconciliationItem[]

  @@map("bank_reconciliations")
}

model BankReconciliationItem {
  id               String             @id @default(cuid())
  reconciliationId String
  journalEntryLineId String?
  statementAmount  Decimal            @db.Decimal(12, 2)
  statementDate    DateTime
  description      String
  matched          Boolean            @default(false)
  notes            String?            @db.Text

  reconciliation   BankReconciliation @relation(fields: [reconciliationId], references: [id])
  journalLine      JournalEntryLine?  @relation(fields: [journalEntryLineId], references: [id])

  @@map("bank_reconciliation_items")
}

enum ReconciliationStatus {
  IN_PROGRESS
  COMPLETED
}
```

### Key Corrections

1. **API paths**: All use `/api/v1/bank-reconciliation` prefix (not `/api/bank-reconciliation`)
2. **User model** needs relation added: `bankReconciliations BankReconciliation[]`
3. **JournalEntryLine** needs relation added: `reconciliationItems BankReconciliationItem[]`

### POST-MVP DEFERRED

- **Auto-matching algorithm**: Manual matching for MVP. Auto-suggest matches by amount/date deferred.
- **CSV/Excel parsing**: Can start with manual entry of statement items. File upload deferred.
