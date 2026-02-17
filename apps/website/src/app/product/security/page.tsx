import { Metadata } from "next";
import { Container } from "@/components/ui/Container";
import { CTABanner } from "@/components/layout/CTABanner";
import { Shield, Lock, Eye, FileText, Server, UserCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "Security & Compliance",
  description: "TradeFlow ERP security features — role-based access, audit trails, encryption, and data protection for enterprise businesses.",
};

const features = [
  { icon: Lock, title: "256-bit SSL Encryption", description: "All data in transit is encrypted using industry-standard SSL/TLS protocols. Data at rest is protected with AES-256 encryption." },
  { icon: UserCheck, title: "Role-Based Access Control", description: "Five built-in roles (Admin, Warehouse Manager, Sales Officer, Accountant, Recovery Agent) with granular permissions." },
  { icon: Eye, title: "Complete Audit Trail", description: "Every action is logged with user identity, timestamp, IP address, and field-level change tracking. Audit logs are immutable." },
  { icon: FileText, title: "Change History & Versioning", description: "Snapshot-based versioning of all major entities. Compare versions side-by-side and restore previous states when needed." },
  { icon: Server, title: "99.9% Uptime SLA", description: "Hosted on redundant, enterprise-grade infrastructure with automatic failover, daily backups, and disaster recovery." },
  { icon: Shield, title: "Data Privacy", description: "Your data is isolated and never shared. We comply with international data protection standards and best practices." },
];

export default function SecurityPage() {
  return (
    <>
      <section className="bg-white pt-12 pb-16 lg:pt-16 lg:pb-20">
        <Container>
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mb-3">Security</p>
            <h1 className="text-4xl sm:text-5xl font-extrabold text-gray-900 tracking-tight">
              Enterprise-grade security you can trust
            </h1>
            <p className="mt-5 text-lg text-gray-600">
              Your business data deserves the highest level of protection. TradeFlow ERP is built with security at every layer.
            </p>
          </div>
        </Container>
      </section>

      <section className="py-16 lg:py-20 bg-gray-50">
        <Container>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {features.map((f) => (
              <div key={f.title} className="rounded-xl border border-gray-200 bg-white p-6">
                <div className="w-10 h-10 rounded-lg bg-primary-50 flex items-center justify-center mb-4">
                  <f.icon className="h-5 w-5 text-primary-600" />
                </div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{f.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Trust Badges */}
      <section className="py-14 bg-gray-900">
        <Container>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center">
            {[
              { value: "256-bit", label: "SSL Encryption" },
              { value: "99.9%", label: "Uptime SLA" },
              { value: "Daily", label: "Automated Backups" },
              { value: "100%", label: "Action Traceability" },
            ].map((badge) => (
              <div key={badge.label}>
                <p className="text-3xl font-extrabold text-white">{badge.value}</p>
                <p className="mt-1 text-sm text-gray-400">{badge.label}</p>
              </div>
            ))}
          </div>
        </Container>
      </section>

      <CTABanner />
    </>
  );
}
