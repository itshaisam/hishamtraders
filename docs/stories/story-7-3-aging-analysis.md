# Story 7.3: Aging Analysis Report

**Epic:** Epic 7 - Recovery & Collection Management
**Story ID:** STORY-7.3
**Priority:** High
**Estimated Effort:** 6-8 hours
**Dependencies:** Epic 3 (Clients)
**Status:** Draft — Phase 2 (v2.0 — Revised)

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
   - [ ] `GET /api/v1/reports/aging-analysis` — generates aging report
   - [ ] Filters: clientId, recoveryAgentId, area, city, asOfDate (default: today)
   - [ ] Shows: Client name, total balance, amount per bucket, oldest invoice date, recovery agent

3. **Calculation Logic:**
   - [ ] For each client, analyze PENDING/PARTIAL invoices
   - [ ] Group by days overdue (invoice.dueDate vs asOfDate)
   - [ ] Amount per invoice = `invoice.total - invoice.paidAmount`
   - [ ] Sum amounts per bucket

4. **Summary Statistics:**
   - [ ] Total receivables
   - [ ] Total current vs total overdue
   - [ ] Percentage per bucket
   - [ ] Average days outstanding

5. **Export:**
   - [ ] Excel export via server-side `exceljs` (GET /api/v1/reports/aging-analysis/export)

6. **Frontend:**
   - [ ] Aging Analysis page with filter controls
   - [ ] Summary cards at top (one per bucket)
   - [ ] Data table with color-coded columns
   - [ ] Bar chart visualization
   - [ ] Export to Excel button (triggers server-side export)

7. **Color Coding:**
   - [ ] Current: Green
   - [ ] 1-7 days: Light Yellow
   - [ ] 8-14 days: Yellow
   - [ ] 15-30 days: Orange
   - [ ] 30+ days: Red

8. **Authorization:**
   - [ ] Accountant, Admin, Recovery Agent (filtered by their clients)

---

## Dev Notes

### Implementation Status

**Backend:** Not started. Depends on Client and Invoice models (Epic 3).

### Key Corrections

1. **API paths**: All use `/api/v1/` prefix (not `/api/`).
2. **InvoiceStatus `'UNPAID'`** does NOT exist. Use `'PENDING'` instead.
3. **`Card.Body`** does NOT exist. Use `<Card>` with children directly.
4. **`DatePicker`** does NOT exist. Use `<input type="date" className="border rounded px-3 py-2">`.
5. **`XLSX` (xlsx/sheetjs) on frontend** replaced with server-side `exceljs` export (consistent with Story 4.9 pattern).
6. **`Spinner`** component not verified — use plain loading indicator.
7. **`recharts`** is an external dependency — needs to be added to package.json.
8. **`invoice.paidAmount`** exists on Invoice model (confirmed).
9. **Frontend** trimmed — backend logic is the critical part.

### Backend: Aging Analysis Query

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

