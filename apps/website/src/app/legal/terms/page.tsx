import { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Terms of Service - TradeFlow ERP",
  description:
    "Read the terms and conditions governing your use of the TradeFlow ERP platform.",
};

export default function TermsOfServicePage() {
  return (
    <div className="bg-white py-16 sm:py-24">
      <Container className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Terms of Service
        </h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: February 2025</p>

        {/* Acceptance of Terms */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Acceptance of Terms</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          By accessing or using the TradeFlow ERP platform (&quot;Service&quot;), you agree to be
          bound by these Terms of Service (&quot;Terms&quot;). If you are entering into these Terms
          on behalf of a company or other legal entity, you represent that you have the authority to
          bind such entity to these Terms. If you do not agree to these Terms, you may not access or
          use the Service.
        </p>

        {/* Description of Service */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Description of Service</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          TradeFlow ERP is a cloud-based enterprise resource planning platform designed specifically
          for import and distribution businesses. The Service provides tools for inventory
          management, purchase order tracking, invoicing, financial reporting, warehouse management,
          and other business operations accessible via web browsers and supported devices.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          We reserve the right to modify, update, or discontinue features of the Service at any
          time. We will provide reasonable notice of any material changes that may affect your use of
          the Service.
        </p>

        {/* Account Registration and Security */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">
          Account Registration and Security
        </h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          To use the Service, you must create an account by providing accurate, complete, and current
          information. You are responsible for:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>Maintaining the confidentiality of your account credentials</li>
          <li>All activities that occur under your account</li>
          <li>Notifying us immediately of any unauthorized use of your account</li>
          <li>Ensuring that your account information remains accurate and up to date</li>
        </ul>
        <p className="text-gray-600 leading-relaxed mb-4">
          We reserve the right to suspend or terminate accounts that violate these Terms or that we
          reasonably believe have been compromised.
        </p>

        {/* Subscription and Billing */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Subscription and Billing</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Access to the Service requires a paid subscription. By subscribing, you agree to the
          following:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>
            Subscription fees are billed in advance on a monthly or annual basis, depending on your
            selected plan
          </li>
          <li>
            All fees are non-refundable except as expressly stated in these Terms or required by
            applicable law
          </li>
          <li>
            We may change subscription pricing with at least 30 days&apos; notice before your next
            billing cycle
          </li>
          <li>
            Failure to pay may result in suspension or termination of your access to the Service
          </li>
          <li>
            You are responsible for all applicable taxes associated with your subscription
          </li>
        </ul>

        {/* Acceptable Use Policy */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Acceptable Use Policy</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          You agree not to use the Service to:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>Violate any applicable laws, regulations, or third-party rights</li>
          <li>
            Upload or transmit malicious code, viruses, or any other harmful technology
          </li>
          <li>
            Attempt to gain unauthorized access to the Service, other accounts, or related systems
          </li>
          <li>Interfere with or disrupt the integrity or performance of the Service</li>
          <li>
            Reverse engineer, decompile, or disassemble any part of the Service
          </li>
          <li>
            Use the Service to store or process data that is illegal, fraudulent, or harmful
          </li>
          <li>
            Resell, sublicense, or share access to the Service without our prior written consent
          </li>
        </ul>

        {/* Intellectual Property */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Intellectual Property</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          The Service, including all software, design, text, graphics, logos, and other content, is
          the intellectual property of TradeFlow ERP and is protected by copyright, trademark, and
          other intellectual property laws. You are granted a limited, non-exclusive,
          non-transferable license to use the Service for your internal business purposes during the
          term of your subscription.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          You may not copy, modify, distribute, sell, or lease any part of the Service, nor may you
          reverse engineer or attempt to extract the source code of the software.
        </p>

        {/* Data Ownership */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Data Ownership</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          You retain all rights, title, and interest in and to the data you upload, enter, or
          generate through the Service (&quot;Your Data&quot;). TradeFlow ERP does not claim
          ownership over Your Data.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          You grant us a limited license to host, store, process, and display Your Data solely for
          the purpose of providing the Service to you. Upon termination of your account, we will
          provide a reasonable period for you to export Your Data. After this period, we may delete
          Your Data from our systems.
        </p>

        {/* Service Level and Uptime */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Service Level and Uptime</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We strive to maintain high availability of the Service. Our target uptime and service
          level commitments are detailed in our{" "}
          <a
            href="/legal/sla"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            Service Level Agreement (SLA)
          </a>
          . While we make commercially reasonable efforts to meet these commitments, we do not
          guarantee uninterrupted or error-free access to the Service.
        </p>

        {/* Limitation of Liability */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Limitation of Liability</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          To the maximum extent permitted by applicable law, TradeFlow ERP and its officers,
          directors, employees, and agents shall not be liable for any indirect, incidental, special,
          consequential, or punitive damages, including but not limited to loss of profits, data,
          business opportunities, or goodwill, arising out of or in connection with your use of the
          Service.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          Our total aggregate liability for any claims arising under these Terms shall not exceed the
          amount you paid to us for the Service during the twelve (12) months immediately preceding
          the event giving rise to the claim.
        </p>

        {/* Termination */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Termination</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Either party may terminate these Terms as follows:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>
            <strong>By You:</strong> You may cancel your subscription at any time through your
            account settings. Cancellation takes effect at the end of your current billing period.
          </li>
          <li>
            <strong>By Us:</strong> We may suspend or terminate your access immediately if you
            breach these Terms, fail to pay fees, or engage in activity that could harm the Service
            or other users.
          </li>
        </ul>
        <p className="text-gray-600 leading-relaxed mb-4">
          Upon termination, your right to use the Service ceases immediately. We will retain Your
          Data for a period of 30 days following termination, during which you may request an export.
          After this period, we reserve the right to permanently delete Your Data.
        </p>

        {/* Governing Law */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Governing Law</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          These Terms shall be governed by and construed in accordance with the laws of Pakistan,
          without regard to its conflict of law principles. Any legal proceedings arising out of or
          relating to these Terms shall be subject to the exclusive jurisdiction of the courts
          located in Karachi, Pakistan.
        </p>

        {/* Dispute Resolution */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Dispute Resolution</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          In the event of any dispute arising out of or in connection with these Terms, the parties
          agree to first attempt resolution through good-faith negotiation. If the dispute cannot be
          resolved through negotiation within 30 days, either party may submit the dispute to
          binding arbitration administered in accordance with the Arbitration Act 1940 of Pakistan.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          The arbitration shall be conducted in Karachi, Pakistan, in the English language. The
          arbitrator&apos;s decision shall be final and binding on both parties. Nothing in this
          section prevents either party from seeking injunctive or other equitable relief in a court
          of competent jurisdiction.
        </p>

        {/* Contact Us */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Contact Us</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          If you have any questions about these Terms of Service, please contact us at:
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          TradeFlow ERP
          <br />
          Karachi, Pakistan
          <br />
          Email:{" "}
          <a
            href="mailto:legal@tradeflowerp.com"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            legal@tradeflowerp.com
          </a>
        </p>
      </Container>
    </div>
  );
}
