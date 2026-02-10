# Story 3.9: Sales Returns and Credit Notes

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.9
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 3.2 (Sales Invoice Creation), Story 3.4 (Invoice Voiding — reuse stock reversal pattern)
**Status:** Implemented (MVP)

---

## User Story

**As an** accountant,
**I want** to process sales returns for paid or partially paid invoices and issue a credit note,
**So that** returned inventory is restocked and client accounts are accurately adjusted.

---

## Acceptance Criteria

1.  **Credit Note Creation:**
    *   [x] Can create a credit note from an existing invoice with status `PAID` or `PARTIAL`.
    *   [x] Cannot create a credit note for `PENDING`, `VOIDED`, or `CANCELLED` invoices (use void for PENDING).
    *   [x] User selects which items and quantities from the original invoice are being returned.
    *   [x] Return quantity per item cannot exceed the originally invoiced quantity.
    *   [x] Multiple credit notes can be issued against the same invoice (partial returns over time), but total returned quantity per item across all credit notes must not exceed original quantity.

2.  **Database Schema:**
    *   [x] `CreditNote` model created (see Dev Notes).
    *   [x] `CreditNoteItem` model created (see Dev Notes).
    *   [x] `CreditNoteStatus` enum added: `OPEN`, `APPLIED`, `VOIDED`.
    *   [x] `MovementType` enum updated: add `SALES_RETURN`.
    *   [x] `ReferenceType` enum updated: add `CREDIT_NOTE`.
    *   [x] Relations added to `Invoice`, `Client`, `User`, `Product` models.

3.  **Inventory & Balance Adjustment:**
    *   [x] When credit note is created, returned items are restocked to the **same warehouse** as the original invoice.
    *   [x] Stock is added back to the original batch (by `batchNo` from InvoiceItem) when possible, or a new `RETURN-YYYYMMDD-XXX` batch is created (same pattern as `stock-reversal.service.ts`).
    *   [x] A `StockMovement` record is created per item: `movementType: SALES_RETURN`, `referenceType: CREDIT_NOTE`, `referenceId: creditNote.id`.
    *   [x] Client `balance` is decremented by the credit note `totalAmount`.

4.  **Backend API Endpoints:**
    *   [x] `POST /api/v1/credit-notes` — Create a credit note from an invoice.
    *   [x] `GET /api/v1/credit-notes` — List credit notes (with optional `clientId`, `invoiceId` filters + pagination).
    *   [x] `GET /api/v1/credit-notes/:id` — Get credit note details with items.

5.  **Frontend UI:**
    *   [x] "Create Return" button on Invoice Detail page — visible only for `PAID`/`PARTIAL` invoices.
    *   [x] Return form: select items, enter return quantities, enter reason.
    *   [x] Calculated credit amount shown before submission (subtotal + prorated tax).
    *   [x] Credit notes listed on Client Detail page.
    *   [x] `/returns` route: list all credit notes with filters (currently dead link in Sidebar).

6.  **Authorization:**
    *   [x] Only `ADMIN` and `ACCOUNTANT` roles can create credit notes.
    *   [x] All authenticated roles can view credit notes.

7.  **Audit Logging:**
    *   [x] `AuditService.log()` on credit note creation: action `CREATE`, entityType `CreditNote`, include reason, item count, and total amount in notes.

---

## Dev Notes

### Existing Code to Reuse

| What | Where | Reuse How |
|------|-------|-----------|
| Invoice number generation pattern | `apps/api/src/utils/invoice-number.util.ts` | Copy and adapt for `CN-YYYYMMDD-XXX` format |
| Stock reversal logic (batch lookup + fallback) | `apps/api/src/modules/invoices/stock-reversal.service.ts` | Same pattern: find original batch → increment, or create new batch |
| FIFO deduction service | `apps/api/src/modules/inventory/fifo-deduction.service.ts` | Reference for inventory operations |
| Invoice void flow (transaction pattern) | `apps/api/src/modules/invoices/invoices.service.ts:346-451` | Same $transaction pattern |
| AuditService | `apps/api/src/services/audit.service.js` | Direct call |

### Database Schema (Prisma)

Add to `prisma/schema.prisma`:

