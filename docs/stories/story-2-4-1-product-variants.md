# Story 2.4.1: Product Variant Management

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2.4.1
**Priority:** High
**Estimated Effort:** 12-15 hours
**Dependencies:** Story 2.4 (Product Master Data Management)
**Status:** In Progress (Schema Complete - Migration Pending)

---

## User Story

**As a** warehouse manager,
**I want** to create and manage product variants with different attributes (color, size, finish, length, etc.),
**So that** I can track different versions of the same base product with variant-specific pricing and inventory.

---

## Background

Many products in the sanitary ware business have multiple variants:
- Faucets come in different finishes (Chrome, Brushed Nickel, Oil-Rubbed Bronze, Matte Black)
- Sinks come in different sizes (24", 30", 36", 42")
- Shower heads have different spray patterns and finishes
- Toilets come in different bowl shapes (Elongated, Round) and colors

Each variant needs independent SKU, pricing, and inventory tracking while maintaining the relationship to the base product.

---

## Acceptance Criteria

### 1. Database Schema

- [x] ProductVariant table created with fields:
  - id (cuid)
  - productId (foreign key to Product)
  - sku (unique, variant-specific SKU)
  - variantName (display name like "Red / Medium" or "Chrome / 250mm")
  - attributes (JSON field for flexible attribute storage)
  - costPrice (Decimal 10,2)
  - sellingPrice (Decimal 10,2)
  - reorderLevel (Int, default 10)
  - binLocation (String, nullable)
  - status (enum: ACTIVE/INACTIVE)
  - createdAt, updatedAt, createdBy, updatedBy

- [x] Product model updated with:
  - hasVariants (Boolean, default false)
  - variants relationship (one-to-many with ProductVariant)

- [x] POItem model updated with:
  - productVariantId (String, nullable, foreign key to ProductVariant)

### 2. Backend API Endpoints

#### Variant Management
- [ ] POST /api/products/:productId/variants - Create new variant
  - Validates parent product exists
  - Auto-generates variant SKU if not provided (BASE_SKU-VARIANT_CODE)
  - Validates variant attributes
  - Sets hasVariants=true on parent product

- [ ] GET /api/products/:productId/variants - List all variants for a product
  - Returns variants with status filter
  - Includes current stock levels per variant

- [ ] GET /api/variants/:id - Get single variant details
  - Returns variant with parent product info
  - Includes current stock across all warehouses

- [ ] PUT /api/variants/:id - Update variant
  - Cannot change productId
  - Can update pricing, attributes, status
  - Logged in audit trail

- [ ] DELETE /api/variants/:id - Soft delete variant (status=INACTIVE)
  - Only allowed if no active POs or inventory
  - Logged in audit trail

#### Product Endpoints (Updated)
- [ ] GET /api/products/:id - Enhanced to include variants array
  - Returns base product with all active variants
  - Each variant includes stock levels

- [ ] POST /api/products - Enhanced to support variant creation
  - Optional variants array in request body
  - Creates base product and all variants in single transaction

### 3. Validation Rules

- [ ] Variant SKU must be unique across all products and variants
- [ ] Variant attributes must be valid JSON object
- [ ] Parent product must exist and be active
- [ ] Cannot delete variant with active inventory or PO references
- [ ] When hasVariants=true, must have at least one active variant
- [ ] Variant pricing must be positive numbers
- [ ] Variant attributes must contain at least one attribute key-value pair

### 4. Frontend Components

#### Variant Management UI (Product Detail Page)
- [ ] Variant list section on Product Detail page
  - Table showing all variants with columns: SKU, Name, Attributes, Cost, Selling Price, Stock, Status
  - Color-coded status badges (active=green, inactive=gray)
  - Add Variant button (only visible for Admin/Warehouse Manager)
  - Edit/Delete buttons per variant (role-based visibility)

- [ ] Add/Edit Variant Modal
  - Form fields:
    - Variant Name (text input)
    - SKU (text input, auto-generated hint)
    - Attributes (dynamic key-value pairs)
    - Cost Price (number input)
    - Selling Price (number input)
    - Reorder Level (number input)
    - Bin Location (text input, optional)
    - Status (toggle: Active/Inactive)
  - React Hook Form + Zod validation
  - Save creates/updates variant via API

- [ ] Attribute Builder Component
  - Add/remove attribute rows
  - Key (dropdown or text): color, size, finish, length, pattern, etc.
  - Value (text input): Red, Medium, Chrome, 250mm, etc.
  - Minimum 1 attribute required
  - Preview of JSON structure shown

