# Audit Logging Architecture

**Purpose:** This document defines the audit logging architecture that tracks all user actions and system changes from Day 1 of MVP deployment.

**Status:** MVP - Implemented in Week 1, Days 3-4

---

## Overview

The audit logging system automatically captures all user actions (CREATE, UPDATE, DELETE) across the entire application. The infrastructure is built into the foundation (Epic 1) and operates transparently, requiring no manual intervention from developers implementing features.

### Key Principles

1. **Automatic and Transparent** - All CRUD operations logged via middleware, no manual logging code in business logic
2. **Non-Blocking** - Audit writes are asynchronous and never slow down user operations
3. **Immutable** - Audit logs are append-only; cannot be modified or deleted
4. **Comprehensive** - Captures user, action, entity, timestamp, IP, changed fields with old/new values
5. **Separate Storage** - Audit logs stored in dedicated table with optimized indexes

---

## Database Schema

### AuditLog Table

```prisma
model AuditLog {
  id            String   @id @default(cuid())
  userId        String
  action        String   // CREATE, UPDATE, DELETE, VIEW (for sensitive data)
  entityType    String   // Product, Invoice, Payment, Client, etc.
  entityId      String
  timestamp     DateTime @default(now())
  ipAddress     String?
  userAgent     String?
  changedFields Json?    // { field: { old: value, new: value } }
  notes         String?  // Optional user-provided reason

  user          User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([timestamp])
  @@index([entityType, entityId])
  @@index([action])
}
```

### Indexes Strategy

- **userId index**: Fast lookup of all actions by a specific user
- **timestamp index**: Chronological queries and time-range filtering
- **entityType + entityId composite index**: Quick retrieval of all changes to a specific record
- **action index**: Filter by action type (CREATE, UPDATE, DELETE)

### Storage Estimates

- **Average audit log entry**: ~500 bytes (including JSON)
- **Expected volume (MVP)**: ~10,000 entries/month (20 users × 50 actions/day × 30 days)
- **Storage growth**: ~5 MB/month
- **2-year retention**: ~120 MB (manageable with indexes)

---

## Audit Middleware Architecture

### Middleware Flow

```typescript
// Request flow with audit middleware
┌─────────────┐
│   Client    │
└──────┬──────┘
       │ HTTP Request (POST/PUT/PATCH/DELETE)
       ▼
┌─────────────┐
│   Express   │
│   Router    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Auth     │  ◄── Extract user from JWT
│ Middleware  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Audit     │  ◄── Intercept response
│ Middleware  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│  Business   │  ◄── Execute business logic
│   Logic     │      (save to database)
└──────┬──────┘
       │
       ▼ Response with data
┌─────────────┐
│   Audit     │  ◄── AFTER success, log asynchronously
│   Logger    │      (non-blocking)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   Client    │  ◄── Response sent immediately
└─────────────┘
       │
       ▼ (async)
┌─────────────┐
│  AuditLog   │  ◄── Write to audit table
│   Table     │      (background task)
└─────────────┘
```

### Implementation Example

```typescript
// middleware/audit.middleware.ts

import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma';

interface AuditPayload {
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  ipAddress: string;
  userAgent: string;
  changedFields?: any;
}

export function auditMiddleware(req: Request, res: Response, next: NextFunction) {
  // Only audit state-changing operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Store original json method
  const originalJson = res.json.bind(res);

  // Override json method to intercept response
  res.json = function (data: any) {
    // Only log if request succeeded
    if (res.statusCode >= 200 && res.statusCode < 400) {
      // Extract audit information
      const auditPayload: AuditPayload = {
        userId: req.user.id,
        action: mapMethodToAction(req.method),
        entityType: extractEntityType(req.path),
        entityId: data?.id || req.params.id,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent') || 'unknown',
        changedFields: extractChangedFields(req.body, data)
      };

      // Log asynchronously (non-blocking)
      logAudit(auditPayload).catch(err => {
        console.error('Audit logging failed (non-critical):', err);
        // Don't throw - audit failure should not break user operation
      });
    }

    // Send response immediately (don't wait for audit write)
    return originalJson(data);
  };

  next();
}

function mapMethodToAction(method: string): string {
  switch (method) {
    case 'POST': return 'CREATE';
    case 'PUT':
    case 'PATCH': return 'UPDATE';
    case 'DELETE': return 'DELETE';
    default: return 'UNKNOWN';
  }
}

function extractEntityType(path: string): string {
  // Extract entity from path: /api/v1/products/:id -> Product
  const match = path.match(/\/api\/v1\/([^\/]+)/);
  if (match) {
    const entity = match[1];
    // Convert plural to singular, capitalize
    return entity.charAt(0).toUpperCase() +
           entity.slice(1, -1); // Remove trailing 's'
  }
  return 'Unknown';
}

function extractChangedFields(requestBody: any, responseData: any): any {
  // For UPDATE operations, compare request body with response data
  if (!requestBody || !responseData) return null;

  const changes: any = {};
  Object.keys(requestBody).forEach(key => {
    if (requestBody[key] !== responseData[key]) {
      changes[key] = {
        old: responseData[key],
        new: requestBody[key]
      };
    }
  });

  // Exclude sensitive fields
  delete changes.password;
  delete changes.passwordHash;
  delete changes.token;

  return Object.keys(changes).length > 0 ? changes : null;
}

async function logAudit(payload: AuditPayload): Promise<void> {
  await prisma.auditLog.create({
    data: {
      userId: payload.userId,
      action: payload.action,
      entityType: payload.entityType,
      entityId: payload.entityId,
      timestamp: new Date(),
      ipAddress: payload.ipAddress,
      userAgent: payload.userAgent,
      changedFields: payload.changedFields
    }
  });
}
```

