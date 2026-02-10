# Story 7.6: Overdue Payment Alerts and Escalation

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.6
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 3 (Clients), Story 7.1
**Status:** Draft — Phase 2 (v2.0 — Revised)

---

## User Story

**As an** accountant,
**I want** automated alerts for overdue payments with escalation rules,
**So that** collection efforts are timely and systematic.

---

## Acceptance Criteria

1. **Alert Configuration:**
   - [ ] AlertRule table for configurable alert rules
   - [ ] Default rules seeded:
     - 7 days overdue: Alert recovery agent (LOW priority)
     - 14 days overdue: Alert recovery agent + accountant (MEDIUM priority)
     - 30 days overdue: Alert all roles (HIGH priority)
     - 60+ days overdue: Alert all + mark CRITICAL

2. **Database Schema:**
   - [ ] AlertRule model: daysOverdue, priority, targetRoles (JSON), action
   - [ ] Alert model: type, priority, message, relatedType, relatedId, targetUserId
   - [ ] This story is the **canonical definition** for Alert/AlertRule — other stories reference it

3. **Daily Alert Job:**
   - [ ] Cron job checks overdue invoices daily (separate setup, not in API server)
   - [ ] Creates alerts based on matching rules
   - [ ] Deduplicates: skip if unacknowledged alert exists for same client + priority within 24h

4. **Backend API:**
   - [ ] `GET /api/v1/alerts` — get current user's unacknowledged alerts
   - [ ] `PUT /api/v1/alerts/:id/acknowledge` — mark alert as acknowledged
   - [ ] `GET /api/v1/alerts/overdue-clients` — overdue client summary

5. **Escalation Workflow:**
   - [ ] 30+ days overdue with no visit in 7 days: create CRITICAL alert for admins

6. **Frontend:**
   - [ ] Alert bell icon in navbar with unread count badge
   - [ ] Alert dropdown panel with recent alerts
   - [ ] Alerts listing page with type filters
   - [ ] Click alert navigates to client detail
   - [ ] Acknowledge button per alert
   - [ ] Use `<Card>` with children directly (no `Card.Body`)

7. **Authorization:**
   - [ ] Each user sees only alerts targeted to them
   - [ ] Admin can configure alert rules

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Introduces new Alert and AlertRule models.

### Key Corrections

1. **API paths**: All use `/api/v1/` prefix (not `/api/`)
2. **`Card.Body`** does not exist as a component — use `<Card>` with children directly
3. **`targetRoles String[]`**: MySQL does not support array types. Use `Json` type instead
4. **`getUserAlerts()` had duplicate `OR` clauses** — invalid Prisma syntax. Fixed with `AND` wrapping
5. **`alertRule.upsert({ where: { name } })`**: Requires `@@unique` on `name` or use `findFirst` + `create`. Added `@unique` on AlertRule.name
6. **`sendAlertEmail()` / `sendAlertSMS()`**: Deferred entirely for MVP — NOTIFY only
7. **`auditLogger.log()`** replaced with `AuditService.log()`. Action limited to: `CREATE | UPDATE | DELETE | VIEW | LOGIN | LOGOUT | PERMISSION_CHECK`
8. **InvoiceStatus `'UNPAID'`** does not exist — use `'PENDING'` instead

### Schema (NEW models — canonical definitions)

```prisma
model AlertRule {
  id           String         @id @default(cuid())
  name         String         @unique   // @@unique required for upsert
  daysOverdue  Int
  priority     AlertPriority
  targetRoles  Json           // JSON array of role strings, e.g. ["RECOVERY_AGENT","ADMIN"]
  action       AlertAction    @default(NOTIFY)
  isActive     Boolean        @default(true)
  createdAt    DateTime       @default(now())

  @@map("alert_rules")
}

model Alert {
  id              String         @id @default(cuid())
  type            AlertType
  priority        AlertPriority
  message         String         @db.Text
  relatedType     String?        // "CLIENT", "INVOICE", etc.
  relatedId       String?
  targetUserId    String?
  targetRole      String?
  acknowledged    Boolean        @default(false)
  acknowledgedBy  String?
  acknowledgedAt  DateTime?
  createdAt       DateTime       @default(now())
  expiresAt       DateTime?

  targetUser      User?          @relation("AlertTargetUser", fields: [targetUserId], references: [id])
  acknowledger    User?          @relation("AlertAcknowledger", fields: [acknowledgedBy], references: [id])

  @@index([targetUserId, acknowledged])
  @@index([type, relatedId])
  @@map("alerts")
}

enum AlertType {
  CLIENT_OVERDUE
  PROMISE_BROKEN
  STOCK_LOW
  EXPIRY_WARNING
  CREDIT_LIMIT_EXCEEDED
}

enum AlertPriority { LOW  MEDIUM  HIGH  CRITICAL }
enum AlertAction   { NOTIFY  EMAIL  SMS }
```

**User model** needs new relations:
```prisma
// ADD to User model:
alertsReceived     Alert[] @relation("AlertTargetUser")
alertsAcknowledged Alert[] @relation("AlertAcknowledger")
```

### Backend Service (corrected)

