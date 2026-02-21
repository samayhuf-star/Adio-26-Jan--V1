import React, { useState, useEffect } from 'react';
import { useAuthCompat } from '../utils/authCompat';
import { Button } from './ui/button';
import { notifications } from '../utils/notifications';
import { Loader2, ExternalLink, Unlink, CheckCircle2, Link2 } from 'lucide-react';

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
  const [checking, setChecking] = useState(true);
  const [disconnecting, setDisconnecting] = useState(false);

  useEffect(() => {
    checkStatus();

    const params = new URLSearchParams(window.location.search);
    if (params.get('google_ads_connected') === 'true') {
      notifications.success('Google Ads account connected successfully!');
      window.history.replaceState({}, '', window.location.pathname);
    } else if (params.get('google_ads_error')) {
      const err = params.get('google_ads_error');
      notifications.error(`Google Ads connection failed: ${err}`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, []);

  const checkStatus = async () => {
    try {
      const token = await getToken();
      if (!token) {
        setChecking(false);
        return;
      }
      const response = await fetch('/api/google-ads/auth/status', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        setIsConnected(data.connected);
        onStatusChange?.(data.connected);
      }
    } catch (err) {
      console.error('Error checking Google Ads status:', err);
    } finally {
      setChecking(false);
    }
  };

  const handleConnect = async () => {
    try {
      const token = await getToken();
      if (!token) {
        notifications.error('Please sign in first');
        return;
      }
      const response = await fetch('/api/google-ads/auth/url', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        window.location.href = data.url;
      } else {
        notifications.error('Failed to initiate Google Ads connection');
      }
    } catch (err) {
      notifications.error('Error connecting to Google Ads');
    }
  };

  const handleDisconnect = async () => {
    setDisconnecting(true);
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch('/api/google-ads/auth/disconnect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setIsConnected(false);
        onStatusChange?.(false);
        notifications.success('Google Ads disconnected');
      } else {
        notifications.error('Failed to disconnect Google Ads');
      }
    } catch (err) {
      notifications.error('Error disconnecting');
    } finally {
      setDisconnecting(false);
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
          <>
            <div className="flex items-center gap-1.5 text-sm text-green-700">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Google Ads Connected</span>
            </div>
            <button
              onClick={handleDisconnect}
              disabled={disconnecting}
              className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors ml-2"
            >
              {disconnecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Unlink className="w-3 h-3" />
              )}
              Disconnect
            </button>
          </>
        ) : (
          <button
            onClick={handleConnect}
            className="flex items-center gap-1.5 text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <Link2 className="w-3.5 h-3.5" />
            Connect Google Ads
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border p-3 ${isConnected ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'} ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <>
              <div className="w-2 h-2 rounded-full bg-green-500"></div>
              <span className="text-sm font-medium text-green-700">Google Ads Connected</span>
            </>
          ) : (
            <>
              <div className="w-2 h-2 rounded-full bg-slate-400"></div>
              <span className="text-sm font-medium text-slate-600">Google Ads Not Connected</span>
            </>
          )}
        </div>
        {isConnected ? (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleDisconnect}
            disabled={disconnecting}
            className="text-xs text-slate-500 hover:text-red-600 hover:bg-red-50 h-7 px-2"
          >
            {disconnecting ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1" />
            ) : (
              <Unlink className="w-3 h-3 mr-1" />
            )}
            Disconnect
          </Button>
        ) : (
          <Button
            size="sm"
            onClick={handleConnect}
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white h-7 px-3 text-xs"
          >
            <ExternalLink className="w-3 h-3 mr-1" />
            Connect
          </Button>
        )}
      </div>
    </div>
  );
}
