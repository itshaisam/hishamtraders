"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { FAQSection } from "@/components/sections/FAQSection";
import { Check, X } from "lucide-react";
import { plans, comparisonCategories } from "@/data/pricing";
import { pricingFaqs } from "@/data/faqs";

export default function PricingPage() {
  const [annual, setAnnual] = useState(true);

  return (
    <>
      {/* Hero */}
      <section className="bg-white pt-12 pb-16 lg:pt-16 lg:pb-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Pricing</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Simple, transparent pricing
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              Start free for 14 days. No credit card required. Choose the plan that fits your business.
            </p>

            {/* Toggle */}
            <div className="mt-8 inline-flex items-center gap-3 bg-gray-100 p-1 rounded-lg">
              <button
                onClick={() => setAnnual(false)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  !annual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setAnnual(true)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                  annual ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                Annual <span className="text-primary-600 text-xs font-semibold">Save 20%</span>
              </button>
            </div>
          </div>
        </Container>
      </section>

      {/* Pricing Cards */}
      <section className="pb-16 lg:pb-20 bg-white">
        <Container>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.name}
                className={`rounded-xl border p-6 lg:p-8 flex flex-col ${
                  plan.highlighted
                    ? "border-primary-500 ring-2 ring-primary-500 relative"
                    : "border-gray-200"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <h3 className="text-lg font-bold text-gray-900">{plan.name}</h3>
                <p className="text-sm text-gray-600 mt-1">{plan.description}</p>

                <div className="mt-6 mb-6">
                  {plan.monthlyPrice ? (
                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-extrabold text-gray-900">
                        ${annual ? plan.annualPrice : plan.monthlyPrice}
                      </span>
                      <span className="text-gray-500 text-sm">/user/month</span>
                    </div>
                  ) : (
                    <div>
                      <span className="text-4xl font-extrabold text-gray-900">Custom</span>
                      <p className="text-sm text-gray-500 mt-1">Contact us for a quote</p>
                    </div>
                  )}
                </div>

                <Button
                  href={plan.name === "Enterprise" ? "/contact" : "/signup"}
                  variant={plan.highlighted ? "primary" : "outline"}
                  className="w-full justify-center mb-6"
                >
                  {plan.cta}
                </Button>

                <ul className="space-y-3 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mt-0.5 shrink-0">
                        <Check className="h-3 w-3 text-primary-600" />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Comparison Table */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Compare plans in detail</h2>
            <p className="mt-3 text-gray-600">See exactly what&apos;s included in each plan.</p>
          </div>

          <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 bg-white overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-4 bg-gray-50 border-b border-gray-200">
              <div className="px-5 py-3 text-sm font-semibold text-gray-700">Feature</div>
              <div className="px-5 py-3 text-sm font-semibold text-gray-700 text-center">Starter</div>
              <div className="px-5 py-3 text-sm font-semibold text-primary-600 text-center">Professional</div>
              <div className="px-5 py-3 text-sm font-semibold text-gray-700 text-center">Enterprise</div>
            </div>

            {comparisonCategories.map((cat) => (
              <div key={cat.name}>
                <div className="px-5 py-2.5 bg-gray-50 border-b border-gray-200">
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{cat.name}</p>
                </div>
                {cat.features.map((f, i) => (
                  <div
                    key={f.name}
                    className={`grid grid-cols-4 ${i < cat.features.length - 1 ? "border-b border-gray-100" : "border-b border-gray-200"}`}
                  >
                    <div className="px-5 py-3 text-sm text-gray-700">{f.name}</div>
                    {[f.starter, f.professional, f.enterprise].map((has, j) => (
                      <div key={j} className="px-5 py-3 flex justify-center">
                        {has ? (
                          <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center">
                            <Check className="h-3 w-3 text-primary-600" />
                          </div>
                        ) : (
                          <X className="h-5 w-5 text-gray-300" />
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
      <section className="bg-gray-900 py-16 lg:py-20">
        <Container className="text-center">
          <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
            Need a custom solution?
          </h2>
          <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
            Our enterprise plan is fully customizable. Tell us about your requirements and we&apos;ll build a solution that fits.
          </p>
          <div className="mt-8">
            <Button href="/contact" size="lg">
              Contact Sales
            </Button>
          </div>
        </Container>
      </section>
    </>
  );
}
