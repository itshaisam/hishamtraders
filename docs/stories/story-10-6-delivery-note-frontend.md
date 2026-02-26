# Story 10.6: Delivery Note — Frontend

**Epic:** Epic 10 - Standardized Sales, Purchasing & Inventory Flow
**Story ID:** STORY-10.6
**Priority:** High
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 10.5 (DN Backend), Story 10.4 (SO Frontend)
**Status:** Completed

---

## User Story

**As a** warehouse manager,
**I want** a Delivery Notes UI to create, dispatch, and track deliveries,
**So that** I can manage warehouse outbound operations and confirm goods delivery to customers.

---

## Acceptance Criteria

### 1. Delivery Notes List Page (`/delivery-notes`)

- [ ] Table columns: DN #, Client, SO #, Date, Status, Items, Actions
- [ ] Status filter: PENDING, DISPATCHED, DELIVERED, CANCELLED
- [ ] Search by DN number, client name, or SO number
- [ ] Date range filter
- [ ] Pagination
- [ ] Status badges:
  - PENDING: amber
  - DISPATCHED: blue
  - DELIVERED: green
  - CANCELLED: red
- [ ] Click row → detail page

### 2. Create Delivery Note Page (`/delivery-notes/new`)

- [ ] **From Sales Order**: Pre-fill client, warehouse, and items from SO deliverable quantities
  - URL pattern: `/delivery-notes/new?salesOrderId=xxx`
  - Auto-populate items with remaining deliverable quantities
  - User can adjust quantities (cannot exceed remaining)
- [ ] **Standalone**: Manual client, warehouse, and item selection
- [ ] Delivery details section:
  - Driver name (text input)
  - Vehicle number (text input)
  - Delivery address (textarea, pre-filled from client if available)
  - Notes (textarea)
- [ ] Items table:
  - Product (Combobox)
  - Variant (if applicable)
  - Quantity
  - Available stock indicator
  - Remove button
  - "Add Item" button
- [ ] "Create Delivery Note" button
- [ ] Breadcrumb: Sales > Delivery Notes > New

### 3. Delivery Note Detail Page (`/delivery-notes/:id`)

- [ ] Header: DN #, Client, Warehouse, Date, Status badge
- [ ] Delivery info: Driver, Vehicle, Address
- [ ] Items table: Product, Variant, Batch #, Qty
- [ ] Linked documents:
  - Sales Order (link if exists)
  - Invoice(s) created from this DN (links if exist)
- [ ] Action buttons (conditional):
  - PENDING: "Dispatch" (with confirmation dialog — warns about stock deduction), "Cancel"
  - DISPATCHED: "Mark Delivered", "Create Invoice"
  - DELIVERED: "Create Invoice" (if not yet invoiced)
- [ ] Dispatch confirmation modal: "This will deduct stock from warehouse. Continue?"
- [ ] Cancel modal with reason (PENDING only)
- [ ] Breadcrumb: Sales > Delivery Notes > DN-20260223-001

### 4. Navigation

- [ ] Sidebar: "Delivery Notes" under Sales menu (after Sales Orders, before Invoices)
- [ ] Accessible to ADMIN, WAREHOUSE_MANAGER, SALES_OFFICER, ACCOUNTANT

### 5. Service & Hooks

- [ ] `apps/web/src/services/deliveryNoteService.ts`
- [ ] `apps/web/src/hooks/useDeliveryNotes.ts`
- [ ] `apps/web/src/types/delivery-note.types.ts`

---

## Dev Notes

### Frontend Files

```
apps/web/src/features/delivery-notes/
  pages/
    DeliveryNotesPage.tsx         (List)
    CreateDeliveryNotePage.tsx    (Create form)
    DeliveryNoteDetailPage.tsx    (Detail/actions)

apps/web/src/services/deliveryNoteService.ts
apps/web/src/hooks/useDeliveryNotes.ts
apps/web/src/types/delivery-note.types.ts
```

### Types

```typescript
export enum DeliveryNoteStatus {
  PENDING = 'PENDING',
  DISPATCHED = 'DISPATCHED',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED',
}

export interface DeliveryNote {
  id: string;
  deliveryNoteNumber: string;
  salesOrderId: string | null;
  salesOrder?: { id: string; orderNumber: string; };
  clientId: string;
  client: { id: string; name: string; };
  warehouseId: string;
  warehouse: { id: string; name: string; };
  deliveryDate: string;
  status: DeliveryNoteStatus;
  deliveryAddress: string | null;
  driverName: string | null;
  vehicleNo: string | null;
  notes: string | null;
  items: DeliveryNoteItem[];
  invoices?: { id: string; invoiceNumber: string; }[];
  createdAt: string;
}

export interface DeliveryNoteItem {
  id: string;
  productId: string;
  product: { id: string; name: string; sku: string; };
  productVariantId: string | null;
  productVariant: { id: string; name: string; sku: string; } | null;
  batchNo: string | null;
  quantity: number;
  salesOrderItemId: string | null;
}
```

### Service

```typescript
export const deliveryNoteService = {
  getAll: (params?: Record<string, any>) =>
    api.get('/delivery-notes', { params }),
  getById: (id: string) =>
    api.get(`/delivery-notes/${id}`),
  create: (data: any) =>
    api.post('/delivery-notes', data),
  dispatch: (id: string) =>
    api.patch(`/delivery-notes/${id}/dispatch`),
  deliver: (id: string) =>
    api.patch(`/delivery-notes/${id}/deliver`),
  cancel: (id: string, reason: string) =>
    api.patch(`/delivery-notes/${id}/cancel`, { cancelReason: reason }),
};
```

### Integration with SO Detail Page

- SO Detail should have "Create Delivery Note" button that navigates to `/delivery-notes/new?salesOrderId=xxx`
- CreateDeliveryNotePage reads `salesOrderId` from URL params, fetches SO deliverable items, and pre-fills

### Key Patterns

- Follow `CreateInvoicePage.tsx` pattern for item selection form
- Use `Modal` for confirmation dialogs (dispatch, cancel)
- Use `toast` for success/error messages
- Breadcrumbs as inline div
- Skeleton loaders for loading states
- No `Tabs` — use inline button group or simple filter buttons

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 1.0 | Initial story creation | Claude (AI Planning) |
