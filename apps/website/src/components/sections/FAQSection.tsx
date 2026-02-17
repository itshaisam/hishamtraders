import { Container } from "../ui/Container";
import { SectionHeader } from "../ui/SectionHeader";
import { Accordion } from "../ui/Accordion";

type FAQSectionProps = {
  title?: string;
  subtitle?: string;
  items: { question: string; answer: string }[];
};

export function FAQSection({
  title = "Frequently asked questions",
  subtitle = "Everything you need to know about TradeFlow ERP.",
  items,
}: FAQSectionProps) {
  return (
    <section className="py-16 lg:py-24 bg-gray-50">
      <Container>
        <SectionHeader title={title} subtitle={subtitle} />
        <div className="max-w-3xl mx-auto">
          <Accordion items={items} />
        </div>
      </Container>
    </section>
  );
}
