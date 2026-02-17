import { Metadata } from "next";
import { SolutionPageContent } from "@/components/sections/SolutionPage";
import { industrySolutions } from "@/data/solutions";

const data = industrySolutions[1];

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.metaDescription,
};

export default function BuildingMaterialsPage() {
  return (
    <SolutionPageContent
      overline={data.overline}
      title={data.title}
      subtitle={data.subtitle}
      benefits={data.benefits}
      keyModules={data.keyModules}
      stats={data.stats}
    />
  );
}
