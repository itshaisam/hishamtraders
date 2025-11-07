# Story 5.7: Multiple Bank Account Tracking

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.7
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 5.1
**Status:** Draft - Phase 2

---

## User Story

**As an** accountant,
**I want** to track multiple bank accounts separately,
**So that** cash flow is managed accurately across different accounts.

---

## Acceptance Criteria

1. Chart of Accounts includes multiple bank account heads (1101, 1102, etc.)
2. Payment table includes bankAccountId field
3. When recording payment, user selects which bank account
4. GET /api/account-heads/:id/balance returns balance for bank account
5. Bank balances updated via journal entries
6. GET /api/bank-accounts returns all bank accounts with balances
7. Frontend Bank Accounts page lists all with balances
8. Frontend allows adding new bank account
9. Frontend payment form includes bank account dropdown

---

## Dev Notes

```prisma
model Payment {
  id            String         @id @default(cuid())
  paymentType   PaymentType
  bankAccountId String?        // References AccountHead (code 11XX)
  amount        Decimal        @db.Decimal(12, 2)
  method        PaymentMethod
  date          DateTime
  notes         String?        @db.Text
  recordedBy    String

  bankAccount   AccountHead?   @relation(fields: [bankAccountId], references: [id])
  // ...other fields
}
```

```typescript
async function getBankAccounts(): Promise<any[]> {
  const bankAccounts = await prisma.accountHead.findMany({
    where: {
      code: { startsWith: '11' },
      accountType: 'ASSET',
      status: 'ACTIVE'
    },
    orderBy: { code: 'asc' }
  });

  return bankAccounts.map(acc => ({
    id: acc.id,
    code: acc.code,
    name: acc.name,
    balance: parseFloat(acc.currentBalance.toString())
  }));
}

async function createBankAccount(data: { name: string }): Promise<AccountHead> {
  // Find next available code (11XX)
  const existingBankAccounts = await prisma.accountHead.findMany({
    where: { code: { startsWith: '11' } },
    orderBy: { code: 'desc' }
  });

  const nextCode = existingBankAccounts.length > 0
    ? (parseInt(existingBankAccounts[0].code) + 1).toString()
    : '1101';

  return await prisma.accountHead.create({
    data: {
      code: nextCode,
      name: data.name,
      accountType: 'ASSET',
      parentId: (await prisma.accountHead.findUnique({ where: { code: '1100' } }))?.id
    }
  });
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
