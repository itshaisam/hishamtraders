# Story 10.3: Sales Order — Backend

**Epic:** Epic 10 - Standardized Sales, Purchasing & Inventory Flow
**Story ID:** STORY-10.3
**Priority:** High
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 10.1 (Schema), Story 10.2 (Settings)
**Status:** Not Started

---

## User Story

**As a** sales officer,
**I want** to create sales orders to book customer orders before delivery,
**So that** I can plan deliveries, track order fulfillment, and manage the sales pipeline.

---

## Acceptance Criteria

### 1. API Endpoints

- [ ] `POST /api/v1/sales-orders` — Create sales order
- [ ] `GET /api/v1/sales-orders` — List with filters (status, clientId, date range, search)
- [ ] `GET /api/v1/sales-orders/:id` — Get details with items, linked DNs, linked Invoices
- [ ] `PATCH /api/v1/sales-orders/:id/confirm` — DRAFT → CONFIRMED
- [ ] `PATCH /api/v1/sales-orders/:id/cancel` — DRAFT/CONFIRMED → CANCELLED (with reason)
- [ ] `PATCH /api/v1/sales-orders/:id/close` — Manually close order
- [ ] `GET /api/v1/sales-orders/:id/deliverable-items` — Items with remaining deliverable qty
- [ ] `GET /api/v1/sales-orders/:id/invoiceable-items` — Items with remaining invoiceable qty

### 2. Sales Order Creation

- [ ] Auto-generate order number: `SO-YYYYMMDD-NNN` (e.g., SO-20260223-001)
- [ ] Required fields: clientId, warehouseId, items (productId, quantity, unitPrice)
- [ ] Optional fields: expectedDeliveryDate, notes, paymentType (default CASH)
- [ ] Tax rate snapshot from system settings (same pattern as Invoice)
- [ ] Calculate subtotal, taxAmount, total per item and order
- [ ] Discount per item (percentage)
- [ ] Stock availability check on creation (warn but don't block)
- [ ] Credit limit check for CREDIT payment type (warn but don't block)
- [ ] Status defaults to DRAFT

### 3. Status Management

- [ ] **DRAFT → CONFIRMED**: Lock prices, validate stock availability
- [ ] **CONFIRMED → PARTIALLY_DELIVERED**: Auto-set when first DN created
- [ ] **PARTIALLY_DELIVERED → DELIVERED**: Auto-set when all items fully delivered
- [ ] **CONFIRMED/DELIVERED → PARTIALLY_INVOICED**: Auto-set when first Invoice created
- [ ] **PARTIALLY_INVOICED → INVOICED**: Auto-set when all items fully invoiced
- [ ] **INVOICED → CLOSED**: Auto-set or manual
- [ ] **DRAFT/CONFIRMED → CANCELLED**: Manual with reason required
- [ ] Cancelled orders release any stock reservations (if enabled)

### 4. Item Tracking

- [ ] `deliveredQuantity` updated when DN created from this SO
- [ ] `invoicedQuantity` updated when Invoice created from this SO
- [ ] Remaining deliverable: `quantity - deliveredQuantity`
- [ ] Remaining invoiceable: `quantity - invoicedQuantity`
- [ ] Cannot deliver/invoice more than ordered quantity

### 5. Authorization

- [ ] ADMIN, SALES_OFFICER can create and confirm
- [ ] ADMIN can cancel
- [ ] All authenticated users can view
- [ ] All operations logged via audit middleware

### 6. No Journal Entries

- [ ] Sales Order creation/confirmation does NOT create journal entries
- [ ] Financial impact starts at Delivery Note or Invoice

---

## Dev Notes

### Module Structure

```
apps/api/src/modules/sales-orders/
  sales-orders.service.ts      (NEW)
  sales-orders.routes.ts       (NEW)
  sales-orders.validator.ts    (NEW)
  sales-orders.repository.ts   (NEW - optional, can use prisma directly)
```

### Service Pattern

Follow same pattern as `goods-receipts.service.ts`:
- Constructor receives `private prisma: any` for DI
- Methods use `this.prisma` for queries
- Use `getTenantId()` for creates
- Use `prisma.$transaction()` for multi-step operations
- Use error classes from `utils/errors.js`

### Order Number Generation

```typescript
async function generateOrderNumber(tx: any, date: Date): Promise<string> {
  const dateStr = format(date, 'yyyyMMdd');
  const prefix = `SO-${dateStr}-`;
  const latest = await tx.salesOrder.findFirst({
    where: { orderNumber: { startsWith: prefix } },
    orderBy: { orderNumber: 'desc' },
  });
  const nextSeq = latest
    ? parseInt(latest.orderNumber.split('-').pop()!) + 1
    : 1;
  return `${prefix}${String(nextSeq).padStart(3, '0')}`;
}
```

### Status Update Helper

```typescript
async function updateOrderStatus(tx: any, salesOrderId: string): Promise<void> {
  const order = await tx.salesOrder.findUnique({
    where: { id: salesOrderId },
    include: { items: true },
  });

  const allDelivered = order.items.every(i => i.deliveredQuantity >= i.quantity);
  const someDelivered = order.items.some(i => i.deliveredQuantity > 0);
  const allInvoiced = order.items.every(i => i.invoicedQuantity >= i.quantity);
  const someInvoiced = order.items.some(i => i.invoicedQuantity > 0);

  let newStatus = order.status;
  if (allInvoiced) newStatus = 'INVOICED';
  else if (someInvoiced) newStatus = 'PARTIALLY_INVOICED';
  else if (allDelivered) newStatus = 'DELIVERED';
  else if (someDelivered) newStatus = 'PARTIALLY_DELIVERED';

  if (newStatus !== order.status) {
    await tx.salesOrder.update({
      where: { id: salesOrderId },
      data: { status: newStatus },
    });
  }
}
```

### Route Registration

Add to `apps/api/src/routes/index.ts`:
```typescript
import salesOrdersRoutes from '../modules/sales-orders/sales-orders.routes.js';
router.use('/sales-orders', salesOrdersRoutes);
```

### Validation (Zod)

```typescript
const createSalesOrderSchema = z.object({
  clientId: z.string().min(1),
  warehouseId: z.string().min(1),
  paymentType: z.enum(['CASH', 'CREDIT']).default('CASH'),
  expectedDeliveryDate: z.string().datetime().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1),
    productVariantId: z.string().optional(),
    quantity: z.number().int().positive(),
    unitPrice: z.number().positive(),
    discount: z.number().min(0).max(100).default(0),
  })).min(1),
});
```

### Key Patterns

- Reuse existing patterns from `invoices.service.ts` for tax calculation
- Reuse `FifoDeductionService.getAvailableQuantity()` for stock checks (don't deduct)
- Follow `GoodsReceiveNote` pattern for number generation
- Use `validatePeriodNotClosed()` if date is in a closed period
- Constructor DI pattern: `private prisma: any` (not `PrismaClient`)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 1.0 | Initial story creation | Claude (AI Planning) |
