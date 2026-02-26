"use client";

import { Container } from "../ui/Container";

const companies = [
  { name: "Al-Noor Trading", style: "font-bold tracking-tight" },
  { name: "Karachi Steel", style: "font-black uppercase text-xs tracking-[0.2em]" },
  { name: "FastTrack", style: "font-bold italic" },
  { name: "United Imports", style: "font-extrabold" },
  { name: "QAMAR & SONS", style: "font-medium uppercase tracking-wider text-xs" },
  { name: "Star FMCG", style: "font-black" },
  { name: "PRIME", style: "font-bold uppercase tracking-[0.3em] text-xs" },
  { name: "Atlas Trading", style: "font-extrabold italic" },
];

const stats = [
  { value: "50+", label: "Businesses", description: "Trust TradeFlow" },
  { value: "10K+", label: "Users", description: "Daily active" },
  { value: "99.9%", label: "Uptime", description: "Guaranteed SLA" },
  { value: "24/7", label: "Support", description: "Always available" },
];

export function SocialProof() {
  return (
    <section className="bg-white border-y border-gray-200/60">
      {/* Logo Marquee */}
      <div className="py-10 overflow-hidden">
        <Container>
          <p className="text-center text-sm font-semibold text-gray-400 uppercase tracking-wider mb-8">
            Trusted by leading importers and distributors
          </p>
        </Container>
        
        <div className="relative group">
          {/* Gradient fades */}
          <div className="absolute left-0 top-0 bottom-0 w-32 bg-gradient-to-r from-white to-transparent z-10 pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-white to-transparent z-10 pointer-events-none" />
          
          {/* Marquee */}
          <div className="flex animate-marquee whitespace-nowrap hover:[animation-play-state:paused]">
            {[...companies, ...companies].map((company, i) => (
              <div
                key={`${company.name}-${i}`}
                className="flex items-center justify-center mx-10 shrink-0"
              >
                <span className={`text-lg text-gray-400 hover:text-gray-600 transition-colors duration-300 select-none ${company.style}`}>
                  {company.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Stats - Redesigned as horizontal cards */}
      <div className="border-t border-gray-200/60 bg-gradient-to-b from-gray-50/50 to-white">
        <Container>
          <div className="py-12">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {stats.map((stat, i) => (
                <div 
                  key={stat.label} 
                  className="group relative bg-white rounded-xl p-5 border border-gray-200/80 hover:border-primary-200 hover:shadow-lg hover:shadow-primary-500/5 transition-all duration-300"
                >
                  {/* Value */}
                  <div className="text-3xl font-extrabold text-gray-900 tracking-tight">
                    {stat.value}
                  </div>
                  
                  {/* Label */}
                  <div className="text-sm font-semibold text-gray-900 mt-1">
                    {stat.label}
                  </div>
                  
                  {/* Description */}
                  <div className="text-xs text-gray-500 mt-0.5">
                    {stat.description}
                  </div>

                  {/* Hover accent */}
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-500 to-primary-600 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-b-xl" />
                </div>
              ))}
            </div>
          </div>
        </Container>
      </div>
    </section>
  );
}
