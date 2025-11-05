# Story 1.5: Authorization Middleware and Role-Based Access Control

**Epic:** Epic 1 - Foundation, Authentication & Audit Infrastructure
**Story ID:** STORY-1.5
**Priority:** Critical
**Estimated Effort:** 4-5 hours
**Dependencies:** Story 1.3 (Authentication), Story 1.4 (Audit Logging)
**Status:** Ready for Development

---

## User Story

**As a** system administrator,
**I want** API endpoints protected by role-based permissions,
**So that** users can only access features appropriate for their role.

---

## Acceptance Criteria

### Authorization Middleware
- [ ] 1. Auth middleware extracts and validates JWT from Authorization header
- [ ] 2. Middleware attaches user context (userId, roleId, tenantId) to request object
- [ ] 3. Middleware returns 401 if token missing, invalid, or expired
- [ ] 4. Role-based permission middleware checks user role against required roles
- [ ] 5. Returns 403 Forbidden if user lacks required permissions

### Permission System
- [ ] 6. Permission decorators/helpers created for route protection
- [ ] 7. All API routes (except /auth/login) require valid JWT
- [ ] 8. Role hierarchy defined: Admin > Accountant > Sales Officer > Warehouse Manager > Recovery Agent
- [ ] 9. Admin role has access to all features
- [ ] 10. Specific permissions mapped to roles in documentation

### Frontend Integration
- [ ] 11. Frontend redirects to login if API returns 401
- [ ] 12. Frontend displays "Access Denied" message if API returns 403

### Audit Logging
- [ ] 13. **Permission checks logged in audit trail**

---

## Technical Implementation

### 1. Role Middleware

**File:** `apps/api/src/middleware/role.middleware.ts`

```typescript
import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/audit.service';

type RoleName =
  | 'ADMIN'
  | 'WAREHOUSE_MANAGER'
  | 'SALES_OFFICER'
  | 'ACCOUNTANT'
  | 'RECOVERY_AGENT';

/**
 * Role hierarchy (higher number = more permissions)
 */
const ROLE_HIERARCHY: Record<RoleName, number> = {
  ADMIN: 5,
  ACCOUNTANT: 4,
  SALES_OFFICER: 3,
  WAREHOUSE_MANAGER: 2,
  RECOVERY_AGENT: 1,
};

/**
 * Middleware to check if user has required role(s)
 */
export function requireRole(allowedRoles: RoleName[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized - No user context',
        });
      }

      const { roleId, userId } = req.user;

      // Fetch user's role from database
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden - Invalid role',
        });
      }

      const userRoleName = user.role.name as RoleName;

      // Check if user's role is in allowed roles
      const hasPermission = allowedRoles.includes(userRoleName);

      if (!hasPermission) {
        // Log failed authorization attempt
        await AuditService.log({
          userId,
          action: 'VIEW',
          entityType: 'Permission',
          entityId: req.path,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          notes: `Access denied to ${req.method} ${req.path} - Required roles: ${allowedRoles.join(', ')}`,
        });

        return res.status(403).json({
          success: false,
          message: 'Forbidden - Insufficient permissions',
        });
      }

      // Attach role name to request for further use
      req.user.roleName = userRoleName;

      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Check if user has minimum role level
 * Example: requireMinRole('SALES_OFFICER') allows SALES_OFFICER, ACCOUNTANT, and ADMIN
 */
export function requireMinRole(minRole: RoleName) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
      }

      const { userId } = req.user;

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true },
      });

      if (!user || !user.role) {
        return res.status(403).json({
          success: false,
          message: 'Forbidden',
        });
      }

      const userRoleName = user.role.name as RoleName;
      const userRoleLevel = ROLE_HIERARCHY[userRoleName] || 0;
      const minRoleLevel = ROLE_HIERARCHY[minRole] || 0;

      if (userRoleLevel < minRoleLevel) {
        await AuditService.log({
          userId,
          action: 'VIEW',
          entityType: 'Permission',
          entityId: req.path,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          notes: `Access denied to ${req.method} ${req.path} - Required min role: ${minRole}`,
        });

        return res.status(403).json({
          success: false,
          message: 'Forbidden - Insufficient permissions',
        });
      }

      req.user.roleName = userRoleName;
      next();
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Admin-only middleware (shorthand)
 */
export const requireAdmin = requireRole(['ADMIN']);
```

---

### 2. Update Auth Middleware Types

**File:** `apps/api/src/types/auth.types.ts`

```typescript
import { Request } from 'express';

export interface JWTPayload {
  userId: string;
  email: string;
  roleId: string;
  tenantId: string | null;
  roleName?: string; // Added by role middleware
}

export interface AuthRequest extends Request {
  user?: JWTPayload;
}

// Extend Express Request type globally
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}
```

---

### 3. Permission Definitions

**File:** `apps/api/src/config/permissions.ts`

