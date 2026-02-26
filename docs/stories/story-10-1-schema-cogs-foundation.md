# Story 10.1: Schema Foundation & COGS Fix

**Epic:** Epic 10 - Standardized Sales, Purchasing & Inventory Flow
**Story ID:** STORY-10.1
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 10.0 (bug fix)
**Status:** Completed

---

## User Story

**As a** developer,
**I want** the database schema extended with Sales Order, Delivery Note, and Purchase Invoice models and the COGS accounting fix applied,
**So that** the foundation is ready for the complete document chain and financial statements are accurate.

---

## Acceptance Criteria

### 1. New Prisma Models

- [ ] **SalesOrder** model with all fields (see Schema below)
- [ ] **SalesOrderItem** model with deliveredQuantity, invoicedQuantity tracking
- [ ] **DeliveryNote** model with dispatch workflow fields
- [ ] **DeliveryNoteItem** model linking to SO items
- [ ] **PurchaseInvoice** model with supplier invoice number + internal number
- [ ] **PurchaseInvoiceItem** model with cost tracking

### 2. New Enums

- [ ] `SalesOrderStatus`: DRAFT, CONFIRMED, PARTIALLY_DELIVERED, DELIVERED, PARTIALLY_INVOICED, INVOICED, CANCELLED, CLOSED
- [ ] `DeliveryNoteStatus`: PENDING, DISPATCHED, DELIVERED, CANCELLED
- [ ] `PurchaseInvoiceStatus`: PENDING, PARTIAL, PAID, CANCELLED

### 3. Enum Extensions

- [ ] `ReferenceType` + SALES_ORDER, DELIVERY_NOTE, PURCHASE_INVOICE, DEBIT_NOTE
- [ ] `MovementType` + DELIVERY

### 4. Existing Model Modifications

- [ ] `Invoice` + `salesOrderId String?` + `deliveryNoteId String?` with relations
- [ ] All new models include `tenantId String` + `@@index([tenantId])`
- [ ] Number fields use `@@unique([tenantId, orderNumber/deliveryNoteNumber/internalNumber])`

### 5. COGS Fix (Critical)

- [ ] Add COGS posting to `AutoJournalService.onInvoiceCreated()`:
  - DR 5100 (COGS) — product.costPrice * quantity for each item
  - CR 1300 (Inventory) — same amount
- [ ] COGS amount calculated from product's `costPrice` field (landed cost)
- [ ] Only posted going forward — no historical backfill

### 6. Account Seeding

- [ ] Add account `5100` (COGS) to tenant creation script
- [ ] Account type: EXPENSE, isSystemAccount: true

### 7. Migration

- [ ] `prisma migrate dev` runs without errors
- [ ] Existing data unaffected (all new fields optional or have defaults)

---

## Dev Notes

### Schema: SalesOrder

```prisma
model SalesOrder {
  id                   String           @id @default(cuid())
  orderNumber          String
  clientId             String
  warehouseId          String
  orderDate            DateTime         @default(now())
  expectedDeliveryDate DateTime?
  paymentType          PaymentType
  subtotal             Decimal          @db.Decimal(14, 4)
  taxRate              Decimal          @db.Decimal(5, 4)
  taxAmount            Decimal          @db.Decimal(14, 4)
  total                Decimal          @db.Decimal(14, 4)
  status               SalesOrderStatus @default(DRAFT)
  notes                String?          @db.Text
  createdBy            String
  updatedBy            String?
  cancelReason         String?          @db.Text
  createdAt            DateTime         @default(now())
  updatedAt            DateTime         @updatedAt
  tenantId             String

  client    Client    @relation(fields: [clientId], references: [id])
  warehouse Warehouse @relation(fields: [warehouseId], references: [id])
  creator   User      @relation("SalesOrderCreator", fields: [createdBy], references: [id])
  items     SalesOrderItem[]
  deliveryNotes DeliveryNote[]
  invoices  Invoice[]

  @@unique([tenantId, orderNumber])
  @@index([tenantId])
  @@index([clientId])
  @@index([status])
}
```

### Schema: SalesOrderItem