#### Product Form (Enhanced)
- [ ] Product creation form includes "Has Variants" checkbox
- [ ] When checked, shows variant section
- [ ] Can add multiple variants during product creation
- [ ] Each variant shows condensed form (name, attributes, pricing)

#### Purchase Order Form (Enhanced)
- [ ] Product selection updated:
  - If product has variants, show variant dropdown after selecting product
  - Dropdown shows: Variant Name (SKU) - Stock: X
  - POItem references productVariantId instead of just productId
  - Unit cost pre-filled from selected variant's costPrice

### 5. Authorization

- [ ] Only Admin and Warehouse Manager can create/edit/delete variants
- [ ] All roles can view variants (read-only for Sales/Accountant/Recovery)
- [ ] Role-based button/form visibility enforced

### 6. Audit Logging

- [ ] Variant creation logged: entityType=ProductVariant, action=CREATE
- [ ] Variant updates logged with changedFields showing before/after
- [ ] Variant deletion (soft delete) logged: action=DELETE
- [ ] All audit logs include userId, timestamp, and notes

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Database Migration (AC: 1) - READY FOR EXECUTION**
  - [x] Migration already defined in schema.prisma (ProductVariant model added)
  - [ ] **DEV ACTION REQUIRED:** Run migration: `npx prisma migrate dev --name add_product_variants`
  - [ ] **DEV ACTION REQUIRED:** Verify foreign keys and indexes created correctly
  - [ ] **DEV ACTION REQUIRED:** Generate Prisma client: `npx prisma generate`

- [ ] **Task 2: Variant DTOs (AC: 2, 3)**
  - [ ] Create `create-variant.dto.ts`
  - [ ] Create `update-variant.dto.ts`
  - [ ] Create `variant-filter.dto.ts`
  - [ ] Add Zod schemas for validation

- [ ] **Task 3: Variant Repository (AC: 2)**
  - [ ] Create `variants.repository.ts`
  - [ ] Implement CRUD methods with Prisma
  - [ ] Include stock aggregation queries
  - [ ] Add variant search/filter methods

- [ ] **Task 4: Variant Service (AC: 2, 3)**
  - [ ] Create `variants.service.ts`
  - [ ] Implement business logic:
    - Auto-generate variant SKU if not provided
    - Validate parent product exists
    - Set hasVariants=true on parent product
    - Validate attributes JSON structure
    - Soft delete with reference checks
  - [ ] Add SKU uniqueness validation

- [ ] **Task 5: Variant Controller & Routes (AC: 2)**
  - [ ] Create `variants.controller.ts`
  - [ ] Implement all CRUD endpoints
  - [ ] Create `variants.routes.ts`
  - [ ] Apply permission middleware

- [ ] **Task 6: Update Product Service (AC: 2)**
  - [ ] Enhance `products.service.ts`:
    - Include variants in product queries
    - Support creating product with variants
    - Update hasVariants flag automatically

- [ ] **Task 7: Update PO Service (AC: 4)**
  - [ ] Enhance `purchase-orders.service.ts`:
    - Support productVariantId in POItem
    - Validate variant exists when provided
    - Use variant pricing when creating PO items

- [ ] **Task 8: Authorization & Audit (AC: 5, 6)**
  - [ ] Apply requirePermission middleware to variant routes
  - [ ] Add variant operations to permission matrix
  - [ ] Implement audit logging for all variant CRUD

### Frontend Tasks

- [ ] **Task 9: Variant Types & API Client (AC: 2, 4)**
  - [ ] Update `product.types.ts` with variant types
  - [ ] Create `variantsService.ts` with API calls
  - [ ] Create TanStack Query hooks for variants

- [ ] **Task 10: Attribute Builder Component (AC: 4)**
  - [ ] Create `AttributeBuilder.tsx`
  - [ ] Dynamic key-value row management
  - [ ] JSON preview
  - [ ] Validation for required fields

- [ ] **Task 11: Variant Form Modal (AC: 4)**
  - [ ] Create `VariantFormModal.tsx`
  - [ ] React Hook Form integration
  - [ ] Zod validation schema
  - [ ] Include AttributeBuilder component

- [ ] **Task 12: Product Detail Page Enhancement (AC: 4)**
  - [ ] Add Variants section to product detail view
  - [ ] Variant list table component
  - [ ] Add/Edit/Delete variant actions
  - [ ] Stock display per variant

