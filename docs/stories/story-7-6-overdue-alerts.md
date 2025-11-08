# Story 7.6: Overdue Payment Alerts and Escalation

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.6
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 3 (Clients), Story 7.1
**Status:** Draft - Phase 2

---

## User Story

**As an** accountant,
**I want** automated alerts for overdue payments with escalation rules,
**So that** collection efforts are timely and systematic.

---

## Acceptance Criteria

1. **Alert Configuration:**
   - [ ] Configuration table for alert rules
   - [ ] Default rules:
     - 7 days overdue: Alert recovery agent (LOW priority)
     - 14 days overdue: Alert recovery agent + accountant (MEDIUM priority)
     - 30 days overdue: Alert recovery agent + accountant + admin (HIGH priority)
     - 60+ days overdue: Alert all + mark as critical (CRITICAL priority)

2. **Database Schema:**
   - [ ] AlertRule table: daysOverdue, priority, targetRoles[], action (NOTIFY/EMAIL/SMS)
   - [ ] Alert table expanded: relatedType (CLIENT_OVERDUE), relatedId (clientId)

3. **Daily Alert Job:**
   - [ ] Run daily to check overdue invoices
   - [ ] Create alerts based on rules
   - [ ] Avoid duplicate alerts (check if alert already exists for same client and rule)

4. **Backend API:**
   - [ ] GET /api/alerts - get user's alerts
   - [ ] PUT /api/alerts/:id/acknowledge - mark alert as acknowledged
   - [ ] GET /api/alerts/overdue-clients - overdue client summary

5. **Alert Actions:**
   - [ ] NOTIFY: In-app notification
   - [ ] EMAIL: Send email to target users
   - [ ] SMS: Send SMS to recovery agent (optional)

6. **Frontend:**
   - [ ] Alert bell icon in navbar with count badge
   - [ ] Alert dropdown panel
   - [ ] Alerts page (all alerts with filters)
   - [ ] Click alert navigates to client page
   - [ ] Acknowledge button

7. **Escalation Workflow:**
   - [ ] If alert not acknowledged within 24 hours, escalate priority
   - [ ] If 30+ days overdue with no visit in 7 days, create high-priority task

8. **Authorization:**
   - [ ] Each user sees only their alerts
   - [ ] Admin can configure alert rules

---

## Dev Notes

```prisma
model AlertRule {
  id           String         @id @default(cuid())
  name         String
  daysOverdue  Int
  priority     AlertPriority
  targetRoles  String[]       // JSON array of roles
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
  relatedType     String?
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

  @@map("alerts")
}

enum AlertType {
  CLIENT_OVERDUE
  PROMISE_BROKEN
  STOCK_LOW
  EXPIRY_WARNING
  ADJUSTMENT_APPROVAL_REQUIRED
  CREDIT_LIMIT_EXCEEDED
}

enum AlertPriority {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum AlertAction {
  NOTIFY
  EMAIL
  SMS
}
```

