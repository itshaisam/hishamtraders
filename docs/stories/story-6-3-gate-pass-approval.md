# Story 6.3: Gate Pass Approval and Status Tracking

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.3
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 6.2
**Status:** Draft - Phase 2

---

## User Story

**As a** warehouse manager,
**I want** to approve pending gate passes and track their status through completion,
**So that** only authorized shipments leave the warehouse.

---

## Acceptance Criteria

1. **Status Workflow:**
   - [ ] PENDING → APPROVED → IN_TRANSIT → COMPLETED
   - [ ] Cannot skip statuses

2. **Status Transitions:**
   - [ ] PUT /api/gate-passes/:id/approve (PENDING → APPROVED)
   - [ ] PUT /api/gate-passes/:id/dispatch (APPROVED → IN_TRANSIT, inventory deducted)
   - [ ] PUT /api/gate-passes/:id/complete (IN_TRANSIT → COMPLETED)
   - [ ] PUT /api/gate-passes/:id/cancel (cancels if PENDING/APPROVED, restores inventory)

3. **Inventory Deduction:**
   - [ ] Deducted when status → IN_TRANSIT (if not already deducted)
   - [ ] StockMovement records created (type=GATE_PASS_OUT)

4. **Frontend:**
   - [ ] Status workflow indicator (stepper/timeline)
   - [ ] Action buttons conditional on status
   - [ ] Display timestamps and users for each status
   - [ ] Print Gate Pass button (PDF/print)

5. **Alerts:**
   - [ ] Alert for Warehouse Manager when passes await approval

6. **Authorization:**
   - [ ] Only Warehouse Manager and Admin
   - [ ] All status changes logged

---

## Dev Notes

