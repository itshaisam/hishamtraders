# System Architecture Overview

**Project:** Hisham Traders ERP System
**Version:** MVP + Phase 2
**Last Updated:** 2025-01-15

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagrams](#architecture-diagrams)
3. [Technology Stack](#technology-stack)
4. [Data Flow](#data-flow)
5. [Security Architecture](#security-architecture)
6. [Scalability Considerations](#scalability-considerations)
7. [Related Documents](#related-documents)

---

## System Overview

The Hisham Traders ERP is a **full-stack web application** built using modern JavaScript/TypeScript technologies. The system follows a **monolithic architecture** for MVP with clear service boundaries to enable future microservices migration if needed.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│  React 18 + TypeScript + Tailwind CSS + TanStack Query      │
│  (Responsive Web App - Desktop, Tablet, Mobile)             │
└────────────────────┬────────────────────────────────────────┘
                     │ HTTPS / JSON
                     │
┌────────────────────▼────────────────────────────────────────┐
│                      WEB SERVER LAYER                        │
│          Nginx (Reverse Proxy + Static Files + SSL)         │
└────────────────────┬────────────────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│        Node.js 20 + Express + TypeScript + Prisma           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Auth Middleware → Audit Middleware → Business Logic │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Services:                                                   │
│  - Authentication (JWT)                                      │
│  - Authorization (RBAC)                                      │
│  - Audit Logging (Automatic)                                │
│  - Business Logic (Products, Sales, Inventory, etc.)        │
└────────────────────┬────────────────────────────────────────┘
                     │ Prisma ORM
┌────────────────────▼────────────────────────────────────────┐
│                       DATA LAYER                             │
│             MySQL 8+ (Primary Database)                      │
│                                                              │
│  Tables: User, Product, Client, Invoice, Payment,           │
│          PurchaseOrder, Inventory, AuditLog, etc.           │
└──────────────────────────────────────────────────────────────┘
```

---

## Architecture Diagrams

### Request Flow (MVP)

```
┌─────────┐
│ Browser │
└────┬────┘
     │ 1. GET /products
     ▼
┌─────────────┐
│   Nginx     │  2. Proxy to Node.js
│   :80/443   │
└────┬────────┘
     │
     ▼
┌────────────────────┐
│  Express Router    │  3. Route to /api/products
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│  Auth Middleware   │  4. Verify JWT, extract user
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│  Audit Middleware  │  5. Intercept response (log after success)
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│ Product Controller │  6. Execute business logic
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│  Prisma Service    │  7. Query database
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│      MySQL         │  8. Return data
└────┬───────────────┘
     │
     ▼
┌────────────────────┐
│  Audit Logger      │  9. Log action asynchronously (non-blocking)
└────────────────────┘
     │
     ▼
┌────────────────────┐
│  Response to User  │  10. JSON response sent
└────────────────────┘
```

---

### Authentication Flow

```
┌──────────┐
│  Client  │
└────┬─────┘
     │ POST /api/auth/login { email, password }
     ▼
┌─────────────────┐
│ Auth Controller │
└────┬────────────┘
     │
     │ 1. Find user by email
     ▼
┌──────────────┐
│    MySQL     │
└────┬─────────┘
     │ User record
     ▼
┌─────────────────┐
│ bcrypt.compare  │  2. Verify password hash
└────┬────────────┘
     │ Match? Yes
     ▼
┌─────────────────┐
│  jwt.sign()     │  3. Generate token
└────┬────────────┘     Payload: { userId, email, roleId }
     │                  Secret: JWT_SECRET
     │                  Expiry: 24 hours
     ▼
┌─────────────────┐
│  Response       │  4. Return { token, user }
│  200 OK         │
└─────────────────┘
     │
     ▼
┌─────────────────┐
│  Client         │  5. Store token in localStorage
│  localStorage   │     Include in future requests:
└─────────────────┘     Authorization: Bearer {token}
```

---

### Audit Logging Flow (MVP - From Day 1)

```
┌─────────────────────────────────────────────────────────┐
│                  User Action (e.g., Update Product)      │
└────────────────────┬────────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│  PUT /api/products/:id                                  │
│  Body: { name: "New Name", price: 150 }                │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│  Auth Middleware: Extract user from JWT                │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│  Audit Middleware: Intercept res.json()                │
│  - Store original res.json method                      │
│  - Override with custom handler                        │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│  Business Logic: Update product in database            │
│  - Validate input                                       │
│  - Update product record                               │
│  - Return updated product                              │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼
┌────────────────────────────────────────────────────────┐
│  Audit Middleware: On successful response (2xx)        │
│  - Extract: user, action, entity, changed fields       │
│  - Call logAudit() ASYNCHRONOUSLY                      │
│  - Send response immediately (don't wait)              │
└────────────────────┬───────────────────────────────────┘
                     │
                     ▼ (async, non-blocking)
┌────────────────────────────────────────────────────────┐
│  Log to AuditLog Table                                 │
│  {                                                      │
│    userId: "user123",                                  │
│    action: "UPDATE",                                   │
│    entityType: "Product",                              │
│    entityId: "prod456",                                │
│    timestamp: "2025-01-15T10:30:00Z",                 │
│    ipAddress: "192.168.1.100",                        │
│    changedFields: {                                    │
│      name: { old: "Old Name", new: "New Name" },     │
│      price: { old: 100, new: 150 }                   │
│    }                                                   │
│  }                                                     │
└────────────────────────────────────────────────────────┘
```

**Key Points:**
- ✅ Audit logging is **automatic** (no manual code in business logic)
- ✅ Logging is **asynchronous** (doesn't slow down user operations)
- ✅ All CRUD operations logged from **Day 1**
- ✅ Captures **changed fields** with old/new values

---

## Technology Stack

### Frontend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | React 18 | UI library |
| Language | TypeScript 5.3+ | Type safety |
| Build Tool | Vite | Fast dev server + builds |
| Styling | Tailwind CSS v3 | Utility-first CSS |
| Icons | Lucide React | Modern icon library |
| State (Server) | TanStack Query v5 | API data fetching/caching |
| State (Client) | Zustand | Lightweight state management |
| Forms | React Hook Form + Zod | Form handling + validation |
| Tables | TanStack Table v8 | Data tables |
| Charts | Recharts | Data visualization |
| Routing | React Router v6 | Client-side routing |
| HTTP Client | Axios | API requests |
| Date Handling | date-fns | Date utilities |
| Notifications | react-hot-toast | Toast notifications |

### Backend

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Runtime | Node.js 20 LTS | JavaScript runtime |
| Language | TypeScript 5.3+ | Type safety |
| Framework | Express.js | Web framework |
| ORM | Prisma 5 | Type-safe database access |
| Validation | Zod | Schema validation |
| Authentication | JWT + bcrypt | Auth tokens + password hashing |
| Logging | Winston | Application logging |
| Process Manager | PM2 | Production process management |

### Database

| Component | Technology | Purpose |
|-----------|-----------|---------|
| RDBMS | MySQL 8+ | Primary database |
| Migrations | Prisma Migrate | Schema versioning |
| Admin Tool | Prisma Studio | Visual database browser |

### DevOps

| Component | Technology | Purpose |
|-----------|-----------|---------|
| Package Manager | pnpm | Fast, disk-efficient |
| Monorepo | pnpm Workspaces | Shared code |
| Code Quality | ESLint + Prettier | Linting + formatting |
| Pre-commit | Husky + lint-staged | Git hooks |
| Containers | Docker Compose | Dev environment |
| Web Server | Nginx | Reverse proxy + SSL |
| SSL | Let's Encrypt | Free HTTPS certificates |
| Hosting | DigitalOcean | Cloud hosting |

**Full Details:** [Tech Stack Documentation](./tech-stack.md)

---

## Data Flow

### Invoice Creation with Stock Deduction (Example)

```
1. User fills invoice form
   └─> React form (react-hook-form)

2. Submit invoice
   └─> POST /api/invoices
       Body: {
         clientId: "client123",
         items: [
           { productId: "prod1", quantity: 10, unitPrice: 100 }
         ],
         paymentType: "CREDIT"
       }

3. Server receives request
   └─> Auth middleware: Verify JWT
   └─> Audit middleware: Intercept response
   └─> Invoice controller: Business logic

4. Business logic
   ├─> Validate input (Zod schema)
   ├─> Check client credit limit
   │   └─> If exceeded and user != Admin: return 403
   ├─> Check stock availability
   │   └─> For each item: inventory.quantity >= item.quantity
   │   └─> If insufficient: return 400
   ├─> Begin database transaction
   ├─> Create invoice record
   ├─> Create invoice item records
   ├─> Deduct inventory (FIFO if multiple batches)
   ├─> Update client balance (if paymentType = CREDIT)
   ├─> Create stock movement records
   ├─> Commit transaction
   └─> Return invoice data

5. Audit middleware
   └─> Log invoice creation asynchronously
       {
         userId, action: "CREATE",
         entityType: "Invoice",
         entityId: invoice.id,
         changedFields: { ... }
       }

6. Response sent to client
   └─> 201 Created { invoice: {...} }

7. Frontend updates
   └─> TanStack Query invalidates cache
   └─> Refetches invoice list
   └─> Displays success toast
```

---

## Security Architecture

### Authentication & Authorization

**Authentication:**
- JWT-based (stateless)
- 24-hour token expiry
- Refresh tokens not implemented in MVP (Phase 2)

**Authorization:**
- Role-Based Access Control (RBAC)
- 5 roles: Admin, Warehouse Manager, Sales Officer, Accountant, Recovery Agent
- Middleware checks role before executing sensitive operations

**Role Permissions Matrix:**

| Feature | Admin | Warehouse | Sales | Accountant | Recovery |
|---------|-------|-----------|-------|------------|----------|
| User Management | ✅ | ❌ | ❌ | ❌ | ❌ |
| Products | ✅ | ✅ | ✅ (view) | ❌ | ❌ |
| Suppliers | ✅ | ✅ | ❌ | ✅ | ❌ |
| Purchase Orders | ✅ | ✅ | ❌ | ✅ | ❌ |
| Inventory | ✅ | ✅ | ✅ (view) | ❌ | ❌ |
| Clients | ✅ | ❌ | ✅ | ✅ | ✅ (view) |
| Invoices | ✅ | ❌ | ✅ | ✅ | ✅ (view) |
| Payments | ✅ | ❌ | ❌ | ✅ | ✅ |
| Expenses | ✅ | ❌ | ❌ | ✅ | ❌ |
| Reports | ✅ | ✅ | ✅ | ✅ | ✅ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ |

### Security Measures

| Attack Vector | Protection |
|--------------|-----------|
| SQL Injection | Prisma parameterized queries |
| XSS | React escapes output by default |
| CSRF | SameSite cookies + Origin validation |
| Password Cracking | bcrypt with 10 rounds |
| Brute Force | Rate limiting (express-rate-limit) |
| Man-in-the-Middle | HTTPS (Let's Encrypt SSL) |
| Session Hijacking | JWT with expiry + secure storage |

**Full Details:** [Security Documentation](./security.md) (to be created)

---

## Scalability Considerations

### MVP Capacity

**Expected Load:**
- 20 concurrent users
- 10,000 transactions/month
- 50,000 records (products, clients, invoices combined)
- 10,000 audit log entries/month

**Server Specs (MVP):**
- 2 vCPUs
- 2 GB RAM
- 50 GB SSD
- Cost: $18/month (DigitalOcean)

### Phase 2+ Scaling Strategies

**Vertical Scaling (Easiest):**
- Upgrade to 4 GB RAM droplet ($42/month)
- Handles 50-100 concurrent users

**Horizontal Scaling (Future):**
1. **Load Balancer** (Nginx or DigitalOcean Load Balancer)
2. **Multiple API Servers** (PM2 cluster mode or separate droplets)
3. **Database Replication** (Read replicas for reports)
4. **Caching Layer** (Redis for frequent queries)
5. **CDN** (CloudFlare for static assets)

**Microservices (Phase 3+):**
- Separate services: Auth, Inventory, Sales, Reports
- Message queue (RabbitMQ/Redis) for async operations
- API Gateway (Kong/AWS API Gateway)

---

## Monitoring & Observability (Phase 2)

### Application Monitoring

- **PM2 Monitoring:** Process health, CPU, memory
- **Winston Logs:** Error tracking, request logs
- **Uptime Monitoring:** UptimeRobot (free tier)

### Database Monitoring

- **MySQL Stats:** Performance schema and slow query log
- **Slow Query Log:** Queries > 1 second
- **Connection Pool:** Monitor active connections

### Business Metrics

- **Dashboard KPIs:** Real-time metrics (inventory value, receivables, DSO)
- **Audit Analytics:** User activity patterns (Epic 8)

---

## Disaster Recovery

### Backup Strategy

**Database Backups:**
- Automated daily backups (DigitalOcean managed databases or custom pg_dump)
- Retention: 7 days
- Test restore monthly

**Application Code:**
- Git repository (GitHub/GitLab)
- Tagged releases for each deployment

**Recovery Time Objective (RTO):**
- MVP: 4 hours
- Phase 2: 1 hour

**Recovery Point Objective (RPO):**
- MVP: 24 hours (daily backups)
- Phase 2: 1 hour (hourly backups)

---

## Development Workflow

### Git Workflow

```
main (production)
  └── develop (staging)
       └── feature/epic-1-auth
       └── feature/epic-2-inventory
       └── bugfix/invoice-calculation
```

**Branch Naming:**
- `feature/epic-X-description`
- `bugfix/issue-description`
- `hotfix/critical-issue`

### CI/CD Pipeline (Phase 2)

```
1. Developer pushes to feature branch
2. GitHub Actions runs:
   ├─> Lint (ESLint)
   ├─> Type check (tsc)
   ├─> Unit tests (Jest)
   └─> Build (Vite + tsc)
3. If pass: Allow merge to develop
4. Merge to main: Auto-deploy to production
```

---

## Related Documents

- **[Tech Stack Justification](./tech-stack.md)** - Full technology choices with comparisons
- **[Database Schema](./database-schema.md)** - Complete Prisma schema with relationships
- **[API Endpoints](./api-endpoints.md)** - RESTful API documentation
- **[Audit Logging Architecture](./audit-logging.md)** - Detailed audit system design
- **[Source Tree Structure](./source-tree.md)** - Monorepo folder organization
- **[Coding Standards](./coding-standards.md)** - TypeScript/React conventions

---

## Appendix: Key Architectural Decisions

### Why Monolithic Architecture (MVP)?

**Advantages:**
- ✅ Simpler to develop and deploy
- ✅ Single codebase (easier to maintain)
- ✅ No distributed system complexity
- ✅ Atomic transactions across modules

**When to Consider Microservices:**
- Team size > 10 developers
- Need independent scaling per module
- Different tech stacks per service

**Verdict:** Monolith is perfect for MVP. Can refactor to microservices in Phase 3+ if needed.

---

### Why MySQL 8+?

**Advantages:**
- ✅ Full ACID compliance with InnoDB
- ✅ Modern features (window functions, CTEs, JSON support)
- ✅ Excellent performance for reads and writes
- ✅ Wide adoption and strong community support
- ✅ Mature and battle-tested in production
- ✅ Excellent Prisma support

---

### Why Not Use MongoDB?

**Reasons:**
- ❌ ERP needs ACID transactions (inventory consistency critical)
- ❌ Highly relational data (products, invoices, clients are interconnected)
- ❌ No foreign key constraints (data integrity risk)
- ❌ Complex joins are harder in NoSQL

**Verdict:** MySQL is the correct choice for this ERP system.

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
**Status:** Approved for MVP Development
