import { LayoutDashboard, BarChart3, AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import { GuideContent } from '../types';

export const dashboardContent: GuideContent = {
  title: 'Dashboard',
  icon: LayoutDashboard,
  introduction:
    'The Dashboard is your landing page after login. It provides a real-time overview of business health through KPI cards, credit limit alerts, and quick-action shortcuts. The content displayed adapts to your role.',
  tableOfContents: [
    { id: 'kpi-cards', label: 'KPI Cards', level: 1 },
    { id: 'kpi-total-revenue', label: 'Total Revenue', level: 2 },
    { id: 'kpi-outstanding-receivables', label: 'Outstanding Receivables', level: 2 },
    { id: 'kpi-total-inventory-value', label: 'Total Inventory Value', level: 2 },
    { id: 'kpi-monthly-sales', label: 'Monthly Sales', level: 2 },
    { id: 'credit-limit-alerts', label: 'Credit Limit Alerts', level: 1 },
    { id: 'quick-actions', label: 'Quick Actions', level: 1 },
    { id: 'dashboard-data', label: 'Dashboard Data & Roles', level: 1 },
  ],
  sections: [
    {
      id: 'kpi-cards',
      title: 'KPI Cards',
      icon: BarChart3,
      roles: ['Admin', 'Sales Officer', 'Accountant', 'Recovery Agent'],
      content: [
        {
          type: 'paragraph',
          text: 'The top of the dashboard displays key performance indicator (KPI) cards. Each card shows the current value along with a comparison to the previous period so you can quickly spot trends.',
        },
        {
          type: 'keyValue',
          pairs: [
            { key: 'Total Revenue', value: 'Sum of all paid invoices for the current fiscal period.' },
            { key: 'Outstanding Receivables', value: 'Total unpaid amount across all customer invoices.' },
            { key: 'Total Inventory Value', value: 'Aggregate value of stock across all warehouses.' },
            { key: 'Monthly Sales', value: 'Invoice total for the current calendar month.' },
          ],
        },
      ],
      subSections: [
        {
          id: 'kpi-total-revenue',
          title: 'Total Revenue',
          content: [
            {
              type: 'paragraph',
              text: 'Displays the sum of all paid invoice amounts for the current fiscal period. The percentage change compares against the same period last year.',
            },
          ],
        },
        {
          id: 'kpi-outstanding-receivables',
          title: 'Outstanding Receivables',
          content: [
            {
              type: 'paragraph',
              text: 'Shows the total unpaid balance across all customer invoices with status PENDING, PARTIAL, or OVERDUE. A rising number may indicate collection issues.',
            },
          ],
        },
        {
          id: 'kpi-total-inventory-value',
          title: 'Total Inventory Value',
          content: [
            {
              type: 'paragraph',
              text: 'Aggregate cost value of all inventory items across every warehouse. Useful for quick stock health checks without running a full stock report.',
            },
          ],
        },
        {
          id: 'kpi-monthly-sales',
          title: 'Monthly Sales',
          content: [
            {
              type: 'paragraph',
              text: 'Total invoice value generated in the current calendar month. Compares against the previous month to show growth or decline.',
            },
          ],
        },
      ],
    },
    {
      id: 'credit-limit-alerts',
      title: 'Credit Limit Alerts',
      icon: AlertTriangle,
      roles: ['Admin', 'Sales Officer', 'Recovery Agent'],
      content: [
        {
          type: 'paragraph',
          text: 'This section lists customers who are approaching or have exceeded their assigned credit limits. Alerts help the sales and recovery teams take timely action before further credit is extended.',
        },
        {
          type: 'steps',
          steps: [
            {
              title: 'Red Alert — Limit Exceeded',
              description:
                'The customer\'s outstanding balance has surpassed their credit limit. New invoices should not be created until the balance is recovered.',
            },
            {
              title: 'Yellow Alert — Approaching Limit (>80%)',
              description:
                'The customer has used more than 80% of their credit limit. Follow up on pending payments to prevent the limit from being exceeded.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'warning',
          title: 'Action Required',
          text: 'Customers shown in red have exceeded their credit limit. Coordinate with the Recovery Agent to collect outstanding dues before approving new orders.',
        },
      ],
    },
    {
      id: 'quick-actions',
      title: 'Quick Actions',
      icon: Zap,
      roles: ['Admin', 'Sales Officer', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'Quick action buttons provide one-click navigation to the most frequently used operations, saving time on daily tasks.',
        },
        {
          type: 'keyValue',
          pairs: [
            { key: 'Create Invoice', value: 'Opens the new invoice form to bill a customer.' },
            { key: 'Record Payment', value: 'Opens the payment entry form to record a customer or supplier payment.' },
            { key: 'New Purchase Order', value: 'Opens the purchase order form to place an order with a supplier.' },
            { key: 'Stock Adjustment', value: 'Opens the stock adjustment form to correct inventory quantities.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Keyboard Shortcut',
          text: 'You can also use the sidebar navigation to reach these forms. Quick actions are simply shortcuts displayed on the dashboard for convenience.',
        },
      ],
    },
    {
      id: 'dashboard-data',
      title: 'Dashboard Data & Roles',
      icon: RefreshCw,
      content: [
        {
          type: 'paragraph',
          text: 'Dashboard data is fetched fresh each time the page loads. The KPI cards and sections you see depend on your assigned role.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Data Refresh',
          text: 'Dashboard data is loaded automatically when you navigate to the page. To see the latest numbers, simply refresh the page or navigate away and back.',
        },
        {
          type: 'roles',
          roles: ['Admin', 'Sales Officer', 'Accountant', 'Recovery Agent', 'Warehouse Manager'],
        },
        {
          type: 'fieldTable',
          fields: [
            { name: 'Admin', fieldType: 'Role', required: false, description: 'Sees all KPI cards, credit alerts, and quick actions.' },
            { name: 'Sales Officer', fieldType: 'Role', required: false, description: 'Sees revenue, monthly sales, credit alerts, and invoice/PO quick actions.' },
            { name: 'Accountant', fieldType: 'Role', required: false, description: 'Sees revenue, receivables, and payment quick actions.' },
            { name: 'Recovery Agent', fieldType: 'Role', required: false, description: 'Sees outstanding receivables and credit limit alerts.' },
            { name: 'Warehouse Manager', fieldType: 'Role', required: false, description: 'Sees inventory value and stock adjustment quick action.' },
          ],
        },
      ],
    },
  ],
};
