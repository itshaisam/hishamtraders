# Story 3.1: Client Management with Credit Terms

**Epic:** Epic 3 - Sales & Client Management + Payments
**Story ID:** STORY-3.1
**Priority:** Critical
**Estimated Effort:** 8-10 hours
**Dependencies:** Epic 1 (Foundation & Audit)
**Status:** Draft

---

## User Story

**As a** sales officer,
**I want** to maintain client records with credit limits and payment terms,
**So that** credit sales are controlled and payment expectations are clear.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Client table: id, name, contactPerson, phone, email, city, area, creditLimit, paymentTermsDays, balance, status (active/inactive), createdAt, updatedAt

2. **Backend API Endpoints:**
   - [ ] POST /api/clients - Creates new client
   - [ ] GET /api/clients - Returns paginated client list with search and filters (city, status, balance > 0)
   - [ ] GET /api/clients/:id - Returns client details with invoice/payment history
   - [ ] PUT /api/clients/:id - Updates client details
   - [ ] DELETE /api/clients/:id - Soft-deletes (only if balance = 0)

3. **Validation:**
   - [ ] Credit limit validated as positive number or 0 (0 = no credit allowed, cash only)
   - [ ] Payment terms in days (e.g., 7 for weekly, 30 for monthly)
   - [ ] Current balance calculated from invoices and payments

4. **Frontend Pages:**
   - [ ] Client List page with add/edit modals
   - [ ] Display client status and credit limit utilization (%)
   - [ ] Color-coded credit status (green=good, yellow=near-limit, red=over-limit)

5. **Authorization:**
   - [ ] Sales Officer, Accountant, Admin can manage clients
   - [ ] Other roles can view clients (read-only)

6. **Audit Logging:**
   - [ ] Client CRUD operations logged in audit trail

---

## Tasks / Subtasks

### Backend Tasks

- [ ] **Task 1: Database Schema & Migration (AC: 1)**
  - [ ] Create Client model with all fields
  - [ ] Add ClientStatus enum (ACTIVE, INACTIVE)
  - [ ] Add unique constraint on name (optional, or allow duplicates)
  - [ ] Run migration

- [ ] **Task 2: Client Repository (AC: 2)**
  - [ ] Create `clients.repository.ts`
  - [ ] Implement CRUD methods
  - [ ] Implement balance calculation (from invoices and payments)
  - [ ] Implement soft delete with balance validation

- [ ] **Task 3: Client Service (AC: 2, 3)**
  - [ ] Create `clients.service.ts`
  - [ ] Validate credit limit >= 0
  - [ ] Validate payment terms > 0
  - [ ] Calculate current balance
  - [ ] Prevent delete if balance != 0

- [ ] **Task 4: Controller & Routes (AC: 2)**
  - [ ] Create `clients.controller.ts`
  - [ ] Implement all CRUD endpoints
  - [ ] Create `clients.routes.ts`

- [ ] **Task 5: Authorization & Audit (AC: 5, 6)**
  - [ ] Apply role guards
  - [ ] Add audit logging

### Frontend Tasks

- [ ] **Task 6: Client Types & API Client**
  - [ ] Create `client.types.ts`
  - [ ] Create `clientsService.ts`
  - [ ] Create TanStack Query hooks

- [ ] **Task 7: Client List Page (AC: 4)**
  - [ ] Create `ClientsPage.tsx`
  - [ ] Display clients in table/card view
  - [ ] Credit limit utilization progress bar
  - [ ] Color-coded status badges

- [ ] **Task 8: Client Form Modal (AC: 4)**
  - [ ] Create `ClientFormModal.tsx`
  - [ ] All client fields with validation
  - [ ] Credit limit and payment terms inputs

- [ ] **Task 9: Testing**
  - [ ] Backend tests (CRUD, validation, balance calculation)
  - [ ] Frontend tests (form validation, display)

---

## Dev Notes

### Database Schema (Prisma)

```prisma
model Client {
  id              String       @id @default(cuid())
  name            String
  contactPerson   String?
  phone           String?
  email           String?
  city            String?
  area            String?
  creditLimit     Decimal      @db.Decimal(12, 2) @default(0)
  paymentTermsDays Int         @default(30)
  balance         Decimal      @db.Decimal(12, 2) @default(0)
  status          ClientStatus @default(ACTIVE)

  createdAt       DateTime     @default(now())
  updatedAt       DateTime     @updatedAt

  invoices        Invoice[]
  payments        Payment[]

  @@map("clients")
}

enum ClientStatus {
  ACTIVE
  INACTIVE
}
```

### Credit Limit Utilization Calculation

```typescript
function calculateCreditUtilization(balance: number, creditLimit: number): number {
  if (creditLimit === 0) return 0; // No credit allowed
  return (balance / creditLimit) * 100;
}

function getCreditStatus(utilization: number): 'good' | 'warning' | 'danger' {
  if (utilization >= 100) return 'danger'; // Over limit
  if (utilization >= 80) return 'warning';  // Approaching limit
  return 'good';
}
```

### Frontend Color Coding

```tsx
<Badge
  variant={
    creditStatus === 'good' ? 'success' :
    creditStatus === 'warning' ? 'warning' :
    'danger'
  }
>
  {creditUtilization.toFixed(0)}% utilized
</Badge>
```

---

## Testing

### Backend Testing
- Client CRUD operations
- Balance calculation
- Soft delete validation (balance must be 0)
- Audit logging

### Frontend Testing
- Client form validation
- Credit limit utilization display
- Color-coded status

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
