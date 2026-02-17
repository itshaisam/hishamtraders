import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { CTABanner } from "../layout/CTABanner";
import { Check } from "lucide-react";
import Link from "next/link";

type SolutionPageProps = {
  overline: string;
  title: string;
  subtitle: string;
  benefits: { title: string; description: string }[];
  keyModules: { name: string; href: string; description: string }[];
  stats?: { value: string; label: string }[];
};

export function SolutionPageContent({
  overline,
  title,
  subtitle,
  benefits,
  keyModules,
  stats,
}: SolutionPageProps) {
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

      {/* Benefits */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">How TradeFlow helps</h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((b) => (
              <div key={b.title} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center mb-4">
                  <Check className="h-4 w-4 text-primary-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{b.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{b.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Stats */}
      {stats && stats.length > 0 && (
        <section className="bg-gray-900 py-14">
          <Container>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-4xl font-extrabold text-white">{s.value}</p>
                  <p className="mt-2 text-sm text-gray-400">{s.label}</p>
                </div>
              ))}
            </div>
          </Container>
        </section>
      )}

      {/* Key Modules */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Key modules for you</h2>
            <p className="mt-3 text-gray-600">The TradeFlow modules most relevant to your needs.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-4xl mx-auto">
            {keyModules.map((mod) => (
              <Link key={mod.href} href={mod.href} className="group rounded-xl border border-gray-200 p-5 hover:border-primary-200 hover:shadow-md transition-all">
                <h3 className="text-sm font-semibold text-gray-900 mb-1.5 group-hover:text-primary-600 transition-colors">{mod.name}</h3>
                <p className="text-xs text-gray-600 leading-relaxed">{mod.description}</p>
              </Link>
            ))}
          </div>
        </Container>
      </section>

      <CTABanner />
    </>
  );
}