```prisma
model SalesOrderItem {
  id                String  @id @default(cuid())
  salesOrderId      String
  productId         String
  productVariantId  String?
  quantity          Int
  deliveredQuantity Int     @default(0)
  invoicedQuantity  Int     @default(0)
  unitPrice         Decimal @db.Decimal(14, 4)
  discount          Decimal @default(0) @db.Decimal(5, 2)
  total             Decimal @db.Decimal(14, 4)
  tenantId          String

  salesOrder   SalesOrder      @relation(fields: [salesOrderId], references: [id])
  product      Product         @relation(fields: [productId], references: [id])
  productVariant ProductVariant? @relation(fields: [productVariantId], references: [id])
  deliveryNoteItems DeliveryNoteItem[]

  @@index([tenantId])
}
```

### Schema: DeliveryNote

```prisma
model DeliveryNote {
  id                 String             @id @default(cuid())
  deliveryNoteNumber String
  salesOrderId       String?
  clientId           String
  warehouseId        String
  deliveryDate       DateTime           @default(now())
  status             DeliveryNoteStatus @default(PENDING)
  deliveryAddress    String?            @db.Text
  driverName         String?
  vehicleNo          String?
  notes              String?            @db.Text
  createdBy          String
  dispatchedBy       String?
  completedBy        String?
  cancelReason       String?            @db.Text
  createdAt          DateTime           @default(now())
  updatedAt          DateTime           @updatedAt
  tenantId           String

  salesOrder SalesOrder? @relation(fields: [salesOrderId], references: [id])
  client     Client      @relation(fields: [clientId], references: [id])
  warehouse  Warehouse   @relation(fields: [warehouseId], references: [id])
  creator    User        @relation("DeliveryNoteCreator", fields: [createdBy], references: [id])
  dispatcher User?       @relation("DeliveryNoteDispatcher", fields: [dispatchedBy], references: [id])
  completer  User?       @relation("DeliveryNoteCompleter", fields: [completedBy], references: [id])
  items      DeliveryNoteItem[]
  invoices   Invoice[]

  @@unique([tenantId, deliveryNoteNumber])
  @@index([tenantId])
  @@index([clientId])
  @@index([salesOrderId])
  @@index([status])
}
```

### Schema: DeliveryNoteItem

```prisma
model DeliveryNoteItem {
  id               String  @id @default(cuid())
  deliveryNoteId   String
  salesOrderItemId String?
  productId        String
  productVariantId String?
  batchNo          String?
  quantity         Int
  tenantId         String

  deliveryNote   DeliveryNote    @relation(fields: [deliveryNoteId], references: [id], onDelete: Cascade)
  salesOrderItem SalesOrderItem? @relation(fields: [salesOrderItemId], references: [id])
  product        Product         @relation(fields: [productId], references: [id])
  productVariant ProductVariant? @relation(fields: [productVariantId], references: [id])

  @@index([tenantId])
}
```

### Schema: PurchaseInvoice

```prisma
model PurchaseInvoice {
  id             String                @id @default(cuid())
  invoiceNumber  String                // Supplier's invoice # (manual entry)
  internalNumber String                // Auto: PI-YYYYMMDD-NNN
  supplierId     String
  poId           String?
  grnId          String?
  invoiceDate    DateTime
  dueDate        DateTime?
  subtotal       Decimal               @db.Decimal(14, 4)
  taxRate        Decimal               @db.Decimal(5, 4)
  taxAmount      Decimal               @db.Decimal(14, 4)
  total          Decimal               @db.Decimal(14, 4)
  paidAmount     Decimal               @default(0) @db.Decimal(14, 4)
  status         PurchaseInvoiceStatus @default(PENDING)
  notes          String?               @db.Text
  createdBy      String
  createdAt      DateTime              @default(now())
  updatedAt      DateTime              @updatedAt
  tenantId       String

  supplier       Supplier          @relation(fields: [supplierId], references: [id])
  purchaseOrder  PurchaseOrder?    @relation(fields: [poId], references: [id])
  goodsReceiveNote GoodsReceiveNote? @relation(fields: [grnId], references: [id])
  creator        User              @relation("PurchaseInvoiceCreator", fields: [createdBy], references: [id])
  items          PurchaseInvoiceItem[]

  @@unique([tenantId, internalNumber])
  @@index([tenantId])
  @@index([supplierId])
  @@index([poId])
  @@index([status])
}
```

