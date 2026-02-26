"use client";

import { useState, useMemo } from "react";
import { Container } from "../ui/Container";
import { SectionHeader } from "../ui/SectionHeader";

// FAQ Item type with category support
interface FAQItem {
  question: string;
  answer: string;
  category?: string;
}

type FAQSectionProps = {
  title?: string;
  subtitle?: string;
  items?: FAQItem[];
};

// Default comprehensive FAQ data
const defaultFAQItems: FAQItem[] = [
  // General
  {
    question: "What is TradeFlow ERP?",
    answer:
      "TradeFlow ERP is a comprehensive enterprise resource planning solution designed specifically for trading and distribution businesses. It streamlines inventory management, order processing, financial tracking, and customer relationships in one unified platform.",
    category: "General",
  },
  {
    question: "How long does implementation take?",
    answer:
      "Implementation typically takes 4-8 weeks depending on your business size and complexity. Our team provides full support throughout the process, including data migration, training, and system configuration to ensure a smooth transition.",
    category: "General",
  },
  {
    question: "Is my data secure with TradeFlow?",
    answer:
      "Absolutely. We employ bank-grade security measures including 256-bit SSL encryption, regular automated backups, SOC 2 Type II compliance, and GDPR compliance. Your data is stored in secure, redundant data centers with 99.99% uptime guarantee.",
    category: "General",
  },
  // Pricing
  {
    question: "What pricing plans are available?",
    answer:
      "We offer flexible pricing plans to suit businesses of all sizes: Starter ($29/month), Professional ($79/month), and Enterprise (custom pricing). Each plan includes core features with increasing limits on users, transactions, and advanced capabilities.",
    category: "Pricing",
  },
  {
    question: "Can I change my plan later?",
    answer:
      "Yes, you can upgrade or downgrade your plan at any time. When upgrading, you'll get immediate access to new features. When downgrading, changes take effect at the start of your next billing cycle. No hidden fees or penalties.",
    category: "Pricing",
  },
  {
    question: "Is there a free trial available?",
    answer:
      "Yes! We offer a 14-day free trial with full access to all Professional plan features. No credit card required to start. You can explore the platform risk-free and see how it fits your business needs.",
    category: "Pricing",
  },
  // Features
  {
    question: "What integrations are supported?",
    answer:
      "TradeFlow integrates seamlessly with popular tools including QuickBooks, Xero, Shopify, WooCommerce, Amazon, eBay, Stripe, PayPal, and 50+ other platforms. We also offer a robust API for custom integrations.",
    category: "Features",
  },
  {
    question: "Can I access TradeFlow on mobile devices?",
    answer:
      "Yes, TradeFlow is fully responsive and works on all devices. We also offer native iOS and Android apps for on-the-go access to key features like inventory checks, order approvals, and real-time notifications.",
    category: "Features",
  },
  {
    question: "Does TradeFlow support multiple warehouses?",
    answer:
      "Yes, our Professional and Enterprise plans support unlimited warehouse locations. You can track inventory across all locations, transfer stock between warehouses, and set location-specific pricing and availability.",
    category: "Features",
  },
  // Support
  {
    question: "What support options are available?",
    answer:
      "We provide 24/7 support via live chat, email, and phone. Professional and Enterprise plans include priority support with dedicated account managers. Our extensive knowledge base, video tutorials, and community forum are available to all users.",
    category: "Support",
  },
  {
    question: "Is training provided for my team?",
    answer:
      "Yes, all plans include access to our comprehensive training library. Professional plans include 2 hours of live onboarding training, while Enterprise plans include customized training sessions for your entire team.",
    category: "Support",
  },
  {
    question: "How do I get help if I encounter issues?",
    answer:
      "You can reach our support team through multiple channels: in-app live chat (fastest response), email support with 4-hour response time, or phone support for Enterprise customers. We also have an extensive help center with step-by-step guides.",
    category: "Support",
  },
];

