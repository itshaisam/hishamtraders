# Story 7.4: Recovery Visit Logging

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.4
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 7.1
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As a** recovery agent,
**I want** to log each recovery visit with outcome and notes,
**So that** there's a complete history of collection efforts.

---

## Acceptance Criteria

1. **Database Schema:**
   - [ ] RecoveryVisit table — NEW model (see Dev Notes)
   - [ ] VisitOutcome enum — NEW enum

2. **Visit Outcomes:**
   - [ ] PAYMENT_COLLECTED
   - [ ] PROMISE_MADE
   - [ ] CLIENT_UNAVAILABLE
   - [ ] REFUSED_TO_PAY
   - [ ] PARTIAL_PAYMENT
   - [ ] DISPUTE_RAISED
   - [ ] OTHER

3. **Backend API:**
   - [ ] `POST /api/v1/recovery/visits` — creates visit log
   - [ ] `GET /api/v1/recovery/visits?clientId=xxx` — visit history for client
   - [ ] `GET /api/v1/recovery/visits/my` — logged-in agent's visits
   - [ ] Validation: If outcome = PAYMENT_COLLECTED or PARTIAL_PAYMENT, amountCollected required
   - [ ] Validation: If outcome = PROMISE_MADE, promiseDate and promiseAmount required

4. **Integration:**
   - [ ] If amountCollected > 0, optionally create payment record
   - [ ] If promise made, create PaymentPromise record (Story 7.5 dependency)

5. **Location Capture:**
   - [ ] Capture GPS coordinates from browser when visit logged (mobile)
   - [ ] Store as latitude/longitude on RecoveryVisit record
   - [ ] Distance verification against client address is optional (client has no GPS fields)

6. **Frontend:**
   - [ ] Visit Log form with outcome selection
   - [ ] Conditional fields based on outcome
   - [ ] Visit history timeline on client page

7. **Authorization:**
   - [ ] Recovery Agent can log visits for their assigned clients
   - [ ] Admin can view all visits

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on Story 7.1 (Client schema changes).

### Key Corrections

1. **API paths**: All use `/api/v1/` prefix (not `/api/`).
2. **`auditLogger.log()`** replaced with `AuditService.log()` using correct fields and action enum.
3. **`Card.Body`** does NOT exist. Use `<Card>` with children directly.
4. **`DatePicker`** does NOT exist. Use `<input type="date" className="border rounded px-3 py-2">`.
5. **`client.latitude` / `client.longitude`** do NOT exist on Client model. Distance verification against client address cannot be done without GPS fields. Log the visit GPS but skip client distance check.
6. **`prisma.paymentPromise`** is from Story 7.5 — this is a cross-story dependency. If Story 7.5 is not yet implemented, skip promise creation in visit logging.
7. **`Textarea`** component not verified — use plain `<textarea className="...">` or note as component to create.
8. **`react-hook-form` + `zod`** are external dependencies — need to be added to package.json.
9. **`console.warn` for distance** replaced with a simple log (or skip entirely since client has no GPS fields).
10. **Frontend** trimmed to skeleton and notes.

### Schema: NEW Models

```prisma
model RecoveryVisit {
  id              String         @id @default(cuid())
  visitNumber     String         @unique
  clientId        String
  visitDate       DateTime       @default(now())
  visitTime       String?
  outcome         VisitOutcome
  amountCollected Decimal        @default(0) @db.Decimal(12, 2)
  promiseDate     DateTime?
  promiseAmount   Decimal?       @db.Decimal(12, 2)
  notes           String?        @db.Text
  visitedBy       String
  latitude        Float?
  longitude       Float?
  createdAt       DateTime       @default(now())

  client          Client         @relation(fields: [clientId], references: [id])
  agent           User           @relation("RecoveryVisits", fields: [visitedBy], references: [id])
  paymentPromise  PaymentPromise?  // Story 7.5

  @@index([clientId, visitDate])
  @@map("recovery_visits")
}

enum VisitOutcome {
  PAYMENT_COLLECTED
  PROMISE_MADE
  CLIENT_UNAVAILABLE
  REFUSED_TO_PAY
  PARTIAL_PAYMENT
  DISPUTE_RAISED
  OTHER
}
```

**Add to Client model (from Story 7.1):**
```prisma
// Already added in Story 7.1:
recoveryVisits  RecoveryVisit[]
```

**Add to User model:**
```prisma
// ADD to User model:
recoveryVisits  RecoveryVisit[]  @relation("RecoveryVisits")
```

### Backend: Create Recovery Visit

