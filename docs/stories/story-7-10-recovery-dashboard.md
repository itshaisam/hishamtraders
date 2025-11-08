# Story 7.10: Recovery Dashboard Enhancements

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.10
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** All previous Epic 7 stories
**Status:** Draft - Phase 2

---

## User Story

**As a** recovery agent/admin,
**I want** a comprehensive recovery dashboard with key metrics and actionable insights,
**So that** I can quickly assess recovery status and prioritize my work.

---

## Acceptance Criteria

1. **Dashboard Widgets:**
   - [ ] Today's Schedule (clients to visit)
   - [ ] Due Promises (promises due today/overdue)
   - [ ] Collection Metrics (today/week/month)
   - [ ] Overdue Summary (total overdue amount by aging)
   - [ ] Recent Visits (last 5 visits)
   - [ ] Alert Summary (unacknowledged alerts)
   - [ ] Promise Fulfillment Rate
   - [ ] Top 5 Overdue Clients

2. **Backend API:**
   - [ ] GET /api/dashboard/recovery - returns all dashboard data
   - [ ] Response optimized (single query for all widgets)

3. **Interactive Features:**
   - [ ] Click widget to navigate to detail page
   - [ ] Quick actions: Log Visit, Record Payment, View Client
   - [ ] Refresh button
   - [ ] Date range selector for metrics

4. **Role-Based Views:**
   - [ ] Recovery Agent: Only their assigned clients and data
   - [ ] Admin/Accountant: Organization-wide metrics

5. **Real-Time Updates:**
   - [ ] Auto-refresh every 5 minutes
   - [ ] Manual refresh button
   - [ ] Last updated timestamp

6. **Mobile Optimization:**
   - [ ] Responsive grid layout
   - [ ] Touch-friendly buttons
   - [ ] Swipeable widgets (mobile)

7. **Frontend:**
   - [ ] Recovery Dashboard page
   - [ ] Widget-based layout (drag-and-drop optional - Phase 3)
   - [ ] Charts and visualizations
   - [ ] Action buttons

---

## Dev Notes

