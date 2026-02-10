# Story 5.2: Journal Entry Creation (Manual)

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.2
**Priority:** Critical
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 5.1 (Chart of Accounts)
**Status:** Draft — Phase 2

---

## User Story

**As an** accountant,
**I want** to create manual journal entries for accounting adjustments,
**So that** corrections, accruals, and special transactions can be recorded.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] `JournalEntry`: id, entryNumber (unique), date, description, status (DRAFT/POSTED), referenceType, referenceId, createdBy, approvedBy
   - [ ] `JournalEntryLine`: id, journalEntryId, accountHeadId, debitAmount, creditAmount, description
   - [ ] **Validation: Sum(debits) MUST equal Sum(credits)** (double-entry rule)

2. **Entry Status Workflow:**
   - [ ] DRAFT (editable) → POSTED (posted to GL, immutable)
   - [ ] When POSTED, account balances updated atomically in `$transaction`
   - [ ] Entry number auto-generated: `JE-YYYYMMDD-XXX`

3. **Backend API:**
   - [ ] `POST /api/v1/journal-entries` — Create entry with lines (status=DRAFT)
   - [ ] `GET /api/v1/journal-entries` — List entries with filters (status, date range)
   - [ ] `GET /api/v1/journal-entries/:id` — Entry details with lines
   - [ ] `PUT /api/v1/journal-entries/:id` — Update entry (only if DRAFT)
   - [ ] `POST /api/v1/journal-entries/:id/post` — Post entry to GL
   - [ ] `DELETE /api/v1/journal-entries/:id` — Delete draft entry only

4. **Frontend:**
   - [ ] Journal Entry form: date, description, line item rows (account, debit, credit)
   - [ ] Running debit/credit totals and difference (must be 0 to save)
   - [ ] "Post to GL" button with confirmation dialog

5. **Authorization:**
   - [ ] Only `ACCOUNTANT` and `ADMIN` can create/post journal entries
   - [ ] Other roles: 403 Forbidden

---

## Dev Notes

### Implementation Status

**Backend:** Not started. `JournalEntry` and `JournalEntryLine` models do not exist.

**Frontend:** No journal entry pages exist.

### Database Schema (Proposed)

```prisma
model JournalEntry {
  id           String              @id @default(cuid())
  entryNumber  String              @unique
  date         DateTime            @default(now())
  description  String              @db.Text
  status       JournalEntryStatus  @default(DRAFT)
  referenceType String?            // INVOICE, PAYMENT, PO, EXPENSE, STOCK_ADJUSTMENT
  referenceId  String?
  createdBy    String
  approvedBy   String?
  createdAt    DateTime            @default(now())
  updatedAt    DateTime            @updatedAt

  creator      User                @relation("CreatedJournalEntries", fields: [createdBy], references: [id])
  approver     User?               @relation("ApprovedJournalEntries", fields: [approvedBy], references: [id])
  lines        JournalEntryLine[]

  @@index([status, date])
  @@map("journal_entries")
}

model JournalEntryLine {
  id             String        @id @default(cuid())
  journalEntryId String
  accountHeadId  String
  debitAmount    Decimal       @db.Decimal(12, 2) @default(0)
  creditAmount   Decimal       @db.Decimal(12, 2) @default(0)
  description    String?       @db.Text
  createdAt      DateTime      @default(now())

  journalEntry   JournalEntry  @relation(fields: [journalEntryId], references: [id], onDelete: Cascade)
  accountHead    AccountHead   @relation(fields: [accountHeadId], references: [id])

  @@index([journalEntryId, accountHeadId])
  @@map("journal_entry_lines")
}

enum JournalEntryStatus {
  DRAFT
  POSTED
}
```

### Key Corrections

1. **Entry number parsing bug** — The format is `JE-YYYYMMDD-XXX`. To extract the sequence number:
   ```typescript
   // WRONG: split('-')[2] gives the date part
   // CORRECT: get the last segment
   const parts = latestEntry.entryNumber.split('-');
   const lastNumber = parseInt(parts[parts.length - 1]);
   ```

2. **Balance update logic by account type** — When posting, account balance changes depend on normal balance:
   - ASSET, EXPENSE: Debits increase balance, credits decrease → `balanceChange = debit - credit`
   - LIABILITY, EQUITY, REVENUE: Credits increase balance, debits decrease → `balanceChange = credit - debit`

3. **User relation additions** — `User` model needs two new relations:
   ```prisma
   // In User model:
   createdJournalEntries   JournalEntry[] @relation("CreatedJournalEntries")
   approvedJournalEntries  JournalEntry[] @relation("ApprovedJournalEntries")
   ```

### Posting Logic (Correct)

```typescript
async postJournalEntry(id: string, userId: string): Promise<JournalEntry> {
  return await prisma.$transaction(async (tx) => {
    const entry = await tx.journalEntry.findUnique({
      where: { id },
      include: { lines: { include: { accountHead: true } } }
    });

    if (!entry) throw new NotFoundError('Journal entry not found');
    if (entry.status === 'POSTED') throw new BadRequestError('Already posted');

    // Verify balance
    const totalDebits = entry.lines.reduce(
      (sum, l) => sum + parseFloat(l.debitAmount.toString()), 0);
    const totalCredits = entry.lines.reduce(
      (sum, l) => sum + parseFloat(l.creditAmount.toString()), 0);

    if (Math.abs(totalDebits - totalCredits) > 0.01) {
      throw new BadRequestError('Entry not balanced');
    }

    // Update status
    const posted = await tx.journalEntry.update({
      where: { id },
      data: { status: 'POSTED', approvedBy: userId },
      include: { lines: { include: { accountHead: true } } }
    });

    // Update account balances
    for (const line of posted.lines) {
      const debit = parseFloat(line.debitAmount.toString());
      const credit = parseFloat(line.creditAmount.toString());
      const isDebitNormal = ['ASSET', 'EXPENSE'].includes(line.accountHead.accountType);
      const balanceChange = isDebitNormal ? (debit - credit) : (credit - debit);

      await tx.accountHead.update({
        where: { id: line.accountHeadId },
        data: { currentBalance: { increment: balanceChange } }
      });
    }

    return posted;
  });
}
```

### Module Structure

```
apps/api/src/modules/journal-entries/
  journal-entries.controller.ts
  journal-entries.service.ts
  journal-entries.routes.ts

apps/web/src/features/accounting/pages/
  JournalEntryPage.tsx
  JournalEntryListPage.tsx
```

### POST-MVP DEFERRED

- **Server-side caching**: Use TanStack Query client-side caching.
- **Reversal entries**: For now, create a new correcting entry manually. Automated reversal deferred.
