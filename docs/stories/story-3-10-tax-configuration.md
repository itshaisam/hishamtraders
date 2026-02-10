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
**I want** a settings page to manage the system-wide default sales tax rate,
**So that** I can easily update the tax percentage applied to all invoices.

---

## Implementation Status

### Already Implemented (Backend)

The backend for this story was built as part of earlier stories:

- **Prisma model:** `SystemSetting` in `prisma/schema.prisma` (line ~643) - includes `key`, `value`, `dataType`, `label`, `category` fields
- **Settings key:** `TAX_RATE` (not `DEFAULT_SALES_TAX_RATE` as originally planned)
- **Default value:** 18% (seeded via `initializeDefaults()`)
- **Service:** `apps/api/src/modules/settings/settings.service.ts` - has `getTaxRate()` with 5-min in-memory cache, fallback to 18% if not found
- **Controller:** `apps/api/src/modules/settings/settings.controller.ts` - `GET /api/v1/settings/tax-rate` and `PUT /api/v1/settings/tax-rate`
- **Routes:** `apps/api/src/modules/settings/settings.routes.ts` - mounted at `/api/v1/settings`, authenticated, PUT is Admin-only (checked in controller)
- **Invoice integration:** `invoices.service.ts` (line 64) already calls `settingsService.getTaxRate()` and snapshots the rate on each invoice
- **Audit logging:** `AuditService.log()` already added to `updateTaxRate` in settings controller (action `UPDATE`, entityType `SystemSetting`)

### Remaining Work

1. ~~**Frontend:** Build a Tax Settings admin page~~ — Done
2. ~~**Frontend fix:** `CreateInvoicePage.tsx` hardcodes `18`~~ — Done
3. **Task 6: Unit tests** for tax rate update with audit logging — Still TODO

---

## Acceptance Criteria

1.  **System Configuration:**
    *   [x] A system-wide `SystemSetting` record exists with key `TAX_RATE`
    *   [x] Default value is seeded as `18` (18%)
    *   [x] Fallback: if record is missing or invalid, defaults to 18%

2.  **Backend API Endpoints:**
    *   [x] `GET /api/v1/settings/tax-rate` - Returns `{ success: true, data: { taxRate: number } }`
    *   [x] `PUT /api/v1/settings/tax-rate` - Updates the tax rate (Admin only)

3.  **Validation:**
    *   [x] Tax rate must be a number between 0 and 100
    *   [x] API rejects invalid values with `BadRequestError`

4.  **Frontend UI:**
    *   [x] A "Tax Settings" page is available in the admin settings area
    *   [x] The page displays the current default tax rate (fetched from `GET /api/v1/settings/tax-rate`)
    *   [x] An input field allows an admin to enter a new tax rate
    *   [x] A "Save" button calls `PUT /api/v1/settings/tax-rate`
    *   [x] Success/error toast notifications on save
    *   [x] **Fix:** `CreateInvoicePage.tsx` fetches tax rate from API instead of hardcoding `18`

5.  **Authorization:**
    *   [x] Only `ADMIN` role can update the tax rate (checked in controller)
    *   [x] Frontend: hide settings page from non-admin users in sidebar/routing

6.  **Audit Logging:**
    *   [x] Tax rate changes are recorded in `AuditLog` table with action `UPDATE`, entityType `SystemSetting`
    *   [x] Log includes old rate, new rate, and the user who made the change

---

## Tasks / Subtasks

### Backend Tasks (DONE)

- [x] **Task 1: Add audit logging to `updateTaxRate` controller (AC: 6)** — Already implemented in `settings.controller.ts` line 68.

### Frontend Tasks

- [x] **Task 2: Create Tax Settings Page (AC: 4)** — Implemented in `apps/web/src/features/settings/pages/TaxSettingsPage.tsx`
- [x] **Task 3: Add Settings Route and Sidebar Link (AC: 4, 5)** — Route `/settings/tax` in `App.tsx`, "Settings" section in Sidebar (Admin-only)
- [x] **Task 4: Fix CreateInvoicePage tax rate (AC: 4)** — `CreateInvoicePage.tsx` now fetches tax rate from API
- [x] **Task 5: API Client Hook** — `useGetTaxRate()` and `useUpdateTaxRate()` implemented

### Testing

- [ ] **Task 6: Unit test for tax rate update with audit logging**
  - Test: update tax rate, verify AuditLog entry is created with old/new values
  - File: `apps/api/src/__tests__/settings.service.test.ts`

---

## Dev Notes

### Existing Code References

| What | File | Notes |
|------|------|-------|
| Prisma model | `prisma/schema.prisma:643` | `SystemSetting` model |
| Settings service | `apps/api/src/modules/settings/settings.service.ts` | Has caching, `getTaxRate()`, `initializeDefaults()` |
| Settings controller | `apps/api/src/modules/settings/settings.controller.ts` | GET + PUT endpoints, admin check |
| Settings routes | `apps/api/src/modules/settings/settings.routes.ts` | Mounted at `/api/v1/settings` |
| Invoice integration | `apps/api/src/modules/invoices/invoices.service.ts:64` | Already reads from settings |
| Frontend TODO | `apps/web/src/features/invoices/pages/CreateInvoicePage.tsx:129` | Hardcoded `18`, needs fix |

### Business Logic

- When an admin updates the tax rate, the new rate only applies to invoices created **after** the change
- Existing invoices are not affected - the tax amount and rate are snapshotted at invoice creation time (stored in `Invoice.taxRate` and `Invoice.taxAmount`)
- The invoice service reads from settings via `settingsService.getTaxRate()` which has a 5-minute cache

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: updated to reflect existing backend implementation. Corrected model name (SystemSetting, not SystemConfiguration), key name (TAX_RATE, not DEFAULT_SALES_TAX_RATE), default value (18%, not 17%). Reduced scope to frontend + audit logging only. Added Tasks/Subtasks section. | Doc Revision |
| 2026-02-10 | 2.1     | Fix: API paths `/api/settings/*` → `/api/v1/settings/*`. Mark audit logging (Task 1, AC 6) as complete — already implemented in controller. Remaining scope is frontend only. | Doc Revision |

---

## Dev Agent Record

*To be populated by dev agent*

---

## QA Results

*To be populated by QA agent*
