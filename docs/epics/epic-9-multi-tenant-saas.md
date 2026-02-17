# Epic 9: Multi-Tenant SaaS Architecture

**Epic Goal:** Transform the single-tenant ERP into a multi-tenant SaaS platform using a shared-database model with `tenantId` isolation. One deployment serves all clients — each client (tenant) gets their own data, users, settings, and chart of accounts, all isolated within the same database.

**Timeline:** Phase 3 (estimated 1-2 weeks)

**Status:** PHASE 3 - SaaS Transformation

**Dependencies:** Epic 1 (Auth + JWT), Epic 5 (Accounting / Chart of Accounts), All Epics 1-8 (existing business logic)

---

## Overview

The ERP currently runs as a **single-tenant** application: one database, one set of users, one company's data. To serve multiple clients from a single deployment, we need **tenant isolation** — every business record (products, invoices, clients, payments, etc.) must belong to a specific tenant, and users must only see their own tenant's data.

### Architecture Decision: Shared Database with tenantId

We chose the **shared database** approach (vs. separate databases per tenant) because:
- Simplest to maintain — one schema, one migration path, one backup
- Most cost-effective — no database provisioning per client
- Scales well — MySQL handles millions of rows easily with indexed `tenantId` columns
- Used by Shopify, Salesforce, and most SaaS products at this scale

### What Already Exists (Partial Multi-Tenant Foundation):
- ✅ `User.tenantId` field exists in schema (nullable, not enforced)
- ✅ JWT payload already includes `tenantId`
- ✅ Auth middleware attaches `req.user` with tenantId to every request
- ❌ No `Tenant` model
- ❌ No `tenantId` on business models (products, invoices, etc.)
- ❌ No automatic query filtering by tenant
- ❌ No tenant onboarding process

### What This Epic Adds:
✅ `Tenant` model for managing client organizations
✅ `tenantId` column + index on all 35+ business models
✅ Prisma Client Extension for automatic tenantId filtering on every query
✅ AsyncLocalStorage-based per-request tenant context
✅ Migration of existing data to a default tenant
✅ Tenant onboarding script (create tenant + admin + chart of accounts + settings)
✅ Repository standardization (all repos use shared Prisma singleton)
✅ Cross-tenant isolation verified end-to-end

---

## Model Classification

### Models That Get tenantId (Business Data — 35+ models):

| Group | Models |
|-------|--------|
| Supply Chain | Supplier, Warehouse, BinLocation, PurchaseOrder, POItem, POCost |
| Inventory | Product, ProductVariant, Inventory, StockMovement, StockAdjustment, StockTransfer, StockTransferItem, StockCount, StockCountItem |
| Sales | Client, Invoice, InvoiceItem, CreditNote, CreditNoteItem |
| Payments | Payment, PaymentAllocation |
| Expenses | Expense |
| Warehouse Ops | GatePass, GatePassItem |
| Accounting | AccountHead, JournalEntry, JournalEntryLine, BankReconciliation, BankReconciliationItem, PeriodClose |
| Recovery | RecoveryVisit, PaymentPromise, Alert, AlertRule |
| Settings | SystemSetting |
| History | ChangeHistory |
| Auth | User (already has tenantId — make non-nullable) |

### Models That Stay Shared (System/Platform-Level):

| Model | Reason |
|-------|--------|
| Role | Auth roles shared across all tenants (ADMIN, SALES_OFFICER, etc.) |
| Country | Reference data |
| PaymentTerm | Reference data |
| ProductCategory | Reference data |
| Brand | Reference data |
| UnitOfMeasure | Reference data |
| AuditLog | Platform-wide audit (contains userId which links to tenant) |

---

## Stories

### Story 9.1: Tenant Model & Schema Migration

**As a** platform operator,
**I want** a Tenant model and tenantId on all business data,
**So that** each client's data is logically isolated in the shared database.

**Story File:** [docs/stories/story-9-1-tenant-model-schema.md](../stories/story-9-1-tenant-model-schema.md)

---

### Story 9.2: Prisma Client Extension & Tenant Middleware

**As a** developer,
**I want** automatic tenantId filtering on every database query,
**So that** cross-tenant data leaks are impossible even if a developer forgets to add a filter.

**Story File:** [docs/stories/story-9-2-prisma-tenant-middleware.md](../stories/story-9-2-prisma-tenant-middleware.md)

---

### Story 9.3: Repository Standardization

**As a** developer,
**I want** all repositories to use the shared Prisma singleton,
**So that** the Prisma Client Extension applies consistently across all modules.

**Story File:** [docs/stories/story-9-3-repository-standardization.md](../stories/story-9-3-repository-standardization.md)

---

### Story 9.4: Seed Script & Default Tenant Migration

**As a** platform operator,
**I want** existing data migrated to a default tenant,
**So that** current users see no difference after the migration.

**Story File:** [docs/stories/story-9-4-seed-migration-default-tenant.md](../stories/story-9-4-seed-migration-default-tenant.md)

---

### Story 9.5: Tenant Onboarding

**As a** platform admin,
**I want** a script/API to create new tenants with all required seed data,
**So that** onboarding a new client is a single command, not a manual process.

**Story File:** [docs/stories/story-9-5-tenant-onboarding.md](../stories/story-9-5-tenant-onboarding.md)

---

### Story 9.6: Tenant Isolation Testing & Verification

**As a** platform operator,
**I want** verified cross-tenant isolation,
**So that** no tenant can ever see, modify, or access another tenant's data.

**Story File:** [docs/stories/story-9-6-tenant-isolation-testing.md](../stories/story-9-6-tenant-isolation-testing.md)

---

## Epic 9 Dependencies

- **Epic 1** — Auth + JWT infrastructure (tenantId already in JWT payload)
- **Epic 5** — Chart of Accounts (must be cloned per tenant)
- **All Epics 1-8** — Business logic must continue working after adding tenantId filtering

## Epic 9 Deliverables

✅ Tenant model with name, slug, status
✅ tenantId + index on all 35+ business models
✅ Prisma Client Extension for automatic query isolation
✅ AsyncLocalStorage per-request tenant context
✅ Express middleware to enforce tenant context
✅ All repositories using shared Prisma singleton
✅ Existing data migrated to default tenant
✅ Tenant onboarding script (one command per new client)
✅ Verified cross-tenant data isolation
✅ **One deployment serves unlimited clients**

## Success Criteria

- Login as Tenant A admin → see only Tenant A data
- Login as Tenant B admin → see only Tenant B data
- Tenant A cannot access Tenant B resources by ID (returns 404, not 403)
- Creating data in Tenant A does not appear in Tenant B
- Existing data (Hisham Traders) works identically after migration
- New tenant onboarding takes < 30 seconds via script
- No cross-tenant data leaks in any module

## Links

- **Stories:** [docs/stories/](../stories/) (story-9-1 through story-9-6)
- **Prisma Extensions:** https://www.prisma.io/docs/orm/prisma-client/client-extensions
- **AsyncLocalStorage:** https://nodejs.org/api/async_context.html
