import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CTABanner } from "@/components/layout/CTABanner";
import { Plug, FileSpreadsheet, CreditCard, Mail, Globe, Database } from "lucide-react";

export const metadata: Metadata = {
  title: "Integrations",
  description: "TradeFlow ERP integrations — RESTful API, Excel/CSV export, payment gateways, and more.",
};

const integrations = [
  { icon: Globe, title: "RESTful API", description: "Full API access to all modules. Build custom integrations, automate workflows, and connect to your existing tools." },
  { icon: FileSpreadsheet, title: "Excel & CSV Export", description: "Export any report, table, or dataset to Excel or CSV format with one click for further analysis." },
  { icon: CreditCard, title: "Payment Gateways", description: "Track bank transfers and cheque payments. Ready for integration with popular payment processors." },
  { icon: Mail, title: "Email Notifications", description: "Automated email alerts for overdue payments, low stock, expiry warnings, and system events." },
  { icon: Database, title: "Data Import", description: "Bulk import products, clients, suppliers, and opening balances from Excel/CSV files during onboarding." },
  { icon: Plug, title: "Custom Integrations", description: "Our team can build custom integrations to connect TradeFlow with your accounting software, e-commerce platform, or any third-party system." },
];

export default function IntegrationsPage() {
  return (
    <>
      <section className="bg-white pt-12 pb-16 lg:pt-16 lg:pb-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Integrations</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Connect TradeFlow with your tools
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              TradeFlow ERP is built on a modern RESTful API architecture, making it easy to integrate with your existing business tools and workflows.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {integrations.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTABanner />
    </>
  );
}
