import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Calendar, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Blog - TradeFlow ERP",
  description: "Industry insights, best practices, and updates from the TradeFlow team.",
};

const posts = [
  {
    slug: "why-erp-matters-for-importers",
    title: "Why ERP Matters for Import and Distribution Businesses",
    excerpt: "Discover how modern ERP systems help importers manage complexity, reduce errors, and scale operations efficiently in today's competitive market.",
    category: "Industry Insights",
    date: "2026-02-10",
    author: "TradeFlow Team",
  },
  {
    slug: "inventory-management-guide",
    title: "The Complete Guide to Multi-Warehouse Inventory Management",
    excerpt: "Learn best practices for managing inventory across multiple warehouses, optimizing stock levels, and reducing carrying costs while maintaining service levels.",
    category: "Best Practices",
    date: "2026-02-05",
    author: "TradeFlow Team",
  },
  {
    slug: "digital-transformation-trading",
    title: "Digital Transformation in Trading: Moving Beyond Spreadsheets",
    excerpt: "How modern trading businesses are leaving spreadsheets behind and embracing integrated ERP systems for better visibility and control.",
    category: "Digital Transformation",
    date: "2026-01-28",
    author: "TradeFlow Team",
  },
];

export default function BlogPage() {
  return (
    <>
      <section className="py-20 bg-gradient-to-b from-blue-50 to-white">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Blog
            </h1>
            <p className="text-xl text-gray-600">
              Industry insights, best practices, and updates to help you succeed in import and distribution.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {posts.map((post) => (
              <article
                key={post.slug}
                className="bg-white rounded-lg shadow-md hover:shadow-xl transition-shadow overflow-hidden border border-gray-200"
              >
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Badge variant="gray">{post.category}</Badge>
                    <div className="flex items-center text-sm text-gray-500">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(post.date).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'short', 
                        day: 'numeric' 
                      })}
                    </div>
                  </div>

                  <h2 className="text-xl font-semibold text-gray-900 mb-3 line-clamp-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-4 line-clamp-3">
                    {post.excerpt}
                  </p>

                  <Link href={`/blog/${post.slug}`}>
                    <Button variant="ghost" className="group">
                      Read more
                      <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
