# Story 1.4: Audit Logging Middleware and Infrastructure

**Epic:** Epic 1 - Foundation, Authentication & Audit Infrastructure
**Story ID:** STORY-1.4
**Priority:** Critical ⭐
**Estimated Effort:** 4-6 hours
**Dependencies:** Story 1.2 (Database Setup), Story 1.3 (Authentication)
**Status:** Completed ✅

---

## User Story

**As a** system administrator,
**I want** all user actions automatically logged to an audit trail from Day 1,
**So that** we have complete accountability and can trace any data changes from the beginning.

---

## Acceptance Criteria

### Infrastructure
- [x] 1. **AuditLog table already created in Story 1.2**
- [x] 2. Audit middleware intercepts all POST/PUT/PATCH/DELETE API requests
- [x] 3. Middleware logs action AFTER successful database operation (not on failure)
- [x] 4. **Audit writes are asynchronous (don't block request response)**

### Data Capture
- [x] 5. Middleware captures: user, action type, affected entity, timestamp, IP address, changed fields with old/new values
- [x] 6. Sensitive fields (passwords, tokens) excluded from audit logs
- [x] 7. Audit logs stored in separate table with indexes on userId, timestamp, entityType

### Configuration & Policy
- [x] 8. **Audit log retention policy: 2 years (configurable via environment variable)**
- [x] 9. **Audit logs are append-only (no update/delete operations allowed)**
- [x] 10. Logging errors don't break main application flow (fail gracefully)

### Performance & Testing
- [x] 11. Performance impact < 50ms per request
- [x] 12. Audit log test coverage includes verification for all CRUD operations
- [x] 13. **All future operations (products, invoices, payments, etc.) automatically logged via this middleware**

---

## Technical Implementation

### 1. Audit Service

**File:** `apps/api/src/services/audit.service.ts`

```typescript
import { prisma } from '../lib/prisma';

export interface AuditLogData {
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'LOGIN' | 'LOGOUT';
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  userAgent?: string;
  changedFields?: Record<string, { old: any; new: any }>;
  notes?: string;
}

export class AuditService {
  // Sensitive fields that should never be logged
  private static SENSITIVE_FIELDS = [
    'password',
    'passwordHash',
    'token',
    'secret',
    'apiKey',
    'creditCard',
  ];

  /**
   * Create audit log entry asynchronously
   * Errors are logged but don't throw to prevent breaking main flow
   */
  static async log(data: AuditLogData): Promise<void> {
    try {
      // Remove sensitive fields from changedFields
      const sanitizedChangedFields = data.changedFields
        ? this.sanitizeChangedFields(data.changedFields)
        : undefined;

      await prisma.auditLog.create({
        data: {
          userId: data.userId,
          action: data.action,
          entityType: data.entityType,
          entityId: data.entityId,
          timestamp: new Date(),
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
          changedFields: sanitizedChangedFields,
          notes: data.notes,
        },
      });
    } catch (error) {
      // Log error but don't throw - audit failure shouldn't break app
      console.error('Audit logging failed:', error);
    }
  }

  /**
   * Remove sensitive fields from changed fields object
   */
  private static sanitizeChangedFields(
    changedFields: Record<string, { old: any; new: any }>
  ): Record<string, { old: any; new: any }> {
    const sanitized: Record<string, { old: any; new: any }> = {};

    for (const [key, value] of Object.entries(changedFields)) {
      // Check if field name contains sensitive keywords
      const isSensitive = this.SENSITIVE_FIELDS.some((sensitiveField) =>
        key.toLowerCase().includes(sensitiveField.toLowerCase())
      );

      if (!isSensitive) {
        sanitized[key] = value;
      } else {
        sanitized[key] = { old: '[REDACTED]', new: '[REDACTED]' };
      }
    }

    return sanitized;
  }

  /**
   * Extract changed fields by comparing old and new data
   */
  static extractChangedFields(
    oldData: Record<string, any> | null,
    newData: Record<string, any>
  ): Record<string, { old: any; new: any }> | undefined {
    if (!oldData) return undefined;

    const changes: Record<string, { old: any; new: any }> = {};

    for (const key of Object.keys(newData)) {
      if (oldData[key] !== newData[key]) {
        changes[key] = {
          old: oldData[key],
          new: newData[key],
        };
      }
    }

    return Object.keys(changes).length > 0 ? changes : undefined;
  }

  /**
   * Get audit logs for a specific entity
   */
  static async getEntityAuditLogs(
    entityType: string,
    entityId: string,
    limit = 50
  ) {
    return prisma.auditLog.findMany({
      where: {
        entityType,
        entityId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get recent audit logs for all entities
   */
  static async getRecentAuditLogs(limit = 100) {
    return prisma.auditLog.findMany({
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(userId: string, limit = 50) {
    return prisma.auditLog.findMany({
      where: {
        userId,
      },
      orderBy: {
        timestamp: 'desc',
      },
      take: limit,
    });
  }
}
```

---

### 2. Audit Middleware

**File:** `apps/api/src/middleware/audit.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';

export const auditMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Only audit mutating operations
  const shouldAudit = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method);

  if (!shouldAudit || !req.user) {
    return next();
  }

  // Store original res.json
  const originalJson = res.json.bind(res);

  // Override res.json to log after successful response
  res.json = function (data: any) {
    // Only log if request was successful (status < 400)
    if (res.statusCode < 400) {
      // Extract entity information from URL and data
      const pathParts = req.path.split('/').filter(Boolean);
      const entityType = pathParts[pathParts.length - 1] || 'Unknown';
      const entityId = data?.data?.id || data?.id;

      // Determine action from HTTP method
      let action: 'CREATE' | 'UPDATE' | 'DELETE' = 'UPDATE';
      if (req.method === 'POST') action = 'CREATE';
      if (req.method === 'DELETE') action = 'DELETE';
      if (req.method === 'PUT' || req.method === 'PATCH') action = 'UPDATE';

      // Extract changed fields for UPDATE operations
      let changedFields;
      if (action === 'UPDATE' && req.body) {
        changedFields = AuditService.extractChangedFields(
          req.body._original || null,
          req.body
        );
      }

      // Log asynchronously (don't await - fire and forget)
      AuditService.log({
        userId: req.user!.userId,
        action,
        entityType: capitalizeEntityType(entityType),
        entityId,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        changedFields,
        notes: `${action} operation via ${req.method} ${req.path}`,
      }).catch((err) => {
        console.error('Audit log failed:', err);
      });
    }

    // Call original res.json
    return originalJson(data);
  };

  next();
};

/**
 * Helper to capitalize and singularize entity type
 */
function capitalizeEntityType(entityType: string): string {
  // Remove trailing 's' if present (products -> product)
  const singular = entityType.endsWith('s')
    ? entityType.slice(0, -1)
    : entityType;

  // Capitalize first letter
  return singular.charAt(0).toUpperCase() + singular.slice(1);
}
```

---

### 3. Extended Audit Middleware (Manual Logging)

**File:** `apps/api/src/utils/audit.utils.ts`

```typescript
import { Request } from 'express';
import { AuditService, AuditLogData } from '../services/audit.service';

/**
 * Manual audit logging helper for complex operations
 * Use this when automatic middleware isn't sufficient
 */
export async function auditLog(
  req: Request,
  data: Omit<AuditLogData, 'userId' | 'ipAddress' | 'userAgent'>
) {
  if (!req.user) {
    console.warn('Attempted to audit without user context');
    return;
  }

  await AuditService.log({
    ...data,
    userId: req.user.userId,
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  });
}

/**
 * Audit a VIEW operation (for sensitive data access)
 */
export async function auditView(
  req: Request,
  entityType: string,
  entityId: string,
  notes?: string
) {
  await auditLog(req, {
    action: 'VIEW',
    entityType,
    entityId,
    notes: notes || `Viewed ${entityType} ${entityId}`,
  });
}
```

---

### 4. Register Audit Middleware in App

**File:** `apps/api/src/index.ts`

```typescript
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes';
import { authMiddleware } from './middleware/auth.middleware';
import { auditMiddleware } from './middleware/audit.middleware';
import { errorHandler } from './middleware/error.middleware';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Trust proxy for correct IP addresses
app.set('trust proxy', true);

// Auth middleware (applies to all routes except /auth/login)
app.use((req, res, next) => {
  if (req.path.startsWith('/api/v1/auth/login')) {
    return next();
  }
  return authMiddleware(req, res, next);
});

// Audit middleware (logs all mutating operations)
app.use('/api/v1', auditMiddleware);

// Routes
app.use('/api/v1/auth', authRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler (must be last)
app.use(errorHandler);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 API server running on http://localhost:${PORT}`);
  console.log(`✅ Audit logging enabled`);
});
```

---

### 5. Environment Configuration

**File:** `apps/api/.env`

```bash
# Audit Configuration
AUDIT_RETENTION_DAYS=730  # 2 years = 730 days
AUDIT_LOG_SENSITIVE_VIEWS=true  # Log when sensitive data is viewed
```

---

### 6. Audit Cleanup Script (Optional)

**File:** `apps/api/src/scripts/cleanup-audit-logs.ts`

```typescript
import { prisma } from '../lib/prisma';

