import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { Footer } from './Footer';

interface CookiePolicyProps {
  onBack: () => void;
}

export const CookiePolicy: React.FC<CookiePolicyProps> = ({ onBack }) => {
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

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Cookie Policy</h1>
        <p className="text-gray-400 mb-10">Adiology.io &mdash; Effective Date: February 12, 2026</p>

        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. What Are Cookies</h2>
            <p>Cookies are small text files stored on your device when you visit our website. They help us provide a better user experience and analyze site usage.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Types of Cookies We Use</h2>

            <h3 className="text-lg font-medium text-gray-700 mb-2">2.1 Essential Cookies</h3>
            <p className="mb-2">Required for the Service to function:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Authentication tokens</li>
              <li>Session management</li>
              <li>Security features</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">2.2 Analytics Cookies</h3>
            <p className="mb-2">Help us understand user behavior:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Google Analytics (anonymized IP)</li>
              <li>Usage patterns and feature adoption</li>
              <li>Performance metrics</li>
            </ul>

            <h3 className="text-lg font-medium text-gray-700 mt-4 mb-2">2.3 Functional Cookies</h3>
            <p className="mb-2">Remember your preferences:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Language preferences</li>
              <li>Theme settings (light/dark mode)</li>
              <li>Display preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Third-Party Cookies</h2>
            <p className="mb-2">We use third-party services that may set cookies:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Google Analytics (analytics and performance)</li>
              <li>Stripe (payment processing)</li>
              <li>Vercel (hosting and CDN)</li>
              <li>Supabase (authentication)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Managing Cookies</h2>
            <p className="mb-3">You can control cookies through your browser settings. Most browsers allow you to refuse cookies or delete existing cookies. Note that disabling cookies may affect Service functionality.</p>
            <p className="mb-2">Browser instructions:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li><span className="text-slate-200">Chrome:</span> Settings &gt; Privacy and security &gt; Cookies</li>
              <li><span className="text-slate-200">Firefox:</span> Options &gt; Privacy &amp; Security &gt; Cookies</li>
              <li><span className="text-slate-200">Safari:</span> Preferences &gt; Privacy &gt; Cookies</li>
              <li><span className="text-slate-200">Edge:</span> Settings &gt; Privacy &gt; Cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Cookie Duration</h2>
            <p className="mb-2">Cookie lifespan:</p>
            <ul className="list-disc pl-6 space-y-1">
              <li>Session cookies: Deleted when you close browser</li>
              <li>Persistent cookies: Remain until expiration or deletion</li>
              <li>Authentication: 30 days</li>
              <li>Analytics: 2 years</li>
              <li>Preferences: 1 year</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Updates to This Policy</h2>
            <p>We may update this Cookie Policy. Changes will be posted on this page with an updated effective date.</p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Contact</h2>
            <p className="mb-2">Questions about cookies:</p>
            <ul className="list-none space-y-1">
              <li>Email: <a href="mailto:privacy@adiology.io" className="text-violet-600 hover:text-violet-700">privacy@adiology.io</a></li>
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
