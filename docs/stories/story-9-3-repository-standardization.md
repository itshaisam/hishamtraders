# Story 9.3: Repository Standardization

**Epic:** Epic 9 - Multi-Tenant SaaS Architecture
**Story ID:** STORY-9.3
**Priority:** High
**Estimated Effort:** 2-3 hours
**Dependencies:** Story 9.2 (Prisma Extension must be in place)
**Status:** Draft -- Phase 3 (v1.0)

---

## User Story

**As a** developer,
**I want** all repositories to use the shared Prisma singleton with tenant extensions,
**So that** the automatic tenantId filtering applies consistently across all modules.

---

## Acceptance Criteria

1. **Identify All Prisma Client Usages:**
   - [ ] Audit every repository, service, and utility file for `new PrismaClient()` usage
   - [ ] Audit for direct `import { PrismaClient } from '@prisma/client'` usage
   - [ ] Document each instance that bypasses the shared singleton

2. **Known Offenders (from codebase exploration):**
   **Must fix (business logic — tenant filtering required):**
   - [ ] `apps/api/src/modules/products/products.repository.ts`
   - [ ] `apps/api/src/modules/suppliers/suppliers.repository.ts`
   - [ ] `apps/api/src/modules/warehouses/warehouses.repository.ts`
   - [ ] `apps/api/src/modules/variants/variants.repository.ts`
   - [ ] `apps/api/src/modules/inventory/inventory.repository.ts`
   - [ ] `apps/api/src/modules/inventory/inventory.service.ts`
   - [ ] `apps/api/src/modules/inventory/stock-movement.repository.ts`
   - [ ] `apps/api/src/modules/inventory/stock-adjustment.repository.ts`
   - [ ] `apps/api/src/modules/inventory/stock-adjustment.service.ts`
   - [ ] `apps/api/src/modules/inventory/stock-receipt.service.ts`
   - [ ] `apps/api/src/modules/invoices/invoices.controller.ts`
   - [ ] `apps/api/src/modules/credit-notes/credit-notes.controller.ts`
   - [ ] `apps/api/src/modules/payments/payments.service.ts`
   - [ ] `apps/api/src/modules/payments/payments.repository.ts`
   - [ ] `apps/api/src/modules/purchase-orders/purchase-orders.routes.ts`
   - [ ] `apps/api/src/modules/reports/reports.controller.ts`
   - [ ] `apps/api/src/modules/settings/settings.controller.ts`
   - [ ] `apps/api/src/middleware/authorization.middleware.ts`
   - [ ] `apps/api/src/modules/warehouses/warehouses.middleware.ts`
   - [ ] `apps/api/src/modules/purchase-orders/purchase-orders.middleware.ts`

   **OK to keep (system scripts — run outside HTTP context):**
   - `apps/api/src/lib/prisma.ts` — the singleton itself
   - `apps/api/src/scripts/seed.ts` — system seed script
   - `apps/api/src/scripts/seed-demo.ts` — demo data script
   - `apps/api/src/scripts/migrate-to-gl.ts` — one-time migration

3. **Standardize All Repositories:**
   - [ ] Replace `new PrismaClient()` with `import { prisma } from '../../lib/prisma.js'`
   - [ ] Remove `PrismaClient` from `@prisma/client` imports (keep only types/enums)
   - [ ] Repositories that accept `PrismaClient` in constructor: change to accept the extended client type or use the singleton directly

4. **Repository Constructor Patterns:**
   - [ ] **Pattern A (Direct import):** Repositories that import `prisma` directly from `lib/prisma.ts` — no changes needed
   - [ ] **Pattern B (Constructor injection):** Repositories that receive `PrismaClient` via constructor — update constructor type to `ExtendedPrismaClient` or switch to Pattern A
   - [ ] **Pattern C (New instance):** Repositories that create `new PrismaClient()` — must switch to Pattern A or B

5. **Verify No Regressions:**
   - [ ] `npx tsc --noEmit` passes with zero errors
   - [ ] All existing API endpoints still work (manual smoke test)
   - [ ] Prisma Extension applies to every query (verify via debug logging)

6. **Transaction Compatibility:**
   - [ ] `prisma.$transaction()` works with the extended client
   - [ ] Transaction callbacks receive a compatible client type
   - [ ] AutoJournalService, payments, stock receiving — all transaction-heavy flows work

---

