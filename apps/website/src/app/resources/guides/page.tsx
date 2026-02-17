import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Badge } from "@/components/ui/Badge";
import { BookOpen, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Guides - TradeFlow ERP",
  description: "Step-by-step guides and best practices for using TradeFlow ERP effectively.",
};

const guides = [
  {
    title: "Getting Started with TradeFlow",
    description: "A comprehensive guide to setting up your account, configuring initial settings, and creating your first transactions.",
    category: "Getting Started",
    readTime: "15 min",
  },
  {
    title: "Inventory Management Best Practices",
    description: "Learn how to organize your warehouses, manage stock levels, and optimize inventory tracking for maximum efficiency.",
    category: "Inventory",
    readTime: "20 min",
  },
  {
    title: "Setting Up Your Chart of Accounts",
    description: "Configure your accounting structure with best practices for trading and distribution businesses.",
    category: "Accounting",
    readTime: "25 min",
  },
  {
    title: "Managing Purchase Orders & Landed Costs",
    description: "Master the procurement workflow from PO creation to landed cost calculation and inventory receipt.",
    category: "Procurement",
    readTime: "18 min",
  },
  {
    title: "Optimizing Sales & Invoicing",
    description: "Streamline your sales process with efficient invoicing, payment tracking, and customer management.",
    category: "Sales",
    readTime: "15 min",
  },
  {
    title: "Field Recovery Management",
    description: "Set up recovery plans, track field visits, and improve collection efficiency with systematic follow-ups.",
    category: "Recovery",
    readTime: "22 min",
  },
];

export default function GuidesPage() {
  return (
    <>
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Guides
            </h1>
            <p className="text-xl text-gray-600">
              Step-by-step guides to help you master TradeFlow ERP and implement best practices for your business.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {guides.map((guide, index) => (
              <div
                key={index}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow p-6 border border-gray-200"
              >
                <div className="flex items-center justify-between mb-4">
                  <Badge variant="gray">{guide.category}</Badge>
                  <div className="flex items-center text-sm text-gray-500">
                    <Clock className="w-4 h-4 mr-1" />
                    {guide.readTime}
                  </div>
                </div>

                <div className="bg-blue-100 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <BookOpen className="w-6 h-6 text-blue-600" />
                </div>

                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {guide.title}
                </h3>
                <p className="text-gray-600 mb-4">
                  {guide.description}
                </p>

                <div className="flex items-center justify-center py-3 bg-gray-50 rounded-md">
                  <span className="text-sm font-medium text-gray-500">Coming Soon</span>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
