# Story 10.0: Supplier Payment Bug Fix & Sidebar Restructuring

**Epic:** Epic 10 - Standardized Sales, Purchasing & Inventory Flow
**Story ID:** STORY-10.0
**Priority:** Critical (Bug Fix)
**Estimated Effort:** 2-3 hours
**Dependencies:** None (pre-requisite fix)
**Status:** Not Started

---

## User Story

**As a** user recording supplier payments,
**I want** the payment to be recorded correctly with the proper reference number,
**So that** journal entries are accurate and I can track cheque/bank transfer references.

---

## Bug Description

The supplier payment flow has a bug where the `referenceNumber` field is not properly handled:

1. **DTO missing `referenceNumber`**: `CreateSupplierPaymentDto` (line 11-21 of `payments.service.ts`) has no `referenceNumber` field — it uses `notes` for both general notes AND cheque/bank transfer references
2. **Payment record missing `referenceNumber`**: The `create()` call (line 69-89) only sets `notes`, never sets `referenceNumber` on the Payment model
3. **AutoJournalService call incorrect**: Line 93 passes `referenceNumber: dto.notes` — this works functionally but conflates two different fields
4. **Validation uses `notes` for reference**: Line 56-61 validates `dto.notes` for cheque/bank transfer reference numbers

**Compare with client payment** (working correctly): `CreateClientPaymentDto` has a separate `referenceNumber` field (line 27), and the client payment flow properly stores it.

---

## Acceptance Criteria

1. **DTO Fix:**
   - [ ] Add `referenceNumber?: string` field to `CreateSupplierPaymentDto`
   - [ ] Keep `notes` as a separate field for general notes

2. **Payment Creation Fix:**
   - [ ] Set `referenceNumber: dto.referenceNumber || null` in Payment create data
   - [ ] Continue setting `notes: dto.notes || null` separately

3. **Validation Fix:**
   - [ ] For CHEQUE/BANK_TRANSFER: validate `dto.referenceNumber` is not empty (instead of `dto.notes`)

4. **AutoJournalService Fix:**
   - [ ] Pass `referenceNumber: dto.referenceNumber` (instead of `dto.notes`)

5. **Frontend Fix:**
   - [ ] Supplier payment form: Add separate "Reference Number" field for CHEQUE/BANK_TRANSFER
   - [ ] Show reference number field conditionally (only for non-CASH methods)
   - [ ] Keep "Notes" as a separate optional field

6. **Sidebar Restructuring:**
   - [ ] Move "Record Supplier Payment" from Payments menu to Purchases menu
   - [ ] Move "Supplier Payment History" from Payments menu to Purchases menu
   - [ ] Purchases section now contains: Purchase Orders, Goods Receipts, Suppliers, Record Supplier Payment, Supplier Payment History

---

## Dev Notes

### Files to Modify

| File | Change |
|------|--------|
| `apps/api/src/modules/payments/payments.service.ts` | Add `referenceNumber` to DTO, fix create() call, fix validation, fix AutoJournalService call |
| `apps/api/src/modules/payments/payments.routes.ts` | Add `referenceNumber` to validation schema if applicable |
| `apps/web/src/features/payments/pages/RecordSupplierPaymentPage.tsx` | Add referenceNumber field, make conditional on payment method |
| `apps/web/src/components/Sidebar.tsx` | Move 2 supplier payment nav items from Payments to Purchases |

### Key Patterns

- Follow same pattern as `CreateClientPaymentDto` which already has `referenceNumber` as a separate field
- Payment model in schema already has both `referenceNumber` and `notes` fields — this is a service-layer bug, not a schema issue
- `AuditService.log()` action should be `CREATE` for recording payments

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 1.0 | Initial story creation | Claude (AI Planning) |
