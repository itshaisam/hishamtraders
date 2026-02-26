# Story 8.7: System Configuration Management UI

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.7
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 3.10 (Tax Configuration), Story 10.2 (Workflow Toggles)
**Status:** Implemented

---

## User Story

**As an** admin,
**I want** to manage system settings through UI without code changes,
**So that** configuration is easy and doesn't require developer intervention.

---

## Implementation Summary

### What Was Built

A **unified tabbed System Settings page** at `/settings` that consolidates all configuration into a single page with 3 tabs:

1. **General Tab** — Company Name, Company Logo URL, Currency Symbol
2. **Tax Tab** — Sales Tax Rate (%), Purchase Tax Rate (%), with account mapping summary
3. **Workflow Tab** — 5 workflow toggles with mode indicator (Simple vs Managed)

### What Was NOT Built (Deferred)

The original story proposed 5 categories (General, Tax, Inventory, Recovery, Security). We implemented only settings that **control real system behavior**:

- **Deferred:** Timezone, Date Format (display-only, not enforced)
- **Deferred:** Withholding Tax Rates (no module uses them yet)
- **Deferred:** Inventory: Low Stock Threshold, Adjustment Approval Threshold (no enforcement)
- **Deferred:** Recovery: DSO Target, Collection Effectiveness Target (informational only)
- **Deferred:** Security: Session Timeout, Login Attempt Limit (no enforcement)
- **Deferred:** `updatedBy` field migration (plain string on SystemSetting)

These can be added when the modules that consume them are built.

---

## Acceptance Criteria

1. **Database Schema:**
   - [x] USES the existing `SystemSetting` model (id, key, value, dataType, label, category)
   - [ ] ~~ADD `updatedBy` field~~ — Deferred (audit trail covers who changed what)
   - [x] DO NOT create a new `SystemConfig` model

2. **Configuration Categories (Implemented):**
   - [x] **General:** Company Name, Company Logo URL, Currency Symbol
   - [x] **Tax:** Sales Tax Rate (`TAX_RATE`), Purchase Tax Rate (`PURCHASE_TAX_RATE`)
   - [x] **Workflow:** 5 workflow toggles (merged from Story 10.2's separate page)

3. **Backend API:**
   - [x] Individual GET/PUT endpoints per setting (existing pattern):
     - `GET/PUT /api/v1/settings/tax-rate`
     - `GET/PUT /api/v1/settings/purchase-tax-rate` (NEW)
     - `GET/PUT /api/v1/settings/company-name`
     - `GET/PUT /api/v1/settings/company-logo`
     - `GET/PUT /api/v1/settings/currency-symbol`
     - `GET/PUT /api/v1/settings/workflow` (batch GET/PUT for all 5 toggles)
   - [x] Validation: type checking, range validation for tax rates (0-100)
   - [x] 5-minute in-memory cache in SettingsService

4. **Frontend — Unified System Settings Page:**
   - [x] Single page at `/settings` with inline tab buttons (General, Tax, Workflow)
   - [x] Tab state preserved via URL search params (`?tab=tax`, `?tab=workflow`)
   - [x] Tax tab shows account mapping summary (2200 Tax Payable for sales, 1350 Input Tax for purchases)
   - [x] Workflow tab shows mode indicator (Simple Mode vs Managed Mode)
   - [x] Workflow toggles with descriptions and state summaries
   - [x] Save button per section, success/error toast notifications
   - [x] Previous separate Workflow Settings page merged into this unified page

5. **Authorization:**
   - [x] Only Admin role can access system configuration (PUT endpoints check role)

6. **Audit Trail:**
   - [x] All setting changes logged via `AuditService.log()` (action: UPDATE, entityType: SystemSetting)

---

## Files Modified/Created

| File | Change |
|------|--------|
| `apps/web/src/features/settings/pages/TaxSettingsPage.tsx` | **REWRITTEN** — Unified tabbed page with General, Tax, Workflow tabs |
| `apps/web/src/hooks/useWorkflowSettings.ts` | **NEW** — Shared hook for reading workflow settings (5-min staleTime) |
| `apps/web/src/components/Sidebar.tsx` | Single "System Settings" link instead of expandable menu with 2 links |
| `apps/web/src/App.tsx` | Single `/settings` route, removed `/settings/workflow` route |
| `apps/web/src/features/settings/pages/WorkflowSettingsPage.tsx` | **DEPRECATED** — Content merged into unified page |
| `apps/api/src/modules/settings/settings.service.ts` | Added `getPurchaseTaxRate()`, `PURCHASE_TAX_RATE` to defaults |
| `apps/api/src/modules/settings/settings.controller.ts` | Added `getPurchaseTaxRate` + `updatePurchaseTaxRate` handlers |
| `apps/api/src/modules/settings/settings.routes.ts` | Added `GET/PUT /purchase-tax-rate` |

---

## Dev Notes

### Architecture Decision: Individual Endpoints vs Generic CRUD

The original story proposed generic CRUD (`POST/PUT/GET /settings/:key`). The actual implementation uses **individual endpoints per setting** (e.g., `/settings/tax-rate`, `/settings/company-name`). This was chosen because:

1. Each setting has specific validation logic (tax rate: 0-100 range, workflow: boolean only)
2. Individual endpoints are type-safe and self-documenting
3. Frontend hooks map 1:1 to endpoints (simpler client code)
4. The existing pattern from Story 3.10 was already working well

### Tab State via URL

The page uses `useSearchParams` to preserve the active tab in the URL. Deep links like `/settings?tab=workflow` work correctly, which allows other pages to link directly to the Workflow tab (e.g., enforcement banners on CreateInvoicePage link to `/settings?tab=workflow`).

### Purchase Tax Rate — New Setting

A new `PURCHASE_TAX_RATE` setting was added as part of the PO tax fix:
- Separate from `TAX_RATE` (which is for sales)
- Default: `0` (no purchase tax by default)
- Connected to account `1350 Input Tax Receivable` (ASSET) for GRN journal entries
- Sales tax still uses `2200 Tax Payable` (LIABILITY)

See Story 3.10 for full details on the tax separation fix.

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-15 | 1.0 | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0 | Major revision: use existing SystemSetting model, fix API paths, fix audit logging, replace Tabs with inline buttons | Claude (Dev Review) |
| 2026-02-25 | 3.0 | **IMPLEMENTED**: Unified tabbed page (General, Tax, Workflow). Scoped to real-behavior settings only. Merged WorkflowSettingsPage. Added Purchase Tax Rate. Deferred: timezone, date format, inventory thresholds, recovery targets, security settings. | Claude (Implementation) |