```typescript
async function checkOverduePayments(): Promise<void> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get active alert rules
  const rules = await prisma.alertRule.findMany({
    where: { isActive: true },
    orderBy: { daysOverdue: 'asc' }
  });

  // Get clients with overdue invoices
  const clients = await prisma.client.findMany({
    where: {
      balance: { gt: 0 },
      status: 'ACTIVE'
    },
    include: {
      invoices: {
        where: {
          status: { in: ['UNPAID', 'PARTIAL'] },
          dueDate: { lt: today }
        },
        orderBy: { dueDate: 'asc' }
      },
      recoveryAgent: true,
      recoveryVisits: {
        orderBy: { visitDate: 'desc' },
        take: 1
      }
    }
  });

  for (const client of clients) {
    if (client.invoices.length === 0) continue;

    // Calculate days overdue (oldest invoice)
    const oldestInvoice = client.invoices[0];
    const daysOverdue = differenceInDays(today, oldestInvoice.dueDate!);

    // Find applicable rule
    const applicableRule = rules
      .filter(rule => daysOverdue >= rule.daysOverdue)
      .sort((a, b) => b.daysOverdue - a.daysOverdue)[0];

    if (!applicableRule) continue;

    // Check if alert already exists for this client and rule
    const existingAlert = await prisma.alert.findFirst({
      where: {
        type: 'CLIENT_OVERDUE',
        relatedType: 'CLIENT',
        relatedId: client.id,
        priority: applicableRule.priority,
        acknowledged: false,
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
        }
      }
    });

    if (existingAlert) continue; // Don't create duplicate alert

    // Calculate total overdue amount
    const overdueAmount = client.invoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString()),
      0
    );

    // Get target users
    const targetUsers = await getTargetUsers(applicableRule.targetRoles, client.recoveryAgentId);

    // Create alerts for each target user
    for (const userId of targetUsers) {
      const alert = await prisma.alert.create({
        data: {
          type: 'CLIENT_OVERDUE',
          priority: applicableRule.priority,
          message: `${client.name} has ${daysOverdue} days overdue payment (Rs.${overdueAmount.toLocaleString()})`,
          relatedType: 'CLIENT',
          relatedId: client.id,
          targetUserId: userId
        }
      });

      // Perform actions based on rule
      if (applicableRule.action === 'EMAIL') {
        await sendAlertEmail(userId, alert);
      } else if (applicableRule.action === 'SMS') {
        await sendAlertSMS(userId, alert);
      }
    }

    // Special escalation: 30+ days overdue with no visit in 7 days
    if (daysOverdue >= 30) {
      const lastVisit = client.recoveryVisits[0];
      const daysSinceVisit = lastVisit
        ? differenceInDays(today, lastVisit.visitDate)
        : 999;

      if (daysSinceVisit > 7) {
        // Create high-priority task for recovery agent
        const adminUsers = await prisma.user.findMany({
          where: { role: 'ADMIN' }
        });

        for (const admin of adminUsers) {
          await prisma.alert.create({
            data: {
              type: 'CLIENT_OVERDUE',
              priority: 'CRITICAL',
              message: `URGENT: ${client.name} has ${daysOverdue} days overdue (Rs.${overdueAmount.toLocaleString()}) with no visit in ${daysSinceVisit} days`,
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

async function getTargetUsers(roles: string[], recoveryAgentId?: string | null): Promise<string[]> {
  const userIds: string[] = [];

  for (const role of roles) {
    if (role === 'RECOVERY_AGENT' && recoveryAgentId) {
      userIds.push(recoveryAgentId);
    } else {
      const users = await prisma.user.findMany({
        where: { role: role as any, status: 'ACTIVE' }
      });
      userIds.push(...users.map(u => u.id));
    }
  }

  return [...new Set(userIds)]; // Remove duplicates
}

async function acknowledgeAlert(alertId: string, userId: string): Promise<Alert> {
  const alert = await prisma.alert.findUnique({
    where: { id: alertId }
  });

  if (!alert) {
    throw new NotFoundError('Alert not found');
  }

  if (alert.targetUserId !== userId) {
    throw new ForbiddenError('You cannot acknowledge this alert');
  }

  return await prisma.alert.update({
    where: { id: alertId },
    data: {
      acknowledged: true,
      acknowledgedBy: userId,
      acknowledgedAt: new Date()
    }
  });
}

async function getUserAlerts(userId: string): Promise<any[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  const alerts = await prisma.alert.findMany({
    where: {
      OR: [
        { targetUserId: userId },
        { targetRole: user?.role }
      ],
      acknowledged: false,
      OR: [
        { expiresAt: null },
        { expiresAt: { gt: new Date() } }
      ]
    },
    orderBy: [
      { priority: 'desc' },
      { createdAt: 'desc' }
    ],
    take: 50
  });

  return alerts.map(alert => ({
    id: alert.id,
    type: alert.type,
    priority: alert.priority,
    message: alert.message,
    relatedType: alert.relatedType,
    relatedId: alert.relatedId,
    createdAt: alert.createdAt
  }));
}
```