// GET /api/v1/reports/aging-analysis
async function getAgingAnalysis(
  filters: { clientId?: string; recoveryAgentId?: string; area?: string; city?: string },
  asOfDate: Date = new Date()
): Promise<{
  clients: ClientAgingData[];
  summary: AgingBuckets & { total: number; averageDaysOutstanding: number };
}> {
  const where: any = {
    balance: { gt: 0 },
    status: 'ACTIVE'
  };

  if (filters.clientId) where.id = filters.clientId;
  if (filters.recoveryAgentId) where.recoveryAgentId = filters.recoveryAgentId;
  if (filters.area) where.area = filters.area;
  if (filters.city) where.city = filters.city;

  const clients = await prisma.client.findMany({
    where,
    include: {
      recoveryAgent: true,
      invoices: {
        where: {
          status: { in: ['PENDING', 'PARTIAL'] }
        }
      }
    }
  });

  const clientAgingData: ClientAgingData[] = [];
  const summaryBuckets: AgingBuckets = {
    current: 0, days1to7: 0, days8to14: 0, days15to30: 0, days30plus: 0
  };
  let totalDaysSum = 0;
  let totalInvoices = 0;

  for (const client of clients) {
    const aging: AgingBuckets = {
      current: 0, days1to7: 0, days8to14: 0, days15to30: 0, days30plus: 0
    };
    let oldestDate: Date | null = null;

    for (const invoice of client.invoices) {
      if (!invoice.dueDate) continue;

      const daysOverdue = differenceInDays(asOfDate, invoice.dueDate);
      const amount = parseFloat(invoice.total.toString())
                   - parseFloat(invoice.paidAmount.toString());

      if (!oldestDate || invoice.dueDate < oldestDate) {
        oldestDate = invoice.dueDate;
      }

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

  clientAgingData.sort((a, b) => {
    const aOverdue = a.aging.days1to7 + a.aging.days8to14 + a.aging.days15to30 + a.aging.days30plus;
    const bOverdue = b.aging.days1to7 + b.aging.days8to14 + b.aging.days15to30 + b.aging.days30plus;
    return bOverdue - aOverdue;
  });

  const total = summaryBuckets.current + summaryBuckets.days1to7 + summaryBuckets.days8to14
              + summaryBuckets.days15to30 + summaryBuckets.days30plus;
  const averageDaysOutstanding = totalInvoices > 0 ? totalDaysSum / totalInvoices : 0;

  return {
    clients: clientAgingData,
    summary: { ...summaryBuckets, total, averageDaysOutstanding: Math.round(averageDaysOutstanding) }
  };
}
```

### Backend: Excel Export

```typescript
// GET /api/v1/reports/aging-analysis/export
// Uses server-side exceljs (consistent with Story 4.9)
import ExcelJS from 'exceljs';

async function exportAgingAnalysis(filters: any, asOfDate: Date): Promise<Buffer> {
  const data = await getAgingAnalysis(filters, asOfDate);
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Aging Analysis');

  sheet.columns = [
    { header: 'Client Name', key: 'clientName', width: 25 },
    { header: 'Contact', key: 'contactPerson', width: 20 },
    { header: 'Phone', key: 'phone', width: 15 },
    { header: 'Area', key: 'area', width: 15 },
    { header: 'Recovery Agent', key: 'recoveryAgent', width: 20 },
    { header: 'Total Balance', key: 'totalBalance', width: 15 },
    { header: 'Current', key: 'current', width: 12 },
    { header: '1-7 Days', key: 'days1to7', width: 12 },
    { header: '8-14 Days', key: 'days8to14', width: 12 },
    { header: '15-30 Days', key: 'days15to30', width: 12 },
    { header: '30+ Days', key: 'days30plus', width: 12 },
    { header: 'Days Outstanding', key: 'daysOutstanding', width: 15 },
  ];

  for (const client of data.clients) {
    sheet.addRow({
      clientName: client.clientName,
      contactPerson: client.contactPerson,
      phone: client.phone,
      area: client.area,
      recoveryAgent: client.recoveryAgent,
      totalBalance: client.totalBalance,
      current: client.aging.current,
      days1to7: client.aging.days1to7,
      days8to14: client.aging.days8to14,
      days15to30: client.aging.days15to30,
      days30plus: client.aging.days30plus,
      daysOutstanding: client.daysOutstanding,
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
```

### Module Structure

```
apps/api/src/modules/recovery/
  recovery.controller.ts     (EXPAND — add aging analysis endpoint)
  recovery.service.ts        (EXPAND — add getAgingAnalysis, exportAgingAnalysis)
  recovery.routes.ts         (EXPAND — add GET /reports/aging-analysis)

apps/web/src/features/recovery/pages/
  AgingAnalysisPage.tsx       (NEW)
```

### Frontend Notes

- Summary cards: one per bucket (Current, 1-7, 8-14, 15-30, 30+), each showing amount and percentage.
- Data table with color-coded bucket columns (green -> red gradient).
- Filter bar: Recovery Agent (select), Area (input), City (input), As of Date (`<input type="date">`).
- Bar chart: requires `recharts` dependency (add to package.json).
- Export button triggers `GET /api/v1/reports/aging-analysis/export` and downloads the Excel file.
- Use `<Card>` with children directly (no `Card.Body`).

### Dependencies to Add

- `recharts` — for bar chart visualization (frontend)
- `exceljs` — for server-side Excel export (backend, may already be installed from Story 4.9)

### POST-MVP DEFERRED

- **PDF export**: Formatted PDF report generation.
- **Scheduled email delivery**: Auto-send aging report weekly.

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
| 2026-02-10 | 2.0     | Revised: Fixed API paths (/api/v1/), InvoiceStatus UNPAID->PENDING, Card.Body->Card, DatePicker->input[type=date], XLSX frontend->server-side exceljs, noted recharts as external dep, trimmed frontend to notes | Claude (AI Review) |
