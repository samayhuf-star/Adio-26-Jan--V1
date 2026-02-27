import { useState } from 'react';
import { AlertTriangle, Loader2, CheckCircle2 } from 'lucide-react';

interface EmailVerificationBannerProps {
  email: string;
}

export function EmailVerificationBanner({ email }: EmailVerificationBannerProps) {
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleResend = async () => {
    setSending(true);
    setError('');
    try {
      const res = await fetch('/api/account/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (data.success) {
        setSent(true);
        setTimeout(() => setSent(false), 5000);
      } else {
        setError(data.error || 'Failed to send. Please try again.');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/30 px-4 py-2.5 flex items-center justify-center gap-3 flex-wrap">
      <div className="flex items-center gap-2">
        <AlertTriangle size={15} className="text-amber-400 shrink-0" />
        <span className="text-amber-200 text-sm">
          Your email is not verified. Please check your inbox and click the verification link.
        </span>
      </div>

      {!sent ? (
        <button
          onClick={handleResend}
          disabled={sending}
          className="flex items-center gap-1.5 text-xs font-medium bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 hover:text-amber-200 rounded-lg px-3 py-1.5 transition-all disabled:opacity-60"
        >
          {sending ? <Loader2 size={12} className="animate-spin" /> : null}
          {sending ? 'Sending...' : 'Resend Email'}
        </button>
      ) : (
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <CheckCircle2 size={13} />
          Verification email sent!
        </span>
      )}

      {error && <span className="text-xs text-red-400">{error}</span>}
    </div>
  );
}
