# 🚀 HISHAM TRADERS ERP - MVP IMPLEMENTATION ROADMAP

**Project:** Import-Distribution Management Platform
**Client:** Hisham Traders (Sanitary Products Importer)
**Timeline:** 4-6 weeks
**Budget:** Low-cost (~$1,150 committed)
**Tech Stack:** Node.js + TypeScript + React + PostgreSQL

---

## 📅 WEEK-BY-WEEK BREAKDOWN

### WEEK 1: Foundation & Import Module

#### Day 1-2: Project Setup
- [x] ~~Approved Node.js + TypeScript stack~~
- [ ] Create monorepo structure
- [ ] Initialize Git repository
- [ ] Set up pnpm workspaces
- [ ] Initialize Prisma with PostgreSQL
- [ ] Create Docker Compose for local DB
- [ ] Set up Express API boilerplate
- [ ] Set up React with Vite
- [ ] Install core dependencies

**Deliverable:** Development environment ready, databases running

#### Day 3-4: Authentication & User Management
- [ ] Design user schema (roles: Admin, Warehouse, Sales, Accountant, Recovery)
- [ ] Build registration/login API
- [ ] Implement JWT authentication
- [ ] Create role-based middleware
- [ ] Build login UI
- [ ] Protected routes on frontend
- [ ] Test auth flow

**Deliverable:** Users can log in with role-based access

#### Day 5-7: Import/Container Module (Priority 1)
**Backend:**
- [ ] Supplier CRUD API
- [ ] Purchase Order CRUD API
- [ ] Container tracking fields
- [ ] Landed cost calculator endpoint
- [ ] PO items (product + quantity + cost)
- [ ] Additional costs (shipping, customs, taxes)
- [ ] Payment tracking for suppliers

**Frontend:**
- [ ] Supplier management page
- [ ] Create PO form
  - Select supplier
  - Add container details
  - Add products with quantities
  - Add shipping/customs/tax costs
  - Calculate total landed cost
- [ ] PO list with filters (pending, in-transit, received)
- [ ] PO detail view
- [ ] Payment recording UI

**Deliverable:** User can create PO, track containers, calculate landed costs

---

### WEEK 2: Product & Warehouse Setup

#### Day 8-10: Product Master & Warehouse (Priority 2)
**Backend:**
- [ ] Product schema (SKU, name, brand, category, cost, price, reorder level, bin)
- [ ] Warehouse schema with locations
- [ ] Inventory schema (product + warehouse + quantity + batch + bin)
- [ ] Product CRUD API
- [ ] Warehouse CRUD API
- [ ] Stock receiving endpoint (from PO)
- [ ] Stock adjustment API

**Frontend:**
- [ ] Product list page (table with search/filter)
- [ ] Add/Edit product form
- [ ] Warehouse management page
- [ ] Stock receiving workflow
  - Select pending PO
  - Verify items
  - Assign bin locations
  - Create inventory records
- [ ] Stock adjustment page
- [ ] Inventory view (by product/warehouse)

**Deliverable:** Products and warehouses configured, stock receiving functional

#### Day 11-14: Inventory Management
**Backend:**
- [ ] Real-time stock query API (by product/warehouse)
- [ ] Stock movement tracking table
- [ ] Low stock alert logic
- [ ] Batch/lot tracking (basic)
- [ ] Stock transfer API (between warehouses)

**Frontend:**
- [ ] Live inventory dashboard
- [ ] Stock by product report
- [ ] Stock by warehouse report
- [ ] Low stock alerts widget
- [ ] Stock transfer form

**Deliverable:** Real-time inventory visibility, stock movements tracked

---

### WEEK 3: Sales & Client Management

#### Day 15-17: Client Management (Priority 3)
**Backend:**
- [ ] Client schema (name, contact, area, credit limit, balance, payment terms)
- [ ] Client CRUD API
- [ ] Credit limit validation logic
- [ ] Balance calculation

**Frontend:**
- [ ] Client list page
- [ ] Add/Edit client form
- [ ] Client detail view
  - Basic info
  - Current balance
  - Credit limit status
  - Transaction history

**Deliverable:** Client database functional with credit tracking

#### Day 18-21: Sales Invoicing (Priority 3)
**Backend:**
- [ ] Invoice schema (client, items, totals, tax, status)
- [ ] Invoice items schema
- [ ] Create invoice API
  - Validate stock availability
  - Deduct inventory
  - Update client balance
  - Calculate tax
- [ ] Invoice list API (filters: date, client, status)
- [ ] Invoice detail API

