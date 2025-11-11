# Application Routing Guide for Epic 2 Stories

This document defines the standardized routing pattern for implementing all remaining Epic 2 stories.

## Routing Pattern Template

For each story, follow this exact routing pattern:

### 1. **Update App.tsx** (apps/web/src/App.tsx)

```tsx
import { StoryPage } from './features/[feature-name]/pages/[StoryName]Page';

// Add route in Routes section:
<Route
  path="/[story-route]"
  element={
    <ProtectedRoute>
      <Layout>
        <StoryPage />
      </Layout>
    </ProtectedRoute>
  }
/>
```

### 2. **Update Sidebar.tsx** (apps/web/src/components/Sidebar.tsx)

Add navigation link to appropriate menu section with role-based visibility:

```tsx
{hasRole(['ADMIN', 'WAREHOUSE_MANAGER']) && (
  <Link
    to="/[story-route]"
    className="block px-3 py-2 text-sm text-gray-600 hover:text-blue-600 hover:bg-gray-50 rounded-lg"
  >
    Feature Name
  </Link>
)}
```

## Implemented Stories (Completed)

| Story | Feature | Routes | Sidebar Menu | Roles |
|-------|---------|--------|--------------|-------|
| 2.1 | Supplier Management | `/suppliers` | Purchases → Suppliers | ADMIN, WAREHOUSE_MANAGER |
| 2.4 | Product Master Data | `/products` | Inventory → Products | ADMIN, WAREHOUSE_MANAGER, SALES_OFFICER |
| 2.2 | Purchase Order Creation | `/purchase-orders` | Purchases → Purchase Orders | ADMIN, ACCOUNTANT, WAREHOUSE_MANAGER |

## Remaining Stories (To Be Implemented)

### Story 2.3: Import Landed Cost
- **Route**: `/import-landed-cost`
- **Sidebar Location**: Purchases → Import Landed Cost
- **Roles**: ADMIN, ACCOUNTANT
- **Extends**: Story 2.2 (PurchaseOrder)
- **Route Pattern**:
```tsx
<Route path="/import-landed-cost" element={<ProtectedRoute><Layout><ImportLandedCostPage /></Layout></ProtectedRoute>} />
```

### Story 2.5: Warehouse Management
- **Route**: `/warehouses`
- **Sidebar Location**: Inventory → Warehouses & Bins (already exists)
- **Roles**: ADMIN, WAREHOUSE_MANAGER
- **Route Pattern**:
```tsx
<Route path="/warehouses" element={<ProtectedRoute><Layout><WarehousePage /></Layout></ProtectedRoute>} />
```

### Story 2.6: Stock Receiving
- **Route**: `/stock-receiving`
- **Sidebar Location**: Inventory → Stock Receiving
- **Roles**: ADMIN, WAREHOUSE_MANAGER
- **Route Pattern**:
```tsx
<Route path="/stock-receiving" element={<ProtectedRoute><Layout><StockReceivingPage /></Layout></ProtectedRoute>} />
```

### Story 2.7: Inventory Adjustments
- **Route**: `/inventory-adjustments`
- **Sidebar Location**: Inventory → Adjustments
- **Roles**: ADMIN, WAREHOUSE_MANAGER
- **Route Pattern**:
```tsx
<Route path="/inventory-adjustments" element={<ProtectedRoute><Layout><InventoryAdjustmentsPage /></Layout></ProtectedRoute>} />
```

### Story 2.8: Stock Transfers
- **Route**: `/stock-transfers`
- **Sidebar Location**: Inventory → Transfers
- **Roles**: ADMIN, WAREHOUSE_MANAGER
- **Route Pattern**:
```tsx
<Route path="/stock-transfers" element={<ProtectedRoute><Layout><StockTransfersPage /></Layout></ProtectedRoute>} />
```

### Story 2.9: Bin Management
- **Route**: `/bin-management`
- **Sidebar Location**: Inventory → Warehouses & Bins (submenu)
- **Roles**: ADMIN, WAREHOUSE_MANAGER
- **Route Pattern**:
```tsx
<Route path="/bin-management" element={<ProtectedRoute><Layout><BinManagementPage /></Layout></ProtectedRoute>} />
```

### Story 2.10: Physical Stock Count
- **Route**: `/physical-count`
- **Sidebar Location**: Inventory → Physical Count
- **Roles**: ADMIN, WAREHOUSE_MANAGER
- **Route Pattern**:
```tsx
<Route path="/physical-count" element={<ProtectedRoute><Layout><PhysicalCountPage /></Layout></ProtectedRoute>} />
```

