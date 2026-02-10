# Story 8.2: Change History Tracking with Version Comparison

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.2
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 1 (Audit logging infrastructure)
**Status:** Draft -- Phase 2 (v2.0 -- Revised)

---

## User Story

**As a** user,
**I want** to see the last 2 previous versions of critical records,
**So that** I can understand what changed and potentially rollback errors.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] ChangeHistory table: id, entityType, entityId, version, changedBy, changedAt, snapshot (JSON), changeReason
   - [ ] Maintains maximum 2 previous versions per entity

2. **Change Tracking:**
   - [ ] Base service layer hooks capture current state before update
   - [ ] Store snapshot in ChangeHistory table (only whitelisted fields)
   - [ ] Limit snapshot to relevant fields only (exclude large objects, sensitive data)
   - [ ] Validate snapshot size (max 5MB per entry)
   - [ ] Auto-delete versions older than 2

3. **Critical Entities Tracked:**
   - [ ] Product, Client, Supplier, PurchaseOrder, Invoice, Payment

4. **Backend API:**
   - [ ] GET /api/v1/change-history/:entityType/:entityId - returns version history
   - [ ] Response includes: version number, changedBy (user), changedAt (timestamp), snapshot

5. **Frontend - Entity Detail Pages:**
   - [ ] Display "Last Modified" information
   - [ ] "View History" button/link

6. **Frontend - Change History Modal:**
   - [ ] Version selector (Current, Version 1, Version 2)
   - [ ] Side-by-side comparison table: Field | Old Value | New Value
   - [ ] Highlight changed fields in yellow
   - [ ] Display user-provided change reason
   - [ ] "Restore This Version" button (Admin only)

7. **Comparison Feature:**
   - [ ] Allow comparing any two versions
   - [ ] Current vs Version 1, Version 1 vs Version 2

8. **Authorization:**
   - [ ] All users can view change history for accessible entities
   - [ ] Only Admin can rollback

---

## Dev Notes

### New Schema (ChangeHistory model does NOT exist yet -- must be added)

```prisma
model ChangeHistory {
  id          String   @id @default(cuid())
  entityType  String
  entityId    String
  version     Int
  changedBy   String
  changedAt   DateTime @default(now())
  snapshot    Json
  changeReason String? @db.Text

  user        User     @relation(fields: [changedBy], references: [id])

  @@unique([entityType, entityId, version])
  @@index([entityType, entityId])
  @@map("change_history")
}
```

> **Note:** This requires adding a `changeHistory ChangeHistory[]` relation on the User model as well.

### Snapshot Field Whitelisting

Define which fields should be stored for each entity type. Fields must match actual schema columns:

```typescript
const ENTITY_SNAPSHOT_WHITELIST: Record<string, string[]> = {
  PRODUCT: [
    'id', 'name', 'sku', 'categoryId', 'brandId', 'uomId',
    'costPrice', 'sellingPrice', 'reorderLevel', 'binLocation', 'status'
  ],
  CLIENT: [
    'id', 'name', 'contactPerson', 'email', 'phone',
    'city', 'area', 'creditLimit', 'paymentTermsDays', 'balance',
    'status', 'taxExempt', 'taxExemptReason'
  ],
  INVOICE: [
    'id', 'invoiceNumber', 'clientId', 'warehouseId',
    'invoiceDate', 'dueDate', 'paymentType',
    'subtotal', 'taxAmount', 'taxRate', 'total', 'paidAmount',
    'status', 'notes'
  ],
  PAYMENT: [
    'id', 'supplierId', 'clientId', 'paymentType',
    'paymentReferenceType', 'referenceId', 'amount',
    'method', 'referenceNumber', 'date', 'notes', 'recordedBy'
  ],
  SUPPLIER: [
    'id', 'name', 'contactPerson', 'email', 'phone',
    'address', 'countryId', 'paymentTermId', 'status'
  ],
  PURCHASE_ORDER: [
    'id', 'poNumber', 'supplierId', 'orderDate',
    'expectedArrivalDate', 'totalAmount', 'status',
    'containerNo', 'notes'
  ]
};

async function captureChangeHistory(
  entityType: string,
  entityId: string,
  currentSnapshot: any,
  changedBy: string,
  changeReason?: string
): Promise<void> {
  // Filter snapshot to whitelisted fields only
  const whitelistedFields = ENTITY_SNAPSHOT_WHITELIST[entityType];
  if (!whitelistedFields) {
    throw new BadRequestError(`Change history not supported for ${entityType}`);
  }

  const filteredSnapshot = Object.keys(currentSnapshot)
    .filter(key => whitelistedFields.includes(key))
    .reduce((obj, key) => {
      obj[key] = currentSnapshot[key];
      return obj;
    }, {} as Record<string, any>);

  // Validate snapshot size (max 5MB)
  const snapshotSize = JSON.stringify(filteredSnapshot).length;
  const maxSnapshotSize = 5 * 1024 * 1024; // 5MB

  if (snapshotSize > maxSnapshotSize) {
    throw new BadRequestError(
      `Change history snapshot too large (${(snapshotSize / 1024).toFixed(2)}KB). ` +
      `Maximum allowed: ${(maxSnapshotSize / 1024 / 1024).toFixed(2)}MB`
    );
  }

  // Get current version count
  const existingVersions = await prisma.changeHistory.findMany({
    where: { entityType, entityId },
    orderBy: { version: 'desc' }
  });

  const newVersion = existingVersions.length + 1;

  // Create new version with filtered snapshot
  await prisma.changeHistory.create({
    data: {
      entityType,
      entityId,
      version: newVersion,
      changedBy,
      snapshot: filteredSnapshot,
      changeReason
    }
  });

  // Keep only last 2 versions
  if (existingVersions.length >= 2) {
    const versionsToDelete = existingVersions.slice(2);
    await prisma.changeHistory.deleteMany({
      where: {
        id: { in: versionsToDelete.map(v => v.id) }
      }
    });
  }

  // Log to audit trail using AuditService
  await AuditService.log({
    userId: changedBy,
    action: 'CREATE',
    entityType: 'ChangeHistory',
    entityId,
    notes: `Snapshot v${newVersion} created for ${entityType} ${entityId}. ` +
           `Fields: ${Object.keys(filteredSnapshot).length}, ` +
           `Size: ${snapshotSize}B` +
           (changeReason ? `. Reason: ${changeReason}` : '')
  });
}

async function getChangeHistory(
  entityType: string,
  entityId: string
): Promise<any[]> {
  const history = await prisma.changeHistory.findMany({
    where: { entityType, entityId },
    include: {
      user: {
        select: { name: true, email: true }
      }
    },
    orderBy: { version: 'desc' }
  });

  return history.map(h => ({
    version: h.version,
    changedBy: h.user.name,
    changedAt: h.changedAt,
    snapshot: h.snapshot,
    changeReason: h.changeReason
  }));
}
```

**Frontend:**

> Use `apiClient` from `@/lib/api-client` (axios). Do NOT use raw `fetch()`.
> `Modal` component exists and can be used directly.