**Frontend:**
- [ ] Sales invoice creation form
  - Select client (with balance info)
  - Add products (with stock check)
  - Auto-calculate subtotal, tax, total
  - Show credit limit warning
- [ ] Invoice list page (filters, search)
- [ ] Invoice detail/print view
- [ ] Quick stock availability checker

**Deliverable:** Sales team can create invoices, stock auto-deducts

---

### WEEK 4: Payments & Expenses

#### Day 22-24: Payment Management (Priority 4)
**Backend:**
- [ ] Payment schema (type, ref_id, amount, method, date)
- [ ] Record client payment API
  - Link to invoice(s)
  - Update client balance
  - Update invoice status (paid/partial)
- [ ] Record supplier payment API
  - Link to PO
  - Track payment method (cash/bank)
- [ ] Payment history API

**Frontend:**
- [ ] Client payment recording
  - Select client
  - Enter amount
  - Allocate to invoices
  - Record payment method
- [ ] Supplier payment recording
  - Select PO
  - Enter amount
  - Track remaining balance
- [ ] Payment history view (client/supplier)

**Deliverable:** Payments tracked, balances updated automatically

#### Day 25-28: Expense Tracking (Priority 4)
**Backend:**
- [ ] Expense schema (category, amount, date, description, paid_to)
- [ ] Expense CRUD API
- [ ] Expense categories (rent, utilities, salaries, transport, misc)
- [ ] Expense summary API (by category, period)

**Frontend:**
- [ ] Add expense form
- [ ] Expense list page (filters: date, category)
- [ ] Expense summary widget
- [ ] Monthly expense report

**Deliverable:** Operating expenses recorded and tracked

---

### WEEK 5-6: Dashboards & Reports

#### Day 29-33: Real-time Dashboards (Priority 5)
**Backend:**
- [ ] Dashboard metrics API
  - Total stock value
  - Today/month revenue
  - Receivables/payables
  - Low stock count
  - Top 5 products
  - Pending containers
- [ ] Sales dashboard API
  - Sales target vs actual
  - Top clients
  - Overdue clients
  - Daily sales trend
- [ ] Warehouse dashboard API
  - Stock levels by category
  - Recent movements
  - Low stock alerts

**Frontend:**
- [ ] **Admin Dashboard**
  - Metric cards (stock value, revenue, receivables, payables)
  - Revenue chart (last 30 days)
  - Top products table
  - Low stock alerts
  - Pending containers widget
- [ ] **Sales Dashboard**
  - Sales performance chart
  - Top clients
  - Overdue clients table
  - Quick invoice creation
- [ ] **Warehouse Dashboard**
  - Stock level charts
  - Recent movements list
  - Low stock alerts
  - Pending receipts

**Deliverable:** Real-time dashboards for all roles

#### Day 34-42: Essential Reports (Priority 6)
**Backend:**
- [ ] Stock report API (filters: product, category, warehouse)
- [ ] Sales report API (filters: date range, client, product)
- [ ] Payment collection report API
- [ ] Import/container report API (costs, profitability)
- [ ] Expense report API (by category, period)
- [ ] Excel export functionality for all reports

**Frontend:**
- [ ] Reports navigation
- [ ] Stock report page
  - Filters (product, category, warehouse)
  - Table view with totals
  - Export to Excel
- [ ] Sales report page
  - Date range picker
  - Client/product filters
  - Summary metrics
  - Export
- [ ] Payment collection report
  - Outstanding balances
  - Payments received
  - Aging summary
- [ ] Container/import report
  - PO list with costs
  - Landed cost breakdown
  - Profitability analysis
- [ ] Expense report
  - By category
  - Monthly trends
  - Total summary

**Deliverable:** All essential reports functional with Excel export

---

## 📊 TECHNICAL IMPLEMENTATION DETAILS

### Project Structure
```
hisham-erp/
├── apps/
│   ├── web/                    # React frontend (Vite)
│   │   ├── src/
│   │   │   ├── components/     # Reusable UI components
│   │   │   ├── pages/          # Route pages
│   │   │   ├── services/       # API calls
│   │   │   ├── hooks/          # Custom React hooks
│   │   │   ├── store/          # Zustand state management
│   │   │   ├── types/          # TypeScript types
│   │   │   └── utils/          # Helper functions
│   │   └── package.json
│   │
│   └── api/                    # Express backend
│       ├── src/
│       │   ├── routes/         # API routes
│       │   ├── controllers/    # Business logic
│       │   ├── middleware/     # Auth, validation
│       │   ├── services/       # Database operations
│       │   ├── utils/          # Helpers
│       │   └── types/          # TypeScript types
│       └── package.json
│
├── packages/
│   └── shared/                 # Shared TypeScript types
│       ├── src/
│       │   ├── types/
│       │   └── index.ts
│       └── package.json
│
├── prisma/
│   ├── schema.prisma          # Database schema
│   ├── migrations/            # Migration files
│   └── seed.ts                # Seed data
│
├── docker-compose.yml         # PostgreSQL for local dev
├── package.json               # Root workspace config
└── pnpm-workspace.yaml        # Workspace definition
```

