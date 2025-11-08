# Story 7.3: Aging Analysis Report

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.3
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 3 (Clients)
**Status:** Draft - Phase 2

---

## User Story

**As an** accountant,
**I want** to see receivables aging analysis by time buckets,
**So that** I can identify high-risk accounts and prioritize collections.

---

## Acceptance Criteria

1. **Aging Buckets:**
   - [ ] Current (0 days overdue)
   - [ ] 1-7 days overdue
   - [ ] 8-14 days overdue
   - [ ] 15-30 days overdue
   - [ ] 30+ days overdue

2. **Backend API:**
   - [ ] GET /api/reports/aging-analysis - generates aging report
   - [ ] Filters: clientId, recoveryAgentId, area, city, asOfDate (default: today)
   - [ ] Shows: Client name, total balance, amount per bucket, oldest invoice date, recovery agent

3. **Calculation Logic:**
   - [ ] For each client, analyze unpaid/partial invoices
   - [ ] Group by days overdue (invoice.dueDate vs asOfDate)
   - [ ] Sum amounts per bucket

4. **Summary Statistics:**
   - [ ] Total receivables
   - [ ] Total current vs total overdue
   - [ ] Percentage per bucket
   - [ ] Average days outstanding

5. **Frontend:**
   - [ ] Aging Analysis page
   - [ ] Filter controls
   - [ ] Data table with color-coded columns
   - [ ] Summary cards at top
   - [ ] Bar chart visualization
   - [ ] Export to Excel

6. **Color Coding:**
   - [ ] Current: Green
   - [ ] 1-7 days: Light Yellow
   - [ ] 8-14 days: Yellow
   - [ ] 15-30 days: Orange
   - [ ] 30+ days: Red

7. **Authorization:**
   - [ ] Accountant, Admin, Recovery Agent (filtered by their clients)

---

## Dev Notes

```typescript
interface AgingBuckets {
  current: number;
  days1to7: number;
  days8to14: number;
  days15to30: number;
  days30plus: number;
}

interface ClientAgingData {
  clientId: string;
  clientName: string;
  contactPerson: string;
  phone: string;
  area: string;
  city: string;
  recoveryAgent: string;
  totalBalance: number;
  aging: AgingBuckets;
  oldestInvoiceDate: Date;
  daysOutstanding: number;
}

async function getAgingAnalysis(
  filters: AgingAnalysisFilters,
  asOfDate: Date = new Date()
): Promise<{
  clients: ClientAgingData[];
  summary: AgingBuckets & { total: number; averageDaysOutstanding: number };
}> {
  const where: any = {
    balance: { gt: 0 },
    status: 'ACTIVE'
  };

  if (filters.clientId) {
    where.id = filters.clientId;
  }

  if (filters.recoveryAgentId) {
    where.recoveryAgentId = filters.recoveryAgentId;
  }

  if (filters.area) {
    where.area = filters.area;
  }

  if (filters.city) {
    where.city = filters.city;
  }

  const clients = await prisma.client.findMany({
    where,
    include: {
      recoveryAgent: true,
      invoices: {
        where: {
          status: { in: ['UNPAID', 'PARTIAL'] }
        }
      }
    }
  });

  const clientAgingData: ClientAgingData[] = [];
  const summaryBuckets: AgingBuckets = {
    current: 0,
    days1to7: 0,
    days8to14: 0,
    days15to30: 0,
    days30plus: 0
  };
  let totalDaysSum = 0;
  let totalInvoices = 0;

  for (const client of clients) {
    const aging: AgingBuckets = {
      current: 0,
      days1to7: 0,
      days8to14: 0,
      days15to30: 0,
      days30plus: 0
    };

    let oldestDate: Date | null = null;

    for (const invoice of client.invoices) {
      if (!invoice.dueDate) continue;

      const daysOverdue = differenceInDays(asOfDate, invoice.dueDate);
      const amount = parseFloat(invoice.total.toString()) - parseFloat(invoice.paidAmount.toString());

      // Track oldest invoice
      if (!oldestDate || invoice.dueDate < oldestDate) {
        oldestDate = invoice.dueDate;
      }

      // Categorize into buckets
      if (daysOverdue <= 0) {
        aging.current += amount;
        summaryBuckets.current += amount;
      } else if (daysOverdue <= 7) {
        aging.days1to7 += amount;
        summaryBuckets.days1to7 += amount;
      } else if (daysOverdue <= 14) {
        aging.days8to14 += amount;
        summaryBuckets.days8to14 += amount;
      } else if (daysOverdue <= 30) {
        aging.days15to30 += amount;
        summaryBuckets.days15to30 += amount;
      } else {
        aging.days30plus += amount;
        summaryBuckets.days30plus += amount;
      }

      totalDaysSum += daysOverdue > 0 ? daysOverdue : 0;
      totalInvoices++;
    }

    const totalBalance = parseFloat(client.balance.toString());
    const daysOutstanding = oldestDate ? differenceInDays(asOfDate, oldestDate) : 0;

    clientAgingData.push({
      clientId: client.id,
      clientName: client.name,
      contactPerson: client.contactPerson || '',
      phone: client.phone || '',
      area: client.area || '',
      city: client.city || '',
      recoveryAgent: client.recoveryAgent?.name || 'Unassigned',
      totalBalance,
      aging,
      oldestInvoiceDate: oldestDate!,
      daysOutstanding
    });
  }

  // Sort by total overdue amount (descending)
  clientAgingData.sort((a, b) => {
    const aOverdue = a.aging.days1to7 + a.aging.days8to14 + a.aging.days15to30 + a.aging.days30plus;
    const bOverdue = b.aging.days1to7 + b.aging.days8to14 + b.aging.days15to30 + b.aging.days30plus;
    return bOverdue - aOverdue;
  });

  const total = summaryBuckets.current + summaryBuckets.days1to7 + summaryBuckets.days8to14 +
                summaryBuckets.days15to30 + summaryBuckets.days30plus;
  const averageDaysOutstanding = totalInvoices > 0 ? totalDaysSum / totalInvoices : 0;

  return {
    clients: clientAgingData,
    summary: {
      ...summaryBuckets,
      total,
      averageDaysOutstanding: Math.round(averageDaysOutstanding)
    }
  };
}
```

