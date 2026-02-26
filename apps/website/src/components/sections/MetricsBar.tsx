"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "../ui/Container";
import { ArrowUpRight } from "lucide-react";
import { TrendingUpIcon, PackageIcon, ZapIcon, ClockIcon } from "../ui/Icons";
import { heroMetrics } from "@/data/metrics";

const icons = [TrendingUpIcon, PackageIcon, ZapIcon, ClockIcon];
const gradients = [
  "from-blue-500 to-blue-600",
  "from-emerald-500 to-emerald-600", 
  "from-amber-500 to-amber-600",
  "from-violet-500 to-violet-600",
];

function useCountUp(target: number, suffix: string, isVisible: boolean) {
  const [display, setDisplay] = useState(`0${suffix}`);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(eased * target);
      setDisplay(`${current}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    }

    requestAnimationFrame(animate);
  }, [isVisible, target, suffix]);

  return display;
}

function MetricCard({ metric, icon: Icon, index, isVisible }: {
  metric: { value: string; label: string };
  icon: React.ElementType;
  index: number;
  isVisible: boolean;
}) {
  const numericValue = parseInt(metric.value.replace(/[^0-9]/g, ""), 10);
  const suffix = metric.value.replace(/[0-9]/g, "");
  const display = useCountUp(numericValue, suffix, isVisible);
  const gradient = gradients[index % gradients.length];

  return (
    <div
      className="group relative bg-white rounded-2xl p-6 border border-gray-200/80 hover:border-gray-300 hover:shadow-xl hover:shadow-gray-900/5 transition-all duration-300 hover:-translate-y-1"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: `all 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s`,
      }}
    >
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-4 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform duration-300`}>
        <Icon className="h-6 w-6 text-white" />
      </div>
      
      {/* Value */}
      <p className="text-4xl font-extrabold text-gray-900 tracking-tight">
        {display}
      </p>
      
      {/* Label */}
      <p className="mt-1 text-sm font-medium text-gray-500">
        {metric.label}
      </p>

      {/* Decorative corner */}
      <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
        <ArrowUpRight className="w-5 h-5 text-gray-300" />
      </div>
    </div>
  );
}

export function MetricsBar() {
  const sectionRef = useRef<HTMLElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-16 lg:py-24 bg-gradient-to-b from-white to-gray-50/50">
      <Container>
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-2">Results</p>
          <h2 className="text-3xl font-bold text-gray-900">Trusted by businesses worldwide</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {heroMetrics.map((metric, i) => (
            <MetricCard
              key={metric.label}
              metric={metric}
              icon={icons[i]}
              index={i}
              isVisible={isVisible}
            />
          ))}
        </div>
      </Container>
    </section>
  );
}
