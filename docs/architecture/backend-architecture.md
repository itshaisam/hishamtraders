# Hisham Traders ERP - Backend Architecture Document

**Version:** 1.0
**Last Updated:** 2025-01-15
**Author:** Winston (Architect)

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-01-15 | 1.0 | Initial backend architecture | Winston (Architect) |

---

## Table of Contents

1. [Introduction](#introduction)
2. [Backend Tech Stack](#backend-tech-stack)
3. [Project Structure](#project-structure)
4. [Layered Architecture](#layered-architecture)
5. [API Design Patterns](#api-design-patterns)
6. [Database Access Layer](#database-access-layer)
7. [Middleware Stack](#middleware-stack)
8. [Authentication & Authorization](#authentication--authorization)
9. [Error Handling](#error-handling)
10. [Logging Strategy](#logging-strategy)
11. [Backend Developer Standards](#backend-developer-standards)

---

## Introduction

This document outlines the backend architecture for the Hisham Traders ERP system. It details the Express.js + TypeScript + Prisma stack implementation, following a layered architecture pattern with clear separation of concerns.

**Relationship to Main Architecture:**
This document should be used in conjunction with [architecture.md](./architecture.md) and [front-end-architecture.md](./front-end-architecture.md). Core technology decisions are defined in the main architecture document.

**Architectural Style:** Monolithic backend with clear service boundaries (ready for future microservices migration)

**Key Principles:**
- **Layered architecture** (Routes → Controllers → Services → Repositories)
- **Dependency injection** for testability
- **Type safety** throughout the stack
- **Automatic audit logging** from Day 1
- **RESTful API** design

---

## Backend Tech Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|-----------|---------|---------|-----------|
| Runtime | Node.js | 20 LTS | JavaScript runtime | LTS version, stable, wide ecosystem |
| Language | TypeScript | 5.3+ | Type safety | Prevents runtime errors, better IDE support |
| Framework | Express.js | Latest | Web framework | Simple, flexible, proven for REST APIs |
| ORM | Prisma | 5+ | Database access | Type-safe, migrations, Prisma Studio |
| Validation | Zod | Latest | Schema validation | Shared with frontend, type inference |
| Authentication | JWT + bcrypt | Latest | Auth tokens + password hashing | Stateless auth, industry standard hashing |
| Logging | Winston | Latest | Application logging | Multiple transports, structured logging |
| Process Manager | PM2 | Latest | Production process management | Auto-restart, cluster mode, monitoring |

---

## Project Structure

```
apps/api/                           # Express backend application
├── src/
│   ├── config/                     # Configuration
│   │   ├── database.ts            # Database connection config
│   │   ├── auth.ts                # JWT config
│   │   ├── logger.ts              # Winston logger config
│   │   └── env.ts                 # Environment variables
│   ├── middleware/                 # Express middleware
│   │   ├── auth.middleware.ts     # JWT authentication
│   │   ├── authorization.middleware.ts  # Role-based access control
│   │   ├── audit.middleware.ts    # Automatic audit logging
│   │   ├── validation.middleware.ts  # Request validation
│   │   ├── error.middleware.ts    # Global error handler
│   │   └── index.ts
│   ├── modules/                    # Feature modules (domain-driven)
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.routes.ts
│   │   │   ├── dto/               # Data Transfer Objects
│   │   │   │   ├── login.dto.ts
│   │   │   │   └── register.dto.ts
│   │   │   └── auth.test.ts
│   │   ├── users/
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── users.repository.ts
│   │   │   ├── users.routes.ts
│   │   │   ├── dto/
│   │   │   └── users.test.ts
│   │   ├── products/
│   │   ├── inventory/
│   │   ├── suppliers/
│   │   ├── purchase-orders/
│   │   ├── clients/
│   │   ├── invoices/
│   │   ├── payments/
│   │   ├── reports/
│   │   └── audit-logs/
│   ├── shared/                     # Shared utilities
│   │   ├── types/                 # Shared TypeScript types
│   │   │   ├── api-response.types.ts
│   │   │   ├── pagination.types.ts
│   │   │   └── common.types.ts
│   │   ├── utils/                 # Utility functions
│   │   │   ├── password.util.ts   # Password hashing
│   │   │   ├── jwt.util.ts        # JWT operations
│   │   │   ├── pagination.util.ts
│   │   │   └── validators.util.ts
│   │   ├── constants/             # Application constants
│   │   │   ├── roles.constants.ts
│   │   │   ├── status.constants.ts
│   │   │   └── errors.constants.ts
│   │   └── decorators/            # Custom decorators (if needed)
│   ├── prisma/                     # Prisma ORM
│   │   ├── schema.prisma          # Database schema
│   │   ├── migrations/            # Migration files
│   │   └── seed.ts                # Database seeding
│   ├── routes/                     # Route aggregation
│   │   └── index.ts               # Main router
│   ├── app.ts                      # Express app setup
│   ├── server.ts                   # Server entry point
│   └── types/                      # Global type declarations
│       └── express.d.ts           # Express type extensions
├── tests/                          # Integration tests
│   ├── setup.ts
│   └── integration/
│       ├── auth.integration.test.ts
│       └── products.integration.test.ts
├── .env.example                    # Environment template
├── .eslintrc.js                    # ESLint config
├── .prettierrc                     # Prettier config
├── jest.config.js                  # Jest test config
├── package.json
├── tsconfig.json                   # TypeScript config
└── README.md
```

**Key Structure Decisions:**
- **Module-based organization** (by feature domain, not by layer type)
- **Each module** contains controller, service, repository, routes, DTOs, and tests
- **Clear separation** of concerns within each layer
- **Prisma schema** centralized but accessed through repositories

---

## Layered Architecture

### Architecture Layers

```
┌─────────────────────────────────────────┐
│           CLIENT (React)                 │
└────────────────┬────────────────────────┘
                 │ HTTP/JSON
┌────────────────▼────────────────────────┐
│         ROUTES LAYER                     │
│  - Route definitions                     │
│  - HTTP method mapping                   │
│  - Route-level middleware                │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│       MIDDLEWARE LAYER                   │
│  - Authentication (JWT)                  │
│  - Authorization (RBAC)                  │
│  - Validation (Zod schemas)              │
│  - Audit logging                         │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│       CONTROLLER LAYER                   │
│  - HTTP request/response handling        │
│  - Input validation                      │
│  - Response formatting                   │
│  - Error handling                        │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│        SERVICE LAYER                     │
│  - Business logic                        │
│  - Transaction management                │
│  - Cross-module orchestration            │
│  - Business rule validation              │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      REPOSITORY LAYER                    │
│  - Database operations (CRUD)            │
│  - Query building                        │
│  - Data mapping                          │
└────────────────┬────────────────────────┘
                 │
┌────────────────▼────────────────────────┐
│      DATABASE (MySQL 8+)                 │
└──────────────────────────────────────────┘
```

### Layer Responsibilities

**1. Routes Layer**
- Define API endpoints
- Map HTTP methods to controller methods
- Apply route-specific middleware
- Document API structure

**2. Middleware Layer**
- Execute pre-processing logic
- Validate requests
- Authenticate users
- Authorize access
- Log requests/responses

**3. Controller Layer**
- Handle HTTP concerns (req/res)
- Extract and validate input
- Call service layer
- Format responses
- Handle HTTP-specific errors

**4. Service Layer**
- Implement business logic
- Orchestrate multiple repositories
- Manage transactions
- Enforce business rules
- Independent of HTTP concerns

**5. Repository Layer**
- Abstract database operations
- Execute queries via Prisma
- Handle data mapping
- Provide clean data interface

---

## API Design Patterns

### Standard Response Format

All API responses follow this structure:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
    pagination?: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}
```

### Controller Template

```typescript
import { Request, Response, NextFunction } from 'express';
import { ProductService } from './product.service';
import { CreateProductDto, UpdateProductDto } from './dto';
import { ApiResponse } from '@/shared/types/api-response.types';
import { logger } from '@/config/logger';

export class ProductController {
  constructor(private productService: ProductService) {}

  /**
   * Get all products
   * GET /api/v1/products
   */
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const { page = 1, limit = 10, ...filters } = req.query;

      const result = await this.productService.getAll({
        page: Number(page),
        limit: Number(limit),
        filters,
      });

      const response: ApiResponse<any> = {
        success: true,
        data: result.data,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
          pagination: result.pagination,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error); // Pass to error middleware
    }
  }

  /**
   * Get product by ID
   * GET /api/v1/products/:id
   */
  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const product = await this.productService.getById(id);

      const response: ApiResponse<any> = {
        success: true,
        data: product,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Create product
   * POST /api/v1/products
   */
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const dto: CreateProductDto = req.body;
      const product = await this.productService.create(dto, req.user!);

      const response: ApiResponse<any> = {
        success: true,
        data: product,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      };

      res.status(201).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Update product
   * PUT /api/v1/products/:id
   */
  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const dto: UpdateProductDto = req.body;
      const product = await this.productService.update(id, dto, req.user!);

      const response: ApiResponse<any> = {
        success: true,
        data: product,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Delete product
   * DELETE /api/v1/products/:id
   */
  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      await this.productService.delete(id, req.user!);

      const response: ApiResponse<null> = {
        success: true,
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      };

      res.status(200).json(response);
    } catch (error) {
      next(error);
    }
  }
}
```

### Service Template

```typescript
import { PrismaClient, Product } from '@prisma/client';
import { ProductRepository } from './product.repository';
import { CreateProductDto, UpdateProductDto } from './dto';
import { NotFoundError, ValidationError } from '@/shared/errors';
import { logger } from '@/config/logger';

export class ProductService {
  constructor(
    private productRepository: ProductRepository,
    private prisma: PrismaClient
  ) {}

  /**
   * Get all products with pagination and filters
   */
  async getAll(options: {
    page: number;
    limit: number;
    filters?: any;
  }) {
    const { page, limit, filters } = options;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      this.productRepository.findMany({
        skip,
        take: limit,
        where: this.buildFilters(filters),
        orderBy: { createdAt: 'desc' },
      }),
      this.productRepository.count({ where: this.buildFilters(filters) }),
    ]);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Get product by ID
   */
  async getById(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);

    if (!product) {
      throw new NotFoundError(`Product with ID ${id} not found`);
    }

    return product;
  }

  /**
   * Create new product
   */
  async create(dto: CreateProductDto, user: any): Promise<Product> {
    // Business logic validation
    await this.validateUniqueSku(dto.sku);

    // Create product
    const product = await this.productRepository.create({
      ...dto,
      createdBy: user.id,
    });

    logger.info('Product created', { productId: product.id, userId: user.id });

    return product;
  }

  /**
   * Update product
   */
  async update(id: string, dto: UpdateProductDto, user: any): Promise<Product> {
    // Check if product exists
    await this.getById(id);

    // Validate SKU if changed
    if (dto.sku) {
      await this.validateUniqueSku(dto.sku, id);
    }

    // Update product
    const product = await this.productRepository.update(id, {
      ...dto,
      updatedBy: user.id,
    });

    logger.info('Product updated', { productId: id, userId: user.id });

    return product;
  }

  /**
   * Delete product (soft delete)
   */
  async delete(id: string, user: any): Promise<void> {
    // Check if product exists
    await this.getById(id);

    // Check if product is used in any invoices
    const usageCount = await this.checkProductUsage(id);
    if (usageCount > 0) {
      throw new ValidationError(
        'Cannot delete product that is used in invoices. Deactivate instead.'
      );
    }

    // Soft delete
    await this.productRepository.update(id, {
      status: 'inactive',
      deletedBy: user.id,
      deletedAt: new Date(),
    });

    logger.info('Product deleted', { productId: id, userId: user.id });
  }

  /**
   * Private helper methods
   */
  private buildFilters(filters?: any) {
    if (!filters) return {};

    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.category) {
      where.category = filters.category;
    }

    if (filters.search) {
      where.OR = [
        { name: { contains: filters.search, mode: 'insensitive' } },
        { sku: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  private async validateUniqueSku(sku: string, excludeId?: string) {
    const existing = await this.productRepository.findBySku(sku);

    if (existing && existing.id !== excludeId) {
      throw new ValidationError(`Product with SKU ${sku} already exists`);
    }
  }

  private async checkProductUsage(productId: string): Promise<number> {
    return this.prisma.invoiceItem.count({
      where: { productId },
    });
  }
}
```

### Repository Template

```typescript
import { PrismaClient, Product, Prisma } from '@prisma/client';

export class ProductRepository {
  constructor(private prisma: PrismaClient) {}

  async findMany(params: {
    skip?: number;
    take?: number;
    where?: Prisma.ProductWhereInput;
    orderBy?: Prisma.ProductOrderByWithRelationInput;
    include?: Prisma.ProductInclude;
  }): Promise<Product[]> {
    return this.prisma.product.findMany(params);
  }

  async findById(id: string, include?: Prisma.ProductInclude): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { id },
      include,
    });
  }

  async findBySku(sku: string): Promise<Product | null> {
    return this.prisma.product.findUnique({
      where: { sku },
    });
  }

  async create(data: Prisma.ProductCreateInput): Promise<Product> {
    return this.prisma.product.create({ data });
  }

  async update(id: string, data: Prisma.ProductUpdateInput): Promise<Product> {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<Product> {
    return this.prisma.product.delete({
      where: { id },
    });
  }

  async count(params: { where?: Prisma.ProductWhereInput }): Promise<number> {
    return this.prisma.product.count(params);
  }
}
```

### Routes Template

```typescript
import { Router } from 'express';
import { ProductController } from './product.controller';
import { ProductService } from './product.service';
import { ProductRepository } from './product.repository';
import { prisma } from '@/config/database';
import { authMiddleware } from '@/middleware/auth.middleware';
import { authorizeRoles } from '@/middleware/authorization.middleware';
import { validateRequest } from '@/middleware/validation.middleware';
import { createProductSchema, updateProductSchema } from './dto';

const router = Router();

// Initialize dependencies
const productRepository = new ProductRepository(prisma);
const productService = new ProductService(productRepository, prisma);
const productController = new ProductController(productService);

// Routes
router.get(
  '/',
  authMiddleware,
  productController.getAll.bind(productController)
);

router.get(
  '/:id',
  authMiddleware,
  productController.getById.bind(productController)
);

router.post(
  '/',
  authMiddleware,
  authorizeRoles(['ADMIN', 'WAREHOUSE_MANAGER']),
  validateRequest(createProductSchema),
  productController.create.bind(productController)
);

router.put(
  '/:id',
  authMiddleware,
  authorizeRoles(['ADMIN', 'WAREHOUSE_MANAGER']),
  validateRequest(updateProductSchema),
  productController.update.bind(productController)
);

router.delete(
  '/:id',
  authMiddleware,
  authorizeRoles(['ADMIN']),
  productController.delete.bind(productController)
);

export default router;
```

---

## Database Access Layer

### Prisma Configuration

**Connection String:**
```typescript
// config/database.ts
import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'stdout' },
    { level: 'warn', emit: 'stdout' },
  ],
});

// Log queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug('Query:', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
    });
  });
}

