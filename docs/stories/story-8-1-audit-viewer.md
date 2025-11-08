# Story 8.1: Audit Trail Viewer with Search

**Epic:** Epic 8 - Audit Trail Viewer & Advanced Features
**Story ID:** STORY-8.1
**Priority:** High
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 1 (Audit logging infrastructure)
**Status:** Draft - Phase 2

---

## User Story

**As an** admin,
**I want** to search and view the complete audit trail of user actions,
**So that** any suspicious activity or data changes can be investigated.

---

## Acceptance Criteria

1. **Backend API:**
   - [ ] GET /api/audit-logs - returns audit log entries with pagination (default 50 per page)
   - [ ] Supports pagination: page, limit parameters
   - [ ] Sorted by timestamp DESC (newest first)

2. **Filters Supported:**
   - [ ] userId (user who performed action)
   - [ ] entityType (Product, Invoice, Payment, Client, etc.)
   - [ ] action (CREATE, UPDATE, DELETE, VIEW)
   - [ ] dateFrom, dateTo (timestamp range)
   - [ ] entityId (specific record ID)
   - [ ] ipAddress (source IP address)

3. **Search Capability:**
   - [ ] Search by: entity ID, user email/name, reference number (invoice #, PO #)
   - [ ] Case-insensitive partial match
   - [ ] Performance optimized with database indexes on frequently searched fields

4. **Response Data:**
   - [ ] timestamp, userId, userName, userEmail, action, entityType, entityId, ipAddress
   - [ ] changedFields summary (field names only, not full values)
   - [ ] Total count for pagination

5. **Detailed Log Entry:**
   - [ ] GET /api/audit-logs/:id - returns full audit log entry
   - [ ] Includes complete changedFields JSON (old and new values)

6. **Frontend - Audit Trail Page:**
   - [ ] Filter panel: User dropdown, Entity Type dropdown, Action dropdown, Date Range picker
   - [ ] Search bar: Entity ID, User, Reference Number
   - [ ] Results table: Timestamp | User | Action | Entity Type | Entity ID | IP Address | Details
   - [ ] Expandable rows show changed fields (old vs new values)
   - [ ] Pagination controls
   - [ ] "Export to Excel" button
   - [ ] Critical actions (DELETE) displayed in red

7. **Navigation:**
   - [ ] Click entity ID navigates to entity detail page (if accessible)
   - [ ] Click user name filters to show all actions by that user

8. **Authorization:**
   - [ ] Admin can access full audit trail viewer
   - [ ] Other roles can view audit history for entities they own (e.g., Sales Officer sees audit for their invoices)

---

## Dev Notes

### Database Schema with Performance Indexes

```prisma
model AuditLog {
  id              String   @id @default(cuid())
  timestamp       DateTime @default(now())
  userId          String
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  action          String   // CREATE, UPDATE, DELETE, VIEW
  entityType      String   // Product, Invoice, Payment, etc.
  entityId        String   // Reference to entity ID
  ipAddress       String?
  changedFields   Json?    // Full change details
  metadata        Json?    // Additional metadata (e.g., referenceNumber)

  // Performance indexes
  @@index([userId, timestamp])     // Filter by user and date
  @@index([entityType, entityId])  // Filter by entity type and ID
  @@index([action])                // Filter by action type
  @@index([timestamp])             // Sort by timestamp
  @@index([entityId])              // Search by entity ID
  @@fulltext([entityId])           // Full-text search support (MySQL)

  @@map("audit_logs")
}
```

### Search Optimization Notes

The following indexes are crucial for query performance:

1. **[userId, timestamp]** - Most common filter combination (user actions on a date)
2. **[entityType, entityId]** - Find all changes to a specific entity
3. **[action]** - Filter critical operations (DELETE)
4. **[timestamp]** - Default sorting (newest first) and date range queries
5. **[entityId]** - Individual entity lookup and search
6. **fulltext([entityId])** - MySQL full-text search for partial matches

For PostgreSQL, add GIN index for better full-text search:
```prisma
@@index([entityId(ops: "gin_trgm_ops")]) // PostgreSQL trigram index for LIKE
```

```typescript
interface AuditLogFilters {
  userId?: string;
  entityType?: string;
  action?: string;
  dateFrom?: Date;
  dateTo?: Date;
  entityId?: string;
  ipAddress?: string;
  search?: string;
  page?: number;
  limit?: number;
}

interface AuditLogListItem {
  id: string;
  timestamp: Date;
  userId: string;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  changedFieldsSummary: string[]; // Field names only
}

async function getAuditLogs(
  filters: AuditLogFilters,
  userRole: string,
  userId: string
): Promise<{ logs: AuditLogListItem[]; total: number }> {
  const page = filters.page || 1;
  const limit = filters.limit || 50;
  const skip = (page - 1) * limit;

  const where: any = {};

  // Authorization: Non-admins can only see logs for entities they own
  if (userRole !== 'ADMIN') {
    // Get entities owned by user (invoices, payments created by them)
    const ownedInvoices = await prisma.invoice.findMany({
      where: { createdBy: userId },
      select: { id: true }
    });
    const ownedPayments = await prisma.payment.findMany({
      where: { createdBy: userId },
      select: { id: true }
    });

    const ownedEntityIds = [
      ...ownedInvoices.map(i => i.id),
      ...ownedPayments.map(p => p.id)
    ];

    where.entityId = { in: ownedEntityIds };
  }

  // Apply filters
  if (filters.userId) {
    where.userId = filters.userId;
  }

  if (filters.entityType) {
    where.entityType = filters.entityType;
  }

  if (filters.action) {
    where.action = filters.action;
  }

  if (filters.dateFrom || filters.dateTo) {
    where.timestamp = {};
    if (filters.dateFrom) where.timestamp.gte = filters.dateFrom;
    if (filters.dateTo) where.timestamp.lte = filters.dateTo;
  }

  if (filters.entityId) {
    where.entityId = filters.entityId;
  }

  if (filters.ipAddress) {
    where.ipAddress = filters.ipAddress;
  }

  // Search functionality
  if (filters.search) {
    where.OR = [
      { entityId: { contains: filters.search, mode: 'insensitive' } },
      { user: { name: { contains: filters.search, mode: 'insensitive' } } },
      { user: { email: { contains: filters.search, mode: 'insensitive' } } },
      { metadata: { path: ['referenceNumber'], string_contains: filters.search } }
    ];
  }

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: { timestamp: 'desc' },
      skip,
      take: limit
    }),
    prisma.auditLog.count({ where })
  ]);

  return {
    logs: logs.map(log => ({
      id: log.id,
      timestamp: log.timestamp,
      userId: log.userId,
      userName: log.user.name,
      userEmail: log.user.email,
      action: log.action,
      entityType: log.entityType,
      entityId: log.entityId,
      ipAddress: log.ipAddress || 'N/A',
      changedFieldsSummary: log.changedFields
        ? Object.keys(log.changedFields as any)
        : []
    })),
    total
  };
}

async function getAuditLogDetails(logId: string): Promise<any> {
  const log = await prisma.auditLog.findUnique({
    where: { id: logId },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          role: true
        }
      }
    }
  });

  if (!log) {
    throw new NotFoundError('Audit log not found');
  }

  return {
    id: log.id,
    timestamp: log.timestamp,
    user: {
      id: log.userId,
      name: log.user.name,
      email: log.user.email,
      role: log.user.role
    },
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    ipAddress: log.ipAddress,
    changedFields: log.changedFields, // Full JSON
    metadata: log.metadata
  };
}
```

**Frontend:**
```tsx
import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Search, ChevronDown, ChevronUp } from 'lucide-react';
import { format } from 'date-fns';

interface AuditLog {
  id: string;
  timestamp: Date;
  userName: string;
  userEmail: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  changedFieldsSummary: string[];
}

export const AuditTrailPage: FC = () => {
  const [filters, setFilters] = useState({
    userId: '',
    entityType: '',
    action: '',
    dateFrom: null as Date | null,
    dateTo: null as Date | null,
    search: '',
    page: 1,
    limit: 50
  });

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', filters],
    queryFn: () =>
      fetch(
        `/api/audit-logs?${new URLSearchParams({
          userId: filters.userId,
          entityType: filters.entityType,
          action: filters.action,
          dateFrom: filters.dateFrom?.toISOString() || '',
          dateTo: filters.dateTo?.toISOString() || '',
          search: filters.search,
          page: filters.page.toString(),
          limit: filters.limit.toString()
        })}`
      ).then(res => res.json())
  });

  const toggleRow = (logId: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedRows(newExpanded);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'DELETE': return 'text-red-600 bg-red-50';
      case 'CREATE': return 'text-green-600 bg-green-50';
      case 'UPDATE': return 'text-blue-600 bg-blue-50';
      case 'VIEW': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleUserClick = (userId: string) => {
    setFilters(prev => ({ ...prev, userId, page: 1 }));
  };

  const totalPages = Math.ceil((data?.total || 0) / filters.limit);

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Audit Trail</h1>
        <Button>
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Card.Body>
          <div className="grid grid-cols-4 gap-4 mb-4">
            <Select
              label="User"
              value={filters.userId}
              onChange={(e) => setFilters(prev => ({ ...prev, userId: e.target.value, page: 1 }))}
            >
              <option value="">All Users</option>
              {/* User options */}
            </Select>

            <Select
              label="Entity Type"
              value={filters.entityType}
              onChange={(e) => setFilters(prev => ({ ...prev, entityType: e.target.value, page: 1 }))}
            >
              <option value="">All Types</option>
              <option value="Product">Product</option>
              <option value="Invoice">Invoice</option>
              <option value="Payment">Payment</option>
              <option value="Client">Client</option>
              <option value="PurchaseOrder">Purchase Order</option>
              <option value="Supplier">Supplier</option>
            </Select>

            <Select
              label="Action"
              value={filters.action}
              onChange={(e) => setFilters(prev => ({ ...prev, action: e.target.value, page: 1 }))}
            >
              <option value="">All Actions</option>
              <option value="CREATE">Create</option>
              <option value="UPDATE">Update</option>
              <option value="DELETE">Delete</option>
              <option value="VIEW">View</option>
            </Select>

            <div className="relative">
              <Input
                type="text"
                label="Search"
                placeholder="Entity ID, User, Reference..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
              />
              <Search className="absolute right-3 top-9 h-5 w-5 text-gray-400" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <DatePicker
              label="From Date"
              value={filters.dateFrom}
              onChange={(date) => setFilters(prev => ({ ...prev, dateFrom: date, page: 1 }))}
            />

            <DatePicker
              label="To Date"
              value={filters.dateTo}
              onChange={(date) => setFilters(prev => ({ ...prev, dateTo: date, page: 1 }))}
            />
          </div>
        </Card.Body>
      </Card>

      {/* Results */}
      <Card>
        <Card.Body>
          <div className="mb-4 text-sm text-gray-600">
            Showing {((filters.page - 1) * filters.limit) + 1} - {Math.min(filters.page * filters.limit, data?.total || 0)} of {data?.total || 0} entries
          </div>

          <Table>
            <thead>
              <tr>
                <th></th>
                <th>Timestamp</th>
                <th>User</th>
                <th>Action</th>
                <th>Entity Type</th>
                <th>Entity ID</th>
                <th>IP Address</th>
                <th>Changed Fields</th>
              </tr>
            </thead>
            <tbody>
              {data?.logs.map((log: AuditLog) => (
                <>
                  <tr key={log.id} className={log.action === 'DELETE' ? 'bg-red-50' : ''}>
                    <td>
                      <button
                        onClick={() => toggleRow(log.id)}
                        className="p-1 hover:bg-gray-100 rounded"
                      >
                        {expandedRows.has(log.id) ? (
                          <ChevronUp className="h-4 w-4" />
                        ) : (
                          <ChevronDown className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td>{format(new Date(log.timestamp), 'PPp')}</td>
                    <td>
                      <button
                        onClick={() => handleUserClick(log.userId)}
                        className="text-blue-600 hover:underline"
                      >
                        {log.userName}
                      </button>
                      <div className="text-xs text-gray-500">{log.userEmail}</div>
                    </td>
                    <td>
                      <Badge className={getActionColor(log.action)}>
                        {log.action}
                      </Badge>
                    </td>
                    <td>{log.entityType}</td>
                    <td>
                      <Link to={`/${log.entityType.toLowerCase()}s/${log.entityId}`}>
                        {log.entityId.substring(0, 8)}...
                      </Link>
                    </td>
                    <td className="text-sm text-gray-600">{log.ipAddress}</td>
                    <td>
                      {log.changedFieldsSummary.length > 0 ? (
                        <span className="text-sm text-gray-600">
                          {log.changedFieldsSummary.slice(0, 3).join(', ')}
                          {log.changedFieldsSummary.length > 3 && '...'}
                        </span>
                      ) : (
                        <span className="text-sm text-gray-400">-</span>
                      )}
                    </td>
                  </tr>

                  {expandedRows.has(log.id) && (
                    <tr>
                      <td colSpan={8}>
                        <AuditLogDetails logId={log.id} />
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </Table>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-6">
            <Button
              variant="outline"
              disabled={filters.page === 1}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page - 1 }))}
            >
              Previous
            </Button>

            <div className="flex items-center gap-2">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const pageNum = filters.page - 2 + i;
                if (pageNum < 1 || pageNum > totalPages) return null;
                return (
                  <Button
                    key={pageNum}
                    variant={pageNum === filters.page ? 'primary' : 'outline'}
                    onClick={() => setFilters(prev => ({ ...prev, page: pageNum }))}
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="outline"
              disabled={filters.page === totalPages}
              onClick={() => setFilters(prev => ({ ...prev, page: prev.page + 1 }))}
            >
              Next
            </Button>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

// Audit Log Details Component
const AuditLogDetails: FC<{ logId: string }> = ({ logId }) => {
  const { data: details, isLoading } = useQuery({
    queryKey: ['audit-log-details', logId],
    queryFn: () => fetch(`/api/audit-logs/${logId}`).then(res => res.json())
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="bg-gray-50 p-4 rounded">
      <h4 className="font-semibold mb-3">Changed Fields</h4>

      {details?.changedFields && Object.keys(details.changedFields).length > 0 ? (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b">
              <th className="text-left py-2 w-1/3">Field</th>
              <th className="text-left py-2 w-1/3">Old Value</th>
              <th className="text-left py-2 w-1/3">New Value</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(details.changedFields).map(([field, values]: [string, any]) => (
              <tr key={field} className="border-b">
                <td className="py-2 font-medium">{field}</td>
                <td className="py-2 text-red-600">
                  {values.old !== null && values.old !== undefined
                    ? String(values.old)
                    : '-'}
                </td>
                <td className="py-2 text-green-600">
                  {values.new !== null && values.new !== undefined
                    ? String(values.new)
                    : '-'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <p className="text-gray-500">No field changes recorded</p>
      )}

      {details?.metadata && (
        <div className="mt-4">
          <h5 className="font-semibold mb-2">Metadata</h5>
          <pre className="bg-gray-100 p-3 rounded text-xs overflow-x-auto">
            {JSON.stringify(details.metadata, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
