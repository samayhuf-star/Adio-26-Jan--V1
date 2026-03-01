import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { Shield, CheckCircle, AlertCircle, Loader2, ArrowLeft, Gift, Sparkles, Key } from 'lucide-react';
import { getSessionToken } from '../utils/auth';

interface AppSumoRedeemProps {
  user: any;
  onNavigate: (page: string) => void;
  onLogin: () => void;
}

export const AppSumoRedeem = ({ user, onNavigate, onLogin }: AppSumoRedeemProps) => {
  const [licenseKey, setLicenseKey] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [errorFromUrl, setErrorFromUrl] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const fromAppSumo = params.get('from_appsumo');
    const error = params.get('error');

    if (fromAppSumo) {
      fetch('/api/appsumo/pending-license', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          if (data.licenseKey) {
            setLicenseKey(data.licenseKey);
          }
        })
        .catch(() => {});
      window.history.replaceState({}, '', '/appsumo/redeem');
    }

    if (error) {
      const errorMessages: Record<string, string> = {
        no_code: 'Authorization was not completed. Please try again.',
        token_failed: 'Failed to verify your AppSumo account. Please try again.',
        license_failed: 'Could not retrieve your license. Please enter it manually.',
        no_license: 'No license found on your AppSumo account. Please enter your license key manually.',
        callback_failed: 'Something went wrong during verification. Please enter your license key manually.',
        invalid_state: 'Security verification failed. Please try again.',
      };
      setErrorFromUrl(errorMessages[error] || 'An error occurred. Please enter your license key manually.');
      window.history.replaceState({}, '', '/appsumo/redeem');
    }
  }, []);

  const handleActivate = async () => {
    if (!licenseKey.trim()) {
      setStatus('error');
      setMessage('Please enter your AppSumo license key.');
      return;
    }

    if (!user) {
      setStatus('error');
      setMessage('Please sign in first to activate your license.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const token = await getSessionToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
      const response = await fetch('/api/appsumo/activate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          licenseKey: licenseKey.trim(),
          email: user.email,
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'License activated! You now have lifetime access to Adiology.');
      } else {
        setStatus('error');
        setMessage(data.error || 'Failed to activate license. Please try again.');
      }
    } catch {
      setStatus('error');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  return (
    <>
      <Helmet>
        <title>Redeem AppSumo License - Adiology</title>
        <meta name="description" content="Activate your AppSumo lifetime deal license for Adiology - the AI-powered Google Ads campaign builder." />
        <meta name="robots" content="noindex, nofollow" />
        <meta property="og:image" content="https://adiology.io/og-image.png" />
        <meta name="twitter:image" content="https://adiology.io/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50">
        <nav className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <button
                onClick={() => onNavigate('home')}
                className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Back to Home</span>
              </button>
              <div className="flex items-center gap-2">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg p-1.5">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <span className="text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">Adiology</span>
              </div>
              <div className="w-24" />
            </div>
          </div>
        </nav>

        <div className="max-w-lg mx-auto px-4 py-16">
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
              <Gift className="w-4 h-4" />
              AppSumo Lifetime Deal
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
              Activate Your License
            </h1>
            <p className="text-slate-600 text-lg">
              Enter your AppSumo license key to unlock lifetime access to all Adiology features.
            </p>
          </div>

          {errorFromUrl && (
            <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-sm">{errorFromUrl}</p>
            </div>
          )}

          {status === 'success' ? (
            <div className="bg-white rounded-2xl border border-green-200 shadow-lg p-8 text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">You're All Set!</h2>
              <p className="text-slate-600 mb-6">{message}</p>
              <button
                onClick={() => {
                  window.history.pushState(null, '', '/');
                  onNavigate('user');
                }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
              >
                Go to Dashboard
              </button>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg p-8">
              {!user && (
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
                  <p className="text-blue-800 text-sm mb-3">
                    You need to sign in or create an account first to activate your license.
                  </p>
                  <button
                    onClick={onLogin}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors"
                  >
                    Sign In / Sign Up
                  </button>
                </div>
              )}

              <label className="block text-sm font-semibold text-slate-700 mb-2">
                License Key
              </label>
              <div className="relative mb-4">
                <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={licenseKey}
                  onChange={(e) => setLicenseKey(e.target.value)}
                  placeholder="e.g. 2191a2c1-01a9-4060-8067-1b466484f21b"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all font-mono text-sm"
                  disabled={status === 'loading'}
                />
              </div>

              {status === 'error' && message && (
                <div className="mb-4 bg-red-50 border border-red-200 rounded-xl p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 text-sm">{message}</p>
                </div>
              )}

              <button
                onClick={handleActivate}
                disabled={status === 'loading' || !user}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3.5 rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {status === 'loading' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Activating...
                  </>
                ) : (
                  <>
                    <Shield className="w-5 h-5" />
                    Activate Lifetime Access
                  </>
                )}
              </button>

              <div className="mt-6 pt-6 border-t border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-3">What you get:</h3>
                <ul className="space-y-2.5">
                  {[
                    'Lifetime access to all features',
                    'AI-powered campaign builder with 15 structures',
                    'Click fraud protection (Click Guard)',
                    'Domain monitoring & SSL tracking',
                    'Temporary email service',
                    'AI Blog Generator',
                    'All future updates included',
                  ].map((item) => (
                    <li key={item} className="flex items-center gap-2 text-sm text-slate-600">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>

              <p className="text-xs text-slate-400 mt-6 text-center">
                Can't find your license key? Check your AppSumo purchase confirmation email.
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
