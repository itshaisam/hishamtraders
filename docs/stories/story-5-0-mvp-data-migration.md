# Story 5.0: MVP Data Migration to General Ledger

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.0
**Priority:** Critical (for Phase 2)
**Estimated Effort:** 8-12 hours
**Dependencies:** All MVP Stories (Epics 1-4), Story 5.1 (Chart of Accounts)
**Status:** Done

---

## User Story

**As a** developer,
**I want** a one-time migration script that creates historical journal entries for all MVP transactions,
**So that** the General Ledger is accurate from the moment Phase 2 is deployed.

---

## Acceptance Criteria

1.  **Script Creation:**
    *   [ ] Script at `prisma/migrations/scripts/backfill-gl.ts`, runnable once to populate `JournalEntry` table.
    *   [ ] Idempotent: checks if journal entry for a transaction already exists before creating.

2.  **Transaction Coverage:**
    *   [ ] Invoices → Debit A/R, Credit Sales Revenue, Credit Tax Payable
    *   [ ] Client Payments → Debit Bank, Credit A/R
    *   [ ] PO Receipts → Debit Inventory, Credit A/P
    *   [ ] Supplier Payments → Debit A/P, Credit Bank
    *   [ ] Expenses → Debit Expense Account, Credit Bank/Cash
    *   [ ] Stock Adjustments (Wastage/Damage) → Debit Inventory Loss, Credit Inventory

3.  **Data Integrity:**
    *   [ ] After script runs, `AccountHead.currentBalance` is correctly updated for all accounts.
    *   [ ] Post-migration validation: generate Trial Balance, confirm debits = credits.
    *   [ ] Voided invoices are ignored.

4.  **Execution:**
    *   [ ] Script logs progress (count of each transaction type processed).
    *   [ ] Documented in README with run instructions.

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on Story 5.1 (AccountHead model) and Story 5.2 (JournalEntry model).

### Schema Field Reference (Existing MVP Models)

```
Invoice:      id, invoiceNumber, invoiceDate, clientId, total, taxAmount, taxRate, paidAmount, status
              (NO subtotal field — compute as: total - taxAmount)
              (status: PENDING | PARTIAL | PAID | OVERDUE | CANCELLED | VOIDED)

Payment:      id, paymentType (SUPPLIER | CLIENT), clientId, supplierId, amount, method, date
              paymentReferenceType, referenceId

PurchaseOrder: id, poNumber, supplierId, totalAmount (NOT totalCost), status
               (NO receivedDate field — use GoodsReceipt or createdAt as proxy)

Expense:      id, category (ExpenseCategory), amount, description, date, paymentMethod
              (NO paidTo field)

StockAdjustment: id, productId, warehouseId, adjustmentType, quantity, reason, status
```

### Key Corrections from Original Concept

1. **`invoice.subtotal` does NOT exist** — Compute subtotal as `invoice.total - invoice.taxAmount`.
2. **`invoice.tax` → `invoice.taxAmount`**
3. **`po.receivedDate` does NOT exist** — PurchaseOrder has no received date. Use goods receipt date or `createdAt`.
4. **`po.totalCost` → `po.totalAmount`**
5. **`createdBy: 'SYSTEM'`** — JournalEntry.createdBy is a User FK. Need a real system user record (seed a "SYSTEM" user during Phase 2 setup, or use the admin user's ID).

### Idempotency Check (Correct)
```typescript
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

1. PO Receipts (establish inventory value)
2. Invoices (establish revenue and A/R)
3. Client Payments (reduce A/R)
4. Supplier Payments (reduce A/P)
5. Expenses (operational costs)
6. Stock Adjustments (inventory changes)

### POST-MVP DEFERRED

- **Incremental migration**: Script runs once during Phase 2 deployment. No incremental mode needed.
