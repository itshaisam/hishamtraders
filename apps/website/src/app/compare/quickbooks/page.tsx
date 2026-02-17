import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CTABanner } from "@/components/layout/CTABanner";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "TradeFlow ERP vs QuickBooks - Feature Comparison",
  description: "Compare TradeFlow ERP and QuickBooks for import and distribution businesses. Move beyond basic accounting to full business management.",
};

export default function CompareQuickBooksPage() {
  return (
    <>
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              TradeFlow ERP vs QuickBooks
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              QuickBooks is excellent for basic accounting, but it lacks the inventory management, procurement workflows, 
              and field recovery tools that import and distribution businesses need. TradeFlow covers the entire business 
              cycle—from purchase orders and landed costs to multi-warehouse inventory, invoicing, and collections—while 
              maintaining full accounting integration.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <SectionHeader
            title="Feature Comparison"
            subtitle="See how TradeFlow stacks up against QuickBooks"
          />

          <div className="max-w-4xl mx-auto mt-12">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">TradeFlow ERP</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">QuickBooks</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Accounting & General Ledger</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Multi-warehouse Inventory</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="w-5 h-5 text-red-600 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Purchase Order Management</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Basic only</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Landed Cost Calculation</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="w-5 h-5 text-red-600 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Field Recovery & Collections</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="w-5 h-5 text-red-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Gate Pass Management</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="w-5 h-5 text-red-600 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Learning Curve</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">Low</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">Low</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Pricing (relative)</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">$$$</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">$$</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </Container>
      </section>

      <CTABanner />
    </>
  );
}
