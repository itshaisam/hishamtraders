"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { Container } from "../ui/Container";
import { SectionHeader } from "../ui/SectionHeader";
import { Button } from "../ui/Button";
import { ArrowRight } from "lucide-react";
import {
  WarehouseIcon,
  SalesIcon,
  InvoiceIcon,
  AccountingIcon,
  RecoveryIcon,
  AnalyticsIcon,
  SecurityIcon,
} from "../ui/Icons";
import { modules } from "@/data/features";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

const iconMap: Record<string, React.ElementType> = {
  Warehouse: WarehouseIcon,
  ShoppingCart: SalesIcon,
  Receipt: InvoiceIcon,
  Calculator: AccountingIcon,
  Route: RecoveryIcon,
  BarChart3: AnalyticsIcon,
  Shield: SecurityIcon,
};

const colorMap: Record<
  string,
  {
    bg: string;
    icon: string;
    badge: string;
    gradient: string;
    shadow: string;
    number: string;
    glow: string;
    shimmer: string;
    border: string;
    borderGlow: string;
  }
> = {
  Warehouse: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
    gradient: "from-blue-500/5 via-blue-500/2 to-indigo-500/5",
    shadow: "shadow-blue-500/10",
    number: "text-blue-600/20",
    glow: "group-hover:shadow-blue-500/25",
    shimmer: "from-transparent via-blue-400/20 to-transparent",
    border: "border-blue-200/50",
    borderGlow: "group-hover:border-blue-400/60",
  },
  ShoppingCart: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
    gradient: "from-emerald-500/5 via-emerald-500/2 to-teal-500/5",
    shadow: "shadow-emerald-500/10",
    number: "text-emerald-600/20",
    glow: "group-hover:shadow-emerald-500/25",
    shimmer: "from-transparent via-emerald-400/20 to-transparent",
    border: "border-emerald-200/50",
    borderGlow: "group-hover:border-emerald-400/60",
  },
  Receipt: {
    bg: "bg-violet-50",
    icon: "text-violet-600",
    badge: "bg-violet-100 text-violet-700",
    gradient: "from-violet-500/5 via-violet-500/2 to-purple-500/5",
    shadow: "shadow-violet-500/10",
    number: "text-violet-600/20",
    glow: "group-hover:shadow-violet-500/25",
    shimmer: "from-transparent via-violet-400/20 to-transparent",
    border: "border-violet-200/50",
    borderGlow: "group-hover:border-violet-400/60",
  },
  Calculator: {
    bg: "bg-orange-50",
    icon: "text-orange-600",
    badge: "bg-orange-100 text-orange-700",
    gradient: "from-orange-500/5 via-orange-500/2 to-amber-500/5",
    shadow: "shadow-orange-500/10",
    number: "text-orange-600/20",
    glow: "group-hover:shadow-orange-500/25",
    shimmer: "from-transparent via-orange-400/20 to-transparent",
    border: "border-orange-200/50",
    borderGlow: "group-hover:border-orange-400/60",
  },
  Route: {
    bg: "bg-rose-50",
    icon: "text-rose-600",
    badge: "bg-rose-100 text-rose-700",
    gradient: "from-rose-500/5 via-rose-500/2 to-red-500/5",
    shadow: "shadow-rose-500/10",
    number: "text-rose-600/20",
    glow: "group-hover:shadow-rose-500/25",
    shimmer: "from-transparent via-rose-400/20 to-transparent",
    border: "border-rose-200/50",
    borderGlow: "group-hover:border-rose-400/60",
  },
  BarChart3: {
    bg: "bg-indigo-50",
    icon: "text-indigo-600",
    badge: "bg-indigo-100 text-indigo-700",
    gradient: "from-indigo-500/5 via-indigo-500/2 to-blue-500/5",
    shadow: "shadow-indigo-500/10",
    number: "text-indigo-600/20",
    glow: "group-hover:shadow-indigo-500/25",
    shimmer: "from-transparent via-indigo-400/20 to-transparent",
    border: "border-indigo-200/50",
    borderGlow: "group-hover:border-indigo-400/60",
  },
  Shield: {
    bg: "bg-slate-100",
    icon: "text-slate-700",
    badge: "bg-slate-200 text-slate-700",
    gradient: "from-slate-500/5 via-slate-500/2 to-gray-500/5",
    shadow: "shadow-slate-500/10",
    number: "text-slate-600/20",
    glow: "group-hover:shadow-slate-500/25",
    shimmer: "from-transparent via-slate-400/20 to-transparent",
    border: "border-slate-300/50",
    borderGlow: "group-hover:border-slate-400/60",
  },
};