- [ ] **Task 13: Update Product Form (AC: 4)**
  - [ ] Add "Has Variants" checkbox to ProductForm
  - [ ] Show variant creation section when checked
  - [ ] Support creating product with initial variants

- [ ] **Task 14: Update PO Form (AC: 4)**
  - [ ] Update ProductSelector component
  - [ ] Add variant dropdown when product has variants
  - [ ] Update POItem to use productVariantId
  - [ ] Pre-fill pricing from variant

- [ ] **Task 15: Testing**
  - [ ] Backend unit tests for variant service
  - [ ] Backend integration tests for API endpoints
  - [ ] Frontend component tests
  - [ ] E2E test: Create product with variants → Create PO with variant

---

## Dev Notes

### Variant SKU Generation Logic

**Note:** The base product SKU generation is already implemented in `apps/api/src/modules/products/utils/generate-sku.ts` which generates SKUs in format `PROD-YYYY-XXX` (e.g., PROD-2025-001).

**Variant SKU Generation:**
```typescript
function generateVariantSKU(baseProductSKU: string, attributes: Record<string, string>): string {
  // Example: PROD-2025-001 + {color: "Red", size: "M"} => PROD-2025-001-RED-M
  const attrCodes = Object.values(attributes)
    .map(v => v.substring(0, 3).toUpperCase())
    .join('-');
  return `${baseProductSKU}-${attrCodes}`;
}
```

**Integration with existing SKU utils:**
- Reuse `isSkuUnique()` function from generate-sku.ts for variant SKU validation
- Create new `generateVariantSKU()` function in the same file
- Auto-generate variant SKU if not provided by user (similar to base product SKU)

### Attribute JSON Schema Examples

```json
// Faucet with finish
{
  "finish": "Chrome",
  "spoutReach": "8 inches"
}

// Sink with size
{
  "size": "30 inches",
  "bowls": "Double"
}

// Shower head with finish and pattern
{
  "finish": "Brushed Nickel",
  "sprayPattern": "Rainfall"
}

// Toilet with bowl shape and color
{
  "bowlShape": "Elongated",
  "color": "White"
}
```

### Business Rules

1. **Variant Creation:**
   - Parent product must exist and be active
   - Auto-set hasVariants=true on parent product
   - Variant SKU must be unique system-wide

2. **Variant Pricing:**
   - Each variant has independent cost and selling price
   - Variant pricing overrides base product pricing
   - Use variant pricing in PO/Invoice line items

3. **Variant Deletion:**
   - Soft delete only (set status=INACTIVE)
   - Cannot delete if variant has active inventory
   - Cannot delete if variant is referenced in pending/active POs
   - Audit log required for deletion

4. **Inventory Tracking:**
   - Each variant tracked separately in inventory
   - Variant stock shown on product detail page
   - Low stock alerts per variant based on variant reorderLevel

5. **Purchase Orders:**
   - When selecting product with variants, must choose specific variant
   - POItem.productVariantId stores the selected variant
   - Use variant's costPrice as default unitCost

---

## Testing Scenarios

### Backend Testing

1. **Variant Creation:**
   - Create variant with valid attributes → Success
   - Create variant with invalid parent product → Error
   - Create variant with duplicate SKU → Error
   - Create variant with empty attributes → Error
   - Verify hasVariants flag set on parent product

2. **Variant Updates:**
   - Update variant pricing → Success, audit logged
   - Update variant attributes → Success, audit logged
   - Update variant status → Success
   - Attempt to change productId → Error

3. **Variant Deletion:**
   - Soft delete variant with no references → Success
   - Attempt to delete variant with active PO → Error
   - Attempt to delete variant with inventory → Error
   - Verify audit log created

4. **PO Integration:**
   - Create PO item with variant → Uses variant pricing
   - Create PO item with product (no variant) → Uses base product pricing
   - Attempt to create PO with invalid variantId → Error

### Frontend Testing

1. **Variant Form:**
   - Attribute builder adds/removes rows → Success
   - Form validation works → Required fields enforced
   - JSON preview updates correctly
   - Save button disabled until valid

2. **Product Detail Page:**
   - Variants section shows all variants
   - Stock levels displayed per variant
   - Add/Edit/Delete buttons visible for authorized roles
   - Status badges color-coded correctly

3. **PO Form:**
   - Select product with variants → Variant dropdown appears
   - Select variant → Pricing auto-filled
   - POItem saved with correct variantId

