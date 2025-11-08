# Story 7.8: Collection Efficiency Metrics

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.8
**Priority:** Medium
**Estimated Effort:** 5-7 hours
**Dependencies:** Epic 3 (Clients), Story 7.1
**Status:** Draft - Phase 2

---

## User Story

**As an** accountant,
**I want** to measure collection efficiency across the organization,
**So that** I can identify trends and improve cash flow.

---

## Acceptance Criteria

1. **Collection Efficiency Metrics:**
   - [ ] Collection Rate = (Collections / Receivables) × 100
   - [ ] Days Sales Outstanding (DSO) = (Average Receivables / Revenue per Day)
   - [ ] Collection Effectiveness Index (CEI) = (Beginning Receivables + Revenue - Ending Receivables) / (Beginning Receivables + Revenue - Ending Current Receivables) × 100
   - [ ] Average Collection Period
   - [ ] Overdue Percentage = (Overdue / Total Receivables) × 100

2. **Backend API:**
   - [ ] GET /api/reports/collection-efficiency - returns all metrics
   - [ ] Filters: dateFrom, dateTo, recoveryAgentId
   - [ ] Default: current month

3. **Trend Analysis:**
   - [ ] Month-over-month comparison
   - [ ] Year-over-year comparison
   - [ ] 12-month rolling average

4. **Benchmarking:**
   - [ ] Target DSO (configurable, default: 30 days)
   - [ ] Target collection rate (configurable, default: 90%)
   - [ ] Show variance from target

5. **Frontend:**
   - [ ] Collection Efficiency Dashboard
   - [ ] KPI cards with trend indicators
   - [ ] Line chart: DSO trend
   - [ ] Bar chart: Monthly collection rate
   - [ ] Pie chart: Receivables aging distribution
   - [ ] Export to Excel

6. **Authorization:**
   - [ ] Admin and Accountant can view all metrics
   - [ ] Recovery Agent can view team metrics

---

## Dev Notes

