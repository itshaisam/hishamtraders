# Story 10.8: Purchase Invoice — Frontend

**Epic:** Epic 10 - Standardized Sales, Purchasing & Inventory Flow
**Story ID:** STORY-10.8
**Priority:** Medium
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 10.7 (PI Backend)
**Status:** Completed

---

## User Story

**As an** accountant,
**I want** a Purchase Invoices UI to record supplier bills and verify 3-way matching,
**So that** I can ensure goods received match what was ordered and invoiced before authorizing payment.

---

## Acceptance Criteria

### 1. Purchase Invoices List Page (`/purchase-invoices`)

- [ ] Table columns: Internal #, Supplier Invoice #, Supplier, PO #, Date, Total, Paid, Status, Actions
- [ ] Status filter: PENDING, PARTIAL, PAID, CANCELLED
- [ ] Search by internal number, supplier invoice number, or supplier name
- [ ] Date range filter
- [ ] Pagination
- [ ] Status badges:
  - PENDING: amber
  - PARTIAL: blue
  - PAID: green
  - CANCELLED: red
- [ ] Outstanding amount column (Total - Paid)

### 2. Create Purchase Invoice Page (`/purchase-invoices/new`)

- [ ] **From GRN**: Pre-fill supplier, PO, and items from GRN
  - URL: `/purchase-invoices/new?grnId=xxx`
  - Items pre-populated with products and quantities from GRN
  - Unit costs pre-filled from PO items
- [ ] **From PO**: Pre-fill supplier and items from PO
  - URL: `/purchase-invoices/new?poId=xxx`
- [ ] **Standalone**: Manual supplier and item entry
- [ ] Fields:
  - Supplier selection (Combobox)
  - Supplier invoice number (text, required — their reference)
  - Invoice date (date picker)
  - Due date (date picker, optional)
  - Notes (textarea)
- [ ] Items table:
  - Product (Combobox)
  - Variant (if applicable)
  - Quantity
  - Unit cost
  - Line total (calculated)
  - Remove / Add buttons
- [ ] Summary: Subtotal, Tax Rate, Tax Amount, Total
- [ ] "Create Purchase Invoice" button
- [ ] Breadcrumb: Purchases > Purchase Invoices > New

### 3. Purchase Invoice Detail Page (`/purchase-invoices/:id`)

- [ ] Header: Internal #, Supplier Invoice #, Supplier, Date, Status
- [ ] Items table with costs
- [ ] **3-Way Matching Section** (if PO and GRN linked):
  - Side-by-side comparison table:
    | Product | PO Qty | PO Cost | GRN Qty | PI Qty | PI Cost | Qty Match | Cost Match |
  - Green checkmarks for matches, red X for mismatches
  - Summary: "All items match" or "X variances found"
- [ ] Payment history section (payments allocated to this PI)
- [ ] Linked documents: PO link, GRN link
- [ ] Action buttons:
  - PENDING/PARTIAL: "Record Payment" (navigates to supplier payment page with PI pre-selected)
  - PENDING: "Cancel"
- [ ] Breadcrumb: Purchases > Purchase Invoices > PI-20260223-001

### 4. Navigation

- [ ] Sidebar: "Purchase Invoices" under Purchases menu (after Goods Receipts)
- [ ] Accessible to ADMIN, ACCOUNTANT, WAREHOUSE_MANAGER

### 5. Service & Hooks

- [ ] `apps/web/src/services/purchaseInvoiceService.ts`
- [ ] `apps/web/src/hooks/usePurchaseInvoices.ts`
- [ ] `apps/web/src/types/purchase-invoice.types.ts`

### 6. Integration with Existing Pages

- [ ] GRN Detail Page: Add "Create Purchase Invoice" action button
- [ ] PO Detail Page: Add "Create Purchase Invoice" action button
- [ ] Supplier Payment Page: Add PI as a `paymentReferenceType` option

---

## Dev Notes

### Frontend Files

```
apps/web/src/features/purchase-invoices/
  pages/
    PurchaseInvoicesPage.tsx          (List)
    CreatePurchaseInvoicePage.tsx     (Create form)
    PurchaseInvoiceDetailPage.tsx     (Detail with 3-way match)

apps/web/src/services/purchaseInvoiceService.ts
apps/web/src/hooks/usePurchaseInvoices.ts
apps/web/src/types/purchase-invoice.types.ts
```

### Types

```typescript
export enum PurchaseInvoiceStatus {
  PENDING = 'PENDING',
  PARTIAL = 'PARTIAL',
  PAID = 'PAID',
  CANCELLED = 'CANCELLED',
}

export interface PurchaseInvoice {
  id: string;
  invoiceNumber: string;   // Supplier's invoice number
  internalNumber: string;  // Our internal PI-xxx number
  supplierId: string;
  supplier: { id: string; name: string; };
  poId: string | null;
  purchaseOrder?: { id: string; poNumber: string; };
  grnId: string | null;
  goodsReceiveNote?: { id: string; grnNumber: string; };
  invoiceDate: string;
  dueDate: string | null;
  subtotal: number;
  taxRate: number;
  taxAmount: number;
  total: number;
  paidAmount: number;
  status: PurchaseInvoiceStatus;
  notes: string | null;
  items: PurchaseInvoiceItem[];
  createdAt: string;
}

export interface ThreeWayMatchVariance {
  productId: string;
  productName: string;
  poQty: number;
  poUnitCost: number;
  grnQty: number;
  piQty: number;
  piUnitCost: number;
  qtyMatch: boolean;
  costMatch: boolean;
}
```

### 3-Way Matching UI Component

```tsx
// Render as a comparison table with visual indicators
function ThreeWayMatchTable({ variances }: { variances: ThreeWayMatchVariance[] }) {
  return (
    <Table>
      <thead>
        <tr>
          <th>Product</th>
          <th>PO Qty</th><th>PO Cost</th>
          <th>GRN Qty</th>
          <th>PI Qty</th><th>PI Cost</th>
          <th>Qty</th><th>Cost</th>
        </tr>
      </thead>
      <tbody>
        {variances.map(v => (
          <tr key={v.productId}>
            <td>{v.productName}</td>
            <td>{v.poQty}</td><td>{v.poUnitCost.toFixed(4)}</td>
            <td>{v.grnQty}</td>
            <td>{v.piQty}</td><td>{v.piUnitCost.toFixed(4)}</td>
            <td>{v.qtyMatch ? '✓' : '✗'}</td>
            <td>{v.costMatch ? '✓' : '✗'}</td>
          </tr>
        ))}
      </tbody>
    </Table>
  );
}
```

### Key Patterns

- Pre-fill from URL query params (grnId, poId)
- Follow `CreateInvoicePage.tsx` pattern for form structure
- Use `Badge` for match/mismatch indicators (green/red)
- 4 decimal places for costs (existing pattern)
- No `Tabs` — display matching section as a card below main content

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 1.0 | Initial story creation | Claude (AI Planning) |
