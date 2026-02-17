import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { MetricsBar } from "@/components/sections/MetricsBar";
import { CTABanner } from "@/components/layout/CTABanner";
import { ArrowRight, Check, Warehouse, ShoppingCart, Receipt, Calculator, Route, BarChart3, Shield, Smartphone, Lock, Plug } from "lucide-react";
import { modules } from "@/data/features";

export const metadata: Metadata = {
  title: "Product Overview",
  description: "TradeFlow ERP — a complete enterprise resource planning platform for import, distribution, and trading businesses.",
};

const iconMap: Record<string, React.ElementType> = {
  Warehouse, ShoppingCart, Receipt, Calculator, Route, BarChart3, Shield,
};

const platformFeatures = [
  { icon: Smartphone, title: "Mobile-Ready", description: "Access your ERP from any device. Responsive design works on desktops, tablets, and smartphones.", href: "/product/mobile" },
  { icon: Lock, title: "Enterprise Security", description: "Role-based access, complete audit trail, 256-bit encryption, and 99.9% uptime guarantee.", href: "/product/security" },
  { icon: Plug, title: "Integrations", description: "RESTful API architecture for seamless integration with your existing tools and workflows.", href: "/product/integrations" },
];

const highlights = [
  "7 fully integrated modules",
  "5 role-based dashboards",
  "100+ built-in reports",
  "Multi-warehouse support",
  "Double-entry accounting",
  "Field recovery management",
  "Batch & expiry tracking",
  "Complete audit trail",
];

export default function ProductPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white pt-12 pb-16 lg:pt-16 lg:pb-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Product</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              One platform for your entire business
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              TradeFlow ERP unifies inventory, procurement, sales, accounting, and collections into a single integrated platform — eliminating data silos and manual processes.
            </p>
            <div className="mt-8 flex flex-col sm:flex-row justify-center gap-4">
              <Button href="/signup" size="lg">Start Free Trial</Button>
              <Button href="/contact" variant="outline" size="lg">Schedule a Demo</Button>
            </div>
          </div>

          {/* Highlights Grid */}
          <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto">
            {highlights.map((h) => (
              <div key={h} className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                  <Check className="h-3 w-3 text-primary-600" />
                </div>
                <span className="text-sm text-gray-700">{h}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Modules */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <SectionHeader
            overline="Modules"
            title="Seven integrated modules"
            subtitle="Each module works independently and together, sharing data seamlessly across your organization."
          />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {modules.map((mod) => {
              const Icon = iconMap[mod.icon] || Warehouse;
              return (
                <Link key={mod.id} href={mod.href} className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-primary-200 hover:shadow-md transition-all">
                  <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
                    <Icon className="h-5 w-5 text-primary-600" />
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 mb-1.5">{mod.name}</h3>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{mod.tagline}</p>
                  <span className="text-xs font-semibold text-primary-600">{mod.metric.value} {mod.metric.label} &rarr;</span>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      <MetricsBar />

      {/* Platform Features */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <SectionHeader
            overline="Platform"
            title="Built for the enterprise"
            subtitle="Security, mobility, and extensibility are built into every layer of TradeFlow ERP."
          />
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {platformFeatures.map((pf) => (
              <Link key={pf.title} href={pf.href} className="group rounded-xl border border-gray-200 p-6 hover:border-primary-200 hover:shadow-md transition-all text-center">
                <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center mx-auto mb-4 group-hover:bg-primary-100 transition-colors">
                  <pf.icon className="h-6 w-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{pf.title}</h3>
                <p className="text-sm text-gray-600">{pf.description}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <CTABanner />
    </>
  );
}
