# Story 2.9: Stock Movement Audit Trail

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2.9
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 2.6 (Stock Receiving), Story 2.8 (Stock Adjustments)
**Status:** Draft

---

## User Story

**As a** warehouse manager,
**I want** to see complete movement history for any product,
**So that** I can trace exactly when and why quantities changed.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] StockMovement table exists: id, productId, warehouseId, movementType (RECEIPT/SALE/ADJUSTMENT/TRANSFER), quantity, referenceType, referenceId, movementDate, userId, notes

2. **Auto-Creation Logic:**
   - [ ] Stock movements automatically created for: goods receipt, sales invoice, stock adjustment
   - [ ] Movement records are immutable (insert only, no update/delete)
   - [ ] Each movement links to source document (PO, invoice, adjustment)

3. **Stock Movement Workflow (Inter-Warehouse Transfer):**
   - [ ] Two-step transfer process:
     - Step 1: Create transfer (source warehouse, target warehouse, items, quantities)
     - Step 2: Receive transfer in target warehouse (destination manager confirms receipt)
   - [ ] Status flow: INITIATED → RECEIVED
   - [ ] Database transaction: Both steps succeed or both fail (atomic)
   - [ ] Validation: Can't transfer quantity > available in source warehouse
   - [ ] Cancel transfer: Only allowed during INITIATED status
   - [ ] If transfer fails: User notified, can retry step 2
   - [ ] Reverse transfer: Create new opposite transfer if needed (return to source)

4. **Backend API Endpoints:**
   - [ ] GET /api/inventory/movements - Returns movement history with filters (productId, warehouseId, date range, movementType)
   - [ ] POST /api/inventory/transfers - Create transfer (step 1)
   - [ ] POST /api/inventory/transfers/:id/receive - Receive transfer (step 2)
   - [ ] GET /api/inventory/transfers - List pending/completed transfers

5. **Running Balance:**
   - [ ] Running balance calculated per movement (previous quantity + change = new quantity)

6. **Frontend Pages:**
   - [ ] Inventory Movement Report displays: Date | Type | Reference | Quantity In | Quantity Out | Balance | User
   - [ ] Filter by product, warehouse, date range
   - [ ] Clicking reference number navigates to source document
   - [ ] Movement report exportable to Excel
   - [ ] Transfer Status page shows pending/in-transit/received transfers

7. **Authorization:**
   - [ ] All roles can view movement history (read-only)
   - [ ] Warehouse Manager can initiate transfers (step 1)
   - [ ] Destination Warehouse Manager can receive transfers (step 2)

8. **Audit Integrity:**
   - [ ] Stock movements automatically logged (separate from user audit trail)
   - [ ] Transfer steps logged: who initiated, when received, by whom

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Stock Movement Repository**
  - [ ] Extend `stock-movement.repository.ts` (if not exists, create)
  - [ ] Implement `getAll(filters)` method with pagination
  - [ ] Implement `getByProduct(productId)` method
  - [ ] Implement `getByWarehouse(warehouseId)` method
  - [ ] Calculate running balance in query or service layer

- [ ] **Task 2: Controller & Routes (AC: 3)**
  - [ ] Create `stock-movements.controller.ts`
  - [ ] Implement GET /api/inventory/movements
  - [ ] Support filters: productId, warehouseId, movementType, dateRange
  - [ ] Create routes

- [ ] **Task 3: Running Balance Calculation (AC: 4)**
  - [ ] Implement service method to calculate running balance
  - [ ] Order movements by date ascending
  - [ ] Calculate cumulative balance

- [ ] **Task 4: Auto-Creation Integration (AC: 2)**
  - [ ] Verify stock receipt creates movement (Story 2.6)
  - [ ] Verify stock adjustment creates movement (Story 2.8)
  - [ ] Verify sales invoice creates movement (Story 3.x - future)

### Frontend Tasks

- [ ] **Task 5: Movement Types & API Client**
  - [ ] Create types for stock movements
  - [ ] Create `stockMovementsService.ts`
  - [ ] Create TanStack Query hooks

- [ ] **Task 6: Movement Report Page (AC: 5)**
  - [ ] Create `StockMovementsPage.tsx`
  - [ ] Display movements in table format
  - [ ] Columns: Date | Type | Reference | Qty In | Qty Out | Running Balance | User
  - [ ] Filter controls: product dropdown, warehouse dropdown, date range pickers, movement type dropdown
  - [ ] Pagination

- [ ] **Task 7: Reference Link Navigation (AC: 5)**
  - [ ] Make reference number clickable
  - [ ] Navigate based on referenceType:
    - [ ] PO → /purchase-orders/:referenceId
    - [ ] INVOICE → /invoices/:referenceId
    - [ ] ADJUSTMENT → Show adjustment details modal

