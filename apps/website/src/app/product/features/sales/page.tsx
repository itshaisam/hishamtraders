import { Metadata } from "next";
import { FeaturePageContent } from "@/components/sections/FeaturePage";
import { SalesMockup } from "@/components/mockups";
import { modules } from "@/data/features";

const data = modules.find((m) => m.id === "sales")!;

export const metadata: Metadata = {
  title: "Sales & Invoicing",
  description: data.tagline + ". " + data.description,
};

const relatedModules = [
  { name: "Inventory & Warehouse", href: "/product/features/inventory" },
  { name: "Financial & Accounting", href: "/product/features/accounting" },
  { name: "Recovery & Collections", href: "/product/features/recovery" },
  { name: "Reports & Analytics", href: "/product/features/reports" },
];

export default function SalesPage() {
  return (
    <FeaturePageContent
      overline={data.name}
      title={data.tagline}
      subtitle={data.description}
      painPoints={data.painPoints}
      capabilities={data.capabilities}
      metric={data.metric}
      relatedModules={relatedModules}
      mockup={<SalesMockup />}
    />
  );
}
