import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { CTABanner } from "@/components/layout/CTABanner";
import { Check, X } from "lucide-react";

export const metadata: Metadata = {
  title: "TradeFlow ERP vs Odoo - Feature Comparison",
  description: "Compare TradeFlow ERP and Odoo for import and distribution businesses. Purpose-built features vs modular customization.",
};

export default function CompareOdooPage() {
  return (
    <>
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <Container>
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              TradeFlow ERP vs Odoo
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed">
              Both TradeFlow and Odoo are modular ERP systems, but TradeFlow is purpose-built for import and distribution 
              businesses. While Odoo requires extensive customization to handle landed costs, recovery management, and gate 
              passes, TradeFlow includes these features out of the box. Get started faster with less configuration and fewer 
              third-party modules.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <SectionHeader
            title="Feature Comparison"
            subtitle="See how TradeFlow stacks up against Odoo"
          />

          <div className="max-w-4xl mx-auto mt-12">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse bg-white shadow-lg rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Feature</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">TradeFlow ERP</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-900">Odoo</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Inventory Management</td>
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
                    <td className="px-6 py-4 text-sm text-gray-900">Landed Cost Calculation</td>
                    <td className="px-6 py-4 text-center">
                      <Check className="w-5 h-5 text-green-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">Module required</td>
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
                    <td className="px-6 py-4 text-sm text-gray-900">Implementation Time</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">2-4 weeks</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">1-3 months</td>
                  </tr>
                  <tr>
                    <td className="px-6 py-4 text-sm text-gray-900">Learning Curve</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">Low</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">Medium</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">Pricing (relative)</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">$$$</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-900">$$$ + modules</td>
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
