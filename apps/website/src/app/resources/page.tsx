import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { BookOpen, FileText, HelpCircle, TrendingUp, Calculator, Lightbulb } from "lucide-react";

export const metadata: Metadata = {
  title: "Resources - TradeFlow ERP",
  description: "Explore our resources including guides, case studies, help center, and ROI calculator to help you get the most out of TradeFlow ERP.",
};

const resources = [
  {
    title: "Blog",
    description: "Industry insights, best practices, and updates from the TradeFlow team.",
    icon: BookOpen,
    href: "/resources/blog",
    color: "bg-blue-500",
  },
  {
    title: "Case Studies",
    description: "Real-world success stories from businesses using TradeFlow ERP.",
    icon: FileText,
    href: "/resources/case-studies",
    color: "bg-green-500",
  },
  {
    title: "Help Center",
    description: "Documentation and tutorials to help you use TradeFlow effectively.",
    icon: HelpCircle,
    href: "/resources/help",
    color: "bg-purple-500",
  },
  {
    title: "Guides",
    description: "Step-by-step guides for common workflows and best practices.",
    icon: Lightbulb,
    href: "/resources/guides",
    color: "bg-orange-500",
  },
  {
    title: "ROI Calculator",
    description: "Calculate your potential return on investment with TradeFlow ERP.",
    icon: Calculator,
    href: "/resources/roi-calculator",
    color: "bg-indigo-500",
  },
];

export default function ResourcesPage() {
  return (
    <>
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Resources
            </h1>
            <p className="text-xl text-gray-600">
              Everything you need to succeed with TradeFlow ERP. Explore guides, case studies, 
              documentation, and tools to help you make the most of your system.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {resources.map((resource) => {
              const Icon = resource.icon;
              return (
                <Link
                  key={resource.href}
                  href={resource.href}
                  className="group bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-8 border border-gray-200"
                >
                  <div className={`${resource.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                    {resource.title}
                  </h3>
                  <p className="text-gray-600">
                    {resource.description}
                  </p>
                </Link>
              );
            })}
          </div>
        </Container>
      </section>
    </>
  );
}
