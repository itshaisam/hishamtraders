# Story 7.9: Recovery Report Suite

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.9
**Priority:** Medium
**Estimated Effort:** 6-8 hours
**Dependencies:** Story 7.1, Story 7.4, Story 7.5
**Status:** Draft - Phase 2

---

## User Story

**As an** accountant/admin,
**I want** a comprehensive suite of recovery reports,
**So that** I can analyze collection performance and make data-driven decisions.

---

## Acceptance Criteria

1. **Report Types:**
   - [ ] Recovery Schedule Report (clients by day)
   - [ ] Visit Activity Report (visits by agent/date)
   - [ ] Payment Promise Report (promises with status)
   - [ ] Collection Summary Report (collections by agent/period)
   - [ ] Overdue Clients Report (aging buckets)
   - [ ] Recovery Agent Productivity Report

2. **Backend API:**
   - [ ] GET /api/reports/recovery/schedule - recovery schedule report
   - [ ] GET /api/reports/recovery/visits - visit activity report
   - [ ] GET /api/reports/recovery/promises - payment promise report
   - [ ] GET /api/reports/recovery/collections - collection summary
   - [ ] GET /api/reports/recovery/overdue - overdue clients report
   - [ ] GET /api/reports/recovery/productivity - agent productivity

3. **Common Filters:**
   - [ ] Date range
   - [ ] Recovery agent
   - [ ] Client
   - [ ] Visit outcome
   - [ ] Promise status

4. **Export Formats:**
   - [ ] Excel (.xlsx)
   - [ ] PDF (formatted reports)
   - [ ] CSV

5. **Report Features:**
   - [ ] Sortable columns
   - [ ] Summary totals
   - [ ] Drill-down capability (click to view details)
   - [ ] Scheduled reports (email delivery)

6. **Frontend:**
   - [ ] Reports Center page with report categories
   - [ ] Each report has dedicated page with filters
   - [ ] Export buttons
   - [ ] Print-friendly view

7. **Authorization:**
   - [ ] Admin and Accountant can view all reports
   - [ ] Recovery Agent can view only their own data

---

## Dev Notes

