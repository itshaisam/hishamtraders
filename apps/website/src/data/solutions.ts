type Solution = {
  slug: string;
  overline: string;
  title: string;
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  benefits: { title: string; description: string }[];
  keyModules: { name: string; href: string; description: string }[];
  stats?: { value: string; label: string }[];
};

export const roleSolutions: Solution[] = [
  {
    slug: "business-owners",
    overline: "For Business Owners",
    title: "Complete visibility into your entire operation",
    subtitle: "See revenue, inventory, collections, and team performance from a single dashboard. Make data-driven decisions without waiting for reports.",
    metaTitle: "TradeFlow ERP for Business Owners",
    metaDescription: "Get complete visibility into your business operations with TradeFlow ERP. Real-time dashboards, financial reports, and team performance metrics.",
    benefits: [
      { title: "Real-Time Dashboard", description: "Revenue, orders, collections, and inventory at a glance — updated in real-time." },
      { title: "Financial Health", description: "Trial balance, P&L, and cash flow reports generated in seconds, not days." },
      { title: "Team Accountability", description: "Audit trail and performance metrics for every team member across all roles." },
      { title: "Credit Risk Control", description: "Monitor client credit utilization and overdue balances to minimize bad debt." },
      { title: "Growth Insights", description: "Sales trends, top products, and client analytics to identify growth opportunities." },
      { title: "Cost Visibility", description: "True landed costs for every product including shipping, customs, and taxes." },
    ],
    keyModules: [
      { name: "Reports & Analytics", href: "/product/features/reports", description: "One-click reports across all modules with Excel export." },
      { name: "Financial & Accounting", href: "/product/features/accounting", description: "Complete financial picture with trial balance and P&L." },
      { name: "Administration", href: "/product/features/administration", description: "User management, audit trail, and system configuration." },
    ],
    stats: [
      { value: "40%", label: "Efficiency gain" },
      { value: "5 min", label: "Month-end reports" },
      { value: "100%", label: "Action traceability" },
      { value: "24/7", label: "Data access" },
    ],
  },
  {
    slug: "warehouse-managers",
    overline: "For Warehouse Managers",
    title: "Real-time stock control across every warehouse",
    subtitle: "Track inventory by warehouse, bin, and batch. Manage stock adjustments, gate passes, transfers, and physical counts with approval workflows.",
    metaTitle: "TradeFlow ERP for Warehouse Managers",
    metaDescription: "Real-time inventory tracking across multiple warehouses with bin locations, batch management, and automated gate passes.",
    benefits: [
      { title: "Multi-Warehouse View", description: "See stock levels across all warehouses and bins in one screen." },
      { title: "Goods Receipt", description: "Receive POs with batch assignment and bin placement in seconds." },
      { title: "Gate Pass Automation", description: "Automated gate passes for sales, transfers, and returns with approval tracking." },
      { title: "Stock Adjustments", description: "Submit adjustment requests with reasons — approved or rejected with full audit trail." },
      { title: "Physical Counts", description: "Plan and execute stock counts with variance analysis and auto-adjustments." },
      { title: "Expiry Alerts", description: "Automatic warnings for products approaching expiry date." },
    ],
    keyModules: [
      { name: "Inventory & Warehouse", href: "/product/features/inventory", description: "Complete warehouse operations management." },
      { name: "Purchase & Procurement", href: "/product/features/procurement", description: "Goods receipt and supplier coordination." },
      { name: "Reports & Analytics", href: "/product/features/reports", description: "Stock reports and movement history." },
    ],
    stats: [
      { value: "60%", label: "Fewer stockouts" },
      { value: "3x", label: "Faster goods receipt" },
      { value: "0", label: "Lost inventory items" },
      { value: "Real-time", label: "Stock visibility" },
    ],
  },
  {
    slug: "sales-teams",
    overline: "For Sales Teams",
    title: "Close deals faster with instant invoicing",
    subtitle: "Create invoices in under 2 minutes with automatic stock checks, credit limit enforcement, and tax calculation. Track payments and manage client relationships.",
    metaTitle: "TradeFlow ERP for Sales Teams",
    metaDescription: "Fast invoicing, credit management, and payment tracking for sales teams. Create invoices in under 2 minutes.",
    benefits: [
      { title: "Quick Invoicing", description: "Multi-line invoices with auto tax calculation and stock deduction in seconds." },
      { title: "Credit Checks", description: "Automatic credit limit enforcement prevents over-selling to risky clients." },
      { title: "Stock Availability", description: "See real-time stock levels before committing to orders." },
      { title: "Payment Tracking", description: "Allocate payments across invoices and see outstanding balances instantly." },
      { title: "Returns & Credits", description: "Process returns with credit notes and automatic stock reinstatement." },
      { title: "Mobile Access", description: "Create invoices and check stock from the field on any device." },
    ],
    keyModules: [
      { name: "Sales & Invoicing", href: "/product/features/sales", description: "Full invoicing and payment management." },
      { name: "Inventory & Warehouse", href: "/product/features/inventory", description: "Real-time stock availability checks." },
      { name: "Reports & Analytics", href: "/product/features/reports", description: "Sales reports and client analytics." },
    ],
    stats: [
      { value: "25%", label: "Faster invoicing" },
      { value: "<2 min", label: "Invoice creation" },
      { value: "0", label: "Credit limit breaches" },
      { value: "Real-time", label: "Stock checks" },
    ],
  },
  {
    slug: "accountants",
    overline: "For Accountants",
    title: "Automate the tedious, focus on the strategic",
    subtitle: "Double-entry bookkeeping, bank reconciliation, and financial reports generated in seconds. Close the month in minutes, not days.",
    metaTitle: "TradeFlow ERP for Accountants",
    metaDescription: "Automated double-entry bookkeeping, bank reconciliation, and financial reporting. Month-end closing in minutes.",
    benefits: [
      { title: "Double-Entry Bookkeeping", description: "Automatic debit/credit validation ensures balanced books at all times." },
      { title: "Bank Reconciliation", description: "Match transactions to bank statements and identify variances instantly." },
      { title: "Financial Reports", description: "Trial balance, P&L, balance sheet, and general ledger in one click." },
      { title: "Period-End Closing", description: "Automate month-end P&L transfer, period locking, and closing entries." },
      { title: "Expense Tracking", description: "Categorize business expenses with receipt documentation." },
      { title: "Journal Entries", description: "Create, post, and approve journal entries with full audit trail." },
    ],
    keyModules: [
      { name: "Financial & Accounting", href: "/product/features/accounting", description: "Complete accounting operations." },
      { name: "Reports & Analytics", href: "/product/features/reports", description: "Financial reports and ledger views." },
      { name: "Administration", href: "/product/features/administration", description: "Audit trail for compliance." },
    ],
    stats: [
      { value: "5 min", label: "Month-end reports" },
      { value: "0", label: "Reconciliation errors" },
      { value: "100%", label: "Double-entry compliance" },
      { value: "Instant", label: "Trial balance" },
    ],
  },
  {
    slug: "recovery-agents",
    overline: "For Recovery Agents",
    title: "Efficient field collection, fully tracked",
    subtitle: "Daily routes, client history, payment logging, and promise tracking — all from your phone. Management sees your progress in real-time.",
    metaTitle: "TradeFlow ERP for Recovery Agents",
    metaDescription: "Field collection management with route planning, visit logging, and payment promise tracking.",
    benefits: [
      { title: "Daily Route", description: "See today's clients with addresses, balances, and payment history." },
      { title: "Visit Logging", description: "Record visit outcomes, amounts collected, and notes with GPS tracking." },
      { title: "Payment Promises", description: "Create and track payment promises with automatic follow-up alerts." },
      { title: "Instant Receipts", description: "Record payments that update client balances and invoices in real-time." },
      { title: "Client History", description: "View full payment history, aging, and previous visit notes before each call." },
      { title: "Mobile-First", description: "Designed for field use on smartphones — fast, clear, and touch-optimized." },
    ],
    keyModules: [
      { name: "Recovery & Collections", href: "/product/features/recovery", description: "Complete field recovery management." },
      { name: "Sales & Invoicing", href: "/product/features/sales", description: "Payment recording and invoice updates." },
      { name: "Reports & Analytics", href: "/product/features/reports", description: "Collection and performance reports." },
    ],
    stats: [
      { value: "30%", label: "Reduction in DSO" },
      { value: "35%", label: "Better collection rate" },
      { value: "Real-time", label: "Payment tracking" },
      { value: "GPS", label: "Visit verification" },
    ],
  },
];

