import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, ArrowLeft, Sparkle, Shield, Rocket, Search, ShieldCheck, MailOpen, Globe, Layers } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Alert, AlertDescription } from './ui/alert';
import { signUpWithEmail, signInWithEmail, resetPassword, isAuthenticatedAsync, resendVerificationEmail } from '../utils/auth';
import { notifications } from '../utils/notifications';

interface AuthProps {
  onLoginSuccess: () => void;
  onSignupSuccess?: (userEmail: string, userName: string) => void;
  onBackToHome: () => void;
  onSignupRedirect?: () => void;
  initialMode?: 'login' | 'signup';
  isAdminLogin?: boolean;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onSignupSuccess, onBackToHome, onSignupRedirect, initialMode = 'login', isAdminLogin = false }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [showSignupSuccess, setShowSignupSuccess] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [isResending, setIsResending] = useState(false);
  const MAX_RESENDS = 3;
  const COOLDOWN_SECONDS = 60;
  
  const SIGNUP_DISABLED = false;

  React.useEffect(() => {
    setIsLogin(initialMode === 'login');
    setError('');
    
    if (initialMode === 'signup') {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('clerk_token');
      }
    }
  }, [initialMode]);

  const handleResendVerification = async () => {
    if (resendCooldown > 0 || isResending || resendCount >= MAX_RESENDS) return;
    
    setIsResending(true);
    try {
      await resendVerificationEmail(signupEmail);
      setResendCount(prev => prev + 1);
      setResendCooldown(COOLDOWN_SECONDS);
      
      const interval = setInterval(() => {
        setResendCooldown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      
      notifications.success('Verification email resent!');
    } catch (err: any) {
      notifications.error(err.message || 'Failed to resend verification email');
    } finally {
      setIsResending(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      if (isForgotPassword) {
        await resetPassword(email);
        notifications.success('Password reset email sent! Check your inbox.');
        setIsForgotPassword(false);
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        if (isAdminLogin) {
          const response = await fetch('/api/superadmin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username: email, password })
          });
          
          if (!response.ok) {
            const data = await response.json();
            throw new Error(data.error || 'Invalid admin credentials');
          }
          
          const data = await response.json();
          sessionStorage.setItem('superadmin_token', data.token);
          onLoginSuccess();
        } else {
          const result = await signInWithEmail(email, password);
          if (!result.error) {
            const isAuth = await isAuthenticatedAsync();
            if (isAuth) {
              onLoginSuccess();
            } else {
              throw new Error('Authentication failed. Please try again.');
            }
          } else {
            throw new Error(result.error?.message || 'Login failed');
          }
        }
      } else {
        if (password !== confirmPassword) {
          throw new Error('Passwords do not match');
        }
        if (password.length < 8) {
          throw new Error('Password must be at least 8 characters');
        }
        
        const result = await signUpWithEmail(email, password, confirmPassword, name);
        if (!result.error) {
          if (result.needsEmailVerification) {
            setSignupEmail(email);
            setShowSignupSuccess(true);
          } else {
            if (onSignupSuccess) {
              onSignupSuccess(email, name);
            } else {
              onLoginSuccess();
            }
          }
        } else {
          throw new Error(result.error?.message || 'Signup failed');
        }
      }
      setIsLoading(false);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  const features = [
    { icon: Rocket, label: 'AI Campaign Builder', color: 'from-violet-500 to-indigo-600' },
    { icon: Layers, label: '12 Campaign Structures', color: 'from-indigo-500 to-blue-600' },
    { icon: Search, label: 'Keyword Intelligence', color: 'from-blue-500 to-cyan-500' },
    { icon: ShieldCheck, label: 'Click Fraud Protection', color: 'from-amber-500 to-orange-600' },
    { icon: MailOpen, label: 'Proxy Mail', color: 'from-pink-500 to-rose-600' },
    { icon: Globe, label: 'Domain Monitor', color: 'from-purple-500 to-violet-600' },
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding */}
      <div className={`hidden lg:flex lg:w-[45%] relative flex-col justify-between p-12 overflow-hidden ${
        isAdminLogin
          ? 'bg-gradient-to-br from-slate-950 via-red-950 to-orange-950'
          : 'bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950'
      }`}>
        <div className="absolute inset-0 overflow-hidden">
          <div className={`absolute top-1/4 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse opacity-30 ${
            isAdminLogin ? 'bg-red-500' : 'bg-purple-500'
          }`} />
          <div className={`absolute bottom-1/4 right-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse opacity-20 ${
            isAdminLogin ? 'bg-orange-500' : 'bg-blue-500'
          }`} style={{ animationDelay: '1s' }} />
        </div>

        <div className="relative z-10">
          <button onClick={onBackToHome} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-12">
            <ArrowLeft className="w-4 h-4" />
            Back to home
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              isAdminLogin ? 'bg-gradient-to-br from-red-500 to-orange-600' : 'bg-gradient-to-br from-violet-500 to-indigo-600'
            }`}>
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

      {/* Right Panel - Form */}
      <div className={`flex-1 flex items-center justify-center p-6 sm:p-8 ${
        isAdminLogin
          ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950'
          : 'bg-gradient-to-br from-slate-950 via-[#0f0d24] to-slate-950'
      }`}>
        <div className="w-full max-w-md">
          {/* Mobile Back Button & Logo */}
          <div className="lg:hidden mb-8">
            <button onClick={onBackToHome} className="flex items-center gap-2 text-white/60 hover:text-white transition-colors text-sm mb-6">
              <ArrowLeft className="w-4 h-4" />
              Back to home
            </button>
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                isAdminLogin ? 'bg-gradient-to-br from-red-500 to-orange-600' : 'bg-gradient-to-br from-violet-500 to-indigo-600'
              }`}>
                {isAdminLogin ? <Shield className="w-5 h-5 text-white" /> : <Sparkle className="w-5 h-5 text-white" />}
              </div>
              <span className="text-xl font-bold text-white">Adiology</span>
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

          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-1">
              {isForgotPassword
                ? 'Reset Password'
                : isLogin
                  ? (isAdminLogin ? 'Admin Sign In' : 'Welcome back')
                  : SIGNUP_DISABLED
                    ? 'Sign Up Disabled'
                    : 'Create your account'}
            </h2>
            <p className="text-gray-400 text-sm">
              {isForgotPassword
                ? 'Enter your email to receive a reset link'
                : isLogin
                  ? (isAdminLogin ? 'Enter your administrator credentials' : 'Sign in to continue building campaigns')
                  : SIGNUP_DISABLED
                    ? 'New signups are currently disabled'
                    : 'Start building winning campaigns today'}
            </p>
          </div>

          {showSignupSuccess ? (
            <div className="space-y-6 text-center">
              <div className="flex justify-center">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-green-900/30">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-bold text-white mb-1">Account Created!</h3>
                <p className="text-gray-400">Check your email to verify</p>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <p className="text-blue-300 text-sm leading-relaxed">
                  We've sent a verification link to your email. Click the link to activate your account.
                </p>
              </div>

              <div className="bg-white/5 rounded-xl p-4 border border-white/10">
                <p className="text-xs text-gray-500 mb-1">Sent to:</p>
                <p className="text-sm font-semibold text-white break-all">{signupEmail}</p>
              </div>

              <div className="space-y-3">
                {resendCount < MAX_RESENDS ? (
                  <button
                    onClick={handleResendVerification}
                    disabled={resendCooldown > 0 || isResending}
                    className={`w-full h-11 text-sm font-medium rounded-xl transition-all border ${
                      resendCooldown > 0 || isResending
                        ? 'bg-white/5 text-gray-500 border-white/10 cursor-not-allowed'
                        : 'bg-white/5 text-indigo-400 border-indigo-500/30 hover:bg-indigo-500/10 hover:border-indigo-500/40'
                    }`}
                  >
                    {isResending ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Sending...
                      </span>
                    ) : resendCooldown > 0 ? (
                      `Resend in ${resendCooldown}s`
                    ) : (
                      `Resend verification email (${MAX_RESENDS - resendCount} left)`
                    )}
                  </button>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-2">
                    Maximum resend attempts reached. Please check your spam folder.
                  </p>
                )}

                <button
                  onClick={() => {
                    setShowSignupSuccess(false);
                    setIsLogin(true);
                    setEmail('');
                    setPassword('');
                    setConfirmPassword('');
                    setName('');
                    setSignupEmail('');
                    setError('');
                    setResendCount(0);
                    setResendCooldown(0);
                  }}
                  className={`w-full h-12 text-base font-semibold rounded-xl transition-all text-white ${
                    isAdminLogin
                      ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500'
                      : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500'
                  }`}
                >
                  Back to Login
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && (
                <Alert variant="destructive" className="border-red-500/30 bg-red-500/10 text-red-300">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <AlertDescription className="text-red-300 font-medium text-sm">{error}</AlertDescription>
                </Alert>
              )}

              {!isLogin && !SIGNUP_DISABLED && (
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-gray-300 font-medium text-sm">Full Name</Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="John Doe"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-indigo-500/50 focus:ring-indigo-500/20"
                    required={!isLogin}
                    disabled={SIGNUP_DISABLED}
                  />
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-gray-300 font-medium text-sm">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-indigo-500/50 focus:ring-indigo-500/20"
                  required
                />
              </div>

              {!isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-gray-300 font-medium text-sm">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder={isLogin ? 'Enter your password' : 'Create a password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl pr-12 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                      required={!isForgotPassword}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {!isLogin && !SIGNUP_DISABLED && !isForgotPassword && (
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-gray-300 font-medium text-sm">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl pr-12 focus:border-indigo-500/50 focus:ring-indigo-500/20"
                      required={!isLogin}
                      disabled={SIGNUP_DISABLED}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {isLogin && !isForgotPassword && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-white/20 bg-white/5" />
                    <span className="text-gray-400 font-medium">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setIsForgotPassword(true);
                    }}
                    className="text-indigo-400 hover:text-indigo-300 font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {isForgotPassword && (
                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                  <p className="text-sm text-blue-300 mb-3">
                    Enter your email and we'll send you a link to reset your password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setIsForgotPassword(false);
                      setEmail('');
                    }}
                    className="text-sm text-indigo-400 hover:text-indigo-300 font-medium"
                  >
                    ← Back to login
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className={`w-full text-white h-12 text-base font-semibold rounded-xl shadow-lg transition-all ${
                  isAdminLogin
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-500 hover:to-orange-500 shadow-red-900/30'
                    : 'bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 shadow-indigo-900/30'
                }`}
                disabled={isLoading || (!isLogin && SIGNUP_DISABLED)}
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    {isForgotPassword
                      ? 'Sending reset link...'
                      : isLogin
                        ? 'Signing in...'
                        : 'Creating account...'}
                  </span>
                ) : (
                  isForgotPassword
                    ? 'Send Reset Link'
                    : isLogin
                      ? (isAdminLogin ? 'Access Admin Panel' : 'Sign In')
                      : (SIGNUP_DISABLED ? 'Sign Up Disabled' : 'Create Account')
                )}
              </Button>

              {SIGNUP_DISABLED ? (
                <div className="text-center text-sm text-gray-500 italic">
                  Sign up is currently disabled. Please contact support for access.
                </div>
              ) : (
                !isForgotPassword && (
                  <div className="text-center text-sm text-gray-400">
                    {isLogin ? (
                      <>
                        Don't have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            if (onSignupRedirect) {
                              onSignupRedirect();
                            } else {
                              setIsLogin(false);
                              setError('');
                              setIsForgotPassword(false);
                            }
                          }}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          Sign up
                        </button>
                      </>
                    ) : (
                      <>
                        Already have an account?{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setIsLogin(true);
                            setError('');
                            setIsForgotPassword(false);
                          }}
                          className="text-indigo-400 hover:text-indigo-300 font-semibold"
                        >
                          Sign in
                        </button>
                      </>
                    )}
                  </div>
                )
              )}
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
