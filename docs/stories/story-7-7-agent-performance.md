# Story 7.7: Recovery Agent Performance Dashboard

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.7
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 7.1, Story 7.4, Story 7.5
**Status:** Draft - Phase 2

---

## User Story

**As an** admin,
**I want** to view recovery agent performance metrics,
**So that** I can evaluate effectiveness and optimize assignments.

---

## Acceptance Criteria

1. **Performance Metrics:**
   - [ ] Total clients assigned
   - [ ] Total outstanding balance
   - [ ] Total overdue balance
   - [ ] Collections this month (amount)
   - [ ] Collections this month (count)
   - [ ] Recovery visits this month (count)
   - [ ] Promise fulfillment rate (%)
   - [ ] Average days to collect
   - [ ] Collection efficiency (collected / assigned)

2. **Backend API:**
   - [ ] GET /api/recovery/agents/performance - all agents summary
   - [ ] GET /api/recovery/agents/:id/performance - specific agent details
   - [ ] Filters: dateFrom, dateTo
   - [ ] Default: current month

3. **Comparative Metrics:**
   - [ ] Rank agents by collection amount
   - [ ] Rank agents by fulfillment rate
   - [ ] Rank agents by visit count

4. **Trend Data:**
   - [ ] Collections trend (last 12 months)
   - [ ] Visit frequency trend
   - [ ] Promise fulfillment trend

5. **Frontend:**
   - [ ] Recovery Agent Performance page
   - [ ] Agent comparison table
   - [ ] Individual agent detail view
   - [ ] Charts: Collections trend, fulfillment rate
   - [ ] Leaderboard widget
   - [ ] Export to Excel

6. **Authorization:**
   - [ ] Admin and Accountant can view all agents
   - [ ] Recovery Agent can view only their own performance

---

## Dev Notes

