import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CTABanner } from "@/components/layout/CTABanner";
import { Target, Eye, Heart, Users, Rocket, Building2 } from "lucide-react";

export const metadata: Metadata = {
  title: "About Us - TradeFlow ERP",
  description:
    "Learn about TradeFlow ERP — the team building modern enterprise software for Pakistan's trading and distribution industry.",
};

const values = [
  {
    icon: Target,
    title: "Mission",
    description:
      "Digitize trading operations across emerging markets, replacing spreadsheets and manual processes with purpose-built ERP software.",
  },
  {
    icon: Eye,
    title: "Vision",
    description:
      "Every distribution business running on modern ERP by 2030 — from single-city importers to nationwide wholesalers.",
  },
  {
    icon: Heart,
    title: "Values",
    description:
      "Customer-first, ship fast, stay lean. We build what traders actually need, not what looks good in a pitch deck.",
  },
];

const milestones = [
  {
    year: "2024",
    title: "Founded",
    description:
      "TradeFlow started as an internal tool built for a single importer in Karachi who was drowning in spreadsheets and WhatsApp threads.",
  },
  {
    year: "2024",
    title: "First customers",
    description:
      "Word spread quickly. Within months, we onboarded 10 trading businesses — each one shaping the product with real-world feedback.",
  },
  {
    year: "2025",
    title: "50+ businesses",
    description:
      "Expanded to serve importers, distributors, and wholesalers across Pakistan. Added inventory, invoicing, and recovery modules.",
  },
  {
    year: "2025",
    title: "Full ERP platform",
    description:
      "TradeFlow evolved into a complete ERP — purchase orders, warehousing, sales, accounting, and reporting in one unified platform.",
  },
];

const team = [
  {
    name: "Hisham Ahmed",
    role: "Founder & CEO",
    initials: "HA",
    color: "bg-primary-600",
    bio: "Former supply chain consultant with 10+ years in Pakistan's trading industry.",
  },
  {
    name: "Saad Malik",
    role: "CTO",
    initials: "SM",
    color: "bg-gray-900",
    bio: "Full-stack engineer who's built and scaled enterprise systems from the ground up.",
  },
  {
    name: "Fatima Khan",
    role: "Head of Sales",
    initials: "FK",
    color: "bg-emerald-600",
    bio: "Connects businesses with the right solutions. Deep understanding of the trading ecosystem.",
  },
  {
    name: "Omar Raza",
    role: "Head of Support",
    initials: "OR",
    color: "bg-amber-600",
    bio: "Ensures every customer gets the help they need, when they need it.",
  },
];

export default function AboutPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white pt-12 pb-16 lg:pt-16 lg:pb-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">
              About Us
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Built for businesses that move goods
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              We&apos;re building the software that powers Pakistan&apos;s trading
              industry — purpose-built ERP for importers, distributors, and
              wholesalers who have outgrown spreadsheets but don&apos;t need
              bloated enterprise systems.
            </p>
          </div>
        </Container>
      </section>

      {/* Mission / Vision / Values */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              What drives us
            </h2>
            <p className="mt-3 text-gray-600">
              Three principles that guide every decision we make.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {values.map((item) => (
              <div
                key={item.title}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <div className="w-10 h-10 rounded-lg bg-primary-100 flex items-center justify-center mb-4">
                  <item.icon className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">
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

      {/* Story / Timeline */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">Our story</h2>
            <p className="mt-3 text-gray-600">
              From a single importer&apos;s back office to a platform serving
              50+ businesses.
            </p>
          </div>
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[23px] top-2 bottom-2 w-px bg-gray-200" />

              <div className="space-y-10">
                {milestones.map((item, index) => (
                  <div key={index} className="flex gap-6">
                    {/* Dot */}
                    <div className="relative shrink-0">
                      <div className="w-[47px] h-[47px] rounded-full border-2 border-primary-200 bg-white flex items-center justify-center">
                        <div className="w-3 h-3 rounded-full bg-primary-600" />
                      </div>
                    </div>
                    {/* Content */}
                    <div className="pt-2.5">
                      <span className="text-xs font-semibold text-primary-600 uppercase tracking-wider">
                        {item.year}
                      </span>
                      <h3 className="text-lg font-bold text-gray-900 mt-1">
                        {item.title}
                      </h3>
                      <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Team */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Meet the team behind TradeFlow
            </h2>
            <p className="mt-3 text-gray-600">
              A small, focused team obsessed with making trading operations
              simpler.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {team.map((member) => (
              <div
                key={member.name}
                className="rounded-xl border border-gray-200 bg-white p-6 text-center"
              >
                <div
                  className={`w-16 h-16 rounded-full ${member.color} flex items-center justify-center mx-auto mb-4`}
                >
                  <span className="text-lg font-bold text-white">
                    {member.initials}
                  </span>
                </div>
                <h3 className="text-base font-bold text-gray-900">
                  {member.name}
                </h3>
                <p className="text-sm text-primary-600 font-medium mt-0.5">
                  {member.role}
                </p>
                <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                  {member.bio}
                </p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* CTA */}
      <CTABanner />
    </>
  );
}
