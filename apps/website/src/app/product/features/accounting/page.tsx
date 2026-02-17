import { Metadata } from "next";
import { FeaturePageContent } from "@/components/sections/FeaturePage";
import { AccountingMockup } from "@/components/mockups";
import { modules } from "@/data/features";

const data = modules.find((m) => m.id === "accounting")!;

export const metadata: Metadata = {
  title: "Financial & Accounting",
  description: data.tagline + ". " + data.description,
};

const relatedModules = [
  { name: "Sales & Invoicing", href: "/product/features/sales" },
  { name: "Purchase & Procurement", href: "/product/features/procurement" },
  { name: "Reports & Analytics", href: "/product/features/reports" },
];

export default function AccountingPage() {
  return (
    <FeaturePageContent
      overline={data.name}
      title={data.tagline}
      subtitle={data.description}
      painPoints={data.painPoints}
      capabilities={data.capabilities}
      metric={data.metric}
      relatedModules={relatedModules}
      mockup={<AccountingMockup />}
    />
  );
}
