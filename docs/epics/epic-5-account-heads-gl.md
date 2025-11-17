# Epic 5: Account Heads & General Ledger

**Epic Goal:** Implement comprehensive double-entry accounting system with Chart of Accounts, journal entries, trial balance, balance sheet, bank reconciliation, and multiple bank account tracking. This epic transforms the system from operational ERP to full-featured accounting solution compliant with standard accounting practices.

**Timeline:** Phase 2 (Post-MVP, estimated 4-6 weeks)

**Status:** PHASE 2 - Not included in 6-week MVP

**Dependencies:** Epic 1, 2, 3 (all MVP functionality must be operational)

---

## Overview

The MVP provides **simplified accounting** (client/supplier balances, expense tracking, basic P&L). Phase 2 adds **proper double-entry bookkeeping** where every transaction creates journal entries with debits and credits, enabling full GAAP-compliant financial reporting.

### What's Missing in MVP:
- ❌ Chart of Accounts (account types, hierarchies, codes)
- ❌ Double-entry bookkeeping (every transaction = Debit + Credit)
- ❌ Journal entries (manual accounting adjustments)
- ❌ Trial balance (verification that Debits = Credits)
- ❌ Balance sheet (Assets = Liabilities + Equity)
- ❌ General Ledger report (all account transactions)
- ❌ Multiple bank account tracking
- ❌ Bank reconciliation
- ❌ Petty cash management
- ❌ Month-end/year-end closing
- ❌ Opening balances for accounts

### What Phase 2 Adds:
✅ Full Chart of Accounts with 5 account types
✅ Automatic journal entries from all transactions
✅ Manual journal entry creation for adjustments
✅ Trial balance verification
✅ Balance sheet generation
✅ General Ledger reports
✅ Multiple bank accounts with reconciliation
✅ Petty cash tracking
✅ Month-end closing workflows

---

## Stories

### Story 5.0: MVP Data Migration to General Ledger

**As a** developer,
**I want** a one-time migration script that creates historical journal entries for all MVP transactions,
**So that** the General Ledger is accurate from the moment Phase 2 is deployed.

**Acceptance Criteria:**
1.  [ ] A script is created to backfill journal entries for all Invoices, Payments, Expenses, and other transactions from the MVP.
2.  [ ] The script is idempotent, meaning it can be run multiple times without creating duplicate entries.
3.  [ ] After the script runs, a Trial Balance report confirms that total debits equal total credits.
4.  [ ] The script is documented with clear instructions on how to run it.

**Story File:** [docs/stories/story-5-0-mvp-data-migration.md](../stories/story-5-0-mvp-data-migration.md)

---

### Story 5.1: Chart of Accounts Setup

**As an** accountant,
**I want** to define a structured Chart of Accounts with account types and hierarchies,
**So that** all financial transactions can be properly classified and reported.