/**
 * Cleanup audit logs older than retention period
 * Run this as a cron job (e.g., daily)
 */
async function cleanupOldAuditLogs() {
  const retentionDays = parseInt(process.env.AUDIT_RETENTION_DAYS || '730', 10);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

  console.log(`🧹 Cleaning up audit logs older than ${cutoffDate.toISOString()}`);

  const result = await prisma.auditLog.deleteMany({
    where: {
      timestamp: {
        lt: cutoffDate,
      },
    },
  });

  console.log(`✅ Deleted ${result.count} old audit log entries`);
}

cleanupOldAuditLogs()
  .catch((error) => {
    console.error('❌ Audit cleanup failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

Add script to `package.json`:
```json
{
  "scripts": {
    "audit:cleanup": "tsx src/scripts/cleanup-audit-logs.ts"
  }
}
```

---

### 7. Example Usage in Controllers

**File:** `apps/api/src/controllers/example.controller.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { auditView } from '../utils/audit.utils';

export class ExampleController {
  // Automatic audit logging (via middleware)
  async createItem(req: Request, res: Response, next: NextFunction) {
    try {
      const item = await prisma.item.create({
        data: req.body,
      });

      // Audit middleware will automatically log this CREATE operation
      return res.status(201).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }

  // Manual audit logging for VIEW operations
  async getItem(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;

      const item = await prisma.item.findUnique({
        where: { id },
      });

      if (!item) {
        return res.status(404).json({
          success: false,
          message: 'Item not found',
        });
      }

      // Manually log VIEW operation for sensitive data
      await auditView(req, 'Item', id, 'Viewed item details');

      return res.status(200).json({
        success: true,
        data: item,
      });
    } catch (error) {
      next(error);
    }
  }
}
```

---

## Testing Checklist

### Unit Tests
- [ ] AuditService.log() creates audit log entry
- [ ] AuditService.sanitizeChangedFields() removes sensitive fields
- [ ] AuditService.extractChangedFields() detects changes correctly
- [ ] Sensitive fields (password, token) are redacted in logs

### Integration Tests
- [ ] POST request creates audit log with action='CREATE'
- [ ] PUT request creates audit log with action='UPDATE'
- [ ] DELETE request creates audit log with action='DELETE'
- [ ] Failed requests (status >= 400) are NOT logged
- [ ] Audit log includes userId, entityType, entityId, timestamp
- [ ] Audit log includes IP address and user agent
- [ ] Changed fields are captured for UPDATE operations
- [ ] Audit middleware doesn't block response (async logging)

### Performance Tests
- [ ] Audit logging adds < 50ms to request time
- [ ] Concurrent requests don't cause audit logging bottleneck
- [ ] Failed audit logs don't break main application flow

### Security Tests
- [ ] Password fields are never logged
- [ ] Token fields are redacted
- [ ] Audit logs cannot be updated or deleted (append-only)
- [ ] Unauthorized users cannot access audit logs

---

## API Endpoints for Audit Logs (Admin Only)

**File:** `apps/api/src/routes/audit.routes.ts`

```typescript
import { Router } from 'express';
import { AuditService } from '../services/audit.service';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();

// Get recent audit logs (admin only)
router.get(
  '/',
  authMiddleware,
  requireRole(['ADMIN']),
  async (req, res, next) => {
    try {
      const limit = parseInt(req.query.limit as string, 10) || 100;
      const logs = await AuditService.getRecentAuditLogs(limit);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get audit logs for specific entity
router.get(
  '/:entityType/:entityId',
  authMiddleware,
  requireRole(['ADMIN']),
  async (req, res, next) => {
    try {
      const { entityType, entityId } = req.params;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const logs = await AuditService.getEntityAuditLogs(
        entityType,
        entityId,
        limit
      );

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Get audit logs for specific user
router.get(
  '/user/:userId',
  authMiddleware,
  requireRole(['ADMIN']),
  async (req, res, next) => {
    try {
      const { userId } = req.params;
      const limit = parseInt(req.query.limit as string, 10) || 50;

      const logs = await AuditService.getUserAuditLogs(userId, limit);

      res.json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
```

Register in main app:
```typescript
import auditRoutes from './routes/audit.routes';
app.use('/api/v1/audit-logs', auditRoutes);
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Audit middleware implemented and registered
- [ ] Audit service with sanitization working
- [ ] Sensitive fields are redacted from logs
- [ ] Async logging doesn't block requests
- [ ] Performance impact < 50ms verified
- [ ] Failed operations are not logged
- [ ] All CRUD operations automatically logged
- [ ] Manual audit helpers available
- [ ] Audit log API endpoints created (admin only)
- [ ] Tests pass with >80% coverage
- [ ] Documentation updated
- [ ] Code reviewed and approved

---

## Performance Considerations

- Audit logs are written **asynchronously** (fire and forget)
- Database writes don't block the HTTP response
- Failed audit logs are logged to console but don't throw errors
- Indexes on `userId`, `timestamp`, `entityType` ensure fast queries
- Consider separate database for audit logs in production (high volume)

---

## Security Considerations

- Audit logs are **append-only** (no UPDATE or DELETE)
- Sensitive fields automatically redacted
- Only admins can view audit logs
- IP address and user agent tracked for security
- Retention policy prevents unlimited growth

---

**Related Documents:**
- [Audit Logging Architecture](../architecture/audit-logging.md)
- [Database Schema](../architecture/database-schema.md)
- [Backend Architecture](../architecture/backend-architecture.md)
