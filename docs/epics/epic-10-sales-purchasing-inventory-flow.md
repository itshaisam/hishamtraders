# Epic 10: Standardized Sales, Purchasing & Inventory Flow

**Epic Goal:** Implement a standardized, enterprise-grade document chain for both sales (Sales Order → Delivery Note → Sales Invoice) and purchasing (PO → GRN → Purchase Invoice) cycles, with full stock movement traceability and automatic double-entry accounting at every stage. The architecture is **simple by default** (current flows preserved) but **enterprise-ready under the hood** (full document chain available via settings).

**Timeline:** Phase 3 (Post Phase 2, estimated 5-6 weeks)

**Status:** PLANNED

**Dependencies:** Epics 1-3 (MVP), Epic 5 (Accounting), Epic 6 (Advanced Inventory), Epic 9 (Multi-Tenant)

---

## Overview

The MVP provides **direct invoice creation** with automatic stock deduction and gate pass generation. This epic adds the **missing document layers** that modern ERPs require: Sales Orders for booking, Delivery Notes for controlled dispatch, and Purchase Invoices for 3-way matching.

### Current State:
- Sales: Invoice → GatePass (auto) → Stock deduction at invoice
- Purchasing: PO → GRN → Stock receipt at GRN
- Missing: No Sales Order, no Delivery Note, no Purchase Invoice, no COGS journal entry

### What Epic 10 Adds:

**Sales Cycle (Order-to-Cash):**
```
Sales Order (optional) → Delivery Note (optional) → Sales Invoice → Payment
     │                         │                          │              │
     │ Stock: RESERVE          │ Stock: DEDUCT (FIFO)     │ Accounting:  │ Accounting:
     │ (optional)              │ Accounting:              │ DR A/R       │ DR Bank
     │                         │ DR COGS, CR Inventory    │ CR Sales     │ CR A/R
     │                         │                          │ CR Tax       │
```

**Purchasing Cycle (Procure-to-Pay):**
```
Purchase Order → GRN → Purchase Invoice (new) → Supplier Payment
     │              │           │                    │
     │              │ Stock:    │ Reconciliation     │ Accounting:
     │              │ RECEIPT   │ (3-way match)      │ DR A/P
     │              │ DR Inv    │                    │ CR Bank
     │              │ CR A/P    │                    │
```

### Simple Mode vs Full Mode

| Feature | Simple Mode (Default) | Full Mode (Settings) |
|---------|----------------------|----------------------|
| Sales Order | Skip — go to Invoice | SO → DN → Invoice |
| Delivery Note | Skip — stock at Invoice | DN triggers stock-out |
| Purchase Invoice | Skip — A/P at GRN | PI for 3-way matching |
| Stock Reservation | No reservation | SO can reserve stock |
| COGS Posting | At Invoice creation | At DN dispatch |

---

## Stories

### Story 10.0: Supplier Payment Bug Fix & Sidebar Restructuring

**As a** user recording supplier payments,
**I want** the payment to be recorded correctly with proper reference numbers,
**So that** supplier payments are accurately tracked and the journal entries are correct.

**Acceptance Criteria:**
1. Fix supplier payment creation to include `referenceNumber` field in Payment record
2. Fix AutoJournalService call to use `dto.referenceNumber` instead of `dto.notes`
3. Move "Record Supplier Payment" and "Supplier Payment History" from Payments to Purchases section in sidebar
4. Supplier payments accessible under Purchases menu for ADMIN and ACCOUNTANT roles

**Story File:** [docs/stories/story-10-0-supplier-payment-fix.md](../stories/story-10-0-supplier-payment-fix.md)

---

### Story 10.1: Schema Foundation & COGS Fix

**As a** developer,
**I want** the database schema extended with Sales Order, Delivery Note, and Purchase Invoice models,
**So that** the foundation is ready for the complete document chain.

