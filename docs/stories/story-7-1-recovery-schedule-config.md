# Story 7.1: Weekly Recovery Schedule Configuration

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.1
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 3 (Clients)
**Status:** Draft - Phase 2

---

## User Story

**As a** recovery agent,
**I want** to assign clients to specific days of the week for payment collection,
**So that** I can plan my collection route efficiently.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] Client table expanded: recoveryDay (enum), recoveryAgentId
   - [ ] Recovery days: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, NONE

2. **Backend API:**
   - [ ] PUT /api/clients/:id - updates recoveryDay and recoveryAgentId
   - [ ] GET /api/recovery/schedule?date=YYYY-MM-DD - returns clients scheduled for that day
   - [ ] Calculates day of week from date and filters clients

3. **Response Data:**
   - [ ] Client name, contact, address, current balance, overdue amount, last payment date, recovery agent

4. **Frontend:**
   - [ ] Client form includes Recovery Day dropdown
   - [ ] Client form includes Recovery Agent dropdown
   - [ ] Client detail page displays recovery schedule

5. **Authorization:**
   - [ ] Accountant, Admin can configure
   - [ ] Recovery schedule changes logged

---

## Dev Notes

```prisma
model Client {
  // ... existing fields
  recoveryDay      RecoveryDay?     @default(NONE)
  recoveryAgentId  String?

  recoveryAgent    User?            @relation("RecoveryAgentClients", fields: [recoveryAgentId], references: [id])
  recoveryVisits   RecoveryVisit[]

  // ... other relations
}

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

```typescript
async function getRecoverySchedule(date: Date): Promise<any[]> {
  // Get day of week
  const dayOfWeek = format(date, 'EEEE').toUpperCase() as RecoveryDay;

  // Get clients scheduled for this day
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
          status: { in: ['UNPAID', 'PARTIAL'] }
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

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
