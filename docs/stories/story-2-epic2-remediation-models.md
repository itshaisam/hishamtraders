# Story: Epic 2 Remediation - Add Missing Reference Models

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2-REMEDIATION-MODELS
**Priority:** Critical (Blocker for Production)
**Estimated Effort:** 25-33 hours (Phase 1-3: 15-20 hours, Phase 4 Testing: 10-13 hours later)
**Dependencies:** Stories 2.1, 2.2, 2.4 (already implemented)
**Assigned To:** James (Developer)
**Status:** Phase 1-3 Complete ✅ | Ready for Phase 4 Testing

---

## Overview

Stories 2.1 (Supplier Management), 2.2 (Purchase Order Creation), and 2.4 (Product Master Data) were implemented with **critical data model gaps**. Multiple fields that should use SELECT dropdowns with proper database models are implemented as free-text input fields, creating data inconsistency and poor user experience.

**Examples of Issues:**
- Supplier `country` = Text input (should be Country dropdown)
- Supplier `paymentTerms` = Textarea (should be PaymentTerm select)
- Product `category` = Text input with hardcoded filter array (should be ProductCategory dropdown)
- Product `brand` = Text input (should be Brand combobox)
- Product `binLocation` = Text input (should be BinLocation select)

**Additionally:** Zero test files exist. Testing will be implemented in Phase 4 after models are complete.

---

## User Story

**As a** Product Manager
**I want** all lookup fields to use proper database models with dropdown selectors
**So that** data is consistent, maintainable, and provides better user experience.

---

## Acceptance Criteria

### Phase 1: Database Models ✅ COMPLETE

1. **Create 4 New Reference Models:** ✅
   - [x] `Country` model with fields: id, code, name, active
   - [x] `PaymentTerm` model with fields: id, name, description, days (nullable)
   - [x] `ProductCategory` model with fields: id, name, description, active
   - [x] `Brand` model with fields: id, name, country (nullable)

2. **Update Existing Models:** ✅
   - [x] `Supplier` model: Add `countryId` and `paymentTermId` foreign keys
   - [x] `Product` model: Add `categoryId` and `brandId` foreign keys
   - [x] All foreign key relationships properly defined

3. **Database Migration:** ✅
   - [x] Create Prisma migration for all new models
   - [x] Migration runs without errors
   - [x] All new tables created in database
   - **Migration File:** `prisma/migrations/20251117_add_reference_models/migration.sql`
   - **Status:** Successfully deployed with `prisma migrate deploy`

4. **Seed Data:** ✅
   - [x] 15 countries added (China, Pakistan, UAE, India, USA, Germany, Italy, Spain, France, Turkey, Thailand, Vietnam, Japan, South Korea, Singapore)
   - [x] 8 standard payment terms (Net 30, Net 60, Net 90, COD, Letter of Credit, 50% Advance, Full Advance, 30% Advance)
   - [x] 5 product categories (Sinks, Faucets, Toilets, Showers, Accessories)
   - [x] 7 sample brands (SuperSink, EliteFaucet, ClassicToilet, DeluxeShower, PremiumAccessories, AquaFlow, LuxBath)
   - [x] 3 sample suppliers with country & payment term FKs (Beijing Ceramics Co., Karachi Fixtures Ltd., Shanghai Bathroom Supplies)
   - [x] 6 sample products with category & brand FKs (2 sinks, 2 faucets, 2 toilets)
   - **Seed Execution:** `pnpm db:seed` completed successfully on 2025-11-17
   - **Output Log:**
     ```
     ✓ Roles created
     ✓ Default admin user created
     ✓ Countries created (15 total)
     ✓ Payment terms created (8 total)
     ✓ Product categories created (5 total)
     ✓ Brands created (7 total)
     ✓ Sample suppliers created (3 total)
     ✓ Sample products created (6 total)
     ✓ Reference data seeded successfully
     ✓ Seed completed successfully!
     ```

### Phase 2: Backend APIs ✅ COMPLETE

