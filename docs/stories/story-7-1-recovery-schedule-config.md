# Story 7.1: Weekly Recovery Schedule Configuration

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.1
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 3 (Clients)
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As a** recovery agent,
**I want** to assign clients to specific days of the week for payment collection,
**So that** I can plan my collection route efficiently.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Client table expanded: `recoveryDay` (RecoveryDay enum), `recoveryAgentId` (FK to User) — NEW fields
   - [ ] Recovery days: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, NONE

2. **Backend API:**
   - [ ] `PUT /api/v1/clients/:id` — updates recoveryDay and recoveryAgentId
   - [ ] `GET /api/v1/recovery/schedule?date=YYYY-MM-DD` — returns clients scheduled for that day
   - [ ] Calculates day of week from date and filters clients

3. **Response Data:**
   - [ ] Client name, contact, address, current balance, overdue amount, last payment date, recovery agent

4. **Frontend:**
   - [ ] Client form includes Recovery Day dropdown
   - [ ] Client form includes Recovery Agent dropdown (users with RECOVERY_AGENT role)
   - [ ] Client detail page displays recovery schedule

5. **Authorization:**
   - [ ] Accountant, Admin can configure
   - [ ] Recovery schedule changes logged via `AuditService.log()`

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on Client model (Epic 3).

### Key Corrections

1. **API paths**: All use `/api/v1/` prefix (not `/api/`).
2. **`client.recoveryDay`** and **`client.recoveryAgentId`** are NEW fields — not present in current Client model. Requires Prisma migration.
3. **InvoiceStatus `'UNPAID'`** does NOT exist. Use `'PENDING'` instead. Valid values: PENDING, PARTIAL, PAID, OVERDUE, CANCELLED, VOIDED.
4. **`auditLogger.log()`** replaced with `AuditService.log()` using correct fields.
5. **Frontend**: Trimmed to notes only — just extend existing Client form with two new dropdowns.

### Schema Changes Required

**Add to existing Client model:**
```prisma
// ADD to Client model:
recoveryDay      RecoveryDay?  @default(NONE)
recoveryAgentId  String?

recoveryAgent    User?         @relation("RecoveryAgentClients", fields: [recoveryAgentId], references: [id])
recoveryVisits   RecoveryVisit[]   // Story 7.4
paymentPromises  PaymentPromise[]  // Story 7.5
```

**New enum:**
```prisma
enum RecoveryDay {
  MONDAY
  TUESDAY
  WEDNESDAY
  THURSDAY
  FRIDAY
  SATURDAY
  NONE
}
```

**Add to User model:**
```prisma
// ADD to User model:
recoveryClients  Client[]  @relation("RecoveryAgentClients")
```

### Backend: Schedule Query

```typescript
// GET /api/v1/recovery/schedule?date=YYYY-MM-DD
async function getRecoverySchedule(date: Date): Promise<any[]> {
  const dayOfWeek = format(date, 'EEEE').toUpperCase() as RecoveryDay;

  const clients = await prisma.client.findMany({
    where: {
      recoveryDay: dayOfWeek,
      balance: { gt: 0 },
      status: 'ACTIVE'
    },
    include: {
      recoveryAgent: true,
      invoices: {
        where: {
          status: { in: ['PENDING', 'PARTIAL'] }
        }
      },
      payments: {
        orderBy: { date: 'desc' },
        take: 1
      }
    },
    orderBy: { balance: 'desc' }
  });

  return clients.map(client => {
    const overdueInvoices = client.invoices.filter(
      inv => inv.dueDate && inv.dueDate < new Date()
    );
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total.toString()),
      0
    );

    return {
      clientId: client.id,
      clientName: client.name,
      contactPerson: client.contactPerson,
      phone: client.phone,
      address: `${client.area}, ${client.city}`,
      currentBalance: parseFloat(client.balance.toString()),
      overdueAmount,
      lastPaymentDate: client.payments[0]?.date,
      recoveryAgent: client.recoveryAgent?.name
    };
  });
}
```

### Backend: Update Schedule

```typescript
// PUT /api/v1/clients/:id (extend existing endpoint)
// Add recoveryDay and recoveryAgentId to update DTO

await AuditService.log({
  userId,
  action: 'UPDATE',
  entityType: 'Client',
  entityId: clientId,
  notes: `Recovery schedule updated: day=${recoveryDay}, agent=${recoveryAgentId}`
});
```

### Module Structure

```
apps/api/src/modules/recovery/
  recovery.controller.ts     (NEW)
  recovery.service.ts        (NEW)
  recovery.routes.ts         (NEW)

apps/web/src/features/clients/
  ClientForm.tsx              (EXPAND — add recoveryDay and recoveryAgent dropdowns)
```

### Frontend Notes

- Add `RecoveryDay` dropdown to existing Client create/edit form (MONDAY..SATURDAY, NONE).
- Add `Recovery Agent` dropdown populated from users with RECOVERY_AGENT role.
- No new page required — extend existing client management UI.

### POST-MVP DEFERRED

- **Bulk assignment UI**: Assign multiple clients to a day/agent at once.
- **Route optimization**: GPS-based ordering of daily schedule.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), InvoiceStatus UNPAID->PENDING, noted recoveryDay and recoveryAgentId as NEW Client fields requiring migration, auditLogger->AuditService, trimmed frontend to notes only | Claude (AI Review) |
