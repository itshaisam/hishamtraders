import { Metadata } from "next";
import { SolutionPageContent } from "@/components/sections/SolutionPage";
import { roleSolutions } from "@/data/solutions";

const data = roleSolutions[0];

export const metadata: Metadata = {
  title: data.metaTitle,
  description: data.metaDescription,
};

export default function BusinessOwnersPage() {
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
