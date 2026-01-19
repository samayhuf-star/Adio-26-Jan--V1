import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface RefundPolicyProps {
  onBack: () => void;
}

export const RefundPolicy: React.FC<RefundPolicyProps> = ({ onBack }) => {
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
        
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Refund Policy</h1>
        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Refund Eligibility</h2>
            <p>
              Customers may request a refund within 30 days of their initial subscription purchase. Refund requests must be
              submitted through your account settings or by contacting our support team.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Refund Process</h2>
            <p>
              Once a refund request is approved:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>We will process the refund within 5-10 business days</li>
              <li>The refund will be issued to the original payment method</li>
              <li>Your account access will be suspended until the refund is processed</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Non-Refundable Items</h2>
            <p>
              The following are non-refundable:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Services used beyond the 30-day window</li>
              <li>Promotional or discounted subscriptions</li>
              <li>Refund requests submitted more than 30 days after purchase</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Partial Refunds</h2>
            <p>
              For subscriptions with a duration longer than 30 days, we offer pro-rata refunds calculated based on the
              portion of the subscription period not yet utilized.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Annual Subscriptions</h2>
            <p>
              Annual subscriptions may be refunded within 60 days of purchase. After 60 days, refunds are not available, but
              you may cancel to prevent renewal.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Cancellation vs. Refund</h2>
            <p>
              Cancelling your subscription will prevent future charges but does not automatically trigger a refund.
              You must request a refund separately if you are within the refund window.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Special Circumstances</h2>
            <p>
              We reserve the right to process refunds on a case-by-case basis for special circumstances beyond the standard
              30-day window. Please contact our support team at support@adiology.com with details of your situation.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">8. Contact Support</h2>
            <p>
              For refund-related questions or to request a refund, contact our support team:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Email: support@adiology.com</li>
              <li>Response time: Within 24-48 hours</li>
            </ul>
          </section>

          <p className="text-sm text-gray-500 mt-12">
            Last updated: December 2025
          </p>
        </div>
      </div>
    </div>
  );
};
