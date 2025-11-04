# Hisham Traders Import-Distribution Management Platform - Product Requirements Document (PRD)

**Status:** ✅ MVP Planning Complete | 🔄 Phase 2 Planned
**Last Updated:** 2025-01-15

---

## 📋 Quick Navigation

### MVP (6-Week Delivery)
- **[Epic 1: Foundation, Authentication & Audit](./prd/epic-1-foundation-auth-audit.md)** - Week 1 (Audit logging from Day 1 ⭐)
- **[Epic 2: Import & Container Tracking + Inventory](./prd/epic-2-import-inventory.md)** - Weeks 1-2
- **[Epic 3: Sales & Client Management + Payments](./prd/epic-3-sales-payments.md)** - Weeks 3-4
- **[Epic 4: Dashboards & Reports](./prd/epic-4-dashboards-reports.md)** - Weeks 5-6

### Phase 2 (Post-MVP Expansion)
- **[Epic 5: Account Heads & General Ledger](./prd/epic-5-account-heads-gl.md)** - Full double-entry bookkeeping, FBR compliance
- **[Epic 6: Advanced Inventory Operations](./prd/epic-6-advanced-inventory.md)** - Gate passes ⭐, transfers, batch/expiry tracking
- **[Epic 7: Recovery & Collection Management](./prd/epic-7-recovery-management.md)** - Weekly schedules, aging analysis, agent performance
- **[Epic 8: Audit Trail Viewer & Advanced Features](./prd/epic-8-audit-advanced.md)** - Audit UI, barcode scanning, mobile optimization

### Supporting Documentation
- **[MVP Roadmap](./planning/mvp-roadmap.md)** - 6-week implementation plan
- **[Phase 2 Roadmap](./planning/phase-2-roadmap.md)** - 12-16 week advanced features plan
- **[Architecture Overview](./architecture/architecture.md)** - System architecture and tech stack
- **[Audit Logging Architecture](./architecture/audit-logging.md)** - Automatic audit trail from Day 1

---

## Goals and Background Context

### Goals

- Build a **reusable import-distribution management platform** that can serve multiple import/wholesale businesses
- Deliver a **Base/MVP tier** with core functionality at an accessible price point
- Design modular architecture to support tiered feature sets (Base → Standard → Premium)
- Establish foundation for multi-tenant SaaS evolution
- For Base MVP tier, enable:
  - Centralized inventory and sales tracking
  - Basic purchase order and supplier management
  - Simple client/credit management with payment tracking
  - Essential reporting (inventory, sales, basic financials)
  - Multi-warehouse operations with bin location tracking
  - Web-responsive interface (desktop/tablet/mobile)
- Ensure clean separation between core features (Base) and advanced features (future tiers)
- Achieve product-market fit with first client (Hisham Traders) while maintaining reusability
- Increase operational efficiency by 40% through automation
- Improve inventory turnover by 25% and reduce stockout incidents by 60%
- Accelerate cash recovery cycle by 30% (reduce DSO from 45 to 32 days)

### Background Context

Import-distribution businesses in Pakistan and similar emerging markets face common operational challenges: manual inventory tracking, fragmented procurement records, ad-hoc credit/recovery management, and time-consuming manual reporting. Most businesses cannot afford expensive ERP systems ($50K+) and generic accounting software lacks industry-specific features like import documentation, batch tracking, and local trade credit practices.

This PRD defines a **modular import-distribution management platform** with a clear Base/MVP tier designed for budget-conscious small-to-medium importers/wholesalers. The Base tier provides essential digitalization (inventory, purchases, sales, basic recovery, reporting) at an accessible price point, with architecture designed to support premium features (barcode scanning, mobile apps, advanced analytics, WhatsApp integration, FBR compliance) as paid upgrades. The initial implementation will serve Hisham Traders (sanitary products importer) with the Base tier, validating product-market fit while building a foundation for horizontal expansion to other import/distribution verticals (building materials, electronics, FMCG, etc.). The modular architecture ensures clean feature separation, allowing future clients to start with Base and upgrade as their needs/budget grow.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-10-30 | 1.0 | Initial PRD - Base/MVP tier for product platform | PM - John |

---

## Requirements

### Functional Requirements (Base MVP)

**FR1:** System shall support user authentication with role-based access control (Admin, Warehouse Manager, Sales Officer, Accountant, Recovery Agent)

**FR2:** System shall maintain product master data including SKU, name, category, brand, specifications, cost price, selling price, reorder level, bin/storage location, and status (active/inactive)

**FR3:** System shall allow creating and tracking purchase orders with supplier details, items, quantities, costs, import documentation (container number, shipment date, arrival date, customs charges, taxes, shipping costs), and payment tracking

**FR4:** System shall automatically update inventory quantities when purchase orders are marked as received, assigning batch/lot numbers for traceability

**FR5:** System shall track real-time inventory with current stock quantity, value, batch/lot information, bin/storage location, and status indicators (in-stock, low-stock, out-of-stock)

**FR6:** System shall support multi-warehouse inventory management with ability to track stock across multiple warehouse locations

**FR7:** System shall support warehouse bin/storage location management:
- Define and maintain bin/location codes within each warehouse
- Assign products to specific bin locations
- Track quantity by bin location for accurate picking
- Support bin-to-bin transfers within same warehouse

**FR8:** System shall support stock transfer functionality between warehouses with complete audit trail

**FR9:** System shall track batch/lot details for each product including lot number, receipt date, expiry date (if applicable), and quantity

**FR10:** System shall generate automated alerts for products within 60 days of expiry date

**FR11:** System shall support stock adjustment functionality for:
- Wastage/damage (stock write-off)
- Theft/loss (inventory shrinkage)
- Physical count corrections
- Each adjustment requiring reason code, approval, and audit trail

**FR12:** System shall maintain client database with business details, contact information, credit limit, payment terms (due days), and current balance

**FR13:** System shall enforce payment terms by:
- Warning when client exceeds credit limit during sales invoice creation
- Tracking payment due dates based on invoice date + payment terms
- Flagging invoices past due date

**FR14:** System shall calculate and apply taxes on sales transactions:
- Sales tax percentage (configurable)
- Support for tax-exempt clients
- Track tax collected for reporting

**FR15:** System shall calculate withholding tax on applicable transactions based on configurable rules

**FR16:** System shall allow creating sales invoices with automatic inventory deduction and client balance updates

**FR17:** System shall support both cash and credit sales transactions

**FR18:** System shall support sales returns and credit notes:
- Create credit note linked to original invoice
- Return stock to inventory (with batch/lot tracking)
- Adjust client balance
- Track return reason and approval

**FR19:** System shall implement configurable gate pass system for warehouse inventory control:
- Warehouse-level configuration: automatic generation or manual approval required
- Generate gate pass for approved outbound stock movements
- Link gate pass to sales invoice, stock transfer, or return
- Display gate pass status: Pending, Approved, In-Transit, Completed, Cancelled
- Show item-wise details on gate pass (SKU, description, quantity, batch/lot, destination)
- Require gate pass validation before allowing stock to leave warehouse
- Track gate pass number, date, authorized by, items, quantities, source bin location, and destination

**FR20:** System shall track all inventory movements with complete audit trail:
- Stock IN: Purchase receipts, stock transfers received, sales returns
- Stock OUT: Sales shipments, stock transfers sent, wastage/damage adjustments
- Each movement logged with date, time, user, reference document, bin location, and quantities

**FR21:** System shall track client outstanding balances with aging analysis (current, 1-7 days, 8-14 days, 15-30 days, 30+ days overdue)

**FR22:** System shall support weekly recovery schedule tracking (assign clients to specific days of week for payment collection)

**FR23:** System shall allow recording payments received with method (cash, bank transfer, cheque), amount, date, and reference number

**FR24:** System shall record supplier payments linked to purchase orders including import costs (product cost + customs + taxes + shipping)

**FR25:** System shall track operating expenses by category (rent, utilities, salaries, transport, etc.)

**FR26:** System shall generate inventory report showing current stock by product/category/warehouse/bin location with quantities, values, and batch information

**FR27:** System shall generate inventory movement report showing all stock IN/OUT transactions by date range, warehouse, or product

**FR28:** System shall generate sales report filterable by date range, client, or product

**FR29:** System shall generate sales return/credit note report

**FR30:** System shall generate recovery report showing outstanding receivables by client with aging

**FR31:** System shall generate expense report by category and time period

**FR32:** System shall generate gate pass report showing all issued passes with status and item-wise details

**FR33:** System shall generate tax report showing sales tax collected and withholding tax by period

**FR34:** System shall generate import cost analysis report showing landed cost breakdown (product + customs + taxes + shipping) per purchase order

**FR35:** System shall export all reports to Excel format

**FR36:** System shall display dashboard with key metrics: total stock value by warehouse, low/out-of-stock alerts, near-expiry alerts, total receivables, total payables, current month revenue, pending gate passes

**FR37:** System shall generate automated alerts for products reaching reorder level

**FR38:** System shall generate automated alerts for products out of stock

**FR39:** System shall generate automated alerts for clients exceeding credit limit

**FR40:** System shall generate automated alerts for overdue receivables

**FR41:** System shall generate automated alerts for pending gate pass approvals (if manual approval configured)

**FR42:** System shall maintain complete audit trail for all financial transactions (who created/modified, when)

**FR43:** System shall maintain detailed audit trail for all user activities including:
- Login/logout events with timestamp and IP address
- All create, update, delete operations on master data (products, clients, suppliers, warehouses, users)
- All transaction operations (purchase orders, sales invoices, payments, stock movements, gate passes)
- Configuration changes (tax rates, credit limits, bin locations, user permissions)

**FR44:** System shall track edit history for critical records maintaining up to 2 previous versions:
- Store previous state before each update (old values vs new values)
- Track who made the change and when
- Display change history on record detail screens
- Support rollback to previous version if needed

**FR45:** System shall log the following information for each audited action:
- User ID and name
- Action type (Create, Update, Delete, View for sensitive data)
- Entity type and entity ID
- Timestamp (date and time)
- IP address
- Changed fields (before and after values)
- Reason/notes (if provided)

**FR46:** System shall provide audit trail search and filtering capabilities:
- Filter by user, date range, entity type, or action type
- Search by entity ID or reference number
- Export audit logs to Excel

**FR47:** System shall display "Last Modified" information on all records showing:
- Modified by (user name)
- Modified on (date and time)
- Link to view full change history

**FR48:** System shall restrict audit log deletion - logs are append-only and cannot be modified or deleted by any user

**FR49:** System shall automatically purge audit logs older than 2 years (configurable retention period)

### Functional Requirements (Future/Premium Tier)

**FR-P1:** Barcode/QR code scanning for stock transactions *(Future)*

**FR-P2:** Mobile application for field sales and recovery agents *(Future)*

**FR-P3:** WhatsApp/SMS integration for automated recovery reminders *(Future)*

**FR-P4:** Advanced analytics and demand forecasting *(Future)*

**FR-P5:** Bank statement import and reconciliation *(Future)*

