# Story 3.10: Tax Rate Configuration

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.10
**Priority:** Medium
**Estimated Effort:** 2-3 hours (backend already implemented, frontend + audit remaining)
**Dependencies:** Story 3.5 (Tax Calculation on Sales)
**Status:** Implemented

---

## User Story

**As an** admin,
**I want** a settings page to manage tax rates for both sales and purchases,
**So that** I can easily update the tax percentages and have them apply correctly with separate accounting.

---

## Implementation Summary

### Sales Tax (Original Scope — Complete)

- **Setting:** `TAX_RATE` (key in SystemSetting)
- **Default:** 18%
- **API:** `GET/PUT /api/v1/settings/tax-rate`
- **Used by:** Invoice creation (`invoices.service.ts`) — snapshots rate on each invoice
- **Account:** `2200 Tax Payable` (LIABILITY — you owe government)
- **Frontend:** Tax tab in unified System Settings page (`/settings?tab=tax`)

### Purchase Tax (NEW — Added 2026-02-25)

- **Setting:** `PURCHASE_TAX_RATE` (key in SystemSetting)
- **Default:** 0% (no purchase tax by default)
- **API:** `GET/PUT /api/v1/settings/purchase-tax-rate`
- **Used by:** PO creation (`purchase-orders.repository.ts`) — snapshots rate on each PO
- **Account:** `1350 Input Tax Receivable` (ASSET — government owes you)
- **Frontend:** Tax tab shows both rates with account mapping summary

### Why Separate Rates + Accounts

Previously, the system had a single `TAX_RATE` used for both sales invoices and purchase orders. This was incorrect because:

1. **Different rates**: Sales tax and purchase/import tax rates may differ
2. **Different accounting**: Sales tax is a LIABILITY (you collect and owe to govt), purchase input tax is an ASSET (you paid and govt owes you back)
3. **Mixing them in one account (2200)** made it impossible to track input tax credits

**After the fix:**

| Transaction | Tax Rate Setting | Account | Account Type |
|-------------|-----------------|---------|-------------|
| Sales Invoice | `TAX_RATE` | `2200 Tax Payable` | LIABILITY |
| Purchase Order / GRN | `PURCHASE_TAX_RATE` | `1350 Input Tax Receivable` | ASSET |
| GRN Reversal | PO's stored `taxRate` | `1350 Input Tax Receivable` | ASSET (reversed) |

---

## Acceptance Criteria

### Sales Tax Rate

1. **System Configuration:**
   - [x] `SystemSetting` record with key `TAX_RATE`, default `18`
   - [x] Fallback to 18% if record missing or invalid

2. **Backend API:**
   - [x] `GET /api/v1/settings/tax-rate` → `{ success: true, data: { taxRate: number } }`
   - [x] `PUT /api/v1/settings/tax-rate` — Admin only, validates 0-100

3. **Frontend:**
   - [x] Editable in Tax tab of System Settings page
   - [x] `useGetTaxRate()` hook fetches current rate
   - [x] Invoice creation page uses fetched rate (not hardcoded)

### Purchase Tax Rate (NEW)

4. **System Configuration:**
   - [x] `SystemSetting` record with key `PURCHASE_TAX_RATE`, default `0`
   - [x] Seeded in `create-tenant.ts` with label "Purchase Tax Rate (%)"
   - [x] Fallback to 0% if record missing or invalid

5. **Backend API:**
   - [x] `GET /api/v1/settings/purchase-tax-rate` → `{ success: true, data: { purchaseTaxRate: number } }`
   - [x] `PUT /api/v1/settings/purchase-tax-rate` — Admin only, validates 0-100

6. **PO Integration:**
   - [x] `purchase-orders.repository.ts` calls `getPurchaseTaxRate()` (NOT `getTaxRate()`)
   - [x] PO form (`POForm.tsx`) uses `useGetPurchaseTaxRate()` hook
   - [x] Rate is snapshotted on PO at creation time (stored in `purchaseOrder.taxRate`)

7. **GRN Accounting Fix:**
   - [x] `auto-journal.service.ts` → `onGoodsReceived()`: DR `1350 Input Tax Receivable` (was `2200`)
   - [x] `auto-journal.service.ts` → `onGoodsReceivedReversed()`: CR `1350 Input Tax Receivable` (was `2200`)
   - [x] Sales invoice journal entries unchanged — still use `2200 Tax Payable`

