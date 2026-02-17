import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CTABanner } from "@/components/layout/CTABanner";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "TradeFlow ERP vs Tally - Feature Comparison",
  description: "Compare TradeFlow ERP and Tally for import and distribution businesses. Modern cloud ERP vs traditional accounting software.",
};

export default function CompareTallyPage() {
  return (
    <>
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              TradeFlow ERP vs Tally
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Tally excels at accounting and statutory compliance, but it wasn't built for multi-warehouse operations, 
              sales recovery, or modern cloud access. TradeFlow provides comprehensive inventory management, field recovery 
              tools, real-time cloud access from anywhere, and full accounting—all in one integrated platform. Move beyond 
              desktop-only software to a modern, collaborative ERP system.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <SectionHeader
            title="Feature Comparison"
            subtitle="See how TradeFlow stacks up against Tally"
          />

          <div className="max-w-4xl mx-auto mt-12">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">TradeFlow ERP</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Tally</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Accounting & GST Compliance</td>
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
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Limited</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Cloud Access</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Add-on required</td>
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
                    <td className="px-6 py-4 text-sm text-gray-900">Gate Pass Management</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center">
                      <X className="w-5 h-5 text-red-600 mx-auto" />
                    </td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Mobile App</td>
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
                    <td className="px-6 py-4 text-center text-sm text-gray-900">Medium</td>
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