**Frontend:**
```tsx
import { FC, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, Check, X, AlertCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

// Alert Bell Icon with Badge
export const AlertBell: FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const { data: alerts } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => fetch('/api/alerts').then(res => res.json()),
    refetchInterval: 60000 // Refetch every minute
  });

  const unreadCount = alerts?.length || 0;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 rounded-full hover:bg-gray-100"
      >
        <Bell className="h-6 w-6" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-red-600 rounded-full">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold">Notifications</h3>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {alerts?.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                No new notifications
              </div>
            ) : (
              alerts?.map((alert: any) => (
                <AlertItem key={alert.id} alert={alert} onClose={() => setIsOpen(false)} />
              ))
            )}
          </div>

          <div className="p-3 border-t text-center">
            <a href="/alerts" className="text-sm text-blue-600 hover:underline">
              View all notifications
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

const AlertItem: FC<{ alert: any; onClose: () => void }> = ({ alert, onClose }) => {
  const queryClient = useQueryClient();

  const acknowledgeMutation = useMutation({
    mutationFn: (alertId: string) =>
      fetch(`/api/alerts/${alertId}/acknowledge`, { method: 'PUT' }).then(res => res.json()),
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts']);
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'CRITICAL': return 'text-red-600 bg-red-50';
      case 'HIGH': return 'text-orange-600 bg-orange-50';
      case 'MEDIUM': return 'text-yellow-600 bg-yellow-50';
      case 'LOW': return 'text-blue-600 bg-blue-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const handleClick = () => {
    if (alert.relatedType === 'CLIENT' && alert.relatedId) {
      window.location.href = `/clients/${alert.relatedId}`;
      onClose();
    }
  };

  return (
    <div
      className={`p-4 border-b hover:bg-gray-50 cursor-pointer ${getPriorityColor(alert.priority)}`}
      onClick={handleClick}
    >
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
          <div>
            <Badge className={getPriorityColor(alert.priority)}>
              {alert.priority}
            </Badge>
          </div>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            acknowledgeMutation.mutate(alert.id);
          }}
          className="text-gray-400 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <p className="text-sm mb-2">{alert.message}</p>

      <div className="text-xs text-gray-500">
        {formatDistanceToNow(new Date(alert.createdAt), { addSuffix: true })}
      </div>
    </div>
  );
};

// Alerts Page
export const AlertsPage: FC = () => {
  const [filter, setFilter] = useState<string>('all');
  const queryClient = useQueryClient();

  const { data: alerts, isLoading } = useQuery({
    queryKey: ['alerts-page', filter],
    queryFn: () => {
      const url = filter === 'all'
        ? '/api/alerts'
        : `/api/alerts?type=${filter}`;
      return fetch(url).then(res => res.json());
    }
  });

  const acknowledgeAll = useMutation({
    mutationFn: async () => {
      const promises = alerts?.map((alert: any) =>
        fetch(`/api/alerts/${alert.id}/acknowledge`, { method: 'PUT' })
      );
      await Promise.all(promises);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['alerts-page']);
      toast.success('All alerts acknowledged');
    }
  });

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Notifications</h1>
        <Button onClick={() => acknowledgeAll.mutate()}>
          <Check className="h-4 w-4 mr-2" />
          Acknowledge All
        </Button>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'primary' : 'outline'}
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'CLIENT_OVERDUE' ? 'primary' : 'outline'}
              onClick={() => setFilter('CLIENT_OVERDUE')}
            >
              Overdue Clients
            </Button>
            <Button
              variant={filter === 'PROMISE_BROKEN' ? 'primary' : 'outline'}
              onClick={() => setFilter('PROMISE_BROKEN')}
            >
              Broken Promises
            </Button>
          </div>
        </Card.Body>
      </Card>

      {alerts?.length === 0 ? (
        <Card>
          <Card.Body className="text-center text-gray-500 py-8">
            No notifications to display
          </Card.Body>
        </Card>
      ) : (
        <div className="space-y-3">
          {alerts?.map((alert: any) => (
            <AlertItem key={alert.id} alert={alert} onClose={() => {}} />
          ))}
        </div>
      )}
    </div>
  );
};
```

**Seed Default Alert Rules:**
```typescript
async function seedAlertRules() {
  const rules = [
    {
      name: '7 Days Overdue',
      daysOverdue: 7,
      priority: 'LOW',
      targetRoles: ['RECOVERY_AGENT'],
      action: 'NOTIFY'
    },
    {
      name: '14 Days Overdue',
      daysOverdue: 14,
      priority: 'MEDIUM',
      targetRoles: ['RECOVERY_AGENT', 'ACCOUNTANT'],
      action: 'NOTIFY'
    },
    {
      name: '30 Days Overdue',
      daysOverdue: 30,
      priority: 'HIGH',
      targetRoles: ['RECOVERY_AGENT', 'ACCOUNTANT', 'ADMIN'],
      action: 'EMAIL'
    },
    {
      name: '60+ Days Overdue',
      daysOverdue: 60,
      priority: 'CRITICAL',
      targetRoles: ['RECOVERY_AGENT', 'ACCOUNTANT', 'ADMIN'],
      action: 'EMAIL'
    }
  ];

  for (const rule of rules) {
    await prisma.alertRule.upsert({
      where: { name: rule.name },
      update: {},
      create: rule
    });
  }
}
```

**Cron Job:**
```typescript
// Run daily at 8:00 AM
cron.schedule('0 8 * * *', async () => {
  console.log('Running overdue payment alerts check...');
  await checkOverduePayments();
});
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