**FR-P6:** FBR e-invoice integration for Pakistan tax compliance *(Future)*

**FR-P7:** Multi-currency support with exchange rate management *(Future)*

**FR-P8:** Supplier portal for shipment tracking *(Future)*

**FR-P9:** Customer portal for order placement *(Future)*

**FR-P10:** Serial number tracking for individual units *(Future)*

**FR-P11:** Quality control and inspection workflows *(Future)*

**FR-P12:** Delivery management and logistics tracking *(Future)*

**FR-P13:** Automated reorder suggestions based on consumption patterns *(Future)*

**FR-P14:** Purchase order approval workflows *(Future)*

**FR-P15:** Sales order management (separate from invoicing) *(Future)*

### Non-Functional Requirements (Base MVP)

**NFR1:** System shall respond to user interactions within 2 seconds for standard operations (search, form submission, report generation up to 1000 records)

**NFR2:** System shall support up to 20 concurrent users without performance degradation

**NFR3:** System shall be accessible via modern web browsers (Chrome 90+, Firefox 88+, Safari 14+, Edge 90+)

**NFR4:** System shall be responsive for desktop (1920x1080) and tablet (1024x768) screen sizes

**NFR5:** System shall encrypt all data in transit using TLS 1.3

**NFR6:** System shall hash passwords using bcrypt with salt

**NFR7:** System shall maintain 99% uptime during business hours (9 AM - 6 PM local time)

**NFR8:** System shall perform automated daily database backups with 30-day retention

**NFR9:** System shall support up to 10,000 SKUs, 1,000 active clients, 10 warehouse locations, and 500 bin locations per warehouse

**NFR10:** System shall be deployable on-premise on customer infrastructure

**NFR11:** System shall use MySQL 8+ as the database engine

**NFR12:** System shall be built with Node.js + TypeScript backend and React + TypeScript frontend

**NFR13:** System shall use Prisma ORM for database access

**NFR14:** System shall use Tailwind CSS for UI styling and Lucide React for icons

**NFR15:** System shall maintain separation of concerns to support multi-tenant architecture in future

**NFR16:** System shall implement role-based authorization at API level

**NFR17:** System shall log all errors and critical operations for debugging

**NFR18:** System shall validate all user inputs on both client and server side

**NFR19:** System shall provide recovery point objective (RPO) of 24 hours for data recovery

**NFR20:** System shall be maintainable by developers with React/Node.js/TypeScript experience

**NFR21:** System shall store audit logs in separate database schema/tables to prevent performance impact on transactional operations

**NFR22:** System shall index audit logs by timestamp, user ID, and entity type for fast retrieval

**NFR23:** Audit log writes shall not block or slow down primary business transactions (asynchronous logging acceptable)

**NFR24:** System shall provide fully responsive design optimized for mobile (375px+), tablet (768px+), and desktop (1024px+) screen sizes using Tailwind CSS responsive utilities

### Non-Functional Requirements (Future/Premium Tier)

**NFR-P1:** System shall support multi-tenant SaaS deployment model *(Future)*

**NFR-P2:** System shall support 99.9% uptime with load balancing *(Future)*

**NFR-P3:** System shall support mobile offline mode with data synchronization *(Future)*

**NFR-P4:** System shall support two-factor authentication (2FA) *(Future)*

**NFR-P5:** System shall comply with WCAG AA accessibility standards *(Future)*

---

## User Interface Design Goals

### Overall UX Vision

The interface prioritizes **operational efficiency** and **data clarity** for non-technical business users who need to complete tasks quickly and accurately. The design follows a **clean, professional dashboard paradigm** with role-based views ensuring users see only relevant information. Emphasis on **data visibility at a glance** (inventory status, outstanding payments, alerts) with drill-down capability for details. Navigation is **task-oriented** rather than feature-oriented (e.g., "Process Purchase Receipt" vs navigating through menus). Forms are streamlined with **smart defaults** and **inline validation** to reduce errors. The system is **fully responsive** supporting desktop, tablet, and mobile phone usage for maximum flexibility.

### Key Interaction Paradigms

- **Dashboard-First Navigation**: Users land on role-specific dashboards showing actionable items (pending approvals, low stock, overdue payments)
- **Quick Actions**: Frequently used operations (Create Invoice, Record Payment, Issue Gate Pass) accessible via top-level buttons/shortcuts
- **Search-Everywhere**: Global search bar for rapid lookup of products (by SKU/name), clients, invoices, or POs
- **Inline Editing with Confirmation**: Critical data (prices, credit limits) editable inline but requires explicit save/confirmation
- **Status-Driven Workflows**: Visual status indicators (badges, colors) guide users through multi-step processes (PO → Receipt → Payment)
- **Contextual Actions**: Right-click or action menus showing available operations based on record state (e.g., "Approve Gate Pass" only appears if status is Pending)
- **Modal Forms for Transactions**: Invoices, POs, payments use modal overlays to maintain context while completing multi-field entries
- **Data Tables with Filters**: All list views (products, clients, transactions) use sortable, filterable tables with Excel export
- **Mobile-Optimized Workflows**: Priority workflows accessible on mobile (stock lookup, payment recording, invoice creation) with touch-friendly interfaces

### Core Screens and Views

1. **Login Screen** - Simple email/password with role selection if applicable
2. **Dashboard (Role-Specific)**
   - Admin: Business overview, alerts, recent activity
   - Warehouse: Stock status, pending receipts, gate passes
   - Sales: Client balances, overdue invoices, recovery schedule
   - Accountant: Cash flow, payables, receivables, tax summary
3. **Product Management** - List, add/edit products, view stock levels across warehouses
4. **Inventory View** - Real-time stock by warehouse/bin, batch/lot details, movement history
5. **Purchase Order Management** - Create PO, track shipments, record receipts, manage payments
6. **Sales Invoice Screen** - Create invoice with product lookup, client balance check, credit limit warning, tax calculation
7. **Gate Pass Management** - Issue, approve (if manual), track status, view item details
8. **Client Management** - Client list, credit/payment history, aging report, recovery schedule
9. **Payment Recording** - Record client payments or supplier payments with linking to invoices/POs
10. **Recovery Dashboard** - Weekly schedule view, overdue clients, payment tracking
11. **Reporting Center** - Select report type, apply filters, preview, export to Excel
12. **Warehouse/Bin Management** - Define warehouses, bin locations, view stock by location
13. **Stock Transfer** - Initiate transfer between warehouses, track status, update inventory
14. **Stock Adjustment** - Record wastage/damage/corrections with reason and approval
15. **User Management** - Add/edit users, assign roles, manage permissions
16. **Settings/Configuration** - Tax rates, payment terms defaults, alert preferences, gate pass configuration
17. **Audit Trail Viewer** - Search activity logs, view change history, filter by user/entity

### Accessibility

**None** - Base MVP does not target WCAG compliance. Standard browser accessibility features (keyboard navigation, screen reader support) not prioritized for v1.0. Focus is on functional completeness for sighted, mouse/keyboard users.

*(Can be added in Premium tier if needed for enterprise clients or regulatory compliance)*

### Branding

- **Clean, Professional Business Theme**: No consumer-facing design; optimized for productivity
- **Color Scheme**:
  - Primary: Professional blue/teal for actions and headers
  - Success: Green for completed, in-stock, paid status
  - Warning: Yellow/amber for low stock, approaching credit limit
  - Danger: Red for out-of-stock, overdue, credit limit exceeded
  - Neutral: Gray for inactive/disabled states
- **Typography**: Tailwind CSS default font stack (system fonts for performance)
- **Icons**: Lucide React icon library for consistent, modern iconography
- **Logo Placement**: Client logo in top-left header (customizable per deployment)
- **White-Label Ready**: Minimal branding to support multiple client deployments

### Target Device and Platforms

**Web Responsive (Cross-Platform)** - Fully responsive design supporting desktop, tablet, and mobile phone with optimized layouts for each screen size.

- **Desktop (1920x1080+)**: Full-featured interface with multi-column layouts, data tables, comprehensive dashboard widgets, side-by-side comparisons
- **Tablet Landscape (1024x768)**: Responsive layouts, touch-friendly buttons (min 44px), essential workflows accessible, simplified navigation
- **Mobile Phone (375px - 428px)**: Mobile-optimized interface with:
  - Single-column layouts
  - Collapsible navigation (hamburger menu)
  - Touch-optimized forms and buttons
  - Priority workflows: Dashboard view, stock lookup, client balance check, record payment, invoice creation (simplified)
  - Bottom navigation bar for quick access to key functions
  - Swipe gestures for common actions

**Responsive Breakpoints:**
- Mobile: 320px - 767px (portrait and landscape)
- Tablet: 768px - 1023px
- Desktop: 1024px+

**Mobile-Specific Optimizations:**
- Click-to-call for phone numbers
- Tap to expand accordion sections (for product details, invoice line items)
- Pull-to-refresh for lists (inventory, client list)
- Sticky headers for forms and tables
- Mobile keyboard optimizations (numeric input for quantities/prices)
- Reduced data density (show essential fields, hide secondary info in collapsed sections)

---

## Technical Assumptions

### Repository Structure: Monorepo

**Decision:** Single repository containing frontend, backend, and shared code.

**Structure:**
```
hishamtraders/
├── apps/
│   ├── web/          # React frontend
│   └── api/          # Node.js backend
├── packages/
│   ├── types/        # Shared TypeScript types
│   ├── ui/           # Shared UI components (future)
│   └── utils/        # Shared utilities
├── prisma/           # Database schema and migrations
└── docs/             # Project documentation
```

**Rationale:**
- Atomic commits across frontend/backend for feature development
- Shared TypeScript types between client and server
- Easier dependency management and versioning
- Simplified CI/CD pipeline
- Positions for multi-tenant evolution (separate apps in same repo)
- Tools: Turborepo or npm workspaces for monorepo management

### Service Architecture

**Monolithic Backend with Modular Structure**

**Architecture:**
- Single Node.js/Express API server
- Organized by domain modules (inventory, sales, purchases, payments, users)
- Each module contains routes, controllers, services, and validation
- Shared infrastructure (auth, logging, database connection)
- RESTful API design with versioning (/api/v1/...)

**Module Structure:**
```
api/src/
├── modules/
│   ├── auth/         # Authentication & authorization
│   ├── products/     # Product management
│   ├── inventory/    # Stock tracking, movements, warehouses
│   ├── purchases/    # Purchase orders, suppliers
│   ├── sales/        # Invoices, clients, returns
│   ├── payments/     # Payment recording, recovery
│   ├── gatepasses/   # Gate pass management
│   ├── reports/      # Report generation
│   └── audit/        # Audit trail
├── shared/
│   ├── middleware/   # Auth, validation, error handling
│   ├── utils/        # Helpers, formatters
│   └── config/       # Configuration management
└── server.ts         # Application entry point
```

**Rationale:**
- Monolith appropriate for MVP scope and team size
- Modular structure allows extraction to microservices later if needed
- Single deployment unit simplifies on-premise installation
- Clear separation of concerns for maintainability
- RESTful API allows future mobile app integration

