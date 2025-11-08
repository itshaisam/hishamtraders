# Story 6.2: Gate Pass Creation

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.2
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 6.1, Epic 3.2 (Invoices)
**Status:** Draft - Phase 2

---

## User Story

**As a** warehouse manager,
**I want** to create gate passes for outbound shipments,
**So that** all goods leaving the warehouse are properly authorized and documented.

---

## Acceptance Criteria

1. **Automatic creation from invoice:**
   - [ ] When invoice saved, gate pass auto-created
   - [ ] Linked to invoice (referenceType=INVOICE, referenceId)
   - [ ] Items match invoice items (product, quantity, batch, bin)
   - [ ] Status = APPROVED if AUTO mode, PENDING if MANUAL

2. **Manual gate pass creation:**
   - [ ] POST /api/gate-passes creates gate pass
   - [ ] Purpose: SALE, TRANSFER, RETURN, OTHER
   - [ ] Can create standalone (not linked)

3. **Backend API:**
   - [ ] GET /api/gate-passes - list with filters
   - [ ] GET /api/gate-passes/:id - details with items

4. **Frontend:**
   - [ ] Gate Pass Management page
   - [ ] Create Gate Pass form
   - [ ] Display linked invoice/transfer

5. **Authorization:**
   - [ ] Warehouse Manager and Admin can create
   - [ ] Creation logged in audit trail

---

## Dev Notes

```typescript
interface CreateGatePassDto {
  warehouseId: string;
  purpose: GatePassPurpose;
  referenceType?: string;
  referenceId?: string;
  notes?: string;
  items: Array<{
    productId: string;
    batchNo?: string;
    binLocation?: string;
    quantity: number;
    description?: string;
  }>;
}

async function createGatePass(
  data: CreateGatePassDto,
  userId: string
): Promise<GatePass> {
  // Get warehouse config
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: data.warehouseId }
  });

  // Generate gate pass number
  const gatePassNumber = await generateGatePassNumber(
    data.warehouseId,
    new Date()
  );

  // Determine initial status based on warehouse mode
  const status = warehouse!.gatePassMode === 'AUTO'
    ? 'APPROVED'
    : 'PENDING';

  // Create gate pass
  const gatePass = await prisma.gatePass.create({
    data: {
      gatePassNumber,
      warehouseId: data.warehouseId,
      purpose: data.purpose,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      status,
      issuedBy: userId,
      ...(status === 'APPROVED' && { approvedBy: userId }), // Auto-approve if AUTO mode
      notes: data.notes,
      items: {
        create: data.items
      }
    },
    include: { items: { include: { product: true } }, warehouse: true }
  });

  // If AUTO mode, deduct inventory immediately
  if (warehouse!.gatePassMode === 'AUTO') {
    await deductInventoryForGatePass(gatePass.id);
  }

  await auditLogger.log({
    action: 'GATE_PASS_CREATED',
    userId,
    resource: 'GatePass',
    resourceId: gatePass.id,
    details: {
      gatePassNumber,
      purpose: data.purpose,
      status,
      itemsCount: data.items.length
    }
  });

  return gatePass;
}

// Auto-create from invoice
async function createGatePassFromInvoice(invoiceId: string): Promise<GatePass> {
  const invoice = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true }
  });

  if (!invoice) {
    throw new NotFoundError('Invoice not found');
  }

  const items = invoice.items.map(item => ({
    productId: item.productId,
    batchNo: item.batchNo,
    binLocation: null, // Can be enhanced to track bin
    quantity: item.quantity,
    description: `Invoice ${invoice.invoiceNumber}`
  }));

  return await createGatePass({
    warehouseId: invoice.warehouseId,
    purpose: 'SALE',
    referenceType: 'INVOICE',
    referenceId: invoice.id,
    items
  }, invoice.createdBy);
}

async function deductInventoryForGatePass(gatePassId: string): Promise<void> {
  const gatePass = await prisma.gatePass.findUnique({
    where: { id: gatePassId },
    include: { items: true }
  });

  await prisma.$transaction(async (tx) => {
    for (const item of gatePass!.items) {
      // Find inventory record
      const inventory = await tx.inventory.findFirst({
        where: {
          productId: item.productId,
          warehouseId: gatePass!.warehouseId,
          ...(item.batchNo && { batchNo: item.batchNo })
        }
      });

      if (!inventory || inventory.quantity < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for ${item.product.name}`
        );
      }

      // Deduct inventory
      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: { decrement: item.quantity } }
      });

      // Create stock movement
      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: gatePass!.warehouseId,
          movementType: 'GATE_PASS_OUT',
          quantity: -item.quantity,
          referenceType: 'GATE_PASS',
          referenceId: gatePassId,
          movementDate: new Date(),
          userId: gatePass!.issuedBy,
          notes: `Gate Pass ${gatePass!.gatePassNumber}`
        }
      });
    }
  });
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
