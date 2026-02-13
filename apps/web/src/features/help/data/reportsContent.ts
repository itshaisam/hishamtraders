import {
  BarChart3,
  FileText,
  Package,
  ShoppingCart,
  CreditCard,
  Ship,
  Receipt,
  ClipboardCheck,
} from 'lucide-react';
import { GuideContent } from '../types';

export const reportsContent: GuideContent = {
  title: 'Reports',
  icon: BarChart3,
  introduction:
    'The Reports module is your central hub for generating, viewing, and exporting business reports. Reports are organized into categories — Stock, Sales, Payments, Import, Expenses, and Gate Pass — and each report is accessible only to users whose role permits it. Use filters to narrow data by date range, warehouse, client, category, or status, then export the results for offline analysis.',
  tableOfContents: [
    { id: 'reports-center', label: 'Reports Center', level: 1 },
    { id: 'stock-reports', label: 'Stock Reports', level: 1 },
    { id: 'stock-report-levels', label: 'Stock Report (Levels)', level: 2 },
    { id: 'stock-valuation', label: 'Stock Valuation', level: 2 },
    { id: 'sales-reports', label: 'Sales Reports', level: 1 },
    { id: 'sales-report', label: 'Sales Report', level: 2 },
    { id: 'sales-by-client', label: 'Sales by Client', level: 2 },
    { id: 'sales-by-product', label: 'Sales by Product', level: 2 },
    { id: 'payment-reports', label: 'Payment Reports', level: 1 },
    { id: 'payment-collections', label: 'Payment Collections', level: 2 },
    { id: 'receivables', label: 'Receivables', level: 2 },
    { id: 'cash-flow', label: 'Cash Flow', level: 2 },
    { id: 'import-reports', label: 'Import Reports', level: 1 },
    { id: 'expense-reports', label: 'Expense Reports', level: 1 },
    { id: 'expense-report-detail', label: 'Expense Report (Detail)', level: 2 },
    { id: 'expenses-by-category', label: 'Expenses by Category', level: 2 },
    { id: 'expense-trend', label: 'Expense Trend', level: 2 },
    { id: 'gate-pass-reports', label: 'Gate Pass Reports', level: 1 },
  ],
  sections: [
    // ── Reports Center ──────────────────────────────────────────────
    {
      id: 'reports-center',
      title: 'Reports Center',
      icon: FileText,
      roles: ['Admin', 'Sales Officer', 'Accountant', 'Warehouse Manager', 'Recovery Agent'],
      content: [
        {
          type: 'paragraph',
          text: 'The Reports Center is the hub page that lists every available report grouped by category. When you navigate to Reports in the sidebar, this is the first page you see. Reports are organized into cards, and each card shows the report name, a short description, and a link to open it.',
        },
        {
          type: 'paragraph',
          text: 'Visibility is role-based: you will only see reports your role is permitted to access. For example, a Sales Officer will see Sales and Payment reports but will not see Import or Expense reports reserved for Admin and Accountant roles.',
        },
        {
          type: 'keyValue',
          pairs: [
            { key: 'Stock Report', value: 'Current stock levels by warehouse, category, and status.' },
            { key: 'Stock Valuation', value: 'Inventory value breakdown across warehouses.' },
            { key: 'Sales Report', value: 'Invoice details with date range, client, and status filters.' },
            { key: 'Sales by Client', value: 'Revenue totals grouped by client.' },
            { key: 'Sales by Product', value: 'Quantities sold and revenue grouped by product.' },
            { key: 'Payment Collections', value: 'Client payments with method and date filters.' },
            { key: 'Receivables', value: 'Outstanding balances with aging indicators.' },
            { key: 'Cash Flow', value: 'Inflows vs outflows broken down by payment method.' },
            { key: 'Import Cost Report', value: 'Purchase orders with landed cost breakdown.' },
            { key: 'Expense Report', value: 'Detailed expenses with category and date filters.' },
            { key: 'Expenses by Category', value: 'Expense totals grouped by category.' },
            { key: 'Expense Trend', value: 'Monthly expense trend over the last 12 months.' },
            { key: 'Gate Pass Report', value: 'Gate pass records with date range and status filters.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Exporting Data',
          text: 'Most reports support exporting to CSV or Excel. After applying your filters, look for the Export button at the top-right of the report table. Exported files include all filtered rows, not just the current page, so you can perform further analysis offline.',
        },
      ],
    },

    // ── Stock Reports ───────────────────────────────────────────────
    {
      id: 'stock-reports',
      title: 'Stock Reports',
      icon: Package,
      roles: ['Admin', 'Warehouse Manager', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'Stock reports give you visibility into current inventory levels and the financial value of your stock. Use these reports to identify low-stock items, compare quantities across warehouses, and understand the cost value of your inventory at any point in time.',
        },
        {
          type: 'callout',
          variant: 'note',
          title: 'Filters Available',
          text: 'Both stock reports support filtering by warehouse, product category, and product name search. Apply filters to focus on a specific warehouse or category instead of scrolling through the full list.',
        },
      ],
      subSections: [
        {
          id: 'stock-report-levels',
          title: 'Stock Report (Levels)',
          content: [
            {
              type: 'paragraph',
              text: 'The Stock Report displays current stock quantities for every product, broken down by warehouse. Each row shows the product name, category, warehouse, batch number, bin location, current quantity, and stock status (in stock, low stock, or out of stock).',
            },
            {
              type: 'steps',
              steps: [
                {
                  title: 'Navigate to Reports > Stock Report',
                  description: 'Open the Reports Center and click the Stock Report card.',
                },
                {
                  title: 'Apply filters',
                  description:
                    'Select a warehouse to focus on a single location, choose a category to narrow by product type, or type a product name to search.',
                },
                {
                  title: 'Review the results',
                  description:
                    'The table displays all matching inventory rows. Sort by quantity to find low-stock items quickly.',
                },
              ],
            },
          ],
        },
        {
          id: 'stock-valuation',
          title: 'Stock Valuation',
          content: [
            {
              type: 'paragraph',
              text: 'The Stock Valuation report calculates the total financial value of your inventory. It multiplies each item\'s quantity by its cost price, giving you a per-product and per-warehouse value breakdown along with a grand total.',
            },
            {
              type: 'callout',
              variant: 'important',
              title: 'Cost Basis',
              text: 'Stock valuation uses the cost price recorded at the time of purchase. If products have been received at different costs across multiple purchase orders, the report reflects the weighted average or latest cost depending on your configuration.',
            },
          ],
        },
      ],
    },

    // ── Sales Reports ───────────────────────────────────────────────
    {
      id: 'sales-reports',
      title: 'Sales Reports',
      icon: ShoppingCart,
      roles: ['Admin', 'Sales Officer', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'Sales reports help you track revenue, monitor client purchasing patterns, and analyze which products drive the most sales. Three views are available: a detailed invoice-level report, a client-grouped summary, and a product-grouped summary.',
        },
      ],
      subSections: [
        {
          id: 'sales-report',
          title: 'Sales Report',
          content: [
            {
              type: 'paragraph',
              text: 'The Sales Report shows individual invoice records with full details including invoice number, date, client name, subtotal, tax, total amount, payment status, and the sales officer who created it.',
            },
            {
              type: 'steps',
              steps: [
                {
                  title: 'Set a date range',
                  description: 'Choose a start and end date to limit the invoices shown. Defaults to the current month.',
                },
                {
                  title: 'Filter by client or status',
                  description:
                    'Optionally select a specific client or filter by invoice status (Pending, Partial, Paid, Overdue, Cancelled, Voided) to narrow the results.',
                },
                {
                  title: 'Review totals',
                  description:
                    'The report footer displays the total count of invoices and the aggregate amount for the filtered results.',
                },
              ],
            },
          ],
        },
        {
          id: 'sales-by-client',
          title: 'Sales by Client',
          content: [
            {
              type: 'paragraph',
              text: 'This report groups revenue by client. Each row shows the client name, total number of invoices, total revenue, and the average invoice value. Use it to identify your highest-value clients and spot trends in client purchasing behavior.',
            },
          ],
        },
        {
          id: 'sales-by-product',
          title: 'Sales by Product',
          content: [
            {
              type: 'paragraph',
              text: 'This report groups sales by product. Each row displays the product name, total quantity sold, total revenue generated, and the average selling price. It helps you understand which products are your best sellers by volume and by revenue.',
            },
          ],
        },
      ],
    },

    // ── Payment Reports ─────────────────────────────────────────────
    {
      id: 'payment-reports',
      title: 'Payment Reports',
      icon: CreditCard,
      roles: ['Admin', 'Accountant', 'Recovery Agent'],
      content: [
        {
          type: 'paragraph',
          text: 'Payment reports track money coming in from clients, outstanding balances, and the overall cash flow picture. These reports are essential for the accounts and recovery teams to monitor collections and manage receivables.',
        },
      ],
      subSections: [
        {
          id: 'payment-collections',
          title: 'Payment Collections',
          content: [
            {
              type: 'paragraph',
              text: 'The Payment Collections report lists all client payments received within a given period. Each entry shows the payment date, client name, amount, payment method (cash, cheque, bank transfer, online), reference number, and the invoices the payment was applied against.',
            },
            {
              type: 'steps',
              steps: [
                {
                  title: 'Set date range',
                  description: 'Define the period you want to review. Defaults to the current month.',
                },
                {
                  title: 'Filter by payment method',
                  description:
                    'Optionally filter by a specific payment method to see only cash collections, cheque collections, etc.',
                },
                {
                  title: 'Review the summary',
                  description:
                    'The report footer shows the total collected amount and a breakdown by payment method.',
                },
              ],
            },
          ],
        },
        {
          id: 'receivables',
          title: 'Receivables',
          content: [
            {
              type: 'paragraph',
              text: 'The Receivables report shows all outstanding client balances. Each row includes the client name, total invoiced amount, total paid, outstanding balance, and an aging indicator showing how long the balance has been overdue.',
            },
            {
              type: 'callout',
              variant: 'warning',
              title: 'Aging Indicators',
              text: 'Pay close attention to the aging column. Balances marked as 60+ or 90+ days overdue require urgent follow-up by the recovery team. The longer a receivable ages, the harder it becomes to collect.',
            },
          ],
        },
        {
          id: 'cash-flow',
          title: 'Cash Flow',
          content: [
            {
              type: 'paragraph',
              text: 'The Cash Flow report compares inflows (client payments received) against outflows (supplier payments made) over a selected period. It breaks the figures down by payment method so you can see how much cash versus bank transfers are flowing through the business.',
            },
            {
              type: 'keyValue',
              pairs: [
                { key: 'Inflows', value: 'Total payments received from clients, grouped by method.' },
                { key: 'Outflows', value: 'Total payments made to suppliers, grouped by method.' },
                { key: 'Net Cash Flow', value: 'Inflows minus outflows — a positive number means more money coming in than going out.' },
              ],
            },
          ],
        },
      ],
    },

    // ── Import Reports ──────────────────────────────────────────────
    {
      id: 'import-reports',
      title: 'Import Reports',
      icon: Ship,
      roles: ['Admin', 'Warehouse Manager'],
      content: [
        {
          type: 'paragraph',
          text: 'The Import Cost Report provides a detailed breakdown of landed costs for purchase orders. It is especially useful for imported goods where the final cost includes not just the unit price, but also shipping charges, customs duties, and taxes.',
        },
        {
          type: 'paragraph',
          text: 'Each row in the report shows the purchase order number, supplier, container number, total unit cost, shipping cost, customs cost, tax amount, and the final landed cost. This helps you understand the true cost of goods and set profitable selling prices.',
        },
        {
          type: 'keyValue',
          pairs: [
            { key: 'Unit Cost', value: 'The base price per unit as agreed with the supplier.' },
            { key: 'Shipping Cost', value: 'Freight and transportation charges for the shipment.' },
            { key: 'Customs Duty', value: 'Import duties and customs clearance fees.' },
            { key: 'Tax', value: 'Applicable taxes on the imported goods.' },
            { key: 'Landed Cost', value: 'The sum of unit cost, shipping, customs, and tax — the true cost of the product.' },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Compare Landed Costs',
          text: 'Use this report to compare landed costs across different suppliers or shipments. A supplier with a lower unit price may end up costing more once shipping and customs are factored in.',
        },
      ],
    },

    // ── Expense Reports ─────────────────────────────────────────────
    {
      id: 'expense-reports',
      title: 'Expense Reports',
      icon: Receipt,
      roles: ['Admin', 'Accountant'],
      content: [
        {
          type: 'paragraph',
          text: 'Expense reports help you track and analyze business expenditures. Three views are available: a detailed line-item report, a category-grouped summary, and a monthly trend chart that shows spending patterns over the last 12 months.',
        },
      ],
      subSections: [
        {
          id: 'expense-report-detail',
          title: 'Expense Report (Detail)',
          content: [
            {
              type: 'paragraph',
              text: 'The detailed Expense Report lists every recorded expense with date, description, category, amount, and any attached notes. Use the category and date range filters to narrow results to a specific type of expense or period.',
            },
            {
              type: 'steps',
              steps: [
                {
                  title: 'Set date range',
                  description: 'Choose a start and end date to limit the expenses displayed.',
                },
                {
                  title: 'Filter by category',
                  description:
                    'Select an expense category (e.g., Utilities, Rent, Salaries, Transport) to focus on a specific type of spending.',
                },
                {
                  title: 'Review totals',
                  description: 'The report footer shows the total expense amount for the filtered results.',
                },
              ],
            },
          ],
        },
        {
          id: 'expenses-by-category',
          title: 'Expenses by Category',
          content: [
            {
              type: 'paragraph',
              text: 'This report groups all expenses by their category and shows the total amount spent in each. It provides a quick overview of where the business is spending the most money, making it easy to identify areas where costs can be controlled.',
            },
          ],
        },
        {
          id: 'expense-trend',
          title: 'Expense Trend',
          content: [
            {
              type: 'paragraph',
              text: 'The Expense Trend report displays a monthly bar or line chart showing total expenses for each of the last 12 months. Use it to spot seasonal patterns, identify months with unusually high spending, and track whether cost-control measures are working.',
            },
            {
              type: 'callout',
              variant: 'note',
              title: '12-Month Window',
              text: 'The trend report always shows the trailing 12 months from the current date. It updates automatically each month as new expense data is recorded.',
            },
          ],
        },
      ],
    },

    // ── Gate Pass Reports ───────────────────────────────────────────
    {
      id: 'gate-pass-reports',
      title: 'Gate Pass Reports',
      icon: ClipboardCheck,
      roles: ['Admin', 'Warehouse Manager'],
      content: [
        {
          type: 'paragraph',
          text: 'The Gate Pass Report tracks all gate passes issued for goods leaving the warehouse. Each entry includes the gate pass number, date, linked invoice (if applicable), vehicle details, destination, items, and current status.',
        },
        {
          type: 'steps',
          steps: [
            {
              title: 'Set date range',
              description: 'Filter gate passes by the date they were issued.',
            },
            {
              title: 'Filter by status',
              description:
                'Narrow results by gate pass status to find open, completed, or cancelled passes.',
            },
            {
              title: 'Review and export',
              description:
                'View the filtered gate pass list in a table. Export to CSV for record keeping or auditing purposes.',
            },
          ],
        },
        {
          type: 'callout',
          variant: 'tip',
          title: 'Audit Trail',
          text: 'Gate pass reports are valuable for warehouse audits. Cross-reference gate pass records with invoice records to verify that all dispatched goods have corresponding billing entries.',
        },
      ],
    },
  ],
};
