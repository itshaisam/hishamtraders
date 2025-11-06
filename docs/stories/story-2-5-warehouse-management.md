# Story 2.5: Warehouse Management

**Epic:** Epic 2 - Import & Container Tracking + Basic Inventory
**Story ID:** STORY-2.5
**Priority:** High
**Estimated Effort:** 4-6 hours
**Dependencies:** Epic 1 (Foundation & Audit)
**Status:** Draft

---

## User Story

**As a** warehouse manager,
**I want** to define warehouses and their storage bin locations,
**So that** inventory can be tracked by specific physical locations.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Warehouse table created: id, name, location, city, status (active/inactive), createdAt, updatedAt

2. **Backend API Endpoints:**
   - [ ] POST /api/warehouses - Creates warehouse
   - [ ] GET /api/warehouses - Returns list of warehouses
   - [ ] PUT /api/warehouses/:id - Updates warehouse details
   - [ ] DELETE /api/warehouses/:id - Soft-deletes (only if no active stock)

3. **Frontend Pages:**
   - [ ] Warehouse Management page lists warehouses
   - [ ] Add/Edit warehouse via modal
   - [ ] Display warehouse status

4. **Business Rules:**
   - [ ] Bin location tracking simplified for MVP (stored as string in Product/Inventory)
   - [ ] Cannot delete warehouse with existing stock

5. **Authorization:**
   - [ ] Only Admin and Warehouse Manager can manage warehouses
   - [ ] All roles can view warehouses

6. **Audit Logging:**
   - [ ] Warehouse CRUD operations logged in audit trail

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Database Schema & Migration (AC: 1)**
  - [ ] Create Warehouse model: id, name, location, city, status, timestamps
  - [ ] Add WarehouseStatus enum (ACTIVE, INACTIVE)
  - [ ] Run migration

- [ ] **Task 2: Warehouse Repository (AC: 2)**
  - [ ] Create `warehouses.repository.ts`
  - [ ] Implement CRUD methods
  - [ ] Implement validation for soft delete (check existing stock)

- [ ] **Task 3: Warehouse Controller & Routes (AC: 2)**
  - [ ] Create `warehouses.controller.ts`
  - [ ] Create `warehouses.routes.ts`
  - [ ] Implement all CRUD endpoints

- [ ] **Task 4: Authorization & Audit (AC: 5, 6)**
  - [ ] Apply role guards
  - [ ] Add audit logging middleware

### Frontend Tasks

- [ ] **Task 5: Warehouse Types & API Client (AC: 2, 3)**
  - [ ] Create `warehouse.types.ts`
  - [ ] Create `warehousesService.ts`
  - [ ] Create TanStack Query hooks

- [ ] **Task 6: Warehouse Management Page (AC: 3)**
  - [ ] Create `WarehousesPage.tsx`
  - [ ] Display warehouses in table
  - [ ] Add/Edit warehouse modal
  - [ ] Status indicators

- [ ] **Task 7: Testing**
  - [ ] Backend tests (CRUD, soft delete validation)
  - [ ] Frontend tests (form validation, display)

---

## Dev Notes

### Database Schema (Prisma)

```prisma
model Warehouse {
  id        String          @id @default(cuid())
  name      String
  location  String?
  city      String?
  status    WarehouseStatus @default(ACTIVE)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  inventory Inventory[]

  @@map("warehouses")
}

enum WarehouseStatus {
  ACTIVE
  INACTIVE
}
```

### Key Business Rules

1. Cannot delete warehouse if it has existing stock (inventory records)
2. Bin location tracking: Stored as string field in Inventory table (e.g., "A1-B2", "Rack-3-Shelf-5")
3. Multiple warehouses supported for future expansion
4. MVP: Simple string-based bin location (no complex bin management)

---

## Testing

### Backend Testing
- CRUD operations
- Soft delete validation (prevent if stock exists)
- Audit logging

### Frontend Testing
- Warehouse form validation
- Role-based access control

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |

---

## Dev Agent Record

*To be populated by dev agent*

---

## QA Results

*To be populated by QA agent*