8. **Account Seeding:**
   - [x] `1350 Input Tax Receivable` (ASSET, parent: `1000`) seeded in `create-tenant.ts`
   - [x] Marked as `isSystemAccount: true`

### Shared

9. **Authorization:**
   - [x] Only `ADMIN` role can update tax rates
   - [x] Audit logging on both rate changes

10. **Frontend — Tax Tab:**
    - [x] Shows both Sales Tax Rate and Purchase Tax Rate inputs
    - [x] Account mapping summary (info box) explaining which account each rate maps to
    - [x] Save buttons with toast notifications

---

## Files Modified/Created

### Backend — Purchase Tax Rate

| File | Change |
|------|--------|
| `apps/api/src/modules/settings/settings.service.ts` | Added `getPurchaseTaxRate()` method, added `PURCHASE_TAX_RATE` to `initializeDefaults()` |
| `apps/api/src/modules/settings/settings.controller.ts` | Added `getPurchaseTaxRate` + `updatePurchaseTaxRate` handlers |
| `apps/api/src/modules/settings/settings.routes.ts` | Added `GET/PUT /purchase-tax-rate` |
| `apps/api/src/modules/purchase-orders/purchase-orders.repository.ts` | Changed `getTaxRate()` → `getPurchaseTaxRate()` |
| `apps/api/src/services/auto-journal.service.ts` | `onGoodsReceived` + `onGoodsReceivedReversed`: account `2200` → `1350` for tax lines |
| `apps/api/src/scripts/create-tenant.ts` | Seed `1350 Input Tax Receivable` account + `PURCHASE_TAX_RATE` setting, renamed TAX_RATE label to "Sales Tax Rate (%)" |

### Frontend — Purchase Tax Rate

| File | Change |
|------|--------|
| `apps/web/src/services/settingsService.ts` | Added `getPurchaseTaxRate()` + `updatePurchaseTaxRate()` |
| `apps/web/src/hooks/useSettings.ts` | Added `useGetPurchaseTaxRate()` + `useUpdatePurchaseTaxRate()` |
| `apps/web/src/features/purchase-orders/components/POForm.tsx` | Changed `useGetTaxRate` → `useGetPurchaseTaxRate` |
| `apps/web/src/features/settings/pages/TaxSettingsPage.tsx` | Tax tab shows both rates with account mapping |

---

## Dev Notes

### Migration Note for Existing Tenants

- Existing POs already store `taxRate` on the PO record, so old POs are unaffected
- GRN accounting for **future** receipts will use `1350` instead of `2200`
- No backfill of old journal entries — going forward only
- The `1350` account needs to be created for existing tenants (run `create-tenant` or manual insert)
- The `PURCHASE_TAX_RATE` setting needs to be created for existing tenants (will auto-initialize via `initializeDefaults()`)

### SettingsService Cache

Both `getTaxRate()` and `getPurchaseTaxRate()` use the same 5-minute in-memory cache in `SettingsService`. After an admin updates a tax rate via the UI, it may take up to 5 minutes for the new rate to take effect in PO/Invoice creation. The cache is per-process (not shared across workers).

### Business Logic

- When an admin updates a tax rate, the new rate only applies to documents created **after** the change
- Existing invoices/POs are not affected — the tax amount and rate are snapshotted at creation time
- Invoice: `Invoice.taxRate` + `Invoice.taxAmount`
- PO: `PurchaseOrder.taxRate` + `PurchaseOrder.taxAmount`

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-15 | 1.0 | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0 | Revised: updated to reflect existing backend implementation. Corrected model name, key name, default value. | Doc Revision |
| 2026-02-10 | 2.1 | Fix: API paths, mark audit logging as complete. | Doc Revision |
| 2026-02-25 | 3.0 | **IMPLEMENTED**: Added Purchase Tax Rate (`PURCHASE_TAX_RATE`) with separate accounting (`1350 Input Tax Receivable`). Fixed PO creation to use purchase tax rate. Fixed GRN journal entries to use `1350` instead of `2200`. Added frontend hooks and PO form fix. Updated Tax tab in unified settings page. | Claude (Implementation) |
