# EnterpriseOne ERP - Product Requirements Document (PRD)

**Multi-Tenant SaaS Business Management Platform**

**Status:** ✅ MVP Complete | ✅ Phase 2 Complete | 🔄 Phase 3 In Progress
**Version:** 2.0 - SaaS Platform
**Last Updated:** February 2026

---

## 📋 Quick Navigation

### Core Platform (Available Now)
- **[Epic 1: Foundation, Authentication & Audit](./epics/epic-1-foundation-auth-audit.md)** - Multi-tenant foundation, RBAC
- **[Epic 2: Product & Inventory](./epics/epic-2-import-inventory.md)** - Multi-warehouse, landed costs
- **[Epic 3: Sales & Payments](./epics/epic-3-sales-payments.md)** - CRM, invoicing, credit management
- **[Epic 4: Dashboards & Reports](./epics/epic-4-dashboards-reports.md)** - BI, analytics, exports

### Advanced Operations (Available Now)
- **[Epic 5: Financial Accounting](./epics/epic-5-account-heads-gl.md)** - Double-entry GL, financial statements
- **[Epic 6: Warehouse Operations](./epics/epic-6-advanced-inventory.md)** - Gate passes, transfers, batch tracking
- **[Epic 7: Recovery & Collections](./epics/epic-7-recovery-management.md)** - Collection schedules, aging
- **[Epic 8: Audit & Compliance](./epics/epic-8-audit-advanced.md)** - Audit trail, change history, barcode

### Platform Scale (In Progress)
- **[Epic 9: Multi-Tenant SaaS](./epics/epic-9-multi-tenant-saas.md)** - Tenant isolation, onboarding
- **[Epic 10: Standardized Operations](./epics/epic-10-sales-purchasing-inventory-flow.md)** - Document chains

---

## 1. Executive Overview

### 1.1 Product Vision

**EnterpriseOne** is a comprehensive, multi-tenant SaaS ERP platform designed to be the **modern, affordable alternative to legacy ERPs like Odoo and SAP Business One**. 

Born from the real-world needs of import-distribution businesses, EnterpriseOne has evolved into a full-featured ERP serving SMBs across manufacturing, distribution, retail, and services industries.

### 1.2 Market Positioning

| Attribute | EnterpriseOne | Odoo | SAP B1 |
|-----------|--------------|------|--------|
| **Architecture** | True Multi-Tenant SaaS | Single-Tenant | Single-Tenant |
| **Implementation** | Days | Weeks-Months | Months |
| **Pricing** | $49-299/user/month | $25-50/user + hosting | $100-300/user |
| **Customization** | Full source code | Module-based | Limited/Expensive |
| **Mobile** | PWA + Responsive | Separate apps | Limited |
| **Tech Stack** | React/Node/TypeScript | Python/JavaScript | C#/.NET |

### 1.3 Target Industries

- **Import/Export Distribution** - Container tracking, landed costs, multi-currency
- **Manufacturing** - BOM, production planning, MRP (Phase 3)
- **Retail & Wholesale** - Multi-location inventory, POS integration (Phase 3)
- **Services** - Project billing, time tracking, expense management

---

## 2. Platform Architecture

### 2.1 Multi-Tenant Design

**Architecture Pattern:** Shared Database with Row-Level Security

```
┌─────────────────────────────────────────┐
│           ENTERPRISEONE PLATFORM        │
│                                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐   │
│  │ Tenant A│ │ Tenant B│ │ Tenant C│   │
│  │ (Co 1)  │ │ (Co 2)  │ │ (Co 3)  │   │
│  └────┬────┘ └────┬────┘ └────┬────┘   │
│       │           │           │         │
│       └───────────┴───────────┘         │
│                   │                     │
│         ┌─────────▼──────────┐          │
│         │  Tenant Middleware  │          │
│         │  (Auto tenantId    │          │
│         │   injection)       │          │
│         └─────────┬──────────┘          │
│                   │                     │
│         ┌─────────▼──────────┐          │
│         │   Shared Database   │          │
│         │  (PostgreSQL/MySQL) │          │
│         └─────────────────────┘          │
└─────────────────────────────────────────┘
```

**Key Features:**
- ✅ Automatic tenant context via AsyncLocalStorage
- ✅ Prisma Client Extension for query filtering
- ✅ Zero data leakage between tenants
- ✅ Shared infrastructure costs = lower pricing
- ✅ Single deployment, unlimited tenants

### 2.2 Technical Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 18, TypeScript, Tailwind CSS, TanStack Query |
| **Backend** | Node.js 20 LTS, Express, TypeScript |
| **ORM** | Prisma 5+ with multi-tenant extensions |
| **Database** | PostgreSQL 15 / MySQL 8+ |
| **Auth** | JWT with refresh tokens |
| **Cache** | Redis (Phase 3) |
| **Queue** | Bull/BullMQ (Phase 3) |
| **Search** | Meilisearch (Phase 3) |

