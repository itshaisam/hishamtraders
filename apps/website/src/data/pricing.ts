export const plans = [
  {
    name: "Starter",
    description: "For small businesses getting started with ERP",
    monthlyPrice: 49,
    annualPrice: 39,
    features: [
      "Up to 5 users",
      "Inventory management (1 warehouse)",
      "Sales & invoicing",
      "Basic reports",
      "Email support",
      "Data import assistance",
    ],
    highlighted: false,
    cta: "Start Free Trial",
  },
  {
    name: "Professional",
    description: "For growing businesses that need full ERP capabilities",
    monthlyPrice: 149,
    annualPrice: 119,
    features: [
      "Up to 20 users",
      "All 7 modules included",
      "Multi-warehouse support",
      "Recovery & collections",
      "Advanced reports & analytics",
      "Bank reconciliation",
      "Priority email & chat support",
      "Dedicated onboarding specialist",
    ],
    highlighted: true,
    cta: "Start Free Trial",
  },
  {
    name: "Enterprise",
    description: "For large organizations with custom requirements",
    monthlyPrice: null,
    annualPrice: null,
    features: [
      "Unlimited users",
      "All Professional features",
      "Custom integrations & API access",
      "Dedicated account manager",
      "Custom training & onboarding",
      "SLA & uptime guarantee",
      "On-premise deployment option",
      "24/7 phone & email support",
    ],
    highlighted: false,
    cta: "Contact Sales",
  },
];

export const comparisonCategories = [
  {
    name: "Core Features",
    features: [
      { name: "Inventory Management", starter: true, professional: true, enterprise: true },
      { name: "Sales & Invoicing", starter: true, professional: true, enterprise: true },
      { name: "Purchase Orders", starter: true, professional: true, enterprise: true },
      { name: "Financial & Accounting", starter: false, professional: true, enterprise: true },
      { name: "Recovery & Collections", starter: false, professional: true, enterprise: true },
      { name: "Advanced Reports", starter: false, professional: true, enterprise: true },
    ],
  },
  {
    name: "Operations",
    features: [
      { name: "Multi-Warehouse", starter: false, professional: true, enterprise: true },
      { name: "Gate Pass System", starter: false, professional: true, enterprise: true },
      { name: "Batch & Expiry Tracking", starter: true, professional: true, enterprise: true },
      { name: "Physical Stock Counts", starter: false, professional: true, enterprise: true },
      { name: "Landed Cost Calculation", starter: false, professional: true, enterprise: true },
    ],
  },
  {
    name: "Administration",
    features: [
      { name: "Role-Based Access", starter: true, professional: true, enterprise: true },
      { name: "Audit Trail", starter: true, professional: true, enterprise: true },
      { name: "Change History", starter: false, professional: true, enterprise: true },
      { name: "Custom API Access", starter: false, professional: false, enterprise: true },
      { name: "Custom Integrations", starter: false, professional: false, enterprise: true },
    ],
  },
  {
    name: "Support",
    features: [
      { name: "Email Support", starter: true, professional: true, enterprise: true },
      { name: "Chat Support", starter: false, professional: true, enterprise: true },
      { name: "Phone Support", starter: false, professional: false, enterprise: true },
      { name: "Dedicated Account Manager", starter: false, professional: false, enterprise: true },
      { name: "Custom Training", starter: false, professional: false, enterprise: true },
    ],
  },
];
