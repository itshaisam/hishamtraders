"use client";

import Link from "next/link";
import { Container } from "../ui/Container";
import { footerLinks } from "@/data/navigation";
import { ArrowUpRight } from "lucide-react";
import { MailIcon, PhoneIcon, MapPinIcon } from "../ui/Icons";

const columns = [
  { title: "Product", links: footerLinks.product },
  { title: "Solutions", links: footerLinks.solutions },
  { title: "Resources", links: footerLinks.resources },
  { title: "Company", links: footerLinks.company },
];

export function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200">
      <Container>
        {/* Main Footer */}
        <div className="py-12 lg:py-16">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8 lg:gap-6">
            {/* Brand Column */}
            <div className="col-span-2 md:col-span-3 lg:col-span-2">
              <Link href="/" className="flex items-center gap-2.5 mb-4">
                <div className="w-9 h-9 bg-gradient-to-br from-primary-600 to-primary-700 rounded-xl flex items-center justify-center shadow-lg shadow-primary-500/25">
                  <span className="text-white font-bold text-sm">TF</span>
                </div>
                <span className="text-lg font-bold text-gray-900">
                  Trade<span className="text-primary-600">Flow</span>
                </span>
              </Link>
              <p className="text-sm text-gray-500 max-w-xs mb-6">
                The complete ERP solution for import and distribution businesses. Manage inventory, sales, accounting, and recovery in one platform.
              </p>
              
              {/* Contact Info */}
              <div className="space-y-3">
                <a href="mailto:hello@tradeflowerp.com" className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors group">
                  <MailIcon className="w-4 h-4" />
                  hello@tradeflowerp.com
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <a href="tel:+923001234567" className="flex items-center gap-2 text-sm text-gray-500 hover:text-primary-600 transition-colors group">
                  <PhoneIcon className="w-4 h-4" />
                  +92 300 123 4567
                  <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                </a>
                <div className="flex items-start gap-2 text-sm text-gray-500">
                  <MapPinIcon className="w-4 h-4 mt-0.5 shrink-0" />
                  Karachi, Pakistan
                </div>
              </div>
            </div>

            {/* Link Columns */}
            {columns.map((col) => (
              <div key={col.title}>
                <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider mb-4">
                  {col.title}
                </h3>
                <ul className="space-y-2.5">
                  {col.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm text-gray-500 hover:text-primary-600 transition-colors inline-flex items-center gap-1 group"
                      >
                        {link.name}
                        <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-gray-200 py-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm text-gray-400">
              &copy; {new Date().getFullYear()} TradeFlow ERP. All rights reserved.
            </p>

            <div className="flex items-center gap-6">
              <Link href="/legal/privacy" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/legal/terms" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                Terms of Service
              </Link>
              <Link href="/legal/sla" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
                SLA
              </Link>
            </div>
          </div>
        </div>
      </Container>
    </footer>
  );
}
