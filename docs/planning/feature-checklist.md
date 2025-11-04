# ✅ MVP FEATURE CHECKLIST

**Track your progress building Hisham Traders ERP**

---

## 🎯 PHASE 1: CORE FOUNDATION (Week 1-2)

### Week 1: Project Setup & Authentication

#### Day 1-2: Environment Setup
- [ ] Install Node.js 20 LTS
- [ ] Install pnpm package manager
- [ ] Set up monorepo with workspace
- [ ] Create Docker Compose for PostgreSQL
- [ ] Initialize Git repository
- [ ] Create .env file with secrets
- [ ] Set up Express backend boilerplate
- [ ] Set up React frontend with Vite
- [ ] Verify all services running

**Acceptance Criteria:** Backend responds on port 3001, frontend on 5173, database accessible

---

#### Day 3-4: Authentication System
**Backend:**
- [ ] Create User model in Prisma
- [ ] Implement user registration endpoint
- [ ] Implement login endpoint (JWT generation)
- [ ] Create JWT auth middleware
- [ ] Create role-based access middleware
- [ ] Hash passwords with bcrypt

**Frontend:**
- [ ] Create login page UI
- [ ] Create registration form
- [ ] Implement auth state management
- [ ] Store JWT token in localStorage
- [ ] Create protected route wrapper
- [ ] Handle auth errors

**Testing:**
- [ ] Test registration with all roles
- [ ] Test login with correct/incorrect passwords
- [ ] Test protected routes without token
- [ ] Test token expiration

**Acceptance Criteria:** Users can register, login, and access role-specific pages

---

### Week 1 (Cont'd): Import/Container Module

#### Day 5-7: Supplier & Purchase Order Management

**Database (Prisma Schema):**
- [ ] Create Supplier model
- [ ] Create PurchaseOrder model
- [ ] Create POItem model (products in PO)
- [ ] Create POCost model (shipping, customs, taxes)
- [ ] Create relationships between models
- [ ] Run migration

**Backend API:**
- [ ] POST /api/suppliers - Create supplier
- [ ] GET /api/suppliers - List all suppliers
- [ ] GET /api/suppliers/:id - Get supplier details
- [ ] PUT /api/suppliers/:id - Update supplier
- [ ] DELETE /api/suppliers/:id - Soft delete supplier
- [ ] POST /api/purchase-orders - Create PO
- [ ] GET /api/purchase-orders - List POs (with filters)
- [ ] GET /api/purchase-orders/:id - Get PO details with items
- [ ] PUT /api/purchase-orders/:id - Update PO
- [ ] PATCH /api/purchase-orders/:id/status - Update status
- [ ] GET /api/purchase-orders/:id/landed-cost - Calculate landed cost

**Frontend:**
- [ ] Create suppliers list page
- [ ] Create add/edit supplier form
- [ ] Create PO list page with filters (status, date)
- [ ] Create PO creation form:
  - [ ] Select supplier dropdown
  - [ ] Container details (number, ship date, arrival)
  - [ ] Add products with quantity and unit cost
  - [ ] Add additional costs (shipping, customs, taxes)
  - [ ] Calculate and display total landed cost
  - [ ] Calculate cost per product (distributed)
- [ ] Create PO detail view page
- [ ] Create PO status update UI (Pending → In Transit → Received)

**Business Logic:**
- [ ] Validate PO totals (items + costs)
- [ ] Calculate landed cost per product formula:
  ```
  Landed Cost Per Unit = (Product Cost + (Additional Costs × Product Ratio)) / Quantity
  where Product Ratio = Product Cost / Total Product Cost
  ```
- [ ] Prevent editing received POs
- [ ] Track payment status for POs

**Testing:**
- [ ] Create supplier successfully
- [ ] Create PO with multiple items
- [ ] Verify landed cost calculation accuracy
- [ ] Update PO status workflow
- [ ] List POs with filters working

**Acceptance Criteria:**
- User can manage suppliers
- User can create POs with container tracking
- System calculates accurate landed cost per product
- PO workflow (Pending → In Transit → Received) works

---

## 🎯 PHASE 2: PRODUCT & INVENTORY (Week 2)

### Week 2: Product Master & Warehouse Setup

#### Day 8-10: Product & Warehouse Management

