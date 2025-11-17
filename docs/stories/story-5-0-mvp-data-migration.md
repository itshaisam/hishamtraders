# Story 5.0: MVP Data Migration to General Ledger

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.0
**Priority:** Critical (for Phase 2)
**Estimated Effort:** 8-12 hours
**Dependencies:** All MVP Stories (Epics 1-4), Story 5.1 (Chart of Accounts)
**Status:** New

---

## User Story

**As a** developer,
**I want** a one-time migration script that creates historical journal entries for all MVP transactions,
**So that** the General Ledger is accurate from the moment Phase 2 is deployed.

---

## Acceptance Criteria

1.  **Script Creation:**
    *   [ ] A script is created (e.g., `prisma/migrations/scripts/backfill-gl.ts`) that can be run once to populate the `JournalEntry` table.
    *   [ ] The script is idempotent, meaning it can be run multiple times without creating duplicate entries. It should check if a journal entry for a specific transaction already exists before creating one.

2.  **Transaction Coverage:**
    *   [ ] The script processes all `Invoices` created during the MVP phase and generates the corresponding journal entries (Debit A/R, Credit Sales, Credit Tax).
    *   [ ] The script processes all `Client Payments` and generates the corresponding journal entries (Debit Bank, Credit A/R).
    *   [ ] The script processes all `Purchase Order Receipts` and generates journal entries (Debit Inventory, Credit A/P).
    *   [ ] The script processes all `Supplier Payments` and generates journal entries (Debit A/P, Credit Bank).
    *   [ ] The script processes all `Expenses` and generates journal entries (Debit Expense Account, Credit Bank/Cash).
    *   [ ] The script processes all `Stock Adjustments` (Wastage/Damage) and generates journal entries (Debit Inventory Loss, Credit Inventory).

3.  **Data Integrity & Validation:**
    *   [ ] After the script runs, the `currentBalance` of all accounts in the `AccountHead` table is correctly updated.
    *   [ ] A post-migration validation step is included: the script generates a Trial Balance report and confirms that total debits equal total credits.
    *   [ ] The script handles potential edge cases, such as voided invoices from the MVP phase (these should be ignored).

4.  **Execution & Documentation:**
    *   [ ] The script is documented in the project's `README.md` with clear instructions on how and when to run it.
    *   [ ] The script logs its progress, indicating how many of each transaction type were processed.

---

## Dev Notes

### Migration Strategy

This script should be run **once** during the deployment of Phase 2. It bridges the gap between the simplified accounting of the MVP and the double-entry system of Phase 2.

### Idempotency Check

To ensure the script can be run multiple times without creating duplicates, each auto-generated journal entry should be linked to its source transaction.

```typescript
// Example check within the script
const existingEntry = await prisma.journalEntry.findFirst({
  where: {
    referenceType: 'INVOICE',
    referenceId: invoice.id,
  },
});

if (!existingEntry) {
  // Create the journal entry for this invoice
}
```

### Transaction Processing Order

The script should process transactions in chronological order to ensure account balances are calculated correctly.

1.  **Purchase Order Receipts:** To establish inventory value.
2.  **Invoices:** To establish revenue and accounts receivable.
3.  **Client Payments:** To reduce accounts receivable.
4.  **Supplier Payments:** To reduce accounts payable.
5.  **Expenses:** To record operational costs.
6.  **Stock Adjustments:** To account for inventory changes.

### Validation Step

After processing all transactions, the script should perform a final validation.

```typescript
// At the end of the migration script
console.log('Validating General Ledger...');

const trialBalance = await getTrialBalance(new Date()); // Use the service from Story 5.4

if (trialBalance.isBalanced) {
  console.log('✅ Migration successful! Trial balance is balanced.');
} else {
  console.error('❌ Migration failed! Trial balance is NOT balanced.');
  console.error(`Difference: ${trialBalance.difference}`);
}
```
