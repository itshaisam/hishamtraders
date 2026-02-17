"use client";

import { useEffect, useRef, useState } from "react";
import { Container } from "../ui/Container";
import { TrendingUp, Package, Zap, Clock } from "lucide-react";
import { heroMetrics } from "@/data/metrics";

const icons = [TrendingUp, Package, Zap, Clock];

function useCountUp(target: number, suffix: string, isVisible: boolean) {
  const [display, setDisplay] = useState(`0${suffix}`);

  useEffect(() => {
    if (!isVisible) return;

    const duration = 2000;
    const startTime = performance.now();

    function animate(currentTime: number) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
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

function MetricItem({ metric, icon: Icon, index, isVisible }: {
  metric: { value: string; label: string };
  icon: React.ElementType;
  index: number;
  isVisible: boolean;
}) {
  const numericValue = parseInt(metric.value.replace(/[^0-9]/g, ""), 10);
  const suffix = metric.value.replace(/[0-9]/g, "");
  const display = useCountUp(numericValue, suffix, isVisible);

  return (
    <div
      className="text-center"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? "translateY(0)" : "translateY(20px)",
        transition: `all 0.6s ease ${index * 0.15}s`,
      }}
    >
      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-4">
        <Icon className="h-6 w-6 text-primary-400" />
      </div>
      <p className="text-4xl sm:text-5xl font-extrabold text-white">
        {display}
      </p>
      <p className="mt-2 text-sm font-medium text-gray-400">
        {metric.label}
      </p>
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
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="bg-gray-900 py-14 lg:py-20">
      <Container>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {heroMetrics.map((metric, i) => (
            <MetricItem
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
