# Story 9.1: Tenant Model & Schema Migration

**Epic:** Epic 9 - Multi-Tenant SaaS Architecture
**Story ID:** STORY-9.1
**Priority:** Critical
**Estimated Effort:** 3-4 hours
**Dependencies:** None (first story in epic)
**Status:** Draft -- Phase 3 (v1.0)

---

## User Story

**As a** platform operator,
**I want** a Tenant model and tenantId on all business data,
**So that** each client's data is logically isolated in the shared database.

---

## Acceptance Criteria

1. **Tenant Model Created:**
   - [ ] `Tenant` model in Prisma schema with: id (cuid), name, slug (unique), status (active/suspended/cancelled), createdAt, updatedAt
   - [ ] `@@map("tenants")` table mapping
   - [ ] Relations to all tenant-scoped models

2. **tenantId Added to All Business Models (35+ models):**
   - [ ] Supply Chain: Supplier, Warehouse, BinLocation, PurchaseOrder, POItem, POCost
   - [ ] Inventory: Product, ProductVariant, Inventory, StockMovement, StockAdjustment, StockTransfer, StockTransferItem, StockCount, StockCountItem
   - [ ] Sales: Client, Invoice, InvoiceItem, CreditNote, CreditNoteItem
   - [ ] Payments: Payment, PaymentAllocation
   - [ ] Expenses: Expense
   - [ ] Warehouse Ops: GatePass, GatePassItem
   - [ ] Accounting: AccountHead, JournalEntry, JournalEntryLine, BankReconciliation, BankReconciliationItem, PeriodClose
   - [ ] Recovery: RecoveryVisit, PaymentPromise, Alert, AlertRule
   - [ ] Settings: SystemSetting
   - [ ] History: ChangeHistory

3. **User Model Updated:**
   - [ ] `tenantId` changed from `String?` (nullable) to `String` (required)
   - [ ] `tenant` relation added: `Tenant @relation(fields: [tenantId], references: [id])`

4. **Each Business Model Gets:**
   - [ ] `tenantId String` field (non-nullable)
   - [ ] `tenant Tenant @relation(fields: [tenantId], references: [id])` relation
   - [ ] `@@index([tenantId])` for query performance

5. **Migration Strategy:**
   - [ ] Migration creates `tenants` table first
   - [ ] Inserts default tenant record with id `'default-tenant'`
   - [ ] Adds `tenantId` columns with `DEFAULT 'default-tenant'`
   - [ ] Updates existing User records: `SET tenantId = 'default-tenant' WHERE tenantId IS NULL`
   - [ ] Makes all tenantId columns non-nullable after data population

6. **System/Platform Models NOT Modified:**
   - [ ] Role, Country, PaymentTerm, ProductCategory, Brand, UnitOfMeasure -- stay shared
   - [ ] AuditLog -- stays platform-wide (links to User which has tenantId)

---

## Dev Notes

### Prisma Schema Pattern

For every business model, add these 3 lines:

```prisma
model Supplier {
  // ... existing fields ...
  tenantId  String
  tenant    Tenant @relation(fields: [tenantId], references: [id])

  @@index([tenantId])
  @@map("suppliers")
}
```

### Tenant Model

```prisma
model Tenant {
  id        String   @id @default(cuid())
  name      String
  slug      String   @unique
  status    String   @default("active") // active, suspended, cancelled
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  // Relations
  users              User[]
  suppliers          Supplier[]
  warehouses         Warehouse[]
  binLocations       BinLocation[]
  products           Product[]
  productVariants    ProductVariant[]
  purchaseOrders     PurchaseOrder[]
  poItems            POItem[]
  poCosts            POCost[]
  inventory          Inventory[]
  stockMovements     StockMovement[]
  stockAdjustments   StockAdjustment[]
  stockTransfers     StockTransfer[]
  stockTransferItems StockTransferItem[]
  stockCounts        StockCount[]
  stockCountItems    StockCountItem[]
  clients            Client[]
  invoices           Invoice[]
  invoiceItems       InvoiceItem[]
  creditNotes        CreditNote[]
  creditNoteItems    CreditNoteItem[]
  payments           Payment[]
  paymentAllocations PaymentAllocation[]
  expenses           Expense[]
  gatePasses         GatePass[]
  gatePassItems      GatePassItem[]
  accountHeads       AccountHead[]
  journalEntries     JournalEntry[]
  journalEntryLines  JournalEntryLine[]
  bankReconciliations    BankReconciliation[]
  bankReconciliationItems BankReconciliationItem[]
  periodCloses       PeriodClose[]
  recoveryVisits     RecoveryVisit[]
  paymentPromises    PaymentPromise[]
  alerts             Alert[]
  alertRules         AlertRule[]
  systemSettings     SystemSetting[]
  changeHistories    ChangeHistory[]

  @@map("tenants")
}
```

