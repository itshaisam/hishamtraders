import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { CTABanner } from "../layout/CTABanner";
import { Check, AlertTriangle } from "lucide-react";
import Link from "next/link";

type Capability = { title: string; description: string };
type Metric = { value: string; label: string };

type FeaturePageProps = {
  overline: string;
  title: string;
  subtitle: string;
  painPoints: string[];
  capabilities: Capability[];
  metric: Metric;
  relatedModules: { name: string; href: string }[];
  mockup?: React.ReactNode;
};

export function FeaturePageContent({
  overline,
  title,
  subtitle,
  painPoints,
  capabilities,
  metric,
  relatedModules,
  mockup,
}: FeaturePageProps) {
  return (
    <>
      {/* Hero */}
      <section className="bg-white pt-12 pb-16 lg:pt-16 lg:pb-20">
        <Container>
          <div className="max-w-3xl">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">
              {overline}
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              {title}
            </h1>
            <p className="mt-5 text-lg text-gray-600 leading-relaxed">
              {subtitle}
            </p>
            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <Button href="/signup" size="lg">Start Free Trial</Button>
              <Button href="/contact" variant="outline" size="lg">Schedule a Demo</Button>
            </div>
          </div>
        </Container>
      </section>

      {/* Module Preview */}
      {mockup && (
        <section className="bg-gray-50 py-12 lg:py-16">
          <Container>
            <div className="rounded-xl border border-gray-200 shadow-lg overflow-hidden bg-white max-w-5xl mx-auto">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-50 border-b border-gray-200">
                <div className="w-2.5 h-2.5 rounded-full bg-red-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-yellow-300" />
                <div className="w-2.5 h-2.5 rounded-full bg-green-300" />
                <div className="flex-1 mx-4">
                  <div className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400 max-w-xs">
                    app.tradeflowerp.com
                  </div>
                </div>
              </div>
              {mockup}
            </div>
          </Container>
        </section>
      )}

      {/* Pain Points */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">The problems we solve</h2>
            <p className="mt-3 text-gray-600">
              Common challenges businesses face before adopting TradeFlow ERP.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {painPoints.map((point) => (
              <div key={point} className="rounded-xl border border-gray-200 p-6 text-center">
                <div className="w-10 h-10 rounded-full bg-danger/10 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-5 w-5 text-danger" />
                </div>
                <p className="text-sm text-gray-700 leading-relaxed">{point}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Capabilities */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Capabilities</p>
            <h2 className="text-3xl font-bold text-gray-900">Key features</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {capabilities.map((cap) => (
              <div key={cap.title} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                  <Check className="h-4 w-4 text-primary-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{cap.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{cap.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Metric Highlight */}
      <section className="bg-gray-900 py-14 lg:py-16">
        <Container className="text-center">
          <p className="text-5xl sm:text-6xl font-extrabold text-white">{metric.value}</p>
          <p className="mt-3 text-lg text-gray-400">{metric.label}</p>
          <p className="mt-1 text-sm text-gray-500">reported by businesses using TradeFlow ERP</p>
        </Container>
      </section>

      {/* Related Modules */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-10">
            <h2 className="text-2xl font-bold text-gray-900">Works seamlessly with</h2>
            <p className="mt-2 text-gray-600">TradeFlow modules are fully integrated — data flows automatically between them.</p>
          </div>
          <div className="flex flex-wrap justify-center gap-3">
            {relatedModules.map((mod) => (
              <Link
                key={mod.href}
                href={mod.href}
                className="px-5 py-2.5 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-primary-200 hover:text-primary-600 transition-colors"
              >
                {mod.name}
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <CTABanner />
    </>
  );
}