5. **Create New API Modules (4 modules):** ✅
   - [x] `/countries` - GET endpoint (list all countries)
   - [x] `/payment-terms` - GET endpoint (list all payment terms)
   - [x] `/categories` - GET endpoint + CRUD for managing categories (POST, PUT, DELETE for Admin)
   - [x] `/brands` - GET endpoint + CRUD for managing brands (POST, PUT, DELETE for Admin)
   - **Files Created:**
     - Countries: controller, service, repository, routes (3 files)
     - Payment Terms: controller, service, repository, routes (3 files)
     - Categories: controller, service, repository, routes, DTO files (6 files)
     - Brands: controller, service, repository, routes, DTO files (6 files)

6. **Update Existing DTOs:** ✅
   - [x] `create-supplier.dto.ts`: `country` → `countryId`, `paymentTerms` → `paymentTermId`
   - [x] `update-supplier.dto.ts`: Same changes
   - [x] `create-product.dto.ts`: `category` → `categoryId`, `brand` → `brandId`
   - [x] `update-product.dto.ts`: Same changes

7. **Update Services:** ✅
   - [x] Supplier repository includes `country` and `paymentTerm` relations in all queries (findAll, findById, findByName, create, update)
   - [x] Product repository includes `category` and `brand` relations in all queries (findAll, findById, findBySku, create, update)
   - [x] Routes registered in main API server (apps/api/src/index.ts)
   - **API Endpoints Available:**
     ```
     GET  /api/v1/countries        (all authenticated users)
     GET  /api/v1/countries/:id    (all authenticated users)

     GET  /api/v1/payment-terms    (all authenticated users)
     GET  /api/v1/payment-terms/:id (all authenticated users)

     GET  /api/v1/categories       (all authenticated users)
     POST /api/v1/categories       (admin only)
     PUT  /api/v1/categories/:id   (admin only)
     DELETE /api/v1/categories/:id (admin only)

     GET  /api/v1/brands           (all authenticated users)
     POST /api/v1/brands           (admin only)
     PUT  /api/v1/brands/:id       (admin only)
     DELETE /api/v1/brands/:id     (admin only)
     ```
   - **Status:** API builds successfully with `pnpm -F @hishamtraders/api build` ✅

### Phase 3: Frontend UI ✅ COMPLETE

8. **Create Custom Hooks (4 hooks):** ✅
   - [x] `useCountries()` - Fetches countries list with React Query
   - [x] `usePaymentTerms()` - Fetches payment terms list with React Query
   - [x] `useCategories()` - Fetches categories list with React Query
   - [x] `useBrands()` - Fetches brands list with React Query
   - **Files Created:**
     - apps/web/src/hooks/useCountries.ts - Includes `useCountriesForSelect()` helper
     - apps/web/src/hooks/usePaymentTerms.ts - Includes `usePaymentTermsForSelect()` helper
     - apps/web/src/hooks/useCategories.ts - Includes `useCategoriesForSelect()` helper
     - apps/web/src/hooks/useBrands.ts - Includes `useBrandsForSelect()` helper
   - **Features:**
     - All hooks use React Query with 5-minute staleTime and 30-minute cacheTime
     - Helper functions (`*ForSelect`) format data for Combobox component
     - Proper TypeScript interfaces for all response types

9. **Update SupplierForm.tsx:** ✅
   - [x] Replace `country` text input with Combobox dropdown
   - [x] Replace `paymentTerms` textarea with Combobox dropdown
   - [x] Updated schema: `country` → `countryId`, `paymentTerms` → `paymentTermId`
   - [x] Form submission uses `countryId` and `paymentTermId` instead of text
   - [x] Added loading states for both reference data hooks
   - [x] Integrated useCountriesForSelect() and usePaymentTermsForSelect()

10. **Update ProductForm.tsx:** ✅
    - [x] Replace `category` text input with Combobox dropdown
    - [x] Replace `brand` text input with Combobox dropdown
    - [x] Updated schema: `category` → `categoryId`, `brand` → `brandId`
    - [x] Form submission uses `categoryId` and `brandId` instead of text
    - [x] Added loading states for both reference data hooks
    - [x] Integrated useBrandsForSelect() and useCategoriesForSelect()
    - [x] Both dropdowns searchable with Combobox component

