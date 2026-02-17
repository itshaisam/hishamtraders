import { Metadata } from "next";
import { FeaturePageContent } from "@/components/sections/FeaturePage";
import { InventoryMockup } from "@/components/mockups";
import { modules } from "@/data/features";

const data = modules.find((m) => m.id === "inventory")!;

export const metadata: Metadata = {
  title: "Inventory & Warehouse Management",
  description: data.tagline + ". " + data.description,
};

const relatedModules = [
  { name: "Purchase & Procurement", href: "/product/features/procurement" },
  { name: "Sales & Invoicing", href: "/product/features/sales" },
  { name: "Reports & Analytics", href: "/product/features/reports" },
  { name: "Administration", href: "/product/features/administration" },
];

export default function InventoryPage() {
  return (
    <FeaturePageContent
      overline={data.name}
      title={data.tagline}
      subtitle={data.description}
      painPoints={data.painPoints}
      capabilities={data.capabilities}
      metric={data.metric}
      relatedModules={relatedModules}
      mockup={<InventoryMockup />}
    />
  );
}
