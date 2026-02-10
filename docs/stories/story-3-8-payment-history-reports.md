# Story 3.8: Payment History and Reports

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.8
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 2.10 (Supplier Payments), Story 3.6 (Client Payment Recording)
**Status:** Done

---

## User Story

**As an** accountant,
**I want** to view comprehensive payment history and generate cash flow reports,
**So that** I can track all incoming/outgoing payments and analyze business cash flow.

---

## Implementation Status

### Already Implemented (Backend)

- **Payment model:** `prisma/schema.prisma` - `Payment` model with direct FKs: `supplierId` (Supplier relation), `clientId` (Client relation)
- **PaymentType enum:** `SUPPLIER`, `CLIENT` (NOT `SUPPLIER_PAYMENT`/`CLIENT_PAYMENT`)
- **PaymentMethod enum:** `CASH`, `BANK_TRANSFER`, `CHEQUE`
- **Payments service:** `apps/api/src/modules/payments/payments.service.ts` - has `createSupplierPayment()` and `createClientPayment()`
- **Payments repository:** `apps/api/src/modules/payments/payments.repository.ts` - has `PaymentFilters` interface and basic query with supplier/client includes
- **Payments controller:** `apps/api/src/modules/payments/payments.controller.ts` - POST endpoints for supplier and client payments
- **Reports controller:** `apps/api/src/modules/reports/reports.controller.ts` - has credit-limit, tax-summary, expense-summary endpoints (no cash flow yet)

### Remaining Work

1. **Backend:** Add unified `getAllPayments()` with filters + `getPaymentById()` to payments service
2. **Backend:** Add `GET /api/reports/cash-flow` endpoint
3. **Frontend:** Build PaymentHistoryPage + PaymentDetailsModal + CashFlowReportPage
4. **Frontend:** API client hooks

---

## Acceptance Criteria

1. **Payment History View:**
   - [x] Single unified view for both client and supplier payments
   - [x] Filter by payment type (`CLIENT`, `SUPPLIER`, `ALL`) - uses Prisma `PaymentType` enum values
   - [x] Filter by date range
   - [x] Filter by payment method (`CASH`, `BANK_TRANSFER`, `CHEQUE`)
   - [x] **Search by party name** - pushed to DB via WHERE clause on client/supplier name (NOT client-side filtering)
   - [x] Offset-based pagination (20 records per page, matches existing codebase pattern)

2. **Payment Details Display:**
   - [x] Date, Type (Client/Supplier), Party Name, Amount, Method, Reference, Recorded By
   - [x] For client payments: show allocated invoices in collapsed table (via `PaymentAllocation` → `Invoice` relations)
   - [x] For supplier payments: show supplier name (via `Payment.supplier` FK) and linked PO if `paymentReferenceType` is `PO`
   - [x] Click to view full payment details modal with allocation breakdown

3. **Cash Flow Report:**
   - [x] `GET /api/reports/cash-flow` endpoint
   - [x] Date range filter (required)
   - [x] Calculate total cash IN (sum of CLIENT payments)
   - [x] Calculate total cash OUT (sum of SUPPLIER payments + expenses)
   - [x] Net cash flow = IN - OUT
   - [x] Group by payment method (supplementary breakdown)
   - [ ] **DEFERRED - POST-MVP:** Daily/weekly/monthly period breakdown
   - [ ] **DEFERRED - POST-MVP:** Chart visualization

4. **Payment Summary Cards:**
   - [x] Total received from clients (period)
   - [x] Total paid to suppliers (period)
   - [x] Total expenses (period)
   - [x] Net cash flow (period)

5. **Backend API Endpoints:**
   - [x] `GET /api/v1/payments` - Returns paginated payments with filters (type, date range, method, search)
   - [x] `GET /api/v1/payments/:id` - Returns payment details with allocations/POs
   - [x] `GET /api/v1/reports/cash-flow` - Returns cash flow summary

6. **Authorization:**
   - [x] All roles can view payment history and reports (read-only)

7. **Audit Logging:**
   - [x] Cash flow report access logged via audit middleware (automatic)

> **Note:** Excel exports are deferred to Story 4.9 (shared export utility). Do not implement export in this story.

---

## Tasks / Subtasks

### Backend Tasks

