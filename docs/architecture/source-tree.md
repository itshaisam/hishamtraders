# Hisham Traders ERP - Source Tree Structure

**Version:** 1.0
**Last Updated:** 2025-01-15
**Status:** Approved

---

## Table of Contents

1. [Overview](#overview)
2. [Root Directory Structure](#root-directory-structure)
3. [Frontend Structure (apps/web)](#frontend-structure-appsweb)
4. [Backend Structure (apps/api)](#backend-structure-appsapi)
5. [Shared Packages](#shared-packages)
6. [Database (Prisma)](#database-prisma)
7. [Documentation](#documentation)
8. [Configuration Files](#configuration-files)
9. [File Naming Conventions](#file-naming-conventions)

---

## Overview

**Architecture Type:** Monorepo with pnpm workspaces

**Key Principles:**
- **Separation of concerns** - Frontend, backend, shared code isolated
- **Type sharing** - TypeScript types shared between frontend/backend
- **Consistent structure** - Predictable file locations
- **Domain-driven modules** - Features grouped by domain (products, invoices, etc.)

**Repository:** `hishamtraders/`

---

## Root Directory Structure

```
hishamtraders/
├── apps/                       # Applications
│   ├── web/                   # React frontend (Vite)
│   └── api/                   # Express backend (Node.js + TypeScript)
├── packages/                   # Shared packages
│   └── shared/                # Shared TypeScript types, utilities
├── prisma/                     # Database schema and migrations
│   ├── schema.prisma          # Prisma schema definition
│   ├── migrations/            # Database migrations
│   └── seed.ts                # Database seeding script
├── docs/                       # Documentation
│   ├── prd/                   # Product requirements
│   ├── epics/                 # Epic definitions
│   ├── stories/               # User stories
│   ├── architecture/          # Architecture docs
│   └── qa/                    # QA documentation
├── scripts/                    # Utility scripts
│   ├── setup.sh               # Initial setup script
│   └── deploy.sh              # Deployment script
├── .github/                    # GitHub configuration
│   └── workflows/             # CI/CD workflows
├── docker-compose.yml         # Docker services (MySQL, etc.)
├── pnpm-workspace.yaml        # pnpm workspace configuration
├── .env.example               # Environment variables template
├── .gitignore
├── package.json               # Root package.json
├── tsconfig.json              # Root TypeScript config
└── README.md
```

---

## Frontend Structure (apps/web)

```
apps/web/
├── src/
│   ├── components/            # Shared components
│   │   ├── ui/               # Base UI components
│   │   │   ├── Button.tsx
│   │   │   ├── Input.tsx
│   │   │   ├── Select.tsx
│   │   │   ├── Checkbox.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Table.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Badge.tsx
│   │   │   ├── Alert.tsx
│   │   │   ├── Spinner.tsx
│   │   │   └── index.ts      # Barrel export
│   │   ├── layout/           # Layout components
│   │   │   ├── AppShell.tsx  # Main app layout
│   │   │   ├── Header.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   ├── Footer.tsx
│   │   │   └── Navigation.tsx
│   │   └── common/           # Common components
│   │       ├── ErrorBoundary.tsx
│   │       ├── LoadingSpinner.tsx
│   │       ├── NotFound.tsx
│   │       └── ProtectedRoute.tsx
│   ├── features/             # Feature modules (domain-driven)
│   │   ├── auth/
│   │   │   ├── components/
│   │   │   │   ├── LoginForm.tsx
│   │   │   │   └── ForgotPasswordForm.tsx
│   │   │   ├── pages/
│   │   │   │   ├── LoginPage.tsx
│   │   │   │   └── ForgotPasswordPage.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useAuth.ts
│   │   │   ├── api/
│   │   │   │   └── auth-api.ts
│   │   │   └── types/
│   │   │       └── auth.types.ts
│   │   ├── products/
│   │   │   ├── components/
│   │   │   │   ├── ProductList.tsx
│   │   │   │   ├── ProductCard.tsx
│   │   │   │   ├── ProductForm.tsx
│   │   │   │   ├── ProductFilters.tsx
│   │   │   │   └── ProductTable.tsx
│   │   │   ├── pages/
│   │   │   │   ├── ProductsPage.tsx
│   │   │   │   ├── ProductDetailPage.tsx
│   │   │   │   └── CreateProductPage.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── useProducts.ts
│   │   │   │   ├── useProduct.ts
│   │   │   │   └── useProductMutations.ts
│   │   │   ├── api/
│   │   │   │   └── products-api.ts
│   │   │   └── types/
│   │   │       └── product.types.ts
│   │   ├── inventory/
│   │   │   ├── components/
│   │   │   │   ├── StockList.tsx
│   │   │   │   ├── StockAdjustmentForm.tsx
│   │   │   │   └── WarehouseSelector.tsx
│   │   │   ├── pages/
│   │   │   │   ├── InventoryPage.tsx
│   │   │   │   └── StockMovementsPage.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useInventory.ts
│   │   │   ├── api/
│   │   │   │   └── inventory-api.ts
│   │   │   └── types/
│   │   │       └── inventory.types.ts
│   │   ├── invoices/
│   │   │   ├── components/
│   │   │   │   ├── InvoiceList.tsx
│   │   │   │   ├── InvoiceForm.tsx
│   │   │   │   ├── InvoiceItemsTable.tsx
│   │   │   │   └── InvoicePreview.tsx
│   │   │   ├── pages/
│   │   │   │   ├── InvoicesPage.tsx
│   │   │   │   ├── CreateInvoicePage.tsx
│   │   │   │   └── InvoiceDetailPage.tsx
│   │   │   ├── hooks/
│   │   │   │   └── useInvoices.ts
│   │   │   ├── api/
│   │   │   │   └── invoices-api.ts
│   │   │   └── types/
│   │   │       └── invoice.types.ts
│   │   ├── clients/
│   │   │   ├── components/
│   │   │   ├── pages/
│   │   │   ├── hooks/
│   │   │   ├── api/
│   │   │   └── types/
│   │   ├── suppliers/
│   │   ├── purchase-orders/
│   │   ├── payments/
│   │   ├── reports/
│   │   ├── users/
│   │   └── dashboard/
│   │       ├── components/
│   │       │   ├── StatCard.tsx
│   │       │   ├── RecentInvoices.tsx
│   │       │   ├── StockAlerts.tsx
│   │       │   └── SalesChart.tsx
│   │       └── pages/
│   │           ├── AdminDashboard.tsx
│   │           ├── WarehouseManagerDashboard.tsx
│   │           ├── SalesOfficerDashboard.tsx
│   │           ├── AccountantDashboard.tsx
│   │           └── RecoveryAgentDashboard.tsx
│   ├── lib/                  # Third-party integrations
│   │   ├── api-client.ts    # Axios configuration
│   │   ├── query-client.ts  # TanStack Query setup
│   │   ├── router.tsx       # React Router setup
│   │   └── auth.ts          # Auth utilities (token management)
│   ├── hooks/               # Shared custom hooks
│   │   ├── useDebounce.ts
│   │   ├── useLocalStorage.ts
│   │   ├── useMediaQuery.ts
│   │   ├── usePagination.ts
│   │   └── useToast.ts
│   ├── store/               # Global state (Zustand)
│   │   ├── auth-store.ts   # Authentication state
│   │   ├── ui-store.ts     # UI state (sidebar open, theme)
│   │   └── index.ts
│   ├── utils/               # Utility functions
│   │   ├── format.ts       # Formatting (currency, date, etc.)
│   │   ├── validation.ts   # Custom validators
│   │   ├── date.ts         # Date utilities (date-fns wrappers)
│   │   ├── currency.ts     # Currency formatting
│   │   └── constants.ts    # App constants
│   ├── types/               # Shared types
│   │   ├── api.types.ts    # API response types
│   │   ├── common.types.ts # Common types
│   │   └── index.ts
│   ├── styles/              # Global styles
│   │   ├── globals.css     # Tailwind imports + global styles
│   │   └── variables.css   # CSS variables
│   ├── assets/              # Static assets
│   │   ├── images/
│   │   ├── icons/
│   │   └── fonts/
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   └── vite-env.d.ts        # Vite types
├── public/                   # Public assets
│   ├── favicon.ico
│   └── robots.txt
├── index.html               # HTML template
├── vite.config.ts           # Vite configuration
├── tsconfig.json            # TypeScript config
├── tsconfig.node.json       # TypeScript config for Vite
├── tailwind.config.js       # Tailwind configuration
├── postcss.config.js        # PostCSS configuration
├── .eslintrc.json           # ESLint configuration
├── .prettierrc              # Prettier configuration
└── package.json
```

---

## Backend Structure (apps/api)

```
apps/api/
├── src/
│   ├── config/              # Configuration
│   │   ├── database.ts     # Prisma client instance
│   │   ├── auth.ts         # JWT configuration
│   │   ├── logger.ts       # Winston logger setup
│   │   └── env.ts          # Environment variables validation
│   ├── middleware/          # Express middleware
│   │   ├── auth.middleware.ts          # JWT authentication
│   │   ├── authorization.middleware.ts # Role-based access control
│   │   ├── audit.middleware.ts         # Audit logging
│   │   ├── validation.middleware.ts    # Request validation
│   │   ├── error.middleware.ts         # Global error handler
│   │   ├── request-logger.middleware.ts # HTTP request logging
│   │   ├── rate-limiter.middleware.ts  # Rate limiting
│   │   └── index.ts
│   ├── modules/             # Feature modules (domain-driven)
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── dto/
│   │   │   │   ├── login.dto.ts
│   │   │   │   ├── register.dto.ts
│   │   │   │   └── change-password.dto.ts
│   │   │   └── auth.test.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-user.dto.ts
│   │   │   │   └── update-user.dto.ts
│   │   │   └── users.test.ts
│   │   ├── products/
│   │   │   ├── products.controller.ts
│   │   │   ├── products.service.ts
│   │   │   ├── products.repository.ts
│   │   │   ├── products.routes.ts
│   │   │   ├── dto/
│   │   │   │   ├── create-product.dto.ts
│   │   │   │   ├── update-product.dto.ts
│   │   │   │   └── product-filter.dto.ts
│   │   │   └── products.test.ts
│   │   ├── inventory/
│   │   │   ├── inventory.controller.ts
│   │   │   ├── inventory.service.ts
│   │   │   ├── inventory.repository.ts
│   │   │   ├── inventory.routes.ts
│   │   │   ├── dto/
│   │   │   └── inventory.test.ts
│   │   ├── invoices/
│   │   ├── clients/
│   │   ├── suppliers/
│   │   ├── purchase-orders/
│   │   ├── payments/
│   │   ├── reports/
│   │   └── audit/
│   ├── shared/              # Shared utilities
│   │   ├── errors/         # Custom error classes
│   │   │   ├── app-error.ts
│   │   │   ├── bad-request.error.ts
│   │   │   ├── unauthorized.error.ts
│   │   │   ├── forbidden.error.ts
│   │   │   ├── not-found.error.ts
│   │   │   └── index.ts
│   │   ├── types/          # Shared types
│   │   │   ├── express.types.ts  # Express type extensions
│   │   │   └── pagination.types.ts
│   │   ├── utils/          # Utility functions
│   │   │   ├── pagination.ts
│   │   │   ├── date.ts
│   │   │   ├── hash.ts     # Bcrypt wrappers
│   │   │   ├── jwt.ts      # JWT utilities
│   │   │   └── response.ts # Standardized responses
│   │   └── constants/      # Constants
│   │       ├── roles.ts
│   │       ├── permissions.ts
│   │       └── error-codes.ts
│   ├── app.ts              # Express app setup
│   └── server.ts           # HTTP server entry point
├── logs/                    # Application logs (gitignored)
│   ├── error.log
│   ├── combined.log
│   └── access.log
├── uploads/                 # File uploads (gitignored)
├── tsconfig.json           # TypeScript configuration
├── .eslintrc.json          # ESLint configuration
├── .prettierrc             # Prettier configuration
├── jest.config.js          # Jest configuration
└── package.json
```

---

## Shared Packages

```
packages/shared/
├── src/
│   ├── types/              # Shared TypeScript types
│   │   ├── user.types.ts
│   │   ├── product.types.ts
│   │   ├── invoice.types.ts
│   │   ├── client.types.ts
│   │   ├── supplier.types.ts
│   │   └── index.ts        # Barrel export
│   ├── schemas/            # Zod validation schemas (shared)
│   │   ├── user.schema.ts
│   │   ├── product.schema.ts
│   │   ├── invoice.schema.ts
│   │   └── index.ts
│   ├── constants/          # Shared constants
│   │   ├── roles.ts
│   │   ├── statuses.ts
│   │   └── index.ts
│   └── utils/              # Shared utilities
│       ├── format.ts
│       ├── validation.ts
│       └── index.ts
├── tsconfig.json
└── package.json
```

**Usage in frontend:**
```typescript
import { User, UserRole } from '@hishamtraders/shared/types';
import { createUserSchema } from '@hishamtraders/shared/schemas';
```

**Usage in backend:**
```typescript
import { User, UserRole } from '@hishamtraders/shared/types';
import { createUserSchema } from '@hishamtraders/shared/schemas';
```

---

## Database (Prisma)

```
prisma/
├── schema.prisma           # Prisma schema definition
├── migrations/             # Database migrations
│   ├── 20250101000000_init/
│   │   └── migration.sql
│   ├── 20250102000000_add_products/
│   │   └── migration.sql
│   └── migration_lock.toml
├── seed.ts                 # Database seeding script
└── dev.db                  # SQLite dev database (if using SQLite)
```

**schema.prisma Example:**
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  password  String
  name      String
  role      UserRole
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

enum UserRole {
  ADMIN
  WAREHOUSE_MANAGER
  SALES_OFFICER
  ACCOUNTANT
  RECOVERY_AGENT
}
```

---

## Documentation

```
docs/
├── prd/                    # Product Requirements Documents
│   └── (PRD shards if any)
├── epics/                  # Epic definitions
│   ├── epic-1-foundation-auth-audit.md
│   ├── epic-2-import-inventory.md
│   ├── epic-3-sales-payments.md
│   ├── epic-4-dashboards-reports.md
│   ├── epic-5-account-heads-gl.md
│   ├── epic-6-advanced-inventory.md
│   ├── epic-7-recovery-management.md
│   └── epic-8-audit-advanced.md
├── stories/                # User stories
│   ├── story-1-1-project-setup.md
│   ├── story-1-2-database-schema.md
│   └── ...
├── architecture/           # Architecture documentation
│   ├── architecture.md
│   ├── tech-stack.md
│   ├── coding-standards.md
│   ├── source-tree.md     # This file
│   ├── backend-architecture.md
│   ├── front-end-architecture.md
│   ├── database-schema.md
│   ├── api-endpoints.md
│   └── audit-logging.md
├── qa/                     # QA documentation
│   └── test-plans/
└── api/                    # API documentation (optional)
    └── openapi.yaml
```

---

## Configuration Files

### Root Configuration

```
hishamtraders/
├── .env.example            # Environment variables template
├── .env                    # Local environment variables (gitignored)
├── .gitignore
├── .prettierrc             # Prettier config
├── .prettierignore
├── .eslintrc.json          # Root ESLint config
├── .eslintignore
├── tsconfig.json           # Root TypeScript config
├── pnpm-workspace.yaml     # pnpm workspace config
├── docker-compose.yml      # Docker services
└── package.json            # Root package.json
```

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### docker-compose.yml

```yaml
version: '3.8'
services:
  mysql:
    image: mysql:8
    ports:
      - '3306:3306'
    environment:
      MYSQL_ROOT_PASSWORD: password
      MYSQL_DATABASE: hisham_erp
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

### .env.example

```bash
# Database
DATABASE_URL="mysql://root:password@localhost:3306/hisham_erp"

# JWT
JWT_SECRET="your-secret-key-change-in-production"
JWT_EXPIRES_IN="24h"

# API
API_PORT=3001
API_URL="http://localhost:3001"

# Frontend
VITE_API_URL="http://localhost:3001/api"
```

---

## File Naming Conventions

### General Rules

| File Type | Convention | Example |
|-----------|-----------|---------|
| React components | PascalCase.tsx | `ProductCard.tsx` |
| TypeScript files | kebab-case.ts | `product-service.ts` |
| Test files | *.test.ts | `product-service.test.ts` |
| Type files | *.types.ts | `product.types.ts` |
| DTO files | *.dto.ts | `create-product.dto.ts` |
| Config files | kebab-case.ts | `vite.config.ts` |
| Utility files | kebab-case.ts | `date-utils.ts` |
| Folders | lowercase | `components/`, `utils/` |

### Examples

**Frontend:**
```
ProductList.tsx          # Component
useProducts.ts           # Hook
products-api.ts          # API client
product.types.ts         # Types
```

**Backend:**
```
products.controller.ts   # Controller
products.service.ts      # Service
products.repository.ts   # Repository
products.routes.ts       # Routes
create-product.dto.ts    # DTO
products.test.ts         # Tests
```

---

## Module Structure Pattern

Each feature module follows this consistent structure:

### Frontend Module
```
features/products/
├── components/          # UI components for this feature
├── pages/              # Page components (routes)
├── hooks/              # Custom hooks
├── api/                # API client functions
└── types/              # TypeScript types
```

### Backend Module
```
modules/products/
├── products.controller.ts   # HTTP layer
├── products.service.ts      # Business logic
├── products.repository.ts   # Data access
├── products.routes.ts       # Route definitions
├── dto/                     # Data transfer objects
└── products.test.ts         # Unit tests
```

---

## Import Path Aliases

Configure TypeScript path aliases for cleaner imports:

**tsconfig.json:**
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/components/*": ["src/components/*"],
      "@/features/*": ["src/features/*"],
      "@/lib/*": ["src/lib/*"],
      "@/hooks/*": ["src/hooks/*"],
      "@/utils/*": ["src/utils/*"],
      "@/types/*": ["src/types/*"],
      "@/store/*": ["src/store/*"]
    }
  }
}
```

**Usage:**
```typescript
// Instead of: import { Button } from '../../../components/ui/Button'
import { Button } from '@/components/ui/Button';

// Instead of: import { useProducts } from '../../../features/products/hooks/useProducts'
import { useProducts } from '@/features/products/hooks/useProducts';
```

---

## Quick Reference: Where to Put Files

| What | Where |
|------|-------|
| Shared UI component | `apps/web/src/components/ui/` |
| Feature-specific component | `apps/web/src/features/{feature}/components/` |
| Custom hook (shared) | `apps/web/src/hooks/` |
| Custom hook (feature) | `apps/web/src/features/{feature}/hooks/` |
| API client function | `apps/web/src/features/{feature}/api/` |
| Zustand store | `apps/web/src/store/` |
| Utility function | `apps/web/src/utils/` or `packages/shared/src/utils/` |
| TypeScript type (shared) | `packages/shared/src/types/` |
| Backend controller | `apps/api/src/modules/{feature}/{feature}.controller.ts` |
| Backend service | `apps/api/src/modules/{feature}/{feature}.service.ts` |
| Backend repository | `apps/api/src/modules/{feature}/{feature}.repository.ts` |
| Middleware | `apps/api/src/middleware/` |
| Database schema | `prisma/schema.prisma` |
| Documentation | `docs/architecture/` |

---

## Related Documentation

- [Coding Standards](./coding-standards.md)
- [Tech Stack](./tech-stack.md)
- [Backend Architecture](./backend-architecture.md)
- [Frontend Architecture](./front-end-architecture.md)

---

**Last Updated:** 2025-01-15
**Maintained By:** Winston (Architect)
**Status:** Living Document - Update as project structure evolves