```typescript
async function approveGatePass(
  gatePassId: string,
  userId: string
): Promise<GatePass> {
  const gatePass = await prisma.gatePass.findUnique({
    where: { id: gatePassId }
  });

  if (!gatePass) {
    throw new NotFoundError('Gate pass not found');
  }

  if (gatePass.status !== 'PENDING') {
    throw new BadRequestError('Gate pass is not pending approval');
  }

  const updated = await prisma.gatePass.update({
    where: { id: gatePassId },
    data: {
      status: 'APPROVED',
      approvedBy: userId
    },
    include: { items: { include: { product: true } } }
  });

  await auditLogger.log({
    action: 'GATE_PASS_APPROVED',
    userId,
    resource: 'GatePass',
    resourceId: gatePassId,
    details: { gatePassNumber: updated.gatePassNumber }
  });

  return updated;
}

async function dispatchGatePass(
  gatePassId: string,
  userId: string
): Promise<GatePass> {
  const gatePass = await prisma.gatePass.findUnique({
    where: { id: gatePassId },
    include: { warehouse: true }
  });

  if (!gatePass) {
    throw new NotFoundError('Gate pass not found');
  }

  if (gatePass.status !== 'APPROVED') {
    throw new BadRequestError('Gate pass must be approved before dispatch');
  }

  // Deduct inventory if not already done (MANUAL mode)
  if (gatePass.warehouse.gatePassMode === 'MANUAL') {
    await deductInventoryForGatePass(gatePassId);
  }

  const updated = await prisma.gatePass.update({
    where: { id: gatePassId },
    data: {
      status: 'IN_TRANSIT',
      dispatchedBy: userId
    }
  });

  await auditLogger.log({
    action: 'GATE_PASS_DISPATCHED',
    userId,
    resource: 'GatePass',
    resourceId: gatePassId
  });

  return updated;
}

async function completeGatePass(
  gatePassId: string,
  userId: string
): Promise<GatePass> {
  const gatePass = await prisma.gatePass.findUnique({
    where: { id: gatePassId }
  });

  if (gatePass?.status !== 'IN_TRANSIT') {
    throw new BadRequestError('Gate pass must be in transit to complete');
  }

  const updated = await prisma.gatePass.update({
    where: { id: gatePassId },
    data: {
      status: 'COMPLETED',
      completedBy: userId
    }
  });

  await auditLogger.log({
    action: 'GATE_PASS_COMPLETED',
    userId,
    resource: 'GatePass',
    resourceId: gatePassId
  });

  return updated;
}

async function cancelGatePass(
  gatePassId: string,
  reason: string,
  userId: string
): Promise<GatePass> {
  const gatePass = await prisma.gatePass.findUnique({
    where: { id: gatePassId },
    include: { items: true, warehouse: true }
  });

  if (!['PENDING', 'APPROVED'].includes(gatePass!.status)) {
    throw new BadRequestError('Cannot cancel gate pass in current status');
  }

  // Restore inventory if it was already deducted (AUTO mode, APPROVED status)
  if (gatePass!.warehouse.gatePassMode === 'AUTO' && gatePass!.status === 'APPROVED') {
    await restoreInventoryForGatePass(gatePassId);
  }

  const updated = await prisma.gatePass.update({
    where: { id: gatePassId },
    data: {
      status: 'CANCELLED',
      notes: `${gatePass!.notes || ''}\nCancelled: ${reason}`
    }
  });

  await auditLogger.log({
    action: 'GATE_PASS_CANCELLED',
    userId,
    resource: 'GatePass',
    resourceId: gatePassId,
    details: { reason }
  });

  return updated;
}

async function restoreInventoryForGatePass(gatePassId: string): Promise<void> {
  const gatePass = await prisma.gatePass.findUnique({
    where: { id: gatePassId },
    include: { items: true }
  });

  await prisma.$transaction(async (tx) => {
    for (const item of gatePass!.items) {
      const inventory = await tx.inventory.findFirst({
        where: {
          productId: item.productId,
          warehouseId: gatePass!.warehouseId,
          ...(item.batchNo && { batchNo: item.batchNo })
        }
      });

      await tx.inventory.update({
        where: { id: inventory!.id },
        data: { quantity: { increment: item.quantity } }
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: gatePass!.warehouseId,
          movementType: 'ADJUSTMENT',
          quantity: item.quantity,
          referenceType: 'GATE_PASS_CANCEL',
          referenceId: gatePassId,
          movementDate: new Date(),
          userId: gatePass!.issuedBy,
          notes: `Gate Pass ${gatePass!.gatePassNumber} cancelled - inventory restored`
        }
      });
    }
  });
}
```

**Frontend:**
```tsx
export const GatePassDetailPage: FC = () => {
  const { id } = useParams();
  const { data: gatePass } = useGetGatePass(id!);
  const approveMutation = useApproveGatePass();
  const dispatchMutation = useDispatchGatePass();

  const statusSteps = [
    { status: 'PENDING', label: 'Pending', user: gatePass?.issuer.name },
    { status: 'APPROVED', label: 'Approved', user: gatePass?.approver?.name },
    { status: 'IN_TRANSIT', label: 'In Transit', user: gatePass?.dispatcher?.name },
    { status: 'COMPLETED', label: 'Completed', user: gatePass?.completer?.name }
  ];

  const currentStepIndex = statusSteps.findIndex(s => s.status === gatePass?.status);

  return (
    <div>
      <h1>Gate Pass {gatePass?.gatePassNumber}</h1>

      <Stepper activeStep={currentStepIndex}>
        {statusSteps.map((step, index) => (
          <Step key={step.status} completed={index < currentStepIndex}>
            <StepLabel>{step.label}</StepLabel>
            {step.user && <div className="text-sm text-gray-600">{step.user}</div>}
          </Step>
        ))}
      </Stepper>

      <div className="mt-6 flex gap-4">
        {gatePass?.status === 'PENDING' && (
          <Button onClick={() => approveMutation.mutate(id!)}>
            Approve
          </Button>
        )}
        {gatePass?.status === 'APPROVED' && (
          <Button onClick={() => dispatchMutation.mutate(id!)}>
            Dispatch
          </Button>
        )}
      </div>
    </div>
  );
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
