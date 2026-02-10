# Story 6.1: Gate Pass System - Configuration

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.1
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 2 (Warehouses)
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As a** warehouse manager,
**I want** to configure gate pass generation mode per warehouse (automatic or manual approval),
**So that** I can control authorization levels based on warehouse security requirements.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Warehouse table expanded: `gatePassMode` (GatePassMode enum, default AUTO) — NEW field
   - [ ] GatePass table created (see Dev Notes)
   - [ ] GatePassItem table for line items
   - [ ] Gate pass number format: `GP-{WarehouseName3}-YYYYMMDD-XXX` (e.g., `GP-MAI-20260115-001`)

2. **Gate Pass Modes:**
   - [ ] AUTO: Gate pass created automatically, status = APPROVED, **inventory deducted when APPROVED**
   - [ ] MANUAL: Gate pass created with status = PENDING, requires approval, **inventory deducted when IN_TRANSIT** (dispatched)

3. **Backend API:**
   - [ ] `PUT /api/v1/warehouses/:id/gate-pass-config` — updates gatePassMode
   - [ ] Validation: only AUTO or MANUAL allowed

4. **Frontend:**
   - [ ] Warehouse Settings page includes gate pass mode toggle
   - [ ] Clear explanation of AUTO vs MANUAL modes

5. **Authorization:**
   - [ ] Only Admin and Warehouse Manager can configure
   - [ ] Configuration changes logged via `AuditService.log()`

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on Warehouse model (Epic 2).

### Key Corrections

1. **API paths**: All use `/api/v1/` prefix (not `/api/`)
2. **Warehouse model** currently has: `id`, `name` (unique), `location` (Text), `city`, `status` — NO `code` field. Gate pass number cannot use `warehouse.code`. Use first 3 chars of `warehouse.name` (uppercased) instead, or add `code` field.
3. **`auditLogger.log()`** → Use `AuditService.log()` with correct fields:
   ```typescript
   await AuditService.log({
     userId,
     action: 'UPDATE',           // NOT custom action strings
     entityType: 'Warehouse',    // NOT 'resource'
     entityId: warehouseId,
     notes: `Gate pass mode changed to ${gatePassMode} for ${warehouse.name}`,
   });
   ```
4. **AuditService `action`** must be one of: `CREATE | UPDATE | DELETE | VIEW | LOGIN | LOGOUT | PERMISSION_CHECK`
5. **Warehouse schema** in doc was incomplete — missing existing fields (`city`, `createdBy`, `updatedBy`, existing relations). Only show the NEW additions.

### Schema Changes Required

**Add to existing Warehouse model:**
```prisma
// ADD to Warehouse model:
gatePassMode GatePassMode @default(AUTO)
gatePasses   GatePass[]
```

**New enum:**
```prisma
enum GatePassMode {
  AUTO
  MANUAL
}
```

**New models:**
```prisma
model GatePass {
  id             String         @id @default(cuid())
  gatePassNumber String         @unique
  warehouseId    String
  date           DateTime       @default(now())
  purpose        GatePassPurpose
  referenceType  String?        // INVOICE, TRANSFER, etc.
  referenceId    String?
  status         GatePassStatus @default(PENDING)
  issuedBy       String
  approvedBy     String?
  dispatchedBy   String?
  completedBy    String?
  notes          String?        @db.Text
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt

  warehouse      Warehouse      @relation(fields: [warehouseId], references: [id])
  issuer         User           @relation("IssuedGatePasses", fields: [issuedBy], references: [id])
  approver       User?          @relation("ApprovedGatePasses", fields: [approvedBy], references: [id])
  items          GatePassItem[]

  @@index([warehouseId, status, date])
  @@map("gate_passes")
}

model GatePassItem {
  id          String   @id @default(cuid())
  gatePassId  String
  productId   String
  batchNo     String?
  binLocation String?
  quantity    Int
  description String?  @db.Text

  gatePass    GatePass @relation(fields: [gatePassId], references: [id], onDelete: Cascade)
  product     Product  @relation(fields: [productId], references: [id])

  @@map("gate_pass_items")
}

enum GatePassPurpose {
  SALE
  TRANSFER
  RETURN
  OTHER
}

enum GatePassStatus {
  PENDING
  APPROVED
  IN_TRANSIT
  COMPLETED
  CANCELLED
}
```

**User model** needs new relations:
```prisma
// ADD to User model:
issuedGatePasses   GatePass[] @relation("IssuedGatePasses")
approvedGatePasses GatePass[] @relation("ApprovedGatePasses")
```

**Product model** needs new relation:
```prisma
// ADD to Product model:
gatePassItems GatePassItem[]
```

### Gate Pass Number Generation

```typescript
// Warehouse has no 'code' field — derive prefix from name
async function generateGatePassNumber(
  warehouseId: string,
  date: Date
): Promise<string> {
  const warehouse = await prisma.warehouse.findUniqueOrThrow({
    where: { id: warehouseId }
  });

  // Use first 3 chars of warehouse name (uppercased) as prefix
  const warehousePrefix = warehouse.name.substring(0, 3).toUpperCase();
  const dateStr = format(date, 'yyyyMMdd');
  const prefix = `GP-${warehousePrefix}-${dateStr}-`;

  const latest = await prisma.gatePass.findFirst({
    where: { gatePassNumber: { startsWith: prefix } },
    orderBy: { gatePassNumber: 'desc' }
  });

  if (!latest) {
    return `${prefix}001`;
  }

  // Gate pass number: GP-MAI-20260115-001 → split by '-' gives ['GP','MAI','20260115','001']
  const parts = latest.gatePassNumber.split('-');
  const lastNumber = parseInt(parts[parts.length - 1]);
  const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
  return `${prefix}${nextNumber}`;
}
```

### Module Structure

```
apps/api/src/modules/gate-passes/
  gate-pass.controller.ts     (NEW)
  gate-pass.service.ts        (NEW)
  gate-pass.routes.ts         (NEW)

apps/web/src/features/warehouse/pages/
  WarehouseSettingsPage.tsx    (EXPAND — add gate pass mode toggle)
```

### POST-MVP DEFERRED

- **Warehouse `code` field**: Current model has no `code`. If unique warehouse codes are desired, add in a future migration. For now, derive from `name`.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), auditLogger→AuditService with correct action enum, noted Warehouse has no `code` field, fixed gate pass number generation, corrected schema to only show NEW additions | Claude (AI Review) |
