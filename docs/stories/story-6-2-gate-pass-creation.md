# Story 6.2: Gate Pass Creation

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.2
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Story 6.1, Epic 3.2 (Invoices)
**Status:** Implemented (v2.1)

---

## User Story

**As a** warehouse manager,
**I want** to create gate passes for outbound shipments,
**So that** all goods leaving the warehouse are properly authorized and documented.

---

## Acceptance Criteria

1. **Automatic creation from invoice:**
   - [x] When invoice saved, gate pass auto-created
   - [x] Linked to invoice (`referenceType='INVOICE'`, `referenceId=invoice.id`)
   - [x] Items match invoice items (product, quantity, batch)
   - [x] Status = APPROVED if AUTO mode, PENDING if MANUAL

2. **Manual gate pass creation:**
   - [x] `POST /api/v1/gate-passes` — creates gate pass
   - [x] Purpose: SALE, TRANSFER, RETURN, OTHER
   - [x] Can create standalone (not linked)

3. **Backend API:**
   - [x] `GET /api/v1/gate-passes` — list with filters
   - [x] `GET /api/v1/gate-passes/:id` — details with items

4. **Inventory deduction:**
   - [x] When gate pass status becomes APPROVED in AUTO mode → deduct inventory
   - [x] Create StockMovement record with `movementType: 'SALE'` (for invoice-linked) or `'TRANSFER'` (for transfers)
   - [x] Create StockMovement with `referenceType: 'INVOICE'` or `'TRANSFER'` (use existing enum values)

5. **Frontend:**
   - [x] Gate Pass Management page
   - [x] Create Gate Pass form
   - [x] Display linked invoice/transfer

6. **Invoice ↔ Gate Pass Visibility:**
   - [x] `getInvoiceById` returns `gatePass: { id, gatePassNumber, status }` when a gate pass is linked
   - [x] `createInvoice` returns gate pass info alongside the created invoice
   - [x] Invoice detail page shows clickable gate pass badge/pill linking to `/gate-passes/:id`

7. **Authorization:**
   - [x] Warehouse Manager and Admin can create
   - [x] Creation logged via `AuditService.log()`

---

## Dev Notes

### Implementation Status

**Backend:** Implemented. Gate pass auto-creation from invoices, manual creation, and invoice↔gate pass visibility all working.

### Key Corrections

1. **API paths**: All use `/api/v1/gate-passes` (not `/api/gate-passes`)
2. **`auditLogger.log()`** → Use `AuditService.log()`:
   ```typescript
   await AuditService.log({
     userId,
     action: 'CREATE',
     entityType: 'GatePass',
     entityId: gatePass.id,
     notes: `Gate pass ${gatePassNumber} created (${data.purpose}, ${status})`,
   });
   ```
3. **MovementType enum**: Current values are `RECEIPT | SALE | ADJUSTMENT | TRANSFER | SALES_RETURN`. Use existing values — do NOT invent `GATE_PASS_OUT`. Use `SALE` for invoice-linked gate passes and `TRANSFER` for transfer-linked.
4. **ReferenceType enum**: Current values are `PO | INVOICE | ADJUSTMENT | TRANSFER | CREDIT_NOTE`. Use existing values — do NOT invent `GATE_PASS`. Link to the source document (INVOICE or TRANSFER).
5. **Invoice model** has NO `createdBy` field. When creating gate pass from invoice, pass `userId` explicitly from the controller/caller context.
6. **`item.product.name`** in `deductInventoryForGatePass` — gate pass items don't automatically include product relation. Must include it in the query.

### Enum Extensions Required

**None** — use existing MovementType and ReferenceType values. Gate passes are an intermediary; the movement references the source document (invoice, transfer).

### Gate Pass Creation Service

