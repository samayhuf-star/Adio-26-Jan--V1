import React, { useState } from 'react';
import { SupportPanel } from './SupportPanel';
import { HelpSupport } from './HelpSupport';
import { Book, Headphones } from 'lucide-react';

export const SupportHelpCombined = () => {
  const [activeTab, setActiveTab] = useState<'docs' | 'support'>('docs');

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1 max-w-md mb-8">
        <button
          onClick={() => setActiveTab('docs')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'docs'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Book className="w-4 h-4" />
          Documentation
        </button>
        <button
          onClick={() => setActiveTab('support')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === 'support'
              ? 'bg-white text-indigo-700 shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          <Headphones className="w-4 h-4" />
          Support
        </button>
      </div>

      {activeTab === 'docs' ? <HelpSupport /> : <SupportPanel />}
    </div>
  );
};
