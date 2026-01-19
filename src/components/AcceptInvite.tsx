import React, { useState, useEffect } from 'react';
import { useAuthCompat, useUserCompat } from '../utils/authCompat';
import { CheckCircle, Loader2, AlertCircle, Users, Mail } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';

interface AcceptInviteProps {
  onComplete: () => void;
  onSignIn: () => void;
}

export const AcceptInvite: React.FC<AcceptInviteProps> = ({ onComplete, onSignIn }) => {
  const { isSignedIn } = useUserCompat();
  const { getToken } = useAuthCompat();
  const [status, setStatus] = useState<'loading' | 'pending' | 'success' | 'error'>('loading');
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const email = urlParams.get('email');
    setInviteEmail(email);
    
    if (email) {
      setStatus('pending');
    } else {
      setStatus('error');
      setError('No invitation email found in the link.');
    }
  }, []);

  useEffect(() => {
    if (isSignedIn && inviteEmail && status === 'pending') {
      handleAcceptInvite();
    }
  }, [isSignedIn, inviteEmail, status]);

  const handleAcceptInvite = async () => {
    try {
      setStatus('loading');
      const token = await getToken();
      
      if (!token) {
        setStatus('error');
        setError('Authentication required. Please sign in first.');
        return;
      }
      
      const response = await fetch('/api/team/accept-invite', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ email: inviteEmail })
      });
      
      if (response.status === 401) {
        setStatus('error');
        setError('Your session has expired. Please sign in again.');
        return;
      }
      
      if (response.status === 403) {
        setStatus('error');
        setError('This invitation has expired or is invalid.');
        return;
      }
      
      if (response.status === 404) {
        setStatus('error');
        setError('Invitation not found or has already been used.');
        return;
      }
      
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        setStatus('error');
        setError(data.error || 'Failed to process invitation.');
        return;
      }
      
      const data = await response.json();
      
      if (data.success || response.ok) {
        setStatus('success');
        setTimeout(() => {
          onComplete();
        }, 2000);
      } else {
        setStatus('error');
        setError(data.error || 'Failed to accept invitation. Please try again.');
      }
    } catch (err: any) {
      console.error('Accept invite error:', err);
      setStatus('error');
      setError('Unable to process invitation. Please try again later.');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center">
            <Users className="w-8 h-8 text-white" />
          </div>
          <CardTitle className="text-2xl">Team Invitation</CardTitle>
          <CardDescription>
            You've been invited to join a team on Adiology
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {inviteEmail && (
            <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <Mail className="w-5 h-5 text-slate-500" />
              <div>
                <p className="text-sm text-slate-500">Invitation sent to</p>
                <p className="font-medium">{inviteEmail}</p>
              </div>
            </div>
          )}

          {status === 'loading' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
              <p className="text-slate-600 dark:text-slate-400">Processing your invitation...</p>
            </div>
          )}

          {status === 'pending' && !isSignedIn && (
            <div className="space-y-4">
              <p className="text-center text-slate-600 dark:text-slate-400">
                Please sign in or create an account to accept this invitation.
              </p>
              <Button 
                onClick={onSignIn}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
              >
                Sign In to Accept
              </Button>
            </div>
          )}

          {status === 'success' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-green-600 font-medium">Invitation Accepted!</p>
              <p className="text-sm text-slate-500 text-center">
                Redirecting you to the dashboard...
              </p>
            </div>
          )}

          {status === 'error' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <p className="text-red-600 font-medium">Unable to Process</p>
              <p className="text-sm text-slate-500 text-center">{error}</p>
              <Button 
                onClick={onComplete}
                variant="outline"
                className="mt-2"
              >
                Go to Dashboard
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AcceptInvite;