**Acceptance Criteria:**
1. 6 new Prisma models: SalesOrder, SalesOrderItem, DeliveryNote, DeliveryNoteItem, PurchaseInvoice, PurchaseInvoiceItem
2. 3 new enums: SalesOrderStatus, DeliveryNoteStatus, PurchaseInvoiceStatus
3. ReferenceType enum extended: +SALES_ORDER, +DELIVERY_NOTE, +PURCHASE_INVOICE, +DEBIT_NOTE
4. MovementType enum extended: +DELIVERY
5. Invoice model: +salesOrderId (optional), +deliveryNoteId (optional)
6. COGS account (5100) seeded for all tenants
7. **COGS journal entry added to invoice creation**: DR 5100 COGS, CR 1300 Inventory
8. Migration runs without errors on existing data

**Story File:** [docs/stories/story-10-1-schema-cogs-foundation.md](../stories/story-10-1-schema-cogs-foundation.md)

---

### Story 10.2: System Settings & Feature Toggles

**As an** admin,
**I want** to configure whether Sales Orders, Delivery Notes, and Purchase Invoices are required,
**So that** I can enable the full document chain when my business is ready for it.

**Acceptance Criteria:**
1. SystemSetting entries: `sales.requireSalesOrder`, `sales.requireDeliveryNote`, `sales.allowDirectInvoice`, `purchasing.requirePurchaseInvoice`, `sales.enableStockReservation`
2. All default to simple mode (current behavior preserved)
3. Settings accessible via existing System Settings UI
4. Settings cached and refreshable without restart

**Story File:** [docs/stories/story-10-2-system-settings-toggles.md](../stories/story-10-2-system-settings-toggles.md)

---

### Story 10.3: Sales Order — Backend

**As a** sales officer,
**I want** to create sales orders to book customer orders before delivery,
**So that** I can plan deliveries and track order fulfillment.

**Acceptance Criteria:**
1. CRUD endpoints: POST/GET/GET:id for Sales Orders
2. Status transitions: DRAFT → CONFIRMED → PARTIALLY_DELIVERED → DELIVERED → INVOICED → CLOSED
3. Cancel endpoint: DRAFT/CONFIRMED → CANCELLED
4. Auto-generated order number: SO-YYYYMMDD-NNN
5. Stock availability validation on creation
6. Credit limit validation for CREDIT payment type
7. `deliveredQuantity` and `invoicedQuantity` tracking per item
8. Auto-status updates when DN/Invoice created from SO
9. Tax rate snapshot at creation (same pattern as Invoice)
10. Roles: ADMIN, SALES_OFFICER can create; ADMIN can cancel

**Story File:** [docs/stories/story-10-3-sales-order-backend.md](../stories/story-10-3-sales-order-backend.md)

---

### Story 10.4: Sales Order — Frontend

**As a** sales officer,
**I want** a Sales Orders page to create, view, and manage orders,
**So that** I can track the sales pipeline from order to delivery.

**Acceptance Criteria:**
1. Sales Orders list page with status filters, search, pagination
2. Create Sales Order page: client selection, warehouse, items with product/variant/qty/price/discount
3. Sales Order detail page showing items, status timeline, linked DNs/Invoices
4. "Confirm" button (DRAFT → CONFIRMED)
5. "Create Delivery Note" action button (redirects to DN creation pre-filled from SO)
6. "Create Invoice" action button (for simple mode — direct SO → Invoice)
7. Cancel with reason modal
8. Sidebar: "Sales Orders" added under Sales menu
9. Status badges with color coding

**Story File:** [docs/stories/story-10-4-sales-order-frontend.md](../stories/story-10-4-sales-order-frontend.md)

---

### Story 10.5: Delivery Note — Backend

**As a** warehouse manager,
**I want** to create delivery notes to formally dispatch goods to customers,
**So that** stock is deducted only when goods physically leave the warehouse.