11. **Update ProductsPage.tsx:** ✅
    - [x] Removed hardcoded `PRODUCT_CATEGORIES` array
    - [x] Fetch categories dynamically from API via `useCategories()`
    - [x] Category filter options populated from database dynamically
    - [x] useMemo optimization to prevent unnecessary re-renders
    - [x] Added loading state for category filter
    - **Status:** Web app builds successfully with `pnpm -F @hishamtraders/web build` ✅

### Phase 4: Testing (After Phase 1-3 Complete)

12. **Backend Tests (~15-20 test files):**
    - [ ] Supplier module: service, repository, controller tests
    - [ ] Product module: service, repository, controller tests
    - [ ] Purchase Order module: service, repository, controller tests
    - [ ] Validation logic tests
    - [ ] Soft delete tests
    - [ ] Audit logging tests

13. **Frontend Tests (~10 test files):**
    - [ ] SupplierForm component tests
    - [ ] ProductForm component tests
    - [ ] SuppliersPage component tests
    - [ ] ProductsPage component tests
    - [ ] PurchaseOrdersPage component tests
    - [ ] Hook tests

14. **Test Infrastructure:**
    - [ ] Test database configuration
    - [ ] Test data factories
    - [ ] Test coverage >80%

---

## Implementation Plan

### Phase 1: Create Missing Reference Models (8-10 hours)

#### Task 1.1: Update Prisma Schema
**File:** `prisma/schema.prisma`

Add 4 new models before the Supplier model:

```prisma
// Reference/Lookup Tables

model Country {
  id        String    @id @default(cuid())
  code      String    @unique  // "CN", "PK", "AE", "US", etc.
  name      String    @unique  // "China", "Pakistan", "UAE", "United States"
  active    Boolean   @default(true)

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  suppliers Supplier[]

  @@map("countries")
}

model PaymentTerm {
  id          String    @id @default(cuid())
  name        String    @unique  // "Net 30", "50% Advance + 50% on Delivery", etc.
  description String?
  days        Int?      // For calculating due dates (30, 60, etc.)
  active      Boolean   @default(true)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  suppliers   Supplier[]

  @@map("payment_terms")
}

model ProductCategory {
  id          String    @id @default(cuid())
  name        String    @unique  // "Sinks", "Faucets", "Toilets", "Showers", "Accessories"
  description String?
  active      Boolean   @default(true)

  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  products    Product[]

  @@map("product_categories")
}

model Brand {
  id        String    @id @default(cuid())
  name      String    @unique
  country   String?   // Brand origin country (optional)
  active    Boolean   @default(true)

  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  products  Product[]

  @@map("brands")
}
```

Update Supplier model:

```prisma
model Supplier {
  id            String   @id @default(cuid())
  name          String   @unique

  // NEW: Foreign keys to reference tables
  countryId     String?
  paymentTermId String?

  contactPerson String?
  email         String?  @unique
  phone         String?
  address       String?  @db.Text
  status        SupplierStatus @default(ACTIVE)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  country       Country?      @relation(fields: [countryId], references: [id])
  paymentTerm   PaymentTerm?  @relation(fields: [paymentTermId], references: [id])
  purchaseOrders PurchaseOrder[]

  @@map("suppliers")
}
```

Update Product model:

```prisma
model Product {
  id            String   @id @default(cuid())
  sku           String   @unique
  name          String

  // NEW: Foreign keys to reference tables
  categoryId    String?
  brandId       String?

  description   String?  @db.Text
  unitPrice     Decimal  @default(0)
  reorderLevel  Int      @default(10)
  binLocation   String?
  status        ProductStatus @default(ACTIVE)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  // Relations
  category      ProductCategory? @relation(fields: [categoryId], references: [id])
  brand         Brand?           @relation(fields: [brandId], references: [id])
  poItems       PurchaseOrderItem[]

  @@map("products")
}
```

#### Task 1.2: Create Prisma Migration
```bash
npx prisma migrate dev --name add_reference_models
```

**Expected output:**
- Creates 4 new tables: countries, payment_terms, product_categories, brands
- Adds foreign key columns to suppliers and products tables
- No data loss (fresh database)

#### Task 1.3: Update Seed Data
**File:** `prisma/seed.ts`

Add reference data and sample records:

```typescript
// ... existing code ...

async function seedReferenceData(prisma: PrismaClient) {
  console.log('Seeding reference data...');

  // Countries
  const countries = await prisma.country.createMany({
    data: [
      { code: 'CN', name: 'China' },
      { code: 'PK', name: 'Pakistan' },
      { code: 'AE', name: 'United Arab Emirates' },
      { code: 'IN', name: 'India' },
      { code: 'US', name: 'United States' },
      { code: 'DE', name: 'Germany' },
      { code: 'IT', name: 'Italy' },
      { code: 'ES', name: 'Spain' },
      { code: 'FR', name: 'France' },
      { code: 'TR', name: 'Turkey' },
      // Add more countries as needed
    ],
    skipDuplicates: true,
  });

  // Payment Terms
  const paymentTerms = await prisma.paymentTerm.createMany({
    data: [
      { name: 'Net 30', days: 30 },
      { name: 'Net 60', days: 60 },
      { name: 'Cash on Delivery', days: 0 },
      { name: 'Letter of Credit' },
      { name: '50% Advance + 50% on Delivery', days: 30 },
      { name: 'Full Payment in Advance' },
    ],
    skipDuplicates: true,
  });

  // Product Categories
  const categories = await prisma.productCategory.createMany({
    data: [
      { name: 'Sinks' },
      { name: 'Faucets' },
      { name: 'Toilets' },
      { name: 'Showers' },
      { name: 'Accessories' },
    ],
    skipDuplicates: true,
  });

  // Brands
  const brands = await prisma.brand.createMany({
    data: [
      { name: 'SuperSink', country: 'China' },
      { name: 'EliteFaucet', country: 'Pakistan' },
      { name: 'ClassicToilet', country: 'China' },
      { name: 'DeluxeShower', country: 'China' },
      { name: 'PremiumAccessories', country: 'Germany' },
    ],
    skipDuplicates: true,
  });

  console.log('Reference data seeded successfully');

  // Create sample suppliers using the reference data
  const chinaCountry = await prisma.country.findUnique({ where: { code: 'CN' } });
  const net30 = await prisma.paymentTerm.findUnique({ where: { name: 'Net 30' } });

  const suppliers = await prisma.supplier.createMany({
    data: [
      {
        name: 'Beijing Ceramics Co.',
        countryId: chinaCountry?.id,
        paymentTermId: net30?.id,
        contactPerson: 'Wang Chen',
        email: 'wang@ceramics.cn',
        phone: '+86-10-1234-5678',
        address: 'Beijing, China',
      },
      // Add more suppliers
    ],
    skipDuplicates: true,
  });

  // Create sample products using the reference data
  const sinksCategory = await prisma.productCategory.findUnique({ where: { name: 'Sinks' } });
  const superSinkBrand = await prisma.brand.findUnique({ where: { name: 'SuperSink' } });

  const products = await prisma.product.createMany({
    data: [
      {
        sku: 'SINK-001',
        name: 'Stainless Steel Kitchen Sink',
        categoryId: sinksCategory?.id,
        brandId: superSinkBrand?.id,
        unitPrice: 150.00,
        description: '33" x 22" undermount sink',
      },
      // Add more products
    ],
    skipDuplicates: true,
  });
}

async function main() {
  // ... existing code ...

  // Seed reference data
  await seedReferenceData(prisma);

  console.log('Database seeded successfully!');
}
```

---

### Phase 2: Update Backend APIs (4-6 hours)

#### Task 2.1: Create Countries API Module
**Files to Create:**
- `apps/api/src/modules/countries/countries.controller.ts`
- `apps/api/src/modules/countries/countries.service.ts`
- `apps/api/src/modules/countries/countries.routes.ts`

**Controller Example:**
```typescript
export async function getCountries(req: Request, res: Response) {
  try {
    const countries = await prisma.country.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    res.json(countries);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch countries' });
  }
}
```

#### Task 2.2: Create Payment Terms API Module
Similar structure to countries module.

#### Task 2.3: Create Categories API Module
Similar to countries but with CRUD endpoints for admin.

#### Task 2.4: Create Brands API Module
Similar to categories - full CRUD.

#### Task 2.5: Update Supplier DTOs
**File:** `apps/api/src/modules/suppliers/dto/create-supplier.dto.ts`

```typescript
export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  countryId: z.string().optional(), // Changed from 'country: string'
  paymentTermId: z.string().optional(), // Changed from 'paymentTerms: string'
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email').optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});
```

