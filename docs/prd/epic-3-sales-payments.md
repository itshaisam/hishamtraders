# Epic 3: Sales & Client Management + Payments

**Epic Goal:** Create the complete sales workflow including client management with credit limits and payment terms, sales invoice generation with automatic inventory deduction, credit limit enforcement, client/supplier payment recording, and expense tracking. This epic enables revenue-generating transactions with proper credit control and comprehensive payment management.

**Timeline:** MVP Week 3-4 (Days 15-28)

**Status:** MVP - Required for 6-week delivery

**Dependencies:** Epic 1 (Foundation), Epic 2 (Inventory)

---

## Stories

### Story 3.1: Client Management with Credit Terms

**As a** sales officer,
**I want** to maintain client records with credit limits and payment terms,
**So that** credit sales are controlled and payment expectations are clear.

**Acceptance Criteria:**
1. Client table: id, name, contactPerson, phone, email, city, area, creditLimit, paymentTermsDays, balance, status (active/inactive), createdAt
2. POST /api/clients creates new client
3. GET /api/clients returns paginated client list with search and filters (city, status, balance > 0)
4. GET /api/clients/:id returns client details with invoice/payment history
5. PUT /api/clients/:id updates client details
6. DELETE /api/clients/:id soft-deletes (only if balance = 0)
7. Credit limit validated as positive number or 0 (0 = no credit allowed, cash only)
8. Payment terms in days (e.g., 7 for weekly, 30 for monthly)
9. Current balance calculated from invoices and payments
10. Frontend Client List page with add/edit modals
11. Frontend displays client status and credit limit utilization (%)
12. Frontend shows color-coded credit status (green=good, yellow=near-limit, red=over-limit)
13. Sales Officer, Accountant, Admin can manage clients
14. **Client CRUD operations logged in audit trail**

**Story File:** [docs/stories/story-3-1-client-management.md](../stories/story-3-1-client-management.md)

---

### Story 3.2: Sales Invoice Creation with Inventory Deduction

**As a** sales officer,
**I want** to create sales invoices that automatically deduct inventory,
**So that** stock levels are accurate and client balances are updated.

**Acceptance Criteria:**
1. Invoice table: id, invoiceNumber (unique), clientId, invoiceDate, dueDate, paymentType (CASH/CREDIT), subtotal, taxAmount, total, paidAmount, status (PENDING/PARTIAL/PAID/OVERDUE), notes, createdAt
2. InvoiceItem table: id, invoiceId, productId, batchNo, quantity, unitPrice, discount, total
3. POST /api/invoices creates invoice with line items
4. Invoice number auto-generated: INV-YYYYMMDD-XXX (INV-20250115-001)
5. Due date calculated: invoiceDate + client.paymentTermsDays
6. Line items validated: product exists, quantity > 0, **quantity <= available stock**
7. **Stock availability check before saving invoice** (prevent overselling)
8. For credit sales, check: client.balance + invoice.total <= client.creditLimit (warning if exceeded)
9. Tax calculated per line item if applicable (configurable tax rate)
10. Subtotal and total calculated automatically
11. **When invoice saved, inventory decremented** (InventoryItem quantity reduced)
12. **If multiple batches exist, deduct from oldest batch first (FIFO)**
13. Client balance increased by totalAmount (if paymentType = CREDIT)
14. StockMovement record created (type=SALE, referenceType=INVOICE, referenceId=invoiceId)
15. GET /api/invoices returns invoice list with filters (date range, clientId, status)
16. GET /api/invoices/:id returns invoice details with items and client info
17. Frontend Create Invoice page with client selection, line item rows, automatic calculations
18. Frontend warns if client approaching/exceeding credit limit
19. Frontend displays available stock when adding product to invoice
20. Frontend displays error if insufficient stock
21. Sales Officer, Accountant, Admin can create invoices
22. **Invoice creation logged in audit trail with line items**

**Story File:** [docs/stories/story-3-2-sales-invoice-creation.md](../stories/story-3-2-sales-invoice-creation.md)

---