// Chevron icon component with rotation animation
function ChevronIcon({ isOpen }: { isOpen: boolean }) {
  return (
    <svg
      className={`w-5 h-5 text-blue-600 transition-transform duration-300 ease-out ${
        isOpen ? "rotate-180" : ""
      }`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19 9l-7 7-7-7"
      />
    </svg>
  );
}

// Search icon
function SearchIcon() {
  return (
    <svg
      className="w-5 h-5 text-gray-400"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
      />
    </svg>
  );
}

// Message icon for CTA
function MessageIcon() {
  return (
    <svg
      className="w-6 h-6 text-blue-600"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
      />
    </svg>
  );
}

// Question icon for accordion items
function QuestionIcon() {
  return (
    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-4">
      <svg
        className="w-4 h-4 text-blue-600"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    </div>
  );
}

// Individual accordion item with smooth animations
function AccordionItem({
  item,
  isOpen,
  onToggle,
  index,
  total,
}: {
  item: FAQItem;
  isOpen: boolean;
  onToggle: () => void;
  index: number;
  total: number;
}) {
  return (
    <div
      className={`group border border-gray-200 rounded-xl overflow-hidden transition-all duration-300 ${
        isOpen
          ? "bg-white shadow-lg border-blue-200 ring-1 ring-blue-100"
          : "bg-white hover:border-blue-300 hover:shadow-md"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-5 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 rounded-xl"
        aria-expanded={isOpen}
      >
        <div className="flex items-center flex-1 pr-4">
          <QuestionIcon />
          <span
            className={`font-semibold text-base transition-colors duration-300 ${
              isOpen ? "text-blue-700" : "text-gray-800 group-hover:text-blue-600"
            }`}
          >
            {item.question}
          </span>
        </div>
        <ChevronIcon isOpen={isOpen} />
      </button>

      {/* Animated content container */}
      <div
        className={`grid transition-all duration-300 ease-out ${
          isOpen ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"
        }`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 pt-0">
            <div className="pl-12 border-t border-gray-100 pt-4">
              <p className="text-gray-600 leading-relaxed">{item.answer}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress indicator */}
      <div className="px-5 pb-3 flex items-center gap-2">
        <span className="text-xs text-gray-400 font-medium">
          {index + 1} / {total}
        </span>
        <div className="flex-1 h-1 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full transition-all duration-500"
            style={{ width: `${((index + 1) / total) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function FAQSection({
  title = "Frequently asked questions",
  subtitle = "Everything you need to know about TradeFlow ERP. Can't find what you're looking for? Reach out to our support team.",
  items = defaultFAQItems,
}: FAQSectionProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<string>("All");

  // Extract unique categories
  const categories = useMemo(() => {
    const cats = new Set(items.map((item) => item.category || "General"));
    return ["All", ...Array.from(cats)];
  }, [items]);

  // Filter items based on search and category
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        searchQuery === "" ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        activeCategory === "All" || item.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, activeCategory]);

  // Count per category for badges
  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { All: items.length };
    items.forEach((item) => {
      const cat = item.category || "General";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [items]);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section className="py-16 lg:py-24 bg-gradient-to-b from-gray-50 to-white">
      <Container>
        <SectionHeader
          title={title}
          subtitle={subtitle}
          align="center"
          titleClassName="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900"
          subtitleClassName="text-lg text-gray-600 max-w-2xl mx-auto mt-4"
        />

        <div className="max-w-3xl mx-auto mt-12">
          {/* Search Bar */}
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <SearchIcon />
            </div>
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 bg-white border border-gray-200 rounded-xl shadow-sm 
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                placeholder:text-gray-400 text-gray-700 transition-all duration-300
                hover:border-blue-300"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2 mb-8 justify-center">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === category
                    ? "bg-blue-600 text-white shadow-md shadow-blue-200 scale-105"
                    : "bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm"
                }`}
              >
                {category}
                <span
                  className={`ml-2 text-xs px-2 py-0.5 rounded-full ${
                    activeCategory === category
                      ? "bg-blue-500 text-white"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {categoryCounts[category] || 0}
                </span>
              </button>
            ))}
          </div>

          {/* Results count */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-gray-500">
              {searchQuery ? (
                <>
                  Found{" "}
                  <span className="font-semibold text-gray-700">
                    {filteredItems.length}
                  </span>{" "}
                  result{filteredItems.length !== 1 ? "s" : ""} for "
                  {searchQuery}"
                </>
              ) : (
                <>
                  Showing{" "}
                  <span className="font-semibold text-gray-700">
                    {filteredItems.length}
                  </span>{" "}
                  question{filteredItems.length !== 1 ? "s" : ""}
                </>
              )}
            </p>
            {filteredItems.length > 0 && openIndex !== null && (
              <p className="text-sm text-gray-400">
                Viewing {openIndex + 1} of {filteredItems.length}
              </p>
            )}
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            {filteredItems.length > 0 ? (
              filteredItems.map((item, index) => (
                <AccordionItem
                  key={`${item.question}-${index}`}
                  item={item}
                  isOpen={openIndex === index}
                  onToggle={() => handleToggle(index)}
                  index={index}
                  total={filteredItems.length}
                />
              ))
            ) : (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200 border-dashed">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <SearchIcon />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-2">
                  No results found
                </h3>
                <p className="text-gray-500 mb-4">
                  We couldn't find any FAQs matching your search.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery("");
                    setActiveCategory("All");
                  }}
                  className="text-blue-600 font-medium hover:text-blue-700 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            )}
          </div>

          {/* "Still have questions?" CTA */}
          <div className="mt-12 p-6 md:p-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center flex-shrink-0">
                  <MessageIcon />
                </div>
                <div className="text-center md:text-left">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Still have questions?
                  </h3>
                  <p className="text-gray-600 mt-1">
                    Can't find what you're looking for? Our team is here to help.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <a
                  href="/contact"
                  className="inline-flex items-center justify-center px-6 py-3 bg-blue-600 text-white font-medium rounded-xl
                    hover:bg-blue-700 hover:shadow-lg hover:shadow-blue-200 transition-all duration-300
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Contact Support
                </a>
                <a
                  href="/docs"
                  className="inline-flex items-center justify-center px-6 py-3 bg-white text-gray-700 font-medium rounded-xl
                    border border-gray-200 hover:border-blue-300 hover:text-blue-600 hover:shadow-sm
                    transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gray-200"
                >
                  View Documentation
                </a>
              </div>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="text-2xl font-bold text-blue-600">
                {categoryCounts["All"]}
              </div>
              <div className="text-sm text-gray-500 mt-1">Total FAQs</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="text-2xl font-bold text-green-600">
                {categories.length - 1}
              </div>
              <div className="text-sm text-gray-500 mt-1">Categories</div>
            </div>
            <div className="p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
              <div className="text-2xl font-bold text-purple-600">24/7</div>
              <div className="text-sm text-gray-500 mt-1">Support</div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
