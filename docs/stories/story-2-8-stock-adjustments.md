# Story 2.8: Stock Adjustments

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2.8
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 2.7 (Inventory Tracking)
**Status:** Draft

---

## User Story

**As a** warehouse manager,
**I want** to record stock adjustments for wastage, damage, or corrections,
**So that** inventory quantities reflect actual physical stock.

---

## Acceptance Criteria

1. **Backend API Endpoints:**
   - [ ] POST /api/inventory/adjustment - Creates stock adjustment
   - [ ] GET /api/inventory/adjustments - Returns adjustment history with filters

2. **Adjustment Logic:**
   - [ ] Adjustment payload: productId, warehouseId, adjustmentType (WASTAGE/DAMAGE/THEFT/CORRECTION), quantity (+ or -), reason, notes
   - [ ] Quantity can be positive (count increase) or negative (count decrease)
   - [ ] Stock never goes negative (validation: newQty >= 0)
   - [ ] Reason field required (free text explanation)

3. **Adjustment Approval Workflow:**
   - [ ] Warehouse Manager creates adjustment (qty, type, reason, notes)
   - [ ] Adjustment status: PENDING (inventory NOT updated yet)
   - [ ] Admin reviews in approval queue
   - [ ] Admin can Approve or Reject
   - [ ] If Approved: Inventory updated, StockMovement record created, status → APPROVED
   - [ ] If Rejected: Adjustment cancelled, notification sent to manager with reason
   - [ ] Audit log: Records who created, who approved/rejected, when, reason
   - [ ] No reversal of approved adjustments (create new opposite adjustment if needed)

4. **Frontend Pages:**
   - [ ] Stock Adjustment page with form: product, warehouse, type, quantity, reason
   - [ ] Display adjustment history with type-specific icons

5. **Authorization:**
   - [ ] Warehouse Manager can create adjustments
   - [ ] Admin can approve/reject adjustments
   - [ ] Only these roles can access adjustment workflow

6. **Audit Logging:**
   - [ ] Stock adjustments logged in audit trail with reason, creator, approver, timestamp

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Adjustment Service (AC: 2)**
  - [ ] Create `stock-adjustment.service.ts`
  - [ ] Implement `createAdjustment()` method
  - [ ] Update inventory quantity
  - [ ] Create stock movement record
  - [ ] Validate quantity doesn't go negative

- [ ] **Task 2: Controller & Routes (AC: 1)**
  - [ ] Create `stock-adjustment.controller.ts`
  - [ ] Implement POST /api/inventory/adjustment
  - [ ] Implement GET /api/inventory/adjustments
  - [ ] Create routes

- [ ] **Task 3: Validation (AC: 2)**
  - [ ] Validate product and warehouse exist
  - [ ] Validate quantity doesn't result in negative stock
  - [ ] Validate reason field is provided
  - [ ] Validate adjustment type is valid enum value

- [ ] **Task 4: Authorization & Audit (AC: 4, 5)**
  - [ ] Apply role guards
  - [ ] Add audit logging with adjustment details

### Frontend Tasks

- [ ] **Task 5: Adjustment Types & API Client**
  - [ ] Create types for stock adjustments
  - [ ] Create `stockAdjustmentService.ts`
  - [ ] Create TanStack Query hooks

- [ ] **Task 6: Stock Adjustment Form (AC: 3)**
  - [ ] Create `StockAdjustmentPage.tsx`
  - [ ] Form fields: product (dropdown), warehouse (dropdown), adjustment type (dropdown), quantity (+/-), reason (textarea)
  - [ ] Validation: reason required, quantity != 0
  - [ ] Submit handler

- [ ] **Task 7: Adjustment History Table (AC: 3)**
  - [ ] Display adjustment history table
  - [ ] Columns: Date | Product | Warehouse | Type | Quantity | Reason | User
  - [ ] Type-specific icons
  - [ ] Filters: date range, product, warehouse, type

- [ ] **Task 8: Testing**
  - [ ] Backend tests (adjustment logic, validation)
  - [ ] Frontend tests (form validation, submission)

---

## Dev Notes

### Adjustment Types

```typescript
enum AdjustmentType {
  WASTAGE = 'WASTAGE',     // Spoiled/expired products
  DAMAGE = 'DAMAGE',        // Physically damaged
  THEFT = 'THEFT',          // Stolen inventory
  CORRECTION = 'CORRECTION' // Physical count correction
}
```

### Stock Adjustment Logic

```typescript
async createAdjustment(data: CreateAdjustmentDto): Promise<void> {
  const inventory = await prisma.inventory.findUnique({
    where: {
      productId_warehouseId_batchNo: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        batchNo: data.batchNo || null
      }
    }
  });

  if (!inventory) {
    throw new NotFoundError('Inventory record not found');
  }

  const newQuantity = inventory.quantity + data.quantity; // quantity can be negative

  if (newQuantity < 0) {
    throw new BadRequestError('Adjustment would result in negative stock');
  }

  await prisma.$transaction(async (tx) => {
    // Update inventory
    await tx.inventory.update({
      where: { id: inventory.id },
      data: { quantity: newQuantity }
    });

    // Create stock movement
    await tx.stockMovement.create({
      data: {
        productId: data.productId,
        warehouseId: data.warehouseId,
        movementType: 'ADJUSTMENT',
        quantity: Math.abs(data.quantity), // Store absolute value
        referenceType: 'ADJUSTMENT',
        userId: data.userId,
        notes: `${data.adjustmentType}: ${data.reason}`
      }
    });
  });
}
```

### Frontend Form

```tsx
<Form>
  <Select label="Product" name="productId" options={products} required />
  <Select label="Warehouse" name="warehouseId" options={warehouses} required />
  <Select
    label="Adjustment Type"
    name="adjustmentType"
    options={[
      { value: 'WASTAGE', label: 'Wastage' },
      { value: 'DAMAGE', label: 'Damage' },
      { value: 'THEFT', label: 'Theft' },
      { value: 'CORRECTION', label: 'Count Correction' }
    ]}
    required
  />
  <Input
    type="number"
    label="Quantity Adjustment"
    name="quantity"
    placeholder="Enter positive to add, negative to subtract"
    required
  />
  <Textarea
    label="Reason"
    name="reason"
    placeholder="Explain the adjustment..."
    required
  />
  <Button type="submit">Submit Adjustment</Button>
</Form>
```

---

## Testing

### Backend Testing
- Adjustment creates stock movement
- Inventory quantity updated correctly
- Validation: prevent negative stock
- Validation: reason required
- Audit logging

### Frontend Testing
- Form validation
- Positive/negative quantity handling
- Adjustment history display

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