### Story 3.3: Credit Limit Enforcement and Warnings

**As a** sales officer,
**I want** the system to warn me when a client is approaching or exceeding their credit limit,
**So that** bad debt risk is minimized.

**Acceptance Criteria:**
1. When creating credit invoice, system calculates: client.balance + new invoice total
2. If result > 80% of creditLimit, display warning: "Client approaching credit limit (X% utilized)"
3. If result > 100% of creditLimit, display error: "Credit limit exceeded. Current balance: X, Limit: Y"
4. Admin can override credit limit (requires confirmation with reason)
5. Non-admin users cannot override (invoice creation blocked)
6. Credit limit utilization displayed on client detail page with progress bar
7. Dashboard shows list of clients > 80% credit limit utilization
8. Frontend displays credit limit warnings prominently during invoice creation
9. Override requires Admin confirmation modal with reason input
10. **Credit limit overrides logged in audit trail with reason**

**Story File:** [docs/stories/story-3-3-credit-limit-enforcement.md](../stories/story-3-3-credit-limit-enforcement.md)

---

### Story 3.4: Invoice Voiding and Stock Reversal

**As a** sales officer,
**I want** to void incorrect invoices and reverse stock deduction,
**So that** mistakes can be corrected without manual inventory adjustments.

**Acceptance Criteria:**
1. DELETE /api/invoices/:id voids invoice (only if status != PAID or paidAmount = 0)
2. Voiding invoice:
   - Sets invoice status to CANCELLED
   - Restores inventory quantities (adds back to stock)
   - Reduces client balance by invoice total
   - Creates StockMovement records (type=RETURN, negative quantities)
3. Paid invoices cannot be voided (use credit notes instead - Phase 2)
4. Frontend invoice detail page shows "Void Invoice" button (if eligible)
5. Void action requires confirmation modal
6. Frontend displays voided invoices with strikethrough and "CANCELLED" badge
7. Only Admin can void invoices
8. **Invoice voiding logged in audit trail with reason**

**Story File:** [docs/stories/story-3-4-invoice-voiding.md](../stories/story-3-4-invoice-voiding.md)

---

### Story 3.5: Tax Calculation on Sales

**As an** accountant,
**I want** sales tax calculated automatically on invoices,
**So that** tax obligations are tracked accurately.

**Acceptance Criteria:**
1. System configuration: defaultSalesTaxRate (e.g., 17% for Pakistan GST) stored in environment or config table
2. Client table expanded: isTaxExempt (boolean, default false)
3. Invoice line item tax calculated: unitPrice × quantity × (1 - discount%) × taxRate
4. If client.isTaxExempt = true, taxRate = 0
5. Subtotal = sum of (unitPrice × quantity × (1 - discount%))
6. Tax amount = sum of line item taxes
7. Total = subtotal + taxAmount
8. Invoice displays: Subtotal, Tax, Total
9. GET /api/reports/tax-summary generates tax report by period (MVP: basic totals)
10. Tax report shows: total sales, tax collected, net sales (without tax)
11. Frontend invoice displays tax breakdown clearly
12. Tax configuration managed in Settings page (Admin only)
13. **Tax calculation changes logged if tax rate is manually overridden**

**Story File:** [docs/stories/story-3-5-tax-calculation.md](../stories/story-3-5-tax-calculation.md)

---

### Story 3.6: Client Payment Recording

**As a** recovery agent,
**I want** to record payments received from clients,
**So that** client balances are reduced and cash inflow is tracked.

**Acceptance Criteria:**
1. POST /api/payments/client creates client payment
2. Payment payload: clientId, amount, method (CASH/BANK_TRANSFER/CHEQUE), referenceNumber, date, notes
3. Payment reduces client.balance by payment amount
4. Payment can be allocated to specific invoices or treated as account credit
5. Invoice allocation: oldest unpaid invoices first (FIFO)
6. Invoice status updated: PENDING → PARTIAL (if partly paid) → PAID (if fully paid)
7. If payment > outstanding balance, warn but allow (overpayment creates credit balance)
8. Payment method validation: if CHEQUE or BANK_TRANSFER, referenceNumber required
9. GET /api/payments/client returns payment history with filters (clientId, date range, method)
10. GET /api/clients/:id/payments returns payment history for specific client
11. Frontend Record Payment page with client selection, amount, method, reference
12. Frontend displays client current balance before and after payment
13. Frontend allows manual allocation to specific invoices
14. Frontend shows remaining client balance after payment
15. Recovery Agent, Accountant, Admin can record payments
16. **Client payments logged in audit trail**

