import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { Check } from "lucide-react";

type CTABannerProps = {
  title?: string;
  subtitle?: string;
};

export function CTABanner({
  title = "Ready to transform your operations?",
  subtitle = "Start your 14-day free trial today. No credit card required.",
}: CTABannerProps) {
  return (
    <section className="bg-gray-900 py-16 lg:py-20">
      <Container className="text-center">
        <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
          {title}
        </h2>
        <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">
          {subtitle}
        </p>
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button href="/signup" size="lg">
            Start Free Trial
          </Button>
          <Button href="/contact" variant="outline" size="lg" className="border-gray-600 text-gray-300 hover:bg-gray-800 hover:text-white">
            Schedule a Demo
          </Button>
        </div>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-6 text-sm text-gray-400">
          {["14-day free trial", "No credit card required", "Cancel anytime"].map((text) => (
            <div key={text} className="flex items-center gap-2">
              <Check className="h-4 w-4 text-success" />
              <span>{text}</span>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}
