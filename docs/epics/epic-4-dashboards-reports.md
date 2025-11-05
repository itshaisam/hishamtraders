# Epic 4: Dashboards & Reports

**Epic Goal:** Build comprehensive real-time dashboards for all roles and essential reporting engine consolidating all business data into actionable reports. All reports support filtering, sorting, and Excel export. This epic provides complete visibility into business performance and operational metrics.

**Timeline:** MVP Week 5-6 (Days 29-42)

**Status:** MVP - Required for 6-week delivery

**Dependencies:** Epic 1 (Foundation), Epic 2 (Inventory), Epic 3 (Sales/Payments)

---

## Stories

### Story 4.1: Admin Dashboard

**As an** admin,
**I want** a comprehensive dashboard showing overall business health,
**So that** I can monitor key metrics and make informed decisions.

**Acceptance Criteria:**
1. GET /api/dashboard/admin returns admin metrics:
   - Total stock value (sum of inventory qty × cost price)
   - Today's revenue (sum of invoices created today)
   - Month's revenue (sum of invoices this month)
   - Total receivables (sum of client balances)
   - Total payables (sum of unpaid PO amounts)
   - Low stock product count
   - Out of stock product count
   - Pending containers (POs in IN_TRANSIT status)
   - Top 5 products by revenue (this month)
   - Recent audit activity (last 10 actions from AuditLog)
   - Revenue trend (last 30 days, daily totals)
2. Frontend Admin Dashboard displays:
   - Metric cards (stock value, revenue, receivables, payables)
   - Revenue line chart (last 30 days)
   - Top products table (by revenue and quantity)
   - Low/out of stock alerts widget (red badge count)
   - Pending containers widget with details
   - Recent activity widget (audit log summary)
   - Quick action buttons (New PO, New Invoice, New Product)
3. Dashboard is responsive (mobile, tablet, desktop)
4. Dashboard data refreshes on page load via TanStack Query
5. Metric cards show trend indicators (up/down arrows - optional)
6. Only Admin role can access full admin dashboard

**Story File:** [docs/stories/story-4-1-admin-dashboard.md](../stories/story-4-1-admin-dashboard.md)

---

### Story 4.2: Sales Dashboard

**As a** sales officer,
**I want** a sales-focused dashboard showing performance metrics,
**So that** I can track my sales targets and overdue clients.

**Acceptance Criteria:**
1. GET /api/dashboard/sales returns sales metrics:
   - Today's sales (count and total value)
   - Week's sales (count and total value)
   - Month's sales (count and total value)
   - Top 5 clients by revenue (this month)
   - Overdue invoices count and total amount
   - Clients approaching credit limit (>80% utilization)
   - Weekly sales trend (last 7 days)
2. Frontend Sales Dashboard displays:
   - Sales performance cards (today, week, month)
   - Weekly sales trend chart (bar or line chart)
   - Top clients table (by revenue)
   - Overdue clients list (with amounts, color-coded by days overdue)
   - Credit limit alerts widget
   - Quick actions: Create Invoice, Record Payment, View Client
3. Dashboard responsive and updates on load
4. Sales Officer, Accountant, Admin can access sales dashboard

**Story File:** [docs/stories/story-4-2-sales-dashboard.md](../stories/story-4-2-sales-dashboard.md)

---

### Story 4.3: Warehouse Dashboard

**As a** warehouse manager,
**I want** a warehouse-focused dashboard showing stock levels and movements,
**So that** I can manage inventory effectively and identify issues quickly.

**Acceptance Criteria:**
1. GET /api/dashboard/warehouse returns warehouse metrics:
   - Total items in stock (distinct product count with qty > 0)
   - Stock value by category
   - Recent stock movements (last 10 transactions)
   - Low stock alerts (products at or below reorder level)
   - Out of stock products list
   - Pending stock receipts (POs ready to receive)
2. Frontend Warehouse Dashboard displays:
   - Stock summary cards (total items, stock value, alerts)
   - Stock level by category chart (bar/pie chart)
   - Recent movements table (date, product, type, quantity, user)
   - Low stock alerts list (product, current qty, reorder level)
   - Out of stock products list
   - Pending receipts widget (POs in IN_TRANSIT status)
   - Quick actions: Record Receipt, Adjust Stock, View Inventory
3. Dashboard responsive and updates on load
4. Warehouse Manager, Admin can access warehouse dashboard

**Story File:** [docs/stories/story-4-3-warehouse-dashboard.md](../stories/story-4-3-warehouse-dashboard.md)

