# Story 2.1: Supplier Management

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2.1
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 1 (Foundation & Audit)
**Status:** Draft

---

## User Story

**As an** accountant,
**I want** to maintain a database of suppliers with contact and payment details,
**So that** purchase orders can reference suppliers and payment terms are tracked.

---

## Acceptance Criteria

1. **Database Schema:**
   - [x] Supplier table created with fields: id, name, country, contactPerson, email, phone, address, paymentTerms, status (active/inactive), createdAt, updatedAt

2. **Backend API Endpoints:**
   - [ ] POST /api/suppliers - Creates new supplier with validation
   - [ ] GET /api/suppliers - Returns paginated supplier list with search
   - [ ] GET /api/suppliers/:id - Returns supplier details with PO history
   - [ ] PUT /api/suppliers/:id - Updates supplier information
   - [ ] DELETE /api/suppliers/:id - Soft-deletes supplier (only if no active POs)

3. **Validation:**
   - [ ] Email validation (valid email format)
   - [ ] Phone validation (not empty, reasonable format)
   - [ ] Country field accepts text input
   - [ ] Payment terms stored as text (e.g., "30 days net", "50% advance, 50% on delivery")

4. **Frontend Pages:**
   - [ ] Supplier List page displays suppliers in responsive table/card view
   - [ ] Add/Edit Supplier modal with form validation
   - [ ] Supplier status displayed with visual indicator (active=green, inactive=gray)
   - [ ] Search functionality (by name, contact person, email)
   - [ ] Pagination controls

5. **Authorization:**
   - [ ] Only Admin and Accountant roles can create/edit/delete suppliers
   - [ ] Other roles can view suppliers (read-only)

6. **Audit Logging:**
   - [ ] All supplier CRUD operations logged in audit trail
   - [ ] Audit log includes: user, action (CREATE/UPDATE/DELETE), timestamp, changed fields

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Database Schema & Migration (AC: 1)**
  - [ ] Create Prisma schema for Supplier model
  - [ ] Add fields: id, name, country, contactPerson, email, phone, address, paymentTerms, status, createdAt, updatedAt
  - [ ] Run migration to create supplier table
  - [ ] Verify schema in database

- [ ] **Task 2: Supplier Repository (AC: 2)**
  - [ ] Create `suppliers.repository.ts` with CRUD operations
  - [ ] Implement `create(data)` method
  - [ ] Implement `findAll(filters, pagination)` method with search
  - [ ] Implement `findById(id)` method with PO history join
  - [ ] Implement `update(id, data)` method
  - [ ] Implement `softDelete(id)` method with active PO check

- [ ] **Task 3: Supplier Service (AC: 2, 3)**
  - [ ] Create `suppliers.service.ts` with business logic
  - [ ] Implement email validation (Zod schema)
  - [ ] Implement phone validation
  - [ ] Check for duplicate supplier names
  - [ ] Validate soft delete (prevent if active POs exist)

- [ ] **Task 4: Supplier Controller & Routes (AC: 2)**
  - [ ] Create `suppliers.controller.ts` with HTTP handlers
  - [ ] Implement POST /api/suppliers (create supplier)
  - [ ] Implement GET /api/suppliers (list with pagination/search)
  - [ ] Implement GET /api/suppliers/:id (get supplier details)
  - [ ] Implement PUT /api/suppliers/:id (update supplier)
  - [ ] Implement DELETE /api/suppliers/:id (soft delete)
  - [ ] Create `suppliers.routes.ts` and register routes

- [ ] **Task 5: Authorization Middleware (AC: 5)**
  - [ ] Apply role-based guard: Admin, Accountant for write operations
  - [ ] All authenticated users can read suppliers

- [ ] **Task 6: Audit Logging Integration (AC: 6)**
  - [ ] Add audit middleware to supplier routes
  - [ ] Log CREATE operations with full supplier data
  - [ ] Log UPDATE operations with changed fields (before/after)
  - [ ] Log DELETE operations with supplier details

### Frontend Tasks

- [ ] **Task 7: Supplier Types & API Client (AC: 2, 4)**
  - [ ] Create `supplier.types.ts` with Supplier interface
  - [ ] Create `suppliersService.ts` with API methods (getAll, getById, create, update, delete)
  - [ ] Create TanStack Query hooks: `useSuppliers`, `useSupplier`, `useCreateSupplier`, `useUpdateSupplier`, `useDeleteSupplier`