```prisma
// Add SALES_RETURN to existing MovementType enum
enum MovementType {
  RECEIPT
  SALE
  ADJUSTMENT
  TRANSFER
  SALES_RETURN  // NEW — Story 3.9
}

// Add CREDIT_NOTE to existing ReferenceType enum
enum ReferenceType {
  PO
  INVOICE
  ADJUSTMENT
  TRANSFER
  CREDIT_NOTE  // NEW — Story 3.9
}

// NEW enum
enum CreditNoteStatus {
  OPEN     // Credit available on client account
  APPLIED  // Fully applied (POST-MVP, see note)
  VOIDED   // Cancelled
}

// NEW model
model CreditNote {
  id               String           @id @default(cuid())
  creditNoteNumber String           @unique
  invoiceId        String
  clientId         String
  reason           String           @db.Text
  subtotal         Decimal          @db.Decimal(12, 2)
  taxAmount        Decimal          @db.Decimal(12, 2) @default(0)
  taxRate          Decimal          @db.Decimal(5, 2)  @default(0) // snapshot from invoice
  totalAmount      Decimal          @db.Decimal(12, 2)
  status           CreditNoteStatus @default(OPEN)
  createdBy        String
  createdAt        DateTime         @default(now())
  updatedAt        DateTime         @updatedAt

  invoice          Invoice          @relation(fields: [invoiceId], references: [id])
  client           Client           @relation(fields: [clientId], references: [id])
  creator          User             @relation("CreditNoteCreator", fields: [createdBy], references: [id])
  items            CreditNoteItem[]

  @@index([invoiceId])
  @@index([clientId])
  @@index([status])
  @@map("credit_notes")
}

// NEW model
model CreditNoteItem {
  id               String      @id @default(cuid())
  creditNoteId     String
  invoiceItemId    String
  productId        String
  productVariantId String?
  quantityReturned Int
  unitPrice        Decimal     @db.Decimal(10, 2)
  discount         Decimal     @db.Decimal(5, 2) @default(0) // mirrors InvoiceItem discount
  totalPrice       Decimal     @db.Decimal(12, 2)

  creditNote       CreditNote  @relation(fields: [creditNoteId], references: [id], onDelete: Cascade)
  invoiceItem      InvoiceItem @relation(fields: [invoiceItemId], references: [id])
  product          Product     @relation(fields: [productId], references: [id])
  productVariant   ProductVariant? @relation(fields: [productVariantId], references: [id])

  @@index([creditNoteId])
  @@index([invoiceItemId])
  @@map("credit_note_items")
}
```

**Required relation additions** (add to existing models):

```prisma
// In Invoice model — add:
creditNotes     CreditNote[]

// In Client model — add:
creditNotes     CreditNote[]

// In InvoiceItem model — add:
creditNoteItems CreditNoteItem[]

// In Product model — add (if not already):
creditNoteItems CreditNoteItem[]

// In ProductVariant model — add (if not already):
creditNoteItems CreditNoteItem[]

// In User model — add:
creditNotesCreated CreditNote[] @relation("CreditNoteCreator")
```

### Business Logic

#### 1. Credit Note Number Generation
- Format: `CN-YYYYMMDD-XXX` (daily sequential, same pattern as `INV-YYYYMMDD-XXX`)
- Create `apps/api/src/utils/credit-note-number.util.ts` following the pattern in `invoice-number.util.ts`

#### 2. Eligibility Check
```
Eligible = invoice.status IN ('PAID', 'PARTIAL')
         AND invoice.status NOT IN ('PENDING', 'VOIDED', 'CANCELLED', 'OVERDUE')
```
Note: `PENDING` invoices should be **voided** instead (Story 3.4), not returned.

#### 3. Return Quantity Validation
For each item being returned:
```
alreadyReturned = SUM(creditNoteItems.quantityReturned)
                  WHERE invoiceItemId = item.id
                  AND creditNote.status != 'VOIDED'

maxReturnable = invoiceItem.quantity - alreadyReturned
requested <= maxReturnable  // must be true
```

#### 4. Credit Amount Calculation
Per item:
```
lineSubtotal = quantityReturned * unitPrice
discountAmount = lineSubtotal * (discount / 100)   // mirror InvoiceItem discount
lineTotal = lineSubtotal - discountAmount
```
Credit note totals:
```
subtotal = SUM(item.totalPrice)
taxAmount = subtotal * (invoice.taxRate / 100)  // use snapshotted rate from invoice
totalAmount = subtotal + taxAmount
```
If the client was tax-exempt on the invoice (`invoice.taxRate == 0`), the credit note tax is also 0.

#### 5. Stock Restocking (within $transaction)
Reuse the pattern from `stock-reversal.service.ts:32-157`:
- For each CreditNoteItem:
  - Look up original batch using `invoiceItem.batchNo` in the invoice's warehouse
  - If found: `inventory.update({ quantity: { increment: quantityReturned } })`
  - If not found: create new inventory record with `batchNo: RETURN-YYYYMMDD-XXX`
  - Create `StockMovement` record:
    ```
    movementType: 'SALES_RETURN'
    referenceType: 'CREDIT_NOTE'
    referenceId: creditNote.id
    warehouseId: invoice.warehouseId
    quantity: quantityReturned
    ```

#### 6. Client Balance Adjustment
```typescript
await tx.client.update({
  where: { id: clientId },
  data: { balance: { decrement: totalAmount } }
});
```
Negative balance = client has credit on account. This is allowed.

#### 7. Invoice Status — NOT Changed
Creating a credit note does **not** change the invoice status. A PAID invoice remains PAID. The credit note is a separate document that adjusts the client's account balance.

