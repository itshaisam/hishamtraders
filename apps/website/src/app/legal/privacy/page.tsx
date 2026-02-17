import { Metadata } from "next";
import { Container } from "@/components/ui/Container";

export const metadata: Metadata = {
  title: "Privacy Policy - TradeFlow ERP",
  description:
    "Learn how TradeFlow ERP collects, uses, and protects your personal information.",
};

export default function PrivacyPolicyPage() {
  return (
    <div className="bg-white py-16 sm:py-24">
      <Container className="max-w-3xl mx-auto">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-gray-900 tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-sm text-gray-500 mb-8">Last Updated: February 2025</p>

        {/* Introduction */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Introduction</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          TradeFlow ERP (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) is committed to
          protecting the privacy and security of your personal information. This Privacy Policy
          explains how we collect, use, disclose, and safeguard your information when you use our
          cloud-based ERP platform at tradeflowerp.com and any related services (collectively, the
          &quot;Service&quot;).
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          By accessing or using our Service, you agree to the collection and use of information in
          accordance with this policy. If you do not agree with the terms of this Privacy Policy,
          please do not access the Service.
        </p>

        {/* Information We Collect */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Information We Collect</h2>

        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Personal Information</h3>
        <p className="text-gray-600 leading-relaxed mb-4">
          When you register for an account or use our Service, we may collect the following personal
          information:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>Full name and job title</li>
          <li>Email address and phone number</li>
          <li>Company name, address, and business registration details</li>
          <li>Billing information and payment method details</li>
          <li>Login credentials (passwords are stored in encrypted form)</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Usage Data</h3>
        <p className="text-gray-600 leading-relaxed mb-4">
          We automatically collect certain information when you access and use the Service,
          including:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>IP address, browser type, and operating system</li>
          <li>Pages visited, features used, and time spent on the Service</li>
          <li>Device identifiers and device-specific information</li>
          <li>Referral URLs and navigation paths</li>
          <li>Error logs and performance data</li>
        </ul>

        <h3 className="text-lg font-semibold text-gray-900 mt-6 mb-2">Cookies</h3>
        <p className="text-gray-600 leading-relaxed mb-4">
          We use cookies and similar tracking technologies to enhance your experience. Cookies are
          small data files stored on your device that help us remember your preferences, understand
          how you use our Service, and improve its functionality. You can control cookie settings
          through your browser preferences.
        </p>

        {/* How We Use Your Information */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">
          How We Use Your Information
        </h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We use the information we collect for the following purposes:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>To provide, operate, and maintain the Service</li>
          <li>To process transactions and manage your subscription</li>
          <li>To personalize your experience and deliver relevant content</li>
          <li>To communicate with you about updates, security alerts, and support</li>
          <li>To monitor and analyze usage patterns to improve the Service</li>
          <li>To detect, prevent, and address technical issues or fraudulent activity</li>
          <li>To comply with legal obligations and enforce our terms</li>
        </ul>

        {/* Data Storage and Security */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">
          Data Storage and Security
        </h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We implement industry-standard security measures to protect your personal information,
          including encryption in transit (TLS/SSL) and at rest, access controls, regular security
          audits, and secure data center facilities. Your data is stored on secure cloud
          infrastructure with redundancy and backup systems.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          While we strive to use commercially acceptable means to protect your personal information,
          no method of transmission over the Internet or method of electronic storage is 100%
          secure. We cannot guarantee absolute security but are committed to promptly addressing
          any breaches in accordance with applicable laws.
        </p>

        {/* Third-Party Services */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Third-Party Services</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We may share your information with trusted third-party service providers who assist us in
          operating the Service, including:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>Cloud hosting and infrastructure providers</li>
          <li>Payment processors for subscription billing</li>
          <li>Analytics services to understand usage patterns</li>
          <li>Email delivery services for transactional communications</li>
          <li>Customer support tools</li>
        </ul>
        <p className="text-gray-600 leading-relaxed mb-4">
          These third parties are contractually obligated to protect your information and may only
          use it for the specific purposes we have engaged them for. We do not sell your personal
          information to any third party.
        </p>

        {/* Your Rights */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Your Rights</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Depending on your location, you may have the following rights regarding your personal
          information:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>
            <strong>Right of Access:</strong> You may request a copy of the personal information we
            hold about you.
          </li>
          <li>
            <strong>Right of Correction:</strong> You may request that we correct any inaccurate or
            incomplete personal information.
          </li>
          <li>
            <strong>Right of Deletion:</strong> You may request that we delete your personal
            information, subject to certain legal exceptions.
          </li>
          <li>
            <strong>Right of Portability:</strong> You may request a copy of your data in a
            structured, commonly used, machine-readable format.
          </li>
          <li>
            <strong>Right to Object:</strong> You may object to the processing of your personal
            information for certain purposes, including direct marketing.
          </li>
        </ul>
        <p className="text-gray-600 leading-relaxed mb-4">
          To exercise any of these rights, please contact us at privacy@tradeflowerp.com. We will
          respond to your request within 30 days.
        </p>

        {/* Cookies and Tracking */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Cookies and Tracking</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Our Service uses the following types of cookies:
        </p>
        <ul className="list-disc list-inside text-gray-600 space-y-2 mb-4">
          <li>
            <strong>Essential Cookies:</strong> Required for the Service to function properly,
            including authentication and session management.
          </li>
          <li>
            <strong>Analytics Cookies:</strong> Help us understand how visitors interact with the
            Service so we can improve the user experience.
          </li>
          <li>
            <strong>Preference Cookies:</strong> Remember your settings and preferences for future
            visits.
          </li>
        </ul>
        <p className="text-gray-600 leading-relaxed mb-4">
          You can instruct your browser to refuse all cookies or to indicate when a cookie is being
          sent. However, disabling essential cookies may affect the functionality of the Service.
        </p>

        {/* International Data Transfers */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">
          International Data Transfers
        </h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Your information may be transferred to and maintained on servers located outside of your
          country of residence. If you are accessing our Service from outside Pakistan, please be
          aware that your information may be transferred to, stored, and processed in Pakistan or
          other countries where our infrastructure or service providers are located.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          We take appropriate safeguards to ensure that your personal information remains protected
          in accordance with this Privacy Policy, regardless of where it is processed.
        </p>

        {/* Children's Privacy */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">
          Children&apos;s Privacy
        </h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          Our Service is not intended for individuals under the age of 18. We do not knowingly
          collect personal information from children. If we become aware that we have collected
          personal information from a child without parental consent, we will take steps to delete
          that information promptly.
        </p>

        {/* Changes to This Policy */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Changes to This Policy</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          We may update this Privacy Policy from time to time to reflect changes in our practices
          or for legal, operational, or regulatory reasons. We will notify you of any material
          changes by posting the updated policy on this page with a revised &quot;Last
          Updated&quot; date. We encourage you to review this Privacy Policy periodically.
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          Your continued use of the Service after any changes to this Privacy Policy constitutes
          your acceptance of the updated policy.
        </p>

        {/* Contact Us */}
        <h2 className="text-xl font-bold text-gray-900 mt-10 mb-4">Contact Us</h2>
        <p className="text-gray-600 leading-relaxed mb-4">
          If you have any questions or concerns about this Privacy Policy or our data practices,
          please contact us at:
        </p>
        <p className="text-gray-600 leading-relaxed mb-4">
          TradeFlow ERP
          <br />
          Karachi, Pakistan
          <br />
          Email:{" "}
          <a
            href="mailto:privacy@tradeflowerp.com"
            className="text-blue-600 hover:text-blue-700 underline"
          >
            privacy@tradeflowerp.com
          </a>
        </p>
      </Container>
    </div>
  );
}
