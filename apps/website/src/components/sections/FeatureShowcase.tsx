"use client";

import { useState, useEffect, useRef } from "react";
import { Container } from "../ui/Container";
import { Check, ChevronRight, Warehouse, ShoppingCart, Calculator } from "lucide-react";
import Link from "next/link";
import { InventoryMockup, SalesMockup, AccountingMockup } from "../mockups";

const mockupComponents = {
  inventory: InventoryMockup,
  sales: SalesMockup,
  accounting: AccountingMockup,
};

const tabs = [
  {
    id: "inventory",
    label: "Inventory",
    icon: Warehouse,
    overline: "Inventory & Warehouse",
    title: "Real-time visibility across every warehouse",
    description: "Track stock by warehouse, bin location, and batch number. Get automatic alerts for low stock and expiring products.",
    features: [
      "Multi-warehouse with bin location management",
      "Batch tracking with expiry alerts",
      "Automated gate pass system with approvals",
    ],
    href: "/product/features/inventory",
  },
  {
    id: "sales",
    label: "Sales",
    icon: ShoppingCart,
    overline: "Sales & Invoicing",
    title: "Create invoices in under 2 minutes",
    description: "Generate cash and credit invoices with automatic tax calculation, credit limit enforcement, and stock deduction.",
    features: [
      "Automatic credit limit checks and alerts",
      "Multi-line invoicing with dynamic tax rates",
      "Payment allocation across multiple invoices",
    ],
    href: "/product/features/sales",
  },
  {
    id: "accounting",
    label: "Accounting",
    icon: Calculator,
    overline: "Financial & Accounting",
    title: "Month-end reports in 5 minutes, not 5 days",
    description: "Double-entry bookkeeping with automated journal entries, bank reconciliation, and one-click financial reports.",
    features: [
      "Trial balance, P&L, and balance sheet in seconds",
      "Bank reconciliation with variance analysis",
      "Automated period-end closing with audit trail",
    ],
    href: "/product/features/accounting",
  },
];

export function FeatureShowcase() {
  const [activeTab, setActiveTab] = useState("inventory");
  const [isAnimating, setIsAnimating] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const handleTabChange = (tabId: string) => {
    if (tabId === activeTab) return;
    setIsAnimating(true);
    setTimeout(() => {
      setActiveTab(tabId);
      setIsAnimating(false);
    }, 150);
  };

  const activeData = tabs.find(t => t.id === activeTab)!;
  const MockupComponent = mockupComponents[activeTab as keyof typeof mockupComponents];

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-gray-50 overflow-hidden">
      <Container>
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2">Features</p>
          <h2 className="text-3xl lg:text-4xl font-bold text-gray-900">Everything you need to succeed</h2>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex bg-white p-1.5 rounded-xl shadow-sm border border-gray-200">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`
                    flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg transition-all duration-200
                    ${isActive 
                      ? "bg-gradient-to-r from-primary-600 to-primary-500 text-white shadow-lg shadow-blue-500/25" 
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                    }
                  `}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div 
          className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center transition-all duration-300 ${isAnimating ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'}`}
          style={{
            opacity: isVisible && !isAnimating ? 1 : isVisible ? 0 : 0,
            transform: isVisible && !isAnimating ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.4s ease, transform 0.4s ease",
          }}
        >
          {/* Text Content */}
          <div className="order-2 lg:order-1">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">
              {activeData.overline}
            </p>
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 tracking-tight">
              {activeData.title}
            </h3>
            <p className="mt-4 text-lg text-gray-600 leading-relaxed">
              {activeData.description}
            </p>
            <ul className="mt-6 space-y-3">
              {activeData.features.map((f) => (
                <li key={f} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center mt-0.5 shrink-0">
                    <Check className="h-3 w-3 text-primary-600" />
                  </div>
                  <span className="text-gray-700">{f}</span>
                </li>
              ))}
            </ul>
            <Link
              href={activeData.href}
              className="inline-flex items-center gap-1 mt-6 text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors group"
            >
              Learn more 
              <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Dashboard Mockup */}
          <div className="order-1 lg:order-2">
            <div className="relative">
              {/* Decorative glow */}
              <div className="absolute -inset-4 bg-gradient-to-r from-primary-500/10 to-violet-500/10 rounded-3xl blur-2xl opacity-60" />
              
              <div className="relative rounded-xl border border-gray-200 shadow-2xl shadow-gray-900/10 overflow-hidden bg-white">
                {/* Browser Chrome */}
                <div className="flex items-center gap-1.5 px-4 py-3 bg-gray-50 border-b border-gray-200">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-amber-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                  <div className="flex-1 mx-4">
                    <div className="bg-white border border-gray-200 rounded-md px-3 py-1 text-xs text-gray-400 max-w-xs mx-auto text-center">
                      app.tradeflowerp.com
                    </div>
                  </div>
                </div>
                <MockupComponent />
              </div>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