### Core Dependencies

**Frontend (React):**
```json
{
  "react": "^18.2.0",
  "react-dom": "^18.2.0",
  "react-router-dom": "^6.20.0",
  "typescript": "^5.3.0",
  "@tanstack/react-query": "^5.12.0",
  "axios": "^1.6.0",
  "zustand": "^4.4.0",
  "react-hook-form": "^7.48.0",
  "zod": "^3.22.0",
  "tailwindcss": "^3.3.0",
  "recharts": "^2.10.0",
  "lucide-react": "^0.292.0",
  "date-fns": "^2.30.0"
}
```

**Backend (Node.js):**
```json
{
  "express": "^4.18.0",
  "typescript": "^5.3.0",
  "@prisma/client": "^5.7.0",
  "prisma": "^5.7.0",
  "jsonwebtoken": "^9.0.0",
  "bcrypt": "^5.1.0",
  "express-validator": "^7.0.0",
  "cors": "^2.8.5",
  "dotenv": "^16.3.0",
  "winston": "^3.11.0"
}
```

### Environment Variables
```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/hisham_erp"

# JWT
JWT_SECRET="your-super-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"

# API
API_PORT=3001
NODE_ENV="development"

# Frontend
VITE_API_URL="http://localhost:3001/api"
```

---

## 🗄️ DATABASE SCHEMA (Prisma)

### Core Models

