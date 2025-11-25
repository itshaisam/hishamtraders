# Story 2.2: Purchase Order Creation

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2.2
**Priority:** High
**Estimated Effort:** 10-12 hours
**Dependencies:** Story 2.1 (Supplier Management), Story 2.4 (Product Master Data)
**Status:** Draft

---

## User Story

**As a** warehouse manager,
**I want** to create purchase orders for suppliers with line items and quantities,
**So that** incoming shipments are documented and expected.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] PurchaseOrder table created: id, supplierId, poNumber, orderDate, expectedArrivalDate, status (PENDING/IN_TRANSIT/RECEIVED/CANCELLED), totalAmount, notes, createdAt, updatedAt
   - [ ] POItem table created: id, poId, productId, quantity, unitCost, totalCost

2. **Backend API Endpoints:**
   - [ ] POST /api/purchase-orders - Creates PO with line items
   - [ ] GET /api/purchase-orders - Returns paginated PO list with filters (supplierId, status, date range)
   - [ ] GET /api/purchase-orders/:id - Returns PO with line items and supplier details
   - [ ] PUT /api/purchase-orders/:id - Updates PO (only if status = PENDING)
   - [ ] PATCH /api/purchase-orders/:id/status - Changes PO status workflow

3. **Validation:**
   - [ ] Line items validated: productId exists, quantity > 0, unitCost >= 0
   - [ ] Total amount calculated automatically (sum of line item totals)
   - [ ] PO assigned unique sequential number (PO-2025-001, PO-2025-002, etc.)

4. **Frontend Pages:**
   - [ ] Create PO page with supplier selection
   - [ ] Dynamic line item rows (add/remove)
   - [ ] Calculated total displayed
   - [ ] Purchase Orders List page with filters

5. **Authorization:**
   - [x] Warehouse Manager, Accountant, Admin can create POs (fixed in remediation)
   - [x] Sales/Recovery roles can view POs (read-only)
   - [x] Uses centralized permission matrix: `purchaseOrders: { create: ['ADMIN', 'ACCOUNTANT', 'WAREHOUSE_MANAGER'], ... }`
   - [x] Authorization checks via `requirePermission('purchaseOrders', action)` middleware

6. **Audit Logging:**
   - [ ] PO creation and updates logged in audit trail

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Database Schema & Migration (AC: 1)**
  - [ ] Create Prisma schema for PurchaseOrder model
  - [ ] Create Prisma schema for POItem model
  - [ ] Add status enum: PENDING, IN_TRANSIT, RECEIVED, CANCELLED
  - [ ] Add foreign key: supplierId references Supplier
  - [ ] Add foreign key: productId references Product
  - [ ] Run migration

- [ ] **Task 2: PO Number Generation Utility**
  - [ ] Create `generatePONumber()` function
  - [ ] Format: PO-YYYY-NNN (e.g., PO-2025-001)
  - [ ] Query latest PO number and increment
  - [ ] Handle year rollover (reset counter to 001)

- [ ] **Task 3: Purchase Order Repository (AC: 2)**
  - [ ] Create `purchase-orders.repository.ts`
  - [ ] Implement `create(data, items)` method (with transaction)
  - [ ] Implement `findAll(filters, pagination)` method
  - [ ] Implement `findById(id)` method (include supplier, items, products)
  - [ ] Implement `update(id, data, items)` method (with transaction)
  - [ ] Implement `updateStatus(id, status)` method

- [ ] **Task 4: Purchase Order Service (AC: 2, 3)**
  - [ ] Create `purchase-orders.service.ts`
  - [ ] Validate line items (product exists, quantity > 0, unitCost >= 0)
  - [ ] Calculate line item totals (quantity × unitCost)
  - [ ] Calculate PO total (sum of line item totals)
  - [ ] Validate status transitions (PENDING → IN_TRANSIT → RECEIVED)
  - [ ] Prevent updates when status != PENDING

- [ ] **Task 5: Purchase Order Controller & Routes (AC: 2)**
  - [ ] Create `purchase-orders.controller.ts`
  - [ ] Implement POST /api/purchase-orders
  - [ ] Implement GET /api/purchase-orders (with filters)
  - [ ] Implement GET /api/purchase-orders/:id
  - [ ] Implement PUT /api/purchase-orders/:id
  - [ ] Implement PATCH /api/purchase-orders/:id/status
  - [ ] Create `purchase-orders.routes.ts`

- [ ] **Task 6: Authorization Middleware (AC: 5)**
  - [ ] Apply role guard: Warehouse Manager, Accountant, Admin for write operations
  - [ ] All authenticated users can read POs

- [ ] **Task 7: Audit Logging Integration (AC: 6)**
  - [ ] Log PO_CREATED with PO details and line items
  - [ ] Log PO_UPDATED with changed fields
  - [ ] Log PO_STATUS_CHANGED with status transition