---

## 3. Module Specifications

### 3.1 Core Modules (Production Ready)

#### A. Financial Management

**General Ledger**
- Double-entry bookkeeping
- Chart of accounts (5 levels: Assets, Liabilities, Equity, Revenue, Expenses)
- Journal entries (manual and auto-generated)
- Multi-currency support
- Period closing with lock

**Accounts Receivable**
- Customer invoicing
- Payment allocation (FIFO)
- Credit limit enforcement
- Aging analysis (Current, 1-7 days, 8-14 days, 15-30 days, 30+)
- Dunning management

**Accounts Payable**
- Supplier invoicing
- Payment scheduling
- 3-way matching (PO + GRN + Invoice)
- Aging analysis

**Banking**
- Multi-bank account management
- Bank reconciliation
- Petty cash management
- Check printing (Phase 3)

**Financial Reporting**
- Trial Balance
- Balance Sheet
- Profit & Loss Statement
- Cash Flow Statement
- General Ledger Report

#### B. Supply Chain Management

**Inventory Management**
- Multi-warehouse support
- Bin location management
- Batch/lot tracking with expiry
- Serial number tracking (Phase 3)
- FIFO/LIFO valuation
- Stock levels with reorder points
- ABC analysis (Phase 3)

**Purchasing**
- Purchase requisitions (Phase 3)
- Purchase orders
- Goods receipt notes (GRN)
- Landed cost calculation
- Supplier management
- Purchase price history

**Sales**
- Sales quotations
- Sales orders
- Delivery notes
- Sales invoices
- Sales returns (credit notes)
- Price lists and discounts

**Warehouse Operations**
- Stock transfers (inter-warehouse)
- Stock adjustments (with approval workflow)
- Physical stock counts
- Cycle counting (Phase 3)
- Gate passes (outbound control)
- Barcode/QR scanning (Phase 3)

#### C. Customer Relationship Management

**Customer Management**
- Customer master data
- Contact management
- Credit limits and payment terms
- Customer categories
- Tax exemption handling

**Sales Pipeline** (Phase 3)
- Lead management
- Opportunity tracking
- Sales forecasting
- Activity scheduling

**Recovery Management**
- Weekly collection schedules
- Route planning for agents
- Visit logging with GPS (Phase 3)
- Payment promise tracking
- Collection efficiency metrics

#### D. Product Management

**Product Master**
- SKU auto-generation
- Product variants (color, size, etc.)
- Multiple units of measure
- Barcode management
- Product categories and brands
- Cost and selling price tracking
- Reorder levels

**BOM & Manufacturing** (Phase 3)
- Bill of Materials (single and multi-level)
- Routing definitions
- Work order management
- Material consumption
- Production reporting

#### E. Business Intelligence

**Dashboards**
- Role-based dashboards (Admin, Sales, Warehouse, Accountant)
- Real-time KPI widgets
- Customizable layouts (Phase 3)

**Reporting Center**
- 20+ standard reports
- Report builder (Phase 3)
- Scheduled reports (Phase 3)
- Excel/PDF export

**Analytics**
- Inventory turnover
- DSO (Days Sales Outstanding)
- Collection efficiency
- Sales trends
- Profitability analysis

---

## 4. Functional Requirements

### 4.1 Multi-Tenancy Requirements

**FR-T1:** System shall support unlimited tenants on a single deployment
**FR-T2:** Each tenant shall have complete data isolation
**FR-T3:** Tenant context shall be automatically managed via middleware
**FR-T4:** System shall support tenant-specific customizations
**FR-T5:** Tenant onboarding shall be automated (< 5 minutes setup)

### 4.2 Authentication & Security

**FR-A1:** System shall support JWT-based authentication
**FR-A2:** System shall implement role-based access control (RBAC)
**FR-A3:** System shall support 5 default roles: Admin, Warehouse Manager, Sales Officer, Accountant, Recovery Agent
**FR-A4:** System shall support custom role creation (Phase 3)
**FR-A5:** System shall log all authentication events
**FR-A6:** System shall support 2FA (Phase 3)
**FR-A7:** System shall encrypt all sensitive data at-rest and in-transit

### 4.3 Audit & Compliance

**FR-AU1:** System shall automatically log all CRUD operations
**FR-AU2:** Audit logs shall include: user, action, entity, timestamp, IP, changed fields
**FR-AU3:** Audit logs shall be immutable (append-only)
**FR-AU4:** System shall maintain change history (last 2 versions) for critical entities
**FR-AU5:** System shall support audit log export (Excel)
**FR-AU6:** System shall provide audit trail viewer with filtering

---

## 5. Non-Functional Requirements

### 5.1 Performance

