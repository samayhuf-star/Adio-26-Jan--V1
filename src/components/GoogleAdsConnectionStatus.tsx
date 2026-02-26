import React, { useState, useEffect } from 'react';
import { useAuthCompat } from '../utils/authCompat';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { notifications } from '../utils/notifications';
import { Loader2, Unlink, CheckCircle2, Link2, AlertCircle, Clock, RefreshCw } from 'lucide-react';

interface GoogleAdsConnectionStatusProps {
  variant?: 'compact' | 'full';
  className?: string;
  onStatusChange?: (connected: boolean) => void;
}

export function GoogleAdsConnectionStatus({
  variant = 'compact',
  className = '',
  onStatusChange,
}: GoogleAdsConnectionStatusProps) {
  const { getToken } = useAuthCompat();
  const [isConnected, setIsConnected] = useState(false);
  const [invitePending, setInvitePending] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [unlinking, setUnlinking] = useState(false);
  const [linking, setLinking] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    try {
      const token = await getToken();
      if (!token) { setChecking(false); return; }
      const response = await fetch('/api/google-ads/auth/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
        setCustomerId(data.customerId || null);
        onStatusChange?.(data.connected);
        // If connected, silently check if invite is still pending
        if (data.connected) {
          checkLinkVerified(token, false);
        }
      }
    } catch (err) {
      console.error('Error checking Google Ads status:', err);
    } finally {
      setChecking(false);
    }
  };

  const checkLinkVerified = async (token: string, showNotification = true) => {
    try {
      const res = await fetch('/api/google-ads/check-link-status', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.verified) {
          setInvitePending(false);
          if (showNotification) notifications.success('Google Ads account verified and active!');
        } else if (data.pending) {
          setInvitePending(true);
          if (showNotification) notifications.error('Invitation not yet accepted. Check your Google Ads account.');
        }
      }
    } catch (err) {
      console.error('Error checking link status:', err);
    }
  };

  const formatCustomerId = (id: string) => {
    const clean = id.replace(/-/g, '');
    if (clean.length === 10) return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    return id;
  };

  const handleLink = async () => {
    const cleaned = inputValue.replace(/[-\s]/g, '');
    if (cleaned.length !== 10 || !/^\d+$/.test(cleaned)) {
      setLinkError('Enter a valid 10-digit Customer ID');
      return;
    }
    setLinking(true);
    setLinkError(null);
    try {
      const token = await getToken();
      if (!token) { notifications.error('Please sign in first'); return; }
      const response = await fetch('/api/google-ads/link-account', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ customerId: cleaned }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsConnected(true);
        setCustomerId(data.customerId);
        setShowLinkInput(false);
        setInputValue('');
        if (data.inviteSent) {
          setInvitePending(true);
          notifications.success('Invitation sent to your Google Ads account. Accept it to enable pushing campaigns.');
        } else {
          setInvitePending(false);
          onStatusChange?.(true);
          notifications.success(`Google Ads account linked: ${data.accountName}`);
        }
      } else {
        setLinkError(data.error || 'Failed to link account');
      }
    } catch (err) {
      setLinkError('Network error. Please try again.');
    } finally {
      setLinking(false);
    }
  };

  const handleVerify = async () => {
    setVerifying(true);
    try {
      const token = await getToken();
      if (!token) return;
      await checkLinkVerified(token, true);
    } finally {
      setVerifying(false);
    }
  };

  const handleUnlink = async () => {
    setUnlinking(true);
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch('/api/google-ads/unlink-account', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setIsConnected(false);
        setInvitePending(false);
        setCustomerId(null);
        onStatusChange?.(false);
        notifications.success('Google Ads account unlinked');
      } else {
        notifications.error('Failed to unlink account');
      }
    } catch (err) {
      notifications.error('Error unlinking');
    } finally {
      setUnlinking(false);
    }
  };

  if (checking) {
    return (
      <div className={`flex items-center gap-2 text-sm text-slate-400 ${className}`}>
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Checking Google Ads...</span>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {isConnected ? (
          invitePending ? (
            <>
              <div className="flex items-center gap-1.5 text-sm text-amber-600">
                <Clock className="w-3.5 h-3.5" />
                <span>Invite Pending: {customerId ? formatCustomerId(customerId) : ''}</span>
              </div>
              <button onClick={handleVerify} disabled={verifying} className="text-xs text-indigo-600 hover:text-indigo-800 flex items-center gap-1 ml-2">
                {verifying ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                Verify
              </button>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5 text-sm text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Google Ads: {customerId ? formatCustomerId(customerId) : 'Linked'}</span>
              </div>
              <button onClick={handleUnlink} disabled={unlinking} className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors ml-2">
                {unlinking ? <Loader2 className="w-3 h-3 animate-spin" /> : <Unlink className="w-3 h-3" />}
                Unlink
              </button>
            </>
          )
        ) : (
          <button onClick={() => setShowLinkInput(!showLinkInput)} className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 transition-colors">
            <Link2 className="w-3.5 h-3.5" />
            Link Google Ads
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-3 ${isConnected ? (invitePending ? 'bg-amber-50 border-amber-200' : 'bg-green-50 border-green-200') : 'bg-slate-50 border-slate-200'} ${className}`}>
      {isConnected && !invitePending ? (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-green-700">
              Google Ads Linked: {customerId ? formatCustomerId(customerId) : 'Connected'}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleUnlink} disabled={unlinking} className="text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 h-7 px-2">
            {unlinking ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <Unlink className="w-3 h-3 mr-1" />}
            Unlink
          </Button>
        </div>
      ) : isConnected && invitePending ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" />
            <span className="text-sm font-medium text-amber-700">
              Invite Sent — {customerId ? formatCustomerId(customerId) : ''}
            </span>
          </div>
          <p className="text-xs text-amber-600">
            We've sent a manager link invitation to your Google Ads account. Check your Google Ads notifications or email and accept it, then click "Verify" below.
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={handleVerify} disabled={verifying} className="bg-amber-500 hover:bg-amber-600 text-white h-7 px-3 text-xs">
              {verifying ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : <RefreshCw className="w-3 h-3 mr-1" />}
              {verifying ? 'Checking...' : 'Verify Acceptance'}
            </Button>
            <Button variant="ghost" size="sm" onClick={handleUnlink} disabled={unlinking} className="text-xs text-slate-400 hover:text-red-600 h-7 px-2">
              Unlink
            </Button>
          </div>
        </div>
      ) : showLinkInput ? (
        <div className="space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Link2 className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-medium text-slate-700">Link Your Google Ads Account</span>
          </div>
          <div className="flex gap-2">
            <Input
              placeholder="Enter Customer ID (e.g. 123-456-7890)"
              value={inputValue}
              onChange={(e) => { setInputValue(e.target.value); setLinkError(null); }}
              onKeyDown={(e) => e.key === 'Enter' && handleLink()}
              className="bg-white border-slate-200 text-slate-900 text-sm flex-1"
            />
            <Button size="sm" onClick={handleLink} disabled={linking} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-4">
              {linking ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Link'}
            </Button>
          </div>
          {linkError && (
            <div className="flex items-start gap-1.5 text-xs text-red-600">
              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
              <span className="whitespace-pre-line">{linkError}</span>
            </div>
          )}
          <p className="text-xs text-slate-500">Find your Customer ID in Google Ads: top-right corner or Account Settings.</p>
          <button onClick={() => { setShowLinkInput(false); setLinkError(null); }} className="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
        </div>
      ) : (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-slate-400"></div>
            <span className="text-sm font-medium text-slate-600">Google Ads Not Linked</span>
          </div>
          <Button size="sm" onClick={() => setShowLinkInput(true)} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-7 px-3 text-xs">
            <Link2 className="w-3 h-3 mr-1" />
            Link Account
          </Button>
        </div>
      )}
    </div>
  );
}