#### Task 2.6: Update Product DTOs
**File:** `apps/api/src/modules/products/dto/create-product.dto.ts`

```typescript
export const createProductSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  name: z.string().min(1, 'Product name is required'),
  categoryId: z.string().optional(), // Changed from 'category: string'
  brandId: z.string().optional(), // Changed from 'brand: string'
  description: z.string().optional(),
  unitPrice: z.number().min(0, 'Price must be positive'),
  reorderLevel: z.number().default(10),
  binLocation: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});
```

#### Task 2.7: Update Services
- Update `suppliers.service.ts` to fetch relations
- Update `products.service.ts` to fetch relations

---

### Phase 3: Update Frontend UI (3-4 hours)

#### Task 3.1: Create Custom Hooks

**File:** `apps/web/src/features/shared/hooks/useCountries.ts`
```typescript
export const useCountries = () => {
  return useQuery({
    queryKey: ['countries'],
    queryFn: async () => {
      const res = await fetch('/api/countries');
      return res.json();
    },
  });
};
```

**Similar hooks for:**
- `usePaymentTerms.ts`
- `useCategories.ts`
- `useBrands.ts`

#### Task 3.2: Update SupplierForm.tsx

**Current (WRONG):**
```tsx
<input type="text" placeholder="Country" {...register('country')} />
<textarea placeholder="Payment Terms" {...register('paymentTerms')} />
```

**New (CORRECT):**
```tsx
import { useCountries, usePaymentTerms } from '@/hooks';

export function SupplierForm() {
  const { data: countries } = useCountries();
  const { data: paymentTerms } = usePaymentTerms();

  return (
    <>
      <Combobox
        label="Country"
        options={countries?.map(c => ({ value: c.id, label: c.name }))}
        {...register('countryId')}
      />

      <Combobox
        label="Payment Terms"
        options={paymentTerms?.map(pt => ({ value: pt.id, label: pt.name }))}
        {...register('paymentTermId')}
      />
    </>
  );
}
```

#### Task 3.3: Update ProductForm.tsx

Replace text inputs with dropdowns using new hooks.

#### Task 3.4: Update ProductsPage.tsx

Remove hardcoded array and use dynamic categories from hook:

**Current (WRONG - Line 10):**
```tsx
const PRODUCT_CATEGORIES = ['Sinks', 'Faucets', 'Toilets', 'Showers', 'Accessories'];
```

**New (CORRECT):**
```tsx
export function ProductsPage() {
  const { data: categories } = useCategories();

  // Use categories in filter dropdown
  return (
    <select>
      {categories?.map(cat => (
        <option key={cat.id} value={cat.id}>{cat.name}</option>
      ))}
    </select>
  );
}
```

---

### Phase 4: Testing Implementation (10-13 hours later)

After Phase 1-3 are complete and tested, implement:

**Backend Tests (~15 test files):**
- Unit tests for each service
- Integration tests for each API module
- Validation tests
- Relationship tests (FK constraints)

**Frontend Tests (~10 test files):**
- Component rendering tests
- Hook tests
- Integration tests

---

## Technical Details

### Database Relationships

```
Country (1) ──── (N) Supplier
           └──── (N) Brand

PaymentTerm (1) ──── (N) Supplier

ProductCategory (1) ──── (N) Product

Brand (1) ──── (N) Product
```

### API Endpoints

**New Endpoints:**
```
GET  /api/countries          # List all countries
GET  /api/payment-terms      # List all payment terms
GET  /api/categories         # List all categories
POST /api/categories         # Create category (admin only)
PUT  /api/categories/:id     # Update category (admin only)
DELETE /api/categories/:id   # Delete category (admin only)
GET  /api/brands             # List all brands
POST /api/brands             # Create brand (admin only)
PUT  /api/brands/:id         # Update brand (admin only)
DELETE /api/brands/:id       # Delete brand (admin only)
```

**Updated Endpoints:**
```
POST /api/suppliers          # Now uses countryId, paymentTermId
PUT  /api/suppliers/:id      # Now uses countryId, paymentTermId
POST /api/products           # Now uses categoryId, brandId
PUT  /api/products/:id       # Now uses categoryId, brandId
```

