# Story 3.9: Sales Returns and Credit Notes

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.9
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 3.2 (Sales Invoice Creation)
**Status:** New

---

## User Story

**As an** accountant,
**I want** to process sales returns for paid or partially paid invoices and issue a credit note,
**So that** returned inventory is restocked and client accounts are accurately adjusted.

---

## Acceptance Criteria

1.  **Credit Note Creation:**
    *   [ ] Can create a credit note from an existing, paid or partially paid invoice.
    *   [ ] Cannot create a credit note for an unpaid or voided invoice.
    *   [ ] User can select which items and quantities from the original invoice are being returned.
    *   [ ] The return quantity cannot exceed the originally sold quantity.

2.  **Database Schema:**
    *   [ ] `CreditNote` table created: `id`, `creditNoteNumber`, `invoiceId`, `clientId`, `reason`, `totalAmount`, `status` (e.g., `APPLIED`, `OPEN`).
    *   [ ] `CreditNoteItem` table created: `id`, `creditNoteId`, `invoiceItemId`, `productId`, `quantityReturned`, `unitPrice`, `totalPrice`.

3.  **Inventory & Balance Adjustment:**
    *   [ ] When a credit note is created, the returned items are added back to inventory.
    *   [ ] A `StockMovement` record is created for the return (type = `SALES_RETURN`).
    *   [ ] The client's balance is adjusted. The credit note amount can be applied to other outstanding invoices or held as a credit on the client's account.

4.  **Backend API Endpoints:**
    *   [ ] `POST /api/credit-notes` - Creates a new credit note from an invoice.
    *   [ ] `GET /api/credit-notes` - Returns a list of credit notes.
    *   [ ] `GET /api/credit-notes/:id` - Returns details of a specific credit note.

5.  **Frontend UI:**
    *   [ ] A "Create Return" button is available on the invoice details page for eligible invoices.
    - [ ] A form allows the user to select items and quantities to return.
    *   [ ] The system displays the calculated credit amount.
    *   [ ] Credit notes are listed on the client's detail page.

6.  **Authorization:**
    *   [ ] Only `Admin` and `Accountant` roles can create credit notes.
    *   [ ] All roles can view created credit notes.

7.  **Audit Logging:**
    *   [ ] Creation of a credit note is logged in the audit trail, including the reason and items returned.

---

## Dev Notes

### Database Schema (Prisma)

```prisma
model CreditNote {
  id               String           @id @default(cuid())
  creditNoteNumber String           @unique
  invoiceId        String
  clientId         String
  reason           String           @db.Text
  totalAmount      Decimal          @db.Decimal(12, 2)
  status           CreditNoteStatus @default(OPEN)
  createdAt        DateTime         @default(now())
  createdBy        String

  invoice          Invoice          @relation(fields: [invoiceId], references: [id])
  client           Client           @relation(fields: [clientId], references: [id])
  creator          User             @relation(fields: [createdBy], references: [id])
  items            CreditNoteItem[]

  @@map("credit_notes")
}

model CreditNoteItem {
  id             String      @id @default(cuid())
  creditNoteId   String
  invoiceItemId  String
  productId      String
  quantityReturned Int
  unitPrice      Decimal     @db.Decimal(10, 2)
  totalPrice     Decimal     @db.Decimal(12, 2)

  creditNote     CreditNote  @relation(fields: [creditNoteId], references: [id], onDelete: Cascade)
  product        Product     @relation(fields: [productId], references: [id])

  @@map("credit_note_items")
}

enum CreditNoteStatus {
  OPEN    // Credit is available to be applied
  APPLIED // Credit has been fully applied to other invoices
  VOIDED
}
```

### Business Logic

1.  **Credit Note Number Generation:** Similar to invoices, generate a unique, sequential number (e.g., `CN-YYYYMMDD-XXX`).
2.  **Stock Restocking:** When a credit note is created, the `quantityReturned` for each item is added back to the inventory. A new `StockMovement` of type `SALES_RETURN` is created.
3.  **Client Balance:** The `totalAmount` of the credit note is subtracted from the client's `balance`. If this results in a negative balance, it indicates the client has credit.
4.  **Applying Credit:** A separate workflow (potentially in the payment recording screen) will be needed to allow applying this credit to other invoices. For the MVP of this story, simply adjusting the balance is sufficient.
