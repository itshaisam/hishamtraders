# Epic 1: Foundation, Authentication & Audit Infrastructure

**Epic Goal:** Establish the complete technical foundation including project structure, development environment, authentication system, user management, **audit logging infrastructure from Day 1**, and role-based dashboards. This epic delivers a fully functional application skeleton where users can log in, see role-specific dashboards, and **all system activity is automatically tracked from the beginning**.

**Timeline:** MVP Week 1 (Days 1-4)

**Status:** MVP - Required for 6-week delivery

---

## Stories

### Story 1.1: Project Setup and Development Environment

**As a** developer,
**I want** the project repository, monorepo structure, and development tools configured,
**So that** the team can begin feature development with proper tooling and conventions.

**Acceptance Criteria:**
1. Monorepo created with apps/ (web, api) and packages/ (shared) structure
2. Node.js 20 LTS, pnpm configured with workspaces
3. TypeScript configured for both frontend and backend with strict mode
4. ESLint and Prettier configured with shared config
5. Husky and lint-staged set up for pre-commit hooks
6. Git repository initialized with .gitignore and README
7. Environment variable templates (.env.example) created for both apps
8. Development scripts added to package.json (dev, build, test, lint)
9. Vite configured for frontend with React, TypeScript, Tailwind CSS
10. Express.js with TypeScript configured for backend
11. All dependencies installed and project builds successfully
12. VS Code workspace settings recommended

**Story File:** [docs/stories/story-1-1-project-setup.md](../stories/story-1-1-project-setup.md)

---

### Story 1.2: Database Setup with Prisma and MySQL

**As a** developer,
**I want** Prisma ORM integrated with MySQL database and initial schema defined,
**So that** the application can persist data with type-safe database access.

**Acceptance Criteria:**
1. Prisma installed and initialized in monorepo
2. MySQL 8+ database connection configured via environment variables
3. Initial Prisma schema defined with User, AuditLog tables
4. **AuditLog table created from Day 1** for tracking all system activity
5. Database schema includes tenantId field on core tables for multi-tenant readiness (not enforced in MVP)
6. Prisma migration created and applied to development database
7. Prisma Client generated and accessible in backend code
8. Database connection pooling configured appropriately
9. Seed script created for initial roles (Admin, Warehouse Manager, Sales Officer, Accountant, Recovery Agent)
10. Seed script creates default admin user (credentials documented)
11. npm run db:migrate, db:seed, db:reset scripts functional
12. Database indexes created on foreign keys and commonly queried fields
13. Connection tested and verified working

**Story File:** [docs/stories/story-1-2-database-prisma.md](../stories/story-1-2-database-prisma.md)

**Prisma Schema (AuditLog):**
```prisma
model AuditLog {
  id            String   @id @default(cuid())
  userId        String
  action        String   // CREATE, UPDATE, DELETE, VIEW
  entityType    String   // Product, Invoice, Payment, etc.
  entityId      String
  timestamp     DateTime @default(now())
  ipAddress     String?
  userAgent     String?
  changedFields Json?    // { field: { old: value, new: value } }
  notes         String?

  user          User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([timestamp])
  @@index([entityType, entityId])
}
```

---

### Story 1.3: Authentication System with JWT

**As a** user,
**I want** to log in with email and password to access the system securely,
**So that** only authorized personnel can use the application.

**Acceptance Criteria:**
1. User table includes email, passwordHash, roleId, status (active/inactive), lastLoginAt
2. POST /api/v1/auth/login endpoint accepts email and password
3. Password hashed with bcrypt (min 10 rounds) before storage
4. Login validates credentials and returns JWT token with user info and role
5. JWT includes userId, email, roleId, tenantId (null for MVP), expires in 24 hours
6. POST /api/v1/auth/logout endpoint clears session/token
7. GET /api/v1/auth/me endpoint returns current user profile (requires valid JWT)
8. Invalid credentials return 401 Unauthorized with appropriate error message
9. Login frontend page created with email/password form (responsive design)
10. Frontend stores JWT in localStorage and includes in API requests
11. Frontend redirects to dashboard on successful login
12. Frontend displays login errors appropriately
13. **Login/logout events automatically logged to AuditLog**

**Story File:** [docs/stories/story-1-3-authentication-jwt.md](../stories/story-1-3-authentication-jwt.md)

---

### Story 1.4: Audit Logging Middleware and Infrastructure ⭐

**As a** system administrator,
**I want** all user actions automatically logged to an audit trail from Day 1,
**So that** we have complete accountability and can trace any data changes from the beginning.

