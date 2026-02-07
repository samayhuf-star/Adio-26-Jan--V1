import React, { useState, useEffect, useRef } from 'react';
import { Mail, CheckCircle, AlertCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { notifications } from '../utils/notifications';
import { resendVerificationEmail } from '../utils/auth';

interface EmailVerificationProps {
  onVerificationSuccess: () => void;
  onBackToHome: () => void;
}

export const EmailVerification: React.FC<EmailVerificationProps> = ({ 
  onVerificationSuccess, 
  onBackToHome 
}) => {
  const [email, setEmail] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [error, setError] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const hasProcessedRef = useRef(false);
  const MAX_RESENDS = 3;
  const COOLDOWN_SECONDS = 60;

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  useEffect(() => {
    if (hasProcessedRef.current) return;

    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');
    const tokenParam = urlParams.get('token');

    if (emailParam) {
      setEmail(emailParam);
    }

    if (tokenParam) {
      hasProcessedRef.current = true;
      setIsVerifying(true);

      const verifyEmail = async () => {
        try {
          const response = await fetch('/api/account/verify-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ token: tokenParam }),
          });

          const result = await response.json();

          if (!result.success) {
            setError(result.error || 'Verification failed. Please request a new verification link.');
            setIsVerifying(false);
            return;
          }

          if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', result.token);
            localStorage.setItem('user', JSON.stringify({
              id: result.user.id,
              email: result.user.email,
              name: result.user.full_name || '',
              full_name: result.user.full_name || '',
              role: result.user.role || 'user',
              subscription_plan: result.user.subscription_plan || 'free',
              subscription_status: result.user.subscription_status || 'active',
              email_confirmed_at: new Date().toISOString(),
            }));
          }

          setIsVerified(true);
          notifications.success('Email verified successfully!');
          window.history.replaceState({}, '', '/verify-email');
          setTimeout(() => {
            onVerificationSuccess();
          }, 2000);
        } catch (err) {
          console.error('[EmailVerification] Error:', err);
          setError('Something went wrong during verification. Please try again.');
          setIsVerifying(false);
        }
      };

      verifyEmail();
      return;
    }
  }, [onVerificationSuccess]);

  const handleResendEmail = async () => {
    if (!email || resendCount >= MAX_RESENDS || resendCooldown > 0) {
      if (!email) setError('Email address is required');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await resendVerificationEmail(email);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      setResendCount(prev => prev + 1);
      setResendCooldown(COOLDOWN_SECONDS);
      notifications.success('Verification email sent!', {
        title: 'Email Sent',
        description: 'Please check your email inbox (and spam folder) for the verification link.',
      });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to resend verification email. Please try again.';
      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800 p-4">
        <Card className="border border-slate-200 shadow-2xl bg-white backdrop-blur-xl max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Verifying Email...
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2">
              Please wait while we verify your email address.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800 p-4">
        <Card className="border border-slate-200 shadow-2xl bg-white backdrop-blur-xl max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Email Verified!
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2">
              Email verified successfully. Redirecting to login...
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800 p-4">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Card className="border border-slate-200 shadow-2xl bg-white backdrop-blur-xl">
          <CardHeader className="space-y-1 pb-4">
            <div className="flex flex-col items-center justify-center mb-4">
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg mb-3">
                <Mail className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-900">Adiology</h2>
              <p className="text-xs text-slate-500 -mt-0.5">~ Samay</p>
            </div>
            <CardTitle className="text-xl font-bold text-center text-slate-900">
              Verify Your Email
            </CardTitle>
            <CardDescription className="text-center text-slate-600">
              {email 
                ? `We've sent a verification link to ${email}`
                : 'Please verify your email address to continue'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {email && (
              <div className="text-center p-4 bg-slate-50 rounded-lg space-y-3">
                <p className="text-sm text-slate-700 mb-2">
                  <strong>Email:</strong> {email}
                </p>
                <p className="text-xs text-slate-500">
                  Check your inbox (or spam folder) for the verification link. Click the link in the email to verify your account.
                </p>
              </div>
            )}

            <div className="space-y-4">
              <p className="text-sm text-slate-600 text-center">
                Didn't receive the email? Check your spam folder or resend.
              </p>
              
              {resendCount < MAX_RESENDS ? (
                <Button
                  onClick={handleResendEmail}
                  disabled={isVerifying || !email || resendCooldown > 0}
                  variant="outline"
                  className="w-full"
                >
                  {resendCooldown > 0 ? (
                    `Resend in ${resendCooldown}s`
                  ) : (
                    `Resend Verification Email (${MAX_RESENDS - resendCount} left)`
                  )}
                </Button>
              ) : (
                <p className="text-sm text-slate-500 text-center py-2">
                  Maximum resend attempts reached. Please check your spam folder.
                </p>
              )}
            </div>

            <div className="pt-4 border-t border-slate-200">
              <Button
                onClick={onBackToHome}
                variant="ghost"
                className="w-full text-slate-600"
              >
                Back to Login
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