**Acceptance Criteria:**
1. CRUD endpoints: POST/GET/GET:id for Delivery Notes
2. Status transitions: PENDING → DISPATCHED → DELIVERED; PENDING → CANCELLED
3. **Dispatch triggers stock deduction** via existing FifoDeductionService
4. Dispatch creates StockMovement records (type: DELIVERY, ref: DELIVERY_NOTE)
5. Dispatch posts COGS journal: DR 5100 COGS, CR 1300 Inventory
6. Updates SalesOrderItem.deliveredQuantity when created from SO
7. Auto-generated number: DN-YYYYMMDD-NNN
8. Delivery details: driverName, vehicleNo, deliveryAddress
9. Cancel only allowed in PENDING status
10. Roles: ADMIN, WAREHOUSE_MANAGER, SALES_OFFICER can create; WAREHOUSE_MANAGER dispatches

**Story File:** [docs/stories/story-10-5-delivery-note-backend.md](../stories/story-10-5-delivery-note-backend.md)

---

### Story 10.6: Delivery Note — Frontend

**As a** warehouse manager,
**I want** a Delivery Notes page to manage dispatches,
**So that** I can track what's been dispatched and delivered.

**Acceptance Criteria:**
1. Delivery Notes list page with status filters, search, pagination
2. Create Delivery Note page: pre-filled from SO items (deliverable quantities)
3. Also supports standalone DN creation (without SO)
4. Delivery Note detail page with status timeline, dispatch info, linked Invoice
5. "Dispatch" button with confirmation (triggers stock deduction)
6. "Mark Delivered" button (DISPATCHED → DELIVERED)
7. "Create Invoice" action button (redirects to Invoice creation from DN)
8. Cancel with reason modal (PENDING only)
9. Sidebar: "Delivery Notes" added under Sales menu

**Story File:** [docs/stories/story-10-6-delivery-note-frontend.md](../stories/story-10-6-delivery-note-frontend.md)

---

### Story 10.7: Purchase Invoice — Backend

**As an** accountant,
**I want** to record supplier invoices and match them against POs and GRNs,
**So that** I can verify 3-way matching before authorizing payment.

**Acceptance Criteria:**
1. CRUD endpoints: POST/GET/GET:id for Purchase Invoices
2. Status: PENDING → PARTIAL → PAID → CANCELLED
3. Auto-generated internal number: PI-YYYYMMDD-NNN
4. Supplier's invoice number stored separately (manual entry)
5. Links to PO and/or GRN (optional — supports direct invoices)
6. 3-way matching endpoint: GET /api/v1/purchase-invoices/:id/matching — shows PO qty vs GRN qty vs PI qty
7. No journal entries (GRN already posted to A/P — PI is reconciliation only)
8. paidAmount tracking for partial payments
9. Link supplier payments to Purchase Invoice
10. Roles: ADMIN, ACCOUNTANT can create

**Story File:** [docs/stories/story-10-7-purchase-invoice-backend.md](../stories/story-10-7-purchase-invoice-backend.md)

---

### Story 10.8: Purchase Invoice — Frontend

**As an** accountant,
**I want** a Purchase Invoices page to record and manage supplier bills,
**So that** I can track what we owe suppliers and verify deliveries match invoices.

**Acceptance Criteria:**
1. Purchase Invoices list page with status filters, search, pagination
2. Create Purchase Invoice page: pre-filled from GRN/PO, or standalone
3. 3-way matching display: side-by-side PO → GRN → PI quantities with variance highlighting
4. Purchase Invoice detail page with payment history, linked PO/GRN
5. Status badges with color coding
6. Sidebar: "Purchase Invoices" added under Purchases menu

**Story File:** [docs/stories/story-10-8-purchase-invoice-frontend.md](../stories/story-10-8-purchase-invoice-frontend.md)

---

### Story 10.9: Invoice Conditional Stock Deduction

**As a** system,
**I want** the Invoice service to conditionally skip stock deduction when a Delivery Note has already handled it,
**So that** stock isn't double-deducted in full mode.

**Acceptance Criteria:**
1. Check `sales.requireDeliveryNote` setting before stock deduction
2. When TRUE: Skip FIFO deduction, skip StockMovement creation, skip COGS posting (DN did it)
3. When FALSE: Current behavior — deduct stock + post COGS at invoice time
4. Invoice still posts A/R journal: DR 1200 A/R, CR 4100 Sales + 2200 Tax
5. Invoice stores deliveryNoteId and/or salesOrderId for traceability
6. Update SalesOrderItem.invoicedQuantity when created from SO
7. Update SO status to PARTIALLY_INVOICED or INVOICED
8. Backward compatible: existing invoices with no SO/DN continue to work

