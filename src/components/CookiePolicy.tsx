import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface CookiePolicyProps {
  onBack: () => void;
}

export const CookiePolicy: React.FC<CookiePolicyProps> = ({ onBack }) => {
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
        
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Cookie Policy</h1>
        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. What Are Cookies?</h2>
            <p>
              Cookies are small data files that are placed on your computer or mobile device when you visit a website.
              They serve various purposes, including remembering login information and tracking user preferences.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Types of Cookies We Use</h2>
            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">Essential Cookies</h3>
            <p>
              These cookies are necessary for the website to function properly. They enable core functionality such as security,
              network management, and accessibility.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">Performance Cookies</h3>
            <p>
              These cookies collect information about how you use our website, such as which pages you visit and any errors you
              encounter. This information is used to improve website performance.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">Functional Cookies</h3>
            <p>
              These cookies allow the website to remember choices you make (such as your username, language, or the region you are
              in) and provide enhanced, more personal features.
            </p>
            
            <h3 className="text-xl font-semibold text-gray-900 mt-4 mb-2">Marketing Cookies</h3>
            <p>
              These cookies are used to track visitors across websites and display relevant advertisements to them based on their
              browsing history and interests.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Third-Party Cookies</h2>
            <p>
              We use third-party services that may place cookies on your device. These include analytics providers and advertising
              partners. You can control third-party cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Managing Cookies</h2>
            <p>
              You can control and manage cookies through your web browser settings. Most browsers allow you to refuse cookies or
              alert you when cookies are being sent. However, blocking cookies may affect website functionality.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Updates to This Policy</h2>
            <p>
              We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal,
              or regulatory reasons. We encourage you to review this policy regularly.
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