```prisma
// User & Auth
model User {
  id          String   @id @default(cuid())
  email       String   @unique
  password    String
  name        String
  role        UserRole
  warehouseId String?
  warehouse   Warehouse? @relation(fields: [warehouseId], references: [id])
  active      Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum UserRole {
  ADMIN
  WAREHOUSE_MANAGER
  SALES_OFFICER
  ACCOUNTANT
  RECOVERY_AGENT
}

// Products & Inventory
model Product {
  id            String   @id @default(cuid())
  sku           String   @unique
  name          String
  brand         String?
  category      String
  costPrice     Decimal
  sellingPrice  Decimal
  reorderLevel  Int      @default(10)
  binLocation   String?
  active        Boolean  @default(true)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  inventory     Inventory[]
  poItems       POItem[]
  invoiceItems  InvoiceItem[]
}

model Warehouse {
  id        String   @id @default(cuid())
  name      String
  location  String
  city      String
  active    Boolean  @default(true)
  createdAt DateTime @default(now())

  inventory Inventory[]
  users     User[]
}

model Inventory {
  id          String    @id @default(cuid())
  productId   String
  warehouseId String
  quantity    Int
  batchNo     String?
  expiryDate  DateTime?
  binLocation String?

  product     Product   @relation(fields: [productId], references: [id])
  warehouse   Warehouse @relation(fields: [warehouseId], references: [id])

  @@unique([productId, warehouseId, batchNo])
}

// Suppliers & Import
model Supplier {
  id           String   @id @default(cuid())
  name         String
  country      String
  contactPerson String?
  email        String?
  phone        String?
  paymentTerms Int      @default(30)
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())

  purchaseOrders PurchaseOrder[]
}

model PurchaseOrder {
  id          String   @id @default(cuid())
  supplierId  String
  poNumber    String   @unique
  containerNo String?
  shipDate    DateTime?
  arrivalDate DateTime?
  status      POStatus @default(PENDING)
  totalCost   Decimal
  notes       String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  supplier    Supplier @relation(fields: [supplierId], references: [id])
  items       POItem[]
  costs       POCost[]
  payments    Payment[]
}

enum POStatus {
  PENDING
  IN_TRANSIT
  RECEIVED
  CANCELLED
}

model POItem {
  id        String  @id @default(cuid())
  poId      String
  productId String
  quantity  Int
  unitCost  Decimal

  po        PurchaseOrder @relation(fields: [poId], references: [id], onDelete: Cascade)
  product   Product       @relation(fields: [productId], references: [id])
}

model POCost {
  id          String  @id @default(cuid())
  poId        String
  type        String  // shipping, customs, tax, other
  amount      Decimal
  description String?

  po          PurchaseOrder @relation(fields: [poId], references: [id], onDelete: Cascade)
}

// Clients & Sales
model Client {
  id           String   @id @default(cuid())
  name         String
  contactPerson String?
  phone        String
  area         String?
  city         String
  creditLimit  Decimal  @default(0)
  paymentTerms Int      @default(7)
  balance      Decimal  @default(0)
  active       Boolean  @default(true)
  createdAt    DateTime @default(now())

  invoices     Invoice[]
  payments     Payment[]
}

model Invoice {
  id            String        @id @default(cuid())
  clientId      String
  invoiceNumber String        @unique
  date          DateTime      @default(now())
  dueDate       DateTime
  subtotal      Decimal
  taxAmount     Decimal       @default(0)
  total         Decimal
  paidAmount    Decimal       @default(0)
  status        InvoiceStatus @default(PENDING)
  notes         String?
  createdAt     DateTime      @default(now())

  client        Client        @relation(fields: [clientId], references: [id])
  items         InvoiceItem[]
  payments      Payment[]
}

enum InvoiceStatus {
  PENDING
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
}

model InvoiceItem {
  id         String  @id @default(cuid())
  invoiceId  String
  productId  String
  batchNo    String?
  quantity   Int
  unitPrice  Decimal
  total      Decimal

  invoice    Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  product    Product @relation(fields: [productId], references: [id])
}

// Payments & Expenses
model Payment {
  id            String      @id @default(cuid())
  type          PaymentType
  referenceType String      // PO or Invoice or Client
  referenceId   String
  amount        Decimal
  method        String      // cash, bank_transfer, cheque
  date          DateTime    @default(now())
  notes         String?

  purchaseOrder PurchaseOrder? @relation(fields: [referenceId], references: [id])
  invoice       Invoice?       @relation(fields: [referenceId], references: [id])
  client        Client?        @relation(fields: [referenceId], references: [id])
}

enum PaymentType {
  SUPPLIER_PAYMENT
  CLIENT_PAYMENT
}

model Expense {
  id          String   @id @default(cuid())
  category    String
  amount      Decimal
  date        DateTime @default(now())
  description String
  paidTo      String?
  notes       String?
  createdAt   DateTime @default(now())
}

// Stock Movements Audit
model StockMovement {
  id            String   @id @default(cuid())
  productId     String
  type          String   // receipt, sale, adjustment, transfer
  quantity      Int
  fromWarehouse String?
  toWarehouse   String?
  referenceId   String?  // PO ID or Invoice ID
  notes         String?
  createdAt     DateTime @default(now())
  createdBy     String
}
```

---

## 🎯 API ENDPOINTS (RESTful)

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Suppliers
- `GET /api/suppliers` - List all suppliers
- `GET /api/suppliers/:id` - Get supplier details
- `POST /api/suppliers` - Create supplier
- `PUT /api/suppliers/:id` - Update supplier
- `DELETE /api/suppliers/:id` - Soft delete supplier

### Purchase Orders
- `GET /api/purchase-orders` - List POs (with filters)
- `GET /api/purchase-orders/:id` - Get PO details
- `POST /api/purchase-orders` - Create PO
- `PUT /api/purchase-orders/:id` - Update PO
- `PATCH /api/purchase-orders/:id/status` - Update PO status
- `POST /api/purchase-orders/:id/receive` - Receive PO (create inventory)
- `GET /api/purchase-orders/:id/landed-cost` - Calculate landed cost

### Products
- `GET /api/products` - List products (with search/filters)
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Soft delete product

### Warehouses
- `GET /api/warehouses` - List warehouses
- `POST /api/warehouses` - Create warehouse
- `PUT /api/warehouses/:id` - Update warehouse

### Inventory
- `GET /api/inventory` - Get all inventory (with filters)
- `GET /api/inventory/product/:productId` - Get stock by product
- `GET /api/inventory/warehouse/:warehouseId` - Get stock by warehouse
- `POST /api/inventory/adjustment` - Adjust stock (wastage, correction)
- `POST /api/inventory/transfer` - Transfer between warehouses
- `GET /api/inventory/low-stock` - Get low stock alerts

### Clients
- `GET /api/clients` - List clients
- `GET /api/clients/:id` - Get client details
- `POST /api/clients` - Create client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Soft delete client