const defaultColor = {
  bg: "bg-blue-50",
  icon: "text-blue-600",
  badge: "bg-blue-100 text-blue-700",
  gradient: "from-blue-500/5 via-blue-500/2 to-indigo-500/5",
  shadow: "shadow-blue-500/10",
  number: "text-blue-600/20",
  glow: "group-hover:shadow-blue-500/25",
  shimmer: "from-transparent via-blue-400/20 to-transparent",
  border: "border-blue-200/50",
  borderGlow: "group-hover:border-blue-400/60",
};

// Staggered height pattern for visual interest
const getRowSpan = (index: number): string => {
  const pattern = [1, 2, 1, 1, 2, 1, 1];
  const span = pattern[index % pattern.length];
  return span === 2 ? "lg:row-span-2" : "";
};

// Count-up animation hook
function useCountUp(
  end: number,
  duration: number = 2000,
  start: boolean = false
): number {
  const [count, setCount] = useState(0);
  const frameRef = useRef<number>();

  useEffect(() => {
    if (!start) {
      setCount(0);
      return;
    }

    const startTime = performance.now();
    const startValue = 0;

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Easing function: easeOutExpo
      const easeOut = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
      const currentValue = Math.floor(startValue + (end - startValue) * easeOut);

      setCount(currentValue);

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(animate);
      }
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, duration, start]);

  return count;
}

// Metric badge with count-up animation
function MetricBadge({
  value,
  label,
  colors,
  isVisible,
}: {
  value: string;
  label: string;
  colors: (typeof colorMap)[string];
  isVisible: boolean;
}) {
  // Parse numeric value (e.g., "35%" -> 35, "24/7" -> 24)
  const numericMatch = value.match(/(\d+)/);
  const numericValue = numericMatch ? parseInt(numericMatch[1], 10) : 0;
  const suffix = value.replace(/\d+/, "");
  const count = useCountUp(numericValue, 2000, isVisible);

  return (
    <div
      className={`
        inline-flex items-center gap-2 
        text-sm font-semibold px-4 py-2 rounded-full 
        ${colors.badge}
        group-hover:shadow-lg group-hover:scale-105
        transition-all duration-300 mb-4
        border ${colors.border} ${colors.borderGlow}
      `}
    >
      <span className="font-bold text-base tabular-nums">
        {numericMatch ? `${count}${suffix}` : value}
      </span>
      <span className="font-normal opacity-80">{label}</span>
    </div>
  );
}