```typescript
async function createGatePass(
  data: CreateGatePassDto,
  userId: string
): Promise<GatePass> {
  const warehouse = await prisma.warehouse.findUniqueOrThrow({
    where: { id: data.warehouseId }
  });

  const gatePassNumber = await generateGatePassNumber(data.warehouseId, new Date());

  // Status based on warehouse mode
  const status = warehouse.gatePassMode === 'AUTO' ? 'APPROVED' : 'PENDING';

  const gatePass = await prisma.gatePass.create({
    data: {
      gatePassNumber,
      warehouseId: data.warehouseId,
      purpose: data.purpose,
      referenceType: data.referenceType,
      referenceId: data.referenceId,
      status,
      issuedBy: userId,
      ...(status === 'APPROVED' && { approvedBy: userId }),
      notes: data.notes,
      items: { create: data.items }
    },
    include: { items: { include: { product: true } }, warehouse: true }
  });

  // If AUTO mode, deduct inventory immediately
  if (warehouse.gatePassMode === 'AUTO') {
    await deductInventoryForGatePass(gatePass.id, userId);
  }

  await AuditService.log({
    userId,
    action: 'CREATE',
    entityType: 'GatePass',
    entityId: gatePass.id,
    notes: `Gate pass ${gatePassNumber} created (${data.purpose}, ${status})`,
  });

  return gatePass;
}
```

### Auto-Create from Invoice

```typescript
async function createGatePassFromInvoice(
  invoiceId: string,
  userId: string        // Pass userId explicitly — Invoice has no createdBy field
): Promise<GatePass> {
  const invoice = await prisma.invoice.findUniqueOrThrow({
    where: { id: invoiceId },
    include: { items: true }
  });

  const items = invoice.items.map(item => ({
    productId: item.productId,
    batchNo: item.batchNo ?? undefined,
    quantity: item.quantity,
    description: `Invoice ${invoice.invoiceNumber}`
  }));

  return createGatePass({
    warehouseId: invoice.warehouseId,
    purpose: 'SALE',
    referenceType: 'INVOICE',
    referenceId: invoice.id,
    items
  }, userId);
}
```

### Inventory Deduction

```typescript
async function deductInventoryForGatePass(
  gatePassId: string,
  userId: string
): Promise<void> {
  const gatePass = await prisma.gatePass.findUniqueOrThrow({
    where: { id: gatePassId },
    include: { items: { include: { product: true } } }  // Include product for error messages
  });

  // Determine movementType based on purpose
  const movementType: MovementType =
    gatePass.purpose === 'TRANSFER' ? 'TRANSFER' : 'SALE';

  // Use existing ReferenceType — link to the SOURCE document, not the gate pass
  const referenceType = gatePass.referenceType as ReferenceType | undefined;

  await prisma.$transaction(async (tx) => {
    for (const item of gatePass.items) {
      const inventory = await tx.inventory.findFirst({
        where: {
          productId: item.productId,
          warehouseId: gatePass.warehouseId,
          ...(item.batchNo && { batchNo: item.batchNo })
        }
      });

      if (!inventory || inventory.quantity < item.quantity) {
        throw new BadRequestError(
          `Insufficient stock for ${item.product.name}`
        );
      }

      await tx.inventory.update({
        where: { id: inventory.id },
        data: { quantity: { decrement: item.quantity } }
      });

      await tx.stockMovement.create({
        data: {
          productId: item.productId,
          warehouseId: gatePass.warehouseId,
          movementType,                        // Use existing enum value
          quantity: -item.quantity,
          referenceType: referenceType ?? undefined,  // Use source doc type
          referenceId: gatePass.referenceId ?? undefined,
          movementDate: new Date(),
          userId,
          notes: `Gate Pass ${gatePass.gatePassNumber}`
        }
      });
    }
  });
}
```

### Module Structure

```
apps/api/src/modules/gate-passes/
  gate-pass.controller.ts     (NEW)
  gate-pass.service.ts        (NEW — createGatePass, createGatePassFromInvoice, deductInventory)
  gate-pass.routes.ts         (NEW)

apps/web/src/features/gate-passes/pages/
  GatePassListPage.tsx         (NEW)
  CreateGatePassPage.tsx       (NEW)
```

### POST-MVP DEFERRED

- **Bin location tracking on gate pass items**: For MVP, bin location is optional on gate pass items.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), auditLogger→AuditService, use existing MovementType/ReferenceType enums (no GATE_PASS_OUT/GATE_PASS), fixed Invoice has no createdBy, include product in deduct query | Claude (AI Review) |
| 2026-02-12 | 2.1     | Added AC 6: Invoice↔Gate Pass visibility — invoice API returns gate pass info, invoice detail page shows clickable gate pass link | Claude (Implementation) |
