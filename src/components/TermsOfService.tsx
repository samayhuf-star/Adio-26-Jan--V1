import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Footer } from './Footer';

interface TermsOfServiceProps {
  onBack: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
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

        <h1 className="text-4xl font-bold text-white mb-2">Terms of Service</h1>
        <p className="text-slate-400 mb-10">Adiology.io &mdash; Effective Date: February 12, 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By creating an account, accessing, or using Adiology.io, you agree to be bound by these Terms of Service. If you do not agree, you may not use the Service. These Terms constitute a legally binding agreement.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">2. Description of Service</h2>
            <p className="mb-2">Adiology.io provides search advertising intelligence tools including:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>12 proven campaign structure templates</li>
              <li>AI-powered keyword research and generation</li>
              <li>Click fraud detection and blocking</li>
              <li>Domain monitoring and SSL tracking</li>
              <li>Competitive intelligence via proxy email</li>
              <li>Campaign performance analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">3. User Accounts</h2>
            <h3 className="text-lg font-medium text-slate-200 mb-2">3.1 Eligibility</h3>
            <p className="mb-2">You must:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Be at least 18 years old</li>
              <li>Have legal capacity to enter binding contracts</li>
              <li>Provide accurate registration information</li>
              <li>Not be prohibited from using the Service</li>
            </ul>

            <h3 className="text-lg font-medium text-slate-200 mt-4 mb-2">3.2 Account Responsibilities</h3>
            <p className="mb-2">You are responsible for:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Maintaining confidentiality of your credentials</li>
              <li>All activities under your account</li>
              <li>Keeping contact information current</li>
              <li>Notifying us of unauthorized access</li>
              <li>Not sharing your account with others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">4. Acceptable Use</h2>
            <p className="mb-2">You agree NOT to:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Violate any laws or regulations</li>
              <li>Infringe intellectual property rights</li>
              <li>Attempt unauthorized access to systems</li>
              <li>Use the Service for illegal activities</li>
              <li>Reverse engineer or copy the Service</li>
              <li>Use bots or automated systems without permission</li>
              <li>Transmit viruses or malware</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Resell the Service without permission</li>
              <li>Send spam or unsolicited communications</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">5. Subscription and Billing</h2>
            <h3 className="text-lg font-medium text-slate-200 mb-2">5.1 Plan Types</h3>
            <p className="mb-2">We offer:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Monthly subscriptions (auto-renewing)</li>
              <li>Annual subscriptions (auto-renewing, discounted)</li>
              <li>Lifetime plans (one-time payment)</li>
            </ul>

            <h3 className="text-lg font-medium text-slate-200 mt-4 mb-2">5.2 Billing Terms</h3>
            <ul className="list-disc pl-6 space-y-1">
              <li>Subscription fees charged in advance</li>
              <li>Payments processed through Stripe</li>
              <li>Prices in USD unless specified</li>
              <li>You authorize charges on renewal dates</li>
              <li>Failed payments may suspend service</li>
              <li>Price changes with 30 days notice</li>
              <li>No partial refunds (except per Refund Policy)</li>
            </ul>

            <h3 className="text-lg font-medium text-slate-200 mt-4 mb-2">5.3 Cancellation</h3>
            <p>Cancel anytime through account settings. Cancellation takes effect at end of current billing period. You retain access until the paid period ends.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">6. Intellectual Property</h2>
            <h3 className="text-lg font-medium text-slate-200 mb-2">6.1 Our IP</h3>
            <p className="mb-2">All content, features, software, designs, and trademarks are owned by Adiology.io and protected by intellectual property laws.</p>
            <p className="mb-2">You may not:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Copy, modify, or create derivative works</li>
              <li>Remove copyright notices</li>
              <li>Use our trademarks without permission</li>
            </ul>

            <h3 className="text-lg font-medium text-slate-200 mt-4 mb-2">6.2 Your Content</h3>
            <p>You retain ownership of your data. You grant us a license to use, store, and process your content solely to provide the Service. This license terminates when you delete your content or account.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">7. Disclaimer of Warranties</h2>
            <p className="uppercase text-sm">The Service is provided &lsquo;as is&rsquo; without warranties of any kind, express or implied, including merchantability, fitness for purpose, or non-infringement. We do not warrant uninterrupted, error-free, or secure operation. Use at your sole risk.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">8. Limitation of Liability</h2>
            <p className="uppercase text-sm">To the maximum extent permitted by law, Adiology.io shall not be liable for indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or goodwill. Our total liability shall not exceed the amount you paid in the preceding 12 months, or $100, whichever is greater.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">9. Indemnification</h2>
            <p>You agree to indemnify and hold harmless Adiology.io from claims, losses, or expenses arising from: (a) your use of the Service; (b) violation of these Terms; (c) violation of third-party rights; or (d) your content.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">10. Termination</h2>
            <p>We may terminate or suspend your account immediately for Terms violations or harmful conduct. Upon termination, your right to use the Service ceases, but certain provisions survive (IP, liability, indemnification).</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">11. Governing Law</h2>
            <p>These Terms are governed by the laws of Delhi, India, without regard to conflict of law provisions. Any disputes shall be resolved in courts of Delhi, India.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">12. Changes to Terms</h2>
            <p>We reserve the right to modify these Terms. We will notify you via email or Service notice. Continued use after changes constitutes acceptance.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white mb-3">13. Contact</h2>
            <p className="mb-2">For questions about these Terms:</p>
            <ul className="list-none space-y-1">
              <li>Email: <a href="mailto:hello@adiology.io" className="text-indigo-400 hover:text-indigo-300">hello@adiology.io</a></li>
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
