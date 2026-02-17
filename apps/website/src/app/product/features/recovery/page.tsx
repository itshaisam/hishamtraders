import { Metadata } from "next";
import { FeaturePageContent } from "@/components/sections/FeaturePage";
import { RecoveryMockup } from "@/components/mockups";
import { modules } from "@/data/features";

const data = modules.find((m) => m.id === "recovery")!;

export const metadata: Metadata = {
  title: "Recovery & Collections",
  description: data.tagline + ". " + data.description,
};

const relatedModules = [
  { name: "Sales & Invoicing", href: "/product/features/sales" },
  { name: "Financial & Accounting", href: "/product/features/accounting" },
  { name: "Reports & Analytics", href: "/product/features/reports" },
];

export default function RecoveryPage() {
  return (
    <FeaturePageContent
      overline={data.name}
      title={data.tagline}
      subtitle={data.description}
      painPoints={data.painPoints}
      capabilities={data.capabilities}
      metric={data.metric}
      relatedModules={relatedModules}
      mockup={<RecoveryMockup />}
    />
  );
}