### Middleware Registration

```typescript
// server.ts

import express from 'express';
import { auditMiddleware } from './middleware/audit.middleware';
import { authMiddleware } from './middleware/auth.middleware';

const app = express();

// Global middleware order matters
app.use(express.json());
app.use(authMiddleware);      // Must come before audit (extracts user)
app.use(auditMiddleware);      // Audit all authenticated requests

// Routes
app.use('/api/v1/products', productRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
// ... other routes

app.listen(3001);
```

---

## What Gets Logged

### Automatic Logging (via Middleware)

All of these operations are automatically logged:

**Epic 1 - Foundation:**
- ✅ User login/logout
- ✅ User creation/update/deletion
- ✅ Role changes

**Epic 2 - Import & Inventory:**
- ✅ Supplier creation/update/deletion
- ✅ Purchase order creation/update/status changes
- ✅ Product creation/update/deletion
- ✅ Warehouse creation/update
- ✅ Stock receiving (inventory updates)
- ✅ Stock adjustments (wastage, corrections)
- ✅ Supplier payments

**Epic 3 - Sales & Payments:**
- ✅ Client creation/update/deletion
- ✅ Invoice creation/update/voiding
- ✅ Credit limit changes
- ✅ Client payment recording
- ✅ Expense creation/update/deletion

**Epic 4 - Dashboards & Reports:**
- ✅ Report generation (optional: can log VIEW actions for sensitive reports)

**Phase 2 Epics:**
- ✅ All Epic 5-8 operations automatically logged

### Manual Logging (Special Cases)

Some actions require explicit audit calls:

```typescript
// Manual audit for login (no entity ID yet)
await prisma.auditLog.create({
  data: {
    userId: user.id,
    action: 'LOGIN',
    entityType: 'User',
    entityId: user.id,
    timestamp: new Date(),
    ipAddress: req.ip
  }
});

// Manual audit for sensitive data views (optional)
await prisma.auditLog.create({
  data: {
    userId: req.user.id,
    action: 'VIEW',
    entityType: 'FinancialReport',
    entityId: 'balance-sheet-2025-01',
    timestamp: new Date(),
    notes: 'Accessed sensitive financial report'
  }
});
```

---

## Performance Considerations

### Asynchronous Writes

Audit writes **MUST NOT block** user operations:

```typescript
// ❌ BAD: Synchronous (blocks response)
await logAudit(payload);
return res.json(data);

// ✅ GOOD: Asynchronous (non-blocking)
logAudit(payload).catch(err => console.error('Audit failed:', err));
return res.json(data);
```

### Performance Targets