**NFR-P1:** Page load time < 2 seconds for standard operations
**NFR-P2:** API response time < 500ms (95th percentile)
**NFR-P3:** Support 100+ concurrent users per tenant
**NFR-P4:** Report generation < 5 seconds for up to 10,000 records
**NFR-P5:** Database queries < 100ms for standard operations

### 5.2 Scalability

**NFR-S1:** Support 1,000+ tenants on single deployment
**NFR-S2:** Support 10,000+ users per tenant
**NFR-S3:** Horizontal scaling capability (Phase 3)
**NFR-S4:** Database read replicas for reporting (Phase 3)

### 5.3 Security

**NFR-SEC1:** SOC 2 Type II compliance (Phase 3)
**NFR-SEC2:** GDPR compliance for EU tenants
**NFR-SEC3:** Automatic security patches
**NFR-SEC4:** Penetration testing annually
**NFR-SEC5:** Data backup every 4 hours with 30-day retention

### 5.4 Availability

**NFR-A1:** 99.9% uptime SLA
**NFR-A2:** Zero-downtime deployments
**NFR-A3:** Automatic failover (Phase 3)
**NFR-A4:** RPO < 1 hour, RTO < 4 hours

---

## 6. User Interface Requirements

### 6.1 Design Principles

- **Mobile-First:** Responsive design for all screen sizes
- **Role-Based:** Show only relevant features per user role
- **Task-Oriented:** Quick actions for common workflows
- **Data-Dense:** Efficient use of screen real estate
- **Accessibility:** WCAG 2.1 AA compliance (Phase 3)

### 6.2 Supported Devices

- Desktop (1920x1080+)
- Tablet (1024x768+)
- Mobile (375px+)

---

## 7. Integration Requirements

### 7.1 API

**IR-API1:** RESTful API with JSON
**IR-API2:** OpenAPI/Swagger documentation
**IR-API3:** API rate limiting
**IR-API4:** API versioning
**IR-API5:** Webhook support (Phase 3)

### 7.2 Third-Party Integrations (Phase 3)

**IR-TPI1:** Payment gateways (Stripe, PayPal)
**IR-TPI2:** Shipping providers (DHL, FedEx)
**IR-TPI3:** Email providers (SendGrid, SES)
**IR-TPI4:** SMS providers (Twilio)
**IR-TPI5:** Accounting software (QuickBooks, Xero)
**IR-TPI6:** E-commerce platforms (Shopify, WooCommerce)

---

## 8. Data Migration

### 8.1 Import Capabilities

**DM-1:** Excel/CSV import for all master data
**DM-2:** Template validation
**DM-3:** Bulk import with progress tracking
**DM-4:** Import error reporting
**DM-5:** Data transformation rules

### 8.2 Migration Tools

**DM-T1:** Opening balance import
**DM-T2:** Historical transaction import (Phase 3)
**DM-T3:** API-based migration from other ERPs

---

## 9. Success Metrics

### 9.1 Platform Metrics

| Metric | Target |
|--------|--------|
| Tenant Count | 500+ by Year 2 |
| User Adoption | 80%+ DAU/MAU |
| NPS Score | 50+ |
| Uptime | 99.9% |
| Support Tickets | <2/tenant/month |

### 9.2 Customer Success Metrics

| Metric | Target |
|--------|--------|
| Implementation Time | <2 weeks |
| Inventory Accuracy | 99%+ |
| DSO Reduction | 30%+ |
| User Satisfaction | 4.5/5 |
| Churn Rate | <5% annually |

---

## 10. Roadmap

### Phase 1: Core ERP (COMPLETE) ✅
- Multi-tenant foundation
- Inventory & Purchasing
- Sales & CRM
- Basic reporting

### Phase 2: Financial & Operations (COMPLETE) ✅
- Double-entry accounting
- Full GL, AR, AP
- Gate passes & warehouse ops
- Recovery management
- Advanced reporting

### Phase 3: Manufacturing & Scale (IN PROGRESS) 🚧
- BOM and MRP
- Production planning
- Advanced CRM
- Customer portal
- Mobile apps

### Phase 4: Enterprise Features (PLANNED) 📅
- AI-powered forecasting
- Advanced BI with ML
- Workflow automation
- Marketplace
- White-label option

---

## 11. Appendices

### Appendix A: Comparison with Competitors

See [Competitive Analysis](#competitive-analysis) section above.

### Appendix B: Glossary

- **Tenant:** A customer organization with isolated data
- **BOM:** Bill of Materials
- **MRP:** Material Requirements Planning
- **DSO:** Days Sales Outstanding
- **FIFO:** First In, First Out
- **GRN:** Goods Receipt Note
- **GL:** General Ledger

### Appendix C: Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Jan 2025 | Initial PRD for Hisham Traders |
| 2.0 | Feb 2026 | Rebranded as EnterpriseOne SaaS platform |

---

**Document Status:** Approved for Development
**Next Review:** March 2026