export const industrySolutions: Solution[] = [
  {
    slug: "import-distribution",
    overline: "Import & Distribution",
    title: "Built for importers and distributors",
    subtitle: "Track shipments from port to warehouse, calculate true landed costs, manage multi-warehouse inventory, and collect payments efficiently.",
    metaTitle: "ERP for Import & Distribution Businesses",
    metaDescription: "TradeFlow ERP for import and distribution — container tracking, landed cost calculation, multi-warehouse management.",
    benefits: [
      { title: "Container Tracking", description: "Track container numbers, ship dates, and arrival dates for every import." },
      { title: "Landed Cost Calculation", description: "Automatically allocate shipping, customs, and taxes to get true product costs." },
      { title: "Multi-Warehouse", description: "Manage inventory across multiple warehouses with bin-level tracking." },
      { title: "Credit Management", description: "Set credit limits and payment terms per client to manage risk." },
      { title: "Field Recovery", description: "Send recovery agents with daily routes and track collections in real-time." },
      { title: "Import Reports", description: "Track PO costs, supplier performance, and import timelines." },
    ],
    keyModules: [
      { name: "Purchase & Procurement", href: "/product/features/procurement", description: "PO lifecycle with import documentation." },
      { name: "Inventory & Warehouse", href: "/product/features/inventory", description: "Multi-warehouse stock tracking." },
      { name: "Recovery & Collections", href: "/product/features/recovery", description: "Field collection management." },
    ],
    stats: [
      { value: "3x", label: "Faster PO processing" },
      { value: "60%", label: "Fewer stockouts" },
      { value: "30%", label: "Faster recovery" },
      { value: "100%", label: "Cost visibility" },
    ],
  },
  {
    slug: "building-materials",
    overline: "Building Materials",
    title: "Manage heavy inventory with precision",
    subtitle: "Track bulk materials across warehouses, manage credit-heavy client relationships, and keep financials in check with automated accounting.",
    metaTitle: "ERP for Building Materials Businesses",
    metaDescription: "TradeFlow ERP for building materials — inventory tracking, credit management, and accounting for steel, cement, and hardware distributors.",
    benefits: [
      { title: "Bulk Inventory", description: "Track large quantities across warehouses with accurate stock movement records." },
      { title: "Credit-Heavy Sales", description: "Manage large credit limits and long payment terms typical in construction." },
      { title: "Client Aging", description: "Monitor overdue balances with aging analysis to prevent bad debt." },
      { title: "Gate Passes", description: "Control dispatches with automated gate passes and driver tracking." },
      { title: "Landed Costs", description: "Calculate true costs including transportation and handling for bulk materials." },
      { title: "Financial Control", description: "Complete accounting with bank reconciliation and month-end closing." },
    ],
    keyModules: [
      { name: "Inventory & Warehouse", href: "/product/features/inventory", description: "Multi-warehouse bulk tracking." },
      { name: "Sales & Invoicing", href: "/product/features/sales", description: "Credit management and invoicing." },
      { name: "Financial & Accounting", href: "/product/features/accounting", description: "Complete financial management." },
    ],
  },
  {
    slug: "electronics",
    overline: "Electronics Wholesale",
    title: "Track every unit from import to sale",
    subtitle: "Manage high-value electronics inventory with batch tracking, warranty management, and precise landed cost calculations.",
    metaTitle: "ERP for Electronics Wholesale",
    metaDescription: "TradeFlow ERP for electronics wholesalers — batch tracking, landed costs, and credit management for high-value inventory.",
    benefits: [
      { title: "Batch Tracking", description: "Track every batch from import to sale with full traceability." },
      { title: "Precise Costing", description: "Calculate exact landed costs including customs duty and shipping per unit." },
      { title: "Stock Variants", description: "Manage product variants (colors, sizes, models) with separate SKUs." },
      { title: "Credit Control", description: "Enforce credit limits for high-value transactions." },
      { title: "Multi-Brand", description: "Manage multiple brands and their product lines from one platform." },
      { title: "Sales Analytics", description: "Identify top-selling products and most profitable clients." },
    ],
    keyModules: [
      { name: "Inventory & Warehouse", href: "/product/features/inventory", description: "Batch and variant tracking." },
      { name: "Purchase & Procurement", href: "/product/features/procurement", description: "Import and landed cost management." },
      { name: "Sales & Invoicing", href: "/product/features/sales", description: "High-value invoicing and credit control." },
    ],
  },
  {
    slug: "fmcg",
    overline: "FMCG Distribution",
    title: "Move fast, track everything",
    subtitle: "Manage high-volume, fast-moving consumer goods with expiry tracking, rapid invoicing, and efficient route-based recovery.",
    metaTitle: "ERP for FMCG Distribution",
    metaDescription: "TradeFlow ERP for FMCG distributors — expiry management, rapid invoicing, route planning, and real-time inventory.",
    benefits: [
      { title: "Expiry Management", description: "Track batch expiry dates with automatic alerts before products expire." },
      { title: "High-Volume Invoicing", description: "Process dozens of invoices daily with rapid, streamlined workflows." },
      { title: "Route Recovery", description: "Organized daily routes for collection agents covering wide areas." },
      { title: "Stock Turnover", description: "Monitor stock turnover rates and identify slow-moving items." },
      { title: "Multi-Warehouse", description: "Distribute from multiple warehouses to optimize delivery routes." },
      { title: "Client Coverage", description: "Manage hundreds of retail clients with efficient credit and payment tracking." },
    ],
    keyModules: [
      { name: "Inventory & Warehouse", href: "/product/features/inventory", description: "Expiry tracking and batch management." },
      { name: "Sales & Invoicing", href: "/product/features/sales", description: "Rapid invoicing for high volume." },
      { name: "Recovery & Collections", href: "/product/features/recovery", description: "Route-based field recovery." },
    ],
  },
  {
    slug: "general-trading",
    overline: "General Trading",
    title: "One platform for diverse product lines",
    subtitle: "Manage varied product categories, multiple suppliers, and diverse client bases — all from a single integrated platform.",
    metaTitle: "ERP for General Trading Companies",
    metaDescription: "TradeFlow ERP for general trading — multi-category inventory, supplier management, and financial control.",
    benefits: [
      { title: "Multi-Category", description: "Organize diverse product lines with categories, brands, and units of measure." },
      { title: "Supplier Network", description: "Manage multiple suppliers with purchase orders and payment tracking." },
      { title: "Flexible Invoicing", description: "Cash and credit invoicing with configurable tax rates and payment terms." },
      { title: "Financial Overview", description: "Complete accounting across all product lines and business segments." },
      { title: "Growth Analytics", description: "Identify profitable categories and clients to focus growth efforts." },
      { title: "Scalable", description: "Start with core features and enable additional modules as you grow." },
    ],
    keyModules: [
      { name: "Inventory & Warehouse", href: "/product/features/inventory", description: "Multi-category stock management." },
      { name: "Purchase & Procurement", href: "/product/features/procurement", description: "Supplier and PO management." },
      { name: "Financial & Accounting", href: "/product/features/accounting", description: "Complete financial control." },
    ],
  },
];