- [x] **Task 1: Unified Payments Query (AC: 1, 2)**
  - [x] Add `getAllPayments(filters)` to `payments.service.ts`
  - [x] Use Prisma `include: { supplier: true, client: true, user: true, allocations: { include: { invoice: true } } }`
  - [x] Push name search to DB: `OR: [{ client: { name: { contains: search } } }, { supplier: { name: { contains: search } } }]`
  - [x] Offset-based pagination: `skip: (page - 1) * limit, take: limit`

- [x] **Task 2: Payment Details Service (AC: 2)**
  - [x] Add `getPaymentById(id)` to `payments.service.ts`
  - [x] Include all related data: allocations → invoice → client, supplier, user
  - [x] For supplier payments with `paymentReferenceType === 'PO'`: include PO details via `referenceId`

- [x] **Task 3: Cash Flow Report Service (AC: 3, 4)**
  - [x] Create `apps/api/src/modules/reports/cash-flow.service.ts`
  - [x] Sum client payments (IN) by date range
  - [x] Sum supplier payments (OUT) by date range
  - [x] Sum expenses (OUT) by date range
  - [x] Calculate net = IN - OUT
  - [x] Group by payment method

- [x] **Task 4: Controller & Routes (AC: 5)**
  - [x] Add `getAllPayments` and `getPaymentById` to `payments.controller.ts`
  - [x] Add `GET /` and `GET /:id` to `payments.routes.ts` (currently only has POST routes)
  - [x] Add `GET /api/v1/reports/cash-flow` to `reports.controller.ts`

### Frontend Tasks

- [x] **Task 5: Payment History Page (AC: 1, 2)**
  - [x] Create `apps/web/src/features/payments/pages/PaymentHistoryPage.tsx`
  - [x] Filter controls: type dropdown, date range pickers, method dropdown, search input
  - [x] Payments table with columns: Date, Type (IN/OUT badge), Party, Amount (+/- colored), Method, Reference, Recorded By, Actions
  - [x] Pagination component

- [x] **Task 6: Payment Details Modal (AC: 2)**
  - [x] Create `apps/web/src/features/payments/components/PaymentDetailsModal.tsx`
  - [x] Display full payment info
  - [x] For client payments: allocated invoices table
  - [x] For supplier payments: supplier info + linked PO

- [x] **Task 7: Cash Flow Report Page (AC: 3, 4)**
  - [x] Create `apps/web/src/features/reports/pages/CashFlowReportPage.tsx`
  - [x] Date range filter
  - [x] Summary cards: Total IN, Total OUT, Net Flow
  - [x] Payment method breakdown table

- [x] **Task 8: API Client & Hooks**
  - [x] Add `getAllPayments()` and `getPaymentById()` to payments API client
  - [x] Create `apps/web/src/services/reportsService.ts` with `getCashFlowReport()`
  - [x] TanStack Query hooks: `useAllPayments()`, `usePaymentDetails()`, `useCashFlowReport()`

- [x] **Task 9: Routes & Navigation**
  - [x] Add `/payments/history` route in `App.tsx`
  - [x] Add `/reports/cash-flow` route in `App.tsx`
  - [x] Add links in Sidebar

### Testing

- [x] **Task 10: Backend test for cash flow calculation**
  - [x] Test: correct IN/OUT/NET totals with mixed payment types and expenses (5 tests, all passing)
  - [x] File: `apps/api/src/modules/reports/cash-flow.service.test.ts`

---

## Dev Notes

### Actual Schema (verified)

The `Payment` model has **direct foreign keys** for both supplier and client:

```prisma
model Payment {
  id                   String                 @id @default(cuid())
  supplierId           String?                // Direct FK to Supplier
  clientId             String?                // Direct FK to Client
  paymentType          PaymentType            // SUPPLIER or CLIENT
  paymentReferenceType PaymentReferenceType?  // PO, INVOICE, or GENERAL
  referenceId          String?                // PO ID (for supplier) - deprecated for client payments
  amount               Decimal                @db.Decimal(12, 2)
  method               PaymentMethod          // CASH, BANK_TRANSFER, CHEQUE
  referenceNumber      String?                // Cheque/Bank transfer ref
  date                 DateTime
  notes                String?                @db.Text
  recordedBy           String

  supplier             Supplier?              @relation(...)
  client               Client?                @relation(...)
  user                 User                   @relation(...)
  allocations          PaymentAllocation[]    // Client payment → invoice allocations
}
```

