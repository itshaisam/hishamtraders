# Story 5.3: Automatic Journal Entries from Transactions

**Epic:** Epic 5 - Account Heads & General Ledger
**Story ID:** STORY-5.3
**Priority:** Critical
**Estimated Effort:** 12-16 hours
**Dependencies:** Story 5.2 (Journal Entries), Epic 2, Epic 3
**Status:** Draft - Phase 2

---

## User Story

**As an** accountant,
**I want** all business transactions to automatically create journal entries,
**So that** the General Ledger is always up-to-date without manual data entry.

---

## Acceptance Criteria

1. **Sale Invoice** auto-creates journal entry:
   - Debit: Accounts Receivable (1200) = invoice total
   - Credit: Sales Revenue (4100) = invoice subtotal
   - Credit: Tax Payable (2200) = tax amount
   - On cash sale: Debit Bank instead of A/R

2. **Client Payment** auto-creates journal entry:
   - Debit: Bank Account (1101) = payment amount
   - Credit: Accounts Receivable (1200) = payment amount

3. **Purchase Order Receipt** auto-creates journal entry:
   - Debit: Inventory (1300) = landed cost
   - Credit: Accounts Payable (2100) = total PO amount

4. **Supplier Payment** auto-creates journal entry:
   - Debit: Accounts Payable (2100) = payment amount
   - Credit: Bank Account (1101) = payment amount

5. **Expense** auto-creates journal entry:
   - Debit: Expense Account (5XXX, based on category) = expense amount
   - Credit: Bank Account or Petty Cash = expense amount

6. **Stock Adjustment (wastage/damage)** auto-creates journal entry:
   - Debit: Inventory Loss (5150) = qty × cost
   - Credit: Inventory (1300) = qty × cost

7. **Implementation:**
   - [ ] Journal entries created automatically when transaction saved
   - [ ] Entries linked to source: referenceType, referenceId
   - [ ] Auto-created entries have status = POSTED (immutable)
   - [ ] Configuration mapping: expense categories → account codes

8. **Authorization & Role-Based Access:**
   - [ ] System-generated (automatic, no user authorization required)
   - [ ] Posted entries are immutable and locked
   - [ ] Audit trail: Records system as creator

9. **Performance & Caching:**
   - [ ] Account code lookups cached (account codes rarely change)
   - [ ] Transaction to journal entry mapping: < 500ms per transaction
   - [ ] Bulk operations (batch receipts): Process in transaction
   - [ ] API timeout: 15 seconds maximum

10. **Error Handling:**
    - [ ] If account mapping missing: Log error, create entry with fallback account
    - [ ] If account doesn't exist: Raise error and fail transaction creation
    - [ ] Balance calculation errors: Catch and log with transaction details
    - [ ] Retry logic for failed auto-entries (3 attempts with exponential backoff)
    - [ ] Notify admin if auto-entry creation fails for critical transaction

---

## Dev Notes

### Automatic Journal Entry Service

