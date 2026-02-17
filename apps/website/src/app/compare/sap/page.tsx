import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CTABanner } from "@/components/layout/CTABanner";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "TradeFlow ERP vs SAP Business One - Feature Comparison",
  description: "Compare TradeFlow ERP and SAP Business One for import and distribution businesses. Get the same core features at a fraction of the cost and complexity.",
};

export default function CompareSAPPage() {
  return (
    <>
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              TradeFlow ERP vs SAP Business One
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              SAP Business One is a powerful enterprise solution, but it comes with enterprise-level complexity and costs. 
              TradeFlow offers the same core ERP features at a fraction of the cost and complexity. SAP requires months of 
              implementation; TradeFlow takes weeks. For import and distribution businesses, TradeFlow delivers faster ROI 
              with purpose-built features like landed costs, gate passes, and recovery management.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <SectionHeader
            title="Feature Comparison"
            subtitle="See how TradeFlow stacks up against SAP Business One"
          />

          <div className="max-w-4xl mx-auto mt-12">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">TradeFlow ERP</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">SAP Business One</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Multi-warehouse Inventory Management</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Sales & Invoicing</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Full Accounting & General Ledger</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Field Recovery & Collections</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="w-5 h-5 text-red-600 mx-auto" />
                    </td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Implementation Time</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">2-4 weeks</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">3-6 months</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Learning Curve</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">Low</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">High</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Pricing (relative)</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">$$$</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">$$$$$</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Support Response</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">Direct, same-day</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">Through partners</td>
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
