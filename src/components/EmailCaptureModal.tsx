import { useState, useEffect, useRef } from 'react';
import { X, ArrowRight, Shield } from 'lucide-react';
import { captureLead } from '../utils/leadCapture';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailCaptureModalProps {
  onContinue: (email: string) => void;
  onClose: () => void;
}

export function EmailCaptureModal({ onContinue, onClose }: EmailCaptureModalProps) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const capturedRef = useRef(false);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const tryCapture = (val: string) => {
    const trimmed = val.trim().toLowerCase();
    if (!capturedRef.current && trimmed && EMAIL_RE.test(trimmed)) {
      capturedRef.current = true;
      captureLead(trimmed, 'homepage-popup');
    }
  };

  const handleBlur = () => tryCapture(email);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    setError('');
    if (EMAIL_RE.test(val.trim())) {
      tryCapture(val);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) { setError('Please enter your email address.'); return; }
    if (!EMAIL_RE.test(trimmed)) { setError('Please enter a valid email address.'); return; }
    tryCapture(trimmed);
    onContinue(trimmed);
  };

  const initials = email.trim().charAt(0).toUpperCase() || null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      <div className="relative w-full max-w-[400px] bg-[#1c1c1e] rounded-2xl shadow-2xl p-8 border border-white/8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-200 transition-colors rounded-lg p-1"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex justify-center mb-5">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <Shield className="w-7 h-7 text-white" strokeWidth={1.8} />
          </div>
        </div>

        <h2 className="text-2xl font-bold text-white text-center mb-2">
          Get started free
        </h2>
        <p className="text-sm text-gray-400 text-center mb-7">
          Enter your email to begin — no credit card required.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <input
              ref={inputRef}
              type="email"
              value={email}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="you@company.com"
              className={`w-full bg-[#2c2c2e] border ${
                error ? 'border-red-500' : 'border-white/10'
              } rounded-xl px-4 py-3 text-white placeholder:text-gray-500 text-sm outline-none focus:border-orange-500 transition-colors pr-12`}
            />
            {initials && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 w-7 h-7 rounded-md bg-violet-600 flex items-center justify-center text-white text-xs font-semibold">
                {initials}
              </div>
            )}
          </div>

          {error && (
            <p className="text-red-400 text-xs -mt-2">{error}</p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-lg shadow-orange-500/20 active:scale-[0.98]"
          >
            Continue
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-gray-500 mt-5">
          By continuing you agree to our{' '}
          <a href="/terms-of-service" target="_blank" className="underline hover:text-gray-300 transition-colors">
            Terms
          </a>{' '}
          and{' '}
          <a href="/privacy-policy" target="_blank" className="underline hover:text-gray-300 transition-colors">
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
}
