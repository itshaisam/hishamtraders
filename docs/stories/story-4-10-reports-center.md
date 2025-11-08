# Story 4.10: Reports Navigation Center

**Epic:** Epic 4 - Dashboards & Reports
**Story ID:** STORY-4.10
**Priority:** Low
**Estimated Effort:** 4-6 hours
**Dependencies:** All report stories (4.4-4.9)
**Status:** Draft

---

## User Story

**As a** user,
**I want** a central reports page listing all available reports by category,
**So that** I can easily find and generate any report.

---

## Acceptance Criteria

1. **Reports Center Page:**
   - [ ] Lists all reports categorized:
     - Inventory Reports: Stock Report, Stock Valuation, Stock Movements
     - Sales Reports: Sales by Date, Sales by Client, Sales by Product
     - Payment Reports: Payment Collection, Outstanding Receivables
     - Purchase Reports: Import/Container Report, Supplier Performance
     - Financial Reports: Expense Report, Expense by Category, Expense Trend
   - [ ] Each report: Name, Description, Icon, Link
   - [ ] Reports filtered by user role (show only accessible reports)

2. **Design:**
   - [ ] Card/tile layout for report categories
   - [ ] Responsive (mobile, tablet, desktop)
   - [ ] Dashboard includes "View All Reports" link

3. **Navigation & Authorization:**
   - [ ] Clicking report card navigates to specific report page with filters
   - [ ] Reports filtered by user role: only show accessible reports (no 403 errors on center page)
   - [ ] Navigation validated: prevent direct access to unauthorized report pages (403 Forbidden)

4. **Performance & Caching:**
   - [ ] No database queries (static report definitions)
   - [ ] Page load time: <500ms
   - [ ] Report metadata cached client-side indefinitely
   - [ ] No API calls required for reports center itself

5. **Frontend Design:**
   - [ ] Category sections organized logically
   - [ ] Each report card shows: icon, name, description
   - [ ] Hover effects and visual feedback on card selection
   - [ ] Responsive grid layout: 1 column (mobile), 2 columns (tablet), 3 columns (desktop)
   - [ ] "View All Reports" link on related dashboards

6. **Error Handling:**
   - [ ] Gracefully handle missing navigation targets
   - [ ] Log unauthorized navigation attempts
   - [ ] Display user-friendly message if navigating to inaccessible report

---

## Dev Notes

```typescript
interface ReportCard {
  id: string;
  name: string;
  description: string;
  category: string;
  icon: string;
  route: string;
  roles: string[]; // Roles that can access this report
}

const REPORTS: ReportCard[] = [
  // Inventory Reports
  {
    id: 'stock-report',
    name: 'Stock Report',
    description: 'Current stock levels across warehouses',
    category: 'Inventory',
    icon: 'Package',
    route: '/reports/stock',
    roles: ['ADMIN', 'ACCOUNTANT', 'WAREHOUSE_MANAGER', 'SALES_OFFICER']
  },
  {
    id: 'stock-valuation',
    name: 'Stock Valuation',
    description: 'Inventory valuation by category',
    category: 'Inventory',
    icon: 'DollarSign',
    route: '/reports/stock-valuation',
    roles: ['ADMIN', 'ACCOUNTANT']
  },
  // Sales Reports
  {
    id: 'sales-report',
    name: 'Sales Report',
    description: 'Detailed sales by date, client, product',
    category: 'Sales',
    icon: 'TrendingUp',
    route: '/reports/sales',
    roles: ['ADMIN', 'ACCOUNTANT', 'SALES_OFFICER']
  },
  {
    id: 'sales-by-client',
    name: 'Sales by Client',
    description: 'Client-wise sales summary',
    category: 'Sales',
    icon: 'Users',
    route: '/reports/sales-by-client',
    roles: ['ADMIN', 'ACCOUNTANT', 'SALES_OFFICER']
  },
  // Payment Reports
  {
    id: 'payment-collection',
    name: 'Payment Collection',
    description: 'Client payments received',
    category: 'Payments',
    icon: 'CreditCard',
    route: '/reports/payments',
    roles: ['ADMIN', 'ACCOUNTANT', 'RECOVERY_AGENT']
  },
  {
    id: 'receivables',
    name: 'Outstanding Receivables',
    description: 'Client outstanding balances',
    category: 'Payments',
    icon: 'AlertCircle',
    route: '/reports/receivables',
    roles: ['ADMIN', 'ACCOUNTANT', 'RECOVERY_AGENT']
  },
  // Purchase Reports
  {
    id: 'import-report',
    name: 'Import Cost Report',
    description: 'Landed cost analysis',
    category: 'Purchases',
    icon: 'Ship',
    route: '/reports/imports',
    roles: ['ADMIN', 'ACCOUNTANT']
  },
  // Financial Reports
  {
    id: 'expense-report',
    name: 'Expense Report',
    description: 'Detailed expense tracking',
    category: 'Financial',
    icon: 'Receipt',
    route: '/reports/expenses',
    roles: ['ADMIN', 'ACCOUNTANT']
  }
];
```

**Frontend - Reports Center Page:**

```tsx
export const ReportsCenterPage: FC = () => {
  const currentUser = useCurrentUser();

  // Filter reports by user role
  const accessibleReports = REPORTS.filter(report =>
    report.roles.includes(currentUser.role)
  );

  // Group by category
  const groupedReports = accessibleReports.reduce((acc, report) => {
    if (!acc[report.category]) {
      acc[report.category] = [];
    }
    acc[report.category].push(report);
    return acc;
  }, {} as Record<string, ReportCard[]>);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Reports Center</h1>

      {Object.entries(groupedReports).map(([category, reports]) => (
        <div key={category}>
          <h2 className="text-xl font-semibold mb-4">{category} Reports</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {reports.map(report => (
              <Card
                key={report.id}
                className="cursor-pointer hover:shadow-lg transition"
                onClick={() => navigate(report.route)}
              >
                <Card.Body>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-blue-100 rounded">
                      <Icon name={report.icon} className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{report.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        {report.description}
                      </p>
                    </div>
                  </div>
                </Card.Body>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
```

---

## Change Log

| Date       | Version | Description            | Author |
|------------|---------|------------------------|--------|
| 2025-01-15 | 1.0     | Initial story creation | Sarah (Product Owner) |
