import { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Service Level Agreement - TradeFlow ERP",
  description:
    "Our commitment to uptime, performance, and support for the TradeFlow ERP platform.",
};

export default function ServiceLevelAgreementPage() {
  return (
    <div className="bg-white py-16 sm:py-24">
      <Container className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Service Level Agreement
        </h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: February 2025</p>

        {/* Service Commitment */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Service Commitment</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          TradeFlow ERP is committed to providing a reliable, high-performance cloud platform for
          your business operations. We guarantee a monthly uptime of{" "}
          <strong className="text-gray-900">99.9%</strong> for all production services, measured on
          a calendar month basis. This commitment applies to all paid subscription plans.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          In the event that we fail to meet this commitment, eligible customers may receive service
          credits as described in this agreement.
        </p>

        {/* Uptime Calculation */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Uptime Calculation</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Monthly uptime is calculated as follows:
        </p>
        <p className="text-gray-600 leading-relaxed mb-4 bg-gray-50 rounded-lg p-4 font-mono text-sm">
          Uptime % = ((Total Minutes in Month - Downtime Minutes) / Total Minutes in Month) x 100
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          &quot;Downtime&quot; is defined as any period during which the Service is materially
          unavailable to users, as determined by our monitoring systems. Scheduled maintenance
          windows are excluded from downtime calculations.
        </p>

        {/* Scheduled Maintenance */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Scheduled Maintenance</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          To ensure the Service remains secure, up to date, and performing optimally, we schedule
          regular maintenance windows:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>
            <strong>Regular Window:</strong> Sundays, 2:00 AM - 6:00 AM PKT (Pakistan Standard
            Time)
          </li>
          <li>
            <strong>Advance Notice:</strong> We will provide at least 48 hours&apos; notice before
            any scheduled maintenance via email and in-app notification
          </li>
          <li>
            <strong>Emergency Maintenance:</strong> In rare cases, critical security patches or
            urgent fixes may require maintenance outside the regular window. We will provide as much
            advance notice as possible in such situations
          </li>
        </ul>
        <p className="text-gray-600 leading-relaxed mb-4">
          We strive to minimize disruption during maintenance windows and will complete maintenance
          as quickly as possible.
        </p>

        {/* Service Credits */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Service Credits</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          If we fail to meet our 99.9% uptime commitment in any given calendar month, you may be
          eligible for service credits applied to your next billing cycle. Credits are calculated as
          a percentage of your monthly subscription fee based on the actual uptime achieved:
        </p>
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden mb-6">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">
                Monthly Uptime
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">
                Service Credit
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-3 text-sm text-gray-600">99.0% - 99.9%</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                10% of monthly subscription fee
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-600">95.0% - 99.0%</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                25% of monthly subscription fee
              </td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm text-gray-600">Below 95.0%</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                50% of monthly subscription fee
              </td>
            </tr>
          </tbody>
        </table>
        <p className="text-gray-600 leading-relaxed mb-4">
          Service credits are capped at 50% of your monthly subscription fee and are your sole and
          exclusive remedy for any failure to meet the uptime commitment.
        </p>

        {/* Credit Request Process */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Credit Request Process</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          To request a service credit, you must:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>
            Submit a written request to support@tradeflowerp.com within 30 days of the end of the
            month in which the downtime occurred
          </li>
          <li>
            Include your account details, the dates and times of the downtime, and a description of
            the impact on your operations
          </li>
          <li>
            Allow up to 15 business days for us to review and verify the request against our
            monitoring records
          </li>
        </ul>
        <p className="text-gray-600 leading-relaxed mb-4">
          Approved credits will be applied automatically to your next billing cycle. Service credits
          are non-transferable and may not be redeemed for cash.
        </p>

        {/* Exclusions */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Exclusions</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          The uptime commitment and service credits do not apply to downtime caused by:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>
            <strong>Force Majeure:</strong> Natural disasters, wars, acts of terrorism, pandemics,
            government actions, or other events beyond our reasonable control
          </li>
          <li>
            <strong>Customer-Caused Issues:</strong> Misuse of the Service, misconfiguration of
            your account or integrations, or actions taken by your users that disrupt the Service
          </li>
          <li>
            <strong>Third-Party Services:</strong> Outages or performance issues caused by
            third-party services, internet service providers, DNS providers, or other external
            dependencies outside our control
          </li>
          <li>
            <strong>Scheduled Maintenance:</strong> Pre-announced maintenance windows as described
            in this agreement
          </li>
          <li>
            <strong>Beta or Preview Features:</strong> Any features, services, or products
            designated as beta, preview, or experimental
          </li>
        </ul>

        {/* Support Response Times */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Support Response Times</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We provide tiered support based on the severity of the issue. Response and resolution
          times are measured during business hours (Monday - Friday, 9:00 AM - 6:00 PM PKT), except
          for Critical (P1) issues which are supported 24/7.
        </p>
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden mb-6">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">
                Priority
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">
                Description
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">
                Response Time
              </th>
              <th className="text-left px-4 py-3 text-sm font-semibold text-gray-900">
                Resolution Target
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">Critical (P1)</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                Service completely unavailable or major data loss
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">1 hour</td>
              <td className="px-4 py-3 text-sm text-gray-600">4 hours</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">High (P2)</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                Major feature impaired with no workaround
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">4 hours</td>
              <td className="px-4 py-3 text-sm text-gray-600">8 hours</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">Medium (P3)</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                Feature impaired but workaround available
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">8 hours</td>
              <td className="px-4 py-3 text-sm text-gray-600">24 hours</td>
            </tr>
            <tr>
              <td className="px-4 py-3 text-sm font-medium text-gray-900">Low (P4)</td>
              <td className="px-4 py-3 text-sm text-gray-600">
                Minor issue or general inquiry
              </td>
              <td className="px-4 py-3 text-sm text-gray-600">24 hours</td>
              <td className="px-4 py-3 text-sm text-gray-600">72 hours</td>
            </tr>
          </tbody>
        </table>
        <p className="text-gray-600 leading-relaxed mb-4">
          Resolution targets represent our best-effort goals. Complex issues may require additional
          time, in which case we will provide regular status updates until resolution.
        </p>

        {/* Data Backup and Recovery */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">
          Data Backup and Recovery
        </h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We perform automated daily backups of all customer data to ensure business continuity and
          disaster recovery:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>
            <strong>Backup Frequency:</strong> Full daily backups performed during off-peak hours
          </li>
          <li>
            <strong>Retention Period:</strong> Backups are retained for 30 days on a rolling basis
          </li>
          <li>
            <strong>Storage:</strong> Backups are stored in geographically separate locations from
            the primary data center
          </li>
          <li>
            <strong>Recovery:</strong> In the event of data loss, we will initiate recovery from the
            most recent available backup. Recovery time will depend on the scope of the incident but
            is targeted within 4 hours for critical scenarios
          </li>
          <li>
            <strong>Testing:</strong> We regularly test backup restoration processes to ensure data
            integrity and recovery reliability
          </li>
        </ul>

        {/* Contact */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Contact</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          For questions about this Service Level Agreement, to report an incident, or to request a
          service credit, please contact us at:
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          TradeFlow ERP - Support Team
          <br />
          Karachi, Pakistan
          <br />
          Email:{" "}
          <a
            href="mailto:support@tradeflowerp.com"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            support@tradeflowerp.com
          </a>
        </p>
      </Container>
    </div>
  );
}