### Frontend Tasks

- [ ] **Task 8: Purchase Order Types & API Client (AC: 2, 4)**
  - [ ] Create `purchase-order.types.ts` with PurchaseOrder, POItem, POStatus interfaces
  - [ ] Create `purchaseOrdersService.ts` with API methods
  - [ ] Create TanStack Query hooks: `usePurchaseOrders`, `usePurchaseOrder`, `useCreatePurchaseOrder`, `useUpdatePurchaseOrder`, `useUpdatePOStatus`

- [ ] **Task 9: Create Purchase Order Page (AC: 4)**
  - [ ] Create `CreatePurchaseOrderPage.tsx` in features/purchase-orders/pages/
  - [ ] Supplier selection dropdown (searchable)
  - [ ] Order date picker (default: today)
  - [ ] Expected arrival date picker
  - [ ] Notes textarea (optional)

- [ ] **Task 10: Dynamic Line Items Component (AC: 4)**
  - [ ] Create `POLineItemsTable.tsx` component
  - [ ] Table columns: Product | Quantity | Unit Cost | Line Total | Actions
  - [ ] "Add Item" button adds new row
  - [ ] Product selection dropdown (searchable by SKU/name)
  - [ ] Quantity input (number, min=1)
  - [ ] Unit Cost input (number, min=0, 2 decimal places)
  - [ ] Line Total calculated: quantity × unitCost (read-only)
  - [ ] "Remove" button deletes row
  - [ ] Display PO Total (sum of all line totals) at bottom

- [ ] **Task 11: Purchase Orders List Page (AC: 4)**
  - [ ] Create `PurchaseOrdersPage.tsx`
  - [ ] Display POs in table: PO Number | Supplier | Order Date | Expected Arrival | Status | Total Amount | Actions
  - [ ] Filter by status (dropdown)
  - [ ] Filter by supplier (dropdown)
  - [ ] Filter by date range (date pickers)
  - [ ] Search by PO number
  - [ ] Pagination controls
  - [ ] Status badge with color coding (PENDING=yellow, IN_TRANSIT=blue, RECEIVED=green, CANCELLED=red)
  - [ ] "Create PO" button (top-right)

- [ ] **Task 12: Purchase Order Detail Page**
  - [ ] Create `PurchaseOrderDetailPage.tsx`
  - [ ] Display PO header: PO Number, Supplier, Dates, Status, Total
  - [ ] Display line items table (read-only)
  - [ ] Edit button (if status = PENDING, role-gated)
  - [ ] Status change buttons (role-gated):
    - [ ] "Mark as In Transit" (PENDING → IN_TRANSIT)
    - [ ] "Receive Goods" (IN_TRANSIT → RECEIVED, navigates to Story 2.6 flow)
    - [ ] "Cancel PO" (any status → CANCELLED)

- [ ] **Task 13: Form Validation (AC: 3)**
  - [ ] Supplier required
  - [ ] Order date required
  - [ ] At least 1 line item required
  - [ ] Line item product required
  - [ ] Line item quantity > 0
  - [ ] Line item unitCost >= 0
  - [ ] Show validation errors inline

### Testing Tasks

- [ ] **Task 14: Backend Tests**
  - [ ] Unit test for `generatePONumber()` function
  - [ ] Unit test for line item total calculation
  - [ ] Unit test for PO total calculation
  - [ ] Integration test for POST /api/purchase-orders (with line items)
  - [ ] Integration test for status transition validation
  - [ ] Test audit logging for PO operations

- [ ] **Task 15: Frontend Tests**
  - [ ] Component test for `POLineItemsTable` (add/remove rows, calculations)
  - [ ] Component test for `CreatePurchaseOrderPage` (form validation, submission)
  - [ ] Test role-based button visibility

---

## Dev Notes

### Database Schema (Prisma)

```prisma
model PurchaseOrder {
  id                  String   @id @default(cuid())
  poNumber            String   @unique
  supplierId          String
  orderDate           DateTime
  expectedArrivalDate DateTime?
  status              POStatus @default(PENDING)
  totalAmount         Decimal  @db.Decimal(12, 2)
  notes               String?  @db.Text

  createdAt           DateTime @default(now())
  updatedAt           DateTime @updatedAt

  supplier            Supplier @relation(fields: [supplierId], references: [id])
  items               POItem[]
  costs               POCost[] // Added in Story 2.3

  @@map("purchase_orders")
}

model POItem {
  id          String   @id @default(cuid())
  poId        String
  productId   String
  quantity    Int
  unitCost    Decimal  @db.Decimal(10, 2)
  totalCost   Decimal  @db.Decimal(12, 2)

  purchaseOrder PurchaseOrder @relation(fields: [poId], references: [id], onDelete: Cascade)
  product       Product       @relation(fields: [productId], references: [id])

  @@map("po_items")
}

enum POStatus {
  PENDING
  IN_TRANSIT
  RECEIVED
  CANCELLED
}
```