```typescript
// Visit Activity Report
interface VisitActivityReport {
  visitNumber: string;
  visitDate: Date;
  agentName: string;
  clientName: string;
  outcome: string;
  amountCollected: number;
  promiseMade: boolean;
  promiseAmount?: number;
  notes: string;
}

async function getVisitActivityReport(
  filters: {
    dateFrom: Date;
    dateTo: Date;
    agentId?: string;
    clientId?: string;
    outcome?: string;
  }
): Promise<VisitActivityReport[]> {
  const where: any = {
    visitDate: {
      gte: filters.dateFrom,
      lte: filters.dateTo
    }
  };

  if (filters.agentId) {
    where.visitedBy = filters.agentId;
  }

  if (filters.clientId) {
    where.clientId = filters.clientId;
  }

  if (filters.outcome) {
    where.outcome = filters.outcome;
  }

  const visits = await prisma.recoveryVisit.findMany({
    where,
    include: {
      agent: true,
      client: true
    },
    orderBy: { visitDate: 'desc' }
  });

  return visits.map(visit => ({
    visitNumber: visit.visitNumber,
    visitDate: visit.visitDate,
    agentName: visit.agent.name,
    clientName: visit.client.name,
    outcome: visit.outcome,
    amountCollected: parseFloat(visit.amountCollected.toString()),
    promiseMade: !!visit.promiseDate,
    promiseAmount: visit.promiseAmount ? parseFloat(visit.promiseAmount.toString()) : undefined,
    notes: visit.notes || ''
  }));
}

// Collection Summary Report
interface CollectionSummary {
  agentName: string;
  totalCollections: number;
  collectionsCount: number;
  averageCollection: number;
  clientsVisited: number;
  promisesMade: number;
  promisesFulfilled: number;
}

async function getCollectionSummaryReport(
  filters: {
    dateFrom: Date;
    dateTo: Date;
    agentId?: string;
  }
): Promise<CollectionSummary[]> {
  const agentWhere: any = {
    role: 'RECOVERY_AGENT',
    status: 'ACTIVE'
  };

  if (filters.agentId) {
    agentWhere.id = filters.agentId;
  }

  const agents = await prisma.user.findMany({
    where: agentWhere
  });

  const summaries: CollectionSummary[] = [];

  for (const agent of agents) {
    // Get visits
    const visits = await prisma.recoveryVisit.findMany({
      where: {
        visitedBy: agent.id,
        visitDate: {
          gte: filters.dateFrom,
          lte: filters.dateTo
        }
      }
    });

    const totalCollections = visits.reduce(
      (sum, v) => sum + parseFloat(v.amountCollected.toString()),
      0
    );

    const collectionsCount = visits.filter(v => parseFloat(v.amountCollected.toString()) > 0).length;

    const averageCollection = collectionsCount > 0 ? totalCollections / collectionsCount : 0;

    const clientsVisited = new Set(visits.map(v => v.clientId)).size;

    // Get promises
    const promises = await prisma.paymentPromise.findMany({
      where: {
        createdBy: agent.id,
        createdAt: {
          gte: filters.dateFrom,
          lte: filters.dateTo
        }
      }
    });

    const promisesMade = promises.length;
    const promisesFulfilled = promises.filter(p => p.status === 'FULFILLED').length;

    summaries.push({
      agentName: agent.name,
      totalCollections,
      collectionsCount,
      averageCollection,
      clientsVisited,
      promisesMade,
      promisesFulfilled
    });
  }

  return summaries.sort((a, b) => b.totalCollections - a.totalCollections);
}

// Overdue Clients Report
interface OverdueClient {
  clientName: string;
  contactPerson: string;
  phone: string;
  area: string;
  recoveryAgent: string;
  totalBalance: number;
  overdueAmount: number;
  daysOverdue: number;
  agingBucket: string;
  lastPaymentDate?: Date;
  lastVisitDate?: Date;
}

async function getOverdueClientsReport(
  filters: {
    agentId?: string;
    area?: string;
    minDaysOverdue?: number;
  }
): Promise<OverdueClient[]> {
  const today = new Date();
  const where: any = {
    balance: { gt: 0 },
    status: 'ACTIVE'
  };

  if (filters.agentId) {
    where.recoveryAgentId = filters.agentId;
  }

  if (filters.area) {
    where.area = filters.area;
  }

  const clients = await prisma.client.findMany({
    where,
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
      },
      recoveryVisits: {
        orderBy: { visitDate: 'desc' },
        take: 1
      }
    }
  });

  const overdueClients: OverdueClient[] = [];

  for (const client of clients) {
    const overdueInvoices = client.invoices.filter(
      inv => inv.dueDate && inv.dueDate < today
    );

    if (overdueInvoices.length === 0) continue;

    const overdueAmount = overdueInvoices.reduce(
      (sum, inv) => sum + parseFloat(inv.total.toString()) - parseFloat(inv.paidAmount.toString()),
      0
    );

    const oldestInvoice = overdueInvoices.sort(
      (a, b) => a.dueDate!.getTime() - b.dueDate!.getTime()
    )[0];

    const daysOverdue = differenceInDays(today, oldestInvoice.dueDate!);

    if (filters.minDaysOverdue && daysOverdue < filters.minDaysOverdue) {
      continue;
    }

    let agingBucket: string;
    if (daysOverdue <= 7) {
      agingBucket = '1-7 days';
    } else if (daysOverdue <= 14) {
      agingBucket = '8-14 days';
    } else if (daysOverdue <= 30) {
      agingBucket = '15-30 days';
    } else {
      agingBucket = '30+ days';
    }

    overdueClients.push({
      clientName: client.name,
      contactPerson: client.contactPerson || '',
      phone: client.phone || '',
      area: client.area || '',
      recoveryAgent: client.recoveryAgent?.name || 'Unassigned',
      totalBalance: parseFloat(client.balance.toString()),
      overdueAmount,
      daysOverdue,
      agingBucket,
      lastPaymentDate: client.payments[0]?.date,
      lastVisitDate: client.recoveryVisits[0]?.visitDate
    });
  }

  return overdueClients.sort((a, b) => b.overdueAmount - a.overdueAmount);
}

// Agent Productivity Report
interface AgentProductivity {
  agentName: string;
  workingDays: number;
  totalVisits: number;
  visitsPerDay: number;
  successfulVisits: number;
  successRate: number;
  totalCollected: number;
  collectionPerVisit: number;
}

async function getAgentProductivityReport(
  filters: {
    dateFrom: Date;
    dateTo: Date;
    agentId?: string;
  }
): Promise<AgentProductivity[]> {
  const agentWhere: any = {
    role: 'RECOVERY_AGENT',
    status: 'ACTIVE'
  };

  if (filters.agentId) {
    agentWhere.id = filters.agentId;
  }

  const agents = await prisma.user.findMany({
    where: agentWhere
  });

  const workingDays = differenceInDays(filters.dateTo, filters.dateFrom) + 1;

  const productivityReports: AgentProductivity[] = [];

  for (const agent of agents) {
    const visits = await prisma.recoveryVisit.findMany({
      where: {
        visitedBy: agent.id,
        visitDate: {
          gte: filters.dateFrom,
          lte: filters.dateTo
        }
      }
    });

    const totalVisits = visits.length;
    const visitsPerDay = workingDays > 0 ? totalVisits / workingDays : 0;

    const successfulVisits = visits.filter(
      v => ['PAYMENT_COLLECTED', 'PARTIAL_PAYMENT', 'PROMISE_MADE'].includes(v.outcome)
    ).length;

    const successRate = totalVisits > 0 ? (successfulVisits / totalVisits) * 100 : 0;

    const totalCollected = visits.reduce(
      (sum, v) => sum + parseFloat(v.amountCollected.toString()),
      0
    );

    const collectionPerVisit = totalVisits > 0 ? totalCollected / totalVisits : 0;

    productivityReports.push({
      agentName: agent.name,
      workingDays,
      totalVisits,
      visitsPerDay: Math.round(visitsPerDay * 10) / 10,
      successfulVisits,
      successRate: Math.round(successRate * 10) / 10,
      totalCollected,
      collectionPerVisit: Math.round(collectionPerVisit)
    });
  }

  return productivityReports.sort((a, b) => b.totalCollected - a.totalCollected);
}
```

