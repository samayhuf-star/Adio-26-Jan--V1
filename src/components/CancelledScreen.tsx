import { XCircle, RefreshCw } from 'lucide-react';

interface CancelledScreenProps {
  onResubscribe: () => void;
  onLogin: () => void;
}

export function CancelledScreen({ onResubscribe, onLogin }: CancelledScreenProps) {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 mb-6">
          <XCircle size={32} className="text-red-400" />
        </div>

        <h1 className="text-2xl font-bold text-white mb-3">Subscription Ended</h1>
        <p className="text-slate-400 text-sm mb-8 leading-relaxed">
          Your subscription has been cancelled and your access has ended.
          Resubscribe at any time to regain full access to all Adiology features.
        </p>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 mb-6">
          <h3 className="text-white font-semibold mb-3 text-sm">What you'll get back:</h3>
          <ul className="space-y-2 text-left">
            {[
              'Unlimited campaign building',
              'AI keyword & ad generation',
              'Google Ads Editor CSV export',
              'Click Guard fraud protection',
              'Domain monitoring',
              'All future updates',
            ].map(feature => (
              <li key={feature} className="flex items-center gap-2 text-slate-300 text-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
                {feature}
              </li>
            ))}
          </ul>
        </div>

        <button
          onClick={onResubscribe}
          className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold py-3 rounded-xl transition-all mb-4"
        >
          <RefreshCw size={16} />
          Resubscribe Now
        </button>

        <button
          onClick={onLogin}
          className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          Sign in with a different account
        </button>
      </div>
    </div>
  );
}