- **Overhead per request**: < 50ms
- **Audit write time**: < 100ms (async, doesn't impact user)
- **Query performance**: < 500ms for 10,000 audit logs with filters

### Optimization Strategies

1. **Batch writes** (optional for high-volume): Queue audit logs and write in batches every 5 seconds
2. **Separate database** (future): Move audit logs to dedicated MySQL instance
3. **Archive old logs**: Move logs > 2 years to cold storage (S3, glacier)
4. **Partitioning** (future): Partition audit_log table by timestamp for faster queries

---

## Retention and Archival

### Retention Policy

- **Active retention**: 2 years in primary database
- **Archive**: Move logs > 2 years to cold storage
- **Permanent deletion**: After 7 years (or per legal requirements)

### Automated Cleanup Job

```typescript
// jobs/audit-cleanup.job.ts

import { prisma } from '../lib/prisma';
import { subYears } from 'date-fns';

export async function cleanupOldAuditLogs() {
  const twoYearsAgo = subYears(new Date(), 2);

  // Archive to file/S3 before deleting (optional)
  const oldLogs = await prisma.auditLog.findMany({
    where: { timestamp: { lt: twoYearsAgo } }
  });

  // Export to JSON or CSV
  await exportToArchive(oldLogs);

  // Delete from database
  const result = await prisma.auditLog.deleteMany({
    where: { timestamp: { lt: twoYearsAgo } }
  });

  console.log(`Archived and deleted ${result.count} audit logs older than 2 years`);
}

// Run daily at 2 AM
// cron: '0 2 * * *'
```

---

## Security Considerations

### Access Control

- **Audit log viewing**: Admin role only (full access)
- **Other roles**: Can view audit logs for entities they created/own
- **No modifications**: Audit logs are immutable (no UPDATE or DELETE operations allowed)

### Sensitive Data Exclusion

Never log these fields:
- `password`
- `passwordHash`
- `token`
- `secretKey`
- `apiKey`
- Credit card numbers (if ever added)

### IP Address Logging

- IPv4 and IPv6 addresses logged for traceability
- GDPR consideration: IP addresses are personal data (inform users in privacy policy)

---

## Audit Log Viewer (Phase 2 - Epic 8)

In MVP, audit logs are **written automatically** but **not visible to users**. Phase 2 adds the UI:

### Epic 8 Features:
- Search and filter audit logs (user, entity, action, date range)
- View detailed audit entries with changed fields
- Export audit logs to Excel
- Audit analytics (user activity patterns, peak usage times)
- Change history viewer with side-by-side comparison

See [Epic 8: Audit Trail Viewer & Advanced Features](../prd/epic-8-audit-advanced.md)

---

## Testing Audit Logging

### Unit Tests

```typescript
// tests/middleware/audit.test.ts

describe('Audit Middleware', () => {
  it('should log CREATE action for POST request', async () => {
    const req = mockRequest({ method: 'POST', user: { id: 'user1' } });
    const res = mockResponse();

    auditMiddleware(req, res, () => {});
    res.json({ id: 'product1', name: 'Test Product' });

    // Wait for async audit write
    await new Promise(resolve => setTimeout(resolve, 100));

    const auditLog = await prisma.auditLog.findFirst({
      where: { entityId: 'product1' }
    });

    expect(auditLog).toBeDefined();
    expect(auditLog.action).toBe('CREATE');
    expect(auditLog.userId).toBe('user1');
  });

  it('should not block response when audit write fails', async () => {
    // Mock audit write failure
    jest.spyOn(prisma.auditLog, 'create').mockRejectedValue(new Error('DB error'));

    const req = mockRequest({ method: 'POST' });
    const res = mockResponse();

    auditMiddleware(req, res, () => {});
    res.json({ id: 'product1' });

    // Response should still succeed
    expect(res.status).not.toHaveBeenCalledWith(500);
  });
});
```

### Integration Tests

```typescript
// tests/integration/audit.test.ts

describe('Audit Logging Integration', () => {
  it('should log all product CRUD operations', async () => {
    // Create product
    const createRes = await request(app)
      .post('/api/v1/products')
      .send({ sku: 'TEST-001', name: 'Test Product' });

    // Update product
    await request(app)
      .put(`/api/v1/products/${createRes.body.id}`)
      .send({ name: 'Updated Product' });

    // Delete product
    await request(app)
      .delete(`/api/v1/products/${createRes.body.id}`);

    // Verify all 3 actions logged
    const logs = await prisma.auditLog.findMany({
      where: { entityId: createRes.body.id },
      orderBy: { timestamp: 'asc' }
    });

    expect(logs).toHaveLength(3);
    expect(logs[0].action).toBe('CREATE');
    expect(logs[1].action).toBe('UPDATE');
    expect(logs[2].action).toBe('DELETE');
  });
});
```

---

## Troubleshooting

### Audit Logs Not Being Created

1. **Check middleware registration**: Ensure `auditMiddleware` is registered after `authMiddleware`
2. **Verify database connection**: Audit writes fail silently if DB is down
3. **Check error logs**: Look for "Audit logging failed" messages in console
4. **Verify user context**: Middleware requires `req.user` from auth middleware

### Performance Issues

1. **Check async execution**: Ensure audit writes are not blocking (should use `.catch()` not `await`)
2. **Review indexes**: Ensure indexes exist on userId, timestamp, entityType+entityId
3. **Monitor query performance**: Use `EXPLAIN ANALYZE` on slow audit log queries
4. **Consider archival**: If audit_log table > 1M rows, archive old logs

---

## Related Documentation

- [Epic 1: Foundation, Authentication & Audit Infrastructure](../prd/epic-1-foundation-auth-audit.md)
- [Epic 8: Audit Trail Viewer & Advanced Features](../prd/epic-8-audit-advanced.md)
- [Database Schema](./database-schema.md)
- [API Endpoints](./api-endpoints.md)

---

**Last Updated:** 2025-01-15 (Initial documentation)
**Status:** Implemented in MVP Week 1
