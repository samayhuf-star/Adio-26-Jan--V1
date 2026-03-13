import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Footer } from './Footer';

interface PrivacyPolicyProps {
  onBack: () => void;
}

export const PrivacyPolicy: React.FC<PrivacyPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white text-gray-600">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-400 mb-10">Adiology.io &mdash; Effective Date: February 12, 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Introduction</h2>
            <p>
              Adiology.io (&lsquo;we&rsquo;, &lsquo;us&rsquo;, or &lsquo;our&rsquo;) operates adiology.io and provides search advertising intelligence tools. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Information We Collect</h2>
            <h3 className="text-lg font-medium text-gray-700 mb-2">2.1 Personal Information You Provide</h3>
            <p className="mb-2">We collect information you voluntarily provide:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Name and email address</li>
              <li>Account credentials (password)</li>
              <li>Payment information (processed securely through Stripe)</li>
              <li>Google Ads account data via OAuth</li>
              <li>Domain registration information</li>
              <li>Customer support correspondence</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">2.2 Automatically Collected Information</h3>
            <p className="mb-2">When you use our Service, we automatically collect:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>IP address and device information</li>
              <li>Browser type and operating system</li>
              <li>Pages visited and features used</li>
              <li>Campaign performance metrics</li>
              <li>Cookies and similar tracking technologies</li>
              <li>Error logs and diagnostic data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. How We Use Your Information</h2>
            <p className="mb-2">We use your information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Provide, maintain, and improve our Service</li>
              <li>Process payments and manage subscriptions</li>
              <li>Send transactional emails (receipts, updates, alerts)</li>
              <li>Provide customer support</li>
              <li>Monitor usage patterns and analytics</li>
              <li>Detect and prevent fraud, security issues</li>
              <li>Develop new features and services</li>
              <li>Comply with legal obligations</li>
              <li>Send marketing communications (with consent)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Sharing and Disclosure</h2>
            <p className="mb-4">We do not sell, rent, or trade your personal information.</p>
            <p className="mb-2">We may share your information with:</p>

            <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">4.1 Service Providers</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Supabase (database and authentication)</li>
              <li>Vercel (hosting and CDN)</li>
              <li>Stripe (payment processing)</li>
              <li>Google Cloud Platform (Google Ads API)</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">4.2 Legal Requirements</h3>
            <p className="mb-2">We may disclose information to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Comply with legal obligations or court orders</li>
              <li>Protect our rights, property, or safety</li>
              <li>Enforce our Terms of Service</li>
              <li>Investigate fraud or security incidents</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">4.3 Business Transfers</h3>
            <p>In case of merger, acquisition, or asset sale, your information may be transferred. We will notify you via email of any such change.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Security</h2>
            <p className="mb-2">We implement security measures including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Encryption in transit (TLS/SSL) and at rest (AES-256)</li>
              <li>Secure password hashing (bcrypt)</li>
              <li>Regular security audits</li>
              <li>Access controls and role-based permissions</li>
              <li>Monitoring for suspicious activity</li>
            </ul>
            <p className="mt-3">However, no method of Internet transmission is 100% secure. We cannot guarantee absolute security.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Access your personal data</li>
              <li>Correct inaccurate information</li>
              <li>Request deletion of your data</li>
              <li>Export your data (data portability)</li>
              <li>Opt out of marketing communications</li>
              <li>Restrict processing of your data</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact us at <a href="mailto:privacy@adiology.io" className="text-violet-600 hover:text-violet-700">privacy@adiology.io</a>. We will respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <p>We retain your information while your account is active or as needed to provide services. After account deletion, we anonymize or delete personal data within 90 days, except where required by law (e.g., tax records for 7 years).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. International Data Transfers</h2>
            <p>Your information may be transferred to countries outside your own. We use Standard Contractual Clauses (SCCs) for transfers outside the EEA to ensure adequate protection.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Children&rsquo;s Privacy</h2>
            <p>Our Service is not intended for children under 16. We do not knowingly collect information from children. If you believe a child has provided information, contact us at <a href="mailto:privacy@adiology.io" className="text-violet-600 hover:text-violet-700">privacy@adiology.io</a>.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Changes to This Policy</h2>
            <p>We may update this Privacy Policy. We will notify you of material changes via email or prominent notice on the Service. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">11. Contact Us</h2>
            <p className="mb-2">For privacy-related inquiries:</p>
            <ul className="list-none space-y-1">
              <li>Email: <a href="mailto:privacy@adiology.io" className="text-violet-600 hover:text-violet-700">privacy@adiology.io</a></li>
              <li>Data Protection Officer: <a href="mailto:dpo@adiology.io" className="text-violet-600 hover:text-violet-700">dpo@adiology.io</a></li>
              <li>Website: <a href="https://adiology.io" className="text-violet-600 hover:text-violet-700">https://adiology.io</a></li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Adiology. All rights reserved.
        </div>
      </div>
      <Footer />
    </div>
  );
};
