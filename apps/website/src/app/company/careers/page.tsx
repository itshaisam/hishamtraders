import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { CTABanner } from "@/components/layout/CTABanner";
import {
  Globe,
  Flame,
  BookOpen,
  Banknote,
  MapPin,
  Clock,
  Mail,
  ArrowRight,
} from "lucide-react";

export const metadata: Metadata = {
  title: "Careers - TradeFlow ERP",
  description:
    "Join TradeFlow ERP and help build enterprise software for emerging markets. See open positions in engineering, design, sales, and support.",
};

const cultureItems = [
  {
    icon: Globe,
    title: "Remote-first",
    description:
      "Work from anywhere. We hire the best people regardless of location and trust them to deliver.",
  },
  {
    icon: Flame,
    title: "Ownership culture",
    description:
      "Every team member owns their work end-to-end. No micromanagement, no unnecessary approvals.",
  },
  {
    icon: BookOpen,
    title: "Learning budget",
    description:
      "Annual stipend for courses, conferences, and books. We invest in your growth as much as the product.",
  },
  {
    icon: Banknote,
    title: "Competitive pay",
    description:
      "Market-rate salaries, equity options, and performance bonuses. We pay fairly and transparently.",
  },
];

const positions = [
  {
    title: "Senior Full-Stack Engineer",
    department: "Engineering",
    location: "Remote",
    type: "Full-time",
    description:
      "Build and scale our core ERP platform using TypeScript, React, Node.js, and Prisma. You'll own features end-to-end — from database schema to pixel-perfect UI.",
  },
  {
    title: "Product Designer",
    department: "Design",
    location: "Remote",
    type: "Full-time",
    description:
      "Design intuitive interfaces for complex business workflows. Turn messy trading operations into clean, usable software that non-technical users love.",
  },
  {
    title: "Sales Development Rep",
    department: "Sales",
    location: "Karachi",
    type: "Full-time",
    description:
      "Identify and qualify trading businesses ready to modernize. Build relationships with importers, distributors, and wholesalers across Pakistan.",
  },
  {
    title: "Customer Success Manager",
    department: "Support",
    location: "Karachi",
    type: "Full-time",
    description:
      "Onboard new customers, drive adoption, and ensure retention. Be the voice of the customer inside the company and help shape the product roadmap.",
  },
];

const departmentColors: Record<string, string> = {
  Engineering: "bg-blue-100 text-blue-700",
  Design: "bg-purple-100 text-purple-700",
  Sales: "bg-emerald-100 text-emerald-700",
  Support: "bg-amber-100 text-amber-700",
};

export default function CareersPage() {
  return (
    <>
      {/* Hero */}
      <section className="bg-white pt-12 pb-16 lg:pt-16 lg:pb-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">
              Careers
            </p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Join the team shaping the future of trade
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              We&apos;re building enterprise software for emerging markets —
              starting with Pakistan&apos;s trading industry. If you want to
              solve real problems for real businesses, you&apos;ll fit right in.
            </p>
          </div>
        </Container>
      </section>

      {/* Culture */}
      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Why work at TradeFlow
            </h2>
            <p className="mt-3 text-gray-600">
              A workplace designed for people who do their best work with
              autonomy and purpose.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
            {cultureItems.map((item) => (
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

      {/* Open Positions */}
      <section className="py-16 lg:py-20 bg-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900">
              Open Positions
            </h2>
            <p className="mt-3 text-gray-600">
              Find a role that matches your skills and ambitions.
            </p>
          </div>
          <div className="max-w-3xl mx-auto space-y-4">
            {positions.map((job) => (
              <div
                key={job.title}
                className="rounded-xl border border-gray-200 bg-white p-6"
              >
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-gray-900">
                      {job.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-2">
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${departmentColors[job.department]}`}
                      >
                        {job.department}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <MapPin className="h-3.5 w-3.5" />
                        {job.location}
                      </span>
                      <span className="flex items-center gap-1 text-sm text-gray-500">
                        <Clock className="h-3.5 w-3.5" />
                        {job.type}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                      {job.description}
                    </p>
                  </div>
                  <div className="shrink-0">
                    <Button href="/contact" variant="outline" size="sm">
                      Apply
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Don't see your role */}
          <div className="max-w-3xl mx-auto mt-10 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <h3 className="text-base font-bold text-gray-900 mb-2">
              Don&apos;t see your role?
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              We&apos;re always looking for talented people. Send your resume and
              a short note about what you&apos;d like to work on.
            </p>
            <a
              href="mailto:careers@tradeflowerp.com"
              className="inline-flex items-center gap-2 text-sm font-semibold text-primary-600 hover:text-primary-700"
            >
              <Mail className="h-4 w-4" />
              careers@tradeflowerp.com
            </a>
          </div>
        </Container>
      </section>

      {/* CTA */}
      <CTABanner />
    </>
  );
}