### Invoices
- `GET /api/invoices` - List invoices (with filters)
- `GET /api/invoices/:id` - Get invoice details
- `POST /api/invoices` - Create invoice
- `PUT /api/invoices/:id` - Update invoice
- `DELETE /api/invoices/:id` - Void invoice

### Payments
- `GET /api/payments` - List payments
- `POST /api/payments/client` - Record client payment
- `POST /api/payments/supplier` - Record supplier payment
- `GET /api/payments/client/:clientId` - Client payment history
- `GET /api/payments/supplier/:supplierId` - Supplier payment history

### Expenses
- `GET /api/expenses` - List expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense
- `GET /api/expenses/summary` - Expense summary by category

### Reports
- `GET /api/reports/stock` - Stock report
- `GET /api/reports/sales` - Sales report
- `GET /api/reports/payments` - Payment collection report
- `GET /api/reports/imports` - Container/import report
- `GET /api/reports/expenses` - Expense report

### Dashboards
- `GET /api/dashboard/admin` - Admin dashboard metrics
- `GET /api/dashboard/sales` - Sales dashboard metrics
- `GET /api/dashboard/warehouse` - Warehouse dashboard metrics

---

## ✅ MVP SUCCESS CRITERIA

### Functional Requirements ✓
- [x] User can log in with role-based access
- [x] User can create suppliers and purchase orders
- [x] User can track containers and calculate landed costs
- [x] User can add products with warehouse locations
- [x] User can receive stock from POs
- [x] User can create clients with credit limits
- [x] User can create sales invoices (auto stock deduction)
- [x] User can record payments (client & supplier)
- [x] User can track expenses by category
- [x] User can view real-time dashboards
- [x] User can generate and export reports

### Performance Requirements ✓
- Page load time < 2 seconds
- API response time < 500ms (95th percentile)
- Support 20 concurrent users
- Database queries optimized with indexes

### Data Integrity ✓
- No calculation errors in pricing/inventory
- Stock never goes negative
- Credit limits enforced
- All transactions logged (audit trail)

### User Experience ✓
- Responsive design (desktop/tablet)
- Intuitive navigation
- Clear error messages
- Fast data entry (keyboard shortcuts)

---

## 🚀 DEPLOYMENT CHECKLIST

### Pre-Deployment
- [ ] All features tested on staging
- [ ] Performance testing completed
- [ ] Security audit (SQL injection, XSS, CSRF)
- [ ] Backup strategy in place
- [ ] Environment variables configured
- [ ] SSL certificate installed
- [ ] Domain configured (if applicable)

### Deployment Steps
1. [ ] Set up DigitalOcean droplet (Ubuntu 22.04)
2. [ ] Install Node.js 20 LTS
3. [ ] Install PostgreSQL 15
4. [ ] Install Nginx
5. [ ] Clone repository
6. [ ] Install dependencies
7. [ ] Run Prisma migrations
8. [ ] Build frontend
9. [ ] Configure Nginx reverse proxy
10. [ ] Start PM2 process
11. [ ] Configure automatic backups
12. [ ] Set up monitoring (Uptime Robot)

### Post-Deployment
- [ ] Smoke test all critical paths
- [ ] Monitor error logs for 24 hours
- [ ] User acceptance testing with client
- [ ] Create user documentation
- [ ] Conduct training session
- [ ] Gather initial feedback

---

## 📚 RESOURCES

### Documentation
- [Prisma Docs](https://www.prisma.io/docs)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Query](https://tanstack.com/query/latest/docs/framework/react/overview)
- [Tailwind CSS](https://tailwindcss.com/docs)

### Tutorials
- [Building a REST API with Node.js and Prisma](https://www.prisma.io/blog/nestjs-prisma-rest-api-7D056s1BmOL0)
- [React + TypeScript Best Practices](https://react-typescript-cheatsheet.netlify.app/)
- [JWT Authentication in Node.js](https://www.digitalocean.com/community/tutorials/nodejs-jwt-expressjs)

### Tools
- [Prisma Studio](https://www.prisma.io/studio) - Database GUI
- [Postman](https://www.postman.com/) - API testing
- [React DevTools](https://react.dev/learn/react-developer-tools) - Debug React

---

## 🎯 NEXT IMMEDIATE ACTION

**RIGHT NOW - Start Development:**
1. Create project folder: `mkdir hisham-erp && cd hisham-erp`
2. Initialize monorepo: `pnpm init`
3. Create workspace structure
4. Initialize Git: `git init`
5. Create Prisma schema
6. Start building! 🚀

**Let's get this MVP shipped in 6 weeks!**