### Schema: PurchaseInvoiceItem

```prisma
model PurchaseInvoiceItem {
  id                String  @id @default(cuid())
  purchaseInvoiceId String
  productId         String
  productVariantId  String?
  quantity          Int
  unitCost          Decimal @db.Decimal(14, 4)
  total             Decimal @db.Decimal(14, 4)
  tenantId          String

  purchaseInvoice PurchaseInvoice @relation(fields: [purchaseInvoiceId], references: [id], onDelete: Cascade)
  product         Product         @relation(fields: [productId], references: [id])
  productVariant  ProductVariant? @relation(fields: [productVariantId], references: [id])

  @@index([tenantId])
}
```

### COGS Fix in AutoJournalService

Add to existing `onInvoiceCreated()` method in `apps/api/src/services/auto-journal.service.ts`:

```typescript
// After creating the A/R → Sales + Tax entry, add COGS entry:
// Calculate COGS from product cost prices
let totalCogs = 0;
for (const item of invoice.items) {
  const product = await tx.product.findUnique({
    where: { id: item.productId },
    select: { costPrice: true },
  });
  if (product?.costPrice) {
    totalCogs += Number(product.costPrice) * item.quantity;
  }
}

if (totalCogs > 0) {
  await createAutoJournalEntry(tx, {
    date: invoice.invoiceDate,
    description: `COGS for Invoice ${invoice.invoiceNumber}`,
    referenceType: 'INVOICE',
    referenceId: invoice.id,
    userId,
    lines: [
      { accountCode: '5100', debit: totalCogs, credit: 0, description: 'Cost of Goods Sold' },
      { accountCode: '1300', debit: 0, credit: totalCogs, description: 'Inventory reduction' },
    ],
  });
}
```

### Relations to Add to Existing Models

```prisma
// Add to User model:
salesOrdersCreated   SalesOrder[]    @relation("SalesOrderCreator")
deliveryNotesCreated DeliveryNote[]  @relation("DeliveryNoteCreator")
deliveryNotesDispatched DeliveryNote[] @relation("DeliveryNoteDispatcher")
deliveryNotesCompleted DeliveryNote[] @relation("DeliveryNoteCompleter")
purchaseInvoicesCreated PurchaseInvoice[] @relation("PurchaseInvoiceCreator")

// Add to Client model:
salesOrders   SalesOrder[]
deliveryNotes DeliveryNote[]

// Add to Warehouse model:
salesOrders   SalesOrder[]
deliveryNotes DeliveryNote[]

// Add to Product model:
salesOrderItems      SalesOrderItem[]
deliveryNoteItems    DeliveryNoteItem[]
purchaseInvoiceItems PurchaseInvoiceItem[]

// Add to ProductVariant model:
salesOrderItems      SalesOrderItem[]
deliveryNoteItems    DeliveryNoteItem[]
purchaseInvoiceItems PurchaseInvoiceItem[]

// Add to Invoice model:
salesOrderId   String?
deliveryNoteId String?
salesOrder     SalesOrder?   @relation(fields: [salesOrderId], references: [id])
deliveryNote   DeliveryNote? @relation(fields: [deliveryNoteId], references: [id])

// Add to Supplier model:
purchaseInvoices PurchaseInvoice[]

// Add to PurchaseOrder model:
purchaseInvoices PurchaseInvoice[]

// Add to GoodsReceiveNote model:
purchaseInvoices PurchaseInvoice[]
```

### Key Corrections

1. **Imports**: All `.ts` imports use `.js` extension
2. **`findUnique` vs `findFirst`**: Use `findFirst` for tenant-scoped unique lookups
3. **`getTenantId()`**: Required for all create operations
4. **No `new PrismaClient()`**: Use shared singleton from `lib/prisma.ts`
5. **COGS only going forward**: No backfill script needed

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-23 | 1.0 | Initial story creation | Claude (AI Planning) |