### Backend Architecture

**Location:** `apps/api/src/modules/purchase-orders/`

**Files to Create:**
- `purchase-orders.repository.ts` - Data access layer
- `purchase-orders.service.ts` - Business logic
- `purchase-orders.controller.ts` - HTTP handlers
- `purchase-orders.routes.ts` - Express routes
- `dto/create-purchase-order.dto.ts` - Zod schema
- `dto/update-purchase-order.dto.ts` - Zod schema
- `dto/po-filter.dto.ts` - Query filters
- `utils/generate-po-number.ts` - PO number generation
- `purchase-orders.test.ts` - Tests

**PO Number Generation:**
```typescript
export async function generatePONumber(): Promise<string> {
  const currentYear = new Date().getFullYear();
  const prefix = `PO-${currentYear}-`;

  // Find the latest PO for current year
  const latestPO = await prisma.purchaseOrder.findFirst({
    where: { poNumber: { startsWith: prefix } },
    orderBy: { poNumber: 'desc' }
  });

  if (!latestPO) {
    return `${prefix}001`;
  }

  // Extract sequence number and increment
  const lastNumber = parseInt(latestPO.poNumber.split('-')[2]);
  const nextNumber = (lastNumber + 1).toString().padStart(3, '0');

  return `${prefix}${nextNumber}`;
}
```

**Line Item Calculation:**
```typescript
function calculateLineItemTotals(items: POItemInput[]): POItemWithTotals[] {
  return items.map(item => ({
    ...item,
    totalCost: new Decimal(item.quantity).times(item.unitCost)
  }));
}

function calculatePOTotal(items: POItemWithTotals[]): Decimal {
  return items.reduce((sum, item) => sum.plus(item.totalCost), new Decimal(0));
}
```

**Transaction for Create:**
```typescript
async create(data: CreatePODto): Promise<PurchaseOrder> {
  const poNumber = await generatePONumber();
  const itemsWithTotals = calculateLineItemTotals(data.items);
  const totalAmount = calculatePOTotal(itemsWithTotals);

  return await prisma.$transaction(async (tx) => {
    const po = await tx.purchaseOrder.create({
      data: {
        poNumber,
        supplierId: data.supplierId,
        orderDate: data.orderDate,
        expectedArrivalDate: data.expectedArrivalDate,
        totalAmount,
        notes: data.notes,
        items: {
          create: itemsWithTotals
        }
      },
      include: { supplier: true, items: { include: { product: true } } }
    });

    return po;
  });
}
```

**Status Transition Validation:**
```typescript
const VALID_TRANSITIONS: Record<POStatus, POStatus[]> = {
  PENDING: ['IN_TRANSIT', 'CANCELLED'],
  IN_TRANSIT: ['RECEIVED', 'CANCELLED'],
  RECEIVED: [], // Terminal state
  CANCELLED: [] // Terminal state
};

function validateStatusTransition(currentStatus: POStatus, newStatus: POStatus): void {
  const allowedTransitions = VALID_TRANSITIONS[currentStatus];
  if (!allowedTransitions.includes(newStatus)) {
    throw new BadRequestError(`Cannot transition from ${currentStatus} to ${newStatus}`);
  }
}
```

### Frontend Architecture

**Location:** `apps/web/src/features/purchase-orders/`

**Files to Create:**
- `pages/PurchaseOrdersPage.tsx` - List view
- `pages/CreatePurchaseOrderPage.tsx` - Create form
- `pages/EditPurchaseOrderPage.tsx` - Edit form
- `pages/PurchaseOrderDetailPage.tsx` - Detail view
- `components/POLineItemsTable.tsx` - Dynamic line items
- `components/POStatusBadge.tsx` - Status display
- `components/POFilters.tsx` - Filter controls
- `hooks/usePurchaseOrders.ts` - TanStack Query hooks
- `services/purchaseOrdersService.ts` - API client
- `types/purchase-order.types.ts` - TypeScript types

**Dynamic Line Items State Management:**
```typescript
// In CreatePurchaseOrderPage.tsx
const [lineItems, setLineItems] = useState<POLineItem[]>([
  { productId: '', quantity: 1, unitCost: 0, totalCost: 0 }
]);

const addLineItem = () => {
  setLineItems([...lineItems, { productId: '', quantity: 1, unitCost: 0, totalCost: 0 }]);
};

const removeLineItem = (index: number) => {
  setLineItems(lineItems.filter((_, i) => i !== index));
};

const updateLineItem = (index: number, field: keyof POLineItem, value: any) => {
  const updated = [...lineItems];
  updated[index][field] = value;

  // Recalculate line total
  if (field === 'quantity' || field === 'unitCost') {
    updated[index].totalCost = updated[index].quantity * updated[index].unitCost;
  }

  setLineItems(updated);
};

const poTotal = lineItems.reduce((sum, item) => sum + item.totalCost, 0);
```

