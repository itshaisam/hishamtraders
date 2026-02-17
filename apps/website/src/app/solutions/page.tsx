import { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/ui/Container";
import { CTABanner } from "@/components/layout/CTABanner";
import { ArrowRight } from "lucide-react";
import { roleSolutions, industrySolutions, sizeSolutions } from "@/data/solutions";

export const metadata: Metadata = {
  title: "Solutions",
  description:
    "Explore tailored ERP solutions for your role, industry, and business size. From business owners to warehouse managers, from import distribution to FMCG.",
};

function SolutionGrid({
  solutions,
  basePath,
}: {
  solutions: { slug: string; overline: string; title: string; subtitle: string }[];
  basePath: string;
}) {
  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {solutions.map((s) => (
        <Link
          key={s.slug}
          href={`${basePath}/${s.slug}`}
          className="group rounded-xl border border-gray-200 bg-white p-6 hover:border-primary-200 hover:shadow-md transition-all"
        >
          <p className="text-xs font-semibold text-primary-600 uppercase tracking-wider mb-2">
            {s.overline}
          </p>
          <h3 className="text-base font-semibold text-gray-900 mb-2 group-hover:text-primary-600 transition-colors">
            {s.title}
          </h3>
          <p className="text-sm text-gray-600 leading-relaxed mb-4 line-clamp-2">
            {s.subtitle}
          </p>
          <span className="inline-flex items-center text-sm font-medium text-primary-600 group-hover:gap-2 transition-all">
            Learn more <ArrowRight className="h-4 w-4 ml-1" />
          </span>
        </Link>
      ))}
    </div>
  );
}

export default function SolutionsPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white pt-12 pb-16 lg:pt-16 lg:pb-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">
              Solutions
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Built for how you work
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              Whether you&apos;re a business owner, warehouse manager, or
              accountant — TradeFlow adapts to your role, industry, and scale.
            </p>
          </div>
        </Container>
      </section>

      {/* By Role */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl font-bold text-gray-900">By Role</h2>
            <p className="mt-3 text-gray-600">
              Tailored workflows and dashboards for every team member.
            </p>
          </div>
          <SolutionGrid solutions={roleSolutions} basePath="/solutions" />
        </Container>
      </section>

      {/* By Industry */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl font-bold text-gray-900">By Industry</h2>
            <p className="mt-3 text-gray-600">
              Industry-specific features and pre-configured workflows.
            </p>
          </div>
          <SolutionGrid solutions={industrySolutions} basePath="/solutions" />
        </Container>
      </section>

      {/* By Size */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <div className="max-w-3xl mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              By Business Size
            </h2>
            <p className="mt-3 text-gray-600">
              Scalable plans that grow with your business.
            </p>
          </div>
          <SolutionGrid solutions={sizeSolutions} basePath="/solutions" />
        </Container>
      </section>

      <CTABanner />
    </>
  );
}
