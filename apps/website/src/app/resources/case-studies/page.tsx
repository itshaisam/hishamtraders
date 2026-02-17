import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { FileText } from "lucide-react";

export const metadata: Metadata = {
  title: "Case Studies - TradeFlow ERP",
  description: "Read success stories from businesses that have transformed their operations with TradeFlow ERP.",
};

export default function CaseStudiesPage() {
  return (
    <section className="py-20 bg-gradient-to-b from-blue-50 to-white min-h-[70vh] flex items-center">
      <Container>
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-blue-100 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
            <FileText className="w-10 h-10 text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Case Studies Coming Soon
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            We're working on documenting success stories from our customers. Check back soon 
            to see how businesses like yours are transforming their operations with TradeFlow ERP.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/contact">
              <Button size="lg">
                Get Started Today
              </Button>
            </Link>
            <Link href="/resources">
              <Button variant="outline" size="lg">
                Back to Resources
              </Button>
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
