import React, { useState, useEffect } from 'react';
import { useAuth, useUser } from '../utils/authCompat';
import { Users, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { toast } from 'sonner';

interface InviteInfo {
  organizationName: string;
  role: string;
  email?: string;
  expiresAt: string;
}

interface JoinTeamProps {
  onSuccess?: () => void;
  onBack?: () => void;
  initialCode?: string;
}

export const JoinTeam: React.FC<JoinTeamProps> = ({ onSuccess, onBack, initialCode }) => {
  const { getToken, isSignedIn } = useAuthCompat();
  const { user } = useUserCompat();
  const [code, setCode] = useState(initialCode || '');
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (initialCode) {
      validateCode(initialCode);
    }
  }, [initialCode]);

  const validateCode = async (codeToValidate: string) => {
    if (!codeToValidate.trim()) {
      setInviteInfo(null);
      return;
    }

    setIsValidating(true);
    setError(null);

    try {
      const response = await fetch(`/api/invites/${codeToValidate.trim().toUpperCase()}`);
      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Invalid invite code');
        setInviteInfo(null);
        return;
      }

      setInviteInfo(data.data);
    } catch (err) {
      setError('Failed to validate invite code');
      setInviteInfo(null);
    } finally {
      setIsValidating(false);
    }
  };

  const handleCodeChange = (newCode: string) => {
    const formatted = newCode.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(formatted);
    setError(null);
    setInviteInfo(null);

    if (formatted.length === 8) {
      validateCode(formatted);
    }
  };

  const handleJoin = async () => {
    if (!isSignedIn) {
      toast.error('Please sign in to join a team');
      return;
    }

    if (!code.trim()) {
      setError('Please enter an invite code');
      return;
    }

    setIsJoining(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`/api/invites/${code.trim().toUpperCase()}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to join team');
        return;
      }

      setSuccess(true);
      toast.success(data.message || 'Successfully joined the team!');
      
      if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to join team');
    } finally {
      setIsJoining(false);
    }
  };

  if (success) {
    return (
      <div className="p-6 max-w-md mx-auto text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-green-100 flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to the Team!</h2>
        <p className="text-gray-600 mb-6">
          You've successfully joined {inviteInfo?.organizationName || 'the organization'}.
        </p>
        {onBack && (
          <Button onClick={onBack} className="bg-gradient-to-r from-purple-600 to-pink-600">
            Go to Team Dashboard
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="p-6 max-w-md mx-auto space-y-6">
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
          <Users className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Join a Team</h2>
        <p className="text-gray-600">
          Enter the invite code you received to join your team.
        </p>
      </div>

      <div className="space-y-4">
        {error && (
          <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
            <AlertCircle className="h-4 w-4 flex-shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="text-sm font-medium mb-1 block">Invite Code</label>
          <Input
            placeholder="ABCD1234"
            value={code}
            onChange={(e) => handleCodeChange(e.target.value)}
            className="text-center font-mono text-xl tracking-wider"
            maxLength={8}
          />
        </div>

        {isValidating && (
          <div className="flex items-center justify-center gap-2 text-gray-500">
            <Loader2 className="w-4 h-4 animate-spin" />
            Validating code...
          </div>
        )}

        {inviteInfo && !error && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="font-medium text-green-800 mb-2">Valid invite!</p>
            <div className="text-sm text-green-700 space-y-1">
              <p><span className="font-medium">Organization:</span> {inviteInfo.organizationName}</p>
              <p><span className="font-medium">Role:</span> <span className="capitalize">{inviteInfo.role}</span></p>
              <p><span className="font-medium">Expires:</span> {new Date(inviteInfo.expiresAt).toLocaleDateString()}</p>
            </div>
          </div>
        )}

        <Button 
          onClick={handleJoin}
          disabled={!inviteInfo || isJoining || !isSignedIn}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
        >
          {isJoining ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Joining...
            </>
          ) : !isSignedIn ? (
            'Sign in to Join'
          ) : (
            'Join Team'
          )}
        </Button>

        {onBack && (
          <Button variant="ghost" onClick={onBack} className="w-full">
            Back
          </Button>
        )}
      </div>
    </div>
  );
};