---

### Story 4.4: Stock Reports

**As a** warehouse manager,
**I want** comprehensive stock reports showing current levels, valuations, and movements,
**So that** inventory planning decisions are data-driven.

**Acceptance Criteria:**
1. GET /api/reports/stock generates current stock report
2. Filters: warehouseId, category, status (all/in-stock/low-stock/out-of-stock), productId
3. Report shows: Product, SKU, Category, Warehouse, Bin, Batch, Quantity, Cost Price, Stock Value
4. Summary row: Total items, Total stock value
5. Sort options: product name, quantity, value
6. GET /api/reports/stock-valuation generates inventory valuation by category
7. Valuation report: Category, Total Quantity, Total Value, % of Total
8. Frontend Stock Report page with filter form
9. Frontend displays results in responsive table with summary
10. Frontend "Export to Excel" button (generates .xlsx file)
11. All roles can access stock reports (read-only)
12. Report generation completes in <5 seconds for 1000 products

**Story File:** [docs/stories/story-4-4-stock-reports.md](../stories/story-4-4-stock-reports.md)

---

### Story 4.5: Sales Reports

**As a** sales officer,
**I want** detailed sales reports by date, client, and product,
**So that** sales performance can be analyzed and optimized.

**Acceptance Criteria:**
1. GET /api/reports/sales generates sales report
2. Filters: date range (required), clientId (optional), productId (optional), paymentType (CASH/CREDIT)
3. Report shows: Invoice #, Date, Client, Product, Quantity, Unit Price, Total Amount, Payment Type, Status
4. Summary: Total invoices, Total amount, Paid amount, Outstanding
5. GET /api/reports/sales-by-client generates client-wise sales summary
6. Client report: Client, Total Invoices, Total Revenue, sorted by revenue desc
7. GET /api/reports/sales-by-product generates product-wise sales summary
8. Product report: Product, Quantity Sold, Revenue, sorted by revenue desc
9. Frontend Sales Reports page with report type selector and filters
10. Frontend date range picker (from/to dates)
11. Frontend displays results in table with summary
12. Frontend "Export to Excel" button for all reports
13. All roles except Recovery Agent can access sales reports

**Story File:** [docs/stories/story-4-5-sales-reports.md](../stories/story-4-5-sales-reports.md)

---

### Story 4.6: Payment Collection Reports

**As an** accountant,
**I want** payment collection and outstanding balance reports,
**So that** cash flow and collection effectiveness can be monitored.

**Acceptance Criteria:**
1. GET /api/reports/payments generates payment collection report
2. Filters: date range, clientId, paymentMethod
3. Report shows: Date, Client, Invoice #, Amount, Method, Recorded By
4. Summary: Total collected, Count of transactions, By method breakdown
5. GET /api/reports/receivables generates outstanding receivables report
6. Receivables report: Client, Total Outstanding, Overdue Amount, Days Overdue (oldest invoice)
7. Report sorted by overdue amount desc
8. Color-coding: green (current), yellow (1-14 days overdue), red (15+ days overdue)
9. Frontend Payment Reports page with filter form
10. Frontend displays payment list and receivables summary
11. Frontend "Export to Excel" button
12. Accountant, Recovery Agent, Admin can access payment reports

**Story File:** [docs/stories/story-4-6-payment-reports.md](../stories/story-4-6-payment-reports.md)

---

### Story 4.7: Import/Container Reports

**As an** accountant,
**I want** import cost analysis reports showing landed cost breakdown,
**So that** procurement costs and profitability can be understood.

**Acceptance Criteria:**
1. GET /api/reports/imports generates import cost report
2. Filters: date range, supplierId, status
3. Report shows: PO #, Supplier, Container #, Ship Date, Arrival Date, Product Cost, Additional Costs (shipping/customs/tax), Total Landed Cost, Status
4. Landed cost breakdown per PO:
   - Product costs subtotal
   - Shipping cost
   - Customs charges
   - Import taxes
   - Total landed cost
   - Landed cost per product (distributed)
5. GET /api/suppliers/:id/po-summary generates supplier performance summary
6. Supplier report: Total POs, Total Ordered Value, Total Paid, Outstanding Balance
7. Frontend Import Reports page with filters
8. Frontend displays PO list with cost breakdown
9. Frontend "Export to Excel" button
10. Accountant, Admin can access import reports

**Story File:** [docs/stories/story-4-7-import-reports.md](../stories/story-4-7-import-reports.md)

---