### Testing Requirements

**Full Testing Pyramid: Unit + Integration + E2E**

**Testing Strategy:**
- **Unit Tests (70%)**: Test business logic, utilities, helpers
  - Framework: Jest for both frontend and backend
  - Coverage target: 80%+ for critical business logic (calculations, validations)

- **Integration Tests (20%)**: Test API endpoints with database
  - Framework: Jest + Supertest
  - Test database operations, authentication, authorization
  - Use test database with Docker for isolation

- **E2E Tests (10%)**: Test critical user workflows
  - Framework: Playwright or Cypress
  - Focus on: Login, create invoice, record payment, stock movement, gate pass approval
  - Run against staging environment before production deployment

**Manual Testing:**
- QA checklist for each release
- User acceptance testing (UAT) with client before go-live
- Exploratory testing for edge cases

**Rationale:**
- Comprehensive testing critical for financial/inventory data accuracy
- Unit tests catch logic errors early
- Integration tests ensure database operations work correctly
- E2E tests validate complete workflows work as users expect
- Test automation supports rapid iteration and refactoring

### Additional Technical Assumptions and Requests

**Frontend Technology Stack:**
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite (faster than Create React App)
- **Styling**: Tailwind CSS v3+ with custom configuration
- **Icons**: Lucide React
- **State Management**: React Context API + useReducer for global state (auth, user profile); local state for forms
- **Form Handling**: React Hook Form with Zod validation
- **Data Fetching**: TanStack Query (React Query) v5 for server state management with automatic caching, background refetching, and optimistic updates
- **HTTP Client**: Axios with TanStack Query integration
- **Routing**: React Router v6
- **Date Handling**: date-fns (lightweight alternative to moment.js)
- **Table/Grid**: TanStack Table (React Table v8) for complex data tables
- **Charts** (if needed for dashboard): Recharts or Chart.js
- **Toast Notifications**: react-hot-toast or sonner

**Backend Technology Stack:**
- **Runtime**: Node.js 18 LTS or 20 LTS
- **Framework**: Express.js with TypeScript
- **ORM**: Prisma 5+
- **Validation**: Zod (shared schemas with frontend)
- **Authentication**: JWT (jsonwebtoken) with bcrypt for password hashing
- **Logging**: Winston or Pino
- **Environment Config**: dotenv
- **API Documentation**: (Optional for MVP) Swagger/OpenAPI with tsoa or manual docs

**Database:**
- **RDBMS**: MySQL 8.0+
- **Schema Management**: Prisma Migrations
- **Seeding**: Prisma seed scripts for initial data (roles, admin user)
- **Indexing**: Strategic indexes on foreign keys, search fields (SKU, client name), date ranges
- **Backup Strategy**: Daily automated backups (client responsibility for on-premise; script provided)

**Caching:**
- **MVP**: TanStack Query handles client-side caching; no server-side Redis
- **Future**: Redis for session storage and API response caching (Premium tier)

**Development Tools:**
- **Version Control**: Git + GitHub/GitLab
- **Code Quality**: ESLint + Prettier
- **Pre-commit Hooks**: Husky + lint-staged
- **TypeScript**: Strict mode enabled
- **Package Manager**: npm or pnpm (pnpm preferred for monorepo)

**Deployment:**
- **On-Premise Deployment**: Docker Compose setup provided
  - Web container (Nginx serving React build)
  - API container (Node.js)
  - MySQL container
  - Redis container (if used in future)
- **Environment Variables**: .env files for configuration (not committed to repo)
- **Reverse Proxy**: Nginx for HTTPS termination and routing
- **SSL**: Let's Encrypt or client-provided certificates

**Security:**
- **HTTPS**: Enforced in production
- **CORS**: Configured to allow only frontend domain
- **Rate Limiting**: Express rate limiting middleware on API routes
- **SQL Injection Prevention**: Prisma ORM (parameterized queries)
- **XSS Prevention**: React escapes by default; CSP headers on API responses
- **CSRF Protection**: Not required for stateless JWT APIs; consider for session-based auth

**Multi-Tenant Readiness:**
- Database schema includes `tenantId` field on core tables (products, clients, users, etc.)
- Middleware to extract tenant context from subdomain or custom header (not enforced in MVP single-tenant)
- Row-level security through Prisma middleware filtering by tenantId (dormant in MVP)
- Admin portal for tenant management (Future tier)

**Performance:**
- **Caching**: TanStack Query client-side caching; server-side Redis deferred to future
- **Pagination**: All list endpoints return paginated results (default 50 items per page)
- **Lazy Loading**: Frontend lazy loads routes and heavy components
- **Database Connection Pooling**: Prisma manages connection pool
- **CDN**: (Future) Static assets served from CDN; not MVP

**Monitoring & Observability:**
- **Error Tracking**: (Future tier) Sentry or similar; MVP uses console/file logging
- **Application Monitoring**: (Future tier) PM2 for process management on-premise
- **Database Monitoring**: Client responsibility; provide queries for common diagnostics

---

## Epic List

**Epic 1: Foundation, Authentication & Audit Infrastructure**
Establish the complete technical foundation including project structure, development environment, authentication system, user management, audit logging infrastructure, and role-based dashboards. This epic delivers a fully functional application skeleton where users can log in, see role-specific dashboards, and all system activity is automatically tracked from day one.

**Epic 2: Product & Warehouse Management**
Implement comprehensive product catalog and warehouse management capabilities including multi-warehouse support, bin/storage location tracking, and real-time inventory visibility. This epic provides the foundation for all inventory operations by establishing the master data for products and locations.

**Epic 3: Purchase Order & Supplier Management**
Build the complete purchase order and supplier management workflow including PO creation, import documentation tracking (container numbers, customs, taxes), goods receipt processing, and landed cost calculation. This epic enables digitization of the procurement process from Chinese suppliers to warehouse receipt.

**Epic 4: Inventory Operations & Movements**
Implement all inventory movement workflows including stock adjustments (wastage, damage, theft), stock transfers between warehouses, and the gate pass system for controlled outbound movements. This epic provides complete inventory lifecycle management with full audit trail and traceability.

**Epic 5: Sales & Client Management**
Create the complete sales workflow including client management with credit limits and payment terms, sales invoice generation with automatic inventory deduction, credit limit enforcement, sales returns/credit notes, and tax calculation. This epic enables revenue-generating transactions with proper credit control.

**Epic 6: Payment & Recovery Management**
Build the complete payment and recovery workflow including payment recording for both clients and suppliers, weekly recovery schedule tracking, aging analysis for overdue accounts, and recovery agent dashboards. This epic streamlines cash collection and reduces DSO (Days Sales Outstanding).

**Epic 7: Financial Management & Expenses**
Implement supplier payment tracking, operating expense management, cash flow visibility, and basic financial reporting. This epic provides the financial operations and reporting needed to track cash outflows, reconcile supplier accounts, and understand business profitability.

**Epic 8: Reporting & Analytics Dashboard**
Build a comprehensive reporting engine that consolidates all business data into actionable reports including inventory reports, sales reports, recovery reports, financial reports, import cost analysis, gate pass reports, and the audit trail viewer. All reports support filtering, sorting, and Excel export.

---

## Epic 1: Foundation, Authentication & Audit Infrastructure

**Epic Goal:** Establish the complete technical foundation including project structure, development environment, authentication system, user management, audit logging infrastructure, and role-based dashboards. This epic delivers a fully functional application skeleton where users can log in, see role-specific dashboards, and all system activity is automatically tracked from day one.

### Story 1.1: Project Setup and Development Environment

As a **developer**,
I want **the project repository, monorepo structure, and development tools configured**,
so that **the team can begin feature development with proper tooling and conventions**.

**Acceptance Criteria:**
1. Monorepo created with apps/ (web, api) and packages/ (types, utils) structure
2. Node.js 18+ LTS, npm/pnpm configured with workspaces
3. TypeScript configured for both frontend and backend with strict mode
4. ESLint and Prettier configured with shared config
5. Husky and lint-staged set up for pre-commit hooks
6. Git repository initialized with .gitignore and README
7. Environment variable templates (.env.example) created for both apps
8. Development scripts added to package.json (dev, build, test, lint)
9. Vite configured for frontend with React, TypeScript, Tailwind CSS
10. Express.js with TypeScript configured for backend
11. All dependencies installed and project builds successfully
12. VS Code workspace settings recommended (optional extensions, formatting)

---

### Story 1.2: Database Setup with Prisma and MySQL

As a **developer**,
I want **Prisma ORM integrated with MySQL database and initial schema defined**,
so that **the application can persist data with type-safe database access**.

**Acceptance Criteria:**
1. Prisma installed and initialized in monorepo
2. MySQL 8+ database connection configured via environment variables
3. Initial Prisma schema defined with User, Role, AuditLog tables
4. Database schema includes tenantId field on core tables for multi-tenant readiness (not enforced in MVP)
5. Prisma migration created and applied to development database
6. Prisma Client generated and accessible in backend code
7. Database connection pooling configured appropriately
8. Seed script created for initial roles (Admin, Warehouse Manager, Sales Officer, Accountant, Recovery Agent)
9. Seed script creates default admin user (credentials documented)
10. npm run db:migrate, db:seed, db:reset scripts functional
11. Database indexes created on foreign keys and commonly queried fields
12. Connection tested and verified working

---

### Story 1.3: Authentication System with JWT

As a **user**,
I want **to log in with email and password to access the system securely**,
so that **only authorized personnel can use the application**.

**Acceptance Criteria:**
1. User table includes email, passwordHash, roleId, status (active/inactive), lastLoginAt
2. POST /api/v1/auth/login endpoint accepts email and password
3. Password hashed with bcrypt (min 10 rounds) before storage
4. Login validates credentials and returns JWT token with user info and role
5. JWT includes userId, email, roleId, tenantId (null for MVP), expires in 24 hours
6. Refresh token mechanism implemented (optional: can use long-lived JWT for MVP)
7. POST /api/v1/auth/logout endpoint clears session/token
8. GET /api/v1/auth/me endpoint returns current user profile (requires valid JWT)
9. Invalid credentials return 401 Unauthorized with appropriate error message
10. Account lockout after 5 failed login attempts (optional for MVP)
11. Login frontend page created with email/password form (responsive design)
12. Frontend stores JWT in localStorage/sessionStorage and includes in API requests
13. Frontend redirects to dashboard on successful login
14. Frontend displays login errors appropriately

---

### Story 1.4: Authorization Middleware and Role-Based Access Control

As a **system administrator**,
I want **API endpoints protected by role-based permissions**,
so that **users can only access features appropriate for their role**.