export const sizeSolutions: Solution[] = [
  {
    slug: "small-business",
    overline: "Small Business",
    title: "Enterprise features at a small business price",
    subtitle: "Get the inventory tracking, invoicing, and accounting tools you need to run your business professionally — without the enterprise complexity.",
    metaTitle: "TradeFlow ERP for Small Businesses",
    metaDescription: "Affordable ERP for small trading businesses. Inventory, invoicing, and accounting from one platform.",
    benefits: [
      { title: "Quick Setup", description: "Up and running in under a week with guided onboarding and data import." },
      { title: "Simple to Use", description: "Clean interface designed for teams without technical backgrounds." },
      { title: "Affordable", description: "Start with the Starter plan and only pay for what you need." },
      { title: "Professional Invoices", description: "Generate professional invoices that build client confidence." },
      { title: "Financial Clarity", description: "Know your numbers with automated bookkeeping and reports." },
      { title: "Grow at Your Pace", description: "Enable additional modules and users as your business grows." },
    ],
    keyModules: [
      { name: "Inventory & Warehouse", href: "/product/features/inventory", description: "Core stock management." },
      { name: "Sales & Invoicing", href: "/product/features/sales", description: "Professional invoicing." },
      { name: "Reports & Analytics", href: "/product/features/reports", description: "Essential business reports." },
    ],
  },
  {
    slug: "medium-business",
    overline: "Medium Business",
    title: "Scale your operations without scaling complexity",
    subtitle: "Multi-warehouse management, full accounting, field recovery, and advanced reporting — all the tools to manage a growing operation efficiently.",
    metaTitle: "TradeFlow ERP for Medium Businesses",
    metaDescription: "Complete ERP for medium-sized trading businesses. Multi-warehouse, full accounting, and recovery management.",
    benefits: [
      { title: "Multi-Warehouse", description: "Manage stock across multiple locations with inter-warehouse transfers." },
      { title: "Full Accounting", description: "Complete double-entry bookkeeping with bank reconciliation." },
      { title: "Recovery Management", description: "Field collection with route planning and agent performance tracking." },
      { title: "Advanced Reports", description: "Comprehensive reporting across all modules with export capabilities." },
      { title: "Team Management", description: "Role-based access for growing teams with audit trail." },
      { title: "Priority Support", description: "Dedicated onboarding specialist and priority email support." },
    ],
    keyModules: [
      { name: "All 7 Modules", href: "/product/features", description: "Full access to every TradeFlow module." },
      { name: "Recovery & Collections", href: "/product/features/recovery", description: "Field recovery management." },
      { name: "Financial & Accounting", href: "/product/features/accounting", description: "Complete financial suite." },
    ],
  },
  {
    slug: "enterprise",
    overline: "Enterprise",
    title: "Custom-built for your organization",
    subtitle: "Unlimited users, custom integrations, dedicated support, and on-premise deployment options — tailored to your exact requirements.",
    metaTitle: "TradeFlow ERP for Enterprise",
    metaDescription: "Enterprise ERP with unlimited users, custom integrations, dedicated support, and SLA guarantees.",
    benefits: [
      { title: "Unlimited Users", description: "No user limits. Deploy across your entire organization." },
      { title: "Custom Integrations", description: "API access to build custom integrations with your existing tools." },
      { title: "Dedicated Support", description: "Named account manager, 24/7 support, and custom SLA." },
      { title: "Custom Training", description: "Tailored onboarding and training programs for your team." },
      { title: "On-Premise Option", description: "Deploy on your own servers for maximum control and compliance." },
      { title: "SLA Guarantee", description: "Contractual uptime guarantees and priority incident resolution." },
    ],
    keyModules: [
      { name: "All 7 Modules", href: "/product/features", description: "Full access to every TradeFlow module." },
      { name: "Integrations", href: "/product/integrations", description: "Custom API and third-party integrations." },
      { name: "Administration", href: "/product/features/administration", description: "Enterprise security and compliance." },
    ],
  },
];
