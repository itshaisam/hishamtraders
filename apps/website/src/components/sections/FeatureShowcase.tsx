import { Container } from "../ui/Container";
import { Check } from "lucide-react";
import Link from "next/link";
import { InventoryMockup, SalesMockup, AccountingMockup } from "../mockups";

const mockupComponents = {
  inventory: InventoryMockup,
  sales: SalesMockup,
  accounting: AccountingMockup,
};

const showcases: {
  overline: string;
  title: string;
  description: string;
  features: string[];
  href: string;
  reversed?: boolean;
  mockupType: "inventory" | "sales" | "accounting";
}[] = [
  {
    overline: "Inventory & Warehouse",
    title: "Real-time visibility across every warehouse",
    description: "Track stock by warehouse, bin location, and batch number. Get automatic alerts for low stock and expiring products.",
    features: [
      "Multi-warehouse with bin location management",
      "Batch tracking with expiry alerts",
      "Automated gate pass system with approvals",
    ],
    href: "/product/features/inventory",
    mockupType: "inventory",
  },
  {
    overline: "Sales & Invoicing",
    title: "Create invoices in under 2 minutes",
    description: "Generate cash and credit invoices with automatic tax calculation, credit limit enforcement, and stock deduction.",
    features: [
      "Automatic credit limit checks and alerts",
      "Multi-line invoicing with dynamic tax rates",
      "Payment allocation across multiple invoices",
    ],
    href: "/product/features/sales",
    reversed: true,
    mockupType: "sales",
  },
  {
    overline: "Financial & Accounting",
    title: "Month-end reports in 5 minutes, not 5 days",
    description: "Double-entry bookkeeping with automated journal entries, bank reconciliation, and one-click financial reports.",
    features: [
      "Trial balance, P&L, and balance sheet in seconds",
      "Bank reconciliation with variance analysis",
      "Automated period-end closing with audit trail",
    ],
    href: "/product/features/accounting",
    mockupType: "accounting",
  },
];

export function FeatureShowcase() {
  return (
    <div>
      {showcases.map((item, index) => {
        const MockupComponent = mockupComponents[item.mockupType];
        return (
          <section
            key={item.overline}
            className={`py-16 lg:py-24 ${index % 2 === 0 ? "bg-gray-50" : "bg-white"}`}
          >
            <Container>
              <div className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center ${item.reversed ? "lg:flex-row-reverse" : ""}`}>
                {/* Text */}
                <div className={item.reversed ? "lg:order-2" : ""}>
                  <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">
                    {item.overline}
                  </p>
                  <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 tracking-tight">
                    {item.title}
                  </h2>
                  <p className="mt-4 text-lg text-gray-600 leading-relaxed">
                    {item.description}
                  </p>
                  <ul className="mt-6 space-y-3">
                    {item.features.map((f) => (
                      <li key={f} className="flex items-start gap-3">
                        <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mt-0.5 shrink-0">
                          <Check className="h-3 w-3 text-primary-600" />
                        </div>
                        <span className="text-gray-700">{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={item.href}
                    className="inline-flex items-center mt-6 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors"
                  >
                    Learn more &rarr;
                  </Link>
                </div>

                {/* Dashboard Mockup */}
                <div className={item.reversed ? "lg:order-1" : ""}>
                  <div className="rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-white">
                    <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                      <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                      <div className="flex-1 mx-3">
                        <div className="bg-white border border-gray-200 rounded px-2 py-0.5 text-[10px] text-gray-400 max-w-48">
                          app.tradeflowerp.com
                        </div>
                      </div>
                    </div>
                    <MockupComponent />
                  </div>
                </div>
              </div>
            </Container>
          </section>
        );
      })}
    </div>
  );
}