```typescript
interface RecoveryDashboardData {
  todaysSchedule: {
    totalClients: number;
    totalOutstanding: number;
    clients: Array<{
      clientId: string;
      clientName: string;
      phone: string;
      overdueAmount: number;
      daysOverdue: number;
    }>;
  };
  duePromises: {
    totalPromises: number;
    totalAmount: number;
    overduePromises: number;
    promises: Array<{
      promiseId: string;
      clientName: string;
      promiseAmount: number;
      promiseDate: Date;
      isOverdue: boolean;
    }>;
  };
  collectionMetrics: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  overdueSummary: {
    total: number;
    buckets: {
      days1to7: number;
      days8to14: number;
      days15to30: number;
      days30plus: number;
    };
  };
  recentVisits: Array<{
    visitNumber: string;
    clientName: string;
    visitDate: Date;
    outcome: string;
    amountCollected: number;
  }>;
  alerts: {
    totalUnacknowledged: number;
    criticalCount: number;
  };
  promiseFulfillmentRate: number;
  topOverdueClients: Array<{
    clientId: string;
    clientName: string;
    overdueAmount: number;
    daysOverdue: number;
  }>;
}

async function getRecoveryDashboard(
  userId: string,
  role: string
): Promise<RecoveryDashboardData> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);

  // Determine scope (agent's clients or all clients)
  const clientWhere: any = {
    status: 'ACTIVE'
  };

  if (role === 'RECOVERY_AGENT') {
    clientWhere.recoveryAgentId = userId;
  }

  // Today's Schedule
  const dayOfWeek = format(today, 'EEEE').toUpperCase() as RecoveryDay;
  const todaysClients = await prisma.client.findMany({
    where: {
      ...clientWhere,
      recoveryDay: dayOfWeek,
      balance: { gt: 0 }
    },
    include: {
      invoices: {
        where: {
          status: { in: ['UNPAID', 'PARTIAL'] },
          dueDate: { lt: endOfToday }
        }
      }
    },
    take: 10,
    orderBy: { balance: 'desc' }
  });

  const todaysSchedule = {
    totalClients: todaysClients.length,
    totalOutstanding: todaysClients.reduce(
      (sum, c) => sum + parseFloat(c.balance.toString()),
      0
    ),
    clients: todaysClients.slice(0, 5).map(client => {
      const overdueInvoices = client.invoices;
      const overdueAmount = overdueInvoices.reduce(
        (sum, inv) => sum + parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString()),
        0
      );
      const daysOverdue = overdueInvoices.length > 0
        ? differenceInDays(today, overdueInvoices[0].dueDate!)
        : 0;

      return {
        clientId: client.id,
        clientName: client.name,
        phone: client.phone || '',
        overdueAmount,
        daysOverdue
      };
    })
  };

  // Due Promises
  const promiseWhere: any = {
    status: 'PENDING',
    promiseDate: { lte: endOfToday }
  };

  if (role === 'RECOVERY_AGENT') {
    promiseWhere.createdBy = userId;
  }

  const duePromises = await prisma.paymentPromise.findMany({
    where: promiseWhere,
    include: { client: true },
    orderBy: { promiseDate: 'asc' },
    take: 10
  });

  const duePromisesData = {
    totalPromises: duePromises.length,
    totalAmount: duePromises.reduce(
      (sum, p) => sum + parseFloat(p.promiseAmount.toString()),
      0
    ),
    overduePromises: duePromises.filter(p => p.promiseDate < today).length,
    promises: duePromises.slice(0, 5).map(promise => ({
      promiseId: promise.id,
      clientName: promise.client.name,
      promiseAmount: parseFloat(promise.promiseAmount.toString()),
      promiseDate: promise.promiseDate,
      isOverdue: promise.promiseDate < today
    }))
  };

  // Collection Metrics
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay());

  const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  const paymentWhere: any = {};
  if (role === 'RECOVERY_AGENT') {
    paymentWhere.client = { recoveryAgentId: userId };
  }

  const [todayPayments, weekPayments, monthPayments] = await Promise.all([
    prisma.payment.findMany({
      where: {
        ...paymentWhere,
        date: { gte: today, lte: endOfToday }
      }
    }),
    prisma.payment.findMany({
      where: {
        ...paymentWhere,
        date: { gte: startOfWeek, lte: endOfToday }
      }
    }),
    prisma.payment.findMany({
      where: {
        ...paymentWhere,
        date: { gte: startOfMonth, lte: endOfToday }
      }
    })
  ]);

  const collectionMetrics = {
    today: todayPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
    thisWeek: weekPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0),
    thisMonth: monthPayments.reduce((sum, p) => sum + parseFloat(p.amount.toString()), 0)
  };

  // Overdue Summary
  const allClients = await prisma.client.findMany({
    where: clientWhere,
    include: {
      invoices: {
        where: {
          status: { in: ['UNPAID', 'PARTIAL'] }
        }
      }
    }
  });

  const overdueSummary = {
    total: 0,
    buckets: {
      days1to7: 0,
      days8to14: 0,
      days15to30: 0,
      days30plus: 0
    }
  };

  for (const client of allClients) {
    for (const invoice of client.invoices) {
      if (!invoice.dueDate || invoice.dueDate >= today) continue;

      const daysOverdue = differenceInDays(today, invoice.dueDate);
      const amount = parseFloat(invoice.total.toString()) - parseFloat(invoice.paidAmount.toString());

      overdueSummary.total += amount;

      if (daysOverdue <= 7) {
        overdueSummary.buckets.days1to7 += amount;
      } else if (daysOverdue <= 14) {
        overdueSummary.buckets.days8to14 += amount;
      } else if (daysOverdue <= 30) {
        overdueSummary.buckets.days15to30 += amount;
      } else {
        overdueSummary.buckets.days30plus += amount;
      }
    }
  }

  // Recent Visits
  const visitWhere: any = {};
  if (role === 'RECOVERY_AGENT') {
    visitWhere.visitedBy = userId;
  }

  const recentVisits = await prisma.recoveryVisit.findMany({
    where: visitWhere,
    include: { client: true },
    orderBy: { visitDate: 'desc' },
    take: 5
  });

  const recentVisitsData = recentVisits.map(visit => ({
    visitNumber: visit.visitNumber,
    clientName: visit.client.name,
    visitDate: visit.visitDate,
    outcome: visit.outcome,
    amountCollected: parseFloat(visit.amountCollected.toString())
  }));

  // Alerts
  const alertWhere: any = {
    acknowledged: false
  };

  if (role === 'RECOVERY_AGENT') {
    alertWhere.targetUserId = userId;
  }

  const alerts = await prisma.alert.findMany({
    where: alertWhere
  });

  const alertsData = {
    totalUnacknowledged: alerts.length,
    criticalCount: alerts.filter(a => a.priority === 'CRITICAL').length
  };

  // Promise Fulfillment Rate (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(today.getDate() - 30);

  const fulfillmentWhere: any = {
    promiseDate: { gte: thirtyDaysAgo, lte: endOfToday },
    status: { in: ['FULFILLED', 'PARTIAL', 'BROKEN'] }
  };

  if (role === 'RECOVERY_AGENT') {
    fulfillmentWhere.createdBy = userId;
  }

  const promises = await prisma.paymentPromise.findMany({
    where: fulfillmentWhere
  });

  const fulfilled = promises.filter(p => p.status === 'FULFILLED').length;
  const partial = promises.filter(p => p.status === 'PARTIAL').length;
  const total = promises.length;

  const promiseFulfillmentRate = total > 0
    ? ((fulfilled + partial * 0.5) / total) * 100
    : 0;

  // Top 5 Overdue Clients
  const topOverdueClients = allClients
    .map(client => {
      const overdueInvoices = client.invoices.filter(
        inv => inv.dueDate && inv.dueDate < today
      );
      const overdueAmount = overdueInvoices.reduce(
        (sum, inv) => sum + parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString()),
        0
      );
      const daysOverdue = overdueInvoices.length > 0
        ? Math.max(...overdueInvoices.map(inv => differenceInDays(today, inv.dueDate!)))
        : 0;

      return {
        clientId: client.id,
        clientName: client.name,
        overdueAmount,
        daysOverdue
      };
    })
    .filter(c => c.overdueAmount > 0)
    .sort((a, b) => b.overdueAmount - a.overdueAmount)
    .slice(0, 5);

  return {
    todaysSchedule,
    duePromises: duePromisesData,
    collectionMetrics,
    overdueSummary,
    recentVisits: recentVisitsData,
    alerts: alertsData,
    promiseFulfillmentRate: Math.round(promiseFulfillmentRate * 10) / 10,
    topOverdueClients
  };
}
```