```typescript
interface CollectionEfficiencyMetrics {
  period: {
    from: Date;
    to: Date;
  };
  collectionRate: number;
  dso: number;
  cei: number;
  averageCollectionPeriod: number;
  overduePercentage: number;
  totalReceivables: number;
  totalOverdue: number;
  totalCollections: number;
  targets: {
    dso: number;
    collectionRate: number;
  };
  variance: {
    dso: number;
    collectionRate: number;
  };
  trend: {
    collectionRate: { previous: number; change: number };
    dso: { previous: number; change: number };
  };
}

async function getCollectionEfficiencyMetrics(
  dateFrom: Date,
  dateTo: Date,
  recoveryAgentId?: string
): Promise<CollectionEfficiencyMetrics> {
  // Get targets from configuration
  const dsoTarget = await getConfigValue('DSO_TARGET', 30);
  const collectionRateTarget = await getConfigValue('COLLECTION_RATE_TARGET', 90);

  // Calculate current period metrics
  const where: any = {
    status: 'ACTIVE'
  };

  if (recoveryAgentId) {
    where.recoveryAgentId = recoveryAgentId;
  }

  // Total receivables at end of period
  const clients = await prisma.client.findMany({
    where,
    include: {
      invoices: {
        where: {
          status: { in: ['UNPAID', 'PARTIAL'] }
        }
      }
    }
  });

  let totalReceivables = 0;
  let totalOverdue = 0;
  const endDate = dateTo;

  for (const client of clients) {
    const balance = parseFloat(client.balance.toString());
    totalReceivables += balance;

    const overdueInvoices = client.invoices.filter(
      inv => inv.dueDate && inv.dueDate < endDate
    );
    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString()),
      0
    );
    totalOverdue += overdueAmount;
  }

  // Collections during period
  const paymentWhere: any = {
    date: {
      gte: dateFrom,
      lte: dateTo
    }
  };

  if (recoveryAgentId) {
    paymentWhere.client = { recoveryAgentId };
  }

  const payments = await prisma.payment.findMany({
    where: paymentWhere
  });

  const totalCollections = payments.reduce(
    (sum, p) => sum + parseFloat(p.amount.toString()),
    0
  );

  // Collection Rate = (Collections / Receivables) × 100
  const collectionRate = totalReceivables > 0
    ? (totalCollections / totalReceivables) * 100
    : 0;

  // Overdue Percentage
  const overduePercentage = totalReceivables > 0
    ? (totalOverdue / totalReceivables) * 100
    : 0;

  // Calculate DSO (Days Sales Outstanding)
  // DSO = (Average Receivables / Revenue per Day)
  const daysInPeriod = differenceInDays(dateTo, dateFrom);

  // Get beginning receivables
  const beginningClients = await prisma.client.findMany({
    where,
    select: { balance: true }
  });
  const beginningReceivables = beginningClients.reduce(
    (sum, c) => sum + parseFloat(c.balance.toString()),
    0
  );

  const averageReceivables = (beginningReceivables + totalReceivables) / 2;

  // Get revenue for period (total invoices)
  const invoiceWhere: any = {
    date: {
      gte: dateFrom,
      lte: dateTo
    }
  };

  if (recoveryAgentId) {
    invoiceWhere.client = { recoveryAgentId };
  }

  const invoices = await prisma.invoice.findMany({
    where: invoiceWhere
  });

  const totalRevenue = invoices.reduce(
    (sum, inv) => sum + parseFloat(inv.total.toString()),
    0
  );

  const revenuePerDay = totalRevenue / daysInPeriod;
  const dso = revenuePerDay > 0 ? averageReceivables / revenuePerDay : 0;

  // Calculate CEI (Collection Effectiveness Index)
  // CEI = (Beginning Receivables + Revenue - Ending Receivables) / (Beginning Receivables + Revenue - Ending Current Receivables) × 100
  const currentReceivables = totalReceivables - totalOverdue; // Non-overdue receivables
  const cei =
    beginningReceivables + totalRevenue - currentReceivables > 0
      ? ((beginningReceivables + totalRevenue - totalReceivables) /
          (beginningReceivables + totalRevenue - currentReceivables)) *
        100
      : 0;

  // Average Collection Period
  // For invoices paid during period, calculate days between invoice date and payment date
  const paymentsWithAllocations = await prisma.payment.findMany({
    where: paymentWhere,
    include: {
      allocations: {
        include: {
          invoice: true
        }
      }
    }
  });

  let totalDays = 0;
  let invoiceCount = 0;

  for (const payment of paymentsWithAllocations) {
    for (const allocation of payment.allocations) {
      const days = differenceInDays(
        payment.date,
        allocation.invoice.date
      );
      totalDays += days;
      invoiceCount++;
    }
  }

  const averageCollectionPeriod = invoiceCount > 0
    ? Math.round(totalDays / invoiceCount)
    : 0;

  // Get previous period metrics for trend
  const previousDateFrom = subMonths(dateFrom, 1);
  const previousDateTo = subMonths(dateTo, 1);

  const previousMetrics = await getCollectionEfficiencyMetrics(
    previousDateFrom,
    previousDateTo,
    recoveryAgentId
  );

  const collectionRateChange = collectionRate - previousMetrics.collectionRate;
  const dsoChange = dso - previousMetrics.dso;

  return {
    period: { from: dateFrom, to: dateTo },
    collectionRate: Math.round(collectionRate * 10) / 10,
    dso: Math.round(dso),
    cei: Math.round(cei * 10) / 10,
    averageCollectionPeriod,
    overduePercentage: Math.round(overduePercentage * 10) / 10,
    totalReceivables,
    totalOverdue,
    totalCollections,
    targets: {
      dso: dsoTarget,
      collectionRate: collectionRateTarget
    },
    variance: {
      dso: Math.round(dso - dsoTarget),
      collectionRate: Math.round((collectionRate - collectionRateTarget) * 10) / 10
    },
    trend: {
      collectionRate: {
        previous: previousMetrics.collectionRate,
        change: Math.round(collectionRateChange * 10) / 10
      },
      dso: {
        previous: previousMetrics.dso,
        change: Math.round(dsoChange)
      }
    }
  };
}

async function getCollectionEfficiencyTrend(
  months: number = 12,
  recoveryAgentId?: string
): Promise<any[]> {
  const trend: any[] = [];
  const today = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const monthStart = startOfMonth(subMonths(today, i));
    const monthEnd = endOfMonth(subMonths(today, i));

    const metrics = await getCollectionEfficiencyMetrics(
      monthStart,
      monthEnd,
      recoveryAgentId
    );

    trend.push({
      month: format(monthStart, 'MMM yyyy'),
      collectionRate: metrics.collectionRate,
      dso: metrics.dso,
      overduePercentage: metrics.overduePercentage
    });
  }

  return trend;
}

async function getConfigValue(key: string, defaultValue: number): Promise<number> {
  const config = await prisma.configuration.findUnique({
    where: { key }
  });

  return config ? parseFloat(config.value) : defaultValue;
}
```