**Acceptance Criteria:**
1. **AuditLog table already created in Story 1.2**
2. Audit middleware intercepts all POST/PUT/PATCH/DELETE API requests
3. Middleware logs action AFTER successful database operation (not on failure)
4. Middleware captures: user, action type, affected entity, timestamp, IP address, changed fields with old/new values
5. **Audit writes are asynchronous (don't block request response)**
6. Sensitive fields (passwords, tokens) excluded from audit logs
7. Audit logs stored in separate table with indexes on userId, timestamp, entityType
8. **Audit log retention policy: 2 years (configurable via environment variable)**
9. **Audit logs are append-only (no update/delete operations allowed)**
10. Logging errors don't break main application flow (fail gracefully)
11. Performance impact < 50ms per request
12. Audit log test coverage includes verification for all CRUD operations
13. **All future operations (products, invoices, payments, etc.) automatically logged via this middleware**

**Story File:** [docs/stories/story-1-4-audit-logging-middleware.md](../stories/story-1-4-audit-logging-middleware.md)

**Implementation Notes:**
```typescript
// Audit middleware example
export async function auditMiddleware(req, res, next) {
  const originalJson = res.json;

  res.json = function(data) {
    // After successful operation, log asynchronously
    if (res.statusCode < 400) {
      logAudit({
        userId: req.user.id,
        action: req.method,
        entityType: req.baseUrl.split('/').pop(),
        entityId: data.id,
        timestamp: new Date(),
        ipAddress: req.ip,
        changedFields: extractChangedFields(req.body, data)
      }).catch(err => console.error('Audit log failed:', err));
    }
    return originalJson.call(this, data);
  };

  next();
}
```

---

### Story 1.5: Authorization Middleware and Role-Based Access Control

**As a** system administrator,
**I want** API endpoints protected by role-based permissions,
**So that** users can only access features appropriate for their role.

**Acceptance Criteria:**
1. Auth middleware extracts and validates JWT from Authorization header
2. Middleware attaches user context (userId, roleId, tenantId) to request object
3. Middleware returns 401 if token missing, invalid, or expired
4. Role-based permission middleware checks user role against required roles
5. Returns 403 Forbidden if user lacks required permissions
6. Permission decorators/helpers created for route protection
7. All API routes (except /auth/login) require valid JWT
8. Role hierarchy defined: Admin > Accountant > Sales Officer > Warehouse Manager > Recovery Agent
9. Admin role has access to all features
10. Specific permissions mapped to roles in documentation
11. Frontend redirects to login if API returns 401
12. Frontend displays "Access Denied" message if API returns 403
13. **Permission checks logged in audit trail**

**Story File:** [docs/stories/story-1-5-authorization-rbac.md](../stories/story-1-5-authorization-rbac.md)

---

### Story 1.6: User Management Module

**As an** admin,
**I want** to create, edit, and deactivate user accounts with role assignment,
**So that** I can control who has access to the system and what they can do.

**Acceptance Criteria:**
1. GET /api/v1/users returns paginated list of users with role info
2. POST /api/v1/users creates new user with email, name, roleId, password
3. PUT /api/v1/users/:id updates user details (email, name, roleId, status)
4. DELETE /api/v1/users/:id soft-deletes user (sets status=inactive)
5. User table includes: id, email (unique), name, passwordHash, roleId, status, createdAt, lastLoginAt
6. Email validation ensures valid format and uniqueness
7. Default password sent to new user (or requires password reset on first login)
8. Admin cannot delete/deactivate their own account
9. **Role changes logged in audit trail**
10. Frontend User Management page lists users with filters (role, status)
11. Frontend includes Add/Edit User modals with form validation
12. Frontend displays user status (active/inactive) with visual indicator
13. Only Admin role can access user management features

**Story File:** [docs/stories/story-1-6-user-management.md](../stories/story-1-6-user-management.md)

---

### Story 1.7: Role-Specific Dashboards

**As a** user,
**I want** to see a dashboard tailored to my role when I log in,
**So that** I immediately see the information and actions relevant to my job.

**Acceptance Criteria:**
1. Dashboard route renders different content based on user role
2. **Admin Dashboard** displays:
   - Total users count
   - System health indicators (database connection, audit log size)
   - Recent audit activity (last 10 actions)
   - Quick links to all modules
3. **Warehouse Manager Dashboard** displays:
   - Pending stock receipts count
   - Low stock alerts count
   - Out of stock products count
   - Quick actions: Record Stock Receipt
4. **Sales Officer Dashboard** displays:
   - Today's sales summary (count, total value)
   - Clients approaching credit limit
   - Recent invoices (last 5)
   - Quick actions: Create Invoice, Check Client Balance
5. **Accountant Dashboard** displays:
   - Cash flow summary (inflows, outflows, net)
   - Receivables vs Payables
   - Pending payments to suppliers
   - Recent transactions
   - Quick actions: Record Payment, Record Expense
6. **Recovery Agent Dashboard** displays:
   - Total outstanding receivables
   - Overdue clients list
   - Payments collected this week
   - Quick actions: Record Client Payment
7. All dashboards are responsive (mobile, tablet, desktop)
8. Dashboard data refreshes on page load (no auto-refresh in MVP)
9. Dashboard uses TanStack Query for data fetching with loading states
10. Navigation menu adapts to user role (shows only accessible modules)

**Story File:** [docs/stories/story-1-7-role-dashboards.md](../stories/story-1-7-role-dashboards.md)

---

### Story 1.8: Shared UI Component Library

**As a** developer,
**I want** reusable UI components built with Tailwind CSS and Lucide icons,
**So that** the interface is consistent and development is faster.

**Acceptance Criteria:**
1. Component library created in packages/ui (or apps/web/components/ui)
2. Components implemented: Button, Input, Select, Checkbox, Modal, Table, Card, Badge, Alert, Spinner
3. All components use Tailwind CSS for styling
4. **Lucide React icons integrated and used consistently**
5. Components support responsive design (mobile, tablet, desktop)
6. Form components integrate with React Hook Form
7. Table component supports sorting, pagination, and filtering
8. Modal component supports customizable header, body, footer
9. Badge component displays status with color coding (success=green, warning=yellow, danger=red)
10. Alert component displays success/error/info messages
11. TypeScript types defined for all component props

**Story File:** [docs/stories/story-1-8-ui-components.md](../stories/story-1-8-ui-components.md)

---

### Story 1.9: Error Handling and Logging

**As a** developer,
**I want** consistent error handling and logging across the application,
**So that** bugs can be diagnosed quickly and users see helpful error messages.

**Acceptance Criteria:**
1. Global error handler middleware catches all unhandled errors in Express
2. Errors formatted consistently: { status, message, code, details }
3. 4xx errors (client errors) return user-friendly messages
4. 5xx errors (server errors) return generic message + log full error
5. Winston or Pino logger configured for backend
6. Logs include timestamp, level (error/warn/info), message, context
7. Development: Logs to console with colors
8. Production: Logs to files (logs/error.log, logs/combined.log) with rotation
9. Database errors mapped to user-friendly messages (duplicate key → "Record already exists")
10. Frontend displays error toasts using react-hot-toast
11. Frontend API client intercepts errors and displays appropriate messages
12. Frontend 401 errors redirect to login
13. Frontend 403 errors display "Access Denied" message
14. **All errors logged in system logs (separate from audit trail)**

**Story File:** [docs/stories/story-1-9-error-handling.md](../stories/story-1-9-error-handling.md)

---

### Story 1.10: Docker Compose for Development

**As a** developer,
**I want** Docker Compose setup for running the full stack locally,
**So that** environment setup is fast and consistent across team members.

**Acceptance Criteria:**
1. docker-compose.yml created with services: mysql, api, web
2. MySQL service configured with persistent volume and environment variables
3. API service mounts source code for hot reload
4. Web service runs Vite dev server with hot module replacement
5. Services networked together (web can call api, api can reach mysql)
6. Ports exposed: 5173 (web), 3001 (api), 3306 (mysql)
7. docker-compose up starts all services
8. docker-compose down stops and removes containers
9. Environment variables passed via .env files
10. README includes Docker setup instructions
11. Database initialization (migrations, seeds) runs automatically on first startup
12. Logs from all services visible in terminal

**Story File:** [docs/stories/story-1-10-docker-compose.md](../stories/story-1-10-docker-compose.md)

---

### Story 1.11: JWT Refresh Token Mechanism

**As a** user,
**I want** the application to automatically refresh my session before it expires,
**So that** I can stay logged in for an extended period without being abruptly logged out.

**Acceptance Criteria:**
1.  Upon login, the API returns a short-lived access token and a long-lived refresh token.
2.  The refresh token is stored securely in an `httpOnly` cookie.
3.  A `POST /api/v1/auth/refresh-token` endpoint is created to exchange a refresh token for a new access token.
4.  The frontend automatically refreshes the access token when it expires.
5.  The user is logged out if the refresh token is also invalid.
6.  Token refresh attempts are logged in the audit trail.

**Story File:** [docs/stories/story-1-11-jwt-refresh-token.md](../stories/story-1-11-jwt-refresh-token.md)

---

## Epic 1 Dependencies

- None (foundation epic)

## Epic 1 Deliverables

✅ Development environment running (Docker, MySQL, Node.js, React)
✅ User authentication with JWT
✅ **Audit logging infrastructure operational from Day 1**
✅ Role-based access control
✅ User management for admins
✅ Role-specific dashboards
✅ Shared UI component library
✅ Error handling and logging
✅ **All future operations automatically logged**

## Success Criteria

- Users can log in with role-based access
- Dashboards display role-specific information
- **Every user action is automatically logged to AuditLog table**
- Development environment is fully functional
- Foundation is ready for building features (Epics 2-4)

## Links

- **Stories:** [docs/stories/](../stories/) (story-1-1 through story-1-10)
- **Architecture:** [docs/architecture/audit-logging.md](../architecture/audit-logging.md)
- **Database Schema:** [docs/architecture/database-schema.md](../architecture/database-schema.md)
- **MVP Roadmap:** [docs/planning/mvp-roadmap.md](../planning/mvp-roadmap.md)