**Database:**
- [ ] Create Product model (SKU, name, brand, category, cost, selling price, reorder level, bin)
- [ ] Create Warehouse model (name, location, city)
- [ ] Create Inventory model (product + warehouse + quantity + batch + bin location)
- [ ] Create StockMovement model (audit trail)
- [ ] Run migrations

**Backend API:**
- [ ] POST /api/products - Create product
- [ ] GET /api/products - List products (with search/filters)
- [ ] GET /api/products/:id - Get product details
- [ ] PUT /api/products/:id - Update product
- [ ] DELETE /api/products/:id - Soft delete
- [ ] POST /api/warehouses - Create warehouse
- [ ] GET /api/warehouses - List warehouses
- [ ] PUT /api/warehouses/:id - Update warehouse
- [ ] POST /api/purchase-orders/:id/receive - Receive stock from PO
  - [ ] Create inventory records for each product
  - [ ] Assign batch/lot numbers
  - [ ] Update PO status to RECEIVED
  - [ ] Create stock movement records
- [ ] GET /api/inventory - Get all inventory with filters
- [ ] GET /api/inventory/product/:id - Get stock by product
- [ ] GET /api/inventory/warehouse/:id - Get stock by warehouse
- [ ] POST /api/inventory/adjustment - Adjust stock (wastage, correction)
- [ ] GET /api/inventory/low-stock - Get low stock alerts

**Frontend:**
- [ ] Create product list page:
  - [ ] Table with search
  - [ ] Filters (category, brand, active/inactive)
  - [ ] Pagination
- [ ] Create add/edit product form:
  - [ ] Auto-generate SKU option
  - [ ] Category dropdown
  - [ ] Cost & selling price inputs
  - [ ] Reorder level setting
  - [ ] Bin location input
- [ ] Create warehouse list page
- [ ] Create add/edit warehouse form
- [ ] Create stock receiving page:
  - [ ] Select pending PO
  - [ ] Display PO items
  - [ ] Assign bin location for each product
  - [ ] Generate batch number automatically
  - [ ] Confirm receipt button
- [ ] Create inventory view page:
  - [ ] Filter by product/warehouse
  - [ ] Show quantity, value, bin location
  - [ ] Color-coded stock status (green=in-stock, yellow=low, red=out-of-stock)
- [ ] Create stock adjustment page:
  - [ ] Select product and warehouse
  - [ ] Adjustment type (wastage, theft, correction)
  - [ ] Reason input
  - [ ] Quantity adjustment (+ or -)

**Business Logic:**
- [ ] Stock receiving workflow:
  1. User selects pending PO
  2. System displays items with quantities
  3. User assigns bin locations
  4. System creates inventory records
  5. System updates PO status
  6. System creates stock movement audit
- [ ] Stock never goes negative (validation)
- [ ] Low stock detection (quantity <= reorder level)
- [ ] Calculate stock value (quantity × cost price)

**Testing:**
- [ ] Create products with different categories
- [ ] Create warehouses
- [ ] Receive stock from PO into warehouse
- [ ] Verify inventory records created correctly
- [ ] Check stock movement audit trail
- [ ] Adjust stock and verify update
- [ ] Test low stock alerts

**Acceptance Criteria:**
- Products and warehouses configured
- Stock receiving from PO creates accurate inventory
- Stock adjustments tracked with audit trail
- Low stock alerts visible
- Inventory queryable by product/warehouse

---

## 🎯 PHASE 3: SALES & CLIENTS (Week 3)

### Week 3: Client Management & Sales Invoicing

#### Day 15-17: Client Management

**Database:**
- [ ] Create Client model (name, contact, area, credit limit, balance, payment terms)
- [ ] Run migration

**Backend API:**
- [ ] POST /api/clients - Create client
- [ ] GET /api/clients - List clients (with search/filters)
- [ ] GET /api/clients/:id - Get client details with transaction history
- [ ] PUT /api/clients/:id - Update client
- [ ] DELETE /api/clients/:id - Soft delete
- [ ] GET /api/clients/:id/balance - Get current balance
- [ ] GET /api/clients/:id/transactions - Get client transaction history

**Frontend:**
- [ ] Create client list page:
  - [ ] Table with search
  - [ ] Filters (area, city, credit/cash clients)
  - [ ] Show current balance
  - [ ] Color-code by credit status (green=good, yellow=near-limit, red=over-limit)
