import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CTABanner } from "@/components/layout/CTABanner";
import { ArrowRight, Warehouse, ShoppingCart, Receipt, Calculator, Route, BarChart3, Shield } from "lucide-react";
import { modules } from "@/data/features";

export const metadata: Metadata = {
  title: "Features",
  description: "Explore all TradeFlow ERP modules — inventory, procurement, sales, accounting, recovery, reports, and administration.",
};

const iconMap: Record<string, React.ElementType> = {
  Warehouse, ShoppingCart, Receipt, Calculator, Route, BarChart3, Shield,
};

export default function FeaturesPage() {
  return (
    <>
      <section className="bg-white pt-12 pb-16 lg:pt-16 lg:pb-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Features</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Everything your business needs, in one platform
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              Seven fully integrated modules covering the complete business cycle — from procurement to accounting to field recovery.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <div className="space-y-6">
            {modules.map((mod) => {
              const Icon = iconMap[mod.icon] || Warehouse;
              return (
                <Link
                  key={mod.id}
                  href={mod.href}
                  className="group block rounded-xl border border-gray-200 bg-white p-6 lg:p-8 hover:border-primary-200 hover:shadow-md transition-all"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="w-12 h-12 rounded-xl bg-primary-50 flex items-center justify-center shrink-0 group-hover:bg-primary-100 transition-colors">
                      <Icon className="h-6 w-6 text-primary-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h2 className="text-lg font-bold text-gray-900">{mod.name}</h2>
                        <span className="hidden sm:inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-50 text-primary-700">
                          {mod.metric.value} {mod.metric.label}
                        </span>
                      </div>
                      <p className="text-gray-600">{mod.description}</p>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-primary-600 group-hover:translate-x-1 transition-all shrink-0 hidden lg:block" />
                  </div>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>

      <CTABanner />
    </>
  );
}
