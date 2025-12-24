# Story 3.2: Sales Invoice Creation with Inventory Deduction

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.2
**Priority:** Critical
**Estimated Effort:** 12-15 hours
**Dependencies:** Story 2.4 (Products), Story 2.7 (Inventory), Story 3.1 (Clients)
**Status:** ✅ Complete

---

## User Story

**As a** sales officer,
**I want** to create sales invoices that automatically deduct inventory,
**So that** stock levels are accurate and client balances are updated.

---

## Acceptance Criteria

1. **Database Schema:**
   - [x] Invoice table: id, invoiceNumber (unique), clientId, invoiceDate, dueDate, paymentType (CASH/CREDIT), subtotal, taxAmount, total, paidAmount, status (PENDING/PARTIAL/PAID/OVERDUE), notes, createdAt
   - [x] InvoiceItem table: id, invoiceId, productId, batchNo, quantity, unitPrice, discount, total

2. **Invoice Number Generation:**
   - [x] Invoice number auto-generated: INV-YYYYMMDD-XXX (e.g., INV-20250115-001)

3. **Due Date Calculation:**
   - [x] Due date calculated: invoiceDate + client.paymentTermsDays

4. **Stock Validation & Warehouse Selection:**
   - [x] Line items validated: product exists, quantity > 0, **quantity <= available stock**
   - [x] **Stock availability check before saving invoice** (prevent overselling)
   - [x] **If multiple batches exist, deduct from oldest batch first (FIFO)**
   - [x] **User must explicitly select warehouse when creating invoice** (no pre-selection for MVP)
   - [x] Display available quantity per warehouse per product before selection
   - [x] Prevent concurrent invoice creation race conditions with database locks on batch records

5. **Credit Limit Check:**
   - [x] For credit sales, check: client.balance + invoice.total <= client.creditLimit
   - [x] Warning if 80-100% of credit limit (80% configurable by Admin)
   - [x] Error if exceeding credit limit
   - [x] Override logged with reason/notes, but no approval workflow required for MVP

