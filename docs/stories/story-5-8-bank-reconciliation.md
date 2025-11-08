# Story 5.8: Bank Reconciliation

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.8
**Priority:** Medium
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 5.7
**Status:** Draft - Phase 2

---

## User Story

**As an** accountant,
**I want** to reconcile bank statements with system records,
**So that** discrepancies can be identified and resolved.

---

## Acceptance Criteria

1. BankReconciliation table: id, bankAccountId, statementDate, statementBalance, systemBalance, status
2. BankReconciliationItem table: id, reconciliationId, journalEntryLineId, matched, notes
3. POST /api/bank-reconciliation creates reconciliation session
4. GET /api/bank-reconciliation/:id/unmatched returns unmatched transactions
5. POST /api/bank-reconciliation/:id/match marks transaction as matched
6. Status: IN_PROGRESS → COMPLETED
7. Frontend allows upload bank statement (CSV/Excel) or manual entry
8. Frontend displays system transactions for period
9. Frontend allows matching statement to system entries

10. **Authorization & Role-Based Access:**
    - [ ] Accountant and Admin can perform reconciliation
    - [ ] Other roles: 403 Forbidden
    - [ ] Reconciliation process logged in audit trail

11. **Performance & Caching:**
    - [ ] No caching for reconciliation data (real-time accuracy required)
    - [ ] API timeout: 20 seconds maximum (matching logic can be complex)
    - [ ] Pagination: max 500 unmatched transactions per request

12. **Error Handling:**
    - [ ] Validate statement date is valid
    - [ ] Handle CSV/Excel parsing errors gracefully
    - [ ] Prevent duplicate reconciliations for same statement
    - [ ] If statement balance ≠ system balance: Display difference clearly
    - [ ] Handle missing/invalid transaction data (skip with warning)
    - [ ] Catch matching logic errors and display to user

---

## Dev Notes

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

```typescript
async function createReconciliation(data: {
  bankAccountId: string;
  statementDate: Date;
  statementBalance: number;
}, userId: string): Promise<BankReconciliation> {
  // Get system balance for bank account
  const account = await prisma.accountHead.findUnique({
    where: { id: data.bankAccountId }
  });

  const systemBalance = parseFloat(account!.currentBalance.toString());

  return await prisma.bankReconciliation.create({
    data: {
      bankAccountId: data.bankAccountId,
      statementDate: data.statementDate,
      statementBalance: data.statementBalance,
      systemBalance,
      reconciledBy: userId
    }
  });
}

async function matchTransaction(
  reconciliationId: string,
  itemId: string,
  journalLineId: string
): Promise<void> {
  await prisma.bankReconciliationItem.update({
    where: { id: itemId },
    data: {
      journalEntryLineId: journalLineId,
      matched: true
    }
  });
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
