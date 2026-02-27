import { useState } from 'react';
import { AlertTriangle, CreditCard, Loader2 } from 'lucide-react';

interface PastDueBannerProps {
  email: string;
}

export function PastDueBanner({ email }: PastDueBannerProps) {
  const [loading, setLoading] = useState(false);

  const handleUpdatePayment = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/stripe/portal', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ email, returnUrl: window.location.href }),
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      console.error('Portal error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full bg-red-500/10 border-b border-red-500/30 px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <AlertTriangle size={15} className="text-red-400 shrink-0" />
        <span className="text-red-200 text-sm">
          Your payment has failed. Please update your payment method to keep your access.
        </span>
      </div>
      <button
        onClick={handleUpdatePayment}
        disabled={loading}
        className="flex items-center gap-1.5 text-xs font-medium bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 hover:text-red-200 rounded-lg px-3 py-1.5 transition-all disabled:opacity-60"
      >
        {loading ? <Loader2 size={12} className="animate-spin" /> : <CreditCard size={12} />}
        {loading ? 'Loading...' : 'Update Payment Method'}
      </button>
    </div>
  );
}