**Acceptance Criteria:**
1. AccountHead table created: id, code (unique), name, accountType (ASSET/LIABILITY/EQUITY/REVENUE/EXPENSE), parentId (for hierarchy), description, openingBalance, currentBalance, status, createdAt
2. Account types with standard numbering:
   - 1000-1999: Assets (Current Assets, Fixed Assets, etc.)
   - 2000-2999: Liabilities (Current Liabilities, Long-term Liabilities)
   - 3000-3999: Equity (Owner's Equity, Retained Earnings)
   - 4000-4999: Revenue (Sales Revenue, Other Income)
   - 5000-5999: Expenses (COGS, Operating Expenses, etc.)
3. POST /api/account-heads creates new account with code, name, type, parent
4. GET /api/account-heads returns hierarchical account list (tree structure)
5. GET /api/account-heads/:id returns account details with current balance
6. PUT /api/account-heads/:id updates account (name, description only; code cannot change)
7. DELETE /api/account-heads/:id soft-deletes (only if no transactions)
8. Hierarchical structure: parent accounts can have child accounts (e.g., 1100 Bank Accounts → 1101 Bank A, 1102 Bank B)
9. Opening balances entered for initial setup (one-time data migration)
10. Frontend Chart of Accounts page displays tree hierarchy
11. Frontend allows adding/editing accounts with type validation
12. Frontend displays account balances (current, opening, difference)
13. Only Admin and Accountant can manage Chart of Accounts
14. **Account creation/updates logged in audit trail**

**Suggested Standard Accounts:**
```
1000 - ASSETS
  1100 - Bank Accounts
    1101 - Main Bank Account
    1102 - Petty Cash
  1200 - Accounts Receivable
  1300 - Inventory
  1400 - Fixed Assets

2000 - LIABILITIES
  2100 - Accounts Payable
  2200 - Tax Payable
  2300 - Loans Payable

3000 - EQUITY
  3100 - Owner's Capital
  3200 - Retained Earnings

4000 - REVENUE
  4100 - Sales Revenue
  4200 - Other Income

5000 - EXPENSES
  5100 - Cost of Goods Sold
  5200 - Rent Expense
  5300 - Utilities Expense
  5400 - Salaries Expense
  5500 - Transport Expense
  5900 - Other Expenses
```

**Story File:** [docs/stories/story-5-1-chart-of-accounts.md](../stories/story-5-1-chart-of-accounts.md)

---

### Story 5.2: Journal Entry Creation (Manual)

**As an** accountant,
**I want** to create manual journal entries for accounting adjustments,
**So that** corrections, accruals, and special transactions can be recorded.

**Acceptance Criteria:**
1. JournalEntry table: id, entryNumber (unique), date, description, status (DRAFT/POSTED), createdBy, approvedBy, createdAt
2. JournalEntryLine table: id, journalEntryId, accountHeadId, debitAmount, creditAmount, description
3. POST /api/journal-entries creates journal entry with multiple lines
4. Journal entry validation: **Sum(debits) MUST equal Sum(credits)** (double-entry rule)
5. Entry status workflow: DRAFT (editable) → POSTED (posted to GL, immutable)
6. When entry POSTED, account balances updated (debit increases asset/expense, credit increases liability/revenue/equity)
7. Entry number auto-generated: JE-YYYYMMDD-XXX
8. GET /api/journal-entries returns entry list with filters (date range, status)
9. GET /api/journal-entries/:id returns entry details with lines
10. PUT /api/journal-entries/:id updates entry (only if status = DRAFT)
11. POST /api/journal-entries/:id/post posts entry to GL (locks it)
12. DELETE /api/journal-entries/:id deletes draft entry
13. Frontend Journal Entry page with date, description, line item rows
14. Frontend allows adding debit/credit lines with account selection
15. Frontend displays running debit/credit totals and difference (must be 0 to save)
16. Frontend "Post to GL" button (requires confirmation)
17. Only Accountant and Admin can create journal entries
18. **Journal entries logged in audit trail**

**Story File:** [docs/stories/story-5-2-journal-entry-manual.md](../stories/story-5-2-journal-entry-manual.md)

---

### Story 5.3: Automatic Journal Entries from Transactions

**As an** accountant,
**I want** all business transactions to automatically create journal entries,
**So that** the General Ledger is always up-to-date without manual data entry.

**Acceptance Criteria:**
1. **Sale Invoice** auto-creates journal entry:
   - Debit: Accounts Receivable (1200) = invoice total
   - Credit: Sales Revenue (4100) = invoice subtotal
   - Credit: Tax Payable (2200) = tax amount
   - **On cash sale:** Debit Bank instead of A/R
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
   - Debit: Expense Account (5200-5900, based on category) = expense amount
   - Credit: Bank Account or Petty Cash = expense amount
6. **Stock Adjustment (wastage/damage)** auto-creates journal entry:
   - Debit: Expense - Inventory Loss (5150) = qty × cost price
   - Credit: Inventory (1300) = qty × cost price
7. Journal entries created automatically when transaction saved (async, non-blocking)
8. Journal entries linked to source transaction: referenceType (INVOICE/PAYMENT/PO/EXPENSE), referenceId
9. Auto-created entries have status = POSTED (cannot be edited)
10. Configuration mapping: expense categories → expense account codes (Admin can configure)
11. GET /api/account-heads/:id/transactions returns all journal entry lines affecting an account
12. **Automatic journal entries logged in audit trail**

**Story File:** [docs/stories/story-5-3-auto-journal-entries.md](../stories/story-5-3-auto-journal-entries.md)

---

### Story 5.4: Trial Balance Report

**As an** accountant,
**I want** to generate a trial balance showing all account balances,
**So that** I can verify debits equal credits and books are balanced.

**Acceptance Criteria:**
1. GET /api/reports/trial-balance generates trial balance report
2. Parameters: asOfDate (date to calculate balances up to)
3. Report shows: Account Code, Account Name, Debit Balance, Credit Balance
4. Account balance calculation: Opening Balance + Sum(Debit Entries) - Sum(Credit Entries)
5. Asset and Expense accounts: positive balance shown in Debit column
6. Liability, Equity, and Revenue accounts: positive balance shown in Credit column
7. **Summary row: Total Debits = Total Credits** (if balanced)
8. If totals don't match, display error: "Books not balanced! Difference: X"
9. Report sortable by account code or name
10. Report exportable to Excel
11. Frontend Trial Balance page with date selector
12. Frontend displays two-column table (Debits | Credits)
13. Frontend highlights total row and shows balance status (balanced/unbalanced)
14. Only Accountant and Admin can access trial balance

**Story File:** [docs/stories/story-5-4-trial-balance.md](../stories/story-5-4-trial-balance.md)

---

### Story 5.5: Balance Sheet Generation

**As an** admin,
**I want** to generate a balance sheet showing assets, liabilities, and equity,
**So that** I can understand the company's financial position.

**Acceptance Criteria:**
1. GET /api/reports/balance-sheet generates balance sheet
2. Parameters: asOfDate (date to calculate balances)
3. Report structure:
   - **ASSETS**
     - Current Assets (Bank, A/R, Inventory)
     - Fixed Assets
     - Total Assets
   - **LIABILITIES**
     - Current Liabilities (A/P, Tax Payable)
     - Long-term Liabilities
     - Total Liabilities
   - **EQUITY**
     - Owner's Capital
     - Retained Earnings (calculated from net profit/loss)
     - Total Equity
   - **Equation Verification: Total Assets = Total Liabilities + Total Equity**
4. Retained Earnings auto-calculated: Previous Retained Earnings + Net Profit (Revenue - Expenses)
5. Report shows account balances grouped by type/subtype
6. Report displays comparison with previous period (optional)
7. Report exportable to Excel
8. Frontend Balance Sheet page with date selector
9. Frontend displays formatted balance sheet with clear sections
10. Frontend highlights equation verification (balanced/unbalanced)
11. Only Admin and Accountant can access balance sheet

**Story File:** [docs/stories/story-5-5-balance-sheet.md](../stories/story-5-5-balance-sheet.md)

---

### Story 5.6: General Ledger Report

**As an** accountant,
**I want** to view all transactions affecting a specific account,
**So that** I can audit account activity and trace transactions.

**Acceptance Criteria:**
1. GET /api/reports/general-ledger generates GL report
2. Parameters: accountHeadId (required), date range (optional)
3. Report shows: Date, Journal Entry #, Description, Reference (invoice/PO #), Debit, Credit, Running Balance
4. Running balance calculated: Opening Balance + Debits - Credits (cumulative)
5. Report includes opening balance row at start
6. Report includes closing balance row at end
7. Report sortable by date (default chronological)
8. Report exportable to Excel
9. Frontend General Ledger page with account selector and date range
10. Frontend displays transaction list with running balance column
11. Frontend allows clicking journal entry # to view full entry
12. Frontend allows clicking reference # to view source transaction (invoice, PO, etc.)
13. Accountant and Admin can access GL reports

**Story File:** [docs/stories/story-5-6-general-ledger.md](../stories/story-5-6-general-ledger.md)

---

### Story 5.7: Multiple Bank Account Tracking

**As an** accountant,
**I want** to track multiple bank accounts separately,
**So that** cash flow is managed accurately across different accounts.

**Acceptance Criteria:**
1. Chart of Accounts includes multiple bank account heads (1101, 1102, etc.)
2. Payment table expanded: bankAccountId (references AccountHead where accountType = ASSET and code starts with 11XX)
3. When recording payment, user selects which bank account to credit/debit
4. GET /api/account-heads/:id/balance returns current balance for bank account
5. Bank account balance updated automatically via journal entries
6. GET /api/bank-accounts returns list of all bank accounts with current balances
7. Frontend Bank Accounts page lists all bank accounts with balances
8. Frontend allows adding new bank account (creates account head with code 11XX)
9. Frontend payment recording form includes bank account dropdown
10. Frontend displays bank-wise cash flow on Admin dashboard

**Story File:** [docs/stories/story-5-7-multiple-bank-accounts.md](../stories/story-5-7-multiple-bank-accounts.md)

---

### Story 5.8: Bank Reconciliation

**As an** accountant,
**I want** to reconcile bank statements with system records,
**So that** discrepancies can be identified and resolved.

**Acceptance Criteria:**
1. BankReconciliation table: id, bankAccountId, statementDate, statementBalance, systemBalance, reconciledBy, status, createdAt
2. BankReconciliationItem table: id, reconciliationId, journalEntryLineId, statementAmount, systemAmount, matched (boolean), notes
3. POST /api/bank-reconciliation creates reconciliation session
4. GET /api/bank-reconciliation/:id/unmatched returns unmatched transactions
5. POST /api/bank-reconciliation/:id/match marks transaction as matched
6. Reconciliation status: IN_PROGRESS → COMPLETED (when statement balance = system balance + unmatched items)
7. Frontend Bank Reconciliation page:
   - Upload bank statement (CSV/Excel) or manual entry
   - Display system transactions for period
   - Match statement entries to system entries
   - Mark matched/unmatched
   - Display reconciliation summary (matched, unmatched, difference)
8. Frontend displays unmatched items for investigation
9. Only Accountant and Admin can perform bank reconciliation
10. **Reconciliation completion logged in audit trail**

**Story File:** [docs/stories/story-5-8-bank-reconciliation.md](../stories/story-5-8-bank-reconciliation.md)

---

### Story 5.9: Petty Cash Management

**As an** accountant,
**I want** to track petty cash separately with advances and settlements,
**So that** small cash expenses are properly recorded.

**Acceptance Criteria:**
1. Petty Cash account created in Chart of Accounts (code 1102)
2. POST /api/petty-cash/advance creates petty cash advance (moves money from bank to petty cash)
   - Debit: Petty Cash (1102)
   - Credit: Bank Account (1101)
3. Expense paid from petty cash:
   - Debit: Expense Account (5XXX)
   - Credit: Petty Cash (1102)
4. POST /api/petty-cash/settlement settles petty cash (records expenses and replenishes)
5. GET /api/account-heads/1102/balance returns current petty cash balance
6. Frontend Petty Cash page:
   - Show current balance
   - Record advance from bank
   - Record expense from petty cash
   - Settle petty cash (submit receipts, get reimbursement)
7. Frontend displays petty cash transaction history
8. Only Accountant can manage petty cash

**Story File:** [docs/stories/story-5-9-petty-cash.md](../stories/story-5-9-petty-cash.md)

---

### Story 5.10: Month-End Closing

**As an** accountant,
**I want** to perform month-end closing procedures,
**So that** financial periods are properly closed and books are prepared for next period.

**Acceptance Criteria:**
1. PeriodClose table: id, periodType (MONTH/YEAR), periodDate, closedBy, closedAt, status
2. POST /api/period-close/month closes current month
3. Month-end closing process:
   - Verify trial balance is balanced
   - Generate profit & loss for month
   - Calculate net profit/loss
   - Create closing journal entry (move net profit to Retained Earnings)
   - Lock all journal entries for the period (cannot be edited/deleted)
   - Mark period as CLOSED
4. Cannot create/edit transactions for closed periods (validation)
5. Admin can reopen period if needed (requires confirmation + reason)
6. GET /api/period-close returns list of closed periods
7. Frontend Month-End Closing page:
   - Display trial balance status
   - Display P&L summary for month
   - "Close Month" button (requires confirmation)
   - List of closed periods
8. Frontend displays warning if trying to create transaction in closed period
9. Only Admin can perform month-end closing
10. **Month-end closing logged in audit trail**

**Story File:** [docs/stories/story-5-10-month-end-closing.md](../stories/story-5-10-month-end-closing.md)

---

## Epic 5 Dependencies

- **Epic 1, 2, 3** - All MVP functionality operational
- Existing transactions (invoices, payments, expenses) continue working
- Phase 2 adds GL layer on top of MVP operations

## Epic 5 Deliverables

✅ Chart of Accounts with 5 account types
✅ Manual journal entry creation
✅ Automatic journal entries from all transactions
✅ Trial balance verification
✅ Balance sheet generation
✅ General Ledger reports
✅ Multiple bank account tracking
✅ Bank reconciliation functionality
✅ Petty cash management
✅ Month-end closing procedures
✅ **All accounting operations logged in audit trail**

## Success Criteria

- Chart of Accounts configured with standard accounts
- All MVP transactions generate correct journal entries
- Trial balance always balances (Debits = Credits)
- Balance sheet equation holds (Assets = Liabilities + Equity)
- Bank reconciliation identifies discrepancies
- Month-end closing locks periods correctly
- FBR/GAAP compliance ready

## Migration Notes

When implementing Phase 2:
1. Create Chart of Accounts with opening balances
2. Backfill journal entries for existing MVP transactions (one-time script)
3. Verify trial balance after backfill
4. Going forward, all transactions auto-create journal entries

## Links

- **Stories:** [docs/stories/](../stories/) (story-5-1 through story-5-10)
- **Architecture:** [docs/architecture/database-schema.md](../architecture/database-schema.md)
- **Phase 2 Roadmap:** [docs/planning/phase-2-roadmap.md](../planning/phase-2-roadmap.md)
