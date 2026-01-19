import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsOfServiceProps {
  onBack: () => void;
}

export const TermsOfService: React.FC<TermsOfServiceProps> = ({ onBack }) => {
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
        
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <div className="prose prose-lg max-w-none text-gray-700 space-y-6">
          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing and using Adiology, you accept and agree to be bound by the terms and provision of this agreement.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">2. Use License</h2>
            <p>
              Permission is granted to temporarily download one copy of the materials (information or software) on Adiology
              for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title,
              and under this license you may not:
            </p>
            <ul className="list-disc pl-6 space-y-2">
              <li>Modify or copy the materials</li>
              <li>Use the materials for any commercial purpose or for any public display</li>
              <li>Attempt to decompile or reverse engineer any software contained on Adiology</li>
              <li>Remove or obscure any copyright or other proprietary notice</li>
              <li>Transfer the materials to another person or "mirror" the materials on any other server</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">3. Disclaimer</h2>
            <p>
              The materials on Adiology are provided on an 'as is' basis. Adiology makes no warranties, expressed or implied,
              and hereby disclaims and negates all other warranties including, without limitation, implied warranties or conditions
              of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">4. Limitations</h2>
            <p>
              In no event shall Adiology or its suppliers be liable for any damages (including, without limitation, damages for loss
              of data or profit, or due to business interruption) arising out of the use or inability to use the materials on Adiology.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">5. Accuracy of Materials</h2>
            <p>
              The materials appearing on Adiology could include technical, typographical, or photographic errors. Adiology does not
              warrant that any of the materials on Adiology are accurate, complete, or current. Adiology may make changes to the
              materials contained on Adiology at any time without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">6. Links</h2>
            <p>
              Adiology has not reviewed all of the sites linked to its website and is not responsible for the contents of any such
              linked site. The inclusion of any link does not imply endorsement by Adiology of the site. Use of any such linked website
              is at the user's own risk.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">7. Modifications</h2>
            <p>
              Adiology may revise these terms of service for its website at any time without notice. By using this website, you are
              agreeing to be bound by the then current version of these terms of service.
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
