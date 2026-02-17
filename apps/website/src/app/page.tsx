import { Hero } from "@/components/sections/Hero";
import { SocialProof } from "@/components/sections/SocialProof";
import { FeatureGrid } from "@/components/sections/FeatureGrid";
import { FeatureShowcase } from "@/components/sections/FeatureShowcase";
import { MetricsBar } from "@/components/sections/MetricsBar";
import { TestimonialsSection } from "@/components/sections/TestimonialsSection";
import { RoleCards } from "@/components/sections/RoleCards";
import { ComparisonTable } from "@/components/sections/ComparisonTable";
import { FAQSection } from "@/components/sections/FAQSection";
import { CTABanner } from "@/components/layout/CTABanner";
import { homeFaqs } from "@/data/faqs";

export default function HomePage() {
  return (
    <>
      <Hero />
      <SocialProof />
      <FeatureGrid />
      <FeatureShowcase />
      <MetricsBar />
      <TestimonialsSection />
      <RoleCards />
      <ComparisonTable />
      <FAQSection items={homeFaqs} />
      <CTABanner />
    </>
  );
}