```tsx
import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export const ChangeHistoryModal: FC<{
  entityType: string;
  entityId: string;
  currentData: any;
  onClose: () => void;
}> = ({ entityType, entityId, currentData, onClose }) => {
  const [selectedVersions, setSelectedVersions] = useState<[number, number]>([0, 1]);

  const { data: history } = useQuery({
    queryKey: ['change-history', entityType, entityId],
    queryFn: () =>
      apiClient
        .get(`/change-history/${entityType}/${entityId}`)
        .then(res => res.data)
  });

  const versions = [
    { version: 0, label: 'Current', data: currentData, changedBy: '-', changedAt: new Date() },
    ...(history || []).map((h: any) => ({
      ...h,
      label: `Version ${h.version}`,
      data: h.snapshot
    }))
  ];

  const [version1, version2] = selectedVersions;
  const data1 = versions[version1]?.data || {};
  const data2 = versions[version2]?.data || {};

  const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);
  const changes = Array.from(allKeys).map(key => ({
    field: key,
    oldValue: data2[key],
    newValue: data1[key],
    changed: JSON.stringify(data1[key]) !== JSON.stringify(data2[key])
  }));

  return (
    <Modal onClose={onClose}>
      <h2 className="text-lg font-bold mb-4">Change History</h2>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <Select
          label="Compare From"
          value={version2}
          onChange={(e) => setSelectedVersions([version1, parseInt(e.target.value)])}
        >
          {versions.map((v, idx) => (
            <option key={idx} value={idx}>{v.label || `Version ${v.version}`}</option>
          ))}
        </Select>

        <Select
          label="Compare To"
          value={version1}
          onChange={(e) => setSelectedVersions([parseInt(e.target.value), version2])}
        >
          {versions.map((v, idx) => (
            <option key={idx} value={idx}>{v.label || `Version ${v.version}`}</option>
          ))}
        </Select>
      </div>

      <table className="w-full">
        <thead>
          <tr>
            <th className="text-left py-2">Field</th>
            <th className="text-left py-2">Old Value</th>
            <th className="text-left py-2">New Value</th>
          </tr>
        </thead>
        <tbody>
          {changes.map(change => (
            <tr key={change.field} className={change.changed ? 'bg-yellow-50' : ''}>
              <td className="py-2 font-medium">{change.field}</td>
              <td className="py-2">{change.oldValue != null ? String(change.oldValue) : '-'}</td>
              <td className="py-2">{change.newValue != null ? String(change.newValue) : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-4 flex justify-end">
        <Button variant="primary">Restore This Version</Button>
      </div>
    </Modal>
  );
};
```

---

### Key Corrections (from v1.0)

1. **API path:** Changed `/api/change-history/` to `/api/v1/change-history/` to match the project's API base URL convention.
2. **`auditLogger.log()` replaced with `AuditService.log()`:** The actual service class is `AuditService` with static method `log()`. It accepts `{ userId, action, entityType, entityId?, notes? }` -- NOT `resource`, `resourceId`, `details`.
3. **`action: 'SNAPSHOT_CREATED'` replaced with `action: 'CREATE'`:** The `AuditService` only accepts: `CREATE | UPDATE | DELETE | VIEW | LOGIN | LOGOUT | PERMISSION_CHECK`. Custom action strings are not valid.
4. **PAYMENT whitelist corrected:** The old whitelist referenced `invoiceId` directly, but Payment uses `PaymentAllocation` for invoice links. The field is `referenceId` (deprecated for client payments). Updated to match actual Payment model fields: `supplierId`, `clientId`, `paymentType`, `paymentReferenceType`, `referenceId`, `amount`, `method`, `referenceNumber`, `date`, `notes`, `recordedBy`.
5. **PRODUCT whitelist corrected:** Removed `salePrice` (actual field is `sellingPrice`), `category` (actual field is `categoryId`), `description`/`barcode` (do not exist on Product). Added `brandId`, `uomId`, `reorderLevel`, `binLocation`.
6. **INVOICE whitelist corrected:** Added `warehouseId`, `paymentType`, `taxRate`, `paidAmount`. Replaced `issueDate` with `invoiceDate` (actual field name).
7. **SUPPLIER whitelist corrected:** Replaced `taxId`/`paymentTerms` with `countryId`/`paymentTermId` (actual FK fields).
8. **PURCHASE_ORDER whitelist corrected:** Replaced `expectedDelivery`, `subtotal`, `taxAmount`, `total` with `expectedArrivalDate`, `totalAmount` (actual fields). Added `containerNo`.
9. **CLIENT whitelist corrected:** Replaced `address`/`taxId` with `city`/`area`/`paymentTermsDays`/`balance`/`taxExempt`/`taxExemptReason` (actual fields).
10. **`fetch()` replaced with `apiClient`:** Frontend uses the project's axios-based `apiClient` from `@/lib/api-client`.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: corrected API paths, fixed AuditService call signature, corrected all entity snapshot whitelists to match actual schema fields, replaced fetch with apiClient | Claude (Tech Review) |