```typescript
interface AgentPerformanceMetrics {
  agentId: string;
  agentName: string;
  totalClients: number;
  totalOutstanding: number;
  totalOverdue: number;
  collectionsAmount: number;
  collectionsCount: number;
  visitsCount: number;
  promiseFulfillmentRate: number;
  averageDaysToCollect: number;
  collectionEfficiency: number;
  rank: number;
}

async function getAgentPerformance(
  agentId: string,
  dateFrom: Date,
  dateTo: Date
): Promise<AgentPerformanceMetrics> {
  const agent = await prisma.user.findUnique({
    where: { id: agentId }
  });

  if (!agent) {
    throw new NotFoundError('Agent not found');
  }

  // Get assigned clients
  const clients = await prisma.client.findMany({
    where: {
      recoveryAgentId: agentId,
      status: 'ACTIVE'
    },
    include: {
      invoices: {
        where: {
          status: { in: ['UNPAID', 'PARTIAL'] }
        }
      }
    }
  });

  const totalClients = clients.length;

  // Calculate outstanding and overdue
  let totalOutstanding = 0;
  let totalOverdue = 0;
  const today = new Date();

  for (const client of clients) {
    const balance = parseFloat(client.balance.toString());
    totalOutstanding += balance;

    const overdueInvoices = client.invoices.filter(
      inv => inv.dueDate && inv.dueDate < today
    );
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString()),
      0
    );
    totalOverdue += overdueAmount;
  }

  // Get collections in date range
  const payments = await prisma.payment.findMany({
    where: {
      client: {
        recoveryAgentId: agentId
      },
      date: {
        gte: dateFrom,
        lte: dateTo
      }
    }
  });

  const collectionsAmount = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount.toString()),
    0
  );
  const collectionsCount = payments.length;

  // Get visits in date range
  const visits = await prisma.recoveryVisit.findMany({
    where: {
      visitedBy: agentId,
      visitDate: {
        gte: dateFrom,
        lte: dateTo
      }
    }
  });

  const visitsCount = visits.length;

  // Get promise fulfillment rate
  const promises = await prisma.paymentPromise.findMany({
    where: {
      createdBy: agentId,
      promiseDate: {
        gte: dateFrom,
        lte: dateTo
      },
      status: { in: ['FULFILLED', 'PARTIAL', 'BROKEN'] }
    }
  });

  const totalPromises = promises.length;
  const fulfilledPromises = promises.filter(p => p.status === 'FULFILLED').length;
  const partialPromises = promises.filter(p => p.status === 'PARTIAL').length;

  const promiseFulfillmentRate = totalPromises > 0
    ? ((fulfilledPromises + partialPromises * 0.5) / totalPromises) * 100
    : 0;

  // Calculate average days to collect
  const paymentsWithInvoices = await prisma.payment.findMany({
    where: {
      client: {
        recoveryAgentId: agentId
      },
      date: {
        gte: dateFrom,
        lte: dateTo
      }
    },
    include: {
      allocations: {
        include: {
          invoice: true
        }
      }
    }
  });

  let totalDaysToCollect = 0;
  let invoiceCount = 0;

  for (const payment of paymentsWithInvoices) {
    for (const allocation of payment.allocations) {
      if (allocation.invoice.dueDate) {
        const daysToCollect = differenceInDays(
          payment.date,
          allocation.invoice.dueDate
        );
        totalDaysToCollect += Math.max(0, daysToCollect); // Only count overdue days
        invoiceCount++;
      }
    }
  }

  const averageDaysToCollect = invoiceCount > 0
    ? Math.round(totalDaysToCollect / invoiceCount)
    : 0;

  // Collection efficiency (collected / assigned)
  const collectionEfficiency = totalOutstanding > 0
    ? (collectionsAmount / totalOutstanding) * 100
    : 0;

  return {
    agentId,
    agentName: agent.name,
    totalClients,
    totalOutstanding,
    totalOverdue,
    collectionsAmount,
    collectionsCount,
    visitsCount,
    promiseFulfillmentRate: Math.round(promiseFulfillmentRate * 10) / 10,
    averageDaysToCollect,
    collectionEfficiency: Math.round(collectionEfficiency * 10) / 10,
    rank: 0 // Will be calculated in getAllAgentsPerformance
  };
}

async function getAllAgentsPerformance(
  dateFrom: Date,
  dateTo: Date
): Promise<AgentPerformanceMetrics[]> {
  const agents = await prisma.user.findMany({
    where: {
      role: 'RECOVERY_AGENT',
      status: 'ACTIVE'
    }
  });

  const performanceMetrics: AgentPerformanceMetrics[] = [];

  for (const agent of agents) {
    const metrics = await getAgentPerformance(agent.id, dateFrom, dateTo);
    performanceMetrics.push(metrics);
  }

  // Rank by collections amount
  performanceMetrics.sort((a, b) => b.collectionsAmount - a.collectionsAmount);
  performanceMetrics.forEach((metrics, index) => {
    metrics.rank = index + 1;
  });

  return performanceMetrics;
}

async function getAgentCollectionsTrend(
  agentId: string,
  months: number = 12
): Promise<{ month: string; amount: number }[]> {
  const trend: { month: string; amount: number }[] = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(today, i));
    const monthEnd = endOfMonth(subMonths(today, i));

    const payments = await prisma.payment.findMany({
      where: {
        client: {
          recoveryAgentId: agentId
        },
        date: {
          gte: monthStart,
          lte: monthEnd
        }
      }
    });

    const amount = payments.reduce(
      (sum, p) => sum + parseFloat(p.amount.toString()),
      0
    );

    trend.push({
      month: format(monthStart, 'MMM yyyy'),
      amount
    });
  }

  return trend;
}
```

