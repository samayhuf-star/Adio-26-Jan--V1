import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Footer } from './Footer';

interface GDPRComplianceProps {
  onBack: () => void;
}

export const GDPRCompliance: React.FC<GDPRComplianceProps> = ({ onBack }) => {
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

        <h1 className="text-4xl font-bold text-gray-900 mb-2">GDPR Compliance Statement</h1>
        <p className="text-gray-400 mb-10">Adiology.io &mdash; Effective Date: February 12, 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Our Commitment</h2>
            <p>Adiology.io is committed to compliance with the General Data Protection Regulation (GDPR) for all users in the European Economic Area (EEA).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Legal Basis for Processing</h2>
            <p className="mb-2">We process personal data under:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><span className="text-slate-200">Consent:</span> You have given clear consent</li>
              <li><span className="text-slate-200">Contract:</span> Processing necessary to fulfill service agreement</li>
              <li><span className="text-slate-200">Legal obligation:</span> Required to comply with law</li>
              <li><span className="text-slate-200">Legitimate interests:</span> Fraud prevention, service improvement</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Your GDPR Rights</h2>
            <p className="mb-2">Under GDPR, you have the right to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><span className="text-slate-200">Access:</span> Request copies of your personal data</li>
              <li><span className="text-slate-200">Rectification:</span> Correct inaccurate data</li>
              <li><span className="text-slate-200">Erasure:</span> Request deletion of your data</li>
              <li><span className="text-slate-200">Restrict Processing:</span> Limit use of your data</li>
              <li><span className="text-slate-200">Data Portability:</span> Receive data in machine-readable format</li>
              <li><span className="text-slate-200">Object:</span> Object to processing based on legitimate interests</li>
              <li><span className="text-slate-200">Withdraw Consent:</span> Withdraw consent at any time</li>
            </ul>
            <p className="mt-3">To exercise these rights, contact <a href="mailto:dpo@adiology.io" className="text-violet-600 hover:text-violet-700">dpo@adiology.io</a>. We respond within 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Protection Officer</h2>
            <p className="mb-2">Contact our Data Protection Officer:</p>
            <ul className="list-none space-y-1">
              <li>Email: <a href="mailto:dpo@adiology.io" className="text-violet-600 hover:text-violet-700">dpo@adiology.io</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Transfers</h2>
            <p>We use Standard Contractual Clauses (SCCs) approved by the European Commission for data transfers outside the EEA to ensure adequate protection.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Data Breach Notification</h2>
            <p>In the event of a data breach, we notify affected users and relevant supervisory authorities within 72 hours as required by GDPR.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Supervisory Authority</h2>
            <p>You have the right to lodge a complaint with your local data protection authority if you believe we have not complied with GDPR.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Children&rsquo;s Data</h2>
            <p>We do not knowingly process data of children under 16. If you believe we have collected such data, contact us at <a href="mailto:dpo@adiology.io" className="text-violet-600 hover:text-violet-700">dpo@adiology.io</a> for immediate deletion.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Automated Decision-Making</h2>
            <p>We do not use automated decision-making or profiling that produces legal or similarly significant effects.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact</h2>
            <p className="mb-2">For GDPR inquiries:</p>
            <ul className="list-none space-y-1">
              <li>Email: <a href="mailto:dpo@adiology.io" className="text-violet-600 hover:text-violet-700">dpo@adiology.io</a></li>
              <li>Privacy: <a href="mailto:privacy@adiology.io" className="text-violet-600 hover:text-violet-700">privacy@adiology.io</a></li>
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
