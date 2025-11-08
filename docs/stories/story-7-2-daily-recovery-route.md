# Story 7.2: Daily Recovery Route Planning

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.2
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 7.1
**Status:** Draft - Phase 2

---

## User Story

**As a** recovery agent,
**I want** to see my scheduled clients for today sorted by priority,
**So that** I can plan my collection route efficiently.

---

## Acceptance Criteria

1. **Backend API:**
   - [ ] GET /api/recovery/schedule/today - returns clients scheduled for logged-in recovery agent
   - [ ] If user is Admin/Accountant, can specify ?agentId=xxx
   - [ ] Clients filtered by: recoveryDay matches today, balance > 0, status = ACTIVE
   - [ ] Sorted by: overdueAmount DESC (highest priority first), then balance DESC

2. **Response Data:**
   - [ ] Client name, contact person, phone, address (full), current balance, overdue amount, days overdue, last payment date, last visit date, payment promise date

3. **Frontend:**
   - [ ] Recovery Route page shows today's clients
   - [ ] Card-based layout with client details
   - [ ] Click-to-call phone integration
   - [ ] Google Maps integration for address
   - [ ] Visit log button
   - [ ] Collect payment button
   - [ ] Priority badge (HIGH/MEDIUM/LOW based on overdue days)

4. **Mobile Optimization:**
   - [ ] Responsive design for mobile devices
   - [ ] Large touch targets for buttons
   - [ ] Offline capability (cache today's route)

5. **Authorization:**
   - [ ] Recovery Agent can see only their assigned clients
   - [ ] Admin/Accountant can view any agent's route

---

## Dev Notes

```typescript
async function getTodayRecoveryRoute(userId: string, role: string): Promise<any[]> {
  const today = new Date();
  const dayOfWeek = format(today, 'EEEE').toUpperCase() as RecoveryDay;

  const where: any = {
    recoveryDay: dayOfWeek,
    balance: { gt: 0 },
    status: 'ACTIVE'
  };

  // If recovery agent, filter by their ID
  if (role === 'RECOVERY_AGENT') {
    where.recoveryAgentId = userId;
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      invoices: {
        where: {
          status: { in: ['UNPAID', 'PARTIAL'] }
        },
        orderBy: { dueDate: 'asc' }
      },
      payments: {
        orderBy: { date: 'desc' },
        take: 1
      },
      recoveryVisits: {
        orderBy: { visitDate: 'desc' },
        take: 1
      },
      paymentPromises: {
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
    if (daysOverdue > 30) {
      priority = 'HIGH';
    } else if (daysOverdue > 14) {
      priority = 'MEDIUM';
    } else {
      priority = 'LOW';
    }

    return {
      clientId: client.id,
      clientName: client.name,
      contactPerson: client.contactPerson,
      phone: client.phone,
      address: `${client.address}, ${client.area}, ${client.city}`,
      coordinates: {
        lat: client.latitude,
        lng: client.longitude
      },
      currentBalance: parseFloat(client.balance.toString()),
      overdueAmount,
      daysOverdue,
      priority,
      lastPaymentDate: client.payments[0]?.date,
      lastVisitDate: client.recoveryVisits[0]?.visitDate,
      paymentPromiseDate: client.paymentPromises[0]?.promiseDate
    };
  }).sort((a, b) => {
    // Sort by overdueAmount DESC, then balance DESC
    if (b.overdueAmount !== a.overdueAmount) {
      return b.overdueAmount - a.overdueAmount;
    }
    return b.currentBalance - a.currentBalance;
  });
}
```

**Frontend:**
```tsx
import { FC } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Phone, MapPin, Calendar, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

interface RecoveryRouteClient {
  clientId: string;
  clientName: string;
  contactPerson: string;
  phone: string;
  address: string;
  coordinates: { lat: number; lng: number };
  currentBalance: number;
  overdueAmount: number;
  daysOverdue: number;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  lastPaymentDate?: Date;
  lastVisitDate?: Date;
  paymentPromiseDate?: Date;
}

export const RecoveryRoutePage: FC = () => {
  const { data: clients, isLoading } = useQuery({
    queryKey: ['recovery-route-today'],
    queryFn: () => fetch('/api/recovery/schedule/today').then(res => res.json())
  });

  const handleCall = (phone: string) => {
    window.location.href = `tel:${phone}`;
  };

  const handleNavigate = (address: string, coords: { lat: number; lng: number }) => {
    if (coords.lat && coords.lng) {
      window.open(
        `https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`,
        '_blank'
      );
    } else {
      window.open(
        `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`,
        '_blank'
      );
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'HIGH': return 'bg-red-100 text-red-800';
      case 'MEDIUM': return 'bg-yellow-100 text-yellow-800';
      case 'LOW': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Today's Recovery Route</h1>
        <div className="text-sm text-gray-600">
          {format(new Date(), 'EEEE, PPP')}
        </div>
      </div>

      {clients?.length === 0 ? (
        <div className="text-center text-gray-500 py-8">
          No clients scheduled for today.
        </div>
      ) : (
        <div className="space-y-4">
          {clients?.map((client: RecoveryRouteClient, index: number) => (
            <Card key={client.clientId} className="shadow-md">
              <Card.Body>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-semibold">{index + 1}.</span>
                      <h3 className="text-lg font-semibold">{client.clientName}</h3>
                    </div>
                    <p className="text-sm text-gray-600">{client.contactPerson}</p>
                  </div>
                  <Badge className={getPriorityColor(client.priority)}>
                    {client.priority}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <div className="text-sm text-gray-600">Current Balance</div>
                    <div className="text-lg font-semibold">
                      Rs.{client.currentBalance.toLocaleString()}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-gray-600">Overdue Amount</div>
                    <div className="text-lg font-semibold text-red-600">
                      Rs.{client.overdueAmount.toLocaleString()}
                    </div>
                  </div>
                </div>

                {client.daysOverdue > 0 && (
                  <div className="mb-4 p-2 bg-red-50 rounded text-sm text-red-700">
                    Overdue: {client.daysOverdue} days
                  </div>
                )}

                {client.paymentPromiseDate && (
                  <div className="mb-4 p-2 bg-blue-50 rounded text-sm text-blue-700 flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Payment promised: {format(client.paymentPromiseDate, 'PPP')}
                  </div>
                )}

                <div className="mb-4">
                  <div className="text-sm text-gray-600 mb-1">Address</div>
                  <div className="text-sm">{client.address}</div>
                </div>

                {client.lastPaymentDate && (
                  <div className="text-xs text-gray-500 mb-4">
                    Last payment: {format(client.lastPaymentDate, 'PPP')}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={() => handleCall(client.phone)}
                    variant="primary"
                    className="w-full"
                  >
                    <Phone className="h-4 w-4 mr-2" />
                    Call
                  </Button>
                  <Button
                    onClick={() => handleNavigate(client.address, client.coordinates)}
                    variant="secondary"
                    className="w-full"
                  >
                    <MapPin className="h-4 w-4 mr-2" />
                    Navigate
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-2">
                  <Button
                    onClick={() => navigate(`/recovery/visit/${client.clientId}`)}
                    variant="outline"
                    className="w-full"
                  >
                    Log Visit
                  </Button>
                  <Button
                    onClick={() => navigate(`/payments/new?clientId=${client.clientId}`)}
                    variant="success"
                    className="w-full"
                  >
                    <DollarSign className="h-4 w-4 mr-2" />
                    Collect Payment
                  </Button>
                </div>
              </Card.Body>
            </Card>
          ))}
        </div>
      )}

      <div className="mt-6 p-4 bg-gray-50 rounded">
        <h3 className="font-semibold mb-2">Route Summary</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Total Clients</div>
            <div className="text-lg font-semibold">{clients?.length || 0}</div>
          </div>
          <div>
            <div className="text-gray-600">Total Outstanding</div>
            <div className="text-lg font-semibold">
              Rs.{clients?.reduce((sum: number, c: RecoveryRouteClient) => sum + c.currentBalance, 0).toLocaleString() || 0}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Total Overdue</div>
            <div className="text-lg font-semibold text-red-600">
              Rs.{clients?.reduce((sum: number, c: RecoveryRouteClient) => sum + c.overdueAmount, 0).toLocaleString() || 0}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
```

**Mobile PWA Features:**
```typescript
// Service Worker for offline capability
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-recovery-visits') {
    event.waitUntil(syncRecoveryVisits());
  }
});

async function syncRecoveryVisits() {
  const db = await openDB('recovery-db');
  const visits = await db.getAll('pending-visits');

  for (const visit of visits) {
    try {
      await fetch('/api/recovery/visits', {
        method: 'POST',
        body: JSON.stringify(visit)
      });
      await db.delete('pending-visits', visit.id);
    } catch (error) {
      console.error('Failed to sync visit:', error);
    }
  }
}
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
