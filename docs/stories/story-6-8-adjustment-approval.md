# Story 6.8: Stock Adjustment Approval Workflow

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.8
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 2.8 (Stock Adjustments)
**Status:** Draft - Phase 2

---

## User Story

**As an** admin,
**I want** stock adjustments to require approval for large quantities,
**So that** inventory shrinkage is properly authorized.

---

## Acceptance Criteria

1. **Configuration:**
   - [ ] adjustmentApprovalThreshold (e.g., > 100 units or > $1000 value requires approval)

2. **Database Schema:**
   - [ ] StockAdjustment table expanded: status (PENDING/APPROVED/REJECTED), approvedBy, approvedAt

3. **Adjustment Creation:**
   - [ ] If value < threshold: status = APPROVED (immediately applied)
   - [ ] If value >= threshold: status = PENDING (awaits approval)

4. **Backend API:**
   - [ ] PUT /api/inventory/adjustments/:id/approve - approves adjustment
   - [ ] PUT /api/inventory/adjustments/:id/reject - rejects adjustment
   - [ ] GET /api/inventory/adjustments/pending - pending approvals

5. **Frontend:**
   - [ ] Stock Adjustment form displays "Requires Approval" notice
   - [ ] Pending Adjustments page (Admin only)
   - [ ] Approval modal with details

6. **Alerts:**
   - [ ] Alert for Admin when adjustments await approval

7. **Authorization:**
   - [ ] Only Admin can approve/reject
   - [ ] Adjustment approvals logged

---

## Dev Notes

```prisma
model StockAdjustment {
  id          String              @id @default(cuid())
  productId   String
  warehouseId String
  type        AdjustmentType
  quantity    Int
  reason      String              @db.Text
  value       Decimal             @db.Decimal(12, 2)
  status      AdjustmentStatus    @default(PENDING)
  requestedBy String
  approvedBy  String?
  approvedAt  DateTime?
  createdAt   DateTime            @default(now())

  product     Product             @relation(fields: [productId], references: [id])
  warehouse   Warehouse           @relation(fields: [warehouseId], references: [id])
  requester   User                @relation("RequestedAdjustments", fields: [requestedBy], references: [id])
  approver    User?               @relation("ApprovedAdjustments", fields: [approvedBy], references: [id])

  @@map("stock_adjustments")
}

enum AdjustmentStatus {
  PENDING
  APPROVED
  REJECTED
}
```

```typescript
async function createStockAdjustment(
  data: CreateAdjustmentDto,
  userId: string
): Promise<StockAdjustment> {
  // Calculate value (quantity × unit cost)
  const product = await prisma.product.findUnique({
    where: { id: data.productId }
  });

  const value = data.quantity * parseFloat(product!.costPrice.toString());

  // Get approval threshold from configuration
  const config = await prisma.configuration.findUnique({
    where: { key: 'ADJUSTMENT_APPROVAL_THRESHOLD' }
  });

  const threshold = config ? parseFloat(config.value) : 1000;

  // Determine if approval needed
  const requiresApproval = value >= threshold;
  const status = requiresApproval ? 'PENDING' : 'APPROVED';

  // Create adjustment
  const adjustment = await prisma.stockAdjustment.create({
    data: {
      productId: data.productId,
      warehouseId: data.warehouseId,
      type: data.type,
      quantity: data.quantity,
      reason: data.reason,
      value,
      status,
      requestedBy: userId,
      ...(status === 'APPROVED' && { approvedBy: userId, approvedAt: new Date() })
    }
  });

  // If auto-approved, apply immediately
  if (status === 'APPROVED') {
    await applyStockAdjustment(adjustment.id);
  } else {
    // Create alert for admin
    await prisma.alert.create({
      data: {
        type: 'ADJUSTMENT_APPROVAL_REQUIRED',
        priority: 'MEDIUM',
        message: `Stock adjustment for ${product!.name} requires approval (Value: Rs.${value.toFixed(2)})`,
        targetUsers: ['ADMIN']
      }
    });
  }

  return adjustment;
}

async function approveAdjustment(
  adjustmentId: string,
  userId: string
): Promise<StockAdjustment> {
  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id: adjustmentId }
  });

  if (adjustment?.status !== 'PENDING') {
    throw new BadRequestError('Adjustment must be pending to approve');
  }

  const updated = await prisma.stockAdjustment.update({
    where: { id: adjustmentId },
    data: {
      status: 'APPROVED',
      approvedBy: userId,
      approvedAt: new Date()
    }
  });

  // Apply adjustment to inventory
  await applyStockAdjustment(adjustmentId);

  await auditLogger.log({
    action: 'STOCK_ADJUSTMENT_APPROVED',
    userId,
    resource: 'StockAdjustment',
    resourceId: adjustmentId
  });

  return updated;
}

async function applyStockAdjustment(adjustmentId: string): Promise<void> {
  const adjustment = await prisma.stockAdjustment.findUnique({
    where: { id: adjustmentId }
  });

  await prisma.$transaction(async (tx) => {
    // Update inventory
    const inventory = await tx.inventory.findFirst({
      where: {
        productId: adjustment!.productId,
        warehouseId: adjustment!.warehouseId
      }
    });

    const quantityChange = ['WASTAGE', 'DAMAGE', 'THEFT'].includes(adjustment!.type)
      ? -adjustment!.quantity
      : adjustment!.quantity;

    await tx.inventory.update({
      where: { id: inventory!.id },
      data: { quantity: { increment: quantityChange } }
    });

    // Create stock movement
    await tx.stockMovement.create({
      data: {
        productId: adjustment!.productId,
        warehouseId: adjustment!.warehouseId,
        movementType: 'ADJUSTMENT',
        quantity: quantityChange,
        referenceType: 'STOCK_ADJUSTMENT',
        referenceId: adjustmentId,
        movementDate: new Date(),
        userId: adjustment!.approvedBy!,
        notes: `${adjustment!.type}: ${adjustment!.reason}`
      }
    });
  });
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
