import Link from "next/link";
import { Container } from "../ui/Container";
import { SectionHeader } from "../ui/SectionHeader";
import { ArrowRight, Building2, Warehouse, TrendingUp, Calculator, Route } from "lucide-react";
import { roleCards } from "@/data/metrics";

const iconMap: Record<string, React.ElementType> = {
  Building2, Warehouse, TrendingUp, Calculator, Route,
};

/* Mini dashboard thumbnails for each role */
function AdminPreview() {
  return (
    <div className="space-y-1.5">
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
    <div className="space-y-1.5">
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
    <div className="space-y-1.5">
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
    <div className="space-y-1.5">
      <div className="grid grid-cols-3 gap-1">
        <div className="h-4 rounded bg-blue-100" />
        <div className="h-4 rounded bg-red-100" />
        <div className="h-4 rounded bg-green-100" />
      </div>
      <div className="space-y-0.5">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex gap-1">
            <div className="flex-1 h-1.5 bg-gray-100 rounded" />
            <div className="w-6 h-1.5 bg-blue-100 rounded" />
            <div className="w-6 h-1.5 bg-green-100 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function RecoveryPreview() {
  return (
    <div className="space-y-1.5">
      <div className="grid grid-cols-2 gap-1">
        <div className="h-4 rounded bg-blue-100 flex items-center justify-center">
          <span className="text-[7px] font-bold text-blue-600">6.8M</span>
        </div>
        <div className="h-4 rounded bg-green-100 flex items-center justify-center">
          <span className="text-[7px] font-bold text-green-600">245K</span>
        </div>
      </div>
      <div className="space-y-1">
        {[75, 60, 45, 30].map((w, i) => (
          <div key={i} className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full bg-purple-400 rounded-full" style={{ width: `${w}%` }} />
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

export function RoleCards() {
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <Container>
        <SectionHeader
          overline="Built for every role"
          title="Tailored for your entire team"
          subtitle="Each role gets a custom dashboard and tools designed specifically for their workflow."
        />

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5">
          {roleCards.map((role) => {
            const Icon = iconMap[role.icon] || Building2;
            const Preview = previewMap[role.title];
            return (
              <Link
                key={role.title}
                href={role.href}
                className="group rounded-xl border border-gray-200 bg-white p-5 hover:border-primary-200 hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
              >
                {/* Mini Dashboard Preview */}
                {Preview && (
                  <div className="mb-4 p-2.5 rounded-lg bg-gray-50 border border-gray-100 h-20 overflow-hidden">
                    <Preview />
                  </div>
                )}

                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-3 group-hover:bg-primary-100 transition-colors">
                  <Icon className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5">
                  {role.title}
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                  {role.description}
                </p>
                <span className="inline-flex items-center text-xs font-medium text-primary-600">
                  Learn more
                  <ArrowRight className="ml-1 h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </span>
              </Link>
            );
          })}
        </div>
      </Container>
    </section>
  );
}