**Acceptance Criteria:**
1. Auth middleware extracts and validates JWT from Authorization header
2. Middleware attaches user context (userId, roleId, tenantId) to request object
3. Middleware returns 401 if token missing, invalid, or expired
4. Role-based permission middleware checks user role against required roles
5. Returns 403 Forbidden if user lacks required permissions
6. Permission decorators/helpers created for route protection (@RequireRole, requirePermission)
7. All API routes (except /auth/login) require valid JWT
8. Role hierarchy defined: Admin > Accountant > Sales Officer > Warehouse Manager > Recovery Agent
9. Admin role has access to all features
10. Specific permissions mapped to roles in documentation
11. Frontend redirects to login if API returns 401
12. Frontend displays "Access Denied" message if API returns 403

---

### Story 1.5: Audit Logging Middleware and Infrastructure

As a **system administrator**,
I want **all user actions automatically logged to an audit trail**,
so that **we have complete accountability and can trace any data changes**.

**Acceptance Criteria:**
1. AuditLog table created with fields: id, userId, action (CREATE/UPDATE/DELETE/VIEW), entityType, entityId, timestamp, ipAddress, userAgent, changedFields (JSON), oldValues (JSON), newValues (JSON), notes
2. Audit middleware intercepts all POST/PUT/PATCH/DELETE API requests
3. Middleware logs action AFTER successful database operation (not on failure)
4. Middleware captures: user, action type, affected entity, timestamp, IP address, changed fields with old/new values
5. Audit writes are asynchronous (don't block request response)
6. Sensitive fields (passwords, tokens) excluded from audit logs
7. Audit logs stored in separate table with indexes on userId, timestamp, entityType
8. Audit log retention policy: 2 years (configurable via environment variable)
9. Audit logs are append-only (no update/delete operations allowed)
10. Logging errors don't break main application flow (fail gracefully)
11. Performance impact < 50ms per request
12. Audit log test coverage includes verification for all CRUD operations

---

### Story 1.6: Change History Tracking for Critical Entities

As a **user**,
I want **to see the last 2 previous versions of critical records**,
so that **I can understand what changed and potentially rollback errors**.

**Acceptance Criteria:**
1. ChangeHistory table created with: id, entityType, entityId, version, changedBy, changedAt, snapshot (JSON), changeReason
2. Base service layer created with beforeUpdate/afterUpdate hooks
3. Hook captures current state before update and stores in ChangeHistory
4. Maintains maximum 2 previous versions per entity (deletes older versions)
5. Critical entities tracked: Product, Client, Supplier, PurchaseOrder, Invoice, Payment
6. Frontend displays "Last Modified" information on entity detail pages (user, date)
7. Frontend includes "View History" button/link on tracked entities
8. Change history modal displays side-by-side comparison (old vs new)
9. Admin users can rollback to previous version (creates new update with old values)
10. Change history entries include user-provided change reason (optional field)
11. Performance: history write doesn't significantly slow updates (< 100ms overhead)
12. History query endpoint: GET /api/v1/history/:entityType/:entityId

---

### Story 1.7: User Management Module

As an **admin**,
I want **to create, edit, and deactivate user accounts with role assignment**,
so that **I can control who has access to the system and what they can do**.

**Acceptance Criteria:**
1. GET /api/v1/users returns paginated list of users with role info
2. POST /api/v1/users creates new user with email, name, roleId, password
3. PUT /api/v1/users/:id updates user details (email, name, roleId, status)
4. DELETE /api/v1/users/:id soft-deletes user (sets status=inactive)
5. User table includes: id, email (unique), name, passwordHash, roleId, status, createdAt, lastLoginAt
6. Email validation ensures valid format and uniqueness
7. Default password sent to new user (or requires password reset on first login)
8. Admin cannot delete/deactivate their own account
9. Role changes logged in audit trail
10. Frontend User Management page lists users with filters (role, status)
11. Frontend includes Add/Edit User modals with form validation
12. Frontend displays user status (active/inactive) with visual indicator
13. Only Admin role can access user management features

---

### Story 1.8: Role-Specific Dashboards

As a **user**,
I want **to see a dashboard tailored to my role when I log in**,
so that **I immediately see the information and actions relevant to my job**.

**Acceptance Criteria:**
1. Dashboard route renders different content based on user role
2. **Admin Dashboard** displays:
   - Total users count
   - System health indicators (database connection, audit log size)
   - Recent audit activity (last 10 actions)
   - Quick links to all modules
3. **Warehouse Manager Dashboard** displays:
   - Pending stock receipts count
   - Low stock alerts count
   - Out of stock products count
   - Pending gate passes count
   - Quick actions: Record Stock Receipt, Issue Gate Pass
4. **Sales Officer Dashboard** displays:
   - Today's sales summary (count, total value)
   - Clients approaching credit limit
   - Recent invoices (last 5)
   - Quick actions: Create Invoice, Check Client Balance
5. **Accountant Dashboard** displays:
   - Cash flow summary (inflows, outflows, net)
   - Receivables vs Payables
   - Pending payments to suppliers
   - Recent transactions
   - Quick actions: Record Payment, Record Expense
6. **Recovery Agent Dashboard** displays:
   - Today's recovery schedule (clients to visit)
   - Total outstanding receivables
   - Overdue clients list
   - Payments collected this week
   - Quick actions: Record Client Payment
7. All dashboards are responsive (mobile, tablet, desktop)
8. Dashboard data refreshes on page load (no auto-refresh in MVP)
9. Dashboard uses TanStack Query for data fetching with loading states
10. Navigation menu adapts to user role (shows only accessible modules)

---

### Story 1.9: Shared UI Component Library

As a **developer**,
I want **reusable UI components built with Tailwind CSS and Lucide icons**,
so that **the interface is consistent and development is faster**.

**Acceptance Criteria:**
1. Component library created in packages/ui (or apps/web/components/ui)
2. Components implemented: Button, Input, Select, Checkbox, Modal, Table, Card, Badge, Alert, Spinner
3. All components use Tailwind CSS for styling
4. Lucide React icons integrated and used consistently
5. Components support responsive design (mobile, tablet, desktop)
6. Form components integrate with React Hook Form
7. Table component supports sorting, pagination, and filtering
8. Modal component supports customizable header, body, footer
9. Badge component displays status with color coding (success=green, warning=yellow, danger=red)
10. Alert component displays success/error/info messages
11. Storybook or component playground set up for component documentation (optional for MVP)
12. TypeScript types defined for all component props

---

### Story 1.10: Error Handling and Logging

As a **developer**,
I want **consistent error handling and logging across the application**,
so that **bugs can be diagnosed quickly and users see helpful error messages**.

**Acceptance Criteria:**
1. Global error handler middleware catches all unhandled errors in Express
2. Errors formatted consistently: { status, message, code, details }
3. 4xx errors (client errors) return user-friendly messages
4. 5xx errors (server errors) return generic message + log full error
5. Winston or Pino logger configured for backend
6. Logs include timestamp, level (error/warn/info), message, context
7. Development: Logs to console with colors
8. Production: Logs to files (logs/error.log, logs/combined.log) with rotation
9. Database errors mapped to user-friendly messages (duplicate key → "Record already exists")
10. Frontend displays error toasts using react-hot-toast
11. Frontend API client intercepts errors and displays appropriate messages
12. Frontend 401 errors redirect to login
13. Frontend 403 errors display "Access Denied" message
14. Uncaught frontend errors logged to console (future: send to error tracking service)

---

### Story 1.11: Docker Compose for Development

As a **developer**,
I want **Docker Compose setup for running the full stack locally**,
so that **environment setup is fast and consistent across team members**.

**Acceptance Criteria:**
1. docker-compose.yml created with services: mysql, api, web
2. MySQL service configured with persistent volume and environment variables
3. API service mounts source code for hot reload
4. Web service runs Vite dev server with hot module replacement
5. Services networked together (web can call api, api can reach mysql)
6. Ports exposed: 3000 (web), 5000 (api), 3306 (mysql)
7. docker-compose up starts all services
8. docker-compose down stops and removes containers
9. Environment variables passed via .env files
10. README includes Docker setup instructions
11. Database initialization (migrations, seeds) runs automatically on first startup
12. Logs from all services visible in terminal

---

## Epic 2: Product & Warehouse Management

**Epic Goal:** Implement comprehensive product catalog and warehouse management capabilities including multi-warehouse support, bin/storage location tracking, and real-time inventory visibility. This epic provides the foundation for all inventory operations by establishing the master data for products and locations.

### Story 2.1: Product Master Data Management

As a **warehouse manager**,
I want **to create and manage product records with all relevant details**,
so that **inventory can be tracked accurately across the system**.

**Acceptance Criteria:**
1. Product table created with fields: id, sku (unique), name, category, brand, specifications, costPrice, sellingPrice, reorderLevel, maxStockLevel, binLocation, status (active/inactive), createdAt, updatedAt
2. POST /api/v1/products creates new product with validation
3. GET /api/v1/products returns paginated product list with filters (category, status, search by SKU/name)
4. GET /api/v1/products/:id returns single product with full details
5. PUT /api/v1/products/:id updates product (tracked in change history)
6. DELETE /api/v1/products/:id soft-deletes product (status=inactive)
7. SKU must be unique and cannot be changed after creation
8. Price fields validated as positive numbers
9. Category field uses predefined list (or free text if categories not fixed)
10. Frontend Product List page displays products in responsive table
11. Frontend includes Add/Edit Product modal with form validation
12. Frontend displays product status with visual indicator (active=green, inactive=gray)
13. Only Admin and Warehouse Manager can create/edit products

---

### Story 2.2: Warehouse and Bin Location Management

As a **warehouse manager**,
I want **to define warehouses and their storage bin locations**,
so that **inventory can be tracked by specific physical locations**.

**Acceptance Criteria:**
1. Warehouse table created: id, name, code (unique), address, city, country, status, capacity, gatePassMode (AUTO/MANUAL)
2. BinLocation table created: id, warehouseId, code (unique within warehouse), description, capacity, status
3. POST /api/v1/warehouses creates warehouse
4. GET /api/v1/warehouses returns list of warehouses
5. PUT /api/v1/warehouses/:id updates warehouse details
6. POST /api/v1/warehouses/:id/bins creates bin location within warehouse
7. GET /api/v1/warehouses/:id/bins returns all bins for a warehouse
8. PUT /api/v1/bins/:id updates bin location details
9. DELETE /api/v1/bins/:id soft-deletes bin (only if no active stock assigned)
10. Bin code format validated (e.g., A-01-05 for Aisle-Rack-Shelf)
11. Frontend Warehouse Management page lists warehouses with bin counts
12. Frontend allows adding bins to warehouse via modal
13. Frontend displays warehouse/bin hierarchy visually
14. Only Admin and Warehouse Manager can manage warehouses/bins

---

### Story 2.3: Inventory Tracking by Product, Warehouse, and Bin

As a **warehouse manager**,
I want **to see real-time inventory quantities by product, warehouse, and bin location**,
so that **I know exactly where stock is located and how much is available**.

**Acceptance Criteria:**
1. InventoryItem table created: id, productId, warehouseId, binLocationId, quantity, lastUpdatedAt
2. GET /api/v1/inventory returns inventory across all warehouses with filters (productId, warehouseId, low stock, out of stock)
3. GET /api/v1/inventory/product/:productId returns stock for specific product across all warehouses/bins
4. GET /api/v1/inventory/warehouse/:warehouseId returns all stock in specific warehouse
5. Inventory quantities updated automatically by stock movements (purchase receipts, sales, transfers, adjustments)
6. Stock status calculated: in-stock (qty > reorderLevel), low-stock (qty <= reorderLevel but > 0), out-of-stock (qty = 0)
7. Frontend Inventory View displays filterable table: Product | SKU | Warehouse | Bin | Quantity | Status
8. Frontend displays status with color coding (green/yellow/red)
9. Frontend allows searching by SKU or product name
10. Frontend shows last updated timestamp for each inventory record
11. Inventory view updates on data refetch (TanStack Query cache invalidation)
12. All roles can view inventory (read-only for Sales/Recovery, read-write for Warehouse/Admin)

---

### Story 2.4: Low Stock and Out-of-Stock Alerts

As a **warehouse manager**,
I want **automatic alerts when products reach reorder level or go out of stock**,
so that **I can reorder before stockouts impact sales**.

**Acceptance Criteria:**
1. Alert table created: id, type, severity, title, message, entityType, entityId, status (unread/read/dismissed), createdAt
2. Alert types defined: LOW_STOCK, OUT_OF_STOCK, NEAR_EXPIRY, CREDIT_LIMIT_EXCEEDED, OVERDUE_PAYMENT, PENDING_APPROVAL
3. When inventory quantity <= reorderLevel, LOW_STOCK alert created
4. When inventory quantity = 0, OUT_OF_STOCK alert created
5. Alerts created per warehouse (product can have low stock in one warehouse but sufficient in another)
6. GET /api/v1/alerts returns unread alerts for current user
7. PUT /api/v1/alerts/:id/read marks alert as read
8. PUT /api/v1/alerts/:id/dismiss dismisses alert
9. Frontend displays alert badge on navbar with unread count
10. Frontend alerts dropdown shows recent alerts with action links
11. Dashboard displays low stock and out of stock counts
12. Warehouse Manager and Admin receive inventory alerts
13. Alert creation is automated (triggered by inventory update, not manual)

---

### Story 2.5: Product Search and Filtering

As a **sales officer**,
I want **to quickly search for products by SKU, name, or category**,
so that **I can find items when creating invoices or checking availability**.

**Acceptance Criteria:**
1. GET /api/v1/products/search?q=:query endpoint supports full-text search
2. Search matches SKU, product name, brand, category (case-insensitive)
3. Search returns results sorted by relevance (exact SKU match first, then name matches)
4. Results include: id, sku, name, category, sellingPrice, current stock (total across warehouses)
5. Search endpoint supports autocomplete (returns top 10 matches)
6. Frontend implements search bar with autocomplete dropdown
7. Frontend search has debounced input (300ms delay before API call)
8. Frontend displays search results with stock availability indicator
9. Clicking search result navigates to product detail page (or adds to invoice if in invoice creation context)
10. Search works on mobile (responsive design)
11. Empty search returns no results (doesn't list all products)
12. Performance: Search completes < 500ms for database with 10K products

---

## Epic 3: Purchase Order & Supplier Management

**Epic Goal:** Build the complete purchase order and supplier management workflow including PO creation, import documentation tracking (container numbers, customs, taxes), goods receipt processing, and landed cost calculation. This epic enables digitization of the procurement process from Chinese suppliers to warehouse receipt.

### Story 3.1: Supplier Management

As an **accountant**,
I want **to maintain a database of suppliers with contact and payment details**,
so that **purchase orders can reference suppliers and payment terms are tracked**.

**Acceptance Criteria:**
1. Supplier table created: id, name, country, contactPerson, email, phone, address, paymentTerms, status, createdAt
2. POST /api/v1/suppliers creates new supplier
3. GET /api/v1/suppliers returns paginated supplier list with search
4. GET /api/v1/suppliers/:id returns supplier details with PO history
5. PUT /api/v1/suppliers/:id updates supplier
6. DELETE /api/v1/suppliers/:id soft-deletes (only if no active POs)
7. Email and phone validation
8. Country field uses dropdown (or free text)
9. Payment terms stored as text (e.g., "30 days net", "50% advance, 50% on delivery")
10. Frontend Supplier List page with add/edit modals
11. Frontend displays supplier status (active/inactive)
12. Only Admin and Accountant can manage suppliers

---

### Story 3.2: Purchase Order Creation

As a **warehouse manager**,
I want **to create purchase orders for suppliers with line items and quantities**,
so that **incoming shipments are documented and expected**.

**Acceptance Criteria:**
1. PurchaseOrder table: id, supplierId, orderDate, expectedArrivalDate, status (Draft/Sent/In Transit/Received/Cancelled), totalAmount, notes
2. PurchaseOrderItem table: id, purchaseOrderId, productId, quantity, unitCost, totalCost
3. POST /api/v1/purchase-orders creates PO with line items
4. Line items validated: productId exists, quantity > 0, unitCost >= 0
5. Total amount calculated automatically (sum of line item totals)
6. PO assigned unique sequential number (PO-001, PO-002, etc.)
7. GET /api/v1/purchase-orders returns paginated PO list with filters (supplierId, status, date range)
8. GET /api/v1/purchase-orders/:id returns PO with line items and supplier details
9. PUT /api/v1/purchase-orders/:id updates PO (only if status = Draft)
10. PUT /api/v1/purchase-orders/:id/status changes PO status (Draft → Sent → In Transit → Received)
11. Frontend Create PO page with supplier selection and dynamic line item rows
12. Frontend allows adding/removing line items
13. Frontend displays calculated total
14. Only Warehouse Manager, Accountant, Admin can create POs

---

### Story 3.3: Import Documentation Tracking

As an **accountant**,
I want **to record import documentation details on purchase orders**,
so that **landed costs (product + customs + taxes + shipping) are tracked accurately**.

**Acceptance Criteria:**
1. PurchaseOrder table expanded: containerNumber, shipmentDate, customsCharges, importTaxes, shippingCost, landedCostTotal
2. PUT /api/v1/purchase-orders/:id/import-details updates import fields
3. Landed cost calculated: totalAmount (products) + customsCharges + importTaxes + shippingCost
4. Import details can be added when PO status = In Transit or Received
5. All cost fields validated as positive numbers or zero
6. Frontend PO detail page displays import documentation section
7. Frontend allows editing import details with form validation
8. Frontend displays landed cost prominently
9. Import details tracked in change history
10. Only Accountant and Admin can edit import documentation

---

### Story 3.4: Goods Receipt Processing

As a **warehouse manager**,
I want **to record receipt of goods from a purchase order**,
so that **inventory is updated and PO is marked as complete**.

**Acceptance Criteria:**
1. GoodsReceipt table: id, purchaseOrderId, receivedDate, receivedBy (userId), warehouseId, notes
2. GoodsReceiptItem table: id, goodsReceiptId, purchaseOrderItemId, productId, quantityReceived, binLocationId, batchLotNumber
3. POST /api/v1/goods-receipts creates receipt linked to PO
4. Receipt can be partial (receive less than ordered quantity) or full
5. When receipt created, inventory updated: InventoryItem quantity increased by quantityReceived
6. Batch/lot number assigned to received items (auto-generated or manually entered)
7. PO status updated to Received when all items fully received
8. GET /api/v1/goods-receipts returns receipt history
9. GET /api/v1/goods-receipts/:id returns receipt details with items
10. Frontend PO detail page includes "Receive Goods" button (if status = In Transit or Sent)
11. Frontend goods receipt form lists PO items with input for quantity received and bin location
12. Frontend validates: quantity received <= quantity ordered
13. Frontend shows receipt confirmation with updated inventory
14. Only Warehouse Manager and Admin can record goods receipts

---

### Story 3.5: Batch/Lot Number Tracking

As a **warehouse manager**,
I want **to assign and track batch/lot numbers for received inventory**,
so that **products can be traced back to specific shipments for quality control**.

**Acceptance Criteria:**
1. BatchLot table: id, productId, batchNumber (unique per product), receiptDate, expiryDate (nullable), quantityReceived, quantityRemaining, supplierId, purchaseOrderId
2. Batch number auto-generated format: YYYYMMDD-XXX (date + sequence) or manually entered
3. When goods received, BatchLot record created
4. InventoryItem linked to batchLotId
5. GET /api/v1/products/:id/batches returns all batches for a product with quantities
6. Batch quantities decrease when sales/adjustments consume inventory (FIFO or manual selection)
7. Expiry date optional for non-perishable products, required if product has shelf life
8. Frontend displays batch/lot info on inventory views
9. Frontend allows selecting batch when creating outbound transactions (sales, transfers)
10. Batch tracking integrated with goods receipt form

---

### Story 3.6: Purchase Order Reports

As an **accountant**,
I want **to generate reports on purchase orders and import costs**,
so that **procurement spend and landed costs can be analyzed**.

**Acceptance Criteria:**
1. GET /api/v1/reports/purchase-orders generates PO summary report
2. Filters: date range, supplierId, status
3. Report includes: PO number, supplier, order date, total amount, landed cost, status
4. GET /api/v1/reports/import-costs generates import cost breakdown report
5. Report shows: product cost, customs charges, taxes, shipping, total landed cost per PO
6. Reports exportable to Excel
7. Frontend Purchase Reports page with filter form
8. Frontend displays report results in table
9. Frontend includes "Export to Excel" button
10. Only Accountant and Admin can access PO reports

---

## Epic 4: Inventory Operations & Movements

**Epic Goal:** Implement all inventory movement workflows including stock adjustments (wastage, damage, theft), stock transfers between warehouses, and the gate pass system for controlled outbound movements. This epic provides complete inventory lifecycle management with full audit trail and traceability.

### Story 4.1: Stock Adjustment for Wastage, Damage, and Corrections

As a **warehouse manager**,
I want **to record stock adjustments for wastage, damage, theft, or count corrections**,
so that **inventory quantities reflect actual physical stock**.

**Acceptance Criteria:**
1. StockAdjustment table: id, productId, warehouseId, binLocationId, batchLotId, adjustmentType (WASTAGE/DAMAGE/THEFT/CORRECTION), quantity, reason, approvedBy (userId), adjustmentDate
2. POST /api/v1/stock-adjustments creates adjustment
3. Adjustment types: WASTAGE (spoilage), DAMAGE (broken items), THEFT (shrinkage), CORRECTION (physical count variance)
4. Quantity can be positive (count increase) or negative (count decrease)
5. Inventory updated immediately: InventoryItem quantity adjusted
6. Batch/lot quantity updated if batchLotId specified
7. Reason field required (free text explanation)
8. Approval workflow: Warehouse Manager creates, Admin approves (or single-step if user is Admin)
9. GET /api/v1/stock-adjustments returns adjustment history with filters
10. Frontend Stock Adjustment page with form: product, warehouse, bin, type, quantity, reason
11. Frontend displays adjustment history with type-specific icons
12. Only Warehouse Manager and Admin can create adjustments
13. All adjustments logged in audit trail

---

### Story 4.2: Stock Transfer Between Warehouses

As a **warehouse manager**,
I want **to transfer inventory from one warehouse to another**,
so that **stock can be redistributed based on demand**.

**Acceptance Criteria:**
1. StockTransfer table: id, fromWarehouseId, toWarehouseId, transferDate, status (Pending/In Transit/Received/Cancelled), requestedBy, approvedBy, notes
2. StockTransferItem table: id, stockTransferId, productId, batchLotId, fromBinLocationId, toBinLocationId, quantity
3. POST /api/v1/stock-transfers creates transfer request with items
4. Transfer status workflow: Pending → In Transit (approved) → Received (completed)
5. When status = In Transit, inventory decremented from source warehouse
6. When status = Received, inventory incremented at destination warehouse
7. Batch/lot tracking maintained across transfer
8. GET /api/v1/stock-transfers returns transfer history with filters
9. GET /api/v1/stock-transfers/:id returns transfer details with items
10. PUT /api/v1/stock-transfers/:id/approve changes status to In Transit
11. PUT /api/v1/stock-transfers/:id/receive completes transfer (status = Received)
12. Frontend Stock Transfer page lists pending, in-transit, completed transfers
13. Frontend Create Transfer form: select source/destination warehouses, add items with quantities
14. Frontend displays transfer status with progress indicator
15. Only Warehouse Manager and Admin can create/approve transfers

---

### Story 4.3: Gate Pass System - Creation and Configuration

As a **warehouse manager**,
I want **to configure gate pass generation (auto/manual) per warehouse and create gate passes for outbound shipments**,
so that **inventory leaving the warehouse is properly authorized and tracked**.

**Acceptance Criteria:**
1. Warehouse table has gatePassMode field (AUTO/MANUAL)
2. GatePass table: id, warehouseId, gatePassNumber (unique, sequential per warehouse), date, purpose (SALE/TRANSFER/RETURN/OTHER), referenceType (INVOICE/TRANSFER/ADJUSTMENT), referenceId, status (Pending/Approved/In Transit/Completed/Cancelled), issuedBy, approvedBy, notes
3. GatePassItem table: id, gatePassId, productId, batchLotId, binLocationId, quantity, description
4. PUT /api/v1/warehouses/:id/gate-pass-config updates gatePassMode
5. When sales invoice created (Epic 5), gate pass auto-created if warehouse gatePassMode = AUTO
6. When warehouse gatePassMode = MANUAL, gate pass created as Pending, requires approval
7. POST /api/v1/gate-passes manually creates gate pass
8. GET /api/v1/gate-passes returns gate pass list with filters (warehouseId, status, date range)
9. GET /api/v1/gate-passes/:id returns gate pass details with items
10. Frontend Gate Pass Management page lists passes with status
11. Frontend displays gate pass items with product details
12. Frontend includes warehouse gate pass configuration setting
13. Only Warehouse Manager and Admin can configure gate pass mode

---

### Story 4.4: Gate Pass Approval and Status Tracking

As a **warehouse manager**,
I want **to approve pending gate passes and track their status through completion**,
so that **only authorized shipments leave the warehouse**.

**Acceptance Criteria:**
1. PUT /api/v1/gate-passes/:id/approve changes status Pending → Approved (manual mode only)
2. PUT /api/v1/gate-passes/:id/dispatch changes status Approved → In Transit
3. PUT /api/v1/gate-passes/:id/complete changes status In Transit → Completed
4. PUT /api/v1/gate-passes/:id/cancel cancels gate pass (only if status = Pending or Approved)
5. Status changes logged in audit trail
6. Inventory decremented when status = In Transit (items physically leaving warehouse)
7. Gate pass includes timestamp for each status change
8. Frontend displays gate pass status with visual workflow indicator (timeline/progress bar)
9. Frontend action buttons conditional on status (Approve, Dispatch, Complete, Cancel)
10. Frontend displays who issued, approved, dispatched gate pass
11. Alert created for Warehouse Manager when pending approvals exist (manual mode)
12. Only Warehouse Manager and Admin can approve/dispatch gate passes

---

### Story 4.5: Inventory Movement History and Audit Trail

As a **warehouse manager**,
I want **to see complete movement history for any product**,
so that **I can trace exactly when and why quantities changed**.

**Acceptance Criteria:**
1. InventoryMovement table: id, productId, warehouseId, binLocationId, batchLotId, movementType (IN/OUT), quantity, referenceType (PO_RECEIPT/SALE/TRANSFER_IN/TRANSFER_OUT/ADJUSTMENT), referenceId, movementDate, userId
2. Inventory movements automatically created for: goods receipt, sales invoice, stock transfer, stock adjustment
3. GET /api/v1/inventory/movements returns movement history with filters (productId, warehouseId, date range, movementType)
4. Movement records are immutable (insert only, no update/delete)
5. Each movement links to source document (PO, invoice, transfer, adjustment)
6. Running balance calculated per movement (previous quantity + change = new quantity)
7. Frontend Inventory Movement Report displays: Date | Type | Reference | Quantity In | Quantity Out | Balance | User
8. Frontend allows filtering by product, warehouse, date range
9. Frontend clicking reference number navigates to source document
10. Movement report exportable to Excel
11. All roles can view movement history (read-only)

---

## Epic 5: Sales & Client Management

**Epic Goal:** Create the complete sales workflow including client management with credit limits and payment terms, sales invoice generation with automatic inventory deduction, credit limit enforcement, sales returns/credit notes, and tax calculation. This epic enables revenue-generating transactions with proper credit control.

### Story 5.1: Client Management with Credit Terms

As a **sales officer**,
I want **to maintain client records with credit limits and payment terms**,
so that **credit sales are controlled and payment expectations are clear**.

**Acceptance Criteria:**
1. Client table: id, businessName, ownerName, contactNumber, email, city, area, address, creditLimit, paymentTermsDays, recoveryDay (Monday-Sunday), currentBalance, status, createdAt
2. POST /api/v1/clients creates new client
3. GET /api/v1/clients returns paginated client list with search and filters (city, status, overdue)
4. GET /api/v1/clients/:id returns client details with invoice/payment history
5. PUT /api/v1/clients/:id updates client details
6. DELETE /api/v1/clients/:id soft-deletes (only if balance = 0)
7. Credit limit validated as positive number or 0 (no limit)
8. Payment terms in days (e.g., 7 for weekly, 30 for monthly)
9. Recovery day (day of week for payment collection)
10. Current balance calculated from invoices and payments
11. Frontend Client List page with add/edit modals
12. Frontend displays client status (active/inactive, credit limit indicator)
13. Sales Officer, Accountant, Admin can manage clients

---

### Story 5.2: Sales Invoice Creation with Inventory Deduction

As a **sales officer**,
I want **to create sales invoices that automatically deduct inventory**,
so that **stock levels are accurate and client balances are updated**.

**Acceptance Criteria:**
1. Invoice table: id, invoiceNumber (unique, sequential), clientId, invoiceDate, dueDate, paymentType (CASH/CREDIT), subtotal, taxAmount, totalAmount, status (Unpaid/Partial/Paid), notes
2. InvoiceItem table: id, invoiceId, productId, batchLotId, quantity, unitPrice, discount, taxRate, totalPrice
3. POST /api/v1/invoices creates invoice with line items
4. Invoice number auto-generated (INV-YYYYMMDD-XXX)
5. Due date calculated: invoiceDate + client.paymentTermsDays
6. Line items validated: product exists, quantity > 0, quantity <= available stock
7. For credit sales, check client.currentBalance + invoice.totalAmount <= client.creditLimit (warning if exceeded, block if configured)
8. Tax calculated per line item (taxRate × unitPrice × quantity)
9. Subtotal and total calculated automatically
10. When invoice saved, inventory decremented (InventoryItem and BatchLot quantities reduced)
11. Client balance increased by totalAmount (if paymentType = CREDIT)
12. InventoryMovement record created (type = OUT)
13. If warehouse gate pass mode = AUTO, gate pass created automatically
14. GET /api/v1/invoices returns invoice list with filters
15. GET /api/v1/invoices/:id returns invoice details with items
16. Frontend Create Invoice page with client selection, line item rows, automatic calculations
17. Frontend warns if client approaching/exceeding credit limit
18. Frontend displays available stock when adding product to invoice
19. Frontend supports batch/lot selection for products with multiple batches
20. Sales Officer, Accountant, Admin can create invoices

---

### Story 5.3: Credit Limit Enforcement and Warnings

As a **sales officer**,
I want **the system to warn me when a client is approaching or exceeding their credit limit**,
so that **bad debt risk is minimized**.

**Acceptance Criteria:**
1. When creating credit invoice, system calculates: client.currentBalance + new invoice total
2. If result > 80% of creditLimit, display warning: "Client approaching credit limit (X% utilized)"
3. If result > 100% of creditLimit, display error: "Credit limit exceeded. Current balance: X, Limit: Y"
4. Configuration setting (system-wide): allowCreditLimitOverride (true/false)
5. If allowCreditLimitOverride = true, Admin can override and create invoice anyway
6. If allowCreditLimitOverride = false, invoice creation blocked if limit exceeded
7. Credit limit utilization displayed on client detail page
8. Dashboard shows list of clients > 80% credit limit utilization
9. Alert created when client exceeds credit limit
10. Frontend displays credit limit warnings prominently during invoice creation
11. Override requires Admin confirmation (modal: "Are you sure? Reason:")

---

### Story 5.4: Sales Returns and Credit Notes

As a **sales officer**,
I want **to process sales returns and issue credit notes**,
so that **returned inventory is restocked and client balances are adjusted**.

**Acceptance Criteria:**
1. CreditNote table: id, creditNoteNumber, invoiceId, clientId, creditDate, reason, totalAmount, status
2. CreditNoteItem table: id, creditNoteId, invoiceItemId, productId, batchLotId, quantityReturned, unitPrice, totalPrice
3. POST /api/v1/credit-notes creates credit note linked to original invoice
4. Credit note can be partial (some items/quantities) or full return
5. Returned items restore inventory: InventoryItem and BatchLot quantities increased
6. Client balance decreased by credit note totalAmount
7. InventoryMovement created (type = IN, reference = credit note)
8. Original invoice status remains unchanged (credit note is separate document, not invoice reversal)
9. GET /api/v1/credit-notes returns credit note history
10. GET /api/v1/credit-notes/:id returns credit note details
11. Frontend Invoice detail page includes "Create Return" button
12. Frontend return form pre-fills invoice items, allows selecting quantities to return
13. Frontend requires return reason (dropdown or free text)
14. Sales Officer, Accountant, Admin can create credit notes

---

### Story 5.5: Tax Calculation on Sales

As an **accountant**,
I want **sales tax and withholding tax calculated automatically on invoices**,
so that **tax obligations are tracked accurately**.

**Acceptance Criteria:**
1. System configuration: defaultSalesTaxRate (e.g., 17% for Pakistan GST)
2. Client table expanded: isTaxExempt (boolean), withholdingTaxRate (nullable)
3. Invoice line item tax calculated: unitPrice × quantity × (1 - discount%) × taxRate
4. If client.isTaxExempt = true, taxRate = 0
5. Subtotal = sum of (unitPrice × quantity × (1 - discount%))
6. Tax amount = sum of line item taxes
7. Total = subtotal + taxAmount
8. If client.withholdingTaxRate exists, calculate withholding tax (deducted from total, reduces client payment obligation)
9. Invoice displays: Subtotal, Tax, Withholding Tax (if applicable), Total
10. GET /api/v1/reports/tax-summary generates tax report by period
11. Tax report shows: total sales, tax collected, withholding tax, net tax payable
12. Frontend invoice displays tax breakdown clearly
13. Frontend allows overriding tax rate per line item (Admin only)
14. Tax configuration managed in Settings page (Admin only)

---

### Story 5.6: Sales Reporting

As a **sales officer**,
I want **to generate sales reports by date range, client, or product**,
so that **sales performance can be analyzed**.

**Acceptance Criteria:**
1. GET /api/v1/reports/sales generates sales report
2. Filters: date range (required), clientId (optional), productId (optional), paymentType (optional)
3. Report includes: Invoice #, Date, Client, Total Amount, Payment Type, Status
4. Summary row: Total invoices, Total amount, Paid amount, Outstanding
5. GET /api/v1/reports/sales-by-product generates product-wise sales report
6. Product report shows: Product, Quantity Sold, Revenue, sorted by revenue descending
7. Reports exportable to Excel
8. Frontend Sales Reports page with filter form
9. Frontend displays report results in table with summary
10. Frontend includes date range picker
11. All roles except Recovery Agent can access sales reports

---

## Epic 6: Payment & Recovery Management

**Epic Goal:** Build the complete payment and recovery workflow including payment recording for both clients and suppliers, weekly recovery schedule tracking, aging analysis for overdue accounts, and recovery agent dashboards. This epic streamlines cash collection and reduces DSO (Days Sales Outstanding).

### Story 6.1: Client Payment Recording

As a **recovery agent**,
I want **to record payments received from clients**,
so that **client balances are reduced and cash inflow is tracked**.

**Acceptance Criteria:**
1. Payment table: id, paymentNumber, paymentDate, clientId, amount, paymentMethod (CASH/BANK_TRANSFER/CHEQUE), referenceNumber, notes, recordedBy
2. POST /api/v1/payments/client creates client payment
3. Payment reduces client.currentBalance
4. Payment can be allocated to specific invoices or treated as account credit
5. If payment > outstanding balance, warn but allow (overpayment creates credit balance)
6. Payment method validation: if CHEQUE or BANK_TRANSFER, referenceNumber required
7. GET /api/v1/payments/client returns payment history with filters (clientId, date range)
8. GET /api/v1/payments/client/:id returns payment details
9. Frontend Record Payment page with client selection, amount, method, reference
10. Frontend displays client current balance before and after payment
11. Frontend allows linking payment to invoices (apply X amount to invoice Y)
12. Recovery Agent, Accountant, Admin can record payments
13. Payment recorded in audit trail

---

### Story 6.2: Weekly Recovery Schedule Tracking

As a **recovery agent**,
I want **to see which clients are scheduled for payment collection today**,
so that **I can plan my collection route efficiently**.

**Acceptance Criteria:**
1. Client.recoveryDay stores day of week (Monday, Tuesday, etc.)
2. GET /api/v1/recovery/schedule?date=YYYY-MM-DD returns clients scheduled for that day
3. Endpoint calculates day of week from date and filters clients by recoveryDay
4. Response includes: Client name, outstanding balance, overdue amount, contact, address
5. Frontend Recovery Schedule page displays today's clients by default
6. Frontend allows selecting different date to view schedule
7. Frontend displays clients in list with key info (name, balance, phone)
8. Frontend allows clicking client to view full details or record payment
9. Frontend highlights overdue clients in red
10. Recovery dashboard displays "Today's Collections" widget with scheduled client count
11. Recovery Agent and Accountant can access schedule

---

### Story 6.3: Aging Analysis for Overdue Accounts

As an **accountant**,
I want **to see client balances categorized by age (current, 1-7 days, 8-14 days, etc.)**,
so that **collection efforts can be prioritized on the most overdue accounts**.

**Acceptance Criteria:**
1. GET /api/v1/reports/aging-analysis generates aging report
2. For each client, calculate outstanding invoice amounts by age buckets:
   - Current (not yet due)
   - 1-7 days overdue
   - 8-14 days overdue
   - 15-30 days overdue
   - 30+ days overdue
3. Report shows: Client, Current, 1-7, 8-14, 15-30, 30+, Total Outstanding
4. Summary row shows totals for each bucket across all clients
5. Report sortable by total outstanding (default) or any age bucket
6. Report exportable to Excel
7. Frontend Aging Report page displays table with color coding (older = redder)
8. Frontend allows filtering by client or minimum outstanding amount
9. GET /api/v1/clients/:id/aging returns aging breakdown for specific client
10. Client detail page displays aging breakdown
11. Accountant, Admin, Recovery Agent can access aging reports

---

### Story 6.4: Overdue Payment Alerts

As an **accountant**,
I want **automatic alerts for invoices that are past their due date**,
so that **collection follow-up is timely**.

**Acceptance Criteria:**
1. Daily scheduled job (cron or background task) runs to check for overdue invoices
2. Invoice considered overdue if: status != Paid AND dueDate < today
3. OVERDUE_PAYMENT alert created for each overdue invoice (one alert per invoice, not duplicated daily)
4. Alert includes: client name, invoice number, due date, days overdue, amount
5. Alert severity increases with age: 1-7 days = Warning, 8+ days = Critical
6. Alerts delivered to Accountant and Recovery Agent roles
7. Dashboard displays overdue invoice count prominently
8. Frontend allows filtering alerts by type (overdue only)
9. Clicking alert navigates to invoice or client detail
10. Alert dismissed when invoice paid

---

### Story 6.5: Recovery Dashboard and Metrics

As a **recovery agent**,
I want **a dashboard showing my recovery targets, collections this week, and pending clients**,
so that **I can track my performance and prioritize work**.

**Acceptance Criteria:**
1. GET /api/v1/recovery/metrics returns:
   - Total outstanding receivables
   - Payments collected this week
   - Payments collected this month
   - Number of overdue clients
   - Number of clients scheduled today
2. Recovery Agent dashboard displays these metrics in cards/widgets
3. Dashboard includes "Top 5 Overdue Clients" list (sorted by amount or days overdue)
4. Dashboard includes "Recent Payments" list (last 10 payments recorded)
5. Dashboard refreshes on page load (TanStack Query)
6. Frontend displays metrics with visual indicators (charts, progress bars optional)
7. Frontend allows clicking metrics to drill down (e.g., click overdue count → overdue client list)
8. Recovery Agent role sees this dashboard by default on login

---

## Epic 7: Financial Management & Expenses

**Epic Goal:** Implement supplier payment tracking, operating expense management, cash flow visibility, and basic financial reporting. This epic provides the financial operations and reporting needed to track cash outflows, reconcile supplier accounts, and understand business profitability.

### Story 7.1: Supplier Payment Recording

As an **accountant**,
I want **to record payments made to suppliers and link them to purchase orders**,
so that **supplier balances are tracked and payment history is visible**.

**Acceptance Criteria:**
1. SupplierPayment table: id, paymentNumber, supplierId, purchaseOrderId (nullable), paymentDate, amount, paymentMethod, referenceNumber, notes, recordedBy
2. POST /api/v1/payments/supplier creates supplier payment
3. Payment can be linked to specific PO or treated as advance/general payment
4. Payment method validation (same as client payments)
5. GET /api/v1/payments/supplier returns payment history with filters
6. GET /api/v1/suppliers/:id/payments returns payment history for specific supplier
7. Supplier detail page displays outstanding balance (PO total - payments made)
8. Frontend Record Supplier Payment page with supplier/PO selection
9. Frontend displays PO outstanding amount when PO selected
10. Accountant and Admin can record supplier payments

---

### Story 7.2: Expense Management by Category

As an **accountant**,
I want **to record operating expenses categorized by type**,
so that **business costs are tracked and analyzed**.

**Acceptance Criteria:**
1. Expense table: id, expenseDate, category, amount, paymentMethod, referenceNumber, description, recordedBy, createdAt
2. Expense categories: RENT, UTILITIES, SALARIES, TRANSPORT, OFFICE_SUPPLIES, MAINTENANCE, OTHER
3. POST /api/v1/expenses creates expense record
4. GET /api/v1/expenses returns expense history with filters (category, date range)
5. Category field uses dropdown (predefined list)
6. Amount validated as positive number
7. Frontend Expense Management page lists expenses with add modal
8. Frontend allows filtering by category and date range
9. Frontend displays expense total for selected filters
10. Accountant and Admin can record expenses

---

### Story 7.3: Cash Flow Summary

As an **accountant**,
I want **to see cash inflows (sales, client payments) and outflows (supplier payments, expenses) by period**,
so that **cash position is clear**.

**Acceptance Criteria:**
1. GET /api/v1/reports/cash-flow generates cash flow report
2. Parameters: date range (required)
3. Report calculates:
   - Inflows: Client payments (from Payment table)
   - Outflows: Supplier payments + Expenses
   - Net Cash Flow: Inflows - Outflows
4. Report shows daily or monthly breakdown (configurable)
5. Report exportable to Excel
6. Frontend Cash Flow Report page with date range selector
7. Frontend displays inflow/outflow/net in tabular and chart format (bar/line chart optional)
8. Accountant and Admin can access cash flow reports

---

### Story 7.4: Profit & Loss Calculation

As an **admin**,
I want **a basic profit and loss statement**,
so that **business profitability can be assessed**.

**Acceptance Criteria:**
1. GET /api/v1/reports/profit-loss generates P&L report
2. Parameters: date range (required)
3. Report calculates:
   - **Revenue**: Total invoices (sum of totalAmount where invoiceDate in range)
   - **Cost of Goods Sold (COGS)**: Sum of (invoice line item quantity × product costPrice)
   - **Gross Profit**: Revenue - COGS
   - **Operating Expenses**: Sum of expenses in date range
   - **Net Profit**: Gross Profit - Operating Expenses
4. Report displays: Revenue, COGS, Gross Profit, Gross Margin %, Operating Expenses, Net Profit, Net Margin %
5. Report exportable to Excel
6. Frontend P&L Report page with date range selector
7. Frontend displays P&L in statement format
8. Only Admin and Accountant can access P&L

---

### Story 7.5: Financial Reports Dashboard

As an **accountant**,
I want **a financial dashboard showing key metrics at a glance**,
so that **I can quickly assess business financial health**.

**Acceptance Criteria:**
1. Accountant dashboard displays:
   - Total Receivables (client outstanding balances)
   - Total Payables (supplier outstanding amounts)
   - Cash Flow This Month (net)
   - Revenue This Month
   - Expenses This Month
2. GET /api/v1/reports/financial-summary endpoint provides these metrics
3. Dashboard includes quick links to detailed reports (Cash Flow, P&L, Aging)
4. Frontend displays metrics in cards with trend indicators (up/down vs previous period - optional for MVP)
5. Dashboard refreshes on load

---

## Epic 8: Reporting & Analytics Dashboard

**Epic Goal:** Build a comprehensive reporting engine that consolidates all business data into actionable reports including inventory reports, sales reports, recovery reports, financial reports, import cost analysis, gate pass reports, and the audit trail viewer. All reports support filtering, sorting, and Excel export.

### Story 8.1: Inventory Reports

As a **warehouse manager**,
I want **comprehensive inventory reports showing stock levels, valuations, and movements**,
so that **inventory planning and control decisions are data-driven**.

**Acceptance Criteria:**
1. GET /api/v1/reports/inventory/stock generates current stock report
2. Filters: warehouseId, category, status (all/in-stock/low-stock/out-of-stock)
3. Report shows: Product, SKU, Category, Warehouse, Bin, Batch, Quantity, Cost Price, Stock Value
4. Summary: Total items, Total stock value
5. GET /api/v1/reports/inventory/movements already implemented in Epic 4.5
6. GET /api/v1/reports/inventory/valuation generates inventory valuation by product/category
7. Valuation report calculates: quantity × costPrice for each product, grouped by category
8. All inventory reports exportable to Excel
9. Frontend Inventory Reports page with report type selector and filters
10. Frontend displays reports in responsive tables

---

### Story 8.2: Sales and Revenue Reports

As a **sales officer**,
I want **detailed sales reports by client, product, time period, and sales officer (if applicable)**,
so that **sales performance can be analyzed and optimized**.

**Acceptance Criteria:**
1. Sales by Date Range report already implemented in Epic 5.6
2. GET /api/v1/reports/sales/by-client generates client-wise sales summary
3. Client report shows: Client, Total Invoices, Total Revenue, sorted by revenue
4. GET /api/v1/reports/sales/by-product generates product-wise sales summary
5. Product report shows: Product, Quantity Sold, Revenue, sorted by quantity or revenue
6. GET /api/v1/reports/sales/monthly-trend generates monthly revenue trend (last 12 months)
7. Trend report shows: Month, Invoice Count, Total Revenue
8. All sales reports exportable to Excel
9. Frontend Sales Analytics page with report selector
10. Frontend displays trend reports with line/bar charts (optional, can be table-only for MVP)

---

### Story 8.3: Recovery and Receivables Reports

As an **accountant**,
I want **recovery performance reports and detailed receivables analysis**,
so that **collection effectiveness can be measured**.

**Acceptance Criteria:**
1. Aging Analysis report already implemented in Epic 6.3
2. GET /api/v1/reports/recovery/performance generates recovery performance report
3. Performance report shows: Week/Month, Payments Collected, # of Clients Paid, Average Collection Time (days from due date to payment)
4. GET /api/v1/reports/recovery/by-agent generates recovery agent performance (if agents tracked)
5. GET /api/v1/reports/receivables/outstanding generates detailed outstanding receivables list
6. Outstanding report shows: Client, Invoice #, Invoice Date, Due Date, Days Overdue, Amount Outstanding
7. All recovery reports exportable to Excel
8. Frontend Recovery Reports page with report type and date range selectors

---

### Story 8.4: Financial and Expense Reports

As an **accountant**,
I want **detailed expense reports by category and period**,
so that **cost control can be maintained**.

**Acceptance Criteria:**
1. Cash Flow and P&L reports already implemented in Epic 7.3 and 7.4
2. GET /api/v1/reports/expenses/by-category generates expense breakdown by category
3. Report shows: Category, Total Amount, % of Total Expenses
4. GET /api/v1/reports/expenses/detailed generates detailed expense list
5. Detailed report shows: Date, Category, Amount, Payment Method, Description
6. Filters: date range, category
7. All expense reports exportable to Excel
8. Frontend Expense Reports page with filters

---

### Story 8.5: Import Cost Analysis and Purchase Reports

As an **accountant**,
I want **import cost analysis showing landed cost breakdown by purchase order**,
so that **true procurement costs are understood**.

**Acceptance Criteria:**
1. Import Cost Analysis report already implemented in Epic 3.6
2. GET /api/v1/reports/purchases/supplier-performance generates supplier analysis
3. Supplier report shows: Supplier, Total POs, Total Ordered, Total Paid, Outstanding Balance
4. GET /api/v1/reports/purchases/detailed generates detailed PO list with filters
5. All purchase reports exportable to Excel
6. Frontend Purchase Reports page

---

### Story 8.6: Gate Pass Reports

As a **warehouse manager**,
I want **gate pass reports showing issued, pending, and completed passes**,
so that **outbound shipment tracking is complete**.

**Acceptance Criteria:**
1. GET /api/v1/reports/gate-passes generates gate pass report
2. Filters: warehouseId, status, date range, purpose
3. Report shows: Gate Pass #, Date, Purpose, Reference (invoice/transfer #), Status, Items Count
4. Report exportable to Excel
5. Frontend Gate Pass Reports page with filters
6. Frontend allows clicking gate pass # to view full details

---

### Story 8.7: Audit Trail Viewer and Search

As an **admin**,
I want **to search and view the complete audit trail of user actions**,
so that **any suspicious activity or data changes can be investigated**.

**Acceptance Criteria:**
1. GET /api/v1/audit-logs returns audit log entries with pagination
2. Filters: userId, entityType, action (CREATE/UPDATE/DELETE), date range
3. Search by entity ID or reference number
4. Audit log display shows: Timestamp, User, Action, Entity Type, Entity ID, Changed Fields (collapsed/expandable)
5. Clicking audit entry expands to show old/new values side-by-side
6. Frontend Audit Trail page with filter form and search bar
7. Frontend displays audit logs in reverse chronological order (newest first)
8. Frontend highlights critical actions (DELETE) in red
9. Audit log export to Excel includes full change details
10. Only Admin can access full audit trail viewer
11. Other roles can view audit history for specific entities they own (e.g., Sales Officer sees audit for their invoices)

---

### Story 8.8: Report Export to Excel

As a **user**,
I want **all reports to be exportable to Excel format**,
so that **data can be further analyzed in spreadsheets**.

**Acceptance Criteria:**
1. All report endpoints support ?format=excel query parameter
2. Excel export uses library like exceljs or xlsx
3. Excel file includes:
   - Report title and parameters (date range, filters)
   - Generated timestamp
   - Data in table format with headers
   - Summary rows where applicable
4. Excel download triggers browser download (Content-Disposition: attachment)
5. Frontend "Export to Excel" button on all report pages
6. Export includes all data (not just paginated view)
7. Export performance: < 5 seconds for reports with 1000 rows

---

### Story 8.9: Unified Reports Dashboard

As a **user**,
I want **a central reports page listing all available reports by category**,
so that **I can easily find and generate any report**.

**Acceptance Criteria:**
1. Frontend Reports Dashboard page lists all reports categorized:
   - Inventory Reports
   - Sales Reports
   - Purchase Reports
   - Financial Reports
   - Recovery Reports
   - Audit Reports
2. Each report listed with: Name, Description, Link to generate
3. Reports filtered by user role (show only reports user can access)
4. Dashboard includes quick access to most frequently used reports
5. Frontend uses card/tile layout for report categories
6. Clicking report navigates to report page with filters

---

## Next Steps

### Checklist Results Report

*(To be completed: Execute PM Checklist and populate results here)*

**Checklist Status:** Pending execution

The PM Checklist will validate:
- Requirements completeness and clarity
- Epic and story logical sequencing
- Acceptance criteria testability
- Technical feasibility
- Resource and timeline alignment
- Risk identification

---

### UX Expert Prompt

The Product Requirements Document is complete and ready for UX/UI design phase. Please review the PRD comprehensively and create detailed UX/UI specifications including:

- Wireframes for all 17 core screens identified in UI Design Goals
- User flow diagrams for critical workflows (invoice creation, goods receipt, gate pass approval, payment recording)
- Component specifications aligned with Tailwind CSS and Lucide React
- Responsive design breakpoints and mobile-specific layouts
- Interaction patterns and microinteractions
- Accessibility considerations (for future Premium tier)
- Design system documentation (colors, typography, spacing, components)

Focus areas for UX design:
1. Role-based dashboard layouts (5 distinct dashboards)
2. Complex forms (invoice creation with dynamic line items, PO creation)
3. Data-heavy tables with filters and sorting
4. Mobile-optimized workflows (stock lookup, payment recording)
5. Status-driven UI patterns (gate pass workflow, PO status progression)

Output: Comprehensive UX specification document with wireframes and user flows ready for development handoff.

---

### Architect Prompt

The Product Requirements Document is complete and ready for technical architecture design. Please review the PRD thoroughly and create a comprehensive technical architecture specification including:

**Database Architecture:**
- Complete entity-relationship diagram (ERD) for all tables
- Prisma schema definition with relationships, indexes, and constraints
- Data migration strategy and seeding approach
- Multi-tenant schema design (tenantId on all tables, row-level security via Prisma middleware)

**API Architecture:**
- RESTful API endpoint design for all functional requirements (FR1-FR49)
- Request/response schemas with Zod validation
- Authentication and authorization flow diagrams
- Error handling and validation patterns
- Rate limiting and security measures

**Application Architecture:**
- Monorepo structure with detailed folder organization
- Frontend architecture (React components, routing, state management with TanStack Query)
- Backend architecture (Express modules, service layer, middleware)
- Shared packages (types, utilities, validation schemas)

**Infrastructure:**
- Docker Compose configuration for development and production
- Environment configuration management
- Logging and monitoring setup (Winston/Pino)
- Backup and disaster recovery procedures
- CI/CD pipeline design (testing, building, deployment)

**Security Architecture:**
- JWT authentication implementation details
- Role-based access control (RBAC) enforcement at API level
- Data encryption (in-transit and at-rest)
- Audit logging architecture (async writes, separate storage)
- Input validation and sanitization

**Performance & Scalability:**
- Database indexing strategy
- Caching approach (TanStack Query client-side, Redis future)
- Pagination and lazy loading patterns
- Query optimization for complex reports
- Load testing criteria

**Testing Strategy:**
- Unit testing approach (Jest, 80% coverage target)
- Integration testing with test database
- E2E testing with Playwright/Cypress
- Test data management and fixtures

Output: Complete Technical Architecture Document with diagrams, schemas, API specifications, and implementation guidelines ready for development team.

---

**End of PRD**

**Total Requirements:** 49 Base MVP Functional + 15 Premium/Future Functional + 24 Base MVP Non-Functional + 5 Premium/Future Non-Functional = 93 Requirements

**Total Epics:** 8
**Total Stories:** 52 detailed stories

**Development Estimate:** 6-9 months for Base MVP with 2-3 developers

**Next Phase:** UX/UI Design → Technical Architecture → Development Sprint Planning
