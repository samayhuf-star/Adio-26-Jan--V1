import { useState } from 'react';
import { Eye, EyeOff, CheckCircle, User, Lock, ArrowRight, Sparkles, Loader2 } from 'lucide-react';

interface CompleteProfileProps {
  email: string;
  onComplete: (updatedUser: { full_name: string }) => void;
}

export function CompleteProfile({ email, onComplete }: CompleteProfileProps) {
  const [fullName, setFullName] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const passwordStrength = (pw: string) => {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
  };

  const strength = passwordStrength(password);
  const strengthLabel = ['', 'Weak', 'Fair', 'Good', 'Strong'][strength] || '';
  const strengthColor = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'][strength] || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Please enter your full name.');
      return;
    }
    if (password && password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const res = await fetch('/api/account/complete-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: fullName.trim(),
          password: password || undefined,
        }),
      });
      const data = await res.json();
      if (!data.success) {
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }

      const stored = localStorage.getItem('user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          user.full_name = data.user.full_name;
          user.name = data.user.full_name;
          localStorage.setItem('user', JSON.stringify(user));
        } catch {}
      }

      onComplete({ full_name: data.user.full_name });
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center px-4 py-12">
      {/* Glow */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gradient-radial from-violet-600/15 via-indigo-600/8 to-transparent rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-10">
          <div className="w-9 h-9 bg-gradient-to-br from-violet-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-violet-500/30">
            <span className="text-white font-black text-base">A</span>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">adiology</span>
        </div>

        {/* Card */}
        <div className="bg-slate-900/70 backdrop-blur-xl border border-slate-700/60 rounded-3xl p-8 shadow-2xl shadow-black/40">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-violet-500/20 to-indigo-600/20 border border-violet-500/30 rounded-2xl mb-4">
              <Sparkles className="w-7 h-7 text-violet-400" />
            </div>
            <h1 className="text-2xl font-black text-white mb-2">You're almost in!</h1>
            <p className="text-slate-400 text-sm leading-relaxed">
              Complete your profile to get started with your free trial.
            </p>
            <div className="mt-3 inline-flex items-center gap-1.5 bg-slate-800/60 border border-slate-700/50 rounded-full px-3 py-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></span>
              <span className="text-slate-400 text-xs font-medium">{email}</span>
            </div>
          </div>

          {error && (
            <div className="mb-5 flex items-start gap-3 bg-red-500/10 border border-red-500/30 rounded-xl p-3.5">
              <span className="text-red-400 text-sm leading-relaxed">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Full Name */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Full Name <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <User className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Jane Smith"
                  autoFocus
                  autoComplete="name"
                  className="w-full bg-slate-800/60 border border-slate-700/60 text-white placeholder-slate-500 rounded-xl py-3.5 pl-11 pr-4 text-sm outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-semibold text-slate-300 mb-2">
                Password{' '}
                <span className="text-slate-500 font-normal">(optional — set one for email login)</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="w-4 h-4 text-slate-500" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  autoComplete="new-password"
                  className="w-full bg-slate-800/60 border border-slate-700/60 text-white placeholder-slate-500 rounded-xl py-3.5 pl-11 pr-12 text-sm outline-none focus:border-violet-500/60 focus:ring-2 focus:ring-violet-500/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              {/* Strength meter */}
              {password.length > 0 && (
                <div className="mt-2 space-y-1.5">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((n) => (
                      <div
                        key={n}
                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${n <= strength ? strengthColor : 'bg-slate-700'}`}
                      />
                    ))}
                  </div>
                  <p className={`text-xs font-medium ${['', 'text-red-400', 'text-yellow-400', 'text-blue-400', 'text-emerald-400'][strength]}`}>
                    {strengthLabel}
                  </p>
                </div>
              )}
            </div>

            {/* Skip password note */}
            {!password && (
              <p className="text-slate-500 text-xs leading-relaxed bg-slate-800/40 rounded-xl p-3 border border-slate-700/40">
                You can always log in via magic link — no password needed. Set one if you prefer email + password login.
              </p>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !fullName.trim()}
              className="w-full flex items-center justify-center gap-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold py-3.5 rounded-xl text-sm transition-all duration-200 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Setting up your account…
                </>
              ) : (
                <>
                  Go to Dashboard
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Trial info */}
          <div className="mt-6 pt-5 border-t border-slate-800/60">
            <div className="space-y-2">
              {[
                'Your 7-day free trial starts now',
                'No credit card required',
                'Full access to all features',
              ].map((item) => (
                <div key={item} className="flex items-center gap-2.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                  <span className="text-slate-400 text-xs">{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
