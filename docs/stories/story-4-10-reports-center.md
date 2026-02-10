# Story 4.10: Reports Navigation Center

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.10
**Priority:** Low
**Estimated Effort:** 3-4 hours
**Dependencies:** At least some report stories (4.4-4.8) implemented
**Status:** Draft

---

## User Story

**As a** user,
**I want** a central reports page listing all available reports by category,
**So that** I can easily find and generate any report.

---

## Acceptance Criteria

1. **Reports Center Page:**
   - [ ] Route: `/reports` — lists all reports grouped by category
   - [ ] Categories: Inventory, Sales, Payments, Purchases, Financial
   - [ ] Each report: Name, Description, Icon, Link to report page
   - [ ] Reports filtered by user role (only show reports user can access)

2. **Design:**
   - [ ] Card/tile layout with responsive grid (1 col mobile, 2 col tablet, 3 col desktop)
   - [ ] Category headers grouping related reports
   - [ ] Hover effects on cards
   - [ ] Dashboard includes "View All Reports" link

3. **Authorization:**
   - [ ] Reports center page accessible by all authenticated roles
   - [ ] Individual report cards filtered by role — user only sees reports they can access
   - [ ] No API calls — this is a static page with client-side role filtering

---

## Dev Notes

### Implementation Status

**Backend:** No backend needed — this is a static frontend page. Report definitions are hardcoded.

**Frontend:** No reports center page exists. Sidebar has a "Reports" menu with "Cash Flow" link only.

### Existing Report Routes

Already registered or to be created by Stories 4.4-4.8:

```
/reports/cash-flow         — Cash Flow Report (already exists)
/reports/stock             — Stock Report (Story 4.4)
/reports/stock-valuation   — Stock Valuation (Story 4.4)
/reports/sales             — Sales Report (Story 4.5)
/reports/sales-by-client   — Sales by Client (Story 4.5)
/reports/sales-by-product  — Sales by Product (Story 4.5)
/reports/payments          — Payment Collection (Story 4.6)
/reports/receivables       — Outstanding Receivables (Story 4.6)
/reports/imports           — Import Cost Report (Story 4.7)
/reports/expenses          — Expense Report (Story 4.8)
/reports/expenses-trend    — Expense Trend (Story 4.8)
```

### Report Definitions (Correct)

```typescript
// apps/web/src/features/reports/data/reportDefinitions.ts

interface ReportCard {
  id: string;
  name: string;
  description: string;
  category: 'Inventory' | 'Sales' | 'Payments' | 'Purchases' | 'Financial';
  icon: string;  // lucide-react icon name
  route: string;
  roles: string[];
}

const REPORTS: ReportCard[] = [
  // Inventory Reports
  {
    id: 'stock-report',
    name: 'Stock Report',
    description: 'Current stock levels across all warehouses',
    category: 'Inventory',
    icon: 'Package',
    route: '/reports/stock',
    roles: ['ADMIN', 'ACCOUNTANT', 'WAREHOUSE_MANAGER', 'SALES_OFFICER'],
  },
  {
    id: 'stock-valuation',
    name: 'Stock Valuation',
    description: 'Inventory valuation grouped by category',
    category: 'Inventory',
    icon: 'DollarSign',
    route: '/reports/stock-valuation',
    roles: ['ADMIN', 'ACCOUNTANT'],
  },

  // Sales Reports
  {
    id: 'sales-report',
    name: 'Sales Report',
    description: 'Detailed sales by date, client, and product',
    category: 'Sales',
    icon: 'TrendingUp',
    route: '/reports/sales',
    roles: ['ADMIN', 'ACCOUNTANT', 'SALES_OFFICER'],
  },
  {
    id: 'sales-by-client',
    name: 'Sales by Client',
    description: 'Client-wise sales revenue summary',
    category: 'Sales',
    icon: 'Users',
    route: '/reports/sales-by-client',
    roles: ['ADMIN', 'ACCOUNTANT', 'SALES_OFFICER'],
  },
  {
    id: 'sales-by-product',
    name: 'Sales by Product',
    description: 'Product-wise quantity sold and revenue',
    category: 'Sales',
    icon: 'BarChart3',
    route: '/reports/sales-by-product',
    roles: ['ADMIN', 'ACCOUNTANT', 'SALES_OFFICER'],
  },

  // Payment Reports
  {
    id: 'payment-collection',
    name: 'Payment Collection',
    description: 'Client payments received with method breakdown',
    category: 'Payments',
    icon: 'CreditCard',
    route: '/reports/payments',
    roles: ['ADMIN', 'ACCOUNTANT', 'RECOVERY_AGENT'],
  },
  {
    id: 'receivables',
    name: 'Outstanding Receivables',
    description: 'Client outstanding balances with aging',
    category: 'Payments',
    icon: 'AlertCircle',
    route: '/reports/receivables',
    roles: ['ADMIN', 'ACCOUNTANT', 'RECOVERY_AGENT'],
  },
  {
    id: 'cash-flow',
    name: 'Cash Flow',
    description: 'Cash inflows and outflows over time',
    category: 'Payments',
    icon: 'ArrowUpDown',
    route: '/reports/cash-flow',
    roles: ['ADMIN', 'ACCOUNTANT'],
  },

  // Purchase Reports
  {
    id: 'import-report',
    name: 'Import Cost Report',
    description: 'PO landed cost analysis with cost breakdown',
    category: 'Purchases',
    icon: 'Ship',
    route: '/reports/imports',
    roles: ['ADMIN', 'ACCOUNTANT'],
  },

  // Financial Reports
  {
    id: 'expense-report',
    name: 'Expense Report',
    description: 'Detailed expenses by category and period',
    category: 'Financial',
    icon: 'Receipt',
    route: '/reports/expenses',
    roles: ['ADMIN', 'ACCOUNTANT'],
  },
  {
    id: 'expense-trend',
    name: 'Expense Trend',
    description: 'Monthly expense totals over last 12 months',
    category: 'Financial',
    icon: 'LineChart',
    route: '/reports/expenses-trend',
    roles: ['ADMIN', 'ACCOUNTANT'],
  },
];
```

