# EnterpriseOne ERP - System Architecture

**Multi-Tenant SaaS Business Management Platform**

**Version:** 2.0 - SaaS Architecture  
**Last Updated:** February 2026

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Multi-Tenant Architecture](#multi-tenant-architecture)
3. [Architecture Diagrams](#architecture-diagrams)
4. [Technology Stack](#technology-stack)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)
7. [Scalability Strategy](#scalability-strategy)
8. [Related Documents](#related-documents)

---

## System Overview

EnterpriseOne is a **true multi-tenant SaaS ERP platform** built with modern JavaScript/TypeScript technologies. Unlike competitors (Odoo, SAP B1) that use single-tenant architecture, EnterpriseOne is designed from the ground up to serve multiple organizations from a single deployment.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                          │
│                                                              │
│  ┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐│
│  │   Web Browser   │ │   Mobile PWA    │ │  Mobile App     ││
│  │   (Desktop)     │ │   (Tablet/Phone)│ │  (Future)       ││
│  └────────┬────────┘ └────────┬────────┘ └────────┬────────┘│
│           │                    │                    │        │
│           └────────────────────┴────────────────────┘        │
│                              │                               │
│  React 18 + TypeScript + Tailwind CSS + TanStack Query      │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTPS / JSON
                               │
┌──────────────────────────────▼──────────────────────────────┐
│                      EDGE LAYER                              │
│                                                              │
│  ┌─────────────────────────────────────────────────────────┐│
│  │  CDN (CloudFlare) - Static assets, DDoS protection     ││
│  └─────────────────────────┬───────────────────────────────┘│
│                            │                                 │
│  ┌─────────────────────────▼───────────────────────────────┐│
│  │  Load Balancer (Nginx/Kong) - SSL, rate limiting       ││
│  └─────────────────────────┬───────────────────────────────┘│
└────────────────────────────┬────────────────────────────────┘
                             │
┌────────────────────────────▼────────────────────────────────┐
│                    APPLICATION LAYER                         │
│        Node.js 20 + Express + TypeScript + Prisma           │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Tenant Context → Auth → Audit → Business Logic      │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  Multi-Tenant Services:                                      │
│  - Tenant Resolution (subdomain/header)                     │
│  - Context Isolation (AsyncLocalStorage)                    │
│  - Automatic Query Filtering (Prisma Extension)             │
│  - Shared Cache with Tenant Prefixing                       │
└────────────────────────────┬────────────────────────────────┘
                             │ Prisma ORM
┌────────────────────────────▼────────────────────────────────┐
│                       DATA LAYER                             │
│              PostgreSQL 15 / MySQL 8+                        │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Shared Database with Row-Level Security            │   │
│  │                                                      │   │
│  │  tenantId column on all business tables             │   │
│  │  Composite indexes: [tenantId + business_key]       │   │
│  │  Foreign keys with RESTRICT for data integrity      │   │
│  │                                                      │   │
│  │  Tables: Tenant, User, Product, Invoice, etc.       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Redis (Phase 3) - Session, Cache, Queue            │   │
│  │  Meilisearch (Phase 3) - Full-text search           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## Multi-Tenant Architecture

### What is Multi-Tenancy?

Multi-tenancy is an architecture where a single instance of software serves multiple customers (tenants). Each tenant's data is isolated and remains invisible to other tenants.

**EnterpriseOne's Approach:**
- **Shared Database, Separate Schemas** (Row-Level Security)
- All tenants share the same application instance
- Automatic tenant context injection
- Zero data leakage between tenants

### Why Multi-Tenancy Matters

| Aspect | Single-Tenant (Odoo/SAP) | Multi-Tenant (EnterpriseOne) |
|--------|-------------------------|------------------------------|
| **Infrastructure** | Per-customer servers | Shared infrastructure |
| **Cost per Tenant** | $200-500/month | $20-50/month |
| **Updates** | Manual per instance | Automatic, instant |
| **Scaling** | Vertical only | Horizontal scaling |
| **Maintenance** | Per-customer effort | Single codebase |

### Implementation Details

#### 1. Tenant Identification

```typescript
// Tenant resolution middleware
const tenantMiddleware = (req, res, next) => {
  // Method 1: Subdomain (tenant1.enterpriseone.com)
  const subdomain = req.headers.host.split('.')[0];
  
  // Method 2: Header (X-Tenant-ID)
  const tenantId = req.headers['x-tenant-id'] || subdomain;
  
  // Store in AsyncLocalStorage for request lifetime
  tenantContext.run({ tenantId }, () => {
    next();
  });
};
```

#### 2. Prisma Extension for Tenant Isolation

```typescript
// Prisma client with automatic tenant filtering
const prisma = new PrismaClient().$extends({
  query: {
    $allModels: {
      async findMany({ model, operation, args, query }) {
        const { tenantId } = tenantContext.getStore();
        args.where = { ...args.where, tenantId };
        return query(args);
      },
      async create({ model, operation, args, query }) {
        const { tenantId } = tenantContext.getStore();
        args.data = { ...args.data, tenantId };
        return query(args);
      },
      // ... update, delete, etc.
    },
  },
});
```

#### 3. Database Schema Pattern

```prisma
// Every business model includes tenantId
model Product {
  id          String   @id @default(cuid())
  tenantId    String   // Row-level isolation
  sku         String
  name        String
  // ... other fields
  
  @@unique([tenantId, sku])  // Business key uniqueness per tenant
  @@index([tenantId])        // Query performance
}

model Invoice {
  id          String   @id @default(cuid())
  tenantId    String
  invoiceNumber String
  // ... other fields
  
  @@unique([tenantId, invoiceNumber])
  @@index([tenantId])
  @@index([tenantId, createdAt])  // Common query pattern
}
```

#### 4. Tenant Onboarding Flow

```
1. User signs up on website
   ↓
2. System creates Tenant record
   - Generate unique tenantId
   - Create default settings
   - Setup default chart of accounts
   ↓
3. Create Admin User
   - Assign to tenant
   - Send welcome email
   ↓
4. Provision complete (< 2 minutes)
   - Tenant can start using immediately
   - No manual infrastructure setup
```

---

## Architecture Diagrams

### Request Flow with Multi-Tenancy

```
┌──────────┐
│  Browser │  tenant1.enterpriseone.com
└────┬─────┘
     │ GET /api/products
     ▼
┌─────────────────┐
│   Load Balancer │  1. Route to app server
│   (Nginx)       │
└────┬────────────┘
     │
     ▼
┌──────────────────────┐
│  Tenant Middleware   │  2. Extract tenant from subdomain
│  - Parse hostname    │     tenantId = "tenant1"
│  - Lookup tenant     │  3. Validate tenant exists & active
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Auth Middleware     │  4. Verify JWT
│  - Validate token    │  5. Extract user info
│  - Check user belongs│     to this tenant
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Context Setup       │  6. Set AsyncLocalStorage
│  - tenantContext.run │     with tenantId
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Audit Middleware    │  7. Setup response interception
│  - Log after success │
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Product Controller  │  8. Execute business logic
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Prisma Query        │  9. Automatic WHERE tenantId = 'tenant1'
│  - findMany()        │     added by extension
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  PostgreSQL          │  10. Return tenant1's products only
└────┬─────────────────┘
     │
     ▼
┌──────────────────────┐
│  Audit Logger        │  11. Log access (async)
│  (background)        │
└──────────────────────┘
     │
     ▼
┌──────────────────────┐
│  Response to Client  │  12. JSON response
└──────────────────────┘
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| React | 18.x | UI library |
| TypeScript | 5.3+ | Type safety |
| Vite | 5.x | Build tool |
| Tailwind CSS | 3.4+ | Styling |
| TanStack Query | 5.x | Server state |
| Zustand | 4.x | Client state |
| React Router | 6.x | Routing |
| Recharts | 2.x | Charts |
| Lucide React | Latest | Icons |

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| Node.js | 20 LTS | Runtime |
| Express | 4.x | Web framework |
| TypeScript | 5.3+ | Type safety |
| Prisma | 5.x | ORM |
| Zod | 3.x | Validation |
| JWT | jsonwebtoken | Authentication |
| Winston | 3.x | Logging |

### Database & Infrastructure

| Technology | Purpose |
|------------|---------|
| PostgreSQL 15+ | Primary database |
| MySQL 8+ | Alternative option |
| Redis | Cache, sessions, queue (Phase 3) |
| Meilisearch | Full-text search (Phase 3) |
| Docker | Containerization |
| Nginx | Reverse proxy, load balancing |
| AWS/DigitalOcean | Cloud hosting |

---

## Data Flow

### Multi-Tenant Data Flow Example: Invoice Creation

```
Tenant: "acme-corp"
User: john@acme-corp.com
Action: Create Invoice

1. Request
   POST /api/invoices
   Headers:
     Host: acme-corp.enterpriseone.com
     Authorization: Bearer <jwt>
   Body: { clientId: "C001", items: [...] }

2. Tenant Resolution
   - Extract subdomain: "acme-corp"
   - Validate tenant exists and is active
   - Set tenantContext = { tenantId: "acme-corp" }

3. Authentication
   - Verify JWT signature
   - Decode: { userId: "usr_123", tenantId: "acme-corp" }
   - Verify user belongs to this tenant

4. Validation (Zod)
   - Validate request body
   - Check all referenced IDs belong to tenant

5. Business Logic
   - Check client credit limit
   - Check stock availability
   - Calculate totals, tax

6. Database Transaction
   BEGIN;
   
   -- All queries automatically include tenantId filter
   INSERT INTO invoices (tenantId, invoiceNumber, ...)
   VALUES ('acme-corp', 'INV-001', ...);
   
   INSERT INTO invoice_items (tenantId, invoiceId, ...)
   VALUES ('acme-corp', 'inv_123', ...);
   
   UPDATE inventory 
   SET quantity = quantity - 10
   WHERE tenantId = 'acme-corp' AND productId = 'prod_456';
   
   INSERT INTO journal_entries (tenantId, ...)
   VALUES ('acme-corp', ...);
   
   COMMIT;

7. Audit Logging (async)
   INSERT INTO audit_logs (tenantId, userId, action, entity, ...)
   VALUES ('acme-corp', 'usr_123', 'CREATE', 'Invoice', ...);

8. Response
   { success: true, data: { id: "inv_123", ... } }
```

---

## Security Architecture

### Multi-Tenant Security

| Layer | Protection |
|-------|-----------|
| **Network** | TLS 1.3, WAF, DDoS protection |
| **Authentication** | JWT with expiry, refresh tokens |
| **Authorization** | RBAC + tenant isolation |
| **Data** | Row-level security via tenantId |
| **API** | Rate limiting per tenant |
| **Audit** | All actions logged |

### Security Measures

```typescript
// Tenant isolation enforcement
const enforceTenantIsolation = (req, res, next) => {
  const tokenTenant = req.user.tenantId;
  const contextTenant = tenantContext.getStore().tenantId;
  
  if (tokenTenant !== contextTenant) {
    // Security violation - user trying to access another tenant
    logger.security.warn('Cross-tenant access attempt', {
      userId: req.user.id,
      tokenTenant,
      attemptedTenant: contextTenant
    });
    return res.status(403).json({ error: 'Access denied' });
  }
  
  next();
};
```

### Data Isolation Guarantee

1. **Database Level:** All queries filtered by tenantId
2. **Application Level:** Middleware enforces tenant context
3. **Cache Level:** Keys prefixed with tenantId
4. **File Storage:** Tenant-specific prefixes in S3
5. **Search Index:** Tenant-scoped indexes

---

## Scalability Strategy

### Current Capacity (MVP)

| Metric | Capacity |
|--------|----------|
| Tenants | 100+ per instance |
| Users per tenant | 100+ |
| Concurrent users | 500+ |
| Transactions/day | 100,000+ |

### Phase 3 Scalability (Horizontal)

```
┌─────────────────┐
│   CDN/WAF       │
└────────┬────────┘
         │
┌────────▼────────┐
│  Load Balancer  │
└────────┬────────┘
         │
    ┌────┴────┐
    ▼         ▼
┌───────┐ ┌───────┐
│ App 1 │ │ App 2 │  ... Auto-scaling group
└───┬───┘ └───┬───┘
    └────┬────┘
         │
┌────────▼────────┐
│  Read Replica   │  Primary DB (writes)
│     (reads)     │
└─────────────────┘
```

### Database Scaling

1. **Read Replicas:** For reporting and analytics queries
2. **Connection Pooling:** PgBouncer for PostgreSQL
3. **Query Optimization:** Strategic indexes on tenantId + common filters
4. **Archiving:** Move old data to cold storage

---

## Related Documents

- [Multi-Tenant SaaS Epic](../epics/epic-9-multi-tenant-saas.md) - Implementation details
- [Database Schema](./database-schema.md) - Complete Prisma schema
- [API Endpoints](./api-endpoints.md) - REST API documentation
- [Security Guide](./security.md) - Detailed security practices
- [Deployment Guide](../../DEPLOYMENT.md) - Production deployment

---

## Appendix: Comparison with Single-Tenant ERPs

### Why Not Single-Tenant Like Odoo?

| Aspect | Single-Tenant (Odoo) | Multi-Tenant (EnterpriseOne) |
|--------|---------------------|------------------------------|
| **Deployment** | Per-customer setup | Single deployment |
| **Maintenance** | Update each instance | Update once |
| **Cost** | Infrastructure per customer | Shared infrastructure |
| **Onboarding** | Hours to days | Minutes |
| **Scaling** | Manual per customer | Automatic |

### Migration from Single-Tenant

For customers migrating from Odoo/SAP:
1. **Data Export:** Standard CSV/Excel exports
2. **Tenant Creation:** Automated onboarding
3. **Data Import:** Built-in import tools
4. **Go-Live:** Same day activation

---

**Document Version:** 2.0
**Last Updated:** February 2026
**Status:** Architecture Complete, Phase 3 Scaling In Progress