- [ ] **Task 8: Excel Export (AC: 5)**
  - [ ] Add "Export to Excel" button
  - [ ] Export filtered movements to XLSX format
  - [ ] Use library like `xlsx` or `exceljs`

- [ ] **Task 9: Testing**
  - [ ] Backend tests (movement creation, running balance calculation)
  - [ ] Frontend tests (movement display, filters, navigation)

---

## Dev Notes

### StockMovement Model

```prisma
model StockMovement {
  id            String           @id @default(cuid())
  productId     String
  warehouseId   String
  movementType  MovementType
  quantity      Int              // Always positive (direction determined by movementType)
  referenceType ReferenceType?
  referenceId   String?
  movementDate  DateTime         @default(now())
  userId        String
  notes         String?          @db.Text

  product       Product   @relation(fields: [productId], references: [id])
  warehouse     Warehouse @relation(fields: [warehouseId], references: [id])
  user          User      @relation(fields: [userId], references: [id])

  @@index([productId, warehouseId, movementDate])
  @@map("stock_movements")
}

enum MovementType {
  RECEIPT     // Incoming (goods receipt from PO)
  SALE        // Outgoing (invoice/delivery)
  ADJUSTMENT  // +/- (wastage, damage, correction)
  TRANSFER    // Between warehouses (future)
}

enum ReferenceType {
  PO
  INVOICE
  ADJUSTMENT
  TRANSFER
}
```

### Running Balance Calculation

```typescript
interface MovementWithBalance {
  id: string;
  date: Date;
  type: MovementType;
  reference: string;
  quantityIn: number;
  quantityOut: number;
  runningBalance: number;
  user: string;
}

async function getMovementsWithBalance(
  productId: string,
  warehouseId: string,
  dateRange?: { from: Date; to: Date }
): Promise<MovementWithBalance[]> {
  // Fetch movements ordered by date
  const movements = await prisma.stockMovement.findMany({
    where: {
      productId,
      warehouseId,
      movementDate: dateRange ? {
        gte: dateRange.from,
        lte: dateRange.to
      } : undefined
    },
    include: { user: true },
    orderBy: { movementDate: 'asc' }
  });

  // Calculate running balance
  let balance = 0;
  return movements.map(movement => {
    const isIncoming = movement.movementType === 'RECEIPT';
    const quantityIn = isIncoming ? movement.quantity : 0;
    const quantityOut = !isIncoming ? movement.quantity : 0;

    balance += isIncoming ? movement.quantity : -movement.quantity;

    return {
      id: movement.id,
      date: movement.movementDate,
      type: movement.movementType,
      reference: movement.referenceId || 'N/A',
      quantityIn,
      quantityOut,
      runningBalance: balance,
      user: movement.user.name
    };
  });
}
```

### Frontend Implementation

**Movement Report Table:**

```tsx
<Table>
  <thead>
    <tr>
      <th>Date</th>
      <th>Type</th>
      <th>Reference</th>
      <th>Qty In</th>
      <th>Qty Out</th>
      <th>Balance</th>
      <th>User</th>
    </tr>
  </thead>
  <tbody>
    {movements.map(movement => (
      <tr key={movement.id}>
        <td>{format(movement.date, 'PPp')}</td>
        <td>
          <Badge variant={getMovementTypeVariant(movement.type)}>
            {movement.type}
          </Badge>
        </td>
        <td>
          {movement.referenceType ? (
            <Link to={getReferenceLink(movement.referenceType, movement.reference)}>
              {movement.reference}
            </Link>
          ) : (
            '-'
          )}
        </td>
        <td className="text-green-600">{movement.quantityIn || '-'}</td>
        <td className="text-red-600">{movement.quantityOut || '-'}</td>
        <td className="font-bold">{movement.runningBalance}</td>
        <td>{movement.user}</td>
      </tr>
    ))}
  </tbody>
</Table>
```

**Excel Export:**

```typescript
import * as XLSX from 'xlsx';

function exportToExcel(movements: MovementWithBalance[]) {
  const worksheet = XLSX.utils.json_to_sheet(
    movements.map(m => ({
      Date: format(m.date, 'yyyy-MM-dd HH:mm'),
      Type: m.type,
      Reference: m.reference,
      'Quantity In': m.quantityIn,
      'Quantity Out': m.quantityOut,
      Balance: m.runningBalance,
      User: m.user
    }))
  );

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Stock Movements');

  XLSX.writeFile(workbook, `stock-movements-${format(new Date(), 'yyyyMMdd')}.xlsx`);
}
```

---

## Testing

### Backend Testing
- Movement creation on stock receipt
- Movement creation on stock adjustment
- Running balance calculation
- Filter by date range
- Filter by movement type

### Frontend Testing
- Movement display
- Filter controls
- Reference link navigation
- Excel export

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
