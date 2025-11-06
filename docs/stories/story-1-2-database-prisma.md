# Story 1.2: Database Setup with Prisma and MySQL

**Epic:** Epic 1 - Foundation, Authentication & Audit Infrastructure
**Story ID:** STORY-1.2
**Priority:** Critical
**Estimated Effort:** 3-4 hours
**Dependencies:** Story 1.1 (Project Setup)
**Status:** Completed

---

## User Story

**As a** developer,
**I want** Prisma ORM integrated with MySQL database and initial schema defined,
**So that** the application can persist data with type-safe database access.

---

## Acceptance Criteria

### Prisma Setup
- [x] 1. Prisma installed and initialized in monorepo
- [x] 2. MySQL 8+ database connection configured via environment variables
- [x] 3. Prisma Client generated and accessible in backend code
- [x] 4. Database connection pooling configured appropriately

### Schema Definition
- [x] 5. Initial Prisma schema defined with User, Role, AuditLog tables
- [x] 6. **AuditLog table created from Day 1** for tracking all system activity
- [x] 7. Database schema includes tenantId field on core tables for multi-tenant readiness (not enforced in MVP)
- [x] 8. Database indexes created on foreign keys and commonly queried fields

### Migrations & Seeding
- [x] 9. Prisma migration created and applied to development database
- [x] 10. Seed script created for initial roles (Admin, Warehouse Manager, Sales Officer, Accountant, Recovery Agent)
- [x] 11. Seed script creates default admin user (credentials documented)
- [x] 12. npm run db:migrate, db:seed, db:reset scripts functional

### Testing
- [x] 13. Connection tested and verified working

---

## Technical Implementation

### Installation

```bash
cd apps/api
pnpm add @prisma/client
pnpm add -D prisma
```

### Initialize Prisma

```bash
cd ../.. # back to root
npx prisma init --datasource-provider mysql
```

This creates:
- `prisma/schema.prisma`
- `.env` with DATABASE_URL

---

## Prisma Schema

**File:** `prisma/schema.prisma`

```prisma
// prisma/schema.prisma
datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
  output   = "../node_modules/.prisma/client"
}

// ============================================================================
// CORE TABLES (Epic 1)
// ============================================================================

model Role {
  id          String   @id @default(cuid())
  name        String   @unique // ADMIN, WAREHOUSE_MANAGER, SALES_OFFICER, ACCOUNTANT, RECOVERY_AGENT
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  users User[]

  @@map("roles")
}

model User {
  id           String    @id @default(cuid())
  email        String    @unique
  passwordHash String
  name         String
  roleId       String
  status       String    @default("active") // active, inactive
  lastLoginAt  DateTime?
  tenantId     String?   // For multi-tenant Phase 3 (not enforced in MVP)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt

  role      Role        @relation(fields: [roleId], references: [id])
  auditLogs AuditLog[]

  @@index([email])
  @@index([roleId])
  @@index([status])
  @@index([tenantId])
  @@map("users")
}

model AuditLog {
  id            String   @id @default(cuid())
  userId        String
  action        String   // CREATE, UPDATE, DELETE, VIEW, LOGIN, LOGOUT
  entityType    String   // User, Product, Invoice, Payment, etc.
  entityId      String?
  timestamp     DateTime @default(now())
  ipAddress     String?
  userAgent     String?
  changedFields Json?    // { field: { old: value, new: value } }
  notes         String?  @db.Text

  user User @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([timestamp])
  @@index([entityType, entityId])
  @@index([action])
  @@map("audit_logs")
}
```

---

## Database Configuration

### Environment Variables

**`apps/api/.env`**
```bash
DATABASE_URL="mysql://root:password@localhost:3306/hisham_erp"
```

**For Production:**
```bash
DATABASE_URL="mysql://username:password@host:3306/database_name?connection_limit=10&pool_timeout=60"
```

---

## Seed Script

**File:** `prisma/seed.ts`

