export interface ReportDefinition {
  id: string;
  title: string;
  description: string;
  category: 'inventory' | 'sales' | 'payments' | 'imports' | 'expenses';
  path: string;
  roles: string[]; // empty = all roles
}

export const REPORTS: ReportDefinition[] = [
  // Inventory
  {
    id: 'stock-report',
    title: 'Stock Report',
    description: 'Current stock levels by warehouse, category, and status',
    category: 'inventory',
    path: '/reports/stock',
    roles: ['ADMIN', 'WAREHOUSE_MANAGER'],
  },
  {
    id: 'stock-valuation',
    title: 'Stock Valuation',
    description: 'Inventory value breakdown by category',
    category: 'inventory',
    path: '/reports/stock?tab=valuation',
    roles: ['ADMIN', 'WAREHOUSE_MANAGER', 'ACCOUNTANT'],
  },

  // Sales
  {
    id: 'sales-report',
    title: 'Sales Report',
    description: 'Invoice details with date range, client, and status filters',
    category: 'sales',
    path: '/reports/sales',
    roles: ['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT'],
  },
  {
    id: 'sales-by-client',
    title: 'Sales by Client',
    description: 'Revenue and invoice counts grouped by client',
    category: 'sales',
    path: '/reports/sales?tab=by-client',
    roles: ['ADMIN', 'SALES_OFFICER', 'ACCOUNTANT'],
  },
  {
    id: 'sales-by-product',
    title: 'Sales by Product',
    description: 'Quantities sold and revenue grouped by product',
    category: 'sales',
    path: '/reports/sales?tab=by-product',
    roles: ['ADMIN', 'SALES_OFFICER'],
  },

  // Payments
  {
    id: 'payment-collections',
    title: 'Payment Collections',
    description: 'Client payments with method and date filters',
    category: 'payments',
    path: '/reports/payments',
    roles: ['ADMIN', 'ACCOUNTANT', 'RECOVERY_AGENT'],
  },
  {
    id: 'receivables',
    title: 'Receivables Report',
    description: 'Outstanding client balances with aging indicators',
    category: 'payments',
    path: '/reports/payments?tab=receivables',
    roles: ['ADMIN', 'ACCOUNTANT', 'RECOVERY_AGENT'],
  },
  {
    id: 'cash-flow',
    title: 'Cash Flow Report',
    description: 'Cash inflows vs outflows by payment method',
    category: 'payments',
    path: '/reports/cash-flow',
    roles: ['ADMIN', 'ACCOUNTANT'],
  },

  // Imports
  {
    id: 'import-costs',
    title: 'Import Cost Report',
    description: 'Purchase orders with landed cost breakdown (shipping, customs, tax)',
    category: 'imports',
    path: '/reports/imports',
    roles: ['ADMIN', 'WAREHOUSE_MANAGER'],
  },

  // Expenses
  {
    id: 'expense-report',
    title: 'Expense Report',
    description: 'Detailed expenses with category and date filters',
    category: 'expenses',
    path: '/reports/expenses',
    roles: ['ADMIN', 'ACCOUNTANT'],
  },
  {
    id: 'expense-by-category',
    title: 'Expenses by Category',
    description: 'Expense totals grouped by category',
    category: 'expenses',
    path: '/reports/expenses?tab=by-category',
    roles: ['ADMIN', 'ACCOUNTANT'],
  },
  {
    id: 'expense-trend',
    title: 'Expense Trend',
    description: 'Monthly expense totals over the last 12 months',
    category: 'expenses',
    path: '/reports/expenses?tab=trend',
    roles: ['ADMIN', 'ACCOUNTANT'],
  },
];

export const REPORT_CATEGORIES: Record<string, string> = {
  inventory: 'Inventory & Stock',
  sales: 'Sales',
  payments: 'Payments & Receivables',
  imports: 'Imports & Purchasing',
  expenses: 'Expenses',
};