**Form Validation (Zod):**
```typescript
const createPOSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  orderDate: z.date(),
  expectedArrivalDate: z.date().optional(),
  notes: z.string().optional(),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    unitCost: z.number().min(0, 'Unit cost cannot be negative'),
  })).min(1, 'At least one line item is required')
});
```

### Authorization

**Roles with Access:**
- **Admin**: Full CRUD access
- **Warehouse Manager**: Full CRUD access
- **Accountant**: Full CRUD access
- **Sales Officer**: Read-only
- **Recovery Agent**: Read-only

### Audit Logging

**Events to Log:**
- `PO_CREATED` - PO number, supplier, total amount, line items count
- `PO_UPDATED` - Changed fields
- `PO_STATUS_CHANGED` - Old status → New status

---

## Testing

### Backend Testing

**Test File Location:** `apps/api/src/modules/purchase-orders/purchase-orders.test.ts`

**Test Cases:**
1. **POST /api/purchase-orders**
   - ✓ Creates PO with valid data and line items
   - ✓ Generates unique sequential PO number
   - ✓ Calculates line totals and PO total correctly
   - ✓ Returns 400 for invalid line items (quantity ≤ 0)
   - ✓ Returns 400 for non-existent product
   - ✓ Returns 403 for unauthorized role
   - ✓ Creates audit log entry

2. **GET /api/purchase-orders**
   - ✓ Returns paginated PO list
   - ✓ Filters by status
   - ✓ Filters by supplier
   - ✓ Filters by date range
   - ✓ Searches by PO number

3. **PUT /api/purchase-orders/:id**
   - ✓ Updates PO when status = PENDING
   - ✓ Returns 400 when status != PENDING
   - ✓ Recalculates totals when line items changed

4. **PATCH /api/purchase-orders/:id/status**
   - ✓ Validates status transition (PENDING → IN_TRANSIT allowed)
   - ✓ Returns 400 for invalid transition (RECEIVED → PENDING disallowed)
   - ✓ Creates audit log entry

### Frontend Testing

**Test File Location:** `apps/web/src/features/purchase-orders/components/POLineItemsTable.test.tsx`

**Test Cases:**
1. **POLineItemsTable Component**
   - ✓ Renders line items table
   - ✓ Adds new row when "Add Item" clicked
   - ✓ Removes row when "Remove" clicked
   - ✓ Calculates line total when quantity/unitCost changed
   - ✓ Displays PO total correctly

2. **CreatePurchaseOrderPage**
   - ✓ Renders form with all fields
   - ✓ Shows validation error when supplier not selected
   - ✓ Shows validation error when no line items
   - ✓ Submits form with correct data structure
   - ✓ Displays success toast on successful creation

---

## Change Log

| Date       | Version | Description                     | Author |
|------------|---------|--------------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation          | Sarah (Product Owner) |

---

## Dev Agent Record

*This section will be populated by the development agent during implementation.*

### Agent Model Used

*To be filled by dev agent*

### Debug Log References

*To be filled by dev agent*

### Completion Notes

*To be filled by dev agent*

### File List

*To be filled by dev agent*

---

## Implementation Notes (Authorization Remediation - Nov 2025)

### Authorization System Fix

**Problem Found:** Purchase Order creation was missing WAREHOUSE_MANAGER from allowed roles. The specification (AC #45) required "Warehouse Manager, Accountant, Admin" but implementation only allowed ADMIN and ACCOUNTANT.

**Fix Applied:**
- Updated permission matrix in `config/permissions.ts`: `purchaseOrders: { create: ['ADMIN', 'ACCOUNTANT', 'WAREHOUSE_MANAGER'], ... }`
- Updated purchase-orders.routes.ts to use `requirePermission('purchaseOrders', 'create')` middleware
- This ensures WAREHOUSE_MANAGER role can now create purchase orders as specified

**Files Modified:**
- `apps/api/src/modules/purchase-orders/purchase-orders.routes.ts` - Uses `requirePermission('purchaseOrders', action)`
- `apps/api/src/config/permissions.ts` - Added purchaseOrders resource with WAREHOUSE_MANAGER in create permissions
- `apps/api/src/middleware/permission.middleware.ts` - Centralized authorization middleware

**Testing:** All POST operations on purchase orders now allow WAREHOUSE_MANAGER role as specified in AC #45.

---

## QA Results

*This section will be populated by the QA agent after testing.*
