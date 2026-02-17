import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { SectionHeader } from "@/components/ui/SectionHeader";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { 
  Package, 
  ShoppingCart, 
  Calculator, 
  Users, 
  Settings, 
  PlayCircle,
  Mail
} from "lucide-react";

export const metadata: Metadata = {
  title: "Help Center - TradeFlow ERP",
  description: "Find answers and learn how to use TradeFlow ERP effectively with our comprehensive help center.",
};

const categories = [
  {
    title: "Getting Started",
    description: "Learn the basics and set up your TradeFlow account for success.",
    icon: PlayCircle,
    articles: ["Account setup", "User management", "Initial configuration", "Dashboard overview"],
    color: "bg-blue-500",
  },
  {
    title: "Inventory Management",
    description: "Manage warehouses, products, stock movements, and inventory tracking.",
    icon: Package,
    articles: ["Creating products", "Warehouse management", "Stock adjustments", "Inventory reports"],
    color: "bg-green-500",
  },
  {
    title: "Sales & Invoicing",
    description: "Create invoices, manage clients, and track sales performance.",
    icon: ShoppingCart,
    articles: ["Creating invoices", "Client management", "Payment tracking", "Sales reports"],
    color: "bg-purple-500",
  },
  {
    title: "Accounting",
    description: "Chart of accounts, journal entries, and financial reporting.",
    icon: Calculator,
    articles: ["Chart of accounts", "Journal entries", "Financial statements", "Tax reports"],
    color: "bg-orange-500",
  },
  {
    title: "Recovery Management",
    description: "Field recovery, payment collections, and client follow-ups.",
    icon: Users,
    articles: ["Recovery planning", "Payment collections", "Visit tracking", "Recovery reports"],
    color: "bg-indigo-500",
  },
  {
    title: "Administration",
    description: "System settings, user permissions, and security configuration.",
    icon: Settings,
    articles: ["User roles", "Permissions", "System settings", "Audit logs"],
    color: "bg-red-500",
  },
];

export default function HelpCenterPage() {
  return (
    <>
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Help Center
            </h1>
            <p className="text-xl text-gray-600">
              Find answers, learn best practices, and get the most out of TradeFlow ERP.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
            {categories.map((category) => {
              const Icon = category.icon;
              return (
                <div
                  key={category.title}
                  className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                >
                  <div className={`${category.color} w-12 h-12 rounded-lg flex items-center justify-center mb-4`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    {category.title}
                  </h3>
                  <p className="text-gray-600 mb-4">
                    {category.description}
                  </p>
                  <ul className="space-y-2">
                    {category.articles.map((article) => (
                      <li key={article} className="text-sm text-gray-700">
                        • {article}
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg shadow-lg p-8 md:p-12 text-center text-white">
            <Mail className="w-12 h-12 mx-auto mb-4" />
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Can't find what you need?
            </h2>
            <p className="text-lg mb-6 text-blue-100">
              Our support team is here to help. Get in touch and we'll get back to you within 24 hours.
            </p>
            <Link href="/contact">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-gray-100">
                Contact Support
              </Button>
            </Link>
          </div>
        </Container>
      </section>
    </>
  );
}