**Frontend:**
```tsx
import { FC, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Download, Filter } from 'lucide-react';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import * as XLSX from 'xlsx';

export const AgingAnalysisPage: FC = () => {
  const [filters, setFilters] = useState({
    recoveryAgentId: '',
    area: '',
    city: '',
    asOfDate: new Date()
  });

  const { data: agingData, isLoading } = useQuery({
    queryKey: ['aging-analysis', filters],
    queryFn: () => fetch(
      `/api/reports/aging-analysis?${new URLSearchParams({
        recoveryAgentId: filters.recoveryAgentId,
        area: filters.area,
        city: filters.city,
        asOfDate: filters.asOfDate.toISOString()
      })}`
    ).then(res => res.json())
  });

  const handleExport = () => {
    if (!agingData?.clients) return;

    const worksheet = XLSX.utils.json_to_sheet(
      agingData.clients.map((client: any) => ({
        'Client Name': client.clientName,
        'Contact Person': client.contactPerson,
        'Phone': client.phone,
        'Area': client.area,
        'City': client.city,
        'Recovery Agent': client.recoveryAgent,
        'Total Balance': client.totalBalance,
        'Current': client.aging.current,
        '1-7 Days': client.aging.days1to7,
        '8-14 Days': client.aging.days8to14,
        '15-30 Days': client.aging.days15to30,
        '30+ Days': client.aging.days30plus,
        'Days Outstanding': client.daysOutstanding
      }))
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Aging Analysis');
    XLSX.writeFile(workbook, `aging-analysis-${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
  };

  const getPercentage = (amount: number, total: number) => {
    return total > 0 ? ((amount / total) * 100).toFixed(1) : '0.0';
  };

  if (isLoading) {
    return <Spinner />;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Aging Analysis Report</h1>
        <Button onClick={handleExport}>
          <Download className="h-4 w-4 mr-2" />
          Export to Excel
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-5 gap-4 mb-6">
        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600">Current</div>
            <div className="text-2xl font-bold text-green-600">
              Rs.{agingData?.summary.current.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {getPercentage(agingData?.summary.current, agingData?.summary.total)}%
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600">1-7 Days</div>
            <div className="text-2xl font-bold text-yellow-300">
              Rs.{agingData?.summary.days1to7.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {getPercentage(agingData?.summary.days1to7, agingData?.summary.total)}%
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600">8-14 Days</div>
            <div className="text-2xl font-bold text-yellow-500">
              Rs.{agingData?.summary.days8to14.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {getPercentage(agingData?.summary.days8to14, agingData?.summary.total)}%
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600">15-30 Days</div>
            <div className="text-2xl font-bold text-orange-500">
              Rs.{agingData?.summary.days15to30.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {getPercentage(agingData?.summary.days15to30, agingData?.summary.total)}%
            </div>
          </Card.Body>
        </Card>

        <Card>
          <Card.Body>
            <div className="text-sm text-gray-600">30+ Days</div>
            <div className="text-2xl font-bold text-red-600">
              Rs.{agingData?.summary.days30plus.toLocaleString()}
            </div>
            <div className="text-xs text-gray-500">
              {getPercentage(agingData?.summary.days30plus, agingData?.summary.total)}%
            </div>
          </Card.Body>
        </Card>
      </div>

      <Card className="mb-6">
        <Card.Body>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <div className="text-sm text-gray-600">Total Receivables</div>
              <div className="text-xl font-bold">Rs.{agingData?.summary.total.toLocaleString()}</div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Total Overdue</div>
              <div className="text-xl font-bold text-red-600">
                Rs.{(
                  agingData?.summary.days1to7 +
                  agingData?.summary.days8to14 +
                  agingData?.summary.days15to30 +
                  agingData?.summary.days30plus
                ).toLocaleString()}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600">Avg Days Outstanding</div>
              <div className="text-xl font-bold">{agingData?.summary.averageDaysOutstanding} days</div>
            </div>
          </div>
        </Card.Body>
      </Card>

      {/* Filters */}
      <Card className="mb-6">
        <Card.Body>
          <div className="grid grid-cols-4 gap-4">
            <Select
              label="Recovery Agent"
              value={filters.recoveryAgentId}
              onChange={(e) => setFilters(prev => ({ ...prev, recoveryAgentId: e.target.value }))}
            >
              <option value="">All Agents</option>
              {/* Recovery agent options */}
            </Select>

            <Input
              label="Area"
              value={filters.area}
              onChange={(e) => setFilters(prev => ({ ...prev, area: e.target.value }))}
            />

            <Input
              label="City"
              value={filters.city}
              onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            />

            <DatePicker
              label="As of Date"
              value={filters.asOfDate}
              onChange={(date) => setFilters(prev => ({ ...prev, asOfDate: date }))}
            />
          </div>
        </Card.Body>
      </Card>

      {/* Data Table */}
      <Table>
        <thead>
          <tr>
            <th>Client</th>
            <th>Recovery Agent</th>
            <th>Total Balance</th>
            <th className="bg-green-50">Current</th>
            <th className="bg-yellow-50">1-7 Days</th>
            <th className="bg-yellow-100">8-14 Days</th>
            <th className="bg-orange-50">15-30 Days</th>
            <th className="bg-red-50">30+ Days</th>
            <th>Days Out</th>
          </tr>
        </thead>
        <tbody>
          {agingData?.clients.map((client: any) => (
            <tr key={client.clientId}>
              <td>
                <div className="font-semibold">{client.clientName}</div>
                <div className="text-xs text-gray-500">{client.area}, {client.city}</div>
              </td>
              <td>{client.recoveryAgent}</td>
              <td className="font-semibold">Rs.{client.totalBalance.toLocaleString()}</td>
              <td className="bg-green-50 text-green-700">
                {client.aging.current > 0 ? `Rs.${client.aging.current.toLocaleString()}` : '-'}
              </td>
              <td className="bg-yellow-50 text-yellow-700">
                {client.aging.days1to7 > 0 ? `Rs.${client.aging.days1to7.toLocaleString()}` : '-'}
              </td>
              <td className="bg-yellow-100 text-yellow-800">
                {client.aging.days8to14 > 0 ? `Rs.${client.aging.days8to14.toLocaleString()}` : '-'}
              </td>
              <td className="bg-orange-50 text-orange-700">
                {client.aging.days15to30 > 0 ? `Rs.${client.aging.days15to30.toLocaleString()}` : '-'}
              </td>
              <td className="bg-red-50 text-red-700 font-semibold">
                {client.aging.days30plus > 0 ? `Rs.${client.aging.days30plus.toLocaleString()}` : '-'}
              </td>
              <td>{client.daysOutstanding}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