**Key point:** Use `include: { supplier: true, client: true }` in queries. Do NOT manually look up suppliers via `referenceId` - use the direct `supplier` relation.

### Unified Payments Query (corrected)

```typescript
async getAllPayments(filters: {
  paymentType?: PaymentType | 'ALL';
  dateFrom?: Date;
  dateTo?: Date;
  method?: PaymentMethod;
  search?: string;
  page?: number;
  limit?: number;
}) {
  const { paymentType = 'ALL', dateFrom, dateTo, method, search, page = 1, limit = 20 } = filters;

  const where: Prisma.PaymentWhereInput = {};

  // Payment type filter
  if (paymentType !== 'ALL') {
    where.paymentType = paymentType as PaymentType;
  }

  // Date range
  if (dateFrom || dateTo) {
    where.date = {};
    if (dateFrom) where.date.gte = dateFrom;
    if (dateTo) where.date.lte = dateTo;
  }

  // Payment method
  if (method) {
    where.method = method;
  }

  // Search by party name - pushed to DB, not client-side
  if (search) {
    where.OR = [
      { client: { name: { contains: search, mode: 'insensitive' } } },
      { supplier: { name: { contains: search, mode: 'insensitive' } } },
    ];
  }

  const [payments, total] = await Promise.all([
    this.prisma.payment.findMany({
      where,
      include: {
        supplier: { select: { id: true, name: true } },
        client: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
        allocations: {
          include: {
            invoice: { select: { id: true, invoiceNumber: true } },
          },
        },
      },
      orderBy: { date: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    }),
    this.prisma.payment.count({ where }),
  ]);

  return {
    payments: payments.map(p => ({
      id: p.id,
      date: p.date,
      type: p.paymentType,
      partyName: p.client?.name || p.supplier?.name || 'Unknown',
      partyId: p.clientId || p.supplierId,
      amount: parseFloat(p.amount.toString()),
      method: p.method,
      referenceNumber: p.referenceNumber || '',
      notes: p.notes || '',
      recordedByName: p.user.name,
      allocations: p.allocations,
    })),
    total,
    page,
    totalPages: Math.ceil(total / limit),
  };
}
```

### Payment Details Query (corrected)

```typescript
async getPaymentById(id: string) {
  const payment = await this.prisma.payment.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, name: true } },
      client: { select: { id: true, name: true, balance: true } },
      user: { select: { id: true, name: true, email: true } },
      allocations: {
        include: {
          invoice: {
            select: { id: true, invoiceNumber: true, total: true, status: true },
          },
        },
      },
    },
  });

  if (!payment) throw new NotFoundError('Payment not found');

  // For supplier payments with PO reference, look up the PO
  let purchaseOrder = null;
  if (payment.paymentType === 'SUPPLIER' && payment.paymentReferenceType === 'PO' && payment.referenceId) {
    purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id: payment.referenceId },
      select: { id: true, poNumber: true, totalAmount: true, status: true },
    });
  }

  return { ...payment, purchaseOrder };
}
```

### Cash Flow Report Service

```typescript
// apps/api/src/modules/reports/cash-flow.service.ts
async getCashFlowReport(dateFrom: Date, dateTo: Date) {
  const dateFilter = { gte: dateFrom, lte: dateTo };

  // Use Prisma aggregate for efficiency instead of fetching all records
  const [clientPayments, supplierPayments, expenses] = await Promise.all([
    this.prisma.payment.findMany({
      where: { paymentType: 'CLIENT', date: dateFilter },
      select: { amount: true, method: true },
    }),
    this.prisma.payment.findMany({
      where: { paymentType: 'SUPPLIER', date: dateFilter },
      select: { amount: true, method: true },
    }),
    this.prisma.expense.findMany({
      where: { date: dateFilter },
      select: { amount: true, paymentMethod: true },
    }),
  ]);

  const totalCashIn = clientPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  const totalSupplierOut = supplierPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0);
  const totalExpenseOut = expenses.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
  const totalCashOut = totalSupplierOut + totalExpenseOut;

  // Group by payment method
  const methods: Record<string, { cashIn: number; cashOut: number }> = {
    CASH: { cashIn: 0, cashOut: 0 },
    BANK_TRANSFER: { cashIn: 0, cashOut: 0 },
    CHEQUE: { cashIn: 0, cashOut: 0 },
  };

  clientPayments.forEach(p => { methods[p.method].cashIn += parseFloat(p.amount.toString()); });
  supplierPayments.forEach(p => { methods[p.method].cashOut += parseFloat(p.amount.toString()); });
  expenses.forEach(e => { methods[e.paymentMethod].cashOut += parseFloat(e.amount.toString()); });

  return {
    totalCashIn,
    totalCashOut,
    totalSupplierPayments: totalSupplierOut,
    totalExpenses: totalExpenseOut,
    netCashFlow: totalCashIn - totalCashOut,
    byPaymentMethod: Object.entries(methods).map(([method, data]) => ({
      method,
      cashIn: data.cashIn,
      cashOut: data.cashOut,
      net: data.cashIn - data.cashOut,
    })),
  };
}
```