```typescript
/**
 * Permission matrix defining what each role can do
 */
export const PERMISSIONS = {
  // User Management
  users: {
    create: ['ADMIN'],
    read: ['ADMIN'],
    update: ['ADMIN'],
    delete: ['ADMIN'],
  },

  // Inventory Management
  products: {
    create: ['ADMIN', 'WAREHOUSE_MANAGER'],
    read: ['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER'],
    update: ['ADMIN', 'WAREHOUSE_MANAGER'],
    delete: ['ADMIN'],
  },

  inventory: {
    create: ['ADMIN', 'WAREHOUSE_MANAGER'],
    read: ['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER'],
    update: ['ADMIN', 'WAREHOUSE_MANAGER'],
    delete: ['ADMIN'],
  },

  // Sales & Invoicing
  invoices: {
    create: ['ADMIN', 'SALES_OFFICER'],
    read: ['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT', 'RECOVERY_AGENT'],
    update: ['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT'],
    delete: ['ADMIN'],
  },

  clients: {
    create: ['ADMIN', 'SALES_OFFICER'],
    read: ['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT', 'RECOVERY_AGENT'],
    update: ['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT'],
    delete: ['ADMIN'],
  },

  // Financial Management
  payments: {
    create: ['ADMIN', 'ACCOUNTANT', 'RECOVERY_AGENT'],
    read: ['ADMIN', 'ACCOUNTANT', 'RECOVERY_AGENT'],
    update: ['ADMIN', 'ACCOUNTANT'],
    delete: ['ADMIN'],
  },

  expenses: {
    create: ['ADMIN', 'ACCOUNTANT'],
    read: ['ADMIN', 'ACCOUNTANT'],
    update: ['ADMIN', 'ACCOUNTANT'],
    delete: ['ADMIN'],
  },

  // Reports & Analytics
  reports: {
    read: ['ADMIN', 'ACCOUNTANT'],
  },

  // Audit Logs
  auditLogs: {
    read: ['ADMIN'],
  },
} as const;

export type PermissionResource = keyof typeof PERMISSIONS;
export type PermissionAction = 'create' | 'read' | 'update' | 'delete';
```

---

### 4. Example Route Protection

**File:** `apps/api/src/routes/user.routes.ts`

```typescript
import { Router } from 'express';
import { UserController } from '../controllers/user.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole, requireAdmin } from '../middleware/role.middleware';

const router = Router();
const userController = new UserController();

// All routes require authentication
router.use(authMiddleware);

// Admin-only routes
router.get('/', requireAdmin, userController.getAll);
router.post('/', requireAdmin, userController.create);
router.put('/:id', requireAdmin, userController.update);
router.delete('/:id', requireAdmin, userController.delete);

// Any authenticated user can get their own profile
router.get('/me', userController.getMe);

export default router;
```

**File:** `apps/api/src/routes/product.routes.ts`

```typescript
import { Router } from 'express';
import { ProductController } from '../controllers/product.controller';
import { authMiddleware } from '../middleware/auth.middleware';
import { requireRole } from '../middleware/role.middleware';

const router = Router();
const productController = new ProductController();

router.use(authMiddleware);

// Read access: Admin, Warehouse Manager, Sales Officer
router.get(
  '/',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER']),
  productController.getAll
);

router.get(
  '/:id',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER', 'SALES_OFFICER']),
  productController.getById
);

// Write access: Admin, Warehouse Manager only
router.post(
  '/',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
  productController.create
);

router.put(
  '/:id',
  requireRole(['ADMIN', 'WAREHOUSE_MANAGER']),
  productController.update
);

// Delete: Admin only
router.delete(
  '/:id',
  requireRole(['ADMIN']),
  productController.delete
);

export default router;
```

---

### 5. Permission Check Utility

**File:** `apps/api/src/utils/permission.utils.ts`

```typescript
import { PERMISSIONS, PermissionResource, PermissionAction } from '../config/permissions';

type RoleName =
  | 'ADMIN'
  | 'WAREHOUSE_MANAGER'
  | 'SALES_OFFICER'
  | 'ACCOUNTANT'
  | 'RECOVERY_AGENT';

/**
 * Check if a role has permission to perform an action on a resource
 */
export function hasPermission(
  roleName: RoleName,
  resource: PermissionResource,
  action: PermissionAction
): boolean {
  const resourcePermissions = PERMISSIONS[resource];

  if (!resourcePermissions) {
    return false;
  }

  const allowedRoles = resourcePermissions[action];

  if (!allowedRoles) {
    return false;
  }

  return allowedRoles.includes(roleName);
}

/**
 * Get all permissions for a role
 */
export function getRolePermissions(roleName: RoleName) {
  const permissions: Record<string, string[]> = {};

  for (const [resource, actions] of Object.entries(PERMISSIONS)) {
    permissions[resource] = [];

    for (const [action, allowedRoles] of Object.entries(actions)) {
      if (allowedRoles.includes(roleName)) {
        permissions[resource].push(action);
      }
    }

    // Remove empty resources
    if (permissions[resource].length === 0) {
      delete permissions[resource];
    }
  }

  return permissions;
}
```

---

### 6. Frontend API Error Handling

**File:** `apps/web/src/lib/api-client.ts`

Update the response interceptor:

