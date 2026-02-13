# Story 7.2: Daily Recovery Route Planning

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.2
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 7.1
**Status:** Implemented (v3.0)

---

## User Story

**As a** recovery agent,
**I want** to see my scheduled clients for today sorted by priority,
**So that** I can plan my collection route efficiently.

---

## Acceptance Criteria

1. **Backend API:**
   - [x] `GET /api/v1/recovery/schedule/today` — returns clients scheduled for logged-in recovery agent
   - [x] If user is Admin/Accountant, can specify `?agentId=xxx`
   - [x] Clients filtered by: recoveryDay matches today, balance > 0, status = ACTIVE
   - [x] Sorted by: overdueAmount DESC (highest priority first), then balance DESC

2. **Response Data:**
   - [x] Client name, contact person, phone, address (full), current balance, overdue amount, days overdue, last payment date, last visit date, payment promise date

3. **Frontend:**
   - [x] Recovery Route page shows today's clients
   - [x] Card-based layout with client details
   - [x] Click-to-call phone integration (`tel:` links)
   - [x] Google Maps link for address navigation
   - [x] Visit log button (links to Story 7.4)
   - [x] Collect payment button (links to payment recording)
   - [x] Priority badge (HIGH/MEDIUM/LOW based on overdue days)

4. **Mobile Optimization:**
   - [x] Responsive design for mobile devices
   - [x] Large touch targets for buttons

5. **Authorization:**
   - [x] Recovery Agent can see only their assigned clients
   - [x] Admin/Accountant can view any agent's route

---

## Dev Notes

### Implementation Status

**Backend:** Implemented. Depends on Story 7.1 (Client schema changes).

### Key Corrections

1. **API paths**: All use `/api/v1/` prefix (not `/api/`).
2. **InvoiceStatus `'UNPAID'`** does NOT exist. Use `'PENDING'` instead.
3. **`Card.Body`** does NOT exist. Use `<Card>` with children directly.
4. **`client.latitude` / `client.longitude`** do NOT exist on Client model. Use `client.address`, `client.area`, `client.city` for display. GPS coordinates noted as optional future addition.
5. **`client.recoveryVisits`** and **`client.paymentPromises`** are new relations added in Story 7.4 and 7.5 schemas respectively.
6. **`Spinner`** component not verified to exist — use plain HTML loading indicator or note as component to create.
7. **PWA / Service Worker / offline capability** removed entirely — over-engineering for MVP.
8. **Frontend** trimmed to skeleton and notes.

### Backend: Today's Route Query

```typescript
// GET /api/v1/recovery/schedule/today?agentId=xxx
async function getTodayRecoveryRoute(
  userId: string,
  role: string,
  agentId?: string
): Promise<any[]> {
  const today = new Date();
  const dayOfWeek = format(today, 'EEEE').toUpperCase() as RecoveryDay;

  const where: any = {
    recoveryDay: dayOfWeek,
    balance: { gt: 0 },
    status: 'ACTIVE'
  };

  // Recovery agents see only their own clients
  if (role === 'RECOVERY_AGENT') {
    where.recoveryAgentId = userId;
  } else if (agentId) {
    where.recoveryAgentId = agentId;
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      invoices: {
        where: {
          status: { in: ['PENDING', 'PARTIAL'] }
        },
        orderBy: { dueDate: 'asc' }
      },
      payments: {
        orderBy: { date: 'desc' },
        take: 1
      },
      recoveryVisits: {          // NEW relation from Story 7.4
        orderBy: { visitDate: 'desc' },
        take: 1
      },
      paymentPromises: {         // NEW relation from Story 7.5
        where: {
          promiseDate: { gte: today }
        },
        orderBy: { promiseDate: 'asc' },
        take: 1
      }
    }
  });

  return clients.map(client => {
    const overdueInvoices = client.invoices.filter(
      inv => inv.dueDate && inv.dueDate < today
    );
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total.toString()),
      0
    );

    const oldestOverdueDate = overdueInvoices.length > 0
      ? Math.min(...overdueInvoices.map(inv => inv.dueDate!.getTime()))
      : null;

    const daysOverdue = oldestOverdueDate
      ? differenceInDays(today, new Date(oldestOverdueDate))
      : 0;

    let priority: string;
    if (daysOverdue > 30) priority = 'HIGH';
    else if (daysOverdue > 14) priority = 'MEDIUM';
    else priority = 'LOW';

    return {
      clientId: client.id,
      clientName: client.name,
      contactPerson: client.contactPerson,
      phone: client.phone,
      address: `${client.address}, ${client.area}, ${client.city}`,
      currentBalance: parseFloat(client.balance.toString()),
      overdueAmount,
      daysOverdue,
      priority,
      lastPaymentDate: client.payments[0]?.date,
      lastVisitDate: client.recoveryVisits[0]?.visitDate,
      paymentPromiseDate: client.paymentPromises[0]?.promiseDate
    };
  }).sort((a, b) => {
    if (b.overdueAmount !== a.overdueAmount) {
      return b.overdueAmount - a.overdueAmount;
    }
    return b.currentBalance - a.currentBalance;
  });
}
```

### Module Structure

```
apps/api/src/modules/recovery/
  recovery.controller.ts     (EXPAND — add today route endpoint)
  recovery.service.ts        (EXPAND — add getTodayRecoveryRoute)
  recovery.routes.ts         (EXPAND — add GET /schedule/today)

apps/web/src/features/recovery/pages/
  RecoveryRoutePage.tsx       (NEW — card-based list of today's clients)
```

### Frontend Notes

- Create `RecoveryRoutePage.tsx` with card-based layout.
- Use `<Card>` component (no `Card.Body` — pass children directly).
- Each card shows: client name, balance, overdue amount, priority badge, action buttons.
- Action buttons: Call (`tel:` link), Navigate (Google Maps URL with address), Log Visit (link to /recovery/visit/:clientId), Collect Payment (link to /payments/new?clientId=xxx).
- Route summary at bottom: total clients, total outstanding, total overdue.
- Priority colors: HIGH = red, MEDIUM = yellow, LOW = green.
- Loading state: simple "Loading..." text or a spinner if the component exists.

### POST-MVP DEFERRED

- **GPS coordinates on Client model**: `latitude`/`longitude` fields for precise navigation. Currently use address string for Google Maps search.
- **PWA / Service Worker / offline caching**: Too much over-engineering for MVP. Defer entirely.
- **Route optimization**: Auto-sort by geographic proximity.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), InvoiceStatus UNPAID->PENDING, removed Card.Body, noted client.latitude/longitude as non-existent (deferred), noted recoveryVisits/paymentPromises as new relations, removed PWA/Service Worker code entirely, trimmed frontend to skeleton + notes | Claude (AI Review) |
| 2026-02-12 | 3.0     | Implemented: all acceptance criteria completed | Claude (AI Implementation) |