```typescript
interface CreateRecoveryVisitDto {
  clientId: string;
  visitDate?: Date;
  visitTime?: string;
  outcome: VisitOutcome;
  amountCollected?: number;
  promiseDate?: Date;
  promiseAmount?: number;
  notes?: string;
  latitude?: number;
  longitude?: number;
}

async function createRecoveryVisit(
  data: CreateRecoveryVisitDto,
  userId: string
): Promise<RecoveryVisit> {
  // Validate outcome-specific requirements
  if (['PAYMENT_COLLECTED', 'PARTIAL_PAYMENT'].includes(data.outcome)) {
    if (!data.amountCollected || data.amountCollected <= 0) {
      throw new BadRequestError('Amount collected is required for this outcome');
    }
  }

  if (data.outcome === 'PROMISE_MADE') {
    if (!data.promiseDate || !data.promiseAmount) {
      throw new BadRequestError('Promise date and amount are required');
    }
  }

  // Verify agent is assigned to this client
  const client = await prisma.client.findUnique({
    where: { id: data.clientId }
  });

  if (!client) throw new NotFoundError('Client not found');

  if (client.recoveryAgentId !== userId) {
    throw new ForbiddenError('You are not assigned to this client');
  }

  // Generate visit number
  const visitNumber = await generateVisitNumber();

  // Create visit
  const visit = await prisma.recoveryVisit.create({
    data: {
      visitNumber,
      clientId: data.clientId,
      visitDate: data.visitDate || new Date(),
      visitTime: data.visitTime,
      outcome: data.outcome,
      amountCollected: data.amountCollected || 0,
      promiseDate: data.promiseDate,
      promiseAmount: data.promiseAmount,
      notes: data.notes,
      visitedBy: userId,
      latitude: data.latitude,
      longitude: data.longitude
    }
  });

  // If promise made, create PaymentPromise (Story 7.5 dependency)
  if (data.outcome === 'PROMISE_MADE' && data.promiseDate && data.promiseAmount) {
    await prisma.paymentPromise.create({
      data: {
        clientId: data.clientId,
        promiseDate: data.promiseDate,
        promiseAmount: data.promiseAmount,
        status: 'PENDING',
        recoveryVisitId: visit.id,
        createdBy: userId
      }
    });
  }

  await AuditService.log({
    userId,
    action: 'CREATE',
    entityType: 'RecoveryVisit',
    entityId: visit.id,
    notes: `Visit logged for client ${client.name}: outcome=${data.outcome}, amount=${data.amountCollected || 0}`
  });

  return visit;
}
```

### Backend: Visit Number Generation

```typescript
async function generateVisitNumber(): Promise<string> {
  const today = format(new Date(), 'yyyyMMdd');
  const prefix = `RV-${today}-`;

  const lastVisit = await prisma.recoveryVisit.findFirst({
    where: { visitNumber: { startsWith: prefix } },
    orderBy: { visitNumber: 'desc' }
  });

  let sequence = 1;
  if (lastVisit) {
    const parts = lastVisit.visitNumber.split('-');
    const lastSequence = parseInt(parts[parts.length - 1]);
    sequence = lastSequence + 1;
  }

  return `${prefix}${sequence.toString().padStart(4, '0')}`;
}
```

### Backend: Visit History

```typescript
// GET /api/v1/recovery/visits?clientId=xxx
async function getClientVisitHistory(clientId: string): Promise<RecoveryVisit[]> {
  return prisma.recoveryVisit.findMany({
    where: { clientId },
    include: {
      agent: { select: { name: true } }
    },
    orderBy: { visitDate: 'desc' }
  });
}
```

### Module Structure

```
apps/api/src/modules/recovery/
  recovery.controller.ts     (EXPAND — add visit endpoints)
  recovery.service.ts        (EXPAND — add createRecoveryVisit, getClientVisitHistory)
  recovery.routes.ts         (EXPAND — add POST/GET /visits)

apps/web/src/features/recovery/pages/
  RecoveryVisitLogPage.tsx    (NEW — visit log form)

apps/web/src/features/recovery/components/
  VisitHistoryTimeline.tsx    (NEW — timeline component for client page)
```

### Frontend Notes

- Visit Log form: outcome dropdown, conditional amount/promise fields, notes textarea, GPS auto-capture.
- Use `<Card>` with children directly (no `Card.Body`).
- Date field: `<input type="date">` (no DatePicker component).
- Notes field: plain `<textarea>` element or note Textarea as a component to create.
- GPS capture: use `navigator.geolocation.getCurrentPosition()` on mount, store lat/lng in form state.
- Visit History Timeline: vertical timeline of past visits on the client detail page.
- Outcome color coding: PAYMENT_COLLECTED = green, PROMISE_MADE = blue, CLIENT_UNAVAILABLE = gray, REFUSED_TO_PAY = red.

### Dependencies to Add

- `react-hook-form` — form management (frontend)
- `zod` — schema validation (frontend)
- `@hookform/resolvers` — zod resolver for react-hook-form (frontend)

### POST-MVP DEFERRED

- **Photo upload** (proof of visit): Requires file upload infrastructure.
- **Voice notes**: Requires audio recording and storage infrastructure.
- **Client GPS fields** (`latitude`/`longitude`): Not in current schema. Distance verification deferred.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), auditLogger->AuditService with correct action enum, Card.Body->Card, DatePicker->input[type=date], noted client has no GPS fields (distance check deferred), documented RecoveryVisit as NEW model, noted paymentPromise as Story 7.5 dependency, trimmed frontend to skeleton + notes, noted react-hook-form/zod as external deps | Claude (AI Review) |
