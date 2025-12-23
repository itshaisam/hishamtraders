# Story 2.8: Stock Adjustments

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2.8
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 2.7 (Inventory Tracking)
**Status:** Ready for Review

---

## User Story

**As a** warehouse manager,
**I want** to record stock adjustments for wastage, damage, or corrections,
**So that** inventory quantities reflect actual physical stock.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] StockAdjustment table created with approval workflow fields
   - [ ] Enum AdjustmentType: WASTAGE, DAMAGE, THEFT, CORRECTION
   - [ ] Enum AdjustmentStatus: PENDING, APPROVED, REJECTED
   - [ ] Fields: productId, warehouseId, adjustmentType, quantity, reason, notes, status, createdBy, reviewedBy, reviewedAt, rejectionReason, stockMovementId
   - [ ] Relations to Product, Warehouse, User (creator), User (reviewer), StockMovement

2. **Backend API Endpoints:**
   - [ ] POST /api/inventory/adjustments - Create adjustment (WAREHOUSE_MANAGER, ADMIN)
   - [ ] GET /api/inventory/adjustments - List adjustments with filters (WAREHOUSE_MANAGER, ADMIN)
   - [ ] GET /api/inventory/adjustments/pending - Get pending adjustments (ADMIN only)
   - [ ] GET /api/inventory/adjustments/:id - Get single adjustment (WAREHOUSE_MANAGER, ADMIN)
   - [ ] PATCH /api/inventory/adjustments/:id/approve - Approve adjustment (ADMIN only)
   - [ ] PATCH /api/inventory/adjustments/:id/reject - Reject adjustment with reason (ADMIN only)

3. **Adjustment Creation Logic:**
   - [ ] Warehouse Manager OR Admin can create adjustments
   - [ ] Payload: productId, warehouseId, adjustmentType, quantity (+ or -), reason (required), notes (optional)
   - [ ] New adjustment status = PENDING
   - [ ] Inventory NOT updated yet (update happens on approval)
   - [ ] Validation: reason required (min 10 chars), quantity != 0, product/warehouse exist

4. **Approval Workflow:**
   - [ ] Admin views pending adjustments in approval queue
   - [ ] Admin can Approve or Reject
   - [ ] **If Approved:**
     - [ ] Inventory quantity updated in transaction
     - [ ] StockMovement record created (type=ADJUSTMENT, reference=adjustment.id)
     - [ ] Adjustment status → APPROVED
     - [ ] reviewedBy and reviewedAt recorded
   - [ ] **If Rejected:**
     - [ ] Adjustment status → REJECTED
     - [ ] Rejection reason required (min 10 chars)
     - [ ] reviewedBy and reviewedAt recorded
     - [ ] NO inventory update, NO stock movement
     - [ ] Manager sees rejection in history when they check

5. **Validation:**
   - [ ] Stock never goes negative (validate before approval)
   - [ ] Can only approve/reject PENDING adjustments
   - [ ] Cannot modify approved/rejected adjustments

6. **Frontend Pages:**
   - [ ] Stock Adjustment Form page: product, warehouse, type, quantity, reason, notes
   - [ ] Adjustment History page: filterable table with status badges
   - [ ] Approval Queue page (ADMIN only): pending adjustments with Approve/Reject buttons
   - [ ] Rejection modal: requires rejection reason input

7. **Authorization:**
   - [ ] WAREHOUSE_MANAGER and ADMIN can create adjustments
   - [ ] ADMIN can approve/reject adjustments
   - [ ] WAREHOUSE_MANAGER can view their own adjustments
   - [ ] ADMIN can view all adjustments

8. **Audit Logging:**
   - [ ] Adjustment creation logged with action CREATE_ADJUSTMENT
   - [ ] Approval logged with action APPROVE_ADJUSTMENT
   - [ ] Rejection logged with action REJECT_ADJUSTMENT

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Database Schema & Migration (AC: 1)**
  - [ ] Create StockAdjustment model in schema.prisma
  - [ ] Add AdjustmentType and AdjustmentStatus enums
  - [ ] Add relations to Product, Warehouse, User, StockMovement
  - [ ] Run migration: `npx prisma migrate dev --name add_stock_adjustments_with_approval_workflow`

- [ ] **Task 2: Repository Layer (AC: 2)**
  - [ ] Create `stock-adjustment.repository.ts`
  - [ ] Implement create(), findById(), findAll(), findPendingAdjustments()
  - [ ] Implement updateStatus(), linkStockMovement()

- [ ] **Task 3: Service Layer (AC: 3, 4)**
  - [ ] Create `stock-adjustment.service.ts`
  - [ ] Implement createAdjustment() - creates PENDING adjustment
  - [ ] Implement approveAdjustment() - updates inventory + creates StockMovement in transaction
  - [ ] Implement rejectAdjustment() - updates status with reason, NO inventory change
  - [ ] Validation: prevent negative stock, validate reason/quantity