function FeatureCard({
  module,
  index,
}: {
  module: (typeof modules)[0];
  index: number;
}) {
  const { ref, isVisible } = useScrollAnimation<HTMLAnchorElement>({
    threshold: 0.1,
    rootMargin: "0px 0px -50px 0px",
  });

  const Icon = iconMap[module.icon] || Warehouse;
  const colors = colorMap[module.icon] || defaultColor;
  const rowSpan = getRowSpan(index);
  const number = String(index + 1).padStart(2, "0");

  // Calculate staggered animation delay
  const animationDelay = index * 120;
  const floatDelay = index * 0.5;

  return (
    <Link
      ref={ref}
      href={module.href}
      className={`
        group relative rounded-2xl 
        bg-gradient-to-br ${colors.gradient} via-white to-white
        p-6 flex flex-col
        hover:shadow-2xl ${colors.shadow} ${colors.glow}
        hover:-translate-y-2
        transition-all duration-500 ease-out
        ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}
        ${rowSpan}
        overflow-hidden
        border ${colors.border} ${colors.borderGlow}
        animate-float-card
      `}
      style={{
        transitionDelay: `${animationDelay}ms`,
        animationDelay: `${floatDelay}s`,
      }}
    >
      {/* Animated gradient border on hover */}
      <div
        className={`
          absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100
          bg-gradient-to-r from-transparent via-white/40 to-transparent
          animate-shimmer-border
          pointer-events-none z-20
        `}
      />

      {/* Shimmer sweep effect */}
      <div
        className={`
          absolute inset-0 -translate-x-full
          bg-gradient-to-r ${colors.shimmer}
          group-hover:translate-x-full
          transition-transform duration-1000 ease-in-out
          pointer-events-none z-10
        `}
      />

      {/* Number badge in corner */}
      <div
        className={`
          absolute top-4 right-4 
          text-5xl font-bold ${colors.number}
          leading-none select-none
          transition-all duration-500
          group-hover:scale-110 group-hover:opacity-80
          animate-pulse-subtle
        `}
      >
        {number}
      </div>

      {/* Ambient glow on hover */}
      <div
        className={`
          absolute -inset-px rounded-2xl opacity-0 group-hover:opacity-100
          bg-gradient-to-r ${colors.gradient}
          blur-xl transition-opacity duration-700
          pointer-events-none
        `}
      />

      {/* Icon container */}
      <div
        className={`
          relative w-14 h-14 rounded-2xl ${colors.bg} 
          flex items-center justify-center mb-5 
          group-hover:scale-110 group-hover:shadow-xl ${colors.shadow}
          transition-all duration-500 ease-out
          before:absolute before:inset-0 before:rounded-2xl
          before:bg-gradient-to-br before:from-white/50 before:to-transparent
          border ${colors.border}
        `}
      >
        <Icon
          className={`
            h-6 w-6 ${colors.icon} 
            transition-all duration-500 
            group-hover:scale-110 group-hover:rotate-6
            animate-float-icon
          `}
          style={{ animationDelay: `${floatDelay}s` }}
        />
      </div>

      <div className="flex-1 flex flex-col">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-300">
          {module.name}
        </h3>

        <p
          className={`
            text-sm text-gray-600 leading-relaxed mb-4 
            ${rowSpan.includes("row-span-2") ? "line-clamp-4" : "line-clamp-2"}
            transition-all duration-300
          `}
        >
          {module.description}
        </p>

        {module.metric && (
          <MetricBadge
            value={module.metric.value}
            label={module.metric.label}
            colors={colors}
            isVisible={isVisible}
          />
        )}

        <div className="mt-auto pt-2">
          <span
            className="
              inline-flex items-center text-sm font-medium text-blue-600 
              group-hover:text-blue-700 transition-all duration-300
            "
          >
            Learn more
            <ArrowRight
              className="
                ml-1.5 h-4 w-4 
                transition-all duration-300 
                group-hover:translate-x-1 group-hover:ml-2
              "
            />
          </span>
        </div>
      </div>

      {/* Bottom gradient accent */}
      <div
        className={`
          absolute bottom-0 left-0 right-0 h-1 
          bg-gradient-to-r ${colors.gradient.replace(/\/5/g, "/60")}
          transform scale-x-0 group-hover:scale-x-100
          transition-transform duration-500 origin-left
          rounded-b-2xl
        `}
      />
    </Link>
  );
}

export function FeatureGrid() {
  const { ref: headerRef, isVisible: headerVisible } = useScrollAnimation({
    threshold: 0.2,
  });

  const { ref: buttonRef, isVisible: buttonVisible } = useScrollAnimation({
    threshold: 0.2,
  });

  return (
    <section className="py-24 lg:py-32 bg-gradient-to-b from-white via-gray-50/30 to-gray-50/50 relative overflow-hidden">
      {/* Decorative grid pattern background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `
              linear-gradient(to right, #3b82f6 1px, transparent 1px),
              linear-gradient(to bottom, #3b82f6 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Radial gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, transparent 0%, rgba(255,255,255,0.8) 70%)",
          }}
        />

        {/* Floating orbs */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 rounded-full blur-3xl animate-float-orb" />
        <div className="absolute top-40 right-20 w-96 h-96 bg-violet-200/20 rounded-full blur-3xl animate-float-orb delay-1000" />
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-emerald-200/15 rounded-full blur-3xl animate-float-orb delay-2000" />
        <div className="absolute bottom-40 right-1/3 w-64 h-64 bg-orange-200/15 rounded-full blur-3xl animate-float-orb delay-3000" />

        {/* Subtle pulse circles */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-blue-100/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      <Container className="relative z-10">
        <div
          ref={headerRef}
          className={`
            transition-all duration-700 ease-out
            ${headerVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
        >
          <SectionHeader
            overline="Modules"
            title="Everything you need to run your business"
            subtitle="Seven integrated modules covering the complete business cycle — from procurement to accounting to recovery."
          />
        </div>

        {/* Grid with dynamic sizing */}
        <div
          className="
            grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 
            gap-5 lg:gap-6 
            auto-rows-[minmax(280px,auto)]
            lg:auto-rows-[minmax(260px,auto)]
          "
        >
          {modules.map((module, index) => (
            <FeatureCard key={module.id} module={module} index={index} />
          ))}
        </div>

        {/* Explore all modules button */}
        <div
          ref={buttonRef}
          className={`
            flex justify-center mt-16
            transition-all duration-700 ease-out
            ${buttonVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"}
          `}
          style={{ transitionDelay: "400ms" }}
        >
          <Button href="/product/features" size="lg">
            Explore all modules
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </Container>

    </section>
  );
}
