import { Metadata } from "next";
import { FeaturePageContent } from "@/components/sections/FeaturePage";
import { ReportsMockup } from "@/components/mockups";
import { modules } from "@/data/features";

const data = modules.find((m) => m.id === "reports")!;

export const metadata: Metadata = {
  title: "Reports & Analytics",
  description: data.tagline + ". " + data.description,
};

const relatedModules = [
  { name: "Inventory & Warehouse", href: "/product/features/inventory" },
  { name: "Sales & Invoicing", href: "/product/features/sales" },
  { name: "Financial & Accounting", href: "/product/features/accounting" },
  { name: "Recovery & Collections", href: "/product/features/recovery" },
];

export default function ReportsPage() {
  return (
    <FeaturePageContent
      overline={data.name}
      title={data.tagline}
      subtitle={data.description}
      painPoints={data.painPoints}
      capabilities={data.capabilities}
      metric={data.metric}
      relatedModules={relatedModules}
      mockup={<ReportsMockup />}
    />
  );
}