- [ ] **Task 8: Supplier List Page (AC: 4)**
  - [ ] Create `SuppliersPage.tsx` in features/suppliers/pages/
  - [ ] Display suppliers in responsive table (desktop) or card view (mobile)
  - [ ] Add search input (debounced 300ms)
  - [ ] Add pagination controls
  - [ ] Display status badge (active=green, inactive=gray)
  - [ ] Add "New Supplier" button (top-right)

- [ ] **Task 9: Supplier Form Modal (AC: 4)**
  - [ ] Create `SupplierFormModal.tsx` component
  - [ ] Use React Hook Form + Zod validation
  - [ ] Form fields: name, country, contactPerson, email, phone, address, paymentTerms, status
  - [ ] Email validation (must be valid email)
  - [ ] Phone validation (required, not empty)
  - [ ] Submit handler calls create/update mutation
  - [ ] Display success/error toast notifications

- [ ] **Task 10: Supplier Detail View (Optional - AC: 2)**
  - [ ] Create `SupplierDetailPage.tsx` (if needed)
  - [ ] Display supplier information
  - [ ] Show list of associated purchase orders
  - [ ] Add Edit/Delete buttons (role-gated)

### Testing Tasks

- [ ] **Task 11: Backend Tests**
  - [ ] Unit tests for supplier service validation logic
  - [ ] Integration tests for supplier API endpoints
  - [ ] Test soft delete prevents deletion if active POs exist
  - [ ] Test audit logging for all CRUD operations

- [ ] **Task 12: Frontend Tests**
  - [ ] Component test for SupplierFormModal (rendering, validation)
  - [ ] Component test for SuppliersPage (list rendering, search, pagination)
  - [ ] Test role-based button visibility (Add/Edit/Delete)

---

## Dev Notes

### Database Schema (Prisma)

```prisma
model Supplier {
  id            String   @id @default(cuid())
  name          String
  country       String?
  contactPerson String?
  email         String?
  phone         String?
  address       String?   @db.Text
  paymentTerms  String?   @db.Text
  status        SupplierStatus @default(ACTIVE)

  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  purchaseOrders PurchaseOrder[]

  @@map("suppliers")
}

enum SupplierStatus {
  ACTIVE
  INACTIVE
}
```

### Backend Architecture

**Location:** `apps/api/src/modules/suppliers/`

**Files to Create:**
- `suppliers.repository.ts` - Data access layer (Prisma queries)
- `suppliers.service.ts` - Business logic and validation
- `suppliers.controller.ts` - HTTP request handlers
- `suppliers.routes.ts` - Express route definitions
- `dto/create-supplier.dto.ts` - Zod schema for creating supplier
- `dto/update-supplier.dto.ts` - Zod schema for updating supplier
- `dto/supplier-filter.dto.ts` - Zod schema for query filters
- `suppliers.test.ts` - Unit/integration tests

**Validation Schema (Zod):**
```typescript
import { z } from 'zod';

export const createSupplierSchema = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  country: z.string().optional(),
  contactPerson: z.string().optional(),
  email: z.string().email('Invalid email address').optional(),
  phone: z.string().min(1, 'Phone number is required').optional(),
  address: z.string().optional(),
  paymentTerms: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export type CreateSupplierDto = z.infer<typeof createSupplierSchema>;
```

**Soft Delete Logic:**
```typescript
async softDelete(id: string): Promise<void> {
  // Check for active purchase orders
  const activePOs = await prisma.purchaseOrder.count({
    where: { supplierId: id, status: { in: ['PENDING', 'IN_TRANSIT'] } }
  });

  if (activePOs > 0) {
    throw new BadRequestError('Cannot delete supplier with active purchase orders');
  }

  await prisma.supplier.update({
    where: { id },
    data: { status: 'INACTIVE' }
  });
}
```

### Frontend Architecture

**Location:** `apps/web/src/features/suppliers/`

**Files to Create:**
- `pages/SuppliersPage.tsx` - Main supplier list page
- `components/SupplierList.tsx` - Supplier table component
- `components/SupplierFormModal.tsx` - Add/Edit form modal
- `components/SupplierCard.tsx` - Mobile card view (responsive)
- `hooks/useSuppliers.ts` - TanStack Query hooks
- `services/suppliersService.ts` - API client methods
- `types/supplier.types.ts` - TypeScript interfaces

