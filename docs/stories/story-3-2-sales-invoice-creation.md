# Story 3.2: Sales Invoice Creation with Inventory Deduction

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.2
**Priority:** Critical
**Estimated Effort:** 12-15 hours
**Dependencies:** Story 2.4 (Products), Story 2.7 (Inventory), Story 3.1 (Clients)
**Status:** Draft

---

## User Story

**As a** sales officer,
**I want** to create sales invoices that automatically deduct inventory,
**So that** stock levels are accurate and client balances are updated.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Invoice table: id, invoiceNumber (unique), clientId, invoiceDate, dueDate, paymentType (CASH/CREDIT), subtotal, taxAmount, total, paidAmount, status (PENDING/PARTIAL/PAID/OVERDUE), notes, createdAt
   - [ ] InvoiceItem table: id, invoiceId, productId, batchNo, quantity, unitPrice, discount, total

2. **Invoice Number Generation:**
   - [ ] Invoice number auto-generated: INV-YYYYMMDD-XXX (e.g., INV-20250115-001)

3. **Due Date Calculation:**
   - [ ] Due date calculated: invoiceDate + client.paymentTermsDays

4. **Stock Validation:**
   - [ ] Line items validated: product exists, quantity > 0, **quantity <= available stock**
   - [ ] **Stock availability check before saving invoice** (prevent overselling)
   - [ ] **If multiple batches exist, deduct from oldest batch first (FIFO)**

5. **Credit Limit Check:**
   - [ ] For credit sales, check: client.balance + invoice.total <= client.creditLimit
   - [ ] Warning if 80-100% of credit limit
   - [ ] Error if exceeding credit limit (Admin can override)

6. **Tax & Total Calculation:**
   - [ ] Tax calculated per line item if applicable
   - [ ] Subtotal and total calculated automatically

7. **Inventory Deduction:**
   - [ ] **When invoice saved, inventory decremented** (quantity reduced)
   - [ ] Client balance increased by total (if paymentType = CREDIT)
   - [ ] StockMovement record created (type=SALE, referenceType=INVOICE)

8. **Backend API Endpoints:**
   - [ ] POST /api/invoices - Creates invoice with line items
   - [ ] GET /api/invoices - Returns invoice list with filters (date range, clientId, status)
   - [ ] GET /api/invoices/:id - Returns invoice details with items and client info

9. **Frontend Pages:**
   - [ ] Create Invoice page with client selection, line item rows, automatic calculations
   - [ ] Warn if client approaching/exceeding credit limit
   - [ ] Display available stock when adding product
   - [ ] Display error if insufficient stock

10. **Authorization:**
    - [ ] Sales Officer, Accountant, Admin can create invoices

11. **Audit Logging:**
    - [ ] Invoice creation logged with line items

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Database Schema & Migration (AC: 1)**
  - [ ] Create Invoice model with all fields
  - [ ] Create InvoiceItem model
  - [ ] Add InvoiceStatus enum: PENDING, PARTIAL, PAID, OVERDUE, CANCELLED
  - [ ] Add PaymentType enum: CASH, CREDIT
  - [ ] Add foreign keys
  - [ ] Run migration

- [ ] **Task 2: Invoice Number Generation (AC: 2)**
  - [ ] Create `generateInvoiceNumber()` utility
  - [ ] Format: INV-YYYYMMDD-XXX
  - [ ] Handle daily sequence reset

- [ ] **Task 3: Stock Availability Check (AC: 4)**
  - [ ] Create `stock-availability.service.ts`
  - [ ] Implement `checkStockAvailability(productId, warehouseId, quantity)` method
  - [ ] Implement FIFO batch selection logic
  - [ ] Return available batches with quantities

- [ ] **Task 4: Invoice Service (AC: 3-7)**
  - [ ] Create `invoices.service.ts`
  - [ ] Implement `createInvoice()` method with transaction
  - [ ] Calculate due date from payment terms
  - [ ] Validate stock availability for all line items
  - [ ] Check credit limit for credit sales
  - [ ] Calculate subtotal, tax, total
  - [ ] Deduct inventory (FIFO)
  - [ ] Update client balance
  - [ ] Create stock movements

- [ ] **Task 5: Invoice Repository**
  - [ ] Create `invoices.repository.ts`
  - [ ] Implement create with line items (transaction)
  - [ ] Implement findAll with filters
  - [ ] Implement findById with includes

- [ ] **Task 6: Controller & Routes (AC: 8)**
  - [ ] Create `invoices.controller.ts`
  - [ ] Implement POST /api/invoices
  - [ ] Implement GET /api/invoices
  - [ ] Implement GET /api/invoices/:id
  - [ ] Create `invoices.routes.ts`

- [ ] **Task 7: Credit Limit Validation (AC: 5)**
  - [ ] Implement credit limit check
  - [ ] Return warning/error codes
  - [ ] Allow Admin override

- [ ] **Task 8: Authorization & Audit (AC: 10, 11)**
  - [ ] Apply role guards
  - [ ] Add audit logging with line items

### Frontend Tasks

- [ ] **Task 9: Invoice Types & API Client**
  - [ ] Create `invoice.types.ts`
  - [ ] Create `invoicesService.ts`
  - [ ] Create TanStack Query hooks

- [ ] **Task 10: Create Invoice Page (AC: 9)**
  - [ ] Create `CreateInvoicePage.tsx`
  - [ ] Client selection dropdown (searchable)
  - [ ] Payment type radio (CASH/CREDIT)
  - [ ] Invoice date picker
  - [ ] Notes textarea

- [ ] **Task 11: Invoice Line Items Component (AC: 9)**
  - [ ] Create `InvoiceLineItemsTable.tsx`
  - [ ] Dynamic rows (add/remove)
  - [ ] Product selection with stock availability display
  - [ ] Quantity, unit price, discount inputs
  - [ ] Line total calculation
  - [ ] Display available stock per product
  - [ ] Show error if quantity exceeds stock

- [ ] **Task 12: Credit Limit Warning (AC: 5, 9)**
  - [ ] Display client credit limit info
  - [ ] Show utilization percentage
  - [ ] Warning alert if approaching limit (80-100%)
  - [ ] Error alert if exceeding limit
  - [ ] Admin override modal

- [ ] **Task 13: Invoice Summary (AC: 9)**
  - [ ] Display subtotal, tax, total (auto-calculated)
  - [ ] Display due date
  - [ ] Submit button with validation

- [ ] **Task 14: Testing**
  - [ ] Backend tests (invoice creation, stock deduction, FIFO, credit limit)
  - [ ] Frontend tests (form validation, calculations, stock checks)

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
