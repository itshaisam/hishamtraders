# Story 10.10: Integration, Reports & Sidebar Updates

**Epic:** Epic 10 - Standardized Sales, Purchasing & Inventory Flow
**Story ID:** STORY-10.10
**Priority:** Medium
**Estimated Effort:** 8-10 hours
**Dependencies:** Stories 10.3-10.9 (all modules)
**Status:** Not Started

---

## User Story

**As an** admin,
**I want** the dashboards, reports, and navigation updated to reflect the new Sales Orders, Delivery Notes, and Purchase Invoices,
**So that** I have full visibility across the entire sales and purchasing pipeline.

---

## Acceptance Criteria

### 1. Sidebar Restructuring

- [ ] **Sales menu** (updated order):
  - Customers
  - Sales Orders ← NEW
  - Delivery Notes ← NEW
  - Invoices
  - Returns
- [ ] **Purchases menu** (updated order):
  - Purchase Orders
  - Goods Receipts
  - Purchase Invoices ← NEW
  - Suppliers
  - Record Supplier Payment ← MOVED from Payments
  - Supplier Payment History ← MOVED from Payments
- [ ] **Payments menu** (reduced):
  - Record Customer Payment
  - Customer Payment History
  - Expenses
  - Payment History
- [ ] Role visibility:
  - Sales Orders: ADMIN, SALES_OFFICER, ACCOUNTANT
  - Delivery Notes: ADMIN, WAREHOUSE_MANAGER, SALES_OFFICER, ACCOUNTANT
  - Purchase Invoices: ADMIN, ACCOUNTANT, WAREHOUSE_MANAGER

### 2. Dashboard Updates

- [ ] **Admin Dashboard** — Add widgets:
  - Sales Orders by status (count/value: DRAFT, CONFIRMED, DELIVERED, INVOICED)
  - Pending Delivery Notes count
  - Purchase Invoices outstanding (total unpaid amount)
- [ ] **Sales Dashboard** — Add widgets:
  - Sales Order pipeline (funnel: DRAFT → CONFIRMED → DELIVERED → INVOICED)
  - Orders pending delivery count
  - Average order-to-delivery time
- [ ] **Warehouse Dashboard** — Add widgets:
  - Pending Delivery Notes (awaiting dispatch)
  - Today's dispatches count
- [ ] **Accounting Dashboard** — Add widgets:
  - Purchase Invoice aging (0-30, 31-60, 61-90, 90+ days)
  - Outstanding A/P from Purchase Invoices

### 3. Reports

- [ ] **Sales Order Report** (`/reports/sales-orders`):
  - Filters: date range, status, client
  - Columns: Order #, Client, Date, Expected Delivery, Items, Total, Status
  - Summary: Total orders, total value, by status breakdown
- [ ] **Delivery Note Report** (`/reports/delivery-notes`):
  - Filters: date range, status, client, warehouse
  - Columns: DN #, Client, SO #, Date, Status, Items, Dispatched By
  - Summary: Total dispatched, delivery success rate
- [ ] **Purchase Invoice Aging Report** (`/reports/purchase-invoice-aging`):
  - Grouped by supplier
  - Columns: Supplier, Current (0-30), 31-60, 61-90, 90+, Total Outstanding
  - Summary row with totals

### 4. Stock Movement Report Enhancement

- [ ] Stock movement report (`/inventory/movements`) shows new movement types:
  - `DELIVERY` type displayed as "Delivery Note" with DN number
- [ ] Reference type links:
  - `DELIVERY_NOTE` → click navigates to DN detail page
  - `SALES_ORDER` → click navigates to SO detail page
  - `PURCHASE_INVOICE` → click navigates to PI detail page

### 5. Journal Entry Viewer Enhancement

- [ ] Journal entries page shows new reference types:
  - `DELIVERY_NOTE` — with link to DN detail
  - `SALES_ORDER` — with link to SO detail (if journal exists)
  - `PURCHASE_INVOICE` — with link to PI detail (future, when GRNI enabled)

### 6. Settings UI

- [ ] System Settings page (`/settings/tax` or new `/settings` page):
  - "Sales & Purchasing Workflow" section
  - Toggle switches for each workflow setting (from Story 10.2)
  - Clear descriptions explaining what each toggle does
  - Warning banner: "Changing these settings affects how invoices and stock movements are processed"

### 7. Cross-Document Navigation

- [ ] Invoice detail page: Link to source SO and/or DN (if exists)
- [ ] SO detail page: Links to all DNs and Invoices created from it
- [ ] DN detail page: Links to source SO and downstream Invoices
- [ ] GRN detail page: Link to Purchase Invoice (if created)
- [ ] PI detail page: Links to PO and GRN

---

## Dev Notes

### Files to Modify

| File | Change |
|------|--------|
| `apps/web/src/components/Sidebar.tsx` | Restructure Sales, Purchases, Payments menus |
| `apps/web/src/App.tsx` | Add report routes |
| `apps/web/src/features/dashboard/` | Add new dashboard widgets |
| `apps/web/src/features/reports/` | Add new report pages |
| `apps/web/src/features/settings/` | Add workflow settings section |
| `apps/web/src/features/invoices/pages/InvoiceDetailPage.tsx` | Add SO/DN links |
| `apps/web/src/features/goods-receipts/pages/GoodsReceiptDetailPage.tsx` | Add PI link/action |

### Dashboard Widget Pattern

Follow existing pattern in dashboard pages — use `Card` components with query hooks:
```tsx
const { data: soStats } = useQuery({
  queryKey: ['sales-order-stats'],
  queryFn: () => salesOrderService.getStats(),
});
```

### Report API Endpoints

New endpoints for reports:
- `GET /api/v1/reports/sales-orders` — Sales order summary
- `GET /api/v1/reports/delivery-notes` — Delivery note summary
- `GET /api/v1/reports/purchase-invoice-aging` — A/P aging by supplier

These follow the existing pattern in `apps/api/src/modules/reports/`.

### Sidebar Structure (Code Reference)

Current sidebar in `apps/web/src/components/Sidebar.tsx` uses a `menuItems` array. Add new items to existing menu groups and reorder as specified.

### Key Patterns

- Dashboard widgets: Cards with numbers and trend indicators
- Reports: Table with filters, summary row, export to Excel
- Settings: Use existing toggle/switch pattern
- Cross-document links: Use `<Link to={`/path/${id}`}>` with document number as text
- All new pages need skeleton loaders and error states

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 1.0 | Initial story creation | Claude (AI Planning) |
