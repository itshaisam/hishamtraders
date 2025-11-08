# Story 8.2: Change History Tracking with Version Comparison

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.2
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 1 (Audit logging infrastructure)
**Status:** Draft - Phase 2

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
   - [ ] Store snapshot in ChangeHistory table
   - [ ] Auto-delete versions older than 2

3. **Critical Entities Tracked:**
   - [ ] Product, Client, Supplier, PurchaseOrder, Invoice, Payment

4. **Backend API:**
   - [ ] GET /api/change-history/:entityType/:entityId - returns version history
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

```typescript
async function captureChangeHistory(
  entityType: string,
  entityId: string,
  currentSnapshot: any,
  changedBy: string,
  changeReason?: string
): Promise<void> {
  // Get current version count
  const existingVersions = await prisma.changeHistory.findMany({
    where: { entityType, entityId },
    orderBy: { version: 'desc' }
  });

  const newVersion = existingVersions.length + 1;

  // Create new version
  await prisma.changeHistory.create({
    data: {
      entityType,
      entityId,
      version: newVersion,
      changedBy,
      snapshot: currentSnapshot,
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
}

async function getChangeHistory(
  entityType: string,
  entityId: string
): Promise<any[]> {
  const history = await prisma.changeHistory.findMany({
    where: { entityType, entityId },
    include: { user: true },
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
```tsx
export const ChangeHistoryModal: FC<{
  entityType: string;
  entityId: string;
  currentData: any;
}> = ({ entityType, entityId, currentData }) => {
  const [selectedVersions, setSelectedVersions] = useState<[number, number]>([0, 1]);

  const { data: history } = useQuery({
    queryKey: ['change-history', entityType, entityId],
    queryFn: () =>
      fetch(`/api/change-history/${entityType}/${entityId}`).then(res => res.json())
  });

  const versions = [
    { version: 0, label: 'Current', data: currentData, changedBy: '-', changedAt: new Date() },
    ...(history || [])
  ];

  const [version1, version2] = selectedVersions;
  const data1 = versions[version1]?.data || {};
  const data2 = versions[version2]?.data || {};

  const allKeys = new Set([...Object.keys(data1), ...Object.keys(data2)]);
  const changes = Array.from(allKeys).map(key => ({
    field: key,
    oldValue: data2[key],
    newValue: data1[key],
    changed: data1[key] !== data2[key]
  }));

  return (
    <Modal>
      <h2>Change History</h2>

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
            <th>Field</th>
            <th>Old Value</th>
            <th>New Value</th>
          </tr>
        </thead>
        <tbody>
          {changes.map(change => (
            <tr key={change.field} className={change.changed ? 'bg-yellow-50' : ''}>
              <td>{change.field}</td>
              <td>{String(change.oldValue)}</td>
              <td>{String(change.newValue)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <Button>Restore This Version</Button>
    </Modal>
  );
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
