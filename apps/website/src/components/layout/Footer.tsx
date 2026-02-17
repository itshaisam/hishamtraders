import Link from "next/link";
import { Container } from "../ui/Container";
import { footerLinks } from "@/data/navigation";

const columns = [
  { title: "Product", links: footerLinks.product },
  { title: "Solutions", links: footerLinks.solutions },
  { title: "Resources", links: footerLinks.resources },
  { title: "Company", links: footerLinks.company },
];

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <Container>
        {/* Main Footer */}
        <div className="py-16 lg:py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
                  {col.title}
                </h3>
                <ul className="space-y-3">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-400 hover:text-white transition-colors"
                      >
                        {link.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-800 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xs">TF</span>
            </div>
            <span className="text-sm font-semibold text-gray-300">
              Trade<span className="text-primary-400">Flow</span> ERP
            </span>
          </div>

          <p className="text-sm text-gray-500">
            &copy; {new Date().getFullYear()} TradeFlow ERP. All rights reserved.
          </p>

          <div className="flex items-center gap-6">
            <Link href="/legal/privacy" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Privacy
            </Link>
            <Link href="/legal/terms" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              Terms
            </Link>
            <Link href="/legal/sla" className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
              SLA
            </Link>
          </div>
        </div>
      </Container>
    </footer>
  );
}