**Frontend:**
```tsx
import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, Users, DollarSign, Calendar, Award } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const AgentPerformancePage: FC = () => {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const { data: agents, isLoading } = useQuery({
    queryKey: ['agent-performance', dateRange],
    queryFn: () =>
      fetch(
        `/api/recovery/agents/performance?dateFrom=${dateRange.from.toISOString()}&dateTo=${dateRange.to.toISOString()}`
      ).then(res => res.json())
  });

  const topPerformer = agents?.[0];

  if (isLoading) return <Spinner />;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Recovery Agent Performance</h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Collections</div>
                <div className="text-2xl font-bold">
                  Rs.{agents?.reduce((sum: number, a: any) => sum + a.collectionsAmount, 0).toLocaleString()}
                </div>
              </div>
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Total Visits</div>
                <div className="text-2xl font-bold">
                  {agents?.reduce((sum: number, a: any) => sum + a.visitsCount, 0)}
                </div>
              </div>
              <Calendar className="h-8 w-8 text-blue-600" />
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Active Agents</div>
                <div className="text-2xl font-bold">{agents?.length || 0}</div>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600">Top Performer</div>
                <div className="text-lg font-bold">{topPerformer?.agentName || '-'}</div>
                <div className="text-xs text-gray-500">
                  Rs.{topPerformer?.collectionsAmount.toLocaleString()}
                </div>
              </div>
              <Award className="h-8 w-8 text-yellow-600" />
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <Card.Body>
          <div className="grid grid-cols-3 gap-4">
            <DatePicker
              label="From Date"
              value={dateRange.from}
              onChange={(date) => setDateRange(prev => ({ ...prev, from: date }))}
            />
            <DatePicker
              label="To Date"
              value={dateRange.to}
              onChange={(date) => setDateRange(prev => ({ ...prev, to: date }))}
            />
            <Button onClick={() => setDateRange({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) })}>
              Current Month
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Performance Table */}
      <Card>
        <Card.Body>
          <h3 className="font-semibold mb-4">Agent Performance Comparison</h3>
          <Table>
            <thead>
              <tr>
                <th>Rank</th>
                <th>Agent</th>
                <th>Clients</th>
                <th>Collections</th>
                <th>Visits</th>
                <th>Fulfillment Rate</th>
                <th>Avg Days to Collect</th>
                <th>Efficiency</th>
              </tr>
            </thead>
            <tbody>
              {agents?.map((agent: any) => (
                <tr key={agent.agentId}>
                  <td>
                    <Badge className={agent.rank === 1 ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}>
                      #{agent.rank}
                    </Badge>
                  </td>
                  <td>
                    <Link to={`/recovery/agents/${agent.agentId}/performance`}>
                      {agent.agentName}
                    </Link>
                  </td>
                  <td>{agent.totalClients}</td>
                  <td className="font-semibold text-green-600">
                    Rs.{agent.collectionsAmount.toLocaleString()}
                  </td>
                  <td>{agent.visitsCount}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{ width: `${agent.promiseFulfillmentRate}%` }}
                        ></div>
                      </div>
                      <span className="text-sm">{agent.promiseFulfillmentRate}%</span>
                    </div>
                  </td>
                  <td>{agent.averageDaysToCollect} days</td>
                  <td>{agent.collectionEfficiency}%</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>
    </div>
  );
};

// Individual Agent Detail View
export const AgentPerformanceDetailPage: FC<{ agentId: string }> = ({ agentId }) => {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const { data: performance } = useQuery({
    queryKey: ['agent-performance-detail', agentId, dateRange],
    queryFn: () =>
      fetch(
        `/api/recovery/agents/${agentId}/performance?dateFrom=${dateRange.from.toISOString()}&dateTo=${dateRange.to.toISOString()}`
      ).then(res => res.json())
  });

  const { data: trend } = useQuery({
    queryKey: ['agent-collections-trend', agentId],
    queryFn: () =>
      fetch(`/api/recovery/agents/${agentId}/collections-trend`).then(res => res.json())
  });

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">{performance?.agentName} - Performance</h1>

      {/* Metrics Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600">Total Collections</div>
            <div className="text-3xl font-bold text-green-600">
              Rs.{performance?.collectionsAmount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {performance?.collectionsCount} payments
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600">Promise Fulfillment</div>
            <div className="text-3xl font-bold text-blue-600">
              {performance?.promiseFulfillmentRate}%
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600">Recovery Visits</div>
            <div className="text-3xl font-bold text-purple-600">
              {performance?.visitsCount}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Collections Trend Chart */}
      <Card className="mb-6">
        <Card.Body>
          <h3 className="font-semibold mb-4">Collections Trend (Last 12 Months)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `Rs.${value.toLocaleString()}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#10b981"
                strokeWidth={2}
                name="Collections"
              />
            </LineChart>
          </ResponsiveContainer>
        </Card.Body>
      </Card>

      {/* Client Portfolio */}
      <Card>
        <Card.Body>
          <h3 className="font-semibold mb-4">Client Portfolio</h3>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Clients</div>
              <div className="text-2xl font-bold">{performance?.totalClients}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Outstanding</div>
              <div className="text-2xl font-bold">
                Rs.{performance?.totalOutstanding.toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Overdue</div>
              <div className="text-2xl font-bold text-red-600">
                Rs.{performance?.totalOverdue.toLocaleString()}
              </div>
            </div>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
