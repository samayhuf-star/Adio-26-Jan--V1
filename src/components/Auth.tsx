import React, { useState } from 'react';
import { AlertCircle, ArrowLeft, Sparkle, Shield, Rocket, Search, ShieldCheck, MailOpen, Globe, Mail, RefreshCw, Eye, EyeOff } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { sendMagicLink } from '../utils/auth';
import { notifications } from '../utils/notifications';
import { captureLead } from '../utils/leadCapture';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: object) => void;
          renderButton: (element: HTMLElement, config: object) => void;
          prompt: () => void;
          cancel: () => void;
        };
      };
    };
  }
}

interface AuthProps {
  onLoginSuccess: () => void;
  onSignupSuccess?: (userEmail: string, userName: string) => void;
  onBackToHome: () => void;
  onSignupRedirect?: () => void;
  initialMode?: 'login' | 'signup';
  isAdminLogin?: boolean;
  initialEmail?: string;
}

export const Auth: React.FC<AuthProps> = ({
  onLoginSuccess,
  onBackToHome,
  isAdminLogin = false,
  initialEmail = '',
}) => {
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [sentEmail, setSentEmail] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const googleButtonRef = React.useRef<HTMLDivElement>(null);
  const GOOGLE_CLIENT_ID = (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID || '';

  // Show error from URL ?error= param (e.g. when redirected from a failed magic link)
  React.useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const urlError = urlParams.get('error');
    if (urlError) {
      setError(decodeURIComponent(urlError));
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  // Auto-send magic link if email was pre-filled from homepage capture modal
  React.useEffect(() => {
    if (!initialEmail || isAdminLogin) return;
    const trimmed = initialEmail.trim();
    if (!trimmed || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return;
    setIsLoading(true);
    captureLead(trimmed, 'signup');
    sendMagicLink(trimmed).then(result => {
      if (result.error) {
        setError(result.error.message);
      } else {
        setSentEmail(trimmed);
        setMagicLinkSent(true);
        startResendCooldown();
        try { (window as any).gr?.('track', 'conversion', { email: trimmed }); } catch {}
      }
    }).catch(err => {
      setError(err.message || 'Something went wrong. Please try again.');
    }).finally(() => setIsLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle Google credential response
  const handleGoogleCredential = React.useCallback(async (response: { credential: string }) => {
    setGoogleLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/google', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: response.credential }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || 'Google sign-in failed');
      localStorage.setItem('auth_token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.user.id,
        email: data.user.email,
        name: data.user.full_name || '',
        full_name: data.user.full_name || '',
        avatar: data.user.avatar_url,
        role: data.user.role || 'user',
        subscription_plan: data.user.subscription_plan || 'free',
        subscription_status: data.user.subscription_status || 'trialing',
        card_validated: data.user.card_validated || false,
        selected_plan: data.user.selected_plan || null,
        email_confirmed_at: new Date().toISOString(),
        created: data.user.created_at,
      }));
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  }, [onLoginSuccess]);

  // Initialize Google Identity Services
  React.useEffect(() => {
    if (isAdminLogin || !GOOGLE_CLIENT_ID || magicLinkSent) return;

    const initGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential,
        auto_select: false,
        cancel_on_tap_outside: true,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        type: 'standard',
        shape: 'rectangular',
        theme: 'outline',
        text: 'continue_with',
        size: 'large',
        width: Math.min(googleButtonRef.current.offsetWidth || 400, 400),
        logo_alignment: 'left',
      });
    };

    if (window.google?.accounts?.id) {
      initGoogle();
    } else {
      const script = document.querySelector('script[src*="accounts.google.com/gsi/client"]');
      if (script) {
        script.addEventListener('load', initGoogle, { once: true });
        return () => script.removeEventListener('load', initGoogle);
      }
    }
  }, [isAdminLogin, GOOGLE_CLIENT_ID, magicLinkSent, handleGoogleCredential]);

  const startResendCooldown = () => {
    setResendCooldown(60);
    const interval = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) { setError('Please enter your email address.'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) { setError('Please enter a valid email address.'); return; }

    setIsLoading(true);
    setError('');

    try {
      captureLead(trimmed, 'signup');
      const result = await sendMagicLink(trimmed);
      if (result.error) {
        setError(result.error.message);
      } else {
        setSentEmail(trimmed);
        setMagicLinkSent(true);
        startResendCooldown();
        try { (window as any).gr?.('track', 'conversion', { email: trimmed }); } catch {}
      }
    } catch (err: any) {
      setError(err.message || 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    try {
      const result = await sendMagicLink(sentEmail);
      if (result.error) {
        notifications.error(result.error.message);
      } else {
        notifications.success('New magic link sent!');
        startResendCooldown();
      }
    } catch {
      notifications.error('Failed to resend. Please try again.');
    } finally {
      setIsResending(false);
    }
  };

  const handleAdminSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch('/api/superadmin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: email, password }),
      });
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Invalid admin credentials');
      }
      const data = await response.json();
      sessionStorage.setItem('superadmin_token', data.token);
      onLoginSuccess();
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Rocket, label: 'AI Campaign Builder', color: 'from-violet-500 to-indigo-600' },
    { icon: Search, label: 'Keyword Intelligence', color: 'from-blue-500 to-cyan-500' },
    { icon: ShieldCheck, label: 'Click Fraud Protection', color: 'from-amber-500 to-orange-600' },
    { icon: MailOpen, label: 'Proxy Mail', color: 'from-pink-500 to-rose-600' },
    { icon: Globe, label: 'Domain Monitor', color: 'from-purple-500 to-violet-600' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className={`hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden ${
        isAdminLogin
          ? 'bg-gradient-to-br from-slate-950 via-red-950 to-orange-950'
          : 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950'
      }`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse opacity-30 ${isAdminLogin ? 'bg-red-500' : 'bg-purple-500'}`} />
          <div className={`absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse opacity-20 ${isAdminLogin ? 'bg-orange-500' : 'bg-blue-500'}`} style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10">
          <button onClick={onBackToHome} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-12">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>
          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAdminLogin ? 'bg-gradient-to-br from-red-500 to-orange-600' : 'bg-gradient-to-br from-violet-500 to-indigo-600'}`}>
              {isAdminLogin ? <Shield className="w-5 h-5 text-white" /> : <Sparkle className="w-5 h-5 text-white" />}
            </div>
            <span className="text-xl font-bold text-white">Adiology</span>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center">
          <h1 className="text-4xl font-black text-white leading-tight mb-4">
            {isAdminLogin ? (
              <>System<br />Administration</>
            ) : (
              <>Ads made simple.<br /><span className="bg-gradient-to-r from-violet-400 to-indigo-400 bg-clip-text text-transparent">Results made powerful.</span></>
            )}
          </h1>
          <p className={`text-lg mb-10 ${isAdminLogin ? 'text-orange-200/70' : 'text-indigo-200/70'}`}>
            {isAdminLogin ? 'Authorized personnel only' : 'Launch Search Ads in minutes with AI-powered automation.'}
          </p>
          {!isAdminLogin && (
            <div className="space-y-3">
              {features.map((f, i) => (
                <div key={i} className="flex items-center gap-3 group">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg shrink-0`}>
                    <f.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-white/70 text-sm font-medium group-hover:text-white transition-colors">{f.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10">
          <p className="text-white/30 text-xs">&copy; 2026 Adiology. All rights reserved.</p>
        </div>
      </div>

      {/* Right Panel */}
      <div className={`flex-1 flex items-center justify-center p-6 sm:p-8 ${isAdminLogin ? 'bg-gray-50' : 'bg-white'}`}>
        <div className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden mb-8">
            <button onClick={onBackToHome} className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors text-sm mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </button>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isAdminLogin ? 'bg-gradient-to-br from-red-500 to-orange-600' : 'bg-violet-600'}`}>
                {isAdminLogin ? <Shield className="w-5 h-5 text-white" /> : <Sparkle className="w-5 h-5 text-white" />}
              </div>
              <span className="text-xl font-bold text-gray-900">Adiology</span>
            </div>
          </div>

          {isAdminLogin && (
            <div className="flex items-center gap-2 mb-6">
              <div className="px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-semibold text-red-400 uppercase tracking-wider">Admin Console</span>
                </div>
              </div>
            </div>
          )}

          {/* ── Check Email Screen ── */}
          {magicLinkSent && !isAdminLogin ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-violet-900/30">
                  <Mail className="w-9 h-9 text-white" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Check your inbox</h2>
                <p className="text-gray-500 text-sm">We sent a sign-in link to</p>
                <p className="text-gray-900 font-semibold mt-1 break-all">{sentEmail}</p>
              </div>
              <div className="bg-violet-50 border border-violet-200 rounded-xl p-4">
                <p className="text-violet-700 text-sm leading-relaxed">
                  Click the link in your email to instantly sign in — no password needed. The link expires in <strong>1 hour</strong>.
                </p>
              </div>
              <div className="space-y-3">
                <button
                  onClick={handleResend}
                  disabled={resendCooldown > 0 || isResending}
                  className={`w-full h-11 text-sm font-medium rounded-xl transition-all border flex items-center justify-center gap-2 ${
                    resendCooldown > 0 || isResending
                      ? 'bg-gray-50 text-gray-400 border-gray-200 cursor-not-allowed'
                      : 'bg-white text-violet-600 border-violet-300 hover:bg-violet-50'
                  }`}
                >
                  {isResending ? (
                    <><RefreshCw className="w-4 h-4 animate-spin" /> Sending...</>
                  ) : resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    'Resend link'
                  )}
                </button>
                <button
                  onClick={() => { setMagicLinkSent(false); setEmail(''); setSentEmail(''); setError(''); setResendCooldown(0); }}
                  className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors py-2"
                >
                  ← Use a different email
                </button>
              </div>
              <p className="text-xs text-gray-400">Can't find it? Check your spam folder.</p>
            </div>

          ) : isAdminLogin ? (
            /* ── Admin Login ── */
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Admin Sign In</h2>
                <p className="text-gray-500 text-sm">Enter your administrator credentials</p>
              </div>
              <form onSubmit={handleAdminSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="border-red-500/30 bg-red-500/10">
                    <AlertCircle className="w-4 h-4 text-red-400" />
                    <AlertDescription className="text-red-600 font-medium text-sm">{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="admin-email" className="text-gray-700 font-medium text-sm">Username / Email</Label>
                  <Input
                    id="admin-email"
                    type="text"
                    placeholder="admin@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl focus:border-red-500 focus:ring-red-500/20"
                    required
                    autoFocus
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="admin-password" className="text-gray-700 font-medium text-sm">Password</Label>
                  <div className="relative">
                    <Input
                      id="admin-password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Enter password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl pr-12 focus:border-red-500 focus:ring-red-500/20"
                      required
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1">
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                <Button
                  type="submit"
                  className="w-full text-white h-12 text-base font-semibold rounded-xl shadow-sm transition-all bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500"
                  disabled={isLoading}
                >
                  {isLoading ? <span className="flex items-center gap-2"><RefreshCw className="w-4 h-4 animate-spin" /> Signing in...</span> : 'Access Admin Panel'}
                </Button>
              </form>
            </>

          ) : (
            /* ── Regular User: Email-only magic link ── */
            <>
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-1">Get started free</h2>
                <p className="text-gray-500 text-sm">Enter your email — we'll send you a sign-in link. No password needed.</p>
              </div>

              {/* Google Sign-In */}
              {GOOGLE_CLIENT_ID && (
                <div className="mb-5">
                  {googleLoading ? (
                    <div className="w-full h-11 flex items-center justify-center gap-2 border border-gray-300 rounded-xl text-gray-600 text-sm bg-white">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Signing in with Google...
                    </div>
                  ) : (
                    <div ref={googleButtonRef} className="w-full flex justify-center" style={{ minHeight: 44 }} />
                  )}
                  <div className="relative my-5">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs text-gray-400">
                      <span className="bg-white px-3">or continue with email</span>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleMagicLinkSubmit} className="space-y-5">
                {error && (
                  <Alert variant="destructive" className="border-red-500/30 bg-red-50">
                    <AlertCircle className="w-4 h-4 text-red-500" />
                    <AlertDescription className="text-red-600 font-medium text-sm">{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email" className="text-gray-700 font-medium text-sm">Email address</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@company.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError(''); }}
                    className="h-12 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 rounded-xl focus:border-violet-500 focus:ring-violet-500/20"
                    required
                    autoFocus
                  />
                </div>

                <div className="flex items-center gap-2 px-3 py-2.5 bg-green-50 border border-green-200 rounded-xl">
                  <div className="w-4 h-4 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                    <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-xs text-green-700 font-medium">7-day free trial · No credit card required · Cancel anytime</p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-semibold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-sm transition-all"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Sending link...
                    </span>
                  ) : (
                    'Continue with email →'
                  )}
                </Button>

                <p className="text-center text-xs text-gray-400">
                  Already have an account? Just enter your email above — same link works for sign in and sign up.
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Auth;