### POST-MVP DEFERRED

- **Apply Credit to Outstanding Invoices**: The `APPLIED` status and workflow to apply credit notes against other invoices is deferred. For MVP, credit notes only adjust the client balance.
- **Credit Note Voiding**: Voiding a credit note (reversing the return) can be added later.
- **Return Reason Categories**: For MVP, free-text reason. Categorized reasons (defective, wrong item, etc.) deferred.
- **Print/Export Credit Note PDF**: Deferred.

### API Request/Response Shapes

#### POST /api/v1/credit-notes
```json
// Request
{
  "invoiceId": "clxxx...",
  "reason": "Defective items returned by client",
  "items": [
    { "invoiceItemId": "clyyy...", "quantityReturned": 5 },
    { "invoiceItemId": "clzzz...", "quantityReturned": 2 }
  ]
}

// Response
{
  "success": true,
  "data": {
    "id": "claaa...",
    "creditNoteNumber": "CN-20260210-001",
    "invoiceId": "clxxx...",
    "clientId": "clbbb...",
    "reason": "Defective items returned by client",
    "subtotal": 5000.00,
    "taxAmount": 900.00,
    "taxRate": 18.00,
    "totalAmount": 5900.00,
    "status": "OPEN",
    "items": [...]
  }
}
```

#### GET /api/v1/credit-notes
Query params: `clientId`, `invoiceId`, `status`, `page`, `limit`

#### GET /api/v1/credit-notes/:id
Returns full credit note with items, invoice reference, client info.

### Module Structure

```
apps/api/src/modules/credit-notes/
  credit-notes.controller.ts
  credit-notes.service.ts
  credit-notes.repository.ts
  credit-notes.routes.ts
  dto/
    create-credit-note.dto.ts

apps/api/src/utils/
  credit-note-number.util.ts  (NEW)
```

### Route Registration

In `apps/api/src/index.ts`, add:
```typescript
import { creditNotesRoutes } from './modules/credit-notes/credit-notes.routes.js';
app.use('/api/v1/credit-notes', creditNotesRoutes);
```

### Frontend Files

```
apps/web/src/features/returns/
  pages/
    ReturnsPage.tsx          — List all credit notes
    CreateReturnPage.tsx     — Return form (linked from Invoice Detail)
  components/
    CreditNoteDetail.tsx     — Detail view

apps/web/src/types/
  credit-note.types.ts       — CreditNote, CreditNoteItem, CreditNoteStatus types

apps/web/src/services/
  creditNotesService.ts      — API calls

apps/web/src/hooks/
  useCreditNotes.ts          — TanStack Query hooks
```

### Route Registration (Frontend)

In `apps/web/src/App.tsx`, add routes:
- `/returns` — `ReturnsPage` (list)
- `/returns/create/:invoiceId` — `CreateReturnPage` (create from invoice)
- `/returns/:id` — Credit note detail

The Sidebar already has a "Returns" link under Sales menu (`/returns`) — currently a dead link that will become active.

### Key Gotchas

1. **InvoiceItem has `batchNo`** — This is the first batch deducted during FIFO. For simplicity, restock to this batch. If the batch no longer exists, create a new one (same as `stock-reversal.service.ts`).
2. **InvoiceItem has `productVariantId`** — CreditNoteItem must track this for proper restocking.
3. **InvoiceItem has `discount`** — Credit note line totals must account for the same discount percentage.
4. **Multiple credit notes per invoice** — Must aggregate `quantityReturned` across existing non-voided credit notes to enforce limits.
5. **Client balance can go negative** — This is expected (means client has credit).
6. **Tax rate snapshot** — Use `invoice.taxRate`, NOT the current system tax rate. The rate may have changed since the invoice was created.

---

## Implementation Status

**Backend:** Fully implemented — `credit-notes` module with controller, service, repository, routes. Mounted at `/api/v1/credit-notes`.
**Frontend:** Fully implemented — `ReturnsPage` (list), `CreateReturnPage` (form), `CreditNoteDetailPage` (read-only detail). Routes registered in `App.tsx`. "Create Return" button on Invoice Detail page. Credit notes section on Client Detail page.
**Schema:** Fully migrated — `CreditNote`, `CreditNoteItem` models, `CreditNoteStatus` enum, `MovementType.SALES_RETURN`, `ReferenceType.CREDIT_NOTE` all in place.

### POST-MVP DEFERRED (Not Yet Implemented)

- `PATCH /:id/void` — Void a credit note (reverse stock restock, re-increment client balance)
- `PATCH /:id/apply` — Apply credit against outstanding invoices (change `OPEN` → `APPLIED`)
- Action buttons on `CreditNoteDetailPage` (currently read-only — no void/apply buttons)
- Return reason categories (currently free-text only)
- Print/Export credit note PDF
