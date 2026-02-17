import Link from "next/link";
import { Container } from "../ui/Container";
import { SectionHeader } from "../ui/SectionHeader";
import { ArrowRight, Warehouse, ShoppingCart, Receipt, Calculator, Route, BarChart3, Shield } from "lucide-react";
import { modules } from "@/data/features";

const iconMap: Record<string, React.ElementType> = {
  Warehouse, ShoppingCart, Receipt, Calculator, Route, BarChart3, Shield,
};

const colorMap: Record<string, { bg: string; icon: string; badge: string }> = {
  Warehouse: { bg: "bg-blue-50 group-hover:bg-blue-100", icon: "text-blue-600", badge: "bg-blue-50 text-blue-700" },
  ShoppingCart: { bg: "bg-green-50 group-hover:bg-green-100", icon: "text-green-600", badge: "bg-green-50 text-green-700" },
  Receipt: { bg: "bg-purple-50 group-hover:bg-purple-100", icon: "text-purple-600", badge: "bg-purple-50 text-purple-700" },
  Calculator: { bg: "bg-orange-50 group-hover:bg-orange-100", icon: "text-orange-600", badge: "bg-orange-50 text-orange-700" },
  Route: { bg: "bg-red-50 group-hover:bg-red-100", icon: "text-red-600", badge: "bg-red-50 text-red-700" },
  BarChart3: { bg: "bg-indigo-50 group-hover:bg-indigo-100", icon: "text-indigo-600", badge: "bg-indigo-50 text-indigo-700" },
  Shield: { bg: "bg-gray-100 group-hover:bg-gray-200", icon: "text-gray-700", badge: "bg-gray-100 text-gray-700" },
};

const defaultColor = { bg: "bg-primary-50 group-hover:bg-primary-100", icon: "text-primary-600", badge: "bg-primary-50 text-primary-700" };

export function FeatureGrid() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <Container>
        <SectionHeader
          overline="Modules"
          title="Everything you need to run your business"
          subtitle="Seven integrated modules covering the complete business cycle — from procurement to accounting to recovery."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {modules.map((module) => {
            const Icon = iconMap[module.icon] || Warehouse;
            const colors = colorMap[module.icon] || defaultColor;
            return (
              <Link
                key={module.id}
                href={module.href}
                className="group relative rounded-xl border border-gray-200 p-6 hover:border-primary-200 hover:shadow-lg hover:-translate-y-1 transition-all duration-200"
              >
                <div className={`w-11 h-11 rounded-lg ${colors.bg} flex items-center justify-center mb-4 transition-colors`}>
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">
                  {module.name}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed mb-4">
                  {module.description.slice(0, 120)}...
                </p>
                {module.metric && (
                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full ${colors.badge} mb-3`}>
                    <span>{module.metric.value}</span>
                    <span className="font-normal">{module.metric.label}</span>
                  </div>
                )}
                <div className="block">
                  <span className="inline-flex items-center text-sm font-medium text-primary-600 group-hover:gap-2 transition-all">
                    Learn more
                    <ArrowRight className="ml-1 h-4 w-4 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