export { prisma };
```

**Environment Variables:**
```bash
# Database
DATABASE_URL="mysql://root:password@localhost:3306/hisham_erp"
DATABASE_POOL_SIZE=10
```

### Repository Pattern Guidelines

**DO:**
- ✅ Keep repositories focused on data access only
- ✅ Return Prisma types directly (Product, Invoice, etc.)
- ✅ Use Prisma's type-safe query building
- ✅ Handle database errors appropriately
- ✅ Use transactions for multi-step operations

**DON'T:**
- ❌ Put business logic in repositories
- ❌ Return custom types (use Prisma types)
- ❌ Catch and swallow errors
- ❌ Use raw SQL unless absolutely necessary

---

## Middleware Stack

### Middleware Execution Order

```typescript
// app.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { requestIdMiddleware } from './middleware/request-id.middleware';
import { authMiddleware } from './middleware/auth.middleware';
import { auditMiddleware } from './middleware/audit.middleware';
import { errorMiddleware } from './middleware/error.middleware';
import routes from './routes';

const app = express();

// 1. Security middleware (first)
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

// 2. Request parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// 3. Request ID (for logging/tracing)
app.use(requestIdMiddleware);

// 4. HTTP logging
app.use(morgan('combined', { stream: logger.stream }));

// 5. Routes (with route-specific middleware)
app.use('/api/v1', routes);