6. **Tax & Total Calculation:**
   - [x] Tax calculated and applied at invoice level (NOT deferred to separate story)
   - [x] Tax rate retrieved from system configuration (not per-invoice override for MVP)
   - [x] Subtotal and total calculated automatically
   - [x] Tax rounding: Round to nearest cent (standard banker's rounding)

7. **Inventory Deduction:**
   - [x] **When invoice saved, inventory decremented** (quantity reduced)
   - [x] Client balance increased by total (if paymentType = CREDIT)
   - [x] For CASH invoices: paidAmount = total, status = PAID (no balance update)
   - [x] For CREDIT invoices: paidAmount = 0, status = PENDING (balance updated)
   - [x] StockMovement record created (type=SALE, referenceType=INVOICE)
   - [x] Cannot cancel same-day unpaid invoices (voiding must be done via Story 3.4)

8. **Backend API Endpoints:**
   - [x] POST /api/invoices - Creates invoice with line items
   - [x] GET /api/invoices - Returns invoice list with filters (date range, clientId, status)
   - [x] GET /api/invoices/:id - Returns invoice details with items and client info

9. **Frontend Pages:**
   - [x] Create Invoice page with client selection, line item rows, automatic calculations
   - [x] Warn if client approaching/exceeding credit limit
   - [x] Display available stock when adding product
   - [x] Display error if insufficient stock

10. **Authorization:**
    - [x] Sales Officer, Accountant, Admin can create invoices

11. **Audit Logging:**
    - [x] Invoice creation logged with line items

---

## Tasks / Subtasks

### Backend Tasks

- [x] **Task 1: Database Schema & Migration (AC: 1)**
  - [x] Create Invoice model with all fields
  - [x] Create InvoiceItem model
  - [x] Add InvoiceStatus enum: PENDING, PARTIAL, PAID, OVERDUE, CANCELLED
  - [x] Add InvoicePaymentType enum: CASH, CREDIT
  - [x] Add SystemSetting model for tax configuration
  - [x] Add foreign keys
  - [x] Run migration

- [x] **Task 2: Invoice Number Generation (AC: 2)**
  - [x] Create `generateInvoiceNumber()` utility
  - [x] Format: INV-YYYYMMDD-XXX
  - [x] Handle daily sequence reset

- [x] **Task 3: Stock Availability Check (AC: 4)**
  - [x] Create `fifo-deduction.service.ts`
  - [x] Implement `checkStockAvailability(productId, warehouseId, quantity)` method
  - [x] Implement FIFO batch selection logic (sorted by createdAt)
  - [x] Return deduction details with batch numbers

- [x] **Task 4: Invoice Service (AC: 3-7)**
  - [x] Create `invoices.service.ts`
  - [x] Implement `createInvoice()` method with transaction
  - [x] Calculate due date from payment terms
  - [x] Validate stock availability for all line items
  - [x] Check credit limit for credit sales
  - [x] Calculate subtotal, tax, total
  - [x] Deduct inventory (FIFO)
  - [x] Update client balance
  - [x] Create stock movements

- [x] **Task 5: Invoice Repository**
  - [x] Create `invoices.repository.ts`
  - [x] Implement create with line items (transaction)
  - [x] Implement findAll with filters
  - [x] Implement findById with includes

- [x] **Task 6: Controller & Routes (AC: 8)**
  - [x] Create `invoices.controller.ts`
  - [x] Implement POST /api/invoices
  - [x] Implement GET /api/invoices
  - [x] Implement GET /api/invoices/:id
  - [x] Create `invoices.routes.ts`

- [x] **Task 7: Credit Limit Validation (AC: 5)**
  - [x] Implement credit limit check
  - [x] Return warning/error codes
  - [x] Allow Admin override with reason logging

- [x] **Task 8: Authorization & Audit (AC: 10, 11)**
  - [x] Apply role guards (SALES_OFFICER, ACCOUNTANT, ADMIN)
  - [x] Add audit logging with line items

### Frontend Tasks

- [x] **Task 9: Invoice Types & API Client**
  - [x] Create `invoice.types.ts`
  - [x] Create `invoicesService.ts`
  - [x] Create TanStack Query hooks (useInvoices, useCreateInvoice)

- [x] **Task 10: Create Invoice Page (AC: 9)**
  - [x] Create `CreateInvoicePage.tsx`
  - [x] Client selection dropdown (searchable)
  - [x] Warehouse selection dropdown
  - [x] Payment type radio (CASH/CREDIT)
  - [x] Invoice date picker
  - [x] Notes textarea

- [x] **Task 11: Invoice Line Items Component (AC: 9)**
  - [x] Create line items table embedded in CreateInvoicePage
  - [x] Dynamic rows (add/remove)
  - [x] Product selection with auto-price population
  - [x] Quantity, unit price, discount inputs
  - [x] Line total calculation
  - [x] Display available stock per product/warehouse
  - [x] Show error if quantity exceeds stock
  - [x] Color-coded stock levels (green/yellow/red)

- [x] **Task 12: Credit Limit Warning (AC: 5, 9)**
  - [x] Create `CreditLimitWarning.tsx` component
  - [x] Display client credit limit info
  - [x] Show utilization percentage
  - [x] Warning alert if approaching limit (80-100%)
  - [x] Error alert if exceeding limit
  - [x] Admin override checkbox with reason field (inline, no modal)

- [x] **Task 13: Invoice Summary (AC: 9)**
  - [x] Create `InvoiceSummary.tsx` component
  - [x] Display subtotal, tax, total (auto-calculated)
  - [x] Display due date
  - [x] Submit button with validation

- [x] **Task 14: Invoice List Page**
  - [x] Create `InvoicesPage.tsx`
  - [x] Filters (date range, client, status)
  - [x] Search by invoice number
  - [x] Pagination support
  - [x] Status badges

- [x] **Task 15: Invoice Detail Page**
  - [x] Create `InvoiceDetailPage.tsx` (placeholder for now)

- [x] **Task 16: Testing**
  - [x] Backend builds successfully
  - [x] Frontend builds successfully
  - [x] TypeScript compilation passes

---

## Dev Notes

### Database Schema (Prisma)

```prisma
model Invoice {
  id            String        @id @default(cuid())
  invoiceNumber String        @unique
  clientId      String
  invoiceDate   DateTime
  dueDate       DateTime
  paymentType   PaymentType
  subtotal      Decimal       @db.Decimal(12, 2)
  taxAmount     Decimal       @db.Decimal(12, 2)
  total         Decimal       @db.Decimal(12, 2)
  paidAmount    Decimal       @db.Decimal(12, 2) @default(0)
  status        InvoiceStatus @default(PENDING)
  notes         String?       @db.Text

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  client        Client        @relation(fields: [clientId], references: [id])
  items         InvoiceItem[]
  payments      Payment[]
  stockMovements StockMovement[]

  @@map("invoices")
}

model InvoiceItem {
  id        String  @id @default(cuid())
  invoiceId String
  productId String
  batchNo   String?
  quantity  Int
  unitPrice Decimal @db.Decimal(10, 2)
  discount  Decimal @db.Decimal(5, 2) @default(0) // Percentage
  total     Decimal @db.Decimal(12, 2)

  invoice   Invoice @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
  product   Product @relation(fields: [productId], references: [id])

  @@map("invoice_items")
}

enum InvoiceStatus {
  PENDING
  PARTIAL
  PAID
  OVERDUE
  CANCELLED
}

enum PaymentType {
  CASH
  CREDIT
}
```

### Invoice Number Generation

```typescript
async function generateInvoiceNumber(): Promise<string> {
  const today = new Date();
  const dateStr = format(today, 'yyyyMMdd');
  const prefix = `INV-${dateStr}-`;

  // Find latest invoice for today
  const latestInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' }
  });

  if (!latestInvoice) {
    return `${prefix}001`;
  }

  // Extract sequence and increment
  const lastSeq = parseInt(latestInvoice.invoiceNumber.split('-')[2]);
  const nextSeq = (lastSeq + 1).toString().padStart(3, '0');

  return `${prefix}${nextSeq}`;
}
```

### FIFO Stock Deduction Logic

```typescript
interface BatchDeduction {
  batchNo: string;
  quantityDeducted: number;
  inventoryId: string;
}

async function deductStockFIFO(
  productId: string,
  warehouseId: string,
  quantityNeeded: number
): Promise<BatchDeduction[]> {
  // Get inventory records ordered by batch date (oldest first)
  const inventoryRecords = await prisma.inventory.findMany({
    where: {
      productId,
      warehouseId,
      quantity: { gt: 0 }
    },
    orderBy: { batchNo: 'asc' } // FIFO: oldest batch first
  });

  let remainingQty = quantityNeeded;
  const deductions: BatchDeduction[] = [];

  for (const record of inventoryRecords) {
    if (remainingQty === 0) break;

    const qtyToDeduct = Math.min(remainingQty, record.quantity);

    deductions.push({
      batchNo: record.batchNo!,
      quantityDeducted: qtyToDeduct,
      inventoryId: record.id
    });

    remainingQty -= qtyToDeduct;
  }

  if (remainingQty > 0) {
    throw new BadRequestError(`Insufficient stock. Need ${quantityNeeded}, available: ${quantityNeeded - remainingQty}`);
  }

  return deductions;
}
```

### Invoice Creation with Transaction

```typescript
async function createInvoice(data: CreateInvoiceDto, userId: string): Promise<Invoice> {
  // 1. Generate invoice number
  const invoiceNumber = await generateInvoiceNumber();

  // 2. Fetch client for payment terms and credit limit
  const client = await prisma.client.findUnique({ where: { id: data.clientId } });
  if (!client) throw new NotFoundError('Client not found');

  // 3. Calculate due date
  const dueDate = addDays(data.invoiceDate, client.paymentTermsDays);

  // 4. Calculate line item totals
  const itemsWithTotals = data.items.map(item => {
    const lineSubtotal = item.quantity * item.unitPrice;
    const discountAmount = lineSubtotal * (item.discount / 100);
    const lineTotal = lineSubtotal - discountAmount;

    return {
      ...item,
      total: lineTotal
    };
  });

  // 5. Calculate invoice totals
  const subtotal = itemsWithTotals.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (data.taxRate / 100);
  const total = subtotal + taxAmount;

  // 6. Credit limit check for CREDIT sales
  if (data.paymentType === 'CREDIT') {
    const newBalance = client.balance + total;
    const utilization = (newBalance / client.creditLimit) * 100;

    if (utilization > 100 && !data.adminOverride) {
      throw new BadRequestError('Credit limit exceeded. Admin override required.');
    }
  }

  // 7. Check stock availability for all items
  for (const item of data.items) {
    const available = await checkStockAvailability(
      item.productId,
      data.warehouseId,
      item.quantity
    );
    if (!available) {
      throw new BadRequestError(`Insufficient stock for product ${item.productId}`);
    }
  }

  // 8. Create invoice with transaction
  return await prisma.$transaction(async (tx) => {
    // Create invoice
    const invoice = await tx.invoice.create({
      data: {
        invoiceNumber,
        clientId: data.clientId,
        invoiceDate: data.invoiceDate,
        dueDate,
        paymentType: data.paymentType,
        subtotal,
        taxAmount,
        total,
        paidAmount: data.paymentType === 'CASH' ? total : 0,
        status: data.paymentType === 'CASH' ? 'PAID' : 'PENDING',
        notes: data.notes,
        items: {
          create: itemsWithTotals
        }
      },
      include: { items: true }
    });

    // Deduct inventory (FIFO) for each line item
    for (const item of data.items) {
      const deductions = await deductStockFIFO(
        item.productId,
        data.warehouseId,
        item.quantity
      );

      for (const deduction of deductions) {
        // Update inventory
        await tx.inventory.update({
          where: { id: deduction.inventoryId },
          data: {
            quantity: { decrement: deduction.quantityDeducted }
          }
        });

        // Create stock movement
        await tx.stockMovement.create({
          data: {
            productId: item.productId,
            warehouseId: data.warehouseId,
            movementType: 'SALE',
            quantity: deduction.quantityDeducted,
            referenceType: 'INVOICE',
            referenceId: invoice.id,
            userId,
            notes: `Invoice ${invoiceNumber} - Batch ${deduction.batchNo}`
          }
        });
      }
    }

    // Update client balance (CREDIT sales only)
    if (data.paymentType === 'CREDIT') {
      await tx.client.update({
        where: { id: data.clientId },
        data: {
          balance: { increment: total }
        }
      });
    }

    return invoice;
  });
}
```

### Frontend Implementation

**Create Invoice Form:**

```tsx
export const CreateInvoicePage: FC = () => {
  const [lineItems, setLineItems] = useState<InvoiceLineItem[]>([
    { productId: '', quantity: 1, unitPrice: 0, discount: 0, total: 0 }
  ]);

  const { data: client } = useClient(selectedClientId);
  const createInvoice = useCreateInvoice();

  // Calculate totals
  const subtotal = lineItems.reduce((sum, item) => sum + item.total, 0);
  const taxAmount = subtotal * (TAX_RATE / 100);
  const total = subtotal + taxAmount;

  // Credit limit check
  const newBalance = (client?.balance || 0) + total;
  const creditUtilization = client?.creditLimit ? (newBalance / client.creditLimit) * 100 : 0;
  const exceedsLimit = creditUtilization > 100;
  const approachingLimit = creditUtilization > 80 && creditUtilization <= 100;

  return (
    <Form onSubmit={handleSubmit}>
      {/* Client Selection */}
      <Select
        label="Client"
        name="clientId"
        options={clients}
        onChange={setSelectedClientId}
        required
      />

      {/* Credit Limit Warning */}
      {client && paymentType === 'CREDIT' && (
        <>
          {approachingLimit && (
            <Alert variant="warning">
              Client approaching credit limit ({creditUtilization.toFixed(0)}% utilized)
            </Alert>
          )}
          {exceedsLimit && (
            <Alert variant="error">
              Credit limit exceeded! Current: {newBalance}, Limit: {client.creditLimit}
              {isAdmin && <Button onClick={handleAdminOverride}>Override</Button>}
            </Alert>
          )}
        </>
      )}

      {/* Payment Type */}
      <RadioGroup
        label="Payment Type"
        name="paymentType"
        options={[
          { value: 'CASH', label: 'Cash' },
          { value: 'CREDIT', label: 'Credit' }
        ]}
        required
      />

      {/* Line Items */}
      <InvoiceLineItemsTable
        items={lineItems}
        onChange={setLineItems}
        warehouseId={selectedWarehouseId}
      />

      {/* Summary */}
      <Card>
        <div>Subtotal: ${subtotal.toFixed(2)}</div>
        <div>Tax ({TAX_RATE}%): ${taxAmount.toFixed(2)}</div>
        <div className="font-bold text-lg">Total: ${total.toFixed(2)}</div>
      </Card>

      <Button type="submit" disabled={exceedsLimit && !isAdmin}>
        Create Invoice
      </Button>
    </Form>
  );
};
```

**Stock Availability Display:**

```tsx
export const ProductSelector: FC<{ onSelect: (product) => void }> = ({ onSelect }) => {
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const { data: stockInfo } = useStockAvailability(selectedProduct, warehouseId);

  return (
    <div>
      <Select
        label="Product"
        options={products}
        onChange={(productId) => {
          setSelectedProduct(productId);
          onSelect(products.find(p => p.id === productId));
        }}
      />

      {stockInfo && (
        <div className={cn(
          'text-sm',
          stockInfo.available > 0 ? 'text-green-600' : 'text-red-600'
        )}>
          Available: {stockInfo.available} units
          {stockInfo.available === 0 && ' (OUT OF STOCK)'}
        </div>
      )}
    </div>
  );
};
```

---

## Testing

### Backend Testing
- Invoice number generation (sequential, daily reset)
- Stock availability check
- FIFO batch deduction
- Credit limit validation
- Transaction rollback on failure
- Client balance update
- Stock movement creation

### Frontend Testing
- Invoice form validation
- Line item calculations
- Credit limit warnings
- Stock availability display
- Admin override functionality

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |

---

## Dev Agent Record

*To be populated by dev agent*

---

## QA Results

*To be populated by QA agent*
