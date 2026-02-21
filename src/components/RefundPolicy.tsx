import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Footer } from './Footer';

interface RefundPolicyProps {
  onBack: () => void;
}

export const RefundPolicy: React.FC<RefundPolicyProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-[#0f0d24] to-slate-950 text-slate-300">
      <div className="max-w-4xl mx-auto px-6 py-12">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>

        <h1 className="text-4xl font-bold text-white mb-2">Refund Policy</h1>
        <p className="text-slate-400 mb-10">Adiology.io &mdash; Effective Date: February 12, 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. 30-Day Money-Back Guarantee</h2>
            <p>We offer a 30-day money-back guarantee on all purchases. If you are not satisfied with Adiology.io, request a full refund within 30 days of purchase.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Refund Eligibility</h2>
            <p className="mb-2">Refunds available for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Monthly subscriptions (first month only)</li>
              <li>Lifetime deals (within 30 days)</li>
              <li>Annual plans (prorated after 30 days)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. Non-Refundable Items</h2>
            <p className="mb-2">Not eligible for refunds:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Requests made after 30 days</li>
              <li>Accounts terminated for Terms violations</li>
              <li>Third-party costs (Google Ads spend)</li>
              <li>Partial months or unused features (except first 30 days)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. How to Request a Refund</h2>
            <p className="mb-2">To request a refund:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Email <a href="mailto:refunds@adiology.io" className="text-indigo-400 hover:text-indigo-300">refunds@adiology.io</a></li>
              <li>Include account email and reason</li>
              <li>We process within 5-7 business days</li>
              <li>Refund to original payment method</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Refund Processing</h2>
            <p>Approved refunds credited to original payment method within 5-10 business days. You receive confirmation email once processed.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Subscription Cancellation</h2>
            <p>Cancel anytime through account settings. Cancellation takes effect at end of current billing period. No partial refunds for unused time, except within first 30 days.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Lifetime Deal Policy</h2>
            <p>Lifetime deals eligible for full refund within 30 days. After 30 days, lifetime deals are final and non-refundable.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Contact</h2>
            <p className="mb-2">Refund questions:</p>
            <ul className="list-none space-y-1">
              <li>Email: <a href="mailto:refunds@adiology.io" className="text-indigo-400 hover:text-indigo-300">refunds@adiology.io</a></li>
              <li>Support: <a href="mailto:support@adiology.io" className="text-indigo-400 hover:text-indigo-300">support@adiology.io</a></li>
              <li>Website: <a href="https://adiology.io" className="text-indigo-400 hover:text-indigo-300">https://adiology.io</a></li>
            </ul>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-slate-800 text-center text-sm text-slate-500">
          &copy; {new Date().getFullYear()} Adiology. All rights reserved.
        </div>
      </div>
      <Footer />
    </div>
  );
};