### Frontend Form Updates

All forms should use the Combobox component (which already works in POForm):

```tsx
import { Combobox } from '@/components/ui';

<Combobox
  label="Country"
  placeholder="Select a country"
  options={countries}
  value={selectedCountry}
  onChange={setSelectedCountry}
  searchable
/>
```

---

## Files That Need Changes

### Database (Prisma)
1. `prisma/schema.prisma` - Add 4 models, update 2 models
2. `prisma/seed.ts` - Add reference data seeding

### Backend (24 new files + 8 modified)
**New Modules (4):**
1. `apps/api/src/modules/countries/` (6 files: controller, service, routes, dto, middleware, tests)
2. `apps/api/src/modules/payment-terms/` (6 files)
3. `apps/api/src/modules/categories/` (6 files)
4. `apps/api/src/modules/brands/` (6 files)

**Modified DTOs:**
5. `apps/api/src/modules/suppliers/dto/create-supplier.dto.ts`
6. `apps/api/src/modules/suppliers/dto/update-supplier.dto.ts`
7. `apps/api/src/modules/products/dto/create-product.dto.ts`
8. `apps/api/src/modules/products/dto/update-product.dto.ts`

**Modified Services:**
9. `apps/api/src/modules/suppliers/suppliers.service.ts`
10. `apps/api/src/modules/products/products.service.ts`

### Frontend (8 modified + 4 new)
**New Hooks (4):**
1. `apps/web/src/features/shared/hooks/useCountries.ts`
2. `apps/web/src/features/shared/hooks/usePaymentTerms.ts`
3. `apps/web/src/features/shared/hooks/useCategories.ts`
4. `apps/web/src/features/shared/hooks/useBrands.ts`

**Modified Components:**
5. `apps/web/src/features/suppliers/components/SupplierForm.tsx`
6. `apps/web/src/features/products/components/ProductForm.tsx`
7. `apps/web/src/features/products/pages/ProductsPage.tsx`

### Testing (25+ new files - Phase 4)
Backend tests, frontend component tests, integration tests

---

## Success Metrics

After implementation:

✅ All 4 reference models exist in database with proper relationships
✅ Supplier form uses SELECT/Combobox for country and payment terms
✅ Product form uses SELECT/Combobox for category and brand
✅ ProductsPage uses dynamic categories (no hardcoded arrays)
✅ Seed data populates reference data on `prisma db seed`
✅ All API endpoints functional with foreign key validation
✅ Frontend forms submit with IDs instead of text
✅ No validation errors in build/compilation
✅ 25+ test files (Phase 4)
✅ >80% code coverage (Phase 4)

---

## Notes for James

1. **Phase 1 is critical** - Without proper models, the rest won't work
2. **Test as you go** - After Phase 1, run seed script and verify data loads
3. **Frontend follows backend** - Don't start Phase 3 until Phase 2 is complete
4. **DTOs must match** - Schema validation must accept IDs not strings
5. **Testing comes later** - Focus on Phases 1-3 first, testing in Phase 4
6. **Use existing patterns** - POForm already demonstrates correct Combobox usage
7. **Ask questions** - If anything is unclear, clarify before implementing

---

## Timeline

- **Phase 1:** 8-10 hours (Database + Seed)
- **Phase 2:** 4-6 hours (Backend APIs)
- **Phase 3:** 3-4 hours (Frontend Forms)
- **Phase 4:** 10-13 hours later (Testing)

**Total Phase 1-3: 15-20 hours**
**Total with Phase 4: 25-33 hours**

---

## Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-11-17 | 4.0 | Phase 3 Complete: Frontend UI with custom hooks and dynamic dropdowns ✅ | Developer (James) |
| 2025-11-17 | 3.0 | Phase 2 Complete: Backend APIs for reference data with CRUD operations ✅ | Developer (James) |
| 2025-11-17 | 2.0 | Phase 1 Complete: Database models, migration, and seed data ✅ | Developer (James) |
| 2025-11-17 | 1.1 | Phase 1 Implementation Started | Developer (James) |
| 2025-01-17 | 1.0 | Epic 2 Remediation Story - Add Missing Reference Models | PM (John) |

---

## QA Results

*To be completed after implementation.*
