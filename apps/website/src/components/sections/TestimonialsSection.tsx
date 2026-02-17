import { Container } from "../ui/Container";
import { SectionHeader } from "../ui/SectionHeader";
import { Quote, Star } from "lucide-react";
import { testimonials } from "@/data/testimonials";

export function TestimonialsSection() {
  return (
    <section className="py-16 lg:py-24 bg-white">
      <Container>
        <SectionHeader
          overline="Testimonials"
          title="Trusted by businesses like yours"
          subtitle="Hear from teams who transformed their operations with TradeFlow ERP."
        />

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className="relative rounded-xl border border-gray-200 p-6 lg:p-8"
            >
              <Quote className="h-8 w-8 text-primary-100 mb-4" />

              {/* Star rating */}
              <div className="flex gap-0.5 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 fill-yellow-400 text-yellow-400"
                  />
                ))}
              </div>

              <p className="text-gray-700 leading-relaxed mb-4">
                &ldquo;{t.quote}&rdquo;
              </p>

              {/* Metric badge */}
              <div className="mb-6">
                <span className="inline-block rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                  {t.metric}
                </span>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-sm font-bold text-primary-600">
                  {t.name.split(" ").map((n) => n[0]).join("")}
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-500">
                    {t.role}, {t.company}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
