# Story 6.1: Gate Pass System - Configuration

**Epic:** Epic 6 - Advanced Inventory Operations
**Story ID:** STORY-6.1
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 2 (Warehouses)
**Status:** Draft - Phase 2

---

## User Story

**As a** warehouse manager,
**I want** to configure gate pass generation mode per warehouse (automatic or manual approval),
**So that** I can control authorization levels based on warehouse security requirements.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Warehouse table expanded: gatePassMode (AUTO/MANUAL), default AUTO
   - [ ] GatePass table created with fields
   - [ ] GatePassItem table for line items
   - [ ] Gate pass number format: GP-{WarehouseCode}-YYYYMMDD-XXX

2. **Gate Pass Modes:**
   - [ ] AUTO: Gate pass created automatically, status = APPROVED, inventory deducted immediately
   - [ ] MANUAL: Gate pass created with status = PENDING, requires approval, inventory deducted on IN_TRANSIT

3. **Backend API:**
   - [ ] PUT /api/warehouses/:id/gate-pass-config updates gatePassMode
   - [ ] Validation: only AUTO or MANUAL allowed

4. **Frontend:**
   - [ ] Warehouse Settings page includes gate pass mode toggle
   - [ ] Clear explanation of AUTO vs MANUAL modes

5. **Authorization:**
   - [ ] Only Admin and Warehouse Manager can configure
   - [ ] Configuration changes logged in audit trail

---

## Dev Notes

### Database Schema

```prisma
model Warehouse {
  id           String          @id @default(cuid())
  code         String          @unique
  name         String
  location     String?
  gatePassMode GatePassMode    @default(AUTO)
  status       WarehouseStatus @default(ACTIVE)
  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt

  inventory    Inventory[]
  gatePasses   GatePass[]

  @@map("warehouses")
}

enum GatePassMode {
  AUTO
  MANUAL
}

model GatePass {
  id             String         @id @default(cuid())
  gatePassNumber String         @unique
  warehouseId    String
  date           DateTime       @default(now())
  purpose        GatePassPurpose
  referenceType  String?        // INVOICE, TRANSFER, ADJUSTMENT
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

### Gate Pass Number Generation

```typescript
async function generateGatePassNumber(
  warehouseId: string,
  date: Date
): Promise<string> {
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: warehouseId }
  });

  const dateStr = format(date, 'yyyyMMdd');
  const prefix = `GP-${warehouse!.code}-${dateStr}-`;

  const latest = await prisma.gatePass.findFirst({
    where: { gatePassNumber: { startsWith: prefix } },
    orderBy: { gatePassNumber: 'desc' }
  });

  if (!latest) {
    return `${prefix}001`;
  }

  const lastNumber = parseInt(latest.gatePassNumber.split('-')[3]);
  const nextNumber = (lastNumber + 1).toString().padStart(3, '0');
  return `${prefix}${nextNumber}`;
}
```

### Configuration Service

```typescript
async function updateGatePassConfig(
  warehouseId: string,
  gatePassMode: 'AUTO' | 'MANUAL',
  userId: string
): Promise<Warehouse> {
  const warehouse = await prisma.warehouse.update({
    where: { id: warehouseId },
    data: { gatePassMode }
  });

  await auditLogger.log({
    action: 'WAREHOUSE_GATE_PASS_CONFIG_UPDATE',
    userId,
    resource: 'Warehouse',
    resourceId: warehouseId,
    details: {
      warehouseName: warehouse.name,
      newMode: gatePassMode
    }
  });

  return warehouse;
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
