"use client";

import Link from "next/link";
import { Container } from "../ui/Container";
import { SectionHeader } from "../ui/SectionHeader";
import { ArrowRight } from "lucide-react";
import {
  AdminIcon,
  WarehouseIcon,
  TrendingUpIcon,
  AccountingIcon,
  RecoveryIcon,
} from "../ui/Icons";
import { roleCards } from "@/data/metrics";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

const iconMap: Record<string, React.ElementType> = {
  Building2: AdminIcon,
  Warehouse: WarehouseIcon,
  TrendingUp: TrendingUpIcon,
  Calculator: AccountingIcon,
  Route: RecoveryIcon,
};

// Simple preview components
function AdminPreview() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1">
        <div className="h-4 rounded bg-blue-100" />
        <div className="h-4 rounded bg-green-100" />
        <div className="h-4 rounded bg-purple-100" />
      </div>
      <div className="flex items-end gap-0.5 h-8">
        {[40, 65, 55, 70, 60, 80].map((h, i) => (
          <div key={i} className="flex-1 bg-blue-200 rounded-t" style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

function WarehousePreview() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1">
        <div className="h-4 rounded bg-orange-100 flex items-center justify-center">
          <span className="text-[7px] font-bold text-orange-600">12</span>
        </div>
        <div className="h-4 rounded bg-red-100 flex items-center justify-center">
          <span className="text-[7px] font-bold text-red-600">3</span>
        </div>
      </div>
      <div className="space-y-1">
        {[85, 60, 35].map((w, i) => (
          <div key={i} className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-blue-400 rounded-full" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function SalesPreview() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1">
        <div className="h-4 rounded bg-green-100 flex items-center justify-center">
          <span className="text-[7px] font-bold text-green-600">485K</span>
        </div>
        <div className="h-4 rounded bg-blue-100 flex items-center justify-center">
          <span className="text-[7px] font-bold text-blue-600">82%</span>
        </div>
      </div>
      <div className="space-y-1">
        {[90, 70, 55, 40].map((w, i) => (
          <div key={i} className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-green-400 rounded-full" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountantPreview() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-3 gap-1">
        <div className="h-4 rounded bg-violet-100" />
        <div className="h-4 rounded bg-purple-100" />
        <div className="h-4 rounded bg-fuchsia-100" />
      </div>
      <div className="space-y-0.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded" />
            <div className="w-6 h-1.5 bg-violet-100 rounded" />
            <div className="w-6 h-1.5 bg-green-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecoveryPreview() {
  return (
    <div className="space-y-2">
      <div className="grid grid-cols-2 gap-1">
        <div className="h-4 rounded bg-rose-100 flex items-center justify-center">
          <span className="text-[7px] font-bold text-rose-600">6.8M</span>
        </div>
        <div className="h-4 rounded bg-green-100 flex items-center justify-center">
          <span className="text-[7px] font-bold text-green-600">245K</span>
        </div>
      </div>
      <div className="space-y-1">
        {[75, 60, 45, 30].map((w, i) => (
          <div key={i} className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-rose-400 rounded-full" style={{ width: `${w}%` }} />
          </div>
        ))}
      </div>
    </div>
  );
}

const previewMap: Record<string, React.FC> = {
  "Business Owners": AdminPreview,
  "Warehouse Managers": WarehousePreview,
  "Sales Teams": SalesPreview,
  "Accountants": AccountantPreview,
  "Recovery Agents": RecoveryPreview,
};

const roleStyles: Record<string, { bg: string; text: string; border: string; glow: string }> = {
  "Business Owners": { bg: "bg-blue-50", text: "text-blue-600", border: "hover:border-blue-300", glow: "hover:shadow-blue-500/20" },
  "Warehouse Managers": { bg: "bg-orange-50", text: "text-orange-600", border: "hover:border-orange-300", glow: "hover:shadow-orange-500/20" },
  "Sales Teams": { bg: "bg-green-50", text: "text-green-600", border: "hover:border-green-300", glow: "hover:shadow-green-500/20" },
  "Accountants": { bg: "bg-violet-50", text: "text-violet-600", border: "hover:border-violet-300", glow: "hover:shadow-violet-500/20" },
  "Recovery Agents": { bg: "bg-rose-50", text: "text-rose-600", border: "hover:border-rose-300", glow: "hover:shadow-rose-500/20" },
};

export function RoleCards() {
  const { ref: containerRef, isVisible } = useScrollAnimation(0.15);

  return (
    <section className="py-20 lg:py-28 bg-gray-50 relative overflow-hidden">
      <Container>
        <SectionHeader
          overline="Built for every role"
          title="Tailored for your entire team"
          subtitle="Each role gets a custom dashboard and tools designed specifically for their workflow."
        />

        <div ref={containerRef} className="relative">
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
            {roleCards.map((role, index) => {
              const Icon = iconMap[role.icon] || Building2;
              const Preview = previewMap[role.title];
              const styles = roleStyles[role.title];

              return (
                <Link
                  key={role.title}
                  href={role.href}
                  className={`
                    group block rounded-xl border border-gray-200 bg-white p-5 
                    hover:border-gray-300 hover:shadow-lg hover:-translate-y-1
                    transition-all duration-300
                    ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                  `}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {/* Preview */}
                  {Preview && (
                    <div className="mb-4 p-3 rounded-lg bg-gray-50 border border-gray-100 h-24 overflow-hidden group-hover:bg-white transition-colors">
                      <Preview />
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl ${styles.bg} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className={`h-6 w-6 ${styles.text}`} />
                  </div>

                  {/* Title */}
                  <h3 className="text-base font-semibold text-gray-900 mb-2">
                    {role.title}
                  </h3>

                  {/* Description */}
                  <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
                    {role.description}
                  </p>

                  {/* CTA */}
                  <span className={`inline-flex items-center text-sm font-medium ${styles.text} group-hover:underline`}>
                    View role details
                    <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </Container>
    </section>
  );
}