**Frontend:**
```tsx
import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, FileText, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import * as XLSX from 'xlsx';

export const RecoveryReportsCenterPage: FC = () => {
  const reports = [
    {
      id: 'visit-activity',
      name: 'Visit Activity Report',
      description: 'Detailed log of all recovery visits',
      icon: Calendar,
      path: '/reports/recovery/visits'
    },
    {
      id: 'collection-summary',
      name: 'Collection Summary',
      description: 'Collections by agent and period',
      icon: DollarSign,
      path: '/reports/recovery/collections'
    },
    {
      id: 'overdue-clients',
      name: 'Overdue Clients',
      description: 'Clients with overdue payments',
      icon: AlertCircle,
      path: '/reports/recovery/overdue'
    },
    {
      id: 'agent-productivity',
      name: 'Agent Productivity',
      description: 'Recovery agent performance metrics',
      icon: TrendingUp,
      path: '/reports/recovery/productivity'
    },
    {
      id: 'payment-promises',
      name: 'Payment Promises',
      description: 'Promise tracking and fulfillment',
      icon: CheckCircle,
      path: '/reports/recovery/promises'
    }
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Recovery Reports</h1>

      <div className="grid grid-cols-3 gap-6">
        {reports.map(report => (
          <Card
            key={report.id}
            className="hover:shadow-lg cursor-pointer transition-shadow"
            onClick={() => navigate(report.path)}
          >
            <Card.Body>
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-50 rounded-lg">
                  <report.icon className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{report.name}</h3>
                  <p className="text-sm text-gray-600">{report.description}</p>
                </div>
              </div>
            </Card.Body>
          </Card>
        ))}
      </div>
    </div>
  );
};

// Visit Activity Report Page
export const VisitActivityReportPage: FC = () => {
  const [filters, setFilters] = useState({
    dateFrom: startOfMonth(new Date()),
    dateTo: endOfMonth(new Date()),
    agentId: '',
    outcome: ''
  });

  const { data: visits, isLoading } = useQuery({
    queryKey: ['visit-activity-report', filters],
    queryFn: () =>
      fetch(
        `/api/reports/recovery/visits?${new URLSearchParams({
          dateFrom: filters.dateFrom.toISOString(),
          dateTo: filters.dateTo.toISOString(),
          agentId: filters.agentId,
          outcome: filters.outcome
        })}`
      ).then(res => res.json())
  });

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(
      visits?.map((visit: any) => ({
        'Visit #': visit.visitNumber,
        Date: format(visit.visitDate, 'yyyy-MM-dd'),
        Agent: visit.agentName,
        Client: visit.clientName,
        Outcome: visit.outcome,
        'Amount Collected': visit.amountCollected,
        'Promise Amount': visit.promiseAmount || '-',
        Notes: visit.notes
      })) || []
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Visit Activity');
    XLSX.writeFile(workbook, `visit-activity-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  if (isLoading) return <Spinner />;

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Visit Activity Report</h1>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="grid grid-cols-4 gap-4">
            <DatePicker
              label="From Date"
              value={filters.dateFrom}
              onChange={(date) => setFilters(prev => ({ ...prev, dateFrom: date }))}
            />
            <DatePicker
              label="To Date"
              value={filters.dateTo}
              onChange={(date) => setFilters(prev => ({ ...prev, dateTo: date }))}
            />
            <Select
              label="Recovery Agent"
              value={filters.agentId}
              onChange={(e) => setFilters(prev => ({ ...prev, agentId: e.target.value }))}
            >
              <option value="">All Agents</option>
              {/* Agent options */}
            </Select>
            <Select
              label="Outcome"
              value={filters.outcome}
              onChange={(e) => setFilters(prev => ({ ...prev, outcome: e.target.value }))}
            >
              <option value="">All Outcomes</option>
              <option value="PAYMENT_COLLECTED">Payment Collected</option>
              <option value="PROMISE_MADE">Promise Made</option>
              <option value="CLIENT_UNAVAILABLE">Client Unavailable</option>
              <option value="REFUSED_TO_PAY">Refused to Pay</option>
            </Select>
          </div>
        </Card.Body>
      </Card>

      <Table>
        <thead>
          <tr>
            <th>Visit #</th>
            <th>Date</th>
            <th>Agent</th>
            <th>Client</th>
            <th>Outcome</th>
            <th>Amount Collected</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {visits?.map((visit: any) => (
            <tr key={visit.visitNumber}>
              <td>{visit.visitNumber}</td>
              <td>{format(visit.visitDate, 'PPP')}</td>
              <td>{visit.agentName}</td>
              <td>{visit.clientName}</td>
              <td>
                <Badge>{visit.outcome}</Badge>
              </td>
              <td className="font-semibold text-green-600">
                {visit.amountCollected > 0 ? `Rs.${visit.amountCollected.toLocaleString()}` : '-'}
              </td>
              <td className="text-sm">{visit.notes || '-'}</td>
            </tr>
          ))}
        </tbody>
      </Table>

      <div className="mt-4 p-4 bg-gray-50 rounded">
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <div className="text-gray-600">Total Visits</div>
            <div className="text-xl font-bold">{visits?.length || 0}</div>
          </div>
          <div>
            <div className="text-gray-600">Total Collected</div>
            <div className="text-xl font-bold text-green-600">
              Rs.{visits?.reduce((sum: number, v: any) => sum + v.amountCollected, 0).toLocaleString()}
            </div>
          </div>
          <div>
            <div className="text-gray-600">Success Rate</div>
            <div className="text-xl font-bold">
              {visits?.length > 0
                ? Math.round(
                    (visits.filter((v: any) => v.amountCollected > 0 || v.promiseMade).length /
                      visits.length) *
                      100
                  )
                : 0}
              %
            </div>
          </div>
        </div>
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
