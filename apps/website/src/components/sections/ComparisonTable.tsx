"use client";

import { Container } from "../ui/Container";
import { SectionHeader } from "../ui/SectionHeader";
import { Button } from "../ui/Button";
import { Check, X, ArrowRight, Sparkles } from "lucide-react";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";
import { useState, useEffect, useRef } from "react";
import {
  WarehouseIcon,
  InvoiceIcon,
  PackageIcon,
  AccountingIcon,
  RecoveryIcon,
  AnalyticsIcon,
  SecurityIcon,
  BellIcon,
  CreditCardIcon,
  WalletIcon,
  ClipboardIcon,
} from "../ui/Icons";

const features = [
  { icon: WarehouseIcon, label: "Multi-warehouse inventory tracking" },
  { icon: BellIcon, label: "Automatic stock level alerts" },
  { icon: PackageIcon, label: "Batch & bin location tracking" },
  { icon: InvoiceIcon, label: "Invoice generation in seconds" },
  { icon: CreditCardIcon, label: "Credit limit enforcement" },
  { icon: WalletIcon, label: "Payment allocation tracking" },
  { icon: AccountingIcon, label: "Double-entry bookkeeping" },
  { icon: AnalyticsIcon, label: "Bank reconciliation" },
  { icon: AnalyticsIcon, label: "One-click financial reports" },
  { icon: RecoveryIcon, label: "Field recovery tracking" },
  { icon: ClipboardIcon, label: "Complete audit trail" },
  { icon: SecurityIcon, label: "Role-based access control" },
];

// Animated checkmark component with SVG path animation
function AnimatedCheck({ delay = 0 }: { delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
      <svg
        ref={ref}
        className="w-4 h-4 text-white"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M5 12l5 5L20 7"
          style={{
            strokeDasharray: 30,
            strokeDashoffset: isVisible ? 0 : 30,
            transition: "stroke-dashoffset 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)",
          }}
        />
      </svg>
    </div>
  );
}

// Animated X mark component
function AnimatedX({ delay = 0 }: { delay?: number }) {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.disconnect();
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [delay]);

  return (
    <div className="flex-shrink-0 w-7 h-7 rounded-full bg-red-100 flex items-center justify-center">
      <svg
        ref={ref}
        className="w-4 h-4 text-red-500"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={3}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path
          d="M18 6L6 18"
          style={{
            strokeDasharray: 20,
            strokeDashoffset: isVisible ? 0 : 20,
            transition: "stroke-dashoffset 0.4s ease-out",
            transitionDelay: "0ms",
          }}
        />
        <path
          d="M6 6l12 12"
          style={{
            strokeDasharray: 20,
            strokeDashoffset: isVisible ? 0 : 20,
            transition: "stroke-dashoffset 0.4s ease-out",
            transitionDelay: "150ms",
          }}
        />
      </svg>
    </div>
  );
}

