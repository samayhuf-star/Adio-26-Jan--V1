import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface GDPRComplianceProps {
  onBack: () => void;
}

export const GDPRCompliance: React.FC<GDPRComplianceProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        
        <h1 className="text-4xl font-bold text-gray-900 mb-8">GDPR Compliance</h1>
        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Our GDPR Commitment</h2>
            <p>
              Adiology is committed to compliance with the General Data Protection Regulation (GDPR) and respects your rights
              as a data subject. This document outlines our GDPR compliance practices.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Legal Basis for Processing</h2>
            <p>
              We process personal data based on the following legal grounds under GDPR Article 6:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Your explicit consent</li>
              <li>Performance of a contract with you</li>
              <li>Compliance with legal obligations</li>
              <li>Protection of vital interests</li>
              <li>Legitimate interests pursued by us or third parties</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Your GDPR Rights</h2>
            <p>Under GDPR, you have the following rights:</p>
            <ul className="list-disc pl-6 space-y-2">
              <li><strong>Right of Access:</strong> You can request a copy of your personal data</li>
              <li><strong>Right to Rectification:</strong> You can correct inaccurate data</li>
              <li><strong>Right to Erasure:</strong> You can request deletion of your data ("Right to be Forgotten")</li>
              <li><strong>Right to Restrict Processing:</strong> You can limit how we use your data</li>
              <li><strong>Right to Data Portability:</strong> You can receive your data in a structured format</li>
              <li><strong>Right to Object:</strong> You can object to certain processing activities</li>
              <li><strong>Rights Related to Automated Decision-Making:</strong> You have rights regarding profiling</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Data Protection Officer</h2>
            <p>
              For GDPR-related inquiries and to exercise your rights, please contact our Data Protection Officer at:
              dpo@adiology.com
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Data Transfers</h2>
            <p>
              If your data is transferred outside the EU/EEA, we ensure appropriate safeguards such as Standard Contractual
              Clauses or adequacy decisions are in place.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Data Breach Notification</h2>
            <p>
              In the event of a personal data breach, we will notify affected individuals and relevant authorities without
              undue delay, as required by GDPR Article 33.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Exercising Your Rights</h2>
            <p>
              To exercise any of your GDPR rights, please submit a request to dpo@adiology.com. We will respond to your request
              within 30 days. If you are not satisfied with our response, you have the right to lodge a complaint with your
              local data protection authority.
            </p>
          </section>

          <p className="text-sm text-gray-500 mt-12">
            Last updated: December 2025
          </p>
        </div>
      </div>
    </div>
  );
};
