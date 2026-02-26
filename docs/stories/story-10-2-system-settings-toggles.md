# Story 10.2: System Settings & Feature Toggles

**Epic:** Epic 10 - Standardized Sales, Purchasing & Inventory Flow
**Story ID:** STORY-10.2
**Priority:** High
**Estimated Effort:** 3-4 hours
**Dependencies:** Story 10.1 (Schema)
**Status:** Completed

---

## User Story

**As an** admin,
**I want** to configure whether Sales Orders, Delivery Notes, and Purchase Invoices are required in my workflow,
**So that** I can enable the full document chain when my business is ready for it without affecting current operations.

---

## Implementation Summary

### What Was Built

1. **5 workflow toggle settings** seeded via tenant creation, defaulting to "simple mode" (all off)
2. **Backend enforcement** — settings are actually enforced in service layers (not just informational)
3. **Frontend enforcement** — warning banners on CreateInvoicePage and RecordSupplierPaymentPage
4. **Unified Settings UI** — workflow toggles live in the Workflow tab of `/settings` (merged into Story 8.7's unified page)
5. **Shared hook** — `useWorkflowSettings()` for any frontend page to check settings
6. **Cached lookups** — `getWorkflowSetting()` uses SettingsService's 5-min in-memory cache

### Enforcement Matrix

| Setting | Where Enforced | Effect When ON |
|---------|---------------|----------------|
| `sales.requireSalesOrder` | `invoices.service.ts` | Invoice creation throws `BadRequestError` if no `salesOrderId` |
| `sales.requireDeliveryNote` | `invoices.service.ts` | Invoice creation throws `BadRequestError` if no `deliveryNoteId` |
| `sales.allowDirectInvoice` | `invoices.service.ts` | When `false`, invoice creation requires either SO or DN |
| `purchasing.requirePurchaseInvoice` | `payments.service.ts` | Supplier payment throws error if `paymentReferenceType !== PURCHASE_INVOICE` |
| `sales.enableStockReservation` | **NOT ENFORCED** | Deferred — requires `reservedQuantity` field on Inventory model (schema migration) |

### Toggle Safety

- All settings default to `false` (`allowDirectInvoice` defaults to `true`) — **simple mode** preserves current behavior
- Settings can be toggled on/off at any time — only affects **new** documents
- Existing invoices/payments are not affected by toggle changes
- Error messages tell the user what to do AND how to change the setting

---

## Acceptance Criteria

### 1. System Settings Entries

- [x] `sales.requireSalesOrder` — Boolean, default `false`
  - When `true`: Invoice creation blocked without `salesOrderId` (backend throws `BadRequestError`)
- [x] `sales.requireDeliveryNote` — Boolean, default `false`
  - When `true`: Invoice creation blocked without `deliveryNoteId` (backend throws `BadRequestError`)
- [x] `sales.allowDirectInvoice` — Boolean, default `true`
  - When `false`: Invoice creation blocked without SO or DN
- [x] `purchasing.requirePurchaseInvoice` — Boolean, default `false`
  - When `true`: Supplier payments must use `PURCHASE_INVOICE` reference type (backend throws error)
- [x] `sales.enableStockReservation` — Boolean, default `false`
  - Toggle exists in UI but enforcement deferred (needs schema migration)

### 2. Seeding

- [x] Settings seeded in tenant creation script (`scripts/create-tenant.ts`)
- [x] All settings default to simple mode (current behavior preserved)

### 3. Settings Access

- [x] Settings accessible via unified System Settings page (`/settings?tab=workflow`)
- [x] Settings grouped under "Sales & Purchasing Workflow" category
- [x] Each setting has a clear label and description
- [x] Toggle switches (checkbox) for boolean settings
- [x] Mode indicator: "Simple Mode" vs "Managed Mode" based on toggle state

### 4. Settings API

- [x] `GET /api/v1/settings/workflow` returns all 5 settings as a keyed object
- [x] `PUT /api/v1/settings/workflow` updates settings (batch)
- [x] Settings validation: only boolean values accepted

### 5. Settings Usage (Backend)

- [x] `getWorkflowSetting(key: string): Promise<boolean>` in `apps/api/src/utils/workflow-settings.ts`
- [x] `getWorkflowSettings(): Promise<Record<string, boolean>>` for batch fetch
- [x] Uses `SettingsService` (5-min in-memory cache) — NOT raw DB queries

### 6. Frontend Enforcement UI

- [x] **CreateInvoicePage** — Amber warning banner when SO/DN required, with links to Sales Orders / Delivery Notes pages and link to Settings page
- [x] **RecordSupplierPaymentPage** — When `requirePurchaseInvoice` is on:
  - Amber warning banner explaining PI is required
  - Payment type dropdown locked to "Against Purchase Invoice"
  - Purchase Invoice dropdown (filtered by supplier) appears
  - `PURCHASE_INVOICE` added to frontend `PaymentReferenceType` enum

---

## Files Modified/Created

### Backend

| File | Change |
|------|--------|
| `apps/api/src/utils/workflow-settings.ts` | **REWRITTEN** — Uses SettingsService (cached) instead of raw `prisma.systemSetting.findFirst()`. Added `getWorkflowSettings()` batch function |
| `apps/api/src/modules/invoices/invoices.service.ts` | Added enforcement: `requireSalesOrder`, `requireDeliveryNote`, `allowDirectInvoice` checks before invoice creation |
| `apps/api/src/modules/payments/payments.service.ts` | Added enforcement: `requirePurchaseInvoice` check in `createSupplierPayment()` |

### Frontend

| File | Change |
|------|--------|
| `apps/web/src/hooks/useWorkflowSettings.ts` | **NEW** — Shared TanStack Query hook for reading workflow settings |
| `apps/web/src/features/invoices/pages/CreateInvoicePage.tsx` | Added workflow enforcement banner (amber) when SO/DN required |
| `apps/web/src/features/payments/pages/RecordSupplierPaymentPage.tsx` | Added PI enforcement banner, Purchase Invoice dropdown, locked payment type when PI required |
| `apps/web/src/types/payment.types.ts` | Added `PURCHASE_INVOICE` to `PaymentReferenceType` enum |
| `apps/web/src/features/settings/pages/TaxSettingsPage.tsx` | Workflow tab merged here (see Story 8.7) |
| `apps/web/src/components/Sidebar.tsx` | Single "System Settings" link |
| `apps/web/src/App.tsx` | Removed `/settings/workflow` route (merged into `/settings`) |

---

## Dev Notes

### workflow-settings.ts — Before vs After

**Before (raw DB, no cache):**
```typescript
import { prisma } from '../lib/prisma.js';
export async function getWorkflowSetting(key: string): Promise<boolean> {
  const setting = await prisma.systemSetting.findFirst({ where: { key } });
  return setting?.value === 'true';
}
```

**After (SettingsService, 5-min cache):**
```typescript
import { SettingsService } from '../modules/settings/settings.service.js';
import { prisma } from '../lib/prisma.js';
const settingsService = new SettingsService(prisma);
export async function getWorkflowSetting(key: string): Promise<boolean> {
  const value = await settingsService.getSetting(key);
  return value === 'true';
}
export async function getWorkflowSettings(): Promise<Record<string, boolean>> {
  const keys = ['sales.requireSalesOrder', 'sales.requireDeliveryNote', 'sales.allowDirectInvoice', 'purchasing.requirePurchaseInvoice', 'sales.enableStockReservation'];
  const result: Record<string, boolean> = {};
  for (const key of keys) { result[key] = await getWorkflowSetting(key); }
  return result;
}
```

### Stock Reservation — Why Deferred

`sales.enableStockReservation` requires:
1. A `reservedQuantity` field on the `Inventory` model (schema migration)
2. Reserve logic when SO is confirmed
3. Release logic when SO is cancelled or fulfilled
4. Available quantity = `quantity - reservedQuantity`
5. Impact on all inventory checks across the system

This is too complex to add as a toggle — it needs its own story with proper design.

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 1.0 | Initial story creation | Claude (AI Planning) |
| 2026-02-25 | 2.0 | **IMPLEMENTED**: Added backend enforcement (invoices + payments), frontend enforcement banners, rewritten workflow-settings.ts with caching, shared useWorkflowSettings hook, unified settings page, PURCHASE_INVOICE in frontend enum. Documented enforcement matrix and stock reservation deferral. | Claude (Implementation) |