- [ ] Create add/edit client form:
  - [ ] Contact details
  - [ ] Credit limit input
  - [ ] Payment terms (days)
  - [ ] Recovery day dropdown (Mon-Sat)
- [ ] Create client detail page:
  - [ ] Basic info
  - [ ] Current balance with aging
  - [ ] Credit limit usage meter
  - [ ] Transaction history table
  - [ ] Quick payment record button

**Testing:**
- [ ] Create cash client (no credit limit)
- [ ] Create credit client with limit
- [ ] Update client details
- [ ] View client detail page

**Acceptance Criteria:**
- User can manage client database
- Credit limits configurable
- Client balance tracked (will update with invoices later)

---

#### Day 18-21: Sales Invoicing

**Database:**
- [ ] Create Invoice model (client, date, totals, tax, status)
- [ ] Create InvoiceItem model (invoice + product + quantity + price)
- [ ] Run migration

**Backend API:**
- [ ] POST /api/invoices - Create invoice
  - [ ] Validate stock availability
  - [ ] Validate client credit limit (if credit sale)
  - [ ] Deduct inventory for each item
  - [ ] Update client balance
  - [ ] Calculate invoice totals
  - [ ] Create stock movement records
- [ ] GET /api/invoices - List invoices (with filters: date, client, status)
- [ ] GET /api/invoices/:id - Get invoice details with items
- [ ] PUT /api/invoices/:id - Update invoice (only if not paid)
- [ ] DELETE /api/invoices/:id - Void invoice (reverse stock and balance)
- [ ] PATCH /api/invoices/:id/status - Update payment status

**Frontend:**
- [ ] Create invoice creation page:
  - [ ] Select client (show balance and credit limit)
  - [ ] Add products (with stock availability check)
  - [ ] Display available stock in warehouse
  - [ ] Quantity input with validation
  - [ ] Auto-calculate line total (qty × price)
  - [ ] Apply discount (optional)
  - [ ] Calculate tax (configurable %)
  - [ ] Display subtotal, tax, grand total
  - [ ] Show credit limit warning if exceeded
  - [ ] Payment type: Cash or Credit
  - [ ] Save invoice button
- [ ] Create invoice list page:
  - [ ] Table with filters (date range, client, status)
  - [ ] Show invoice number, date, client, total, status
  - [ ] Quick actions (view, print, void)
- [ ] Create invoice detail/print view:
  - [ ] Professional invoice layout
  - [ ] Company header
  - [ ] Client details
  - [ ] Item table
  - [ ] Totals breakdown
  - [ ] Print button (browser print)

