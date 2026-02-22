# Story 10.2: System Settings & Feature Toggles

**Epic:** Epic 10 - Standardized Sales, Purchasing & Inventory Flow
**Story ID:** STORY-10.2
**Priority:** High
**Estimated Effort:** 3-4 hours
**Dependencies:** Story 10.1 (Schema)
**Status:** Not Started

---

## User Story

**As an** admin,
**I want** to configure whether Sales Orders, Delivery Notes, and Purchase Invoices are required in my workflow,
**So that** I can enable the full document chain when my business is ready for it without affecting current operations.

---

## Acceptance Criteria

### 1. System Settings Entries

- [ ] `sales.requireSalesOrder` — Boolean, default `false`
  - When `true`: Invoices must reference a Sales Order
- [ ] `sales.requireDeliveryNote` — Boolean, default `false`
  - When `true`: Stock deduction happens at DN dispatch (not Invoice)
  - When `true`: COGS posted at DN dispatch (not Invoice)
- [ ] `sales.allowDirectInvoice` — Boolean, default `true`
  - When `false`: Cannot create Invoice without SO/DN source
- [ ] `purchasing.requirePurchaseInvoice` — Boolean, default `false`
  - When `true`: Supplier payments should reference a Purchase Invoice
- [ ] `sales.enableStockReservation` — Boolean, default `false`
  - When `true`: Confirming SO reserves stock (reduces available qty)

### 2. Seeding

- [ ] Settings seeded in tenant creation script (`scripts/create-tenant.ts`)
- [ ] Settings seeded in seed script for existing tenants
- [ ] All settings default to simple mode (current behavior preserved)

### 3. Settings Access

- [ ] Settings accessible via existing System Settings UI (`/settings/tax` or `/settings` page)
- [ ] Settings grouped under "Sales & Purchasing Workflow" category
- [ ] Each setting has a clear label and description
- [ ] Toggle switches for boolean settings

### 4. Settings API

- [ ] Existing `GET /api/v1/settings` returns these settings
- [ ] Existing `PUT /api/v1/settings/:key` updates settings
- [ ] Settings validation: only boolean values accepted for these keys

### 5. Settings Usage

- [ ] Helper function `getWorkflowSetting(key: string): Promise<boolean>` in `apps/api/src/utils/` or settings service
- [ ] Settings cached per-request (avoid repeated DB lookups within a single transaction)

---

## Dev Notes

### SystemSetting Model (Already Exists)

```prisma
model SystemSetting {
  id        String   @id @default(cuid())
  key       String
  value     String
  dataType  String   @default("string")  // string, number, boolean
  label     String?
  category  String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  tenantId  String

  @@unique([tenantId, key])
  @@index([tenantId])
}
```

### Settings to Seed

```typescript
const workflowSettings = [
  {
    key: 'sales.requireSalesOrder',
    value: 'false',
    dataType: 'boolean',
    label: 'Require Sales Order',
    category: 'Sales & Purchasing Workflow',
  },
  {
    key: 'sales.requireDeliveryNote',
    value: 'false',
    dataType: 'boolean',
    label: 'Require Delivery Note',
    category: 'Sales & Purchasing Workflow',
  },
  {
    key: 'sales.allowDirectInvoice',
    value: 'true',
    dataType: 'boolean',
    label: 'Allow Direct Invoice Creation',
    category: 'Sales & Purchasing Workflow',
  },
  {
    key: 'purchasing.requirePurchaseInvoice',
    value: 'false',
    dataType: 'boolean',
    label: 'Require Purchase Invoice',
    category: 'Sales & Purchasing Workflow',
  },
  {
    key: 'sales.enableStockReservation',
    value: 'false',
    dataType: 'boolean',
    label: 'Enable Stock Reservation on Sales Orders',
    category: 'Sales & Purchasing Workflow',
  },
];
```

### Helper Function

```typescript
// apps/api/src/utils/workflow-settings.ts
import { prisma } from '../lib/prisma.js';

export async function getWorkflowSetting(key: string): Promise<boolean> {
  const setting = await prisma.systemSetting.findFirst({
    where: { key },
    select: { value: true },
  });
  return setting?.value === 'true';
}
```

### Files to Modify

| File | Change |
|------|--------|
| `apps/api/scripts/create-tenant.ts` | Seed workflow settings for new tenants |
| `apps/api/prisma/seed.ts` | Seed workflow settings for existing tenants |
| `apps/api/src/utils/workflow-settings.ts` | NEW — helper function |
| `apps/web/src/features/settings/` | Add workflow settings section to existing settings page |

### Key Patterns

- Use existing `SystemSetting` model — no new tables needed
- Use `findFirst` for lookups (tenant-scoped unique constraint)
- Settings category: "Sales & Purchasing Workflow"
- All defaults preserve current behavior (zero disruption)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 1.0 | Initial story creation | Claude (AI Planning) |