// 6. Error handling (last)
app.use(errorMiddleware);

export default app;
```

### Authentication Middleware

```typescript
// middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UnauthorizedError } from '@/shared/errors';
import { config } from '@/config/env';

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('No token provided');
    }

    const token = authHeader.substring(7);

    // Verify JWT
    const decoded = jwt.verify(token, config.jwt.secret) as any;

    // Attach user to request
    req.user = {
      id: decoded.userId,
      email: decoded.email,
      role: decoded.role,
    };

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      next(new UnauthorizedError('Invalid token'));
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new UnauthorizedError('Token expired'));
    } else {
      next(error);
    }
  }
};
```

### Authorization Middleware

```typescript
// middleware/authorization.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ForbiddenError } from '@/shared/errors';

export const authorizeRoles = (allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new ForbiddenError('User not authenticated'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. Required roles: ${allowedRoles.join(', ')}`
        )
      );
    }

    next();
  };
};
```

### Audit Middleware

```typescript
// middleware/audit.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { prisma } from '@/config/database';
import { logger } from '@/config/logger';

export const auditMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Only audit state-changing operations
  if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    return next();
  }

  // Store original res.json
  const originalJson = res.json.bind(res);

  // Override res.json
  res.json = function (data: any) {
    // Only log successful operations (2xx status codes)
    if (res.statusCode >= 200 && res.statusCode < 300) {
      // Log asynchronously (don't block response)
      logAudit({
        userId: req.user?.id,
        action: req.method,
        entityType: extractEntityType(req.path),
        entityId: data?.data?.id || req.params.id,
        timestamp: new Date(),
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        changedFields: extractChangedFields(req.body, data),
      }).catch((error) => {
        logger.error('Audit log failed:', error);
      });
    }

    // Call original res.json
    return originalJson(data);
  };

  next();
};

async function logAudit(data: any) {
  await prisma.auditLog.create({ data });
}

function extractEntityType(path: string): string {
  // Extract entity type from path (e.g., /api/v1/products → Product)
  const parts = path.split('/');
  const entity = parts[parts.length - 1];
  return entity.charAt(0).toUpperCase() + entity.slice(1, -1); // Singular
}

function extractChangedFields(requestBody: any, responseData: any): any {
  // Compare request and response to extract changed fields
  // Implementation depends on requirements
  return requestBody;
}
```

### Validation Middleware

```typescript
// middleware/validation.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { ValidationError } from '@/shared/errors';

export const validateRequest = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error: any) {
      next(new ValidationError('Validation failed', error.errors));
    }
  };
};
```

---

## Authentication & Authorization

### JWT Token Structure

```typescript
interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  iat: number;  // Issued at
  exp: number;  // Expires at
}
```

### Login Flow

```typescript
// auth.service.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '@/config/database';
import { UnauthorizedError } from '@/shared/errors';
import { config } from '@/config/env';

export class AuthService {
  async login(email: string, password: string) {
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || user.status !== 'active') {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    // Generate JWT
    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role.name,
      },
      config.jwt.secret,
      {
        expiresIn: config.jwt.expiresIn, // 24 hours
      }
    );

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    return {
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role.name,
      },
    };
  }
}
```

### Password Hashing

```typescript
// utils/password.util.ts
import bcrypt from 'bcrypt';

const SALT_ROUNDS = 10;

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};
```

---

## Error Handling

### Custom Error Classes

```typescript
// shared/errors/index.ts
export class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code: string,
    public details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string) {
    super(message, 401, 'UNAUTHORIZED', null);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string) {
    super(message, 403, 'FORBIDDEN', null);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string) {
    super(message, 404, 'NOT_FOUND', null);
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT', null);
  }
}

export class InternalServerError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 500, 'INTERNAL_SERVER_ERROR', details);
  }
}
```

### Global Error Handler

```typescript
// middleware/error.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@/shared/errors';
import { logger } from '@/config/logger';
import { Prisma } from '@prisma/client';

export const errorMiddleware = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Error occurred:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id,
  });

  // Handle known application errors
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      error: {
        code: error.code,
        message: error.message,
        details: error.details,
      },
      meta: {
        timestamp: new Date().toISOString(),
        requestId: req.id,
      },
    });
  }

  // Handle Prisma errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return handlePrismaError(error, res, req);
  }

  // Handle unknown errors (500)
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: 'An unexpected error occurred',
    },
    meta: {
      timestamp: new Date().toISOString(),
      requestId: req.id,
    },
  });
};

function handlePrismaError(
  error: Prisma.PrismaClientKnownRequestError,
  res: Response,
  req: Request
) {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      return res.status(409).json({
        success: false,
        error: {
          code: 'DUPLICATE_RECORD',
          message: 'A record with this value already exists',
          details: error.meta,
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });

    case 'P2025':
      // Record not found
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Record not found',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });

    default:
      return res.status(500).json({
        success: false,
        error: {
          code: 'DATABASE_ERROR',
          message: 'Database operation failed',
        },
        meta: {
          timestamp: new Date().toISOString(),
          requestId: req.id,
        },
      });
  }
}
```

---

## Logging Strategy

### Winston Configuration

```typescript
// config/logger.ts
import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  defaultMeta: { service: 'hisham-traders-api' },
  transports: [
    // Error logs
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    // Combined logs
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 10485760,
      maxFiles: 10,
    }),
  ],
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

// Morgan stream for HTTP logging
logger.stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

export { logger };
```

### Logging Best Practices

**DO:**
- ✅ Log all errors with context (user, request, etc.)
- ✅ Use appropriate log levels (error, warn, info, debug)
- ✅ Include correlation IDs for request tracing
- ✅ Log business-critical operations
- ✅ Rotate log files to manage disk space

**DON'T:**
- ❌ Log sensitive data (passwords, tokens, PII)
- ❌ Log excessive details in production
- ❌ Use console.log() (use logger instead)
- ❌ Log full request/response bodies (only metadata)

---

## Backend Developer Standards

### Critical Coding Rules

**✅ DO:**
- Use layered architecture (routes → controllers → services → repositories)
- Keep controllers thin (only HTTP concerns)
- Put business logic in services
- Use Prisma through repositories
- Use custom error classes
- Validate input with Zod schemas
- Use TypeScript strict mode
- Write unit tests for services
- Use transactions for multi-step operations
- Log important operations

**❌ DON'T:**
- Put business logic in controllers
- Access Prisma directly in controllers
- Use `any` type
- Ignore errors or use empty catch blocks
- Store passwords in plain text
- Hardcode secrets or configuration
- Use `console.log()` for logging
- Skip input validation
- Return database errors directly to clients
- Use synchronous operations in route handlers

### Quick Reference

**Common Commands:**
```bash
# Start development server
pnpm dev

# Run type checking
pnpm type-check

# Run linting
pnpm lint

# Run tests
pnpm test

# Run Prisma migrations
pnpm prisma migrate dev

# Generate Prisma client
pnpm prisma generate

# Seed database
pnpm prisma db seed

# Build for production
pnpm build

# Start production server
pnpm start
```

**Key Patterns:**
```typescript
// Service with transaction
async createInvoice(dto: CreateInvoiceDto) {
  return this.prisma.$transaction(async (tx) => {
    const invoice = await tx.invoice.create({...});
    await tx.inventory.update({...});
    return invoice;
  });
}

// Error handling
try {
  await service.operation();
} catch (error) {
  if (error instanceof NotFoundError) {
    // Handle not found
  }
  throw error; // Re-throw for middleware
}

// Pagination
const skip = (page - 1) * limit;
const [data, total] = await Promise.all([
  repository.findMany({ skip, take: limit }),
  repository.count(),
]);
```

---

**Document Version:** 1.0
**Last Updated:** 2025-01-15
**Status:** Approved for Development