---

## API Request/Response Examples

### Create Variant

**Request:**
```http
POST /api/products/clxxx123/variants
Content-Type: application/json
Authorization: Bearer <token>

{
  "sku": "PROD-2025-001-CHR",
  "variantName": "Chrome Finish",
  "attributes": {
    "finish": "Chrome",
    "spoutReach": "8 inches"
  },
  "costPrice": 45.00,
  "sellingPrice": 75.00,
  "reorderLevel": 15,
  "binLocation": "A1-B2"
}
```

**Response:**
```json
{
  "id": "clyyy456",
  "productId": "clxxx123",
  "sku": "PROD-2025-001-CHR",
  "variantName": "Chrome Finish",
  "attributes": {
    "finish": "Chrome",
    "spoutReach": "8 inches"
  },
  "costPrice": 45.00,
  "sellingPrice": 75.00,
  "reorderLevel": 15,
  "binLocation": "A1-B2",
  "status": "ACTIVE",
  "createdAt": "2025-11-24T10:00:00Z",
  "updatedAt": "2025-11-24T10:00:00Z"
}
```

### List Product Variants

**Request:**
```http
GET /api/products/clxxx123/variants?status=ACTIVE
Authorization: Bearer <token>
```

**Response:**
```json
{
  "variants": [
    {
      "id": "clyyy456",
      "sku": "PROD-2025-001-CHR",
      "variantName": "Chrome Finish",
      "attributes": {
        "finish": "Chrome",
        "spoutReach": "8 inches"
      },
      "costPrice": 45.00,
      "sellingPrice": 75.00,
      "status": "ACTIVE",
      "stock": 25
    },
    {
      "id": "clyyy789",
      "sku": "PROD-2025-001-BN",
      "variantName": "Brushed Nickel",
      "attributes": {
        "finish": "Brushed Nickel",
        "spoutReach": "8 inches"
      },
      "costPrice": 50.00,
      "sellingPrice": 85.00,
      "status": "ACTIVE",
      "stock": 18
    }
  ],
  "total": 2
}
```

### Create PO with Variant

**Request:**
```http
POST /api/purchase-orders
Content-Type: application/json
Authorization: Bearer <token>

{
  "supplierId": "clzzz999",
  "orderDate": "2025-11-24",
  "items": [
    {
      "productId": "clxxx123",
      "productVariantId": "clyyy456",
      "quantity": 50,
      "unitCost": 45.00
    }
  ]
}
```

---

## Migration Notes

### Data Migration Strategy

For existing products without variants:
1. No data migration needed
2. hasVariants remains false by default
3. Existing products continue to work as before

For products that need variants:
1. Create ProductVariant records
2. Set hasVariants=true on parent product
3. Update POItems to reference variants (manual/script)

### Backward Compatibility

- POItem.productId remains required (always references base product)
- POItem.productVariantId is optional (null for non-variant products)
- Existing queries work without modification
- Frontend gracefully handles products with/without variants

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-11-24 | 1.0     | Initial story creation | Winston (Architect) |

---

## Dev Agent Record

### Phase 1: Database Schema (Completed - Nov 24, 2025)

**Completed by:** Winston (Architect Agent)

**Schema Changes Made:**
1. ✅ Added `ProductVariant` model to `prisma/schema.prisma`:
   - All required fields (id, productId, sku, variantName, attributes, pricing, status)
   - JSON attributes field for flexible variant properties
   - Indexes on productId, sku, status
   - Cascade delete on parent product deletion

2. ✅ Updated `Product` model:
   - Added `hasVariants` Boolean field (default: false)
   - Added `variants` relationship (one-to-many)
   - Added index on `hasVariants` for query optimization

3. ✅ Updated `POItem` model:
   - Added optional `productVariantId` foreign key
   - Added relationship to `ProductVariant`
   - Added index on `productVariantId`

**Status:** Schema complete and ready for migration.

**Next Steps for Dev Agent:**
1. Run the migration command (see Task 1 above)
2. Begin implementing backend DTOs, repositories, and services
3. Leverage existing SKU generation utilities at `apps/api/src/modules/products/utils/generate-sku.ts`

### Phase 2: Backend Implementation (Pending)

*To be populated by dev agent during backend implementation*

### Phase 3: Frontend Implementation (Pending)

*To be populated by dev agent during frontend implementation*

---

## QA Results

*To be populated by QA agent after testing*
