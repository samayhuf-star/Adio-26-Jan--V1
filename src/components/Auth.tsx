import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, ArrowLeft, Sparkle, Shield } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { signUpWithEmail, signInWithEmail, resetPassword, isAuthenticatedAsync } from '../utils/auth';
import { notifications } from '../utils/notifications';

interface AuthProps {
  onLoginSuccess: () => void;
  onSignupSuccess?: (userEmail: string, userName: string) => void;
  onBackToHome: () => void;
  initialMode?: 'login' | 'signup';
  isAdminLogin?: boolean;
}

export const Auth: React.FC<AuthProps> = ({ onLoginSuccess, onSignupSuccess, onBackToHome, initialMode = 'login', isAdminLogin = false }) => {
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
  
  // Signup is fully enabled
  const SIGNUP_DISABLED = false;

  // Sync isLogin state when initialMode prop changes
  React.useEffect(() => {
    setIsLogin(initialMode === 'login');
    setError(''); // Clear any errors when mode changes
  }, [initialMode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const trimmedEmail = email.trim().toLowerCase();
      const trimmedPassword = password.trim();

      if (isForgotPassword) {
        // Handle password reset
        if (!trimmedEmail) {
          setError('Please enter your email address');
          setIsLoading(false);
          return;
        }

        await resetPassword(trimmedEmail);
        notifications.success('Password reset email sent!', {
          title: 'Check Your Email',
          description: 'We\'ve sent a password reset link to your email address. Please check your inbox and spam folder.',
        });
        setIsForgotPassword(false);
        setIsLoading(false);
        return;
      }

      if (isLogin) {
        // Check for test admin credentials first
        const isTestAdmin = (
          (trimmedEmail === 'admin@admin.com' || trimmedEmail === 'admin@admin' || trimmedEmail === 'admin' || trimmedEmail === 'oadiology@gmail.com') && 
          (trimmedPassword === 'admin' || trimmedPassword === 'password' || trimmedPassword === '123456')
        );
        
        if (isTestAdmin) {
          // Grant instant access - create a mock user object
          sessionStorage.setItem('test_admin_mode', 'true');
          sessionStorage.setItem('test_admin_email', trimmedEmail);
          
          // Create a mock user object for test admin
          const mockUser = {
            id: 'test-admin-' + Date.now(),
            email: trimmedEmail,
            name: 'Admin User',
            role: 'superadmin',
            subscription_plan: 'pro',
            subscription_status: 'active',
          };
          
          // Store in sessionStorage for App.tsx to pick up
          sessionStorage.setItem('test_admin_user', JSON.stringify(mockUser));
          
          notifications.success('Welcome, Super Admin!', {
            title: 'Admin Access Granted',
            description: `Logged in as ${trimmedEmail}`
          });
          
          setIsLoading(false);
          // Ensure navigation happens
          setTimeout(() => {
            onLoginSuccess();
          }, 100);
          return;
        }
        
        // Optimize login - reduce wait time and improve session handling
        try {
          const result = await signInWithEmail(trimmedEmail, trimmedPassword);
          
          if (result.error) {
            throw new Error(result.error.message);
          }
          
          // Reduce wait time for faster login
          await new Promise(resolve => setTimeout(resolve, 50));
          
          notifications.success('Welcome back!', {
            title: 'Login Successful',
          });
          
          // Verify session exists before proceeding
          // Wait a bit longer for auth state to propagate
          let attempts = 0;
          const checkAuth = async (): Promise<boolean> => {
            const authenticated = await isAuthenticatedAsync();
            if (!authenticated && attempts < 10) {
              await new Promise(resolve => setTimeout(resolve, 100));
              attempts++;
              return checkAuth();
            }
            return authenticated;
          };
          
          const authenticated = await checkAuth();
          
          if (!authenticated) {
            throw new Error('Session not established after login');
          }
          
          // Clear loading state
          setIsLoading(false);
          
          // Navigate to dashboard after successful login
          // Give extra time for user state to update in App.tsx
          setTimeout(() => {
            onLoginSuccess();
          }, 300);
        } catch (err: any) {
          let errorMessage = 'Invalid email or password. Please try again.';
          
          if (err?.message?.includes('Invalid login credentials') || err?.message?.includes('invalid_credentials')) {
            errorMessage = 'Invalid email or password. Please try again.';
          } else if (err?.message?.includes('Email not confirmed') || err?.message?.includes('email_not_confirmed')) {
            errorMessage = 'Please verify your email before signing in. Check your inbox for the verification link.';
          } else if (err?.message) {
            errorMessage = err.message;
          }
          
          console.error('Login error:', err);
          setError(errorMessage);
          setIsLoading(false);
        }
      } else {
        // Signup logic - create real PocketBase account
        const trimmedName = name.trim();
        if (!trimmedName || trimmedName.length === 0) {
          setError('Please enter your full name');
          setIsLoading(false);
          return;
        }

        if (trimmedPassword.length < 8) {
          setError('Password must be at least 8 characters');
          setIsLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }

        // Create actual PocketBase account
        try {
          const result = await signUpWithEmail(trimmedEmail, trimmedPassword, confirmPassword, trimmedName);
          if (result.error) {
            let errorMessage = result.error.message || 'Signup failed. Please try again.';
            
            if (errorMessage.includes('User already registered') || errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
              errorMessage = 'An account with this email already exists. Please sign in instead.';
            }
            
            setError(errorMessage);
            setIsLoading(false);
            return;
          }
          
          // Signup successful - check if user is automatically signed in
          if (result.data) {
            // Wait a bit for auth state to update
            await new Promise(resolve => setTimeout(resolve, 200));
            
            // Check if user is authenticated (Supabase auto-signs in after signup in some cases)
            const authenticated = await isAuthenticatedAsync();
            if (authenticated) {
              // User is signed in, navigate to dashboard
              notifications.success('Account created successfully!', {
                title: 'Welcome to Adiology!',
                description: 'Your account has been created and you are now signed in.',
              });
              
              setIsLoading(false);
              
              // Navigate to dashboard after successful signup
              setTimeout(() => {
                if (onSignupSuccess) {
                  onSignupSuccess(result.data.email, result.data.name || trimmedName);
                }
                // Also trigger login success to navigate to dashboard
                if (onLoginSuccess) {
                  onLoginSuccess();
                }
              }, 300);
              return;
            } else {
              // User needs to verify email first
              setSignupEmail(trimmedEmail);
              setShowSignupSuccess(true);
              setIsLoading(false);
              
              notifications.success('Account created successfully!', {
                title: 'Check Your Email',
                description: 'Please verify your email address to activate your account.',
              });
              return;
            }
          }
        } catch (err: any) {
          let errorMessage = err?.message || 'Signup failed. Please try again.';
          
          if (errorMessage.includes('User already registered') || errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
            errorMessage = 'An account with this email already exists. Please sign in instead.';
          }
          
          setError(errorMessage);
          setIsLoading(false);
          return;
        }
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
      setIsLoading(false);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      isAdminLogin 
        ? 'bg-gradient-to-br from-slate-900 via-red-900 to-orange-900' 
        : 'bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800'
    }`}>
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute -top-40 -right-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse ${
          isAdminLogin ? 'bg-orange-500' : 'bg-purple-500'
        }`}></div>
        <div className={`absolute -bottom-40 -left-40 w-80 h-80 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000 ${
          isAdminLogin ? 'bg-red-500' : 'bg-indigo-500'
        }`}></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          {isAdminLogin && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <div className="px-4 py-1.5 bg-red-600/90 backdrop-blur-sm rounded-full border border-red-400/50 shadow-lg">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-white" />
                  <span className="text-sm font-semibold text-white uppercase tracking-wider">Admin Console</span>
                </div>
              </div>
            </div>
          )}
          <h1 className="text-6xl font-bold text-white mb-2 tracking-tight">ADIOLOGY</h1>
          <p className={`text-2xl font-medium ${isAdminLogin ? 'text-orange-200' : 'text-indigo-200'}`}>
            {isAdminLogin ? 'System Administration' : 'Google Ads Made Easy'}
          </p>
        </div>
        
        <Card className={`border shadow-2xl bg-white backdrop-blur-xl relative overflow-visible p-8 ${
          isAdminLogin ? 'border-red-200' : 'border-slate-200'
        }`}>
          <CardHeader className="space-y-1 pb-6 px-0">
            <div className="flex items-center justify-between mb-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={onBackToHome}
                className={`font-medium ${isAdminLogin ? 'text-slate-700 hover:text-red-600' : 'text-slate-700 hover:text-indigo-600'}`}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
            </div>
            <div className="flex flex-col items-center justify-center mb-4">
              <div className={`w-16 h-16 rounded-xl flex items-center justify-center shadow-lg mb-3 ${
                isAdminLogin 
                  ? 'bg-gradient-to-br from-red-600 to-orange-600' 
                  : 'bg-gradient-to-br from-indigo-600 to-purple-600'
              }`}>
                {isAdminLogin ? (
                  <Shield className="w-8 h-8 text-white" />
                ) : (
                  <Sparkle className="w-8 h-8 text-white" />
                )}
              </div>
              <h2 className="text-2xl font-bold text-slate-900">{isAdminLogin ? 'Admin Portal' : 'Adiology'}</h2>
              {!isAdminLogin && <p className="text-xs text-slate-500 -mt-0.5">~ Samay</p>}
              {isAdminLogin && <p className="text-xs text-red-500 font-medium -mt-0.5">Authorized Access Only</p>}
            </div>
            <CardTitle className="text-xl font-bold text-center text-slate-900">
              {isForgotPassword 
                ? 'Reset Password' 
                : isLogin 
                  ? (isAdminLogin ? 'Admin Sign In' : 'Welcome Back')
                  : SIGNUP_DISABLED 
                    ? 'Sign Up Disabled' 
                    : 'Create Account'}
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              {isForgotPassword
                ? 'Enter your email to receive a password reset link'
                : isLogin 
                ? (isAdminLogin ? 'Enter your administrator credentials' : 'Sign in to your Adiology account')
                : SIGNUP_DISABLED 
                  ? 'New signups are currently disabled until production launch'
                : 'Start building winning campaigns today'}
            </CardDescription>
          </CardHeader>
          <CardContent className="relative px-0">
            {showSignupSuccess ? (
              <div className="space-y-6 py-8 text-center">
                <div className="flex justify-center mb-6">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-600 flex items-center justify-center shadow-lg">
                    <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-slate-900">Account Created!</h3>
                  <p className="text-lg text-slate-700 font-medium">Check your email to verify</p>
                </div>

                <div className="bg-blue-50 border border-blue-200 rounded-lg p-5 my-6">
                  <p className="text-slate-700 text-base leading-relaxed">
                    We've sent a verification link to your email. Click the link to activate your account and start building campaigns!
                  </p>
                </div>

                <div className="bg-slate-50 rounded-lg p-4 my-6">
                  <p className="text-sm text-slate-600 mb-2">Verification email sent to:</p>
                  <p className="text-base font-semibold text-slate-900 break-all">{signupEmail}</p>
                </div>

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
                  }}
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:from-indigo-700 hover:to-purple-700 h-12 text-base font-semibold rounded-lg transition-all"
                >
                  Back to Login
                </button>

                <p className="text-xs text-slate-500 italic">
                  Welcome to Adiology!
                </p>
              </div>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-6 relative">
              {error && (
                <Alert variant="destructive" className="border-red-500 bg-red-50">
                  <AlertCircle className="w-4 h-4 text-red-600" />
                  <AlertDescription className="text-red-700 font-medium">{error}</AlertDescription>
                </Alert>
              )}

              {!isLogin && !SIGNUP_DISABLED && (
                <div className="space-y-3">
                  <Label htmlFor="name" className="text-slate-900 font-semibold text-sm mb-2">Full Name</Label>
                  <div className="relative">
                    <Input
                      id="name"
                      type="text"
                      placeholder="John Doe"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="pl-4 pr-4 py-3 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 h-12"
                      required={!isLogin}
                      disabled={SIGNUP_DISABLED}
                    />
                  </div>
                </div>
              )}

              <div className="space-y-3">
                <Label htmlFor="email" className="text-slate-900 font-semibold text-sm mb-2">Email</Label>
                <div className="relative">
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-4 pr-4 py-3 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 h-12"
                    required
                  />
                </div>
              </div>

              {!isForgotPassword && (
                <>
              <div className="space-y-3">
                <Label htmlFor="password" className="text-slate-900 font-semibold text-sm mb-2">Password</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder={isLogin ? 'Enter your password' : 'Create a password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-4 pr-12 py-3 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 h-12"
                        required={!isForgotPassword}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 p-1"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
                </>
              )}

              {!isLogin && !SIGNUP_DISABLED && !isForgotPassword && (
                <div className="space-y-3">
                  <Label htmlFor="confirmPassword" className="text-slate-900 font-semibold text-sm mb-2">Confirm Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-4 pr-12 py-3 bg-white border-slate-300 text-slate-900 placeholder:text-slate-400 h-12"
                      required={!isLogin}
                      disabled={SIGNUP_DISABLED}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-500 hover:text-slate-700 p-1"
                    >
                      {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              )}

              {isLogin && !isForgotPassword && (
                <div className="flex items-center justify-between text-sm">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" className="rounded border-slate-300" />
                    <span className="text-slate-700 font-medium">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setIsForgotPassword(true);
                    }}
                    className="text-indigo-600 hover:text-indigo-700 font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
                </div>
              )}

              {isForgotPassword && (
                <div className="p-5 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800 mb-3">
                    Enter your email address and we'll send you a link to reset your password.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setError('');
                      setIsForgotPassword(false);
                      setEmail('');
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                  >
                    ← Back to login
                  </button>
                </div>
              )}

              <Button
                type="submit"
                className={`w-full text-white h-12 text-base font-semibold mt-2 ${
                  isAdminLogin 
                    ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700' 
                    : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700'
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
                <div className="text-center text-sm text-slate-500 italic">
                  Sign up is currently disabled. Please contact support for access.
                </div>
              ) : (
                !isForgotPassword && (
              <div className="text-center text-sm text-slate-700">
                {isLogin ? (
                  <>
                    Don't have an account?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setIsLogin(false);
                        setError('');
                            setIsForgotPassword(false);
                      }}
                      className="text-indigo-600 hover:text-indigo-700 font-semibold"
                      disabled={SIGNUP_DISABLED}
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
                      className="text-indigo-600 hover:text-indigo-700 font-semibold"
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
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

