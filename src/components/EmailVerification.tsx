import React, { useState, useEffect } from 'react';
import { Mail, CheckCircle, AlertCircle, ArrowRight, Sparkle } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Alert, AlertDescription } from './ui/alert';
import { notifications } from '../utils/notifications';
import { getCurrentUser, getCurrentUserAsync, resendVerificationEmail, supabase } from '../utils/auth';

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

  useEffect(() => {
    // Check URL for email parameter
    const urlParams = new URLSearchParams(window.location.search);
    const emailParam = urlParams.get('email');

    if (emailParam) {
      setEmail(emailParam);
    }

    // Check if user is already verified and handle Supabase email verification
    const checkVerification = async () => {
      try {
        // Check for Supabase email verification hash in URL
        if (supabase) {
          const { data, error } = await supabase.auth.getSession();
          
          if (data?.session?.user) {
            const user = await getCurrentUserAsync();
            if (user) {
              // Check if email is confirmed
              if (user.email_confirmed_at || data.session.user.email_confirmed_at) {
                setIsVerified(true);
                if (user.email) setEmail(user.email);
                
                // Trigger success callback after a short delay
                setTimeout(() => {
                  onVerificationSuccess();
                }, 2000);
                return;
              }
              
              // If user exists but not verified, show email
              if (user.email) setEmail(user.email);
            }
          }
        }

        // Fallback to localStorage user
        const localUser = getCurrentUser();
        if (localUser) {
          if (localUser.email) setEmail(localUser.email);
        }
      } catch (err) {
        console.error('Error checking verification status:', err);
        // Fallback to localStorage user
        const localUser = getCurrentUser();
        if (localUser && localUser.email) {
          setEmail(localUser.email);
        }
      }
    };

    checkVerification();
  }, [onVerificationSuccess]);

  const handleResendEmail = async () => {
    if (!email) {
      setError('Email address is required');
      return;
    }

    setIsVerifying(true);
    setError('');

    try {
      const result = await resendVerificationEmail(email);
      
      if (result.error) {
        throw new Error(result.error.message);
      }

      notifications.success('Verification email sent!', {
        title: 'Email Sent',
        description: 'Please check your email inbox (and spam folder) for the verification link.',
      });
    } catch (err: any) {
      let errorMessage = 'Failed to resend verification email. Please try again.';
      
      if (err.message) {
        errorMessage = err.message;
      }

      setError(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  if (isVerified) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-800 via-indigo-800 to-purple-800 p-4">
        <Card className="border border-slate-200 shadow-2xl bg-white backdrop-blur-xl max-w-md w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-slate-900">
              Email Verified!
            </CardTitle>
            <CardDescription className="text-slate-600 mt-2">
              Email verified successfully. Redirecting to login screen...
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
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-indigo-500 rounded-full mix-blend-multiply filter blur-3xl opacity-10 animate-pulse delay-1000"></div>
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
                <Button
                  onClick={handleResendEmail}
                  disabled={isVerifying || !email}
                  variant="outline"
                  className="w-full"
                >
                {isVerifying ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </span>
                ) : (
                  'Resend Verification Email'
                )}
                </Button>
              </div>

            <div className="pt-4 border-t border-slate-200">
              <Button
                onClick={onBackToHome}
                variant="ghost"
                className="w-full text-slate-600"
              >
                Back to Home
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