**Frontend:**
```tsx
import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { TrendingUp, TrendingDown, Target, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

export const CollectionEfficiencyPage: FC = () => {
  const [dateRange, setDateRange] = useState({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const { data: metrics, isLoading } = useQuery({
    queryKey: ['collection-efficiency', dateRange],
    queryFn: () =>
      fetch(
        `/api/reports/collection-efficiency?dateFrom=${dateRange.from.toISOString()}&dateTo=${dateRange.to.toISOString()}`
      ).then(res => res.json())
  });

  const { data: trend } = useQuery({
    queryKey: ['collection-efficiency-trend'],
    queryFn: () =>
      fetch('/api/reports/collection-efficiency/trend').then(res => res.json())
  });

  const getTrendIcon = (change: number) => {
    return change > 0 ? (
      <TrendingUp className="h-5 w-5 text-green-600" />
    ) : (
      <TrendingDown className="h-5 w-5 text-red-600" />
    );
  };

  const getTrendColor = (change: number) => {
    return change > 0 ? 'text-green-600' : 'text-red-600';
  };

  if (isLoading) return <Spinner />;

  const agingData = [
    { name: 'Current', value: metrics?.totalReceivables - metrics?.totalOverdue, color: '#10b981' },
    { name: 'Overdue', value: metrics?.totalOverdue, color: '#ef4444' }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Collection Efficiency Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">Collection Rate</div>
              {getTrendIcon(metrics?.trend.collectionRate.change)}
            </div>
            <div className="text-3xl font-bold">{metrics?.collectionRate}%</div>
            <div className="flex items-center gap-2 mt-2">
              <Target className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Target: {metrics?.targets.collectionRate}%</span>
            </div>
            <div className={`text-sm ${getTrendColor(metrics?.variance.collectionRate)}`}>
              {metrics?.variance.collectionRate > 0 ? '+' : ''}{metrics?.variance.collectionRate}% vs target
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm text-gray-600">DSO (Days)</div>
              {getTrendIcon(-metrics?.trend.dso.change)} {/* Lower DSO is better */}
            </div>
            <div className="text-3xl font-bold">{metrics?.dso}</div>
            <div className="flex items-center gap-2 mt-2">
              <Target className="h-4 w-4 text-gray-400" />
              <span className="text-sm text-gray-600">Target: {metrics?.targets.dso} days</span>
            </div>
            <div className={`text-sm ${metrics?.variance.dso < 0 ? 'text-green-600' : 'text-red-600'}`}>
              {metrics?.variance.dso > 0 ? '+' : ''}{metrics?.variance.dso} days vs target
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 mb-2">Collection Effectiveness</div>
            <div className="text-3xl font-bold text-blue-600">{metrics?.cei}%</div>
            <div className="text-sm text-gray-600 mt-2">CEI Score</div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600 mb-2">Avg Collection Period</div>
            <div className="text-3xl font-bold text-purple-600">
              {metrics?.averageCollectionPeriod}
            </div>
            <div className="text-sm text-gray-600 mt-2">days</div>
          </Card.Body>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600">Total Receivables</div>
            <div className="text-2xl font-bold">
              Rs.{metrics?.totalReceivables.toLocaleString()}
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600">Total Overdue</div>
            <div className="text-2xl font-bold text-red-600">
              Rs.{metrics?.totalOverdue.toLocaleString()}
            </div>
            <div className="text-sm text-gray-500">
              {metrics?.overduePercentage}% of receivables
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600">Total Collections</div>
            <div className="text-2xl font-bold text-green-600">
              Rs.{metrics?.totalCollections.toLocaleString()}
            </div>
          </Card.Body>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <Card>
          <Card.Body>
            <h3 className="font-semibold mb-4">DSO Trend (12 Months)</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="dso"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  name="DSO (Days)"
                />
              </LineChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <h3 className="font-semibold mb-4">Collection Rate Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
                <Bar dataKey="collectionRate" fill="#10b981" name="Collection Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card>
          <Card.Body>
            <h3 className="font-semibold mb-4">Receivables Distribution</h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={agingData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={(entry) => `${entry.name}: Rs.${(entry.value || 0).toLocaleString()}`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {agingData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => `Rs.${value.toLocaleString()}`} />
              </PieChart>
            </ResponsiveContainer>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <h3 className="font-semibold mb-4">Overdue Percentage Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `${value}%`} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="overduePercentage"
                  stroke="#ef4444"
                  strokeWidth={2}
                  name="Overdue %"
                />
              </LineChart>
            </ResponsiveContainer>
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