**TanStack Query Hook Example:**
```typescript
export const useSuppliers = (filters?: SupplierFilters) => {
  return useQuery({
    queryKey: ['suppliers', filters],
    queryFn: () => suppliersService.getAll(filters),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateSupplierDto) => suppliersService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['suppliers'] });
      toast.success('Supplier created successfully!');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create supplier');
    },
  });
};
```

**Component Structure:**
- Use Tailwind CSS for styling
- Mobile-first responsive design (table on desktop, cards on mobile)
- Use Lucide React icons (UserCircle, Mail, Phone, MapPin, etc.)
- Form validation with React Hook Form + Zod
- Toast notifications with react-hot-toast

### Authorization

**Roles with Access:**
- **Admin**: Full CRUD access
- **Accountant**: Full CRUD access
- **Warehouse Manager**: Read-only
- **Sales Officer**: Read-only
- **Recovery Agent**: Read-only

**Middleware Implementation:**
```typescript
router.post('/suppliers', authenticate, authorize(['ADMIN', 'ACCOUNTANT']), suppliersController.create);
router.get('/suppliers', authenticate, suppliersController.getAll);
router.put('/suppliers/:id', authenticate, authorize(['ADMIN', 'ACCOUNTANT']), suppliersController.update);
router.delete('/suppliers/:id', authenticate, authorize(['ADMIN', 'ACCOUNTANT']), suppliersController.delete);
```

### Audit Logging

**Events to Log:**
- `SUPPLIER_CREATED` - Full supplier data
- `SUPPLIER_UPDATED` - Changed fields (before/after values)
- `SUPPLIER_DELETED` - Supplier details before soft delete

**Audit Middleware:**
```typescript
auditMiddleware({
  resource: 'Supplier',
  action: 'CREATE',
  getDetails: (req) => ({ supplierId: req.body.id, supplierName: req.body.name })
})
```

---

## Testing

### Backend Testing

**Test File Location:** `apps/api/src/modules/suppliers/suppliers.test.ts`

**Test Framework:** Jest + Supertest

**Test Cases:**
1. **POST /api/suppliers**
   - ✓ Creates supplier with valid data
   - ✓ Returns 400 for invalid email
   - ✓ Returns 400 for missing required fields
   - ✓ Returns 403 for unauthorized role (Sales Officer)
   - ✓ Creates audit log entry

2. **GET /api/suppliers**
   - ✓ Returns paginated supplier list
   - ✓ Filters by search query (name, contact)
   - ✓ Returns empty array when no suppliers exist

3. **GET /api/suppliers/:id**
   - ✓ Returns supplier details with PO history
   - ✓ Returns 404 for non-existent supplier

4. **PUT /api/suppliers/:id**
   - ✓ Updates supplier with valid data
   - ✓ Returns 400 for invalid email
   - ✓ Creates audit log entry with changed fields

5. **DELETE /api/suppliers/:id**
   - ✓ Soft deletes supplier (sets status=INACTIVE)
   - ✓ Returns 400 if supplier has active POs
   - ✓ Creates audit log entry

### Frontend Testing

**Test File Location:** `apps/web/src/features/suppliers/components/SupplierFormModal.test.tsx`

**Test Framework:** Vitest + React Testing Library

**Test Cases:**
1. **SupplierFormModal Component**
   - ✓ Renders all form fields
   - ✓ Shows validation errors for invalid email
   - ✓ Shows validation errors for empty required fields
   - ✓ Calls onSubmit with form data
   - ✓ Displays success toast on successful creation

2. **SuppliersPage Component**
   - ✓ Renders supplier list
   - ✓ Displays "New Supplier" button for Admin/Accountant
   - ✓ Hides "New Supplier" button for other roles
   - ✓ Search input filters suppliers
   - ✓ Pagination controls work correctly

---

## Change Log

| Date       | Version | Description                     | Author |
|------------|---------|--------------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation          | Sarah (Product Owner) |

---

## Dev Agent Record

*This section will be populated by the development agent during implementation.*

### Agent Model Used

*To be filled by dev agent*

### Debug Log References

*To be filled by dev agent*

### Completion Notes

*To be filled by dev agent*

### File List

*To be filled by dev agent*

---

## QA Results

*This section will be populated by the QA agent after testing.*