**Business Logic:**
- [ ] Stock deduction workflow:
  1. Validate all items have sufficient stock
  2. Deduct from inventory (FIFO - oldest batch first if multiple batches)
  3. Create stock movement records
  4. If insufficient stock, show error (don't save invoice)
- [ ] Credit limit validation:
  1. Calculate new balance (current + invoice total)
  2. If new balance > credit limit, show warning
  3. Allow override for Admin role only
- [ ] Invoice number generation:
  - Auto-increment: INV-2025-0001, INV-2025-0002, etc.
- [ ] Tax calculation:
  - Subtotal × Tax Rate (e.g., 17%)
  - Total = Subtotal + Tax
- [ ] Payment status logic:
  - PENDING: paidAmount = 0
  - PARTIAL: 0 < paidAmount < total
  - PAID: paidAmount = total
  - OVERDUE: status = PENDING && dueDate < today

**Testing:**
- [ ] Create cash invoice (sufficient stock)
- [ ] Create credit invoice (check credit limit)
- [ ] Try to create invoice with insufficient stock (should fail)
- [ ] Try to exceed client credit limit (should warn)
- [ ] Verify stock deducted correctly
- [ ] Verify client balance updated
- [ ] View and print invoice
- [ ] Void invoice and verify reversal

**Acceptance Criteria:**
- Sales team can create invoices
- Stock auto-deducts on invoice save
- Client balance updates automatically
- Credit limit enforced with warnings
- Invoice printable
- Voiding invoice reverses changes

---

## 🎯 PHASE 4: PAYMENTS & EXPENSES (Week 4)

### Week 4: Payment Management

#### Day 22-24: Client & Supplier Payments

**Database:**
- [ ] Create Payment model (type, reference_type, reference_id, amount, method, date)
- [ ] Run migration

**Backend API:**
- [ ] POST /api/payments/client - Record client payment
  - [ ] Update client balance
  - [ ] Allocate to invoice(s)
  - [ ] Update invoice status (partial/paid)
- [ ] POST /api/payments/supplier - Record supplier payment
  - [ ] Link to PO
  - [ ] Track payment method
- [ ] GET /api/payments - List all payments (with filters)
- [ ] GET /api/payments/client/:clientId - Client payment history
- [ ] GET /api/payments/supplier/:supplierId - Supplier payment history
- [ ] DELETE /api/payments/:id - Void payment (reverse balance changes)

**Frontend:**
- [ ] Create client payment recording page:
  - [ ] Select client (show current balance)
  - [ ] Enter payment amount
  - [ ] Select payment method (cash, bank transfer, cheque)
  - [ ] Allocate to specific invoices (auto-select oldest first)
  - [ ] Show remaining balance after payment
  - [ ] Save payment button
- [ ] Create supplier payment recording page:
  - [ ] Select supplier
  - [ ] Select PO to pay for
  - [ ] Enter amount
  - [ ] Payment method and date
  - [ ] Track remaining PO balance
- [ ] Create payment history page:
  - [ ] Table with filters (date, type, method)
  - [ ] Show payment details
  - [ ] Link to related invoice/PO

**Business Logic:**
- [ ] Client payment allocation:
  1. Receive payment amount
  2. Allocate to oldest unpaid invoices first (FIFO)
  3. Update invoice status (partial if partly paid, paid if fully paid)
  4. Update client balance (balance - payment amount)
- [ ] Validation: payment amount ≤ client balance

**Testing:**
- [ ] Record client payment for single invoice
- [ ] Record client payment covering multiple invoices
- [ ] Record supplier payment for PO
- [ ] Verify balance updates correctly
- [ ] View payment history

**Acceptance Criteria:**
- Payments recorded and linked to invoices/POs
- Client and supplier balances update automatically
- Payment history queryable

---

#### Day 25-28: Expense Tracking

**Database:**
- [ ] Create Expense model (category, amount, date, description, paid_to)
- [ ] Run migration

**Backend API:**
- [ ] POST /api/expenses - Create expense
- [ ] GET /api/expenses - List expenses (with filters: date, category)
- [ ] PUT /api/expenses/:id - Update expense
- [ ] DELETE /api/expenses/:id - Delete expense
- [ ] GET /api/expenses/summary - Expense summary by category

**Frontend:**
- [ ] Create add expense page:
  - [ ] Category dropdown (Rent, Utilities, Salaries, Transport, Miscellaneous)
  - [ ] Amount input
  - [ ] Date picker
  - [ ] Description
  - [ ] Paid to (optional)
  - [ ] Save button
- [ ] Create expense list page:
  - [ ] Table with filters (date range, category)
  - [ ] Show expense details
  - [ ] Edit/delete actions
- [ ] Create expense summary widget:
  - [ ] Total by category
  - [ ] Monthly trend

**Testing:**
- [ ] Add various expense types
- [ ] Filter by category
- [ ] View summary

**Acceptance Criteria:**
- Operating expenses tracked
- Categorized for reporting
- Monthly summaries available

---

## 🎯 PHASE 5: DASHBOARDS (Week 5-6)

### Week 5: Real-time Dashboards

#### Day 29-33: Dashboard Development

**Backend API:**
- [ ] GET /api/dashboard/admin - Admin metrics:
  - [ ] Total stock value (sum of inventory × cost price)
  - [ ] Today's revenue
  - [ ] Month's revenue
  - [ ] Total receivables (sum of client balances)
  - [ ] Total payables (sum of unpaid PO balances)
  - [ ] Low stock count
  - [ ] Top 5 products by revenue
  - [ ] Top 5 products by quantity sold
  - [ ] Pending containers count
  - [ ] Revenue trend (last 30 days)
- [ ] GET /api/dashboard/sales - Sales metrics:
  - [ ] Today's sales
  - [ ] Week's sales
  - [ ] Month's sales
  - [ ] Sales target vs actual
  - [ ] Top 5 clients by revenue
  - [ ] Overdue invoices count
  - [ ] Weekly sales trend
- [ ] GET /api/dashboard/warehouse - Warehouse metrics:
  - [ ] Total items in stock
  - [ ] Stock value by category
  - [ ] Recent stock movements (last 10)
  - [ ] Low stock alerts
  - [ ] Pending receipts count

**Frontend:**

**Admin Dashboard:**
- [ ] Create admin dashboard page
- [ ] Metric cards:
  - [ ] Total stock value
  - [ ] Today's revenue
  - [ ] Month's revenue
  - [ ] Total receivables
  - [ ] Total payables
- [ ] Revenue chart (line chart, last 30 days)
- [ ] Top products table (by revenue and quantity)
- [ ] Low stock alerts widget (red badge)
- [ ] Pending containers widget
- [ ] Quick actions buttons (New PO, New Invoice, etc.)

**Sales Dashboard:**
- [ ] Create sales dashboard page
- [ ] Sales performance cards:
  - [ ] Today's sales
  - [ ] Week's sales
  - [ ] Month's sales
- [ ] Target vs actual progress bar
- [ ] Weekly sales trend chart
- [ ] Top clients table
- [ ] Overdue clients list (with amounts)
- [ ] Quick invoice creation button

**Warehouse Dashboard:**
- [ ] Create warehouse dashboard page
- [ ] Stock summary cards:
  - [ ] Total items
  - [ ] Stock value
  - [ ] Low stock count
- [ ] Stock level by category chart (bar/pie chart)
- [ ] Recent movements table (last 10 transactions)
- [ ] Low stock alerts list
- [ ] Pending receipts widget
- [ ] Quick stock adjustment button

**Charts:**
- [ ] Install recharts library
- [ ] Create line chart component for revenue trend
- [ ] Create bar chart component for stock by category
- [ ] Create pie chart component (optional)

**Testing:**
- [ ] Verify all metrics calculate correctly
- [ ] Test charts render with real data
- [ ] Test dashboard loads quickly (<2s)
- [ ] Test on mobile/tablet (responsive)

**Acceptance Criteria:**
- Real-time dashboards for all roles
- Charts update with actual data
- Responsive on all devices
- Performance: page load <2 seconds

---

## 🎯 PHASE 6: REPORTS (Week 6)

### Week 6: Essential Reports

#### Day 34-42: Report Development

**Backend API:**
- [ ] GET /api/reports/stock - Stock report:
  - [ ] Filters: product, category, warehouse
  - [ ] Return: product, SKU, category, quantity, cost price, total value
  - [ ] Sort options
  - [ ] Excel export endpoint
- [ ] GET /api/reports/sales - Sales report:
  - [ ] Filters: date range, client, product
  - [ ] Return: invoice number, date, client, product details, quantity, amount
  - [ ] Totals: subtotal, tax, grand total
  - [ ] Excel export
- [ ] GET /api/reports/payments - Payment collection report:
  - [ ] Filter: date range, client
  - [ ] Return: client, outstanding balance, payments received, remaining balance
  - [ ] Aging summary (0-7 days, 8-14, 15-30, 30+)
  - [ ] Excel export
- [ ] GET /api/reports/imports - Container/import report:
  - [ ] Filter: date range, status
  - [ ] Return: PO number, supplier, container, total cost, landed cost per product
  - [ ] Excel export
- [ ] GET /api/reports/expenses - Expense report:
  - [ ] Filter: date range, category
  - [ ] Return: category, amount, date, description
  - [ ] Total by category
  - [ ] Monthly trend
  - [ ] Excel export

**Frontend:**

**Stock Report:**
- [ ] Create stock report page
- [ ] Filters section:
  - [ ] Product search/dropdown
  - [ ] Category dropdown
  - [ ] Warehouse dropdown
- [ ] Results table:
  - [ ] Product, SKU, category, warehouse, quantity, cost, value
  - [ ] Footer row with totals
- [ ] Export to Excel button
- [ ] Print button

**Sales Report:**
- [ ] Create sales report page
- [ ] Filters section:
  - [ ] Date range picker (from/to)
  - [ ] Client dropdown
  - [ ] Product dropdown
- [ ] Results table:
  - [ ] Invoice #, date, client, product, qty, amount
  - [ ] Summary section (total sales, total tax, grand total)
- [ ] Export to Excel button

**Payment Collection Report:**
- [ ] Create payment report page
- [ ] Filters: date range, client
- [ ] Outstanding receivables table:
  - [ ] Client, current balance, overdue amount
  - [ ] Color-coded by days overdue
- [ ] Payments received table:
  - [ ] Date, client, amount, method
- [ ] Aging summary widget (0-7, 8-14, 15-30, 30+ days)
- [ ] Export buttons

**Container/Import Report:**
- [ ] Create import report page
- [ ] Filters: date range, status
- [ ] PO summary table:
  - [ ] PO #, supplier, container, ship date, arrival
  - [ ] Product cost, additional costs, total landed cost
  - [ ] Cost per product breakdown
- [ ] Profitability analysis (if selling prices available)
- [ ] Export button

**Expense Report:**
- [ ] Create expense report page
- [ ] Filters: date range, category
- [ ] Expense list table
- [ ] Summary by category:
  - [ ] Category, total amount, % of total
- [ ] Monthly trend chart
- [ ] Export button

**Excel Export:**
- [ ] Install xlsx library
- [ ] Create Excel export utility function
- [ ] Style headers (bold, background color)
- [ ] Format numbers (currency, decimals)
- [ ] Auto-size columns
- [ ] Add totals row

**Testing:**
- [ ] Generate each report with real data
- [ ] Test all filter combinations
- [ ] Verify calculations are accurate
- [ ] Test Excel export (opens correctly in Excel)
- [ ] Test print functionality
- [ ] Performance: reports load in <5 seconds

**Acceptance Criteria:**
- All reports functional with accurate data
- Filters work correctly
- Excel export works for all reports
- Reports load quickly (<5 seconds for 1000 records)
- Print-friendly layout

---

## 🚀 FINAL WEEK: POLISH & DEPLOY

### Day 43-45: Bug Fixes & Polish
- [ ] Fix any known bugs
- [ ] Improve error messages
- [ ] Add loading states
- [ ] Add success notifications
- [ ] Improve mobile responsiveness
- [ ] Add keyboard shortcuts (Enter to submit, Esc to cancel)
- [ ] Optimize database queries (add indexes)
- [ ] Clean up console logs

### Day 46-48: Deployment & Training
- [ ] Set up production server (DigitalOcean)
- [ ] Configure Nginx reverse proxy
- [ ] Set up SSL certificate
- [ ] Run database migrations on production
- [ ] Deploy backend and frontend
- [ ] Test production environment
- [ ] Create user documentation
- [ ] Conduct training session with client
- [ ] Gather initial feedback

---

## 📊 MVP COMPLETION CHECKLIST

### ✅ Core Features Complete
- [ ] User authentication with role-based access
- [ ] Container/import management with landed cost calculation
- [ ] Product and warehouse management
- [ ] Inventory tracking (real-time stock levels)
- [ ] Client management with credit limits
- [ ] Sales invoicing with auto stock deduction
- [ ] Payment recording (client & supplier)
- [ ] Expense tracking
- [ ] Real-time dashboards (Admin, Sales, Warehouse)
- [ ] Essential reports with Excel export

### ✅ Quality Checks
- [ ] No critical bugs
- [ ] All calculations accurate (pricing, inventory, balances)
- [ ] Performance acceptable (<2s page load, <500ms API)
- [ ] Responsive design (works on tablet/mobile)
- [ ] Secure (passwords hashed, JWT auth, SQL injection prevention)
- [ ] Data backed up daily

### ✅ User Acceptance
- [ ] Client trained on system
- [ ] Client can perform key workflows independently
- [ ] Initial data migrated successfully
- [ ] Positive feedback from client

---

## 🎯 POST-MVP FEATURES (Phase 2)

Save these for after MVP launch:

- [ ] Batch/lot tracking with expiry dates
- [ ] Barcode scanning integration
- [ ] WhatsApp/SMS integration for reminders
- [ ] Weekly recovery schedule by client day
- [ ] Aging analysis detailed report
- [ ] Stock transfer between warehouses
- [ ] Mobile apps (React Native/Flutter)
- [ ] Advanced analytics and forecasting
- [ ] FBR e-invoice integration
- [ ] Supplier portal
- [ ] Multi-currency support
- [ ] Customer portal

---

**You've Got This! 🚀**

Follow this checklist week by week, and you'll have a fully functional ERP in 6 weeks.

Good luck! 💪
