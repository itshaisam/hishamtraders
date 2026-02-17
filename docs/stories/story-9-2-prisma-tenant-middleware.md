# Story 9.2: Prisma Client Extension & Tenant Middleware

**Epic:** Epic 9 - Multi-Tenant SaaS Architecture
**Story ID:** STORY-9.2
**Priority:** Critical
**Estimated Effort:** 3-4 hours
**Dependencies:** Story 9.1 (schema must have tenantId columns)
**Status:** Draft -- Phase 3 (v1.0)

---

## User Story

**As a** developer,
**I want** automatic tenantId filtering on every database query,
**So that** cross-tenant data leaks are impossible even if a developer forgets to add a filter.

---

## Acceptance Criteria

1. **Prisma Client Extension:**
   - [ ] Replace plain `PrismaClient` in `apps/api/src/lib/prisma.ts` with extended client
   - [ ] Extension intercepts all operations (`findMany`, `findFirst`, `findUnique`, `count`, `aggregate`, `groupBy`, `create`, `createMany`, `update`, `updateMany`, `delete`, `deleteMany`)
   - [ ] Auto-injects `tenantId` into `where` clause for reads
   - [ ] Auto-injects `tenantId` into `data` for creates
   - [ ] Auto-injects `tenantId` into `where` clause for updates/deletes
   - [ ] Only applies to tenant-scoped models (not Role, Country, PaymentTerm, etc.)
   - [ ] Skips filtering when no tenant context exists (seed scripts, system operations)

2. **AsyncLocalStorage Tenant Context:**
   - [ ] `tenantContext` exported from `apps/api/src/lib/prisma.ts` using Node.js `AsyncLocalStorage`
   - [ ] Stores `{ tenantId: string }` per async execution context (per HTTP request)
   - [ ] Automatically propagated through async/await chains (no manual passing needed)

3. **Express Tenant Middleware:**
   - [ ] New file: `apps/api/src/middleware/tenant.middleware.ts`
   - [ ] Reads `req.user.tenantId` (set by auth middleware)
   - [ ] Wraps the request handler in `tenantContext.run({ tenantId }, next)`
   - [ ] Returns 403 if `req.user` exists but `tenantId` is missing
   - [ ] Skipped for unauthenticated routes (login, health, public endpoints)

4. **Integration in Express App:**
   - [ ] Tenant middleware added in `apps/api/src/index.ts` after auth middleware, before routes
   - [ ] Order: cors → helmet → auth → **tenant** → audit → routes

5. **Transaction Support:**
   - [ ] Prisma `$transaction` calls inherit the tenant context from AsyncLocalStorage
   - [ ] Interactive transactions (`prisma.$transaction(async (tx) => {...})`) work correctly
   - [ ] No manual tenantId passing needed inside transactions

6. **Type Safety:**
   - [ ] Extended Prisma client maintains full TypeScript type safety
   - [ ] No `as any` casts required in consuming code
   - [ ] `prisma.$transaction()` returns correctly typed transaction client

---

## Dev Notes

### Prisma Client Extension Implementation

**File:** `apps/api/src/lib/prisma.ts`