### Migration Approach

Since Prisma doesn't support `DEFAULT` values referencing another table, we need a **two-step migration**:

**Step 1:** Create migration with Prisma (adds nullable tenantId columns):
```bash
prisma migrate dev --name add-multi-tenancy --create-only
```

**Step 2:** Edit the generated SQL migration file before applying:
```sql
-- 1. Create tenants table
CREATE TABLE `tenants` (
  `id` VARCHAR(191) NOT NULL DEFAULT 'default-tenant',
  `name` VARCHAR(191) NOT NULL,
  `slug` VARCHAR(191) NOT NULL,
  `status` VARCHAR(191) NOT NULL DEFAULT 'active',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `tenants_slug_key`(`slug`)
);

-- 2. Insert default tenant
INSERT INTO `tenants` (`id`, `name`, `slug`, `updatedAt`)
VALUES ('default-tenant', 'Hisham Traders', 'hisham-traders', NOW());

-- 3. Add tenantId to all business tables (example for suppliers)
ALTER TABLE `suppliers` ADD COLUMN `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
ALTER TABLE `suppliers` ADD INDEX `suppliers_tenantId_idx`(`tenantId`);
ALTER TABLE `suppliers` ADD CONSTRAINT `suppliers_tenantId_fkey`
  FOREIGN KEY (`tenantId`) REFERENCES `tenants`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- 4. Repeat for all 35+ tables...

-- 5. Update users (change nullable to non-nullable)
UPDATE `users` SET `tenantId` = 'default-tenant' WHERE `tenantId` IS NULL;
ALTER TABLE `users` MODIFY `tenantId` VARCHAR(191) NOT NULL DEFAULT 'default-tenant';
```

### Important: Unique Constraints

Some models have unique fields that must become **unique per tenant** (not globally unique):

| Model | Current Unique | New Unique (per tenant) |
|-------|---------------|------------------------|
| AccountHead | `code @unique` | `@@unique([tenantId, code])` |
| SystemSetting | `key @unique` | `@@unique([tenantId, key])` |
| Product | `sku @unique` | `@@unique([tenantId, sku])` |
| ProductVariant | `sku @unique` | `@@unique([tenantId, sku])` |
| PurchaseOrder | `poNumber @unique` | `@@unique([tenantId, poNumber])` |
| Invoice | `invoiceNumber @unique` | `@@unique([tenantId, invoiceNumber])` |
| CreditNote | `creditNoteNumber @unique` | `@@unique([tenantId, creditNoteNumber])` |
| GatePass | `gatePassNumber @unique` | `@@unique([tenantId, gatePassNumber])` |
| StockTransfer | `transferNumber @unique` | `@@unique([tenantId, transferNumber])` |
| StockCount | `countNumber @unique` | `@@unique([tenantId, countNumber])` |
| JournalEntry | `entryNumber @unique` | `@@unique([tenantId, entryNumber])` |
| RecoveryVisit | `visitNumber @unique` | `@@unique([tenantId, visitNumber])` |
| AlertRule | `name @unique` | `@@unique([tenantId, name])` |
| Supplier | `name @unique` | `@@unique([tenantId, name])` |
| Supplier | `email @unique` | Consider `@@unique([tenantId, email])` or keep global |
| Warehouse | `name @unique` | `@@unique([tenantId, name])` |
| BinLocation | `@@unique([warehouseId, code])` | `@@unique([tenantId, warehouseId, code])` |
| ChangeHistory | `@@unique([entityType, entityId, version])` | `@@unique([tenantId, entityType, entityId, version])` |
| PeriodClose | `@@unique([periodType, periodDate])` | `@@unique([tenantId, periodType, periodDate])` |
| Inventory | `@@unique([productId, productVariantId, warehouseId, batchNo])` | `@@unique([tenantId, productId, productVariantId, warehouseId, batchNo])` |
| User | `email @unique` | Keep globally unique (login identifier) |

### File

`prisma/schema.prisma` -- sole file modified in this story

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2026-02-14 | 1.0 | Initial story creation | Claude (Tech Review) |
