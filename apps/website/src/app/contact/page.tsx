"use client";

import { useState } from "react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Mail, Phone, MapPin, MessageSquare } from "lucide-react";

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <>
      <section className="bg-white pt-12 pb-16 lg:pt-16 lg:pb-24">
        <Container>
          <div className="max-w-3xl mx-auto text-center mb-12 lg:mb-16">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Contact</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Get in touch
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              Have questions about TradeFlow ERP? Want to schedule a personalized demo? We&apos;d love to hear from you.
            </p>
          </div>

          <div className="grid lg:grid-cols-5 gap-12 lg:gap-16 max-w-5xl mx-auto">
            {/* Form */}
            <div className="lg:col-span-3">
              {submitted ? (
                <div className="rounded-xl border border-gray-200 p-8 text-center">
                  <div className="w-12 h-12 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-4">
                    <MessageSquare className="h-6 w-6 text-success" />
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">Message sent!</h2>
                  <p className="text-gray-600">We&apos;ll get back to you within 24 hours. Check your email for a confirmation.</p>
                </div>
              ) : (
                <form
                  onSubmit={(e) => { e.preventDefault(); setSubmitted(true); }}
                  className="space-y-5"
                >
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">Full Name</label>
                      <input id="name" type="text" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" placeholder="Ahmed Khan" />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
                      <input id="email" type="email" required className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" placeholder="ahmed@company.com" />
                    </div>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1.5">Company</label>
                      <input id="company" type="text" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" placeholder="Al-Noor Trading" />
                    </div>
                    <div>
                      <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
                      <input id="phone" type="tel" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none" placeholder="+92 300 1234567" />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="interest" className="block text-sm font-medium text-gray-700 mb-1.5">I&apos;m interested in</label>
                    <select id="interest" className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none bg-white">
                      <option>Product demo</option>
                      <option>Pricing information</option>
                      <option>Enterprise plan</option>
                      <option>Partnership</option>
                      <option>Technical support</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1.5">Message</label>
                    <textarea id="message" rows={4} className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500 outline-none resize-none" placeholder="Tell us about your business and what you're looking for..." />
                  </div>
                  <Button type="submit" size="lg" className="w-full sm:w-auto justify-center">
                    Send Message
                  </Button>
                </form>
              )}
            </div>

            {/* Contact Info */}
            <div className="lg:col-span-2 space-y-8">
              <div>
                <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">Contact Information</h3>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Email</p>
                      <p className="text-sm text-gray-600">hello@tradeflowerp.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Phone</p>
                      <p className="text-sm text-gray-600">+92 21 1234 5678</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="h-5 w-5 text-primary-600 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">Office</p>
                      <p className="text-sm text-gray-600">Karachi, Pakistan</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-gray-200 p-5 bg-gray-50">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">Schedule a Demo</h3>
                <p className="text-sm text-gray-600 mb-4">
                  See TradeFlow ERP in action with a personalized walkthrough tailored to your business.
                </p>
                <Button href="/signup" variant="outline" size="sm" className="w-full justify-center">
                  Request Demo
                </Button>
              </div>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
