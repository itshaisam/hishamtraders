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
  const [hidden, setHidden] = useState(false);
  const lastScrollY = useRef(0);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show/hide based on scroll direction
      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setHidden(true);
      } else {
        setHidden(false);
      }
      
      // Background change on scroll
      setScrolled(currentScrollY > 10);
      lastScrollY.current = currentScrollY;
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setActiveDropdown(null);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
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
    `transition-all duration-300 ease-out ${
      isOpen
        ? "opacity-100 visible translate-y-0 scale-100"
        : "opacity-0 invisible -translate-y-2 scale-95"
    }`;

  return (
    <nav
      ref={navRef}
      className={`
        fixed top-0 left-0 right-0 z-50 
        transition-all duration-300 ease-out
        ${scrolled 
          ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-gray-900/5 border-b border-gray-200/50" 
          : "bg-white border-b border-gray-200/80"
        }
        ${hidden ? "-translate-y-full" : "translate-y-0"}
      `}
    >
      <Container>
        <div className="flex items-center justify-between h-16 lg:h-18">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
            <div className="w-9 h-9 bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25 group-hover:shadow-xl group-hover:shadow-blue-500/30 transition-all duration-300 group-hover:scale-105">
              <span className="text-white font-bold text-sm">TF</span>
            </div>
            <span className="text-xl font-bold text-gray-900">
              Trade<span className="text-blue-600">Flow</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-1">
            {/* Product Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("product")}
                className={`
                  flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${activeDropdown === "product" 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                Product
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === "product" ? "rotate-180" : ""}`} />
              </button>

              <div
                className={`absolute top-full left-0 mt-2 w-[700px] bg-white rounded-2xl shadow-xl shadow-gray-900/10 border border-gray-200/80 p-6 -translate-x-1/4 origin-top-left ${dropdownTransition(activeDropdown === "product")}`}
              >
                <div className="grid grid-cols-2 gap-8">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Features</p>
                    <div className="space-y-1">
                      {productLinks.features.map((link) => {
                        const Icon = iconMap[link.icon];
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-start gap-3 rounded-xl p-3 hover:bg-blue-50/50 transition-all duration-200 group/item"
                          >
                            {Icon && (
                              <div className="w-10 h-10 rounded-xl bg-blue-50 group-hover/item:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
                                <Icon className="h-5 w-5 text-blue-600" />
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-semibold text-gray-900 group-hover/item:text-blue-600 transition-colors">{link.name}</p>
                              <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{link.description}</p>
                            </div>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Platform</p>
                    <div className="space-y-1">
                      {productLinks.platform.map((link) => {
                        const Icon = iconMap[link.icon];
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center gap-3 rounded-xl p-3 hover:bg-blue-50/50 transition-all duration-200 group/item"
                          >
                            {Icon && (
                              <div className="w-10 h-10 rounded-xl bg-gray-100 group-hover/item:bg-blue-100 flex items-center justify-center shrink-0 transition-colors">
                                <Icon className="h-5 w-5 text-gray-600 group-hover/item:text-blue-600 transition-colors" />
                              </div>
                            )}
                            <p className="text-sm font-semibold text-gray-900 group-hover/item:text-blue-600 transition-colors">{link.name}</p>
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
                className={`
                  flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${activeDropdown === "solutions" 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                Solutions
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === "solutions" ? "rotate-180" : ""}`} />
              </button>

              <div
                className={`absolute top-full left-0 mt-2 w-[600px] bg-white rounded-2xl shadow-xl shadow-gray-900/10 border border-gray-200/80 p-6 -translate-x-1/4 origin-top-left ${dropdownTransition(activeDropdown === "solutions")}`}
              >
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">By Role</p>
                    <div className="space-y-1">
                      {solutionLinks.byRole.map((link) => {
                        const Icon = iconMap[link.icon];
                        return (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setActiveDropdown(null)}
                            className="flex items-center gap-2.5 text-sm text-gray-700 hover:text-blue-600 py-2 px-2 rounded-lg hover:bg-blue-50/50 transition-all"
                          >
                            {Icon && <Icon className="h-4 w-4 text-gray-400" />}
                            {link.name}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">By Industry</p>
                    <div className="space-y-1">
                      {solutionLinks.byIndustry.map((link) => (
                        <Link 
                          key={link.href} 
                          href={link.href} 
                          onClick={() => setActiveDropdown(null)} 
                          className="block text-sm text-gray-700 hover:text-blue-600 py-2 px-2 rounded-lg hover:bg-blue-50/50 transition-all"
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">By Size</p>
                    <div className="space-y-1">
                      {solutionLinks.bySize.map((link) => (
                        <Link 
                          key={link.href} 
                          href={link.href} 
                          onClick={() => setActiveDropdown(null)} 
                          className="block text-sm text-gray-700 hover:text-blue-600 py-2 px-2 rounded-lg hover:bg-blue-50/50 transition-all"
                        >
                          {link.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pricing */}
            <Link 
              href="/pricing" 
              className="px-3 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-all duration-200"
            >
              Pricing
            </Link>

            {/* Resources Dropdown */}
            <div className="relative">
              <button
                onClick={() => toggleDropdown("resources")}
                className={`
                  flex items-center gap-1 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${activeDropdown === "resources" 
                    ? "text-blue-600 bg-blue-50" 
                    : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                  }
                `}
              >
                Resources
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${activeDropdown === "resources" ? "rotate-180" : ""}`} />
              </button>

              <div
                className={`absolute top-full right-0 mt-2 w-[240px] bg-white rounded-2xl shadow-xl shadow-gray-900/10 border border-gray-200/80 p-2 origin-top-right ${dropdownTransition(activeDropdown === "resources")}`}
              >
                <div className="space-y-0.5">
                  {resourceLinks.map((link) => (
                    <Link 
                      key={link.href} 
                      href={link.href} 
                      onClick={() => setActiveDropdown(null)} 
                      className="block text-sm text-gray-700 hover:text-blue-600 py-2.5 px-3 rounded-xl hover:bg-blue-50/50 transition-all"
                    >
                      {link.name}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop CTA */}
          <div className="hidden lg:flex items-center gap-3">
            <Link 
              href="/contact" 
              className="text-sm font-medium text-gray-700 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-50 transition-all"
            >
              Contact Sales
            </Link>
            <Button href="/signup" size="sm" className="shadow-lg shadow-blue-500/25">
              Start Free Trial
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 -mr-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 transition-colors"
          >
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </Container>

      {/* Mobile Menu Overlay */}
      <div className={`
        lg:hidden fixed inset-0 top-16 bg-white z-40 overflow-y-auto transition-all duration-300
        ${mobileOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"}
      `}>
        <div className="px-4 py-6 space-y-2">
          {/* Product Accordion */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => setMobileAccordion(mobileAccordion === "product" ? null : "product")}
              className="flex items-center justify-between w-full py-4 text-base font-semibold text-gray-900"
            >
              Product
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${mobileAccordion === "product" ? "rotate-180" : ""}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${mobileAccordion === "product" ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="pl-4 pb-4 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">Features</p>
                {productLinks.features.map((link) => {
                  const Icon = iconMap[link.icon];
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 text-sm text-gray-700 py-2"
                    >
                      {Icon && (
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-blue-600" />
                        </div>
                      )}
                      {link.name}
                    </Link>
                  );
                })}
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-3">Platform</p>
                {productLinks.platform.map((link) => {
                  const Icon = iconMap[link.icon];
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2.5 text-sm text-gray-700 py-2"
                    >
                      {Icon && (
                        <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                          <Icon className="h-4 w-4 text-gray-600" />
                        </div>
                      )}
                      {link.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Solutions Accordion */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => setMobileAccordion(mobileAccordion === "solutions" ? null : "solutions")}
              className="flex items-center justify-between w-full py-4 text-base font-semibold text-gray-900"
            >
              Solutions
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${mobileAccordion === "solutions" ? "rotate-180" : ""}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${mobileAccordion === "solutions" ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="pl-4 pb-4 space-y-2">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-2">By Role</p>
                {solutionLinks.byRole.map((link) => {
                  const Icon = iconMap[link.icon];
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center gap-2 text-sm text-gray-700 py-2"
                    >
                      {Icon && <Icon className="h-4 w-4 text-gray-400" />}
                      {link.name}
                    </Link>
                  );
                })}
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider pt-3">By Industry</p>
                {solutionLinks.byIndustry.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700 py-2">
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing */}
          <Link href="/pricing" onClick={() => setMobileOpen(false)} className="block py-4 text-base font-semibold text-gray-900 border-b border-gray-100">
            Pricing
          </Link>

          {/* Resources Accordion */}
          <div className="border-b border-gray-100">
            <button
              onClick={() => setMobileAccordion(mobileAccordion === "resources" ? null : "resources")}
              className="flex items-center justify-between w-full py-4 text-base font-semibold text-gray-900"
            >
              Resources
              <ChevronDown className={`h-5 w-5 text-gray-400 transition-transform duration-200 ${mobileAccordion === "resources" ? "rotate-180" : ""}`} />
            </button>
            <div className={`overflow-hidden transition-all duration-300 ${mobileAccordion === "resources" ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"}`}>
              <div className="pl-4 pb-4 space-y-2">
                {resourceLinks.map((link) => (
                  <Link key={link.href} href={link.href} onClick={() => setMobileOpen(false)} className="block text-sm text-gray-700 py-2">
                    {link.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>

          {/* Mobile CTAs */}
          <div className="pt-6 space-y-3">
            <Button href="/signup" className="w-full justify-center shadow-lg shadow-blue-500/25">
              Start Free Trial
            </Button>
            <Button href="/contact" variant="outline" className="w-full justify-center">
              Contact Sales
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