```typescript
class AutoJournalEntryService {
  async createFromInvoice(invoice: Invoice): Promise<JournalEntry> {
    const lines: any[] = [
      // Debit: Accounts Receivable
      {
        accountHeadId: await this.getAccountByCode('1200'), // A/R
        debitAmount: parseFloat(invoice.total.toString()),
        creditAmount: 0,
        description: `Sales to ${invoice.client.name}`
      },
      // Credit: Sales Revenue
      {
        accountHeadId: await this.getAccountByCode('4100'), // Sales Revenue
        debitAmount: 0,
        creditAmount: parseFloat(invoice.subtotal.toString()),
        description: 'Sales revenue'
      }
    ];

    // Credit: Tax Payable (if tax > 0)
    if (parseFloat(invoice.tax.toString()) > 0) {
      lines.push({
        accountHeadId: await this.getAccountByCode('2200'), // Tax Payable
        debitAmount: 0,
        creditAmount: parseFloat(invoice.tax.toString()),
        description: 'Sales tax'
      });
    }

    return await this.createJournalEntry({
      date: invoice.invoiceDate,
      description: `Sales Invoice ${invoice.invoiceNumber}`,
      referenceType: 'INVOICE',
      referenceId: invoice.id,
      lines
    });
  }

  async createFromClientPayment(payment: Payment, allocations: PaymentAllocation[]): Promise<JournalEntry> {
    const lines = [
      // Debit: Bank Account
      {
        accountHeadId: await this.getAccountByCode('1101'), // Bank
        debitAmount: parseFloat(payment.amount.toString()),
        creditAmount: 0,
        description: 'Payment received'
      },
      // Credit: Accounts Receivable
      {
        accountHeadId: await this.getAccountByCode('1200'), // A/R
        debitAmount: 0,
        creditAmount: parseFloat(payment.amount.toString()),
        description: 'Payment from client'
      }
    ];

    return await this.createJournalEntry({
      date: payment.date,
      description: `Payment from client`,
      referenceType: 'PAYMENT',
      referenceId: payment.id,
      lines
    });
  }

  async createFromPOReceipt(po: PurchaseOrder): Promise<JournalEntry> {
    const productCost = parseFloat(po.totalCost.toString());
    const additionalCosts = po.costs.reduce(
      (sum, cost) => sum + parseFloat(cost.amount.toString()),
      0
    );
    const totalLandedCost = productCost + additionalCosts;

    const lines = [
      // Debit: Inventory
      {
        accountHeadId: await this.getAccountByCode('1300'),
        debitAmount: totalLandedCost,
        creditAmount: 0,
        description: 'Inventory received'
      },
      // Credit: Accounts Payable
      {
        accountHeadId: await this.getAccountByCode('2100'),
        debitAmount: 0,
        creditAmount: totalLandedCost,
        description: `Purchase from ${po.supplier.name}`
      }
    ];

    return await this.createJournalEntry({
      date: po.receivedDate || new Date(),
      description: `PO ${po.poNumber} received`,
      referenceType: 'PO',
      referenceId: po.id,
      lines
    });
  }

  async createFromExpense(expense: Expense): Promise<JournalEntry> {
    // Map expense category to account code
    const expenseAccountMapping = {
      RENT: '5200',
      UTILITIES: '5300',
      SALARIES: '5400',
      TRANSPORT: '5500',
      SUPPLIES: '5900',
      MAINTENANCE: '5900',
      MARKETING: '5900',
      MISC: '5900'
    };

    const accountCode = expenseAccountMapping[expense.category];

    const lines = [
      // Debit: Expense Account
      {
        accountHeadId: await this.getAccountByCode(accountCode),
        debitAmount: parseFloat(expense.amount.toString()),
        creditAmount: 0,
        description: expense.description
      },
      // Credit: Bank/Petty Cash
      {
        accountHeadId: expense.paymentMethod === 'CASH'
          ? await this.getAccountByCode('1102') // Petty Cash
          : await this.getAccountByCode('1101'), // Bank
        debitAmount: 0,
        creditAmount: parseFloat(expense.amount.toString()),
        description: 'Payment for expense'
      }
    ];

    return await this.createJournalEntry({
      date: expense.date,
      description: `Expense: ${expense.description}`,
      referenceType: 'EXPENSE',
      referenceId: expense.id,
      lines
    });
  }

  async createFromStockAdjustment(adjustment: StockAdjustment): Promise<JournalEntry> {
    // Calculate value: quantity × unit cost
    const value = adjustment.quantity * parseFloat(adjustment.product.costPrice.toString());

    const lines = [
      // Debit: Inventory Loss
      {
        accountHeadId: await this.getAccountByCode('5150'),
        debitAmount: value,
        creditAmount: 0,
        description: `${adjustment.type}: ${adjustment.product.name}`
      },
      // Credit: Inventory
      {
        accountHeadId: await this.getAccountByCode('1300'),
        debitAmount: 0,
        creditAmount: value,
        description: 'Inventory reduction'
      }
    ];

    return await this.createJournalEntry({
      date: adjustment.date,
      description: `Stock adjustment: ${adjustment.type}`,
      referenceType: 'STOCK_ADJUSTMENT',
      referenceId: adjustment.id,
      lines
    });
  }

  private async getAccountByCode(code: string): Promise<string> {
    const account = await prisma.accountHead.findUnique({
      where: { code }
    });
    if (!account) {
      throw new Error(`Account with code ${code} not found`);
    }
    return account.id;
  }

  private async createJournalEntry(data: any): Promise<JournalEntry> {
    const entryNumber = await generateEntryNumber(data.date);

    return await prisma.journalEntry.create({
      data: {
        entryNumber,
        date: data.date,
        description: data.description,
        referenceType: data.referenceType,
        referenceId: data.referenceId,
        status: 'POSTED',
        createdBy: 'SYSTEM',
        approvedBy: 'SYSTEM',
        lines: {
          create: data.lines
        }
      },
      include: { lines: true }
    });
  }
}
```

### Integration Points

**In Invoice Service:**
```typescript
async createInvoice(data: CreateInvoiceDto, userId: string): Promise<Invoice> {
  const invoice = await prisma.$transaction(async (tx) => {
    // Create invoice
    const inv = await tx.invoice.create({ ... });

    // Create automatic journal entry
    await autoJournalEntryService.createFromInvoice(inv);

    return inv;
  });

  return invoice;
}
```

**Configuration Table:**
```prisma
model AccountMapping {
  id            String   @id @default(cuid())
  sourceType    String   // 'EXPENSE_CATEGORY', 'PAYMENT_METHOD', etc.
  sourceValue   String   // 'RENT', 'CASH', etc.
  accountCode   String   // '5200', '1102', etc.

  @@unique([sourceType, sourceValue])
  @@map("account_mappings")
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