## Implementation Checklist for Each Story

When implementing a new story, follow this checklist:

### Step 1: Backend (API)
- [ ] Create DTOs in `apps/api/src/modules/[feature]/dto/`
- [ ] Create repository in `apps/api/src/modules/[feature]/[feature].repository.ts`
- [ ] Create service in `apps/api/src/modules/[feature]/[feature].service.ts`
- [ ] Create controller in `apps/api/src/modules/[feature]/[feature].controller.ts`
- [ ] Create routes in `apps/api/src/modules/[feature]/[feature].routes.ts`
- [ ] Create middleware for audit logging (optional)
- [ ] Update Prisma schema if needed
- [ ] Run migration if schema changed
- [ ] Register routes in `apps/api/src/index.ts`
- [ ] Build and verify: `pnpm -F @hishamtraders/api build`

### Step 2: Frontend (UI)
- [ ] Create types in `apps/web/src/features/[feature]/types/[feature].types.ts`
- [ ] Create API service in `apps/web/src/features/[feature]/services/[feature]Service.ts`
- [ ] Create React Query hooks in `apps/web/src/features/[feature]/hooks/use[Feature].ts`
- [ ] Create components in `apps/web/src/features/[feature]/components/`
- [ ] Create main page in `apps/web/src/features/[feature]/pages/[Feature]Page.tsx`
- [ ] Build and verify: `pnpm -F @hishamtraders/web build`

### Step 3: Routing
- [ ] Add import to `apps/web/src/App.tsx`
- [ ] Add route in Routes section with Layout wrapper
- [ ] Add navigation link to `apps/web/src/components/Sidebar.tsx` (with role check)
- [ ] Test navigation from sidebar

### Step 4: Validation
- [ ] Both API and Web builds pass with zero errors
- [ ] Page is accessible from sidebar navigation
- [ ] Page displays with sidebar visible
- [ ] Role-based access control works
- [ ] Commit with descriptive message

## File Structure Reference

```
apps/api/src/modules/[feature]/
├── dto/
│   ├── create-[feature].dto.ts
│   ├── update-[feature].dto.ts
│   └── [feature]-filter.dto.ts
├── [feature].repository.ts
├── [feature].service.ts
├── [feature].controller.ts
├── [feature].middleware.ts
└── [feature].routes.ts

apps/web/src/features/[feature]/
├── types/
│   └── [feature].types.ts
├── services/
│   └── [feature]Service.ts
├── hooks/
│   └── use[Feature].ts
├── components/
│   ├── [Feature]Form.tsx
│   ├── [Feature]List.tsx
│   └── [Feature]Modal.tsx
└── pages/
    └── [Feature]Page.tsx
```

## Role-Based Access Control

### Roles Available
- **ADMIN**: Full system access
- **WAREHOUSE_MANAGER**: Inventory, stock, warehouse management
- **SALES_OFFICER**: Sales, clients, invoices
- **ACCOUNTANT**: Purchases, payments, financial
- **RECOVERY_AGENT**: Collections, payments

### Sidebar Role Checks
```tsx
// Use hasRole for multiple roles (OR logic)
{hasRole(['ADMIN', 'WAREHOUSE_MANAGER']) && (
  <Link to="/route">Feature</Link>
)}

// Use isAdmin for admin-only features
{isAdmin() && (
  <Link to="/route">Feature</Link>
)}
```

## Key Implementation Notes

1. **Always wrap pages with Layout** in App.tsx routes
2. **Always use ProtectedRoute** for authenticated pages
3. **Always add sidebar navigation links** with role checks
4. **Always validate both builds** after changes
5. **Always commit with descriptive messages** mentioning story number
6. **Follow the exact directory structure** for consistency
7. **Use React Query** for server state management
8. **Use Zod** for validation schemas
9. **Use Tailwind CSS** for styling
10. **Use Lucide React** for icons

## Common Patterns

### Creating a Resource
- List page with filters and pagination
- Create/Edit modal with validation
- Delete confirmation dialog
- Toast notifications for feedback

### Editing a Resource
- Read existing data via React Query
- Pre-populate form
- Distinguish between create and edit modes
- Prevent changes to immutable fields

### Deleting a Resource
- Show confirmation dialog with resource details
- Only allow deletion for appropriate states
- Show loading state during deletion
- Refresh list after successful deletion

---

**Last Updated**: 2025-11-08
**Stories Completed**: 3 of 10
**Stories Remaining**: 7 of 10
