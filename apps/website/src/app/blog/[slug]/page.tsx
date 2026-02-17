import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { Calendar, ArrowLeft } from "lucide-react";

const posts = {
  "why-erp-matters-for-importers": {
    title: "Why ERP Matters for Import and Distribution Businesses",
    date: "2026-02-10",
    category: "Industry Insights",
    content: `
      In today's competitive import and distribution landscape, businesses face increasing complexity in managing 
      multiple warehouses, diverse product lines, international suppliers, and demanding customers. Manual processes 
      and disconnected systems create bottlenecks, errors, and missed opportunities.

      Modern ERP systems like TradeFlow provide the integrated platform that growing businesses need to manage 
      this complexity effectively. From purchase orders and landed costs to inventory tracking and financial reporting, 
      everything works together seamlessly.

      Key benefits include real-time visibility into operations, automated workflows that reduce manual work, 
      better decision-making through comprehensive reporting, and the scalability to grow without adding overhead.

      For import businesses specifically, features like landed cost calculation, multi-currency support, and 
      warehouse management are essential. TradeFlow was built with these needs in mind, helping importers compete 
      effectively in global markets.
    `,
  },
  "inventory-management-guide": {
    title: "The Complete Guide to Multi-Warehouse Inventory Management",
    date: "2026-02-05",
    category: "Best Practices",
    content: `
      Managing inventory across multiple warehouses presents unique challenges. Without proper systems and processes, 
      businesses struggle with stockouts, excess inventory, and inefficient transfers between locations.

      The foundation of effective multi-warehouse management is real-time visibility. Every team member needs to 
      see current stock levels, pending transfers, and committed inventory across all locations. This prevents 
      double-selling and ensures you can promise accurate delivery dates to customers.

      Best practices include implementing bin locations for organized storage, maintaining accurate cycle counts 
      to verify system data, using ABC analysis to prioritize high-value items, and establishing clear transfer 
      workflows between warehouses.

      TradeFlow's warehouse management features help businesses implement these practices with minimal overhead. 
      Batch tracking, bin locations, and automated stock alerts keep your inventory organized and your customers happy.
    `,
  },
  "digital-transformation-trading": {
    title: "Digital Transformation in Trading: Moving Beyond Spreadsheets",
    date: "2026-01-28",
    category: "Digital Transformation",
    content: `
      Many trading businesses still rely on spreadsheets for core operations. While familiar and flexible, 
      spreadsheets create significant risks: data entry errors, version control issues, lack of access controls, 
      and inability to scale as the business grows.

      Digital transformation doesn't mean abandoning everything that works. It means moving to integrated systems 
      that maintain the flexibility you need while adding reliability, security, and collaboration features.

      The transition starts with identifying pain points: Where do errors occur? What takes too much time? 
      What information is hard to find? These pain points guide the transformation roadmap.

      Modern ERP systems like TradeFlow provide spreadsheet-like ease of use with database reliability. Data is 
      entered once and flows automatically through the system. Everyone sees the same information. Audit trails 
      track every change. Reports update in real-time.

      Businesses that make this transition typically see fewer errors, faster month-end closes, better customer 
      service, and the ability to grow without adding administrative overhead.
    `,
  },
};

export function generateStaticParams() {
  return [
    { slug: "why-erp-matters-for-importers" },
    { slug: "inventory-management-guide" },
    { slug: "digital-transformation-trading" },
  ];
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = posts[params.slug as keyof typeof posts];
  
  if (!post) {
    return {
      title: "Post Not Found - TradeFlow ERP",
    };
  }

  return {
    title: `${post.title} - TradeFlow ERP Blog`,
    description: post.content.substring(0, 160).trim() + "...",
  };
}

export default function BlogPostPage({ params }: { params: { slug: string } }) {
  const post = posts[params.slug as keyof typeof posts];

  if (!post) {
    return (
      <section className="py-20 min-h-[70vh] flex items-center">
        <Container>
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Post Not Found</h1>
            <p className="text-gray-600 mb-8">
              The blog post you're looking for doesn't exist.
            </p>
            <Link href="/blog">
              <Button>Back to Blog</Button>
            </Link>
          </div>
        </Container>
      </section>
    );
  }

  return (
    <article className="py-20">
      <Container>
        <div className="max-w-3xl mx-auto">
          <Link href="/blog">
            <Button variant="ghost" className="mb-8">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Blog
            </Button>
          </Link>

          <div className="mb-8">
            <div className="flex items-center text-sm text-gray-500 mb-4">
              <Calendar className="w-4 h-4 mr-2" />
              {new Date(post.date).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
              <span className="mx-2">•</span>
              {post.category}
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-gray-900">
              {post.title}
            </h1>
          </div>

          <div className="prose prose-lg prose-gray max-w-none">
            {post.content.split('\n\n').map((paragraph, index) => (
              <p key={index} className="mb-6 text-gray-700 leading-relaxed">
                {paragraph.trim()}
              </p>
            ))}
          </div>

          <div className="mt-12 pt-8 border-t border-gray-200">
            <Link href="/blog">
              <Button variant="ghost">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Blog
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </article>
  );
}