### Story 4.8: Expense Reports

**As an** accountant,
**I want** detailed expense reports by category and period,
**So that** cost control can be maintained.

**Acceptance Criteria:**
1. GET /api/reports/expenses generates expense report
2. Filters: date range (required), category (optional)
3. Report shows: Date, Category, Amount, Description, Paid To, Method
4. GET /api/reports/expenses-by-category generates category breakdown
5. Category report: Category, Total Amount, Count, % of Total Expenses
6. GET /api/reports/expenses-trend generates monthly trend (last 12 months)
7. Trend report: Month, Total Expenses (useful for charts)
8. Frontend Expense Reports page with filter form and report type selector
9. Frontend displays detailed list and category summary
10. Frontend optional monthly trend chart (bar chart)
11. Frontend "Export to Excel" button
12. Accountant, Admin can access expense reports

**Story File:** [docs/stories/story-4-8-expense-reports.md](../stories/story-4-8-expense-reports.md)

---

### Story 4.9: Excel Export Functionality

**As a** user,
**I want** all reports to be exportable to Excel format,
**So that** data can be further analyzed in spreadsheets.

**Acceptance Criteria:**
1. All report endpoints support Excel export via query param or separate endpoint
2. Excel export uses library like exceljs or xlsx (Node.js backend)
3. Excel file includes:
   - Report title and filter parameters (date range, etc.)
   - Generated timestamp and generated by user
   - Data in table format with styled headers (bold, background color)
   - Column auto-sizing
   - Number formatting (currency for amounts, decimals for quantities)
   - Summary rows with formulas where applicable
4. Excel download triggers browser download (Content-Disposition: attachment; filename="report-name-YYYYMMDD.xlsx")
5. Frontend "Export to Excel" button on all report pages
6. Export includes all data (not just paginated view, up to 10,000 rows)
7. Export performance: < 5 seconds for reports with 1000 rows
8. Export file naming convention: `{report-type}-{date}.xlsx` (e.g., `sales-report-20250115.xlsx`)

**Story File:** [docs/stories/story-4-9-excel-export.md](../stories/story-4-9-excel-export.md)

---

### Story 4.10: Reports Navigation Center

**As a** user,
**I want** a central reports page listing all available reports by category,
**So that** I can easily find and generate any report.

**Acceptance Criteria:**
1. Frontend Reports Center page lists all reports categorized:
   - **Inventory Reports:** Stock Report, Stock Valuation, Stock Movements
   - **Sales Reports:** Sales by Date, Sales by Client, Sales by Product
   - **Payment Reports:** Payment Collection, Outstanding Receivables
   - **Purchase Reports:** Import/Container Report, Supplier Performance
   - **Financial Reports:** Expense Report, Expense by Category, Expense Trend
2. Each report listed with: Name, Description, Icon, Link to generate
3. Reports filtered by user role (show only reports user can access)
4. Dashboard includes "View All Reports" link to Reports Center
5. Reports Center uses card/tile layout for report categories
6. Clicking report card navigates to specific report page with filters
7. Reports Center is responsive (mobile, tablet, desktop)

**Story File:** [docs/stories/story-4-10-reports-center.md](../stories/story-4-10-reports-center.md)

---

## Epic 4 Dependencies

- **Epic 1** - Foundation, authentication
- **Epic 2** - Inventory data for stock reports
- **Epic 3** - Sales/payment data for financial reports

## Epic 4 Deliverables

✅ Admin dashboard with overall business metrics
✅ Sales dashboard with performance tracking
✅ Warehouse dashboard with stock visibility
✅ Comprehensive stock reports (current, valuation, movements)
✅ Sales reports (by date, client, product)
✅ Payment collection and receivables reports
✅ Import/container cost analysis reports
✅ Expense reports (detailed, by category, trends)
✅ Excel export for all reports
✅ Central reports navigation center
✅ Real-time data updates via TanStack Query
✅ Responsive design (mobile, tablet, desktop)

## Success Criteria

- All roles have relevant dashboards
- Reports generate accurate data
- Excel export works for all reports
- Report performance: <5 seconds for 1000 rows
- Dashboards load in <2 seconds
- Charts display correctly with real data
- Mobile-responsive interface

## Links

- **Stories:** [docs/stories/](../stories/) (story-4-1 through story-4-10)
- **Architecture:** [docs/architecture/database-schema.md](../architecture/database-schema.md)
- **MVP Roadmap:** [docs/planning/mvp-roadmap.md](../planning/mvp-roadmap.md)
