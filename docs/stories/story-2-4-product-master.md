# Story 2.4: Product Master Data Management

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2.4
**Priority:** Critical
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 1 (Foundation & Audit)
**Status:** Completed ✅

---

## User Story

**As a** warehouse manager,
**I want** to create and manage product records with all relevant details,
**So that** inventory can be tracked accurately across the system.

---

## Acceptance Criteria

1. **Database Schema:**
   - [x] Product table created: id, sku (unique), name, brand, category, costPrice, sellingPrice, reorderLevel, binLocation, status (active/inactive), createdAt, updatedAt

2. **Backend API Endpoints:**
   - [x] POST /api/products - Creates new product with validation
   - [x] GET /api/products - Returns paginated product list with filters (category, status, search by SKU/name)
   - [x] GET /api/products/:id - Returns single product with full details and current stock
   - [x] PUT /api/products/:id - Updates product (tracked in audit log)
   - [x] DELETE /api/products/:id - Soft-deletes product (status=inactive)

3. **Validation:**
   - [x] SKU must be unique and cannot be changed after creation
   - [x] Price fields validated as positive numbers
   - [x] Category field uses predefined list or free text

4. **Frontend Pages:**
   - [x] Product List page displays products in responsive table
   - [x] Add/Edit Product modal with form validation
   - [x] Product status with visual indicator (active=green, inactive=gray)
   - [x] Display current stock levels across all warehouses

5. **Authorization:**
   - [x] Only Admin and Warehouse Manager can create/edit products
   - [x] All roles can view products (read-only for Sales/Recovery/Accountant)

6. **Audit Logging:**
   - [x] Product CRUD operations logged in audit trail

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Database Schema & Migration (AC: 1)**
  - [ ] Create Prisma schema for Product model
  - [ ] Fields: id, sku, name, brand, category, costPrice, sellingPrice, reorderLevel, binLocation, status, createdAt, updatedAt
  - [ ] Add unique constraint on SKU
  - [ ] Add ProductStatus enum (ACTIVE, INACTIVE)
  - [ ] Run migration

- [ ] **Task 2: Product Repository (AC: 2)**
  - [ ] Create `products.repository.ts`
  - [ ] Implement CRUD methods with Prisma
  - [ ] Implement search/filter methods
  - [ ] Include current stock in product queries (join with Inventory)

- [ ] **Task 3: Product Service (AC: 2, 3)**
  - [ ] Create `products.service.ts`
  - [ ] Validate SKU uniqueness on create
  - [ ] Validate price fields (positive numbers)
  - [ ] Prevent SKU update after creation
  - [ ] Soft delete (set status=INACTIVE)

- [ ] **Task 4: Product Controller & Routes (AC: 2)**
  - [ ] Create `products.controller.ts`
  - [ ] Implement all CRUD endpoints
  - [ ] Add search/filter parameters
  - [ ] Create `products.routes.ts`

- [ ] **Task 5: Authorization & Audit (AC: 5, 6)**
  - [ ] Apply role guards (Admin, Warehouse Manager for write operations)
  - [ ] Add audit middleware for all CRUD operations

### Frontend Tasks

- [ ] **Task 6: Product Types & API Client (AC: 2, 4)**
  - [ ] Create `product.types.ts`
  - [ ] Create `productsService.ts`
  - [ ] Create TanStack Query hooks

- [ ] **Task 7: Product List Page (AC: 4)**
  - [ ] Create `ProductsPage.tsx`
  - [ ] Responsive table/card view
  - [ ] Search, filter, pagination
  - [ ] Stock level indicators

- [ ] **Task 8: Product Form Modal (AC: 4)**
  - [ ] Create `ProductFormModal.tsx`
  - [ ] React Hook Form + Zod validation
  - [ ] All product fields

- [ ] **Task 9: Testing**
  - [ ] Backend unit/integration tests
  - [ ] Frontend component tests

---

## Dev Notes

### Database Schema (Prisma)

```prisma
model Product {
  id            String        @id @default(cuid())
  sku           String        @unique
  name          String
  brand         String?
  category      String?
  costPrice     Decimal       @db.Decimal(10, 2)
  sellingPrice  Decimal       @db.Decimal(10, 2)
  reorderLevel  Int           @default(10)
  binLocation   String?
  status        ProductStatus @default(ACTIVE)

  createdAt     DateTime      @default(now())
  updatedAt     DateTime      @updatedAt

  poItems       POItem[]
  inventory     Inventory[]
  invoiceItems  InvoiceItem[]
  stockMovements StockMovement[]

  @@map("products")
}

enum ProductStatus {
  ACTIVE
  INACTIVE
}
```

### Key Business Rules

1. SKU is immutable after creation (cannot be changed)
2. Soft delete only (set status=INACTIVE, keep historical data)
3. Cost price and selling price must be positive
4. Reorder level default: 10 units
5. Category: predefined list (Sinks, Faucets, Toilets, Showers, Accessories) or free text

---

## Testing

### Backend Testing
- SKU uniqueness validation
- Price validation (positive numbers)
- Soft delete functionality
- Audit logging verification

### Frontend Testing
- Product form validation
- Search and filter functionality
- Role-based button visibility

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |

---

## Dev Agent Record

*To be populated by dev agent during implementation*

---

## QA Results

*To be populated by QA agent after testing*