## Dev Notes

### How to Find All Instances

```bash
# Find all files importing PrismaClient directly
grep -r "new PrismaClient" apps/api/src/ --include="*.ts"
grep -r "from '@prisma/client'" apps/api/src/ --include="*.ts" | grep "PrismaClient"
```

### Fix Pattern: products.repository.ts

**Before:**
```typescript
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ProductsRepository {
  async findAll(filters) {
    return prisma.product.findMany({ where: filters });
  }
}
```

**After:**
```typescript
import { prisma } from '../../lib/prisma.js';

export class ProductsRepository {
  async findAll(filters) {
    return prisma.product.findMany({ where: filters });
    // ↑ Prisma Extension automatically adds: AND tenantId = '<current-tenant>'
  }
}
```

### Fix Pattern: Constructor-Injected Repositories

Some repositories receive PrismaClient via constructor (e.g., `PurchaseOrderRepository`):

**Before:**
```typescript
export class PurchaseOrderRepository {
  constructor(private prisma: PrismaClient) {}
}
```

**After (Option A — use singleton directly):**
```typescript
import { prisma } from '../../lib/prisma.js';

export class PurchaseOrderRepository {
  // Remove constructor, use imported prisma directly
  async findAll() {
    return prisma.purchaseOrder.findMany({...});
  }
}
```

**After (Option B — keep injection, update type):**
```typescript
import { ExtendedPrismaClient } from '../../lib/prisma.js';

export class PurchaseOrderRepository {
  constructor(private prisma: ExtendedPrismaClient) {}
}
```

> **Recommendation:** Option A is simpler and avoids type gymnastics. Since we have a singleton with extensions, there's no benefit to constructor injection.

### Transaction Type Compatibility

The extended Prisma client's `$transaction` returns a `Prisma.TransactionClient` which does NOT include extensions. This means:

- Inside `prisma.$transaction(async (tx) => { ... })`, the `tx` client does **NOT** have the extension
- **This is fine** because the tenant context is still available via AsyncLocalStorage
- For the extension to work inside transactions, we need to handle this in the extension itself (check if the operation is already inside a transaction context)

**Alternative approach:** If extension doesn't apply inside `$transaction`, manually add tenantId in transaction blocks:

```typescript
const store = tenantContext.getStore();
await prisma.$transaction(async (tx) => {
  await tx.product.create({
    data: { ...productData, tenantId: store!.tenantId }
  });
});
```

> **Decision needed during implementation:** Test whether the Prisma extension applies inside `$transaction` callbacks. If not, transaction-heavy code (AutoJournalService, stock receiving, payments) needs manual tenantId injection.

### Files to Modify (20 files — full audit)

**Repositories (direct `new PrismaClient()`):**
- `apps/api/src/modules/products/products.repository.ts`
- `apps/api/src/modules/suppliers/suppliers.repository.ts`
- `apps/api/src/modules/warehouses/warehouses.repository.ts`
- `apps/api/src/modules/variants/variants.repository.ts`
- `apps/api/src/modules/inventory/inventory.repository.ts`
- `apps/api/src/modules/inventory/stock-movement.repository.ts`
- `apps/api/src/modules/inventory/stock-adjustment.repository.ts`
- `apps/api/src/modules/payments/payments.repository.ts`

**Services (direct `new PrismaClient()`):**
- `apps/api/src/modules/inventory/inventory.service.ts`
- `apps/api/src/modules/inventory/stock-receipt.service.ts`
- `apps/api/src/modules/inventory/stock-adjustment.service.ts`
- `apps/api/src/modules/payments/payments.service.ts`

**Controllers (direct `new PrismaClient()`):**
- `apps/api/src/modules/invoices/invoices.controller.ts`
- `apps/api/src/modules/credit-notes/credit-notes.controller.ts`
- `apps/api/src/modules/reports/reports.controller.ts`
- `apps/api/src/modules/settings/settings.controller.ts`

**Route files & middleware (direct `new PrismaClient()`):**
- `apps/api/src/modules/purchase-orders/purchase-orders.routes.ts`
- `apps/api/src/modules/purchase-orders/purchase-orders.middleware.ts`
- `apps/api/src/modules/warehouses/warehouses.middleware.ts`
- `apps/api/src/middleware/authorization.middleware.ts`

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-14 | 1.0 | Initial story creation | Claude (Tech Review) |