**Story File:** [docs/stories/story-10-9-invoice-conditional-stock.md](../stories/story-10-9-invoice-conditional-stock.md)

---

### Story 10.10: Integration, Reports & Sidebar Updates

**As an** admin,
**I want** the dashboard, reports, and navigation updated to reflect the new document types,
**So that** I have full visibility across the sales and purchasing pipeline.

**Acceptance Criteria:**
1. Dashboard: Sales pipeline widget (SO count by status), Delivery pipeline widget
2. Reports: Sales Order report, Delivery Note report, Purchase Invoice aging report
3. Sidebar restructuring: Sales Orders + Delivery Notes under Sales; Purchase Invoices under Purchases
4. Stock movement report shows DELIVERY movement type with DN reference
5. Journal entries show DELIVERY_NOTE and SALES_ORDER reference types
6. Settings UI: Feature toggles for SO/DN/PI requirements

**Story File:** [docs/stories/story-10-10-integration-reports.md](../stories/story-10-10-integration-reports.md)

---

## Accounting Entries Matrix

### Sales Cycle

| Event | Debit | Credit | When |
|-------|-------|--------|------|
| SO Confirmed | No journal | — | Order booked |
| DN Dispatched (full mode) | 5100 COGS | 1300 Inventory | Stock leaves warehouse |
| Invoice Created (full mode) | 1200 A/R | 4100 Sales + 2200 Tax | Revenue recognized |
| Invoice Created (simple mode) | 1200 A/R + 5100 COGS | 4100 Sales + 2200 Tax + 1300 Inventory | Revenue + COGS |
| Client Payment | 1101 Bank | 1200 A/R | Cash received |
| Credit Note | 4200 Returns | 1200 A/R | Return processed |
| Invoice Void | 4100 Sales + 2200 Tax | 1200 A/R | Reverse revenue |

### Purchasing Cycle

| Event | Debit | Credit | When |
|-------|-------|--------|------|
| PO Created | No journal | — | Order placed |
| GRN Received | 1300 Inventory + 2200 Tax | 2100 A/P | Goods received |
| GRN Additional Cost | 1300 Inventory | 2100 A/P | Landed cost |
| Purchase Invoice Created | No journal | — | Reconciliation only |
| Supplier Payment | 2100 A/P | 1101 Bank | Cash paid |

---

## Epic 10 Dependencies

- **Epic 1** - Authentication, RBAC, audit infrastructure
- **Epic 2** - Products, suppliers, POs, warehouses, inventory
- **Epic 3** - Clients, invoices, payments, credit notes
- **Epic 5** - Chart of accounts, journal entries, auto-journal service
- **Epic 6** - Gate passes, stock movements, FIFO deduction
- **Epic 9** - Multi-tenant infrastructure

## Epic 10 Deliverables

- Sales Order module (backend + frontend)
- Delivery Note module (backend + frontend)
- Purchase Invoice module (backend + frontend)
- COGS journal entry fix
- Feature toggle settings for simple/full mode
- Conditional stock deduction in Invoice service
- Updated dashboards and reports
- Sidebar restructuring
- Supplier payment bug fix
- **All operations logged in audit trail**

## Success Criteria

- Simple mode: Current invoice flow works identically + COGS fix
- Full mode: SO → DN → Invoice chain with proper stock deduction at DN
- Purchase Invoice enables 3-way matching (PO vs GRN vs PI)
- Every stock movement traceable to source document
- Trial balance remains balanced after all operations
- All feature toggles configurable without code changes

## Links

- **Stories:** [docs/stories/](../stories/) (story-10-0 through story-10-10)
- **Architecture:** [docs/architecture/database-schema.md](../architecture/database-schema.md)
- **Plan:** Approved plan in `.claude/plans/compiled-sauteeing-rainbow.md`
