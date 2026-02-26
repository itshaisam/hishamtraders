"use client";

import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { Check, ArrowRight, Sparkles } from "lucide-react";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";

type CTABannerProps = {
  title?: string;
  subtitle?: string;
};

const checkItems = [
  "14-day free trial",
  "No credit card required",
  "Cancel anytime",
];

export function CTABanner({
  title = "Ready to transform your operations?",
  subtitle = "Start your 14-day free trial today. No credit card required.",
}: CTABannerProps) {
  const { ref, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section ref={ref} className="relative bg-gray-900 py-20 lg:py-28 overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-violet-600/20 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%23ffffff%22%20fill-opacity%3D%220.03%22%3E%3Cpath%20d%3D%22M36%2034v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6%2034v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6%204V0H4v4H0v2h4v4h2V6h4V4H6z%22%2F%3E%3C%2Fg%3E%3C%2Fg%3E%3C%2Fsvg%3E')]" />
      </div>

      <Container className="relative z-10">
        <div className="text-center max-w-3xl mx-auto">
          {/* Badge */}
          <div 
            className={`
              inline-flex items-center gap-2 px-4 py-2 rounded-full 
              bg-blue-500/10 border border-blue-500/20 mb-6
              transition-all duration-700
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm font-medium text-blue-200">
              Start your free trial today
            </span>
          </div>

          {/* Title */}
          <h2 
            className={`
              text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6
              transition-all duration-700 delay-100
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <span className="text-white">Ready to </span>
            <span className="text-gradient">transform</span>
            <br />
            <span className="text-white">your operations?</span>
          </h2>

          {/* Subtitle */}
          <p 
            className={`
              text-lg text-gray-400 max-w-2xl mx-auto mb-10
              transition-all duration-700 delay-200
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {subtitle}
          </p>

          {/* CTA Buttons */}
          <div 
            className={`
              flex flex-col sm:flex-row items-center justify-center gap-4 mb-10
              transition-all duration-700 delay-300
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            <Button
              href="/signup"
              size="lg"
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              href="/contact"
              variant="outline"
              size="lg"
              className="border-white/30 text-white hover:bg-white/10 hover:border-white/50"
            >
              Schedule a Demo
            </Button>
          </div>

          {/* Checkmarks */}
          <div 
            className={`
              flex flex-wrap items-center justify-center gap-6 text-sm
              transition-all duration-700 delay-400
              ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}
          >
            {checkItems.map((text) => (
              <div key={text} className="flex items-center gap-2 text-gray-400">
                <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="h-3 w-3 text-emerald-400" />
                </div>
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}