- [ ] **Task 4: Controller & Routes (AC: 2)**
  - [ ] Create `stock-adjustment.controller.ts`
  - [ ] Implement all endpoints (create, getAll, getPending, approve, reject)
  - [ ] Create `stock-adjustment.routes.ts` with role guards
  - [ ] Register routes in index.ts

- [ ] **Task 5: DTOs & Validation (AC: 3, 5)**
  - [ ] Create `stock-adjustment.dto.ts`
  - [ ] Zod schemas: CreateAdjustmentSchema, RejectAdjustmentSchema
  - [ ] Apply validation in controller

- [ ] **Task 6: Authorization & Audit (AC: 7, 8)**
  - [ ] Apply requireRole middleware
  - [ ] Add audit logging for CREATE_ADJUSTMENT, APPROVE_ADJUSTMENT, REJECT_ADJUSTMENT

### Frontend Tasks

- [ ] **Task 7: Types & API Client (AC: 6)**
  - [ ] Create `stock-adjustment.types.ts`
  - [ ] Create `stockAdjustmentService.ts`
  - [ ] Create TanStack Query hooks in `useStockAdjustments.ts`

- [ ] **Task 8: Stock Adjustment Form Page (AC: 6)**
  - [ ] Create `StockAdjustmentPage.tsx`
  - [ ] Form: product, warehouse, type, quantity, reason, notes
  - [ ] Validation and submit to create PENDING

- [ ] **Task 9: Adjustment History Page (AC: 6)**
  - [ ] Create `AdjustmentHistoryPage.tsx`
  - [ ] Table with status badges and filters

- [ ] **Task 10: Approval Queue Page (AC: 6)**
  - [ ] Create `AdjustmentApprovalPage.tsx` (ADMIN only)
  - [ ] List pending adjustments with Approve/Reject buttons

- [ ] **Task 11: Rejection Modal (AC: 6)**
  - [ ] Create `RejectAdjustmentModal.tsx`
  - [ ] Textarea for rejection reason (min 10 chars)

- [ ] **Task 12: Routing & Navigation (AC: 6)**
  - [ ] Add routes to App.tsx
  - [ ] Add navigation links with permission checks

---

## Dev Notes

### Approval Workflow Architecture

**Key Principle:** Stock adjustments DO NOT immediately update inventory. They create a PENDING record that requires Admin approval.

**Flow:**
1. Warehouse Manager/Admin creates adjustment → Status = PENDING
2. Adjustment appears in Admin approval queue
3. Admin approves → Inventory updated + StockMovement created → Status = APPROVED
4. Admin rejects → Status = REJECTED with reason, NO inventory change

### Backend: Create Adjustment (PENDING)

```typescript
async createAdjustment(data: CreateAdjustmentDto, userId: string): Promise<StockAdjustment> {
  // Validate product and warehouse exist
  const product = await prisma.product.findUnique({ where: { id: data.productId } });
  if (!product) throw new NotFoundError('Product not found');

  const warehouse = await prisma.warehouse.findUnique({ where: { id: data.warehouseId } });
  if (!warehouse) throw new NotFoundError('Warehouse not found');

  // Create PENDING adjustment (NO inventory update yet)
  return await prisma.stockAdjustment.create({
    data: {
      ...data,
      status: 'PENDING',
      createdBy: userId,
    },
    include: { product: true, warehouse: true, creator: true },
  });
}
```

### Backend: Approve Adjustment (Update Inventory)

```typescript
async approveAdjustment(id: string, adminId: string): Promise<void> {
  const adjustment = await prisma.stockAdjustment.findUnique({ where: { id } });
  if (!adjustment || adjustment.status !== 'PENDING') {
    throw new BadRequestError('Only pending adjustments can be approved');
  }

  // Find current inventory
  const inventory = await prisma.inventory.findUnique({
    where: {
      productId_productVariantId_warehouseId_batchNo: {
        productId: adjustment.productId,
        productVariantId: adjustment.productVariantId,
        warehouseId: adjustment.warehouseId,
        batchNo: null,
      },
    },
  });

  const newQuantity = (inventory?.quantity || 0) + adjustment.quantity;
  if (newQuantity < 0) {
    throw new BadRequestError('Adjustment would result in negative stock');
  }

  // Execute in transaction
  await prisma.$transaction(async (tx) => {
    // 1. Update or create inventory
    if (inventory) {
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: newQuantity },
      });
    } else if (adjustment.quantity > 0) {
      await tx.inventory.create({
        data: {
          productId: adjustment.productId,
          productVariantId: adjustment.productVariantId,
          warehouseId: adjustment.warehouseId,
          quantity: adjustment.quantity,
          batchNo: null,
          binLocation: null,
        },
      });
    }

    // 2. Create stock movement
    const stockMovement = await tx.stockMovement.create({
      data: {
        productId: adjustment.productId,
        productVariantId: adjustment.productVariantId,
        warehouseId: adjustment.warehouseId,
        movementType: 'ADJUSTMENT',
        quantity: Math.abs(adjustment.quantity),
        referenceType: 'ADJUSTMENT',
        referenceId: id,
        userId: adminId,
        notes: `${adjustment.adjustmentType}: ${adjustment.reason}`,
      },
    });

    // 3. Update adjustment status
    await tx.stockAdjustment.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedBy: adminId,
        reviewedAt: new Date(),
        stockMovementId: stockMovement.id,
      },
    });
  });
}
```