```typescript
// Response interceptor - handle 401 and 403
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear auth and redirect to login
      useAuthStore.getState().clearAuth();
      window.location.href = '/login';
      toast.error('Session expired. Please login again.');
    }

    if (error.response?.status === 403) {
      toast.error('Access denied. You don\'t have permission to perform this action.');
    }

    return Promise.reject(error);
  }
);
```

---

### 7. Frontend Permission Check Hook

**File:** `apps/web/src/hooks/usePermission.ts`

```typescript
import { useAuthStore } from '../stores/auth.store';

type RoleName =
  | 'ADMIN'
  | 'WAREHOUSE_MANAGER'
  | 'SALES_OFFICER'
  | 'ACCOUNTANT'
  | 'RECOVERY_AGENT';

export function usePermission() {
  const user = useAuthStore((state) => state.user);

  const hasRole = (allowedRoles: RoleName[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role.name as RoleName);
  };

  const isAdmin = (): boolean => {
    return user?.role.name === 'ADMIN';
  };

  return {
    hasRole,
    isAdmin,
    roleName: user?.role.name as RoleName | undefined,
  };
}
```

**Usage Example:**

```typescript
import { usePermission } from '../hooks/usePermission';

export default function UserManagement() {
  const { hasRole, isAdmin } = usePermission();

  if (!isAdmin()) {
    return <div>Access Denied</div>;
  }

  return (
    <div>
      <h1>User Management</h1>
      {/* Component content */}
    </div>
  );
}
```

---

### 8. Frontend Protected Component

**File:** `apps/web/src/components/ProtectedComponent.tsx`

```typescript
import { ReactNode } from 'react';
import { usePermission } from '../hooks/usePermission';

type RoleName =
  | 'ADMIN'
  | 'WAREHOUSE_MANAGER'
  | 'SALES_OFFICER'
  | 'ACCOUNTANT'
  | 'RECOVERY_AGENT';

interface ProtectedComponentProps {
  allowedRoles: RoleName[];
  children: ReactNode;
  fallback?: ReactNode;
}

export default function ProtectedComponent({
  allowedRoles,
  children,
  fallback = null,
}: ProtectedComponentProps) {
  const { hasRole } = usePermission();

  if (!hasRole(allowedRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

**Usage:**

```typescript
<ProtectedComponent allowedRoles={['ADMIN']}>
  <button>Delete User</button>
</ProtectedComponent>

<ProtectedComponent
  allowedRoles={['ADMIN', 'ACCOUNTANT']}
  fallback={<p>You don't have access to financial reports</p>}
>
  <FinancialReports />
</ProtectedComponent>
```

---

## Role Permission Matrix

| Resource | Admin | Warehouse Mgr | Sales Officer | Accountant | Recovery Agent |
|----------|-------|---------------|---------------|------------|----------------|
| Users | CRUD | - | - | - | - |
| Products | CRUD | CRUD | R | - | - |
| Inventory | CRUD | CRUD | R | - | - |
| Suppliers | CRUD | CRU | - | - | - |
| Clients | CRUD | - | CRUD | RU | R |
| Invoices | CRUD | - | CRU | RU | R |
| Payments | CRUD | - | - | CRUD | CR |
| Expenses | CRUD | - | - | CRUD | - |
| Reports | R | - | - | R | - |
| Audit Logs | R | - | - | - | - |

**Legend:** C = Create, R = Read, U = Update, D = Delete

---

## Testing Checklist

### Backend Testing
- [ ] requireRole(['ADMIN']) blocks non-admin users
- [ ] requireRole(['ADMIN']) allows admin users
- [ ] requireMinRole('SALES_OFFICER') allows sales, accountant, and admin
- [ ] Missing JWT returns 401
- [ ] Invalid role returns 403
- [ ] Failed authorization logged to audit trail
- [ ] Admin can access all endpoints
- [ ] Each role can only access their permitted endpoints

### Frontend Testing
- [ ] usePermission hook returns correct role
- [ ] hasRole() correctly identifies user role
- [ ] isAdmin() correctly identifies admin
- [ ] ProtectedComponent hides content for unauthorized users
- [ ] 401 response redirects to login
- [ ] 403 response shows access denied message
- [ ] Navigation menu shows only accessible routes

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Role middleware implemented and working
- [ ] Permission matrix documented
- [ ] All routes protected appropriately
- [ ] Admin has access to all features
- [ ] Non-admin users have restricted access
- [ ] Frontend permission checks implemented
- [ ] Failed authorization attempts logged
- [ ] Error messages clear and user-friendly
- [ ] Tests pass with >80% coverage
- [ ] Documentation updated
- [ ] Code reviewed and approved

---

## Security Considerations

- All routes (except /auth/login) require authentication
- Role checks happen on server-side (never trust frontend)
- Failed authorization attempts are logged for security monitoring
- Token validation happens before role check
- Admin role has full access (use carefully)
- Frontend checks are for UX only (not security)

---

**Related Documents:**
- [Backend Architecture](../architecture/backend-architecture.md)
- [API Endpoints](../architecture/api-endpoints.md)
- [Audit Logging Architecture](../architecture/audit-logging.md)
