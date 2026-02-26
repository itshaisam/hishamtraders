"use client";

import { useState, useEffect } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FAQSection } from "@/components/sections/FAQSection";
import { Check, X, Sparkles, Zap, Building2 } from "lucide-react";
import { plans, comparisonCategories } from "@/data/pricing";
import { pricingFaqs } from "@/data/faqs";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

const icons = [Sparkles, Zap, Building2];

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setIsLoaded(true);
  }, []);

  const { ref: cardsRef, isVisible: cardsVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.1
  });

  return (
    <>
      {/* Hero */}
      <section className="relative bg-gradient-to-b from-white to-gray-50/50 pt-16 pb-20 lg:pt-20 lg:pb-24 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-100/40 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-violet-100/30 rounded-full blur-3xl" />
        </div>

        <Container className="relative z-10">
          <div className={`max-w-3xl mx-auto text-center transition-all duration-700 ${isLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Pricing</p>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight">
              Simple, transparent{" "}
              <span className="text-gradient">pricing</span>
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              Start free for 14 days. No credit card required. Choose the plan that fits your business.
            </p>

            {/* Toggle */}
            <div className="mt-8 inline-flex items-center gap-3 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200">
              <button
                onClick={() => setAnnual(false)}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  !annual 
                    ? "bg-gray-900 text-white shadow-md" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                  annual 
                    ? "bg-gray-900 text-white shadow-md" 
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Annual
                <span className="ml-2 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                  Save 20%
                </span>
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* Pricing Cards */}
      <section className="pb-20 lg:pb-28 bg-gradient-to-b from-gray-50/50 to-white">
        <Container>
          <div ref={cardsRef} className="grid md:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
            {plans.map((plan, index) => {
              const Icon = icons[index] || Sparkles;
              return (
                <div
                  key={plan.name}
                  className={`
                    relative rounded-2xl p-6 lg:p-8 flex flex-col
                    transition-all duration-500 ease-out
                    ${plan.highlighted
                      ? "bg-gradient-to-b from-white to-blue-50/30 border-2 border-blue-500 shadow-xl shadow-blue-500/10 scale-105 z-10"
                      : "bg-white border border-gray-200/80 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-900/5 hover:-translate-y-1"
                    }
                    ${cardsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
                  `}
                  style={{ transitionDelay: `${index * 100}ms` }}
                >
                  {plan.highlighted && (
                    <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                      <span className="bg-gradient-to-r from-blue-600 to-blue-500 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg shadow-blue-500/25 flex items-center gap-1.5">
                        <Sparkles className="w-3 h-3" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`
                    w-12 h-12 rounded-xl flex items-center justify-center mb-4
                    ${plan.highlighted 
                      ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25" 
                      : "bg-gray-100 text-gray-600"
                    }
                  `}>
                    <Icon className="w-5 h-5" />
                  </div>

                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <p className="text-sm text-gray-600 mt-2 leading-relaxed">{plan.description}</p>

                  <div className="mt-6 mb-6">
                    {plan.monthlyPrice ? (
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-extrabold text-gray-900 tracking-tight">
                          ${annual ? plan.annualPrice : plan.monthlyPrice}
                        </span>
                        <span className="text-gray-500 text-sm font-medium">/user/month</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-5xl font-extrabold text-gray-900 tracking-tight">Custom</span>
                        <p className="text-sm text-gray-500 mt-2">Contact us for a quote</p>
                      </div>
                    )}
                  </div>

                  <Button
                    href={plan.name === "Enterprise" ? "/contact" : "/signup"}
                    variant={plan.highlighted ? "primary" : "outline"}
                    size="lg"
                    className="w-full justify-center mb-6 group"
                  >
                    {plan.cta}
                    {!plan.highlighted && (
                      <svg className="ml-2 w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                      </svg>
                    )}
                  </Button>

                  <ul className="space-y-3 flex-1">
                    {plan.features.map((feature, i) => (
                      <li key={feature} className="flex items-start gap-3">
                        <div className={`
                          w-5 h-5 rounded-full flex items-center justify-center mt-0.5 shrink-0
                          ${plan.highlighted ? "bg-blue-100" : "bg-emerald-100"}
                        `}>
                          <Check className={`h-3 w-3 ${plan.highlighted ? "text-blue-600" : "text-emerald-600"}`} />
                        </div>
                        <span className="text-sm text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* Comparison Table */}
      <section className="py-20 lg:py-28 bg-gray-50 relative">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent" />
        </div>
        
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Compare plans in detail</h2>
            <p className="mt-3 text-gray-600 text-lg">See exactly what&apos;s included in each plan.</p>
          </div>

          <div className="max-w-4xl mx-auto rounded-2xl border border-gray-200 bg-white overflow-hidden shadow-sm">
            {/* Header */}
            <div className="grid grid-cols-4 bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
              <div className="px-5 py-4 text-sm font-semibold text-gray-700">Feature</div>
              <div className="px-5 py-4 text-sm font-semibold text-gray-700 text-center">Starter</div>
              <div className="px-5 py-4 text-sm font-bold text-blue-600 text-center bg-blue-50/50">Professional</div>
              <div className="px-5 py-4 text-sm font-semibold text-gray-700 text-center">Enterprise</div>
            </div>

            {comparisonCategories.map((cat, catIndex) => (
              <div key={cat.name}>
                <div className="px-5 py-3 bg-gray-50/80 border-b border-gray-200">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">{cat.name}</p>
                </div>
                {cat.features.map((f, i) => (
                  <div
                    key={f.name}
                    className={`grid grid-cols-4 transition-colors hover:bg-gray-50/50 ${i < cat.features.length - 1 ? "border-b border-gray-100" : "border-b border-gray-200"}`}
                  >
                    <div className="px-5 py-3.5 text-sm text-gray-700 font-medium">{f.name}</div>
                    {[f.starter, f.professional, f.enterprise].map((has, j) => (
                      <div key={j} className={`px-5 py-3.5 flex justify-center ${j === 1 ? "bg-blue-50/20" : ""}`}>
                        {has ? (
                          <div className={`
                            w-6 h-6 rounded-full flex items-center justify-center
                            ${j === 1 ? "bg-blue-100" : "bg-emerald-100"}
                          `}>
                            <Check className={`h-3.5 w-3.5 ${j === 1 ? "text-blue-600" : "text-emerald-600"}`} />
                          </div>
                        ) : (
                          <X className="h-5 w-5 text-gray-200" />
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            ))}
          </div>
        </Container>
      </section>

      <FAQSection items={pricingFaqs} title="Pricing FAQ" subtitle="Common questions about our plans and billing." />

      {/* Enterprise CTA */}
      <section className="relative bg-gray-900 py-20 lg:py-28 overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl" />
          <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
        </div>

        <Container className="relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 mb-6">
              <Building2 className="w-4 h-4 text-blue-400" />
              <span className="text-sm font-medium text-blue-200">Enterprise Solutions</span>
            </div>
            <h2 className="text-4xl sm:text-5xl font-bold text-white tracking-tight">
              Need a custom solution?
            </h2>
            <p className="mt-5 text-lg text-gray-400 max-w-2xl mx-auto">
              Our enterprise plan is fully customizable. Tell us about your requirements and we&apos;ll build a solution that fits.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4 justify-center">
              <Button href="/contact" size="lg" className="bg-white text-gray-900 hover:bg-gray-100">
                Contact Sales
              </Button>
              <Button href="/signup" variant="outline" size="lg" className="border-white/20 text-white hover:bg-white/10">
                Start Free Trial
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