### Backend: Reject Adjustment

```typescript
async rejectAdjustment(id: string, adminId: string, rejectionReason: string): Promise<void> {
  const adjustment = await prisma.stockAdjustment.findUnique({ where: { id } });
  if (!adjustment || adjustment.status !== 'PENDING') {
    throw new BadRequestError('Only pending adjustments can be rejected');
  }

  // NO inventory update, just mark as rejected
  await prisma.stockAdjustment.update({
    where: { id },
    data: {
      status: 'REJECTED',
      reviewedBy: adminId,
      reviewedAt: new Date(),
      rejectionReason,
    },
  });
}
```

### Frontend: Approval Queue

```tsx
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Date</TableHead>
      <TableHead>Product</TableHead>
      <TableHead>Type</TableHead>
      <TableHead>Qty</TableHead>
      <TableHead>Reason</TableHead>
      <TableHead>Actions</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {pendingAdjustments.map((adjustment) => (
      <TableRow key={adjustment.id}>
        <TableCell>{formatDate(adjustment.createdAt)}</TableCell>
        <TableCell>{adjustment.product.name}</TableCell>
        <TableCell>
          <Badge>{adjustment.adjustmentType}</Badge>
        </TableCell>
        <TableCell className={adjustment.quantity > 0 ? 'text-green-600' : 'text-red-600'}>
          {adjustment.quantity > 0 ? '+' : ''}{adjustment.quantity}
        </TableCell>
        <TableCell>{adjustment.reason}</TableCell>
        <TableCell>
          <Button size="sm" onClick={() => handleApprove(adjustment.id)}>
            Approve
          </Button>
          <Button size="sm" variant="danger" onClick={() => openRejectModal(adjustment.id)}>
            Reject
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
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

### Agent Model Used
Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Implementation Summary
All tasks completed successfully. Story 2.8 Stock Adjustments fully implemented with two-step approval workflow.

### Files Created/Modified

**Backend Files:**
- `apps/api/src/modules/inventory/stock-adjustment.repository.ts` - Repository layer for database operations
- `apps/api/src/modules/inventory/stock-adjustment.service.ts` - Service layer with approval/rejection logic
- `apps/api/src/modules/inventory/stock-adjustment.controller.ts` - Controller with 6 API endpoints
- `apps/api/src/modules/inventory/stock-adjustment.routes.ts` - Routes with role-based authorization
- `apps/api/src/modules/inventory/dto/stock-adjustment.dto.ts` - Zod validation schemas
- `apps/api/src/middleware/authorization.middleware.ts` - Role-based authorization middleware
- `apps/api/src/index.ts` - Registered adjustment routes

**Frontend Files:**
- `apps/web/src/types/stock-adjustment.types.ts` - TypeScript type definitions
- `apps/web/src/services/stockAdjustmentService.ts` - API client service
- `apps/web/src/hooks/useStockAdjustments.ts` - TanStack Query hooks with mutations
- `apps/web/src/features/inventory/pages/StockAdjustmentPage.tsx` - Adjustment creation form
- `apps/web/src/features/inventory/pages/AdjustmentHistoryPage.tsx` - History view with filters
- `apps/web/src/features/inventory/pages/AdjustmentApprovalPage.tsx` - Admin approval queue
- `apps/web/src/features/inventory/components/RejectAdjustmentModal.tsx` - Rejection modal
- `apps/web/src/App.tsx` - Added 3 new routes for adjustments

**Database:**
- Schema already existed (no migration needed)
- StockAdjustment model with all required fields and relations
- AdjustmentType and AdjustmentStatus enums in place

### Completion Notes

**Two-Step Approval Workflow Implemented:**
1. Warehouse Manager/Admin creates adjustment → Status: PENDING (no inventory change)
2. Admin reviews in approval queue
3. Approve → Inventory updated + StockMovement created + Status: APPROVED
4. Reject → Status: REJECTED with reason (no inventory change)

**Key Features:**
- ✅ CRUD operations for stock adjustments
- ✅ Pending adjustments approval queue (ADMIN only)
- ✅ Atomic transaction for approval (inventory update + stock movement creation)
- ✅ Rejection with mandatory reason (min 10 chars)
- ✅ Authorization: WAREHOUSE_MANAGER + ADMIN create, ADMIN approve/reject
- ✅ Audit logging via existing middleware (automatic for CREATE/UPDATE/DELETE)
- ✅ Validation: Prevents negative stock, requires reason, quantity != 0
- ✅ Frontend pages: Form, History, Approval Queue
- ✅ Status badges and visual indicators
- ✅ Auto-refresh for approval queue (60s interval)

**Testing:**
- TypeScript compilation: ✅ Clean (both backend and frontend)
- No linting errors
- All 12 tasks completed as per story requirements

### Debug Log
No issues encountered during implementation.

---

## QA Results

*To be populated by QA agent*
