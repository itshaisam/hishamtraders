import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CTABanner } from "@/components/layout/CTABanner";
import { Smartphone, Wifi, LayoutDashboard, Bell, FileSpreadsheet, MapPin } from "lucide-react";

export const metadata: Metadata = {
  title: "Mobile Access",
  description: "Access TradeFlow ERP from any device. Fully responsive design for desktops, tablets, and smartphones.",
};

const features = [
  { icon: Smartphone, title: "Fully Responsive", description: "Every page and feature works seamlessly on desktops, tablets, and smartphones — no separate mobile app needed." },
  { icon: LayoutDashboard, title: "Role-Based Dashboards", description: "Each user role gets a dashboard optimized for their device. Recovery agents see field-first views on mobile." },
  { icon: Bell, title: "Real-Time Notifications", description: "Get alerts for low stock, overdue payments, broken promises, and credit limit breaches on any device." },
  { icon: FileSpreadsheet, title: "Mobile Invoicing", description: "Sales teams can create and send invoices from the field — with automatic stock checks and tax calculation." },
  { icon: MapPin, title: "Field Recovery", description: "Recovery agents log visits, record payments, and track promises from their phone with GPS location capture." },
  { icon: Wifi, title: "Lightweight & Fast", description: "Optimized for mobile networks. TanStack Query caching ensures fast load times even on slower connections." },
];

export default function MobilePage() {
  return (
    <>
      <section className="bg-white pt-12 pb-16 lg:pt-16 lg:pb-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Mobile</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Your ERP, anywhere you work
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              TradeFlow ERP is fully responsive — access every feature from your desktop, tablet, or smartphone without installing any apps.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f) => (
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