```typescript
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create Roles
  const roles = [
    { name: 'ADMIN', description: 'System Administrator - Full Access' },
    { name: 'WAREHOUSE_MANAGER', description: 'Manages inventory and stock' },
    { name: 'SALES_OFFICER', description: 'Handles sales and invoicing' },
    { name: 'ACCOUNTANT', description: 'Manages finances and payments' },
    { name: 'RECOVERY_AGENT', description: 'Handles debt collection' },
  ];

  for (const role of roles) {
    await prisma.role.upsert({
      where: { name: role.name },
      update: {},
      create: role,
    });
  }

  console.log('✅ Roles created');

  // Create Default Admin User
  const adminRole = await prisma.role.findUnique({
    where: { name: 'ADMIN' },
  });

  if (adminRole) {
    const passwordHash = await bcrypt.hash('admin123', 10);

    await prisma.user.upsert({
      where: { email: 'admin@hishamtraders.com' },
      update: {},
      create: {
        email: 'admin@hishamtraders.com',
        passwordHash,
        name: 'System Administrator',
        roleId: adminRole.id,
        status: 'active',
      },
    });

    console.log('✅ Default admin user created');
    console.log('   Email: admin@hishamtraders.com');
    console.log('   Password: admin123');
    console.log('   ⚠️  CHANGE THIS PASSWORD IN PRODUCTION!');
  }

  console.log('🌱 Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

---

## Prisma Client Setup

**File:** `apps/api/src/lib/prisma.ts`

```typescript
import { PrismaClient } from '@prisma/client';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export default prisma;
```

---

## Package.json Scripts

Add to `apps/api/package.json`:

```json
{
  "scripts": {
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:migrate:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset",
    "db:studio": "prisma studio"
  },
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

Update root `package.json`:

```json
{
  "scripts": {
    "db:generate": "cd apps/api && pnpm db:generate",
    "db:migrate": "cd apps/api && pnpm db:migrate",
    "db:seed": "cd apps/api && pnpm db:seed",
    "db:reset": "cd apps/api && pnpm db:reset",
    "db:studio": "cd apps/api && pnpm db:studio"
  }
}
```

---

## Migration Commands

### Create Initial Migration

```bash
pnpm db:migrate
# Name: init
```

This creates:
- `prisma/migrations/XXXXXX_init/migration.sql`
- Applies migration to database

### Generate Prisma Client

```bash
pnpm db:generate
```

### Seed Database

```bash
pnpm db:seed
```

### Reset Database (Drop + Migrate + Seed)

```bash
pnpm db:reset
```

### Open Prisma Studio (Database GUI)

```bash
pnpm db:studio
```

---

## MySQL Setup Options

### Option 1: Local MySQL Installation

```bash
# Install MySQL 8
# macOS: brew install mysql
# Ubuntu: sudo apt install mysql-server
# Windows: Download from mysql.com

# Start MySQL
mysql -u root -p

# Create database
CREATE DATABASE hisham_erp;
```

### Option 2: Docker (Recommended for Dev)

See Story 1.10 for Docker Compose setup.

Quick start:
```bash
docker run -d \
  --name hisham-mysql \
  -e MYSQL_ROOT_PASSWORD=password \
  -e MYSQL_DATABASE=hisham_erp \
  -p 3306:3306 \
  mysql:8
```

---

## Testing Checklist

- [ ] Prisma schema has no syntax errors
- [ ] `pnpm db:generate` runs successfully
- [ ] `pnpm db:migrate` creates and applies migration
- [ ] Database tables created (users, roles, audit_logs)
- [ ] `pnpm db:seed` runs without errors
- [ ] 5 roles created in database
- [ ] Default admin user created
- [ ] Can login to Prisma Studio and see data
- [ ] Prisma Client can be imported in backend code
- [ ] Simple query works: `prisma.user.findMany()`

---

## Verification Script

**File:** `apps/api/src/scripts/test-db.ts`

```typescript
import { prisma } from '../lib/prisma';

async function testConnection() {
  try {
    console.log('🔍 Testing database connection...');

    const users = await prisma.user.count();
    const roles = await prisma.role.count();

    console.log('✅ Database connection successful!');
    console.log(`   Users: ${users}`);
    console.log(`   Roles: ${roles}`);

    if (users === 0) {
      console.log('⚠️  No users found. Run: pnpm db:seed');
    }
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();
```

Run with:
```bash
tsx apps/api/src/scripts/test-db.ts
```

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Prisma schema created with User, Role, AuditLog tables
- [ ] Migration applied to database
- [ ] Seed script creates roles and admin user
- [ ] Database connection tested and working
- [ ] Prisma Client accessible in backend code
- [ ] All database scripts functional (migrate, seed, reset)
- [ ] Default admin credentials documented
- [ ] Code reviewed and approved
- [ ] Changes committed to repository

---

## Notes

- **Default Admin Credentials:** admin@hishamtraders.com / admin123
- **Important:** Change default password in production
- AuditLog table is critical for Epic 1 Story 1.4 (Audit Middleware)
- TenantId field added for future multi-tenant support (not enforced yet)
- Indexes added for common query patterns

---

**Related Documents:**
- [Database Schema](../architecture/database-schema.md)
- [Tech Stack](../architecture/tech-stack.md)
- [Audit Logging Architecture](../architecture/audit-logging.md)