```typescript
// --- Overdue check job (runs via cron, separate process) ---
async function checkOverduePayments(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const rules = await prisma.alertRule.findMany({
    where: { isActive: true },
    orderBy: { daysOverdue: 'asc' }
  });

  const clients = await prisma.client.findMany({
    where: {
      balance: { gt: 0 },
      status: 'ACTIVE'
    },
    include: {
      invoices: {
        where: {
          status: { in: ['PENDING', 'PARTIAL'] },  // NOT 'UNPAID'
          dueDate: { lt: today }
        },
        orderBy: { dueDate: 'asc' }
      },
      recoveryAgent: true,
      recoveryVisits: { orderBy: { visitDate: 'desc' }, take: 1 }
    }
  });

  for (const client of clients) {
    if (client.invoices.length === 0) continue;
    const oldestInvoice = client.invoices[0];
    const daysOverdue = differenceInDays(today, oldestInvoice.dueDate!);

    const applicableRule = rules
      .filter(r => daysOverdue >= r.daysOverdue)
      .sort((a, b) => b.daysOverdue - a.daysOverdue)[0];
    if (!applicableRule) continue;

    // Deduplicate: skip if same client + priority alert exists in last 24h
    const existing = await prisma.alert.findFirst({
      where: {
        type: 'CLIENT_OVERDUE',
        relatedType: 'CLIENT',
        relatedId: client.id,
        priority: applicableRule.priority,
        acknowledged: false,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      }
    });
    if (existing) continue;

    const overdueAmount = client.invoices.reduce(
      (sum, inv) => sum + Number(inv.total) - Number(inv.paidAmount), 0
    );

    // targetRoles is Json — parse it
    const roles = applicableRule.targetRoles as string[];
    const targetUsers = await getTargetUsers(roles, client.recoveryAgentId);

    for (const userId of targetUsers) {
      await prisma.alert.create({
        data: {
          type: 'CLIENT_OVERDUE',
          priority: applicableRule.priority,
          message: `${client.name}: ${daysOverdue} days overdue (Rs.${overdueAmount.toLocaleString()})`,
          relatedType: 'CLIENT',
          relatedId: client.id,
          targetUserId: userId
        }
      });
    }

    // Escalation: 30+ days overdue, no visit in 7 days → CRITICAL for admins
    if (daysOverdue >= 30) {
      const lastVisit = client.recoveryVisits[0];
      const daysSinceVisit = lastVisit ? differenceInDays(today, lastVisit.visitDate) : 999;
      if (daysSinceVisit > 7) {
        const admins = await prisma.user.findMany({ where: { role: { name: 'ADMIN' } } });
        for (const admin of admins) {
          await prisma.alert.create({
            data: {
              type: 'CLIENT_OVERDUE',
              priority: 'CRITICAL',
              message: `URGENT: ${client.name} — ${daysOverdue} days overdue, no visit in ${daysSinceVisit} days`,
              relatedType: 'CLIENT',
              relatedId: client.id,
              targetUserId: admin.id
            }
          });
        }
      }
    }
  }
}

// --- getUserAlerts (fixed duplicate OR clause) ---
async function getUserAlerts(userId: string): Promise<Alert[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true }
  });

  return prisma.alert.findMany({
    where: {
      AND: [
        { OR: [{ targetUserId: userId }, { targetRole: user?.role?.name }] },
        { acknowledged: false },
        { OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }] }
      ]
    },
    orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
    take: 50
  });
}
```

### Seed Default Alert Rules

```typescript
async function seedAlertRules() {
  const rules = [
    { name: '7 Days Overdue',  daysOverdue: 7,  priority: 'LOW',      targetRoles: JSON.stringify(['RECOVERY_AGENT']),                  action: 'NOTIFY' },
    { name: '14 Days Overdue', daysOverdue: 14, priority: 'MEDIUM',   targetRoles: JSON.stringify(['RECOVERY_AGENT', 'ACCOUNTANT']),    action: 'NOTIFY' },
    { name: '30 Days Overdue', daysOverdue: 30, priority: 'HIGH',     targetRoles: JSON.stringify(['RECOVERY_AGENT', 'ACCOUNTANT', 'ADMIN']), action: 'NOTIFY' },
    { name: '60+ Days Overdue',daysOverdue: 60, priority: 'CRITICAL', targetRoles: JSON.stringify(['RECOVERY_AGENT', 'ACCOUNTANT', 'ADMIN']), action: 'NOTIFY' }
  ];

  for (const rule of rules) {
    await prisma.alertRule.upsert({
      where: { name: rule.name },  // Works because name is @unique
      update: {},
      create: rule
    });
  }
}
```

### Module Structure

```
apps/api/src/modules/alerts/
  alert.controller.ts        (NEW)
  alert.service.ts           (NEW)
  alert.routes.ts            (NEW)
  overdue-check.job.ts       (NEW — cron job, separate setup)

apps/web/src/features/alerts/
  AlertBell.tsx              (NEW — navbar bell icon + dropdown)
  AlertsPage.tsx             (NEW — full listing with filters)
```

### Frontend Notes

- **AlertBell**: Bell icon in navbar, polls `GET /api/v1/alerts` every 60s, shows count badge. Dropdown lists recent alerts with priority color coding. Click navigates to client page.
- **AlertsPage**: Full page listing with type filter buttons (All / Overdue / Promises). Uses `<Card>` directly (no `Card.Body`). Acknowledge all button.
- Use `formatDistanceToNow` from date-fns for relative timestamps.

### POST-MVP DEFERRED

- **EMAIL / SMS actions**: All rules default to NOTIFY for MVP. Email/SMS infrastructure deferred.
- **Drag-and-drop alert rule ordering**
- **24h auto-escalation** (if not acknowledged, bump priority)

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), Card.Body removed, targetRoles changed from String[] to Json (MySQL), fixed duplicate OR in getUserAlerts, added @unique on AlertRule.name for upsert, UNPAID→PENDING, deferred EMAIL/SMS for MVP, trimmed frontend to notes | Claude (AI Review) |
