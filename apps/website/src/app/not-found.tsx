import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <section className="bg-white min-h-[calc(100vh-4rem)] flex items-center py-16">
      <Container className="text-center">
        <p className="text-8xl font-extrabold text-primary-600">404</p>
        <h1 className="mt-4 text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Page not found
        </h1>
        <p className="mt-4 text-lg text-gray-600 max-w-md mx-auto">
          Sorry, we couldn&apos;t find the page you&apos;re looking for. It may
          have been moved or no longer exists.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
          <Button href="/" size="lg">
            Back to Home
          </Button>
          <Button href="/contact" variant="outline" size="lg">
            Contact Support
          </Button>
        </div>
      </Container>
    </section>
  );
}
