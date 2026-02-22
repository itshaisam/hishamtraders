# Story 10.4: Sales Order — Frontend

**Epic:** Epic 10 - Standardized Sales, Purchasing & Inventory Flow
**Story ID:** STORY-10.4
**Priority:** High
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 10.3 (SO Backend)
**Status:** Not Started

---

## User Story

**As a** sales officer,
**I want** a Sales Orders UI to create, view, and manage orders,
**So that** I can track the sales pipeline from order to delivery to invoicing.

---

## Acceptance Criteria

### 1. Sales Orders List Page (`/sales-orders`)

- [ ] Table columns: Order #, Client, Date, Expected Delivery, Total, Status, Actions
- [ ] Status filter dropdown (DRAFT, CONFIRMED, PARTIALLY_DELIVERED, DELIVERED, INVOICED, CANCELLED, CLOSED)
- [ ] Search by order number or client name
- [ ] Date range filter
- [ ] Pagination
- [ ] Status badges with color coding:
  - DRAFT: gray
  - CONFIRMED: blue
  - PARTIALLY_DELIVERED: amber
  - DELIVERED: green
  - PARTIALLY_INVOICED: purple
  - INVOICED: teal
  - CANCELLED: red
  - CLOSED: gray

### 2. Create Sales Order Page (`/sales-orders/new`)

- [ ] Client selection (Combobox with search)
- [ ] Warehouse selection (Select dropdown)
- [ ] Payment type toggle (CASH / CREDIT)
- [ ] Expected delivery date (input[type=date])
- [ ] Notes field (textarea)
- [ ] Items table:
  - Product selection (Combobox)
  - Variant selection (if product has variants)
  - Quantity (number input)
  - Unit price (auto-filled from product, editable)
  - Discount % (number input)
  - Line total (calculated)
  - Remove button
  - "Add Item" button
- [ ] Order summary: Subtotal, Tax Rate, Tax Amount, Total
- [ ] Stock availability indicators per item (green check / red warning)
- [ ] Credit limit warning for CREDIT orders (non-blocking)
- [ ] "Save as Draft" and "Save & Confirm" buttons
- [ ] Breadcrumb: Sales > Sales Orders > New Order

### 3. Sales Order Detail Page (`/sales-orders/:id`)

- [ ] Order header: Order #, Client, Warehouse, Date, Status badge
- [ ] Items table: Product, Variant, Qty, Delivered, Invoiced, Remaining, Unit Price, Discount, Total
- [ ] Progress indicators per item (delivered/invoiced vs ordered)
- [ ] Action buttons (conditional on status):
  - DRAFT: "Confirm", "Edit", "Cancel"
  - CONFIRMED: "Create Delivery Note", "Create Invoice" (simple mode), "Cancel"
  - PARTIALLY_DELIVERED: "Create Delivery Note" (for remaining), "Create Invoice"
  - DELIVERED: "Create Invoice" (for remaining)
  - INVOICED: "Close"
- [ ] Linked documents section:
  - Delivery Notes created from this SO (with links)
  - Invoices created from this SO (with links)
- [ ] Cancel modal with reason (required)
- [ ] Breadcrumb: Sales > Sales Orders > SO-20260223-001

### 4. Navigation

- [ ] Sidebar: "Sales Orders" added under Sales menu (between Customers and Invoices)
- [ ] Accessible to ADMIN, SALES_OFFICER, ACCOUNTANT roles

### 5. Service & Hooks

- [ ] `apps/web/src/services/salesOrderService.ts` — API client
- [ ] `apps/web/src/hooks/useSalesOrders.ts` — TanStack Query hooks
- [ ] `apps/web/src/types/sales-order.types.ts` — TypeScript interfaces

---

## Dev Notes

### Frontend Files to Create

```
apps/web/src/features/sales-orders/
  pages/
    SalesOrdersPage.tsx          (List page)
    CreateSalesOrderPage.tsx     (Create form)
    SalesOrderDetailPage.tsx     (Detail view)

apps/web/src/services/salesOrderService.ts
apps/web/src/hooks/useSalesOrders.ts
apps/web/src/types/sales-order.types.ts
```

### Types

```typescript
// apps/web/src/types/sales-order.types.ts
export enum SalesOrderStatus {
  DRAFT = 'DRAFT',
  CONFIRMED = 'CONFIRMED',
  PARTIALLY_DELIVERED = 'PARTIALLY_DELIVERED',
  DELIVERED = 'DELIVERED',
  PARTIALLY_INVOICED = 'PARTIALLY_INVOICED',
  INVOICED = 'INVOICED',
  CANCELLED = 'CANCELLED',
  CLOSED = 'CLOSED',
}

export interface SalesOrder {
  id: string;
  orderNumber: string;
  clientId: string;
  client: { id: string; name: string; };
  warehouseId: string;
  warehouse: { id: string; name: string; };
  orderDate: string;
  expectedDeliveryDate: string | null;
  paymentType: 'CASH' | 'CREDIT';
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  status: SalesOrderStatus;
  notes: string | null;
  items: SalesOrderItem[];
  deliveryNotes?: DeliveryNoteSummary[];
  invoices?: InvoiceSummary[];
  createdAt: string;
}

export interface SalesOrderItem {
  id: string;
  productId: string;
  product: { id: string; name: string; sku: string; };
  productVariantId: string | null;
  productVariant: { id: string; name: string; sku: string; } | null;
  quantity: number;
  deliveredQuantity: number;
  invoicedQuantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}
```

### Service Pattern

Follow existing `invoicesService.ts` pattern:
```typescript
// apps/web/src/services/salesOrderService.ts
import api from './api-client';

export const salesOrderService = {
  getAll: (params?: Record<string, any>) =>
    api.get('/sales-orders', { params }),
  getById: (id: string) =>
    api.get(`/sales-orders/${id}`),
  create: (data: any) =>
    api.post('/sales-orders', data),
  confirm: (id: string) =>
    api.patch(`/sales-orders/${id}/confirm`),
  cancel: (id: string, reason: string) =>
    api.patch(`/sales-orders/${id}/cancel`, { cancelReason: reason }),
  close: (id: string) =>
    api.patch(`/sales-orders/${id}/close`),
  getDeliverableItems: (id: string) =>
    api.get(`/sales-orders/${id}/deliverable-items`),
  getInvoiceableItems: (id: string) =>
    api.get(`/sales-orders/${id}/invoiceable-items`),
};
```

### Route Registration

Add to `apps/web/src/App.tsx`:
```tsx
<Route path="/sales-orders" element={<ProtectedRoute><Layout><SalesOrdersPage /></Layout></ProtectedRoute>} />
<Route path="/sales-orders/new" element={<ProtectedRoute><Layout><CreateSalesOrderPage /></Layout></ProtectedRoute>} />
<Route path="/sales-orders/:id" element={<ProtectedRoute><Layout><SalesOrderDetailPage /></Layout></ProtectedRoute>} />
```

### UI Components to Reuse

- `Card`, `Button`, `Badge`, `Table`, `Select`, `Input`, `Modal`, `Combobox` — all exist
- `Spinner` for loading states
- `Alert` for warnings (stock availability, credit limit)
- Follow CreateInvoicePage.tsx pattern for the item selection form
- Status badge colors: use existing `Badge` component with variant prop

### Key Patterns

- No `Tabs` component — use inline button group for filters if needed
- No `DatePicker` — use `<input type="date" />`
- `toast` from `react-hot-toast` for success/error messages
- Breadcrumbs follow existing pattern (inline div with links)
- Use skeleton loaders for loading states

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 1.0 | Initial story creation | Claude (AI Planning) |
