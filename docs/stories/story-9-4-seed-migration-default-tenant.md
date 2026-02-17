# Story 9.4: Seed Script & Default Tenant Migration

**Epic:** Epic 9 - Multi-Tenant SaaS Architecture
**Story ID:** STORY-9.4
**Priority:** High
**Estimated Effort:** 2-3 hours
**Dependencies:** Story 9.1 (Tenant model + tenantId columns exist)
**Status:** Draft -- Phase 3 (v1.0)

---

## User Story

**As a** platform operator,
**I want** existing data migrated to a default tenant and seed scripts updated,
**So that** current users see no difference after the multi-tenant migration.

---

## Acceptance Criteria

1. **Base Seed Creates Default Tenant:**
   - [ ] `seed.ts` creates a default tenant record before creating any other data
   - [ ] Default tenant: `id: 'default-tenant'`, `name: 'Hisham Traders'`, `slug: 'hisham-traders'`
   - [ ] Uses `upsert` to be idempotent (safe to re-run)

2. **Base Seed Assigns tenantId to All Business Data:**
   - [ ] Admin user created with `tenantId: 'default-tenant'`
   - [ ] All AccountHead records (chart of accounts) created with `tenantId: 'default-tenant'`
   - [ ] All SystemSetting records created with `tenantId: 'default-tenant'`

3. **Demo Seed Updated:**
   - [ ] `seed-demo.ts` receives or uses `tenantId: 'default-tenant'` for all business data
   - [ ] All suppliers, products, clients, invoices, payments, etc. get tenantId
   - [ ] Journal entries and accounting data get tenantId

4. **Existing Data Migration:**
   - [ ] All existing records in production DB have `tenantId = 'default-tenant'` (handled by SQL migration DEFAULT in Story 9.1)
   - [ ] Verify no NULL tenantId values remain after migration

5. **Reference Data Stays Shared:**
   - [ ] Roles: no tenantId, shared across all tenants
   - [ ] Countries, PaymentTerms, ProductCategories, Brands, UOMs: no tenantId
   - [ ] These are seeded once globally, not per tenant

6. **Database Reset Works Clean:**
   - [ ] `prisma migrate reset --force` + `pnpm db:seed` produces a working single-tenant instance
   - [ ] `pnpm db:seed:demo` adds demo data with correct tenantId

---

## Dev Notes

### Seed Script Changes

**File:** `apps/api/src/scripts/seed.ts`

Add at the top (before creating users):

```typescript
// ============ Create Default Tenant ============
console.log('\n🏢 Creating default tenant...');
const defaultTenant = await prisma.tenant.upsert({
  where: { id: 'default-tenant' },
  update: {},
  create: {
    id: 'default-tenant',
    name: 'Hisham Traders',
    slug: 'hisham-traders',
    status: 'active',
  },
});
console.log('  ✓ Default tenant created');
```

Update admin user creation:
```typescript
const adminUser = await prisma.user.upsert({
  where: { email: 'admin@admin.com' },
  update: {},
  create: {
    email: 'admin@admin.com',
    passwordHash: await bcrypt.hash('admin123', 10),
    name: 'System Administrator',
    roleId: adminRole.id,
    tenantId: 'default-tenant', // <-- ADD THIS
  },
});
```

Update AccountHead creation (composite unique key):
```typescript
// IMPORTANT: After Story 9.1, unique changes from @unique([code]) to @@unique([tenantId, code])
// Prisma upsert requires the composite unique in the where clause
await prisma.accountHead.upsert({
  where: {
    tenantId_code: {           // <-- Composite unique key
      tenantId: 'default-tenant',
      code: '1101',
    },
  },
  update: {},
  create: {
    code: '1101',
    name: 'Main Bank Account',
    accountType: 'ASSET',
    balance: 0,
    isActive: true,
    tenantId: 'default-tenant',
  },
});
```

Update SystemSetting creation (composite unique key):
```typescript
// IMPORTANT: After Story 9.1, unique changes from @unique([key]) to @@unique([tenantId, key])
await prisma.systemSetting.upsert({
  where: {
    tenantId_key: {            // <-- Composite unique key
      tenantId: 'default-tenant',
      key: 'TAX_RATE',
    },
  },
  update: {},
  create: {
    key: 'TAX_RATE',
    value: '18',
    dataType: 'number',
    label: 'Default Tax Rate (%)',
    category: 'tax',
    tenantId: 'default-tenant', // <-- ADD THIS
  },
});
```

### Demo Seed Changes

**File:** `apps/api/src/scripts/seed-demo.ts`

Add a constant at the top:
```typescript
const TENANT_ID = 'default-tenant';
```

Add `tenantId: TENANT_ID` to every `create` call for business data:
- Suppliers, Warehouses, BinLocations
- Products, ProductVariants
- Clients, Invoices, InvoiceItems
- PurchaseOrders, POItems
- Inventory records, StockMovements
- Payments, PaymentAllocations
- Expenses, GatePasses
- RecoveryVisits, PaymentPromises, Alerts, AlertRules
- JournalEntries, JournalEntryLines

### Verification After Migration

Run on the production server after deploying:

```bash
# Check no NULL tenantIds remain
mysql -e "SELECT 'suppliers' as t, COUNT(*) FROM suppliers WHERE tenantId IS NULL
UNION ALL SELECT 'products', COUNT(*) FROM products WHERE tenantId IS NULL
UNION ALL SELECT 'clients', COUNT(*) FROM clients WHERE tenantId IS NULL
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices WHERE tenantId IS NULL
UNION ALL SELECT 'users', COUNT(*) FROM users WHERE tenantId IS NULL;"
```

All counts should be 0.

### Idempotency

The seed script must be idempotent — safe to run multiple times without creating duplicates. Use `upsert` for tenant creation and all business data that has unique constraints.

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-14 | 1.0 | Initial story creation | Claude (Tech Review) |
