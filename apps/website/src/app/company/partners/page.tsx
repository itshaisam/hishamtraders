import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CTABanner } from "@/components/layout/CTABanner";
import {
  DollarSign,
  GraduationCap,
  Megaphone,
  Headphones,
  Sparkles,
  LayoutDashboard,
  Check,
  Users,
  Code,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Partner Program - TradeFlow ERP",
  description:
    "Grow your business with TradeFlow ERP. Join our partner program as a referral, solutions, or technology partner and earn recurring revenue.",
};

const tiers = [
  {
    name: "Referral Partner",
    price: "Free",
    description:
      "Recommend TradeFlow to your network and earn commission on every deal that closes.",
    icon: Users,
    features: [
      "15% recurring commission",
      "Co-marketing materials",
      "Partner portal access",
      "Dedicated partner link",
    ],
    cta: "Join for Free",
    highlighted: false,
  },
  {
    name: "Solutions Partner",
    price: "Application-based",
    description:
      "Help businesses implement and customize TradeFlow. Get trained, certified, and earn more.",
    icon: GraduationCap,
    features: [
      "25% recurring commission",
      "Implementation support",
      "Technical training & certification",
      "Priority lead sharing",
    ],
    cta: "Apply Now",
    highlighted: true,
  },
  {
    name: "Technology Partner",
    price: "Application-based",
    description:
      "Integrate your product with TradeFlow and reach our growing customer base.",
    icon: Code,
    features: [
      "Full API access",
      "Marketplace listing",
      "Joint go-to-market",
      "Dedicated partner manager",
    ],
    cta: "Apply Now",
    highlighted: false,
  },
];

const benefits = [
  {
    icon: DollarSign,
    title: "Revenue share",
    description:
      "Earn recurring commissions on every customer you bring in. Up to 25% for solutions partners.",
  },
  {
    icon: GraduationCap,
    title: "Training & certification",
    description:
      "Get certified on the TradeFlow platform with structured training programs and documentation.",
  },
  {
    icon: Megaphone,
    title: "Co-marketing",
    description:
      "Joint webinars, case studies, and marketing materials to help you generate leads.",
  },
  {
    icon: Headphones,
    title: "Dedicated support",
    description:
      "Priority support channel and a dedicated partner manager for solutions and technology partners.",
  },
  {
    icon: Sparkles,
    title: "Early access to features",
    description:
      "Be the first to test new modules and capabilities before they go live for all customers.",
  },
  {
    icon: LayoutDashboard,
    title: "Partner portal",
    description:
      "Track referrals, commissions, leads, and certifications in your own partner dashboard.",
  },
];

const steps = [
  {
    step: "01",
    title: "Apply",
    description:
      "Fill out a short application form. Tell us about your business and how you want to partner with TradeFlow.",
  },
  {
    step: "02",
    title: "Get onboarded",
    description:
      "Our partner team will set you up with training, materials, and your partner portal access within 48 hours.",
  },
  {
    step: "03",
    title: "Start earning",
    description:
      "Refer customers, implement solutions, or integrate your product. Track everything in your partner dashboard.",
  },
];

export default function PartnersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white pt-12 pb-16 lg:pt-16 lg:pb-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">
              Partner Program
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Grow your business with TradeFlow
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              Whether you&apos;re a consultant, systems integrator, or
              technology company, our partner program gives you the tools and
              support to build a profitable business around TradeFlow ERP.
            </p>
          </div>
        </Container>
      </section>

      {/* Partner Tiers */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Choose your partnership tier
            </h2>
            <p className="mt-3 text-gray-600">
              Three tiers designed for different types of partners. Start where
              it makes sense and grow from there.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {tiers.map((tier) => (
              <div
                key={tier.name}
                className={`rounded-xl border p-6 lg:p-8 flex flex-col ${
                  tier.highlighted
                    ? "border-primary-500 ring-2 ring-primary-500 relative bg-white"
                    : "border-gray-200 bg-white"
                }`}
              >
                {tier.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-primary-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                  <tier.icon className="h-5 w-5 text-primary-600" />
                </div>

                <h3 className="text-lg font-bold text-gray-900">
                  {tier.name}
                </h3>
                <p className="text-sm text-primary-600 font-semibold mt-1">
                  {tier.price}
                </p>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                  {tier.description}
                </p>

                <ul className="space-y-3 mt-6 mb-6 flex-1">
                  {tier.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mt-0.5 shrink-0">
                        <Check className="h-3 w-3 text-primary-600" />
                      </div>
                      <span className="text-sm text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Button
                  href="/contact"
                  variant={tier.highlighted ? "primary" : "outline"}
                  className="w-full justify-center"
                >
                  {tier.cta}
                </Button>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Benefits */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Partner benefits
            </h2>
            <p className="mt-3 text-gray-600">
              Everything you need to succeed as a TradeFlow partner.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {benefits.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* How to Join */}
      <section className="py-16 lg:py-20 bg-gray-900">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-white">
              How to become a partner
            </h2>
            <p className="mt-3 text-gray-400">
              Three simple steps to get started.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {steps.map((item) => (
              <div key={item.step} className="text-center">
                <div className="w-12 h-12 rounded-full border-2 border-primary-500 flex items-center justify-center mx-auto mb-4">
                  <span className="text-sm font-bold text-primary-400">
                    {item.step}
                  </span>
                </div>
                <h3 className="text-lg font-bold text-white mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Button href="/contact" size="lg">
              Become a Partner
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <CTABanner />
    </>
  );
}