### Reports Center Page (Correct)

```tsx
// apps/web/src/features/reports/pages/ReportsCenterPage.tsx

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../../stores/auth.store';
import { REPORTS } from '../data/reportDefinitions';
import * as Icons from 'lucide-react';

export default function ReportsCenterPage() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const userRole = user?.role?.name || '';

  // Filter reports by user role
  const accessibleReports = REPORTS.filter(r => r.roles.includes(userRole));

  // Group by category
  const grouped = accessibleReports.reduce((acc, report) => {
    if (!acc[report.category]) acc[report.category] = [];
    acc[report.category].push(report);
    return acc;
  }, {} as Record<string, typeof REPORTS>);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-gray-900">Reports Center</h1>

      {Object.entries(grouped).map(([category, reports]) => (
        <div key={category}>
          <h2 className="text-lg font-semibold text-gray-700 mb-3">{category} Reports</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map(report => {
              const IconComponent = (Icons as any)[report.icon];
              return (
                <div
                  key={report.id}
                  onClick={() => navigate(report.route)}
                  className="p-4 bg-white rounded-lg border border-gray-200 cursor-pointer hover:shadow-md hover:border-blue-300 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-50 rounded-lg">
                      {IconComponent && <IconComponent size={20} className="text-blue-600" />}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{report.name}</h3>
                      <p className="text-sm text-gray-500 mt-1">{report.description}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {accessibleReports.length === 0 && (
        <p className="text-gray-500 text-center py-8">No reports available for your role.</p>
      )}
    </div>
  );
}
```

### Key Corrections from Original Doc

1. **`useCurrentUser()` does NOT exist** — Use `useAuthStore()` and access `user?.role?.name`.
2. **`<Card>` / `<Card.Body>` not a real component** — Use plain `div` with Tailwind classes (consistent with rest of codebase).
3. **Route paths corrected** — All routes use `/reports/*` prefix matching actual router setup.

### Route Registration (Frontend)

In `apps/web/src/App.tsx`, add:
```tsx
<Route path="/reports" element={<ReportsCenterPage />} />
```

### Sidebar Update

Expand the Reports menu in `Sidebar.tsx` to include a "All Reports" link:
```tsx
<Link to="/reports">All Reports</Link>
<Link to="/reports/cash-flow">Cash Flow</Link>
```

### Module Structure

```
apps/web/src/features/reports/
  data/
    reportDefinitions.ts        (NEW — REPORTS array)
  pages/
    ReportsCenterPage.tsx       (NEW)
```

### POST-MVP DEFERRED

- **Search/filter within reports center**: Not needed at current scale (~11 reports). Add if report count grows significantly.
- **Favorited/recently viewed reports**: Nice-to-have, not needed for MVP.
- **Report scheduling**: Way out of scope.
