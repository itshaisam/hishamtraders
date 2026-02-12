# Story 5.3: Automatic Journal Entries from Transactions

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.3
**Priority:** Critical
**Estimated Effort:** 12-16 hours
**Dependencies:** Story 5.2 (Journal Entries), Epic 2, Epic 3
**Status:** Done

---

## User Story

**As an** accountant,
**I want** all business transactions to automatically create journal entries,
**So that** the General Ledger is always up-to-date without manual data entry.

---

## Acceptance Criteria

1. **Sale Invoice** auto-creates journal entry:
   - Debit: Accounts Receivable (1200) = invoice total
   - Credit: Sales Revenue (4100) = invoice total - taxAmount
   - Credit: Tax Payable (2200) = taxAmount (if > 0)

2. **Client Payment** auto-creates journal entry:
   - Debit: Bank Account (1101) = payment amount
   - Credit: Accounts Receivable (1200) = payment amount

3. **Purchase Order Receipt** auto-creates journal entry:
   - Debit: Inventory (1300) = PO totalAmount + additional costs
   - Credit: Accounts Payable (2100) = same total

4. **Supplier Payment** auto-creates journal entry:
   - Debit: Accounts Payable (2100) = payment amount
   - Credit: Bank Account (1101) = payment amount

5. **Expense** auto-creates journal entry:
   - Debit: Expense Account (5XXX, mapped from category) = amount
   - Credit: Bank Account (1101) or Petty Cash (1102) = amount

6. **Stock Adjustment (wastage/damage)** auto-creates journal entry:
   - Debit: Inventory Loss (5150) = qty x product.costPrice
   - Credit: Inventory (1300) = same amount

7. **Implementation:**
   - [ ] Journal entries created within the same `$transaction` as the source transaction
   - [ ] Entries linked to source: `referenceType`, `referenceId`
   - [ ] Auto-created entries have `status = POSTED` (immutable)
   - [ ] Category-to-account mapping via hardcoded config (see Dev Notes)

8. **Authorization:**
   - [ ] System-generated — no user authorization required
   - [ ] Auto entries use the triggering user's ID as `createdBy`

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on Story 5.2 (JournalEntry model).

### Schema Field Reference (Existing MVP Models — Correct Names)

```
Invoice:       total, taxAmount, taxRate, invoiceDate, invoiceNumber
               (NO subtotal field — compute as: total - taxAmount)
               (NO tax field — use taxAmount)
               client → Client relation

PurchaseOrder: totalAmount (NOT totalCost), poNumber, supplierId
               costs → POCost[] relation (SHIPPING | CUSTOMS | TAX | OTHER)
               (NO receivedDate — use goods receipt date or new Date())
               (NO payments relation)

Expense:       category (ExpenseCategory), amount, description, date, paymentMethod
               (NO paidTo field)

StockAdjustment: productId, warehouseId, adjustmentType, quantity, reason
                 product → Product relation (use product.costPrice for value)
```

### Key Corrections from Original Doc

1. **`invoice.subtotal` does NOT exist** — Compute as `invoice.total - invoice.taxAmount`:
   ```typescript
   const subtotal = parseFloat(invoice.total.toString()) - parseFloat(invoice.taxAmount.toString());
   ```

2. **`invoice.tax` → `invoice.taxAmount`**

3. **`po.totalCost` → `po.totalAmount`**

4. **`po.receivedDate` does NOT exist** — Use `new Date()` or the goods receipt timestamp.

5. **`createdBy: 'SYSTEM'`** is invalid — `JournalEntry.createdBy` is a User FK. Use the triggering user's ID (the user who created the invoice/payment/etc.).

6. **No retry with exponential backoff** — If the journal entry fails, the entire transaction should roll back (it's inside `$transaction`). No separate retry needed.

### Expense Category → Account Code Mapping

```typescript
const EXPENSE_ACCOUNT_MAP: Record<ExpenseCategory, string> = {
  RENT: '5200',
  UTILITIES: '5300',
  SALARIES: '5400',
  TRANSPORT: '5500',
  SUPPLIES: '5900',
  MAINTENANCE: '5900',
  MARKETING: '5900',
  MISC: '5900',
};
```

### Payment Method → Credit Account Mapping

```typescript
function getCreditAccountForExpense(method: PaymentMethod): string {
  return method === 'CASH' ? '1102' : '1101';  // Petty Cash vs Bank
}
```

### Integration Pattern

All auto-entries are created **inside the same `$transaction`** as the source:

```typescript
// In invoices.service.ts createInvoice()
return await prisma.$transaction(async (tx) => {
  const invoice = await tx.invoice.create({ ... });
  // ... stock deduction, client balance update ...

  // Auto journal entry
  await autoJournalService.createFromInvoice(tx, invoice, userId);

  return invoice;
});
```

Note: Pass `tx` (transaction client) to the auto-journal service, NOT the global prisma client.

### Module Structure

```
apps/api/src/modules/journal-entries/
  auto-journal.service.ts       (NEW — createFromInvoice, createFromPayment, etc.)
```

### POST-MVP DEFERRED

- **AccountMapping configuration table**: For MVP, use hardcoded mapping. Configurable mapping table deferred.
- **Retry with exponential backoff / admin notifications**: Not needed — journal entry is created inside `$transaction`. If it fails, the whole transaction rolls back.
- **Cash sale variant (Debit Bank instead of A/R)**: All invoices go through A/R for now. Cash sale accounting deferred.