### Existing Patterns to Reuse

| Pattern | File | Reuse For |
|---------|------|-----------|
| Offset pagination | `payments.repository.ts` (existing `PaymentFilters`) | Payment history pagination |
| Prisma includes | `payments.repository.ts:36-50` (supplier/user includes) | Extend for unified query |
| Report controller pattern | `reports.controller.ts` (existing endpoints) | Add cash flow endpoint |
| TanStack Query hooks | `apps/web/src/hooks/useExpenses.ts` | Pattern for payment hooks |

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed enum values to match actual schema (SUPPLIER/CLIENT not SUPPLIER_PAYMENT/CLIENT_PAYMENT). Fixed N+1 query anti-pattern - search now pushed to DB WHERE clause. Fixed supplier lookup to use direct FK (supplierId) instead of manual referenceId lookup. Removed export functionality (deferred to Story 4.9). Marked daily breakdown and chart as POST-MVP. Added implementation status showing existing backend code. | Doc Revision |
| 2026-02-10 | 3.0     | Implementation complete - all tasks done | Dev Agent |

---

## Dev Agent Record

### Implementation Summary

All 10 tasks implemented and verified. Both TypeScript compiles pass (frontend + backend). 5 unit tests passing.

### Files Modified

**Backend:**
- `apps/api/src/modules/payments/payments.service.ts` — Added `getAllPayments()` with unified filters, `getPaymentDetails()` with full includes
- `apps/api/src/modules/payments/payments.controller.ts` — Added `getAllPayments` and `getPaymentDetails` handler methods
- `apps/api/src/modules/payments/payments.routes.ts` — Added `GET /` and `GET /:id` routes
- `apps/api/src/modules/reports/cash-flow.service.ts` — Created: cash flow IN/OUT/NET with payment method breakdown
- `apps/api/src/modules/reports/reports.controller.ts` — Added `getCashFlow` method using CashFlowService
- `apps/api/src/modules/reports/reports.routes.ts` — Added `GET /cash-flow` route
- `apps/api/src/modules/reports/cash-flow.service.test.ts` — Created: 5 unit tests for cash flow calculation

**Frontend:**
- `apps/web/src/types/payment.types.ts` — Added UnifiedPayment, PaymentDetail, CashFlowReport types + label maps
- `apps/web/src/services/paymentsService.ts` — Added `getAllPayments()`, `getPaymentDetails()`, `getCashFlowReport()`
- `apps/web/src/services/reportsService.ts` — Created: reports API service
- `apps/web/src/hooks/usePayments.ts` — Added `useAllPayments()`, `usePaymentDetails()`, `useCashFlowReport()`
- `apps/web/src/hooks/useReports.ts` — Created: `useCashFlowReport()` hook
- `apps/web/src/features/payments/pages/PaymentHistoryPage.tsx` — Created: unified payment history with filters, search, pagination, and detail modal
- `apps/web/src/features/payments/components/PaymentDetailsModal.tsx` — Created: full payment detail view with allocations/PO
- `apps/web/src/features/reports/pages/CashFlowReportPage.tsx` — Created: cash flow report with 4 summary cards + method breakdown table
- `apps/web/src/App.tsx` — Added `/payments/history` and `/reports/cash-flow` routes
- `apps/web/src/components/Sidebar.tsx` — Added "Payment History" link under Payments, expanded Reports into menu with "Cash Flow" link

---

## QA Results

*To be populated by QA agent*
