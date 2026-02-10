# Story 5.7: Multiple Bank Account Tracking

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.7
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 5.1
**Status:** Draft — Phase 2

---

## User Story

**As an** accountant,
**I want** to track multiple bank accounts separately,
**So that** cash flow is managed accurately across different accounts.

---

## Acceptance Criteria

1. Chart of Accounts includes multiple bank account heads under 1100 (e.g., 1101, 1102, etc.)
2. **Schema change:** Add `bankAccountId` (optional FK to AccountHead) on `Payment` model
3. When recording payment, user selects which bank account
4. `GET /api/v1/bank-accounts` returns all bank-type accounts with balances
5. Bank balances updated via journal entries (Story 5.3)
6. Frontend: Bank Accounts page lists all accounts with balances
7. Frontend: Payment form includes bank account dropdown
8. **Authorization:** `ACCOUNTANT` and `ADMIN` can manage bank accounts

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on AccountHead model (Story 5.1).

**Current Payment model fields** (for reference):
```
Payment: id, paymentType (SUPPLIER|CLIENT), clientId, supplierId, amount, method,
         referenceNumber, date, notes, recordedBy, paymentReferenceType, referenceId
         (NO bankAccountId — needs to be ADDED)
```

### Schema Change Required

Add to `Payment` model:
```prisma
bankAccountId String?
bankAccount   AccountHead? @relation(fields: [bankAccountId], references: [id])
```

This is a nullable FK because:
- Existing payments (from MVP) won't have a bank account assigned
- Cash payments may not map to a bank account

### Key Corrections

1. **API paths**: Use `/api/v1/bank-accounts` (not `/api/bank-accounts`)
2. **`AccountHead` needs a `payments` relation** added for the FK:
   ```prisma
   // In AccountHead model:
   payments AccountHead[] // only for bank accounts (11XX codes)
   ```

### Bank Account Service

```typescript
async function getBankAccounts() {
  return prisma.accountHead.findMany({
    where: { code: { startsWith: '11' }, accountType: 'ASSET', status: 'ACTIVE' },
    orderBy: { code: 'asc' },
    select: { id: true, code: true, name: true, currentBalance: true },
  });
}

async function createBankAccount(name: string) {
  const existing = await prisma.accountHead.findMany({
    where: { code: { startsWith: '11' } },
    orderBy: { code: 'desc' },
  });

  const nextCode = existing.length > 0
    ? (parseInt(existing[0].code) + 1).toString()
    : '1101';

  const parent = await prisma.accountHead.findUnique({ where: { code: '1100' } });

  return prisma.accountHead.create({
    data: {
      code: nextCode,
      name,
      accountType: 'ASSET',
      parentId: parent?.id,
    }
  });
}
```

### POST-MVP DEFERRED

- **Server-side caching**: Use TanStack Query.
- **Bank account statements import**: Deferred to Story 5.8 (Bank Reconciliation).