**Story File:** [docs/stories/story-3-6-client-payments.md](../stories/story-3-6-client-payments.md)

---

### Story 3.7: Expense Tracking

**As an** accountant,
**I want** to record operating expenses categorized by type,
**So that** business costs are tracked and analyzed.

**Acceptance Criteria:**
1. Expense table: id, date, category, amount, method (CASH/BANK_TRANSFER/CHEQUE), referenceNumber, description, paidTo, notes, createdAt
2. Expense categories: RENT, UTILITIES, SALARIES, TRANSPORT, OFFICE_SUPPLIES, MAINTENANCE, MISCELLANEOUS
3. POST /api/expenses creates expense record
4. GET /api/expenses returns expense history with filters (category, date range)
5. PUT /api/expenses/:id updates expense
6. DELETE /api/expenses/:id deletes expense
7. Category field uses dropdown (predefined list)
8. Amount validated as positive number
9. GET /api/expenses/summary returns total by category for date range
10. Frontend Expense Management page lists expenses with add/edit modals
11. Frontend allows filtering by category and date range
12. Frontend displays expense total for selected filters
13. Frontend monthly summary widget shows expenses by category
14. Accountant and Admin can record expenses
15. **Expense CRUD operations logged in audit trail**

**Story File:** [docs/stories/story-3-7-expense-tracking.md](../stories/story-3-7-expense-tracking.md)

---

### Story 3.8: Payment History and Reports

**As an** accountant,
**I want** to view comprehensive payment history for clients and suppliers,
**So that** cash flow is visible and payment tracking is complete.

**Acceptance Criteria:**
1. GET /api/payments returns all payments with filters (type, date range, method, clientId, supplierId)
2. Payment list displays: date, type (CLIENT/SUPPLIER), client/supplier name, amount, method, reference, recorded by
3. GET /api/reports/payments generates payment collection report
4. Report shows: total client payments, total supplier payments, net cash flow for period
5. Report filterable by date range, payment method
6. Report exportable to Excel
7. Frontend Payment History page with comprehensive filters
8. Frontend displays payments in chronological order with color-coding (inflow=green, outflow=red)
9. Frontend allows drilling down to linked invoices/POs
10. All roles can view payment history (read-only for Sales/Recovery)

**Story File:** [docs/stories/story-3-8-payment-history.md](../stories/story-3-8-payment-history.md)

---

## Epic 3 Dependencies

- **Epic 1** - Foundation, authentication, audit infrastructure
- **Epic 2** - Inventory (stock must exist before sales can deduct)

## Epic 3 Deliverables

✅ Client database with credit limits and payment terms
✅ Sales invoice creation with automatic inventory deduction
✅ Credit limit enforcement with warnings
✅ Invoice voiding with stock reversal
✅ Tax calculation on sales
✅ Client payment recording with balance updates
✅ Supplier payment recording (from Epic 2.10)
✅ Expense tracking by category
✅ Payment history and basic reports
✅ **All operations automatically logged in audit trail**

## Success Criteria

- Sales team can create invoices with stock deduction
- Credit limits enforced with warnings
- Client balances update automatically
- Payments recorded and allocated to invoices
- Expenses tracked by category
- Payment history visible

## Links

- **Stories:** [docs/stories/](../stories/) (story-3-1 through story-3-8)
- **Architecture:** [docs/architecture/database-schema.md](../architecture/database-schema.md)
- **MVP Roadmap:** [docs/planning/mvp-roadmap.md](../planning/mvp-roadmap.md)