```typescript
import { Prisma, PrismaClient } from '@prisma/client';
import { AsyncLocalStorage } from 'node:async_hooks';
import logger from './logger.js';

// Per-request tenant context using AsyncLocalStorage
export const tenantContext = new AsyncLocalStorage<{ tenantId: string }>();

// Models that require tenantId filtering
const TENANT_SCOPED_MODELS = new Set([
  'Supplier', 'Warehouse', 'BinLocation',
  'Product', 'ProductVariant',
  'PurchaseOrder', 'POItem', 'POCost',
  'Inventory', 'StockMovement', 'StockAdjustment',
  'StockTransfer', 'StockTransferItem',
  'StockCount', 'StockCountItem',
  'Client', 'Invoice', 'InvoiceItem',
  'CreditNote', 'CreditNoteItem',
  'Payment', 'PaymentAllocation',
  'Expense',
  'GatePass', 'GatePassItem',
  'AccountHead', 'JournalEntry', 'JournalEntryLine',
  'BankReconciliation', 'BankReconciliationItem', 'PeriodClose',
  'RecoveryVisit', 'PaymentPromise',
  'Alert', 'AlertRule',
  'SystemSetting', 'ChangeHistory',
  'User',
]);

const READ_OPS = new Set([
  'findMany', 'findFirst', 'findUnique', 'findFirstOrThrow', 'findUniqueOrThrow',
  'count', 'aggregate', 'groupBy',
]);
const CREATE_OPS = new Set(['create', 'createMany', 'createManyAndReturn']);
const MUTATE_OPS = new Set(['update', 'updateMany', 'delete', 'deleteMany', 'upsert']);

const basePrisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development'
    ? [{ emit: 'event', level: 'query' }]
    : [],
});

export const prisma = basePrisma.$extends({
  query: {
    $allOperations({ model, operation, args, query }) {
      // Skip non-tenant-scoped models
      if (!model || !TENANT_SCOPED_MODELS.has(model)) {
        return query(args);
      }

      const store = tenantContext.getStore();
      // No tenant context = system operation (seed, migration) — skip filtering
      if (!store?.tenantId) {
        return query(args);
      }

      const tenantId = store.tenantId;

      // READ operations: inject tenantId into where clause
      if (READ_OPS.has(operation)) {
        args.where = { ...args.where, tenantId };
      }

      // CREATE operations: inject tenantId into data
      if (CREATE_OPS.has(operation)) {
        if (operation === 'createMany' || operation === 'createManyAndReturn') {
          if (Array.isArray(args.data)) {
            args.data = args.data.map((d: any) => ({ ...d, tenantId }));
          }
        } else {
          args.data = { ...args.data, tenantId };
        }
      }

      // UPDATE/DELETE operations: inject tenantId into where clause
      if (MUTATE_OPS.has(operation)) {
        if (operation === 'upsert') {
          args.where = { ...args.where, tenantId };
          args.create = { ...args.create, tenantId };
        } else {
          args.where = { ...args.where, tenantId };
        }
      }

      return query(args);
    },
  },
});

export type ExtendedPrismaClient = typeof prisma;
```

### Tenant Middleware

**File:** `apps/api/src/middleware/tenant.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { tenantContext } from '../lib/prisma.js';

/**
 * Wraps the request in a tenant context using AsyncLocalStorage.
 * Must be placed AFTER auth middleware (needs req.user.tenantId).
 * Skipped for unauthenticated routes (auth middleware sets req.user = undefined).
 */
export function tenantMiddleware(req: Request, res: Response, next: NextFunction) {
  // If no authenticated user, skip (public routes like login, health)
  if (!req.user) {
    return next();
  }

  // Authenticated user MUST have a tenantId
  if (!req.user.tenantId) {
    return res.status(403).json({
      success: false,
      message: 'User has no tenant assigned. Contact administrator.',
    });
  }

  // Run the rest of the request inside the tenant context
  tenantContext.run({ tenantId: req.user.tenantId }, () => {
    next();
  });
}
```

### Integration in Express App

**File:** `apps/api/src/index.ts`

Add after the auth middleware block:

```typescript
import { tenantMiddleware } from './middleware/tenant.middleware.js';

// ... existing middleware ...

// Auth middleware (existing)
app.use((req, res, next) => {
  // ... existing auth logic ...
});

// Tenant context middleware (NEW — must be after auth)
app.use(tenantMiddleware);

// Audit middleware (existing)
app.use(auditMiddleware);
```

### How AsyncLocalStorage Works

```
Request comes in
  → Auth middleware: extracts JWT → sets req.user.tenantId = "tenant-abc"
  → Tenant middleware: tenantContext.run({ tenantId: "tenant-abc" }, next)
    → Route handler calls service
      → Service calls repository
        → Repository calls prisma.product.findMany({ where: { status: 'ACTIVE' } })
          → Prisma Extension intercepts:
            - Reads tenantContext.getStore() → { tenantId: "tenant-abc" }
            - Modifies: where: { status: 'ACTIVE', tenantId: "tenant-abc" }
          → MySQL query: SELECT * FROM products WHERE status = 'ACTIVE' AND tenantId = 'tenant-abc'
```

No code changes needed in services, repositories, or controllers. The extension handles it all.

### Edge Cases

1. **Seed scripts:** Run outside HTTP request context → `tenantContext.getStore()` returns `undefined` → extension skips filtering → seeds can write to any tenant
2. **Cron jobs / background tasks:** Must explicitly set tenant context if they access tenant data:
   ```typescript
   tenantContext.run({ tenantId: 'some-tenant-id' }, async () => {
     await someService.doWork();
   });
   ```
3. **Public routes (login, health):** Auth middleware doesn't set `req.user` → tenant middleware skips → no filtering (correct behavior for login which queries User by email globally)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-14 | 1.0 | Initial story creation | Claude (Tech Review) |
