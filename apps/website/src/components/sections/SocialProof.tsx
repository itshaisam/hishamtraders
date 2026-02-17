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

export function SocialProof() {
  return (
    <section className="bg-gray-50 border-y border-gray-200 py-8 overflow-hidden">
      <Container>
        <p className="text-center text-sm font-medium text-gray-500 mb-6">
          Trusted by leading importers and distributors
        </p>
      </Container>
      <div className="relative">
        <div className="absolute left-0 top-0 bottom-0 w-24 bg-linear-to-r from-gray-50 to-transparent z-10" />
        <div className="absolute right-0 top-0 bottom-0 w-24 bg-linear-to-l from-gray-50 to-transparent z-10" />
        <div className="flex animate-marquee whitespace-nowrap">
          {[...companies, ...companies].map((company, i) => (
            <div
              key={`${company.name}-${i}`}
              className="flex items-center justify-center mx-8 shrink-0"
            >
              <span className={`text-lg text-gray-400 select-none ${company.style}`}>
                {company.name}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
