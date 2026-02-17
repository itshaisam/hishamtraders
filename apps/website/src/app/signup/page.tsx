"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Check, ArrowRight } from "lucide-react";

const benefits = [
  "Full access to all modules for 14 days",
  "No credit card required",
  "Import your existing data",
  "Dedicated onboarding support",
  "Cancel anytime",
];

export default function SignupPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <section className="bg-gray-50 min-h-[calc(100vh-4rem)] flex items-center py-12 lg:py-20">
      <Container>
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 max-w-5xl mx-auto items-center">
          {/* Left - Benefits */}
          <div>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight leading-tight">
              Start your free trial
            </h1>
            <p className="mt-4 text-lg text-gray-600">
              Get full access to TradeFlow ERP for 14 days. Set up your business, import your data, and see the difference.
            </p>
            <ul className="mt-8 space-y-4">
              {benefits.map((b) => (
                <li key={b} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-primary-100 flex items-center justify-center shrink-0">
                    <Check className="h-3 w-3 text-primary-600" />
                  </div>
                  <span className="text-gray-700">{b}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Right - Form */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 lg:p-8 shadow-sm">
            {submitted ? (
              <div className="text-center py-8">
                <div className="w-14 h-14 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                  <Check className="h-7 w-7 text-success" />
                </div>
                <h2 className="text-xl font-bold text-gray-900 mb-2">You&apos;re all set!</h2>
                <p className="text-gray-600 mb-6">Check your email for login instructions. We&apos;ll have you up and running in minutes.</p>
                <Button href="/" variant="outline">Back to Home</Button>
              </div>
            ) : (
              <form onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }} className="space-y-5">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Create your account</h2>
                  <p className="text-sm text-gray-500">14-day free trial. No credit card needed.</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                    <input id="name" type="text" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" />
                  </div>
                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1.5">Company Name</label>
                    <input id="company" type="text" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" />
                  </div>
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Work Email</label>
                  <input id="email" type="email" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone Number</label>
                  <input id="phone" type="tel" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" />
                </div>
                <div>
                  <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1.5">Company Size</label>
                  <select id="size" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-white">
                    <option>1-5 employees</option>
                    <option>6-20 employees</option>
                    <option>21-50 employees</option>
                    <option>51-100 employees</option>
                    <option>100+ employees</option>
                  </select>
                </div>
                <Button type="submit" size="lg" className="w-full justify-center">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <p className="text-xs text-center text-gray-500">
                  By signing up, you agree to our <a href="/legal/terms" className="underline">Terms</a> and <a href="/legal/privacy" className="underline">Privacy Policy</a>.
                </p>
              </form>
            )}
          </div>
        </div>
      </Container>
    </section>
  );
}