**Frontend:**
```tsx
import { FC, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Calendar,
  DollarSign,
  Users,
  AlertCircle,
  TrendingUp,
  CheckCircle,
  Phone,
  MapPin
} from 'lucide-react';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';

export const RecoveryDashboardPage: FC = () => {
  const [lastUpdated, setLastUpdated] = useState(new Date());

  const { data: dashboard, isLoading, refetch } = useQuery({
    queryKey: ['recovery-dashboard'],
    queryFn: () => fetch('/api/dashboard/recovery').then(res => res.json()),
    refetchInterval: 5 * 60 * 1000 // Auto-refresh every 5 minutes
  });

  const handleRefresh = () => {
    refetch();
    setLastUpdated(new Date());
  };

  if (isLoading) return <Spinner />;

  const overdueChartData = [
    { name: '1-7 days', value: dashboard?.overdueSummary.buckets.days1to7, color: '#fbbf24' },
    { name: '8-14 days', value: dashboard?.overdueSummary.buckets.days8to14, color: '#f97316' },
    { name: '15-30 days', value: dashboard?.overdueSummary.buckets.days15to30, color: '#ef4444' },
    { name: '30+ days', value: dashboard?.overdueSummary.buckets.days30plus, color: '#991b1b' }
  ].filter(item => item.value > 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Recovery Dashboard</h1>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600">
            Last updated: {format(lastUpdated, 'HH:mm:ss')}
          </div>
          <Button onClick={handleRefresh} variant="outline" size="sm">
            Refresh
          </Button>
        </div>
      </div>

      {/* Collection Metrics */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Today's Collections</div>
                <div className="text-3xl font-bold text-green-600">
                  Rs.{dashboard?.collectionMetrics.today.toLocaleString()}
                </div>
              </div>
              <DollarSign className="h-10 w-10 text-green-600" />
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">This Week</div>
                <div className="text-3xl font-bold text-blue-600">
                  Rs.{dashboard?.collectionMetrics.thisWeek.toLocaleString()}
                </div>
              </div>
              <TrendingUp className="h-10 w-10 text-blue-600" />
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">This Month</div>
                <div className="text-3xl font-bold text-purple-600">
                  Rs.{dashboard?.collectionMetrics.thisMonth.toLocaleString()}
                </div>
              </div>
              <Calendar className="h-10 w-10 text-purple-600" />
            </div>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Today's Schedule */}
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Today's Schedule</h3>
              <Badge>{dashboard?.todaysSchedule.totalClients} clients</Badge>
            </div>

            {dashboard?.todaysSchedule.clients.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No clients scheduled for today
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard?.todaysSchedule.clients.map((client: any) => (
                  <div key={client.clientId} className="border-l-4 border-red-500 pl-3 py-2 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{client.clientName}</div>
                        <div className="text-sm text-gray-600">{client.phone}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-red-600 font-semibold">
                          Rs.{client.overdueAmount.toLocaleString()}
                        </div>
                        <div className="text-xs text-gray-500">
                          {client.daysOverdue} days overdue
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" onClick={() => window.location.href = `tel:${client.phone}`}>
                        <Phone className="h-3 w-3 mr-1" />
                        Call
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => navigate(`/recovery/visit/${client.clientId}`)}>
                        Log Visit
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="link"
              className="w-full mt-4"
              onClick={() => navigate('/recovery/route')}
            >
              View Full Route
            </Button>
          </Card.Body>
        </Card>

        {/* Due Promises */}
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-lg">Due Promises</h3>
              <Badge className="bg-yellow-100 text-yellow-800">
                {dashboard?.duePromises.totalPromises} promises
              </Badge>
            </div>

            {dashboard?.duePromises.promises.length === 0 ? (
              <div className="text-center text-gray-500 py-4">
                No promises due today
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard?.duePromises.promises.map((promise: any) => (
                  <div
                    key={promise.promiseId}
                    className={`border-l-4 ${promise.isOverdue ? 'border-red-500' : 'border-blue-500'} pl-3 py-2 bg-gray-50 rounded`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold">{promise.clientName}</div>
                        <div className="text-sm text-gray-600">
                          {format(promise.promiseDate, 'PPP')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-semibold">
                          Rs.{promise.promiseAmount.toLocaleString()}
                        </div>
                        {promise.isOverdue && (
                          <Badge className="bg-red-100 text-red-800 text-xs">OVERDUE</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <Button
              variant="link"
              className="w-full mt-4"
              onClick={() => navigate('/recovery/promises/due')}
            >
              View All Due Promises
            </Button>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-3 gap-6 mb-6">
        {/* Overdue Summary */}
        <Card>
          <Card.Body>
            <h3 className="font-semibold mb-4">Overdue Summary</h3>
            <div className="text-3xl font-bold text-red-600 mb-4">
              Rs.{dashboard?.overdueSummary.total.toLocaleString()}
            </div>
            {overdueChartData.length > 0 && (
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={overdueChartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {overdueChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `Rs.${value.toLocaleString()}`} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </Card.Body>
        </Card>

        {/* Promise Fulfillment */}
        <Card>
          <Card.Body>
            <h3 className="font-semibold mb-4">Promise Fulfillment</h3>
            <div className="text-center">
              <div className="text-5xl font-bold text-blue-600 mb-2">
                {dashboard?.promiseFulfillmentRate}%
              </div>
              <div className="text-sm text-gray-600">Last 30 days</div>
            </div>
            <div className="mt-4 bg-gray-200 rounded-full h-4">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all"
                style={{ width: `${dashboard?.promiseFulfillmentRate}%` }}
              ></div>
            </div>
          </Card.Body>
        </Card>

        {/* Alerts */}
        <Card>
          <Card.Body>
            <h3 className="font-semibold mb-4">Alerts</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600" />
                  <span className="text-sm">Unacknowledged</span>
                </div>
                <span className="text-2xl font-bold">{dashboard?.alerts.totalUnacknowledged}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                  <span className="text-sm">Critical</span>
                </div>
                <span className="text-2xl font-bold text-red-600">
                  {dashboard?.alerts.criticalCount}
                </span>
              </div>
            </div>
            <Button
              variant="link"
              className="w-full mt-4"
              onClick={() => navigate('/alerts')}
            >
              View All Alerts
            </Button>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {/* Top Overdue Clients */}
        <Card>
          <Card.Body>
            <h3 className="font-semibold mb-4">Top Overdue Clients</h3>
            <div className="space-y-2">
              {dashboard?.topOverdueClients.map((client: any, index: number) => (
                <div key={client.clientId} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center gap-3">
                    <div className="text-lg font-bold text-gray-400">#{index + 1}</div>
                    <div>
                      <div className="font-semibold">{client.clientName}</div>
                      <div className="text-xs text-gray-500">{client.daysOverdue} days overdue</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">
                      Rs.{client.overdueAmount.toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>

        {/* Recent Visits */}
        <Card>
          <Card.Body>
            <h3 className="font-semibold mb-4">Recent Visits</h3>
            <div className="space-y-2">
              {dashboard?.recentVisits.map((visit: any) => (
                <div key={visit.visitNumber} className="p-2 hover:bg-gray-50 rounded">
                  <div className="flex items-center justify-between mb-1">
                    <div className="font-semibold">{visit.clientName}</div>
                    <Badge>{visit.outcome}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <div className="text-gray-600">{format(visit.visitDate, 'PPp')}</div>
                    {visit.amountCollected > 0 && (
                      <div className="font-semibold text-green-600">
                        Rs.{visit.amountCollected.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Card.Body>
        </Card>
      </div>
    </div>
  );
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