// VS Badge with pulse animation
function VSBadge({ visible }: { visible: boolean }) {
  return (
    <div
      className={`
        relative flex items-center justify-center z-20
        transition-all duration-700 ease-out
        ${visible ? "opacity-100 scale-100" : "opacity-0 scale-50"}
      `}
    >
      {/* Outer glow rings */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full blur-xl opacity-40 animate-pulse" />
      <div className="absolute -inset-2 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full blur-lg opacity-20 animate-ping" style={{ animationDuration: "3s" }} />
      
      {/* Main badge */}
      <div className="relative w-14 h-14 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40 border-4 border-white">
        <span className="text-white font-black text-lg italic">VS</span>
      </div>
    </div>
  );
}

// Feature row for side-by-side comparison
function FeatureRow({
  feature,
  index,
  visible,
}: {
  feature: (typeof features)[0];
  index: number;
  visible: boolean;
}) {
  return (
    <div
      className={`
        group grid grid-cols-1 lg:grid-cols-[1fr_auto_1fr] gap-4 lg:gap-6 items-center
        p-4 rounded-2xl transition-all duration-500 ease-out
        hover:bg-gray-50/80
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
      `}
      style={{ transitionDelay: `${200 + index * 60}ms` }}
    >
      {/* Spreadsheet side */}
      <div className="flex items-center justify-between lg:justify-end gap-4 order-2 lg:order-1">
        <span className="lg:hidden text-sm font-medium text-gray-500">Spreadsheets</span>
        <div className="flex items-center gap-3">
          <span className="hidden lg:block text-sm text-gray-500 text-right max-w-[200px]">
            {feature.label}
          </span>
          <AnimatedX delay={index * 60} />
        </div>
      </div>

      {/* Center - Feature icon (visible on desktop) */}
      <div className="hidden lg:flex justify-center order-2">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center group-hover:scale-110 group-hover:shadow-md transition-all duration-300">
          <feature.icon className="w-5 h-5 text-gray-400 group-hover:text-blue-500 transition-colors duration-300" />
        </div>
      </div>

      {/* TradeFlow side */}
      <div className="flex items-center gap-4 order-1 lg:order-3">
        <AnimatedCheck delay={index * 60 + 100} />
        <div className="flex items-center gap-3">
          <div className="lg:hidden w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-blue-50 flex items-center justify-center">
            <feature.icon className="w-5 h-5 text-blue-500" />
          </div>
          <span className="text-sm font-medium text-gray-700">{feature.label}</span>
        </div>
      </div>
    </div>
  );
}

// Interactive toggle view card
function ToggleViewCard({
  activeView,
  setActiveView,
  visible,
}: {
  activeView: "spreadsheets" | "tradeflow";
  setActiveView: (view: "spreadsheets" | "tradeflow") => void;
  visible: boolean;
}) {
  const isSpreadsheet = activeView === "spreadsheets";

  return (
    <div
      className={`
        relative rounded-3xl overflow-hidden shadow-2xl shadow-black/10
        transition-all duration-700 ease-out
        ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
      `}
      style={{ transitionDelay: "100ms" }}
    >
      {/* Background gradient */}
      <div
        className={`
          absolute inset-0 transition-all duration-700 ease-in-out
          ${isSpreadsheet ? "bg-gradient-to-br from-gray-100 to-gray-50" : "bg-gradient-to-br from-blue-600 to-blue-700"}
        `}
      />

      {/* Content */}
      <div className="relative p-6 lg:p-8">
        {/* Toggle buttons */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex p-1 rounded-full bg-white/20 backdrop-blur-sm">
            <button
              onClick={() => setActiveView("spreadsheets")}
              className={`
                relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
                ${isSpreadsheet ? "bg-white text-gray-700 shadow-lg" : "text-white/80 hover:text-white"}
              `}
            >
              Spreadsheets
            </button>
            <button
              onClick={() => setActiveView("tradeflow")}
              className={`
                relative px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-300
                ${!isSpreadsheet ? "bg-white text-blue-600 shadow-lg" : "text-white/80 hover:text-white"}
              `}
            >
              <span className="flex items-center gap-1.5">
                TradeFlow
                <Sparkles className="w-3.5 h-3.5" />
              </span>
            </button>
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-8">
          <div
            className={`
              inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4
              transition-all duration-500
              ${isSpreadsheet ? "bg-gray-200" : "bg-white/20"}
            `}
          >
            {isSpreadsheet ? (
              <svg className="w-8 h-8 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <path d="M3 9h18" />
                <path d="M9 21V9" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            )}
          </div>
          <h3
            className={`
              text-2xl font-bold mb-2 transition-colors duration-500
              ${isSpreadsheet ? "text-gray-700" : "text-white"}
            `}
          >
            {isSpreadsheet ? "Spreadsheets" : "TradeFlow ERP"}
          </h3>
          <p
            className={`
              text-sm transition-colors duration-500
              ${isSpreadsheet ? "text-gray-500" : "text-blue-100"}
            `}
          >
            {isSpreadsheet ? "Manual processes with limitations" : "All-in-one automated solution"}
          </p>
        </div>

        {/* Features list */}
        <div className="space-y-3 max-w-md mx-auto">
          {features.map((feature, index) => (
            <div
              key={feature.label}
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-all duration-500
                ${isSpreadsheet ? "bg-white/60" : "bg-white/10 backdrop-blur-sm"}
              `}
              style={{
                animation: visible ? `fadeInUp 0.5s ease-out ${index * 50}ms forwards` : "none",
                opacity: 0,
              }}
            >
              <div
                className={`
                  flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center
                  transition-colors duration-500
                  ${isSpreadsheet ? "bg-gray-200" : "bg-white/20"}
                `}
              >
                <feature.icon
                  className={`w-4 h-4 transition-colors duration-500 ${
                    isSpreadsheet ? "text-gray-400" : "text-white"
                  }`}
                />
              </div>
              <span
                className={`
                  flex-1 text-sm font-medium transition-colors duration-500
                  ${isSpreadsheet ? "text-gray-600" : "text-white"}
                `}
              >
                {feature.label}
              </span>
              {isSpreadsheet ? (
                <X className="w-5 h-5 text-red-400 flex-shrink-0" />
              ) : (
                <Check className="w-5 h-5 text-emerald-400 flex-shrink-0" strokeWidth={3} />
              )}
            </div>
          ))}
        </div>

        {/* Bottom message */}
        <div className="mt-8 text-center">
          <p
            className={`
              text-sm transition-colors duration-500
              ${isSpreadsheet ? "text-gray-500" : "text-blue-100"}
            `}
          >
            {isSpreadsheet
              ? "Limited scalability & prone to errors"
              : "Scale your business with confidence"}
          </p>
        </div>
      </div>


    </div>
  );
}

export function ComparisonTable() {
  const [activeView, setActiveView] = useState<"spreadsheets" | "tradeflow">("tradeflow");

  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.2,
  });

  const { ref: comparisonRef, isVisible: comparisonVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  });

  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation<HTMLDivElement>({
    threshold: 0.2,
  });

  return (
    <section className="py-20 lg:py-28 bg-gradient-to-b from-white via-gray-50/50 to-white relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-40 left-0 w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-3xl" />
        <div className="absolute bottom-40 right-0 w-[600px] h-[600px] bg-emerald-100/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-50/30 rounded-full blur-3xl" />
      </div>

      <Container className="relative z-10">
        {/* Section header */}
        <div
          ref={headerRef}
          className={`
            text-center max-w-3xl mx-auto mb-16
            transition-all duration-700 ease-out
            ${headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <SectionHeader
            overline="Why switch"
            title="Stop struggling with spreadsheets"
            subtitle="See why growing businesses are moving from manual processes to an integrated ERP solution."
          />
        </div>

        {/* Mobile: Interactive Toggle View */}
        <div className="lg:hidden mb-12">
          <ToggleViewCard
            activeView={activeView}
            setActiveView={setActiveView}
            visible={comparisonVisible}
          />
        </div>

        {/* Desktop: Side-by-side comparison */}
        <div ref={comparisonRef} className="hidden lg:block">
          {/* Column headers with VS badge */}
          <div className="grid grid-cols-[1fr_auto_1fr] gap-6 mb-8">
            {/* Spreadsheet header */}
            <div
              className={`
                flex items-center justify-end gap-4
                transition-all duration-700 ease-out
                ${comparisonVisible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}
              `}
            >
              <div className="text-right">
                <h3 className="text-xl font-bold text-gray-600">Spreadsheets</h3>
                <p className="text-sm text-gray-400">Manual processes</p>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                  <path d="M9 21V9" />
                </svg>
              </div>
            </div>

            {/* VS Badge */}
            <div className="flex items-center justify-center pt-4">
              <VSBadge visible={comparisonVisible} />
            </div>

            {/* TradeFlow header */}
            <div
              className={`
                flex items-center gap-4
                transition-all duration-700 ease-out
                ${comparisonVisible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}
              `}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/25">
                <svg className="w-7 h-7 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">TradeFlow ERP</h3>
                <p className="text-sm text-blue-600 font-medium">All-in-one solution</p>
              </div>
            </div>
          </div>

          {/* Features comparison */}
          <div className="bg-white/60 backdrop-blur-sm rounded-3xl border border-gray-100 shadow-xl shadow-gray-200/50 p-6">
            {features.map((feature, index) => (
              <FeatureRow
                key={feature.label}
                feature={feature}
                index={index}
                visible={comparisonVisible}
              />
            ))}
          </div>

          {/* Winner banner */}
          <div
            className={`
              mt-8 text-center
              transition-all duration-700 ease-out delay-700
              ${comparisonVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}
            `}
          >
            <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg shadow-emerald-500/25">
              <Check className="w-5 h-5" strokeWidth={3} />
              <span className="font-semibold">TradeFlow wins on all 12 features</span>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div
          ref={ctaRef}
          className={`
            flex flex-col items-center gap-6 mt-16
            transition-all duration-700 ease-out delay-500
            ${ctaVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Button href="/signup" size="lg" className="group">
              Switch to TradeFlow
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button href="/product/features" variant="outline" size="lg">
              Explore all features
            </Button>
          </div>

          <p className="text-sm text-gray-500 flex items-center gap-2">
            <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
            Free 14-day trial • No credit card required • Cancel anytime
          </p>
        </div>
      </Container>
    </section>
  );
}
