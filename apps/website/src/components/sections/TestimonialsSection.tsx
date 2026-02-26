"use client";

import { Container } from "../ui/Container";
import { SectionHeader } from "../ui/SectionHeader";
import { ArrowRight } from "lucide-react";
import { QuoteIcon, StarIcon } from "../ui/Icons";
import { testimonials } from "@/data/testimonials";
import { useScrollAnimation } from "@/lib/hooks/useScrollAnimation";
import { useState } from "react";
import { Button } from "../ui/Button";

function TestimonialCard({ 
  testimonial, 
  index,
  isVisible,
}: { 
  testimonial: typeof testimonials[0]; 
  index: number;
  isVisible: boolean;
}) {
  const initials = testimonial.name.split(" ").map((n) => n[0]).join("");
  
  return (
    <div
      className={`
        group relative rounded-2xl border border-gray-200/80 
        bg-white p-6 lg:p-8 
        hover:border-gray-300 hover:shadow-xl
        hover:-translate-y-1
        transition-all duration-500 ease-out
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${index * 150}ms` }}
    >
      {/* Quote icon */}
      <div className="relative mb-4">
        <QuoteIcon className="h-10 w-10 text-blue-100 group-hover:text-blue-200 transition-colors" />
      </div>

      {/* Star rating */}
      <div className="flex gap-0.5 mb-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <StarIcon
            key={i}
            className="h-4 w-4 text-amber-400"
            filled
          />
        ))}
      </div>

      {/* Quote text */}
      <p className="text-gray-700 leading-relaxed mb-6 text-[15px]">
        &ldquo;{testimonial.quote}&rdquo;
      </p>

      {/* Metric badge */}
      <div className="mb-6">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-4 py-1.5 text-xs font-semibold text-blue-700 border border-blue-100">
          {testimonial.metric}
        </span>
      </div>

      {/* Author */}
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center text-sm font-bold text-blue-600">
          {initials}
        </div>
        <div>
          <p className="text-sm font-semibold text-gray-900">{testimonial.name}</p>
          <p className="text-xs text-gray-500">
            {testimonial.role}, {testimonial.company}
          </p>
        </div>
      </div>
    </div>
  );
}

export function TestimonialsSection() {
  const { ref, isVisible } = useScrollAnimation(0.1);
  const [activeIndex, setActiveIndex] = useState(0);

  // Mobile carousel navigation
  const goToNext = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  return (
    <section className="py-20 lg:py-28 bg-white relative overflow-hidden">
      <Container>
        <div 
          ref={ref}
          className={`
            transition-all duration-700
            ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <SectionHeader
            overline="Testimonials"
            title="Trusted by businesses like yours"
            subtitle="Hear from teams who transformed their operations with TradeFlow ERP."
          />

          {/* Desktop Grid */}
          <div className="hidden md:grid md:grid-cols-3 gap-6 lg:gap-8">
            {testimonials.map((t, index) => (
              <TestimonialCard 
                key={t.name} 
                testimonial={t} 
                index={index}
                isVisible={isVisible}
              />
            ))}
          </div>

          {/* Mobile Carousel */}
          <div className="md:hidden">
            <div className="relative overflow-hidden">
              <div 
                className="flex transition-transform duration-500 ease-out"
                style={{ transform: `translateX(-${activeIndex * 100}%)` }}
              >
                {testimonials.map((t) => (
                  <div key={t.name} className="w-full flex-shrink-0 px-1">
                    <TestimonialCard 
                      testimonial={t} 
                      index={0}
                      isVisible={isVisible}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Mobile Navigation Dots */}
            <div className="flex justify-center gap-2 mt-6">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveIndex(index)}
                  className={`h-2 rounded-full transition-all duration-300 ${
                    activeIndex === index 
                      ? 'w-6 bg-blue-600' 
                      : 'w-2 bg-gray-300'
                  }`}
                />
              ))}
            </div>

            {/* Auto-advance button */}
            <button 
              onClick={goToNext}
              className="hidden"
            >
              Next
            </button>
          </div>

          {/* CTA Button */}
          <div className="flex justify-center mt-12">
            <Button 
              href="/case-studies" 
              variant="outline"
              className="group"
            >
              Read more stories
              <ArrowRight className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1" />
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
