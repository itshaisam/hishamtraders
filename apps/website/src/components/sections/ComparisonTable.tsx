import { Container } from "../ui/Container";
import { SectionHeader } from "../ui/SectionHeader";
import { Check, X } from "lucide-react";

const categories = [
  {
    name: "Inventory Management",
    color: "bg-blue-50 text-blue-700",
    rows: [
      { feature: "Multi-warehouse inventory tracking", spreadsheet: false, tradeflow: true },
      { feature: "Automatic stock level alerts", spreadsheet: false, tradeflow: true },
      { feature: "Batch & bin location tracking", spreadsheet: false, tradeflow: true },
    ],
  },
  {
    name: "Sales & Invoicing",
    color: "bg-green-50 text-green-700",
    rows: [
      { feature: "Invoice generation in seconds", spreadsheet: false, tradeflow: true },
      { feature: "Credit limit enforcement", spreadsheet: false, tradeflow: true },
      { feature: "Payment allocation tracking", spreadsheet: false, tradeflow: true },
    ],
  },
  {
    name: "Financial & Accounting",
    color: "bg-purple-50 text-purple-700",
    rows: [
      { feature: "Double-entry bookkeeping", spreadsheet: false, tradeflow: true },
      { feature: "Bank reconciliation", spreadsheet: false, tradeflow: true },
      { feature: "One-click financial reports", spreadsheet: false, tradeflow: true },
    ],
  },
  {
    name: "Operations & Security",
    color: "bg-orange-50 text-orange-700",
    rows: [
      { feature: "Field recovery tracking", spreadsheet: false, tradeflow: true },
      { feature: "Complete audit trail", spreadsheet: false, tradeflow: true },
      { feature: "Role-based access control", spreadsheet: false, tradeflow: true },
    ],
  },
];

export function ComparisonTable() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <Container>
        <SectionHeader
          overline="Why switch"
          title="Spreadsheets vs. TradeFlow ERP"
          subtitle="See why growing businesses are moving from manual processes to an integrated ERP."
        />

        <div className="max-w-2xl mx-auto">
          <div className="rounded-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-gray-50 border-b border-gray-200">
              <div className="px-5 py-3 text-sm font-semibold text-gray-700">Feature</div>
              <div className="px-5 py-3 text-sm font-semibold text-gray-500 text-center">
                Spreadsheets
              </div>
              <div className="px-5 py-3 text-sm font-semibold text-primary-600 text-center bg-primary-50/50">
                TradeFlow ERP
              </div>
            </div>

            {/* Category groups */}
            {categories.map((category) => (
              <div key={category.name}>
                {/* Category header */}
                <div className={`px-5 py-2.5 text-xs font-semibold uppercase tracking-wide border-b border-gray-100 ${category.color}`}>
                  {category.name}
                </div>

                {/* Rows */}
                {category.rows.map((row, i) => (
                  <div
                    key={row.feature}
                    className={`grid grid-cols-3 ${
                      i < category.rows.length - 1 ? "border-b border-gray-100" : "border-b border-gray-200"
                    }`}
                  >
                    <div className="px-5 py-3 text-sm text-gray-700">{row.feature}</div>
                    <div className="px-5 py-3 flex justify-center">
                      {row.spreadsheet ? (
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-primary-600" />
                        </div>
                      ) : (
                        <X className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                    <div className="px-5 py-3 flex justify-center bg-primary-50/50">
                      {row.tradeflow ? (
                        <div className="w-6 h-6 rounded-full bg-primary-100 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-primary-600" />
                        </div>
                      ) : (
                        <X className="w-6 h-6 text-gray-300" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
