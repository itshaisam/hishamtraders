"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  Menu,
  X,
  ChevronDown,
  Package,
  ShoppingCart,
  FileText,
  Calculator,
  Route,
  BarChart3,
  Shield,
  Layers,
  Lock,
  Smartphone,
  Plug,
  Building2,
  Warehouse,
  TrendingUp,
} from "lucide-react";
import { Container } from "../ui/Container";
import { Button } from "../ui/Button";
import { productLinks, solutionLinks, resourceLinks } from "@/data/navigation";

const iconMap: Record<string, React.ElementType> = {
  Package,
  ShoppingCart,
  FileText,
  Calculator,
  Route,
  BarChart3,
  Shield,
  Layers,
  Lock,
  Smartphone,
  Plug,
  Building2,
  Warehouse,
  TrendingUp,
};

type DropdownKey = "product" | "solutions" | "resources" | null;

export function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<DropdownKey>(null);
  const [mobileAccordion, setMobileAccordion] = useState<DropdownKey>(null);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = mobileOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [mobileOpen]);

  const toggleDropdown = (key: DropdownKey) => {
    setActiveDropdown(activeDropdown === key ? null : key);
  };

  const dropdownTransition = (isOpen: boolean) =>
    `transition-all duration-200 ${
      isOpen
        ? "opacity-100 visible translate-y-0"
        : "opacity-0 invisible translate-y-2"
    }`;

  return (
    <nav
      ref={navRef}
      className={`fixed top-0 left-0 right-0 z-50 bg-white transition-shadow duration-200 ${
        scrolled ? "shadow-sm border-b border-gray-100" : "border-b border-gray-200"
      }`}
    >
      <Container>
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 bg-primary-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Trade<span className="text-primary-600">Flow</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Product Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("product")}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeDropdown === "product" ? "text-primary-600 bg-primary-50" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Product
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === "product" ? "rotate-180" : ""}`} />
              </button>

              <div
                className={`absolute top-full left-0 mt-1 w-[680px] bg-white rounded-xl shadow-lg border border-gray-200 p-6 -translate-x-1/4 ${dropdownTransition(activeDropdown === "product")}`}
              >
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Features</p>
                    <div className="space-y-1">
                      {productLinks.features.map((link) => {
                        const Icon = iconMap[link.icon];
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-start gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors"
                          >
                            {Icon && (
                              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                                <Icon className="h-5 w-5 text-primary-600" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{link.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5">{link.description}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Platform</p>
                    <div className="space-y-1">
                      {productLinks.platform.map((link) => {
                        const Icon = iconMap[link.icon];
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-gray-50 transition-colors"
                          >
                            {Icon && (
                              <div className="w-9 h-9 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                                <Icon className="h-5 w-5 text-primary-600" />
                              </div>
                            )}
                            <p className="text-sm font-medium text-gray-900">{link.name}</p>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Solutions Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("solutions")}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeDropdown === "solutions" ? "text-primary-600 bg-primary-50" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Solutions
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === "solutions" ? "rotate-180" : ""}`} />
              </button>

              <div
                className={`absolute top-full left-0 mt-1 w-[600px] bg-white rounded-xl shadow-lg border border-gray-200 p-6 -translate-x-1/4 ${dropdownTransition(activeDropdown === "solutions")}`}
              >
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">By Role</p>
                    <div className="space-y-1">
                      {solutionLinks.byRole.map((link) => {
                        const Icon = iconMap[link.icon];
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-primary-600 py-1.5 transition-colors"
                          >
                            {Icon && (
                              <Icon className="h-4 w-4 text-gray-400" />
                            )}
                            {link.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">By Industry</p>
                    <div className="space-y-1">
                      {solutionLinks.byIndustry.map((link) => (
                        <Link key={link.href} href={link.href} onClick={() => setActiveDropdown(null)} className="block text-sm text-gray-700 hover:text-primary-600 py-1.5 transition-colors">
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">By Size</p>
                    <div className="space-y-1">
                      {solutionLinks.bySize.map((link) => (
                        <Link key={link.href} href={link.href} onClick={() => setActiveDropdown(null)} className="block text-sm text-gray-700 hover:text-primary-600 py-1.5 transition-colors">
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <Link href="/pricing" className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors">
              Pricing
            </Link>

            {/* Resources Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("resources")}
                className={`flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  activeDropdown === "resources" ? "text-primary-600 bg-primary-50" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                }`}
              >
                Resources
                <ChevronDown className={`h-4 w-4 transition-transform ${activeDropdown === "resources" ? "rotate-180" : ""}`} />
              </button>

              <div
                className={`absolute top-full right-0 mt-1 w-[220px] bg-white rounded-xl shadow-lg border border-gray-200 p-4 ${dropdownTransition(activeDropdown === "resources")}`}
              >
                <div className="space-y-1">
                  {resourceLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setActiveDropdown(null)} className="block text-sm text-gray-700 hover:text-primary-600 py-1.5 transition-colors">
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link href="/contact" className="text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors">
              Contact Sales
            </Link>
            <Button href="/signup" size="sm">
              Start Free Trial
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </Container>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 top-16 bg-white z-40 overflow-y-auto">
          <div className="px-4 py-4 space-y-1">
            {/* Product Accordion */}
            <div>
              <button
                onClick={() => setMobileAccordion(mobileAccordion === "product" ? null : "product")}
                className="flex items-center justify-between w-full py-3 text-base font-medium text-gray-900"
              >
                Product
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${mobileAccordion === "product" ? "rotate-180" : ""}`} />
              </button>
              {mobileAccordion === "product" && (
                <div className="pl-4 pb-2 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">Features</p>
                  {productLinks.features.map((link) => {
                    const Icon = iconMap[link.icon];
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 text-sm text-gray-600 py-1.5"
                      >
                        {Icon && (
                          <div className="w-7 h-7 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-primary-600" />
                          </div>
                        )}
                        {link.name}
                      </Link>
                    );
                  })}
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">Platform</p>
                  {productLinks.platform.map((link) => {
                    const Icon = iconMap[link.icon];
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2.5 text-sm text-gray-600 py-1.5"
                      >
                        {Icon && (
                          <div className="w-7 h-7 rounded-md bg-primary-50 flex items-center justify-center shrink-0">
                            <Icon className="h-4 w-4 text-primary-600" />
                          </div>
                        )}
                        {link.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Solutions Accordion */}
            <div>
              <button
                onClick={() => setMobileAccordion(mobileAccordion === "solutions" ? null : "solutions")}
                className="flex items-center justify-between w-full py-3 text-base font-medium text-gray-900"
              >
                Solutions
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${mobileAccordion === "solutions" ? "rotate-180" : ""}`} />
              </button>
              {mobileAccordion === "solutions" && (
                <div className="pl-4 pb-2 space-y-2">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-1">By Role</p>
                  {solutionLinks.byRole.map((link) => {
                    const Icon = iconMap[link.icon];
                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        onClick={() => setMobileOpen(false)}
                        className="flex items-center gap-2 text-sm text-gray-600 py-1.5"
                      >
                        {Icon && (
                          <Icon className="h-4 w-4 text-gray-400" />
                        )}
                        {link.name}
                      </Link>
                    );
                  })}
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider pt-2">By Industry</p>
                  {solutionLinks.byIndustry.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 py-1.5">
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Pricing */}
            <Link href="/pricing" onClick={() => setMobileOpen(false)} className="block py-3 text-base font-medium text-gray-900">
              Pricing
            </Link>

            {/* Resources Accordion */}
            <div>
              <button
                onClick={() => setMobileAccordion(mobileAccordion === "resources" ? null : "resources")}
                className="flex items-center justify-between w-full py-3 text-base font-medium text-gray-900"
              >
                Resources
                <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform ${mobileAccordion === "resources" ? "rotate-180" : ""}`} />
              </button>
              {mobileAccordion === "resources" && (
                <div className="pl-4 pb-2 space-y-2">
                  {resourceLinks.map((link) => (
                    <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block text-sm text-gray-600 py-1.5">
                      {link.name}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile CTAs */}
            <div className="pt-4 space-y-3 border-t border-gray-200">
              <Button href="/signup" className="w-full justify-center">
                Start Free Trial
              </Button>
              <Button href="/contact" variant="outline" className="w-full justify-center">
                Contact Sales
              </Button>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
