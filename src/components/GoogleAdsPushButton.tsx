import React, { useState, useEffect } from 'react';
import { useAuthCompat } from '../utils/authCompat';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { notifications } from '../utils/notifications';
import { Loader2, Upload, CheckCircle2, AlertCircle, Link2, Unlink, Building2, Clock, RefreshCw } from 'lucide-react';

interface GoogleAdsPushButtonProps {
  campaignData: {
    campaignName: string;
    dailyBudget?: number;
    monthlyBudget?: number;
    adGroups: Array<{
      name: string;
      keywords?: string[] | Array<{ text?: string; keyword?: string }>;
    }>;
    ads?: Array<{
      type?: string;
      headlines?: Array<{ text?: string } | string>;
      descriptions?: Array<{ text?: string } | string>;
      finalUrl?: string;
    }>;
    adCopy?: {
      headlines?: Array<{ text?: string } | string>;
      descriptions?: Array<{ text?: string } | string>;
    };
    url?: string;
    locations?: {
      countries?: string[];
      states?: string[];
      cities?: string[];
      zipCodes?: string[];
    };
    targetCountry?: string;
  };
  campaignHistoryId?: string;
  googleAdsId?: string;
  googleAdsPushStatus?: string;
  variant?: 'primary' | 'outline' | 'icon';
  size?: 'default' | 'sm' | 'lg';
  className?: string;
  onPushComplete?: (googleAdsId: string) => void;
}

export function GoogleAdsPushButton({
  campaignData,
  campaignHistoryId,
  googleAdsId,
  googleAdsPushStatus,
  variant = 'primary',
  size = 'default',
  className = '',
  onPushComplete,
}: GoogleAdsPushButtonProps) {
  const { getToken } = useAuthCompat();
  const [isLinked, setIsLinked] = useState(false);
  const [invitePending, setInvitePending] = useState(false);
  const [linkedCustomerId, setLinkedCustomerId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; campaignId?: string; error?: string } | null>(null);
  const [customerIdInput, setCustomerIdInput] = useState('');
  const [linking, setLinking] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  const checkConnectionStatus = async () => {
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
        setIsLinked(data.connected);
        setLinkedCustomerId(data.customerId || null);
      }
    } catch (err) {
      console.error('Error checking Google Ads status:', err);
    } finally {
      setChecking(false);
    }
  };

  const formatCustomerId = (id: string) => {
    const clean = id.replace(/-/g, '');
    if (clean.length === 10) {
      return `${clean.slice(0, 3)}-${clean.slice(3, 6)}-${clean.slice(6)}`;
    }
    return id;
  };

  const handleLinkAccount = async () => {
    const cleaned = customerIdInput.replace(/[-\s]/g, '');
    if (cleaned.length !== 10 || !/^\d+$/.test(cleaned)) {
      setLinkError('Enter a valid 10-digit Customer ID (e.g. 123-456-7890)');
      return;
    }

    setLinking(true);
    setLinkError(null);
    try {
      const token = await getToken();
      if (!token) {
        notifications.error('Please sign in first');
        return;
      }
      const response = await fetch('/api/google-ads/link-account', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ customerId: cleaned }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        setIsLinked(true);
        setLinkedCustomerId(data.customerId);
        setCustomerIdInput('');
        if (data.inviteSent) {
          setInvitePending(true);
          notifications.success('Invitation sent! Check your Google Ads account and accept it.');
        } else {
          setInvitePending(false);
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

  const handleVerifyInvite = async () => {
    setVerifying(true);
    try {
      const token = await getToken();
      if (!token) return;
      const res = await fetch('/api/google-ads/check-link-status', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.verified) {
          setInvitePending(false);
          notifications.success('Google Ads account verified and active!');
        } else {
          notifications.error('Invitation not yet accepted. Please check your Google Ads account.');
        }
      }
    } catch (err) {
      notifications.error('Error checking status');
    } finally {
      setVerifying(false);
    }
  };

  const handleUnlink = async () => {
    try {
      const token = await getToken();
      const response = await fetch('/api/google-ads/unlink-account', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setIsLinked(false);
        setLinkedCustomerId(null);
        setCustomerIdInput('');
        notifications.success('Google Ads account unlinked');
      }
    } catch (err) {
      notifications.error('Error unlinking account');
    }
  };

  const handlePush = async () => {
    setPushing(true);
    setPushResult(null);

    try {
      const token = await getToken();
      if (!token) {
        notifications.error('Please sign in first');
        setPushing(false);
        return;
      }

      const normalizeTextArray = (arr: any[] | undefined): string[] => {
        if (!arr) return [];
        return arr.map(item => {
          if (typeof item === 'string') return item;
          return item?.text || item?.keyword || '';
        }).filter(Boolean);
      };

      const headlines = normalizeTextArray(
        campaignData.ads?.[0]?.headlines || campaignData.adCopy?.headlines
      );
      const descriptions = normalizeTextArray(
        campaignData.ads?.[0]?.descriptions || campaignData.adCopy?.descriptions
      );

      const adGroups = campaignData.adGroups.map(ag => ({
        name: ag.name,
        keywords: (ag.keywords || []).map(kw => {
          if (typeof kw === 'string') return kw;
          return kw?.text || kw?.keyword || '';
        }).filter(Boolean),
      }));

      const budget = campaignData.dailyBudget || 
        (campaignData.monthlyBudget ? Math.round(campaignData.monthlyBudget / 30) : 50);

      const payload: any = {
        campaignName: campaignData.campaignName,
        dailyBudget: budget,
        adGroups,
        headlines: headlines.slice(0, 15),
        descriptions: descriptions.slice(0, 4),
        finalUrl: campaignData.ads?.[0]?.finalUrl || campaignData.url || '',
      };

      if (campaignHistoryId) {
        payload.campaignHistoryId = campaignHistoryId;
      }

      const isUpdate = googleAdsId && googleAdsPushStatus === 'pushed';
      const endpoint = isUpdate ? '/api/google-ads/update' : '/api/google-ads/push';
      
      if (isUpdate) {
        payload.googleAdsCampaignId = googleAdsId;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (response.ok && result.campaignId) {
        setPushResult({ success: true, campaignId: result.campaignId });
        notifications.success(isUpdate ? 'Campaign updated in Google Ads!' : 'Campaign pushed to Google Ads!', {
          description: `Campaign ID: ${result.campaignId}`,
        });
        onPushComplete?.(result.campaignId);
      } else {
        setPushResult({ success: false, error: result.error || 'Failed to push campaign' });
        notifications.error(result.error || 'Failed to push campaign');
      }
    } catch (err: any) {
      setPushResult({ success: false, error: err.message || 'Network error' });
      notifications.error('Error pushing campaign to Google Ads');
    } finally {
      setPushing(false);
    }
  };

  const handleOpenDialog = () => {
    setPushResult(null);
    setCustomerIdInput('');
    setLinkError(null);
    setShowDialog(true);
  };

  const handleCloseDialog = (open: boolean) => {
    if (!pushing) setShowDialog(open);
  };

  if (checking) {
    return (
      <Button disabled className={className} variant="outline" size={size === 'lg' ? 'lg' : 'default'}>
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Checking...
      </Button>
    );
  }

  const isPushed = googleAdsPushStatus === 'pushed';
  const buttonLabel = isPushed ? 'Update in Google Ads' : 'Push to Google Ads';
  const ButtonIcon = isPushed ? CheckCircle2 : Upload;

  return (
    <>
      {variant === 'icon' ? (
        <Button
          variant="ghost"
          size="icon"
          onClick={handleOpenDialog}
          className={`h-8 w-8 ${isPushed ? 'text-green-600 hover:text-green-700 hover:bg-green-50' : 'text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50'} ${className}`}
          title={buttonLabel}
        >
          <ButtonIcon className="w-4 h-4" />
        </Button>
      ) : variant === 'outline' ? (
        <Button
          variant="outline"
          onClick={handleOpenDialog}
          className={`${isPushed ? 'border-green-300 text-green-700 hover:bg-green-50' : 'border-indigo-300 text-indigo-700 hover:bg-indigo-50'} ${className}`}
          size={size === 'lg' ? 'lg' : 'default'}
        >
          <ButtonIcon className="w-4 h-4 mr-2" />
          {buttonLabel}
        </Button>
      ) : (
        <Button
          onClick={handleOpenDialog}
          className={`bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg ${className}`}
          size={size === 'lg' ? 'lg' : 'default'}
        >
          <ButtonIcon className="w-5 h-5 mr-2" />
          {buttonLabel}
        </Button>
      )}

      <Dialog open={showDialog} onOpenChange={handleCloseDialog}>
        <DialogContent className="bg-white max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-indigo-600" />
              {isPushed ? 'Update Campaign in Google Ads' : 'Push Campaign to Google Ads'}
            </DialogTitle>
            <DialogDescription className="text-slate-600">
              {isPushed 
                ? 'Update the existing campaign with your latest changes.' 
                : 'This will create a new PAUSED campaign in your Google Ads account.'}
            </DialogDescription>
          </DialogHeader>

          {pushResult ? (
            <div className="py-4">
              {pushResult.success ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                  <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                  <h4 className="font-semibold text-green-900 mb-1">
                    Campaign {isPushed ? 'Updated' : 'Created'} Successfully!
                  </h4>
                  <p className="text-sm text-green-700">
                    Google Ads Campaign ID: {pushResult.campaignId}
                  </p>
                  <p className="text-xs text-green-600 mt-2">
                    The campaign is set to PAUSED. Enable it in Google Ads when ready.
                  </p>
                </div>
              ) : (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <h4 className="font-semibold text-red-900 text-center mb-1">Push Failed</h4>
                  <p className="text-sm text-red-700 text-center">{pushResult.error}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Campaign:</span>
                  <span className="font-medium text-slate-900 truncate ml-2 max-w-[240px]">{campaignData.campaignName}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Ad Groups:</span>
                  <span className="font-medium text-slate-900">{campaignData.adGroups.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Daily Budget:</span>
                  <span className="font-medium text-slate-900">
                    ${campaignData.dailyBudget || (campaignData.monthlyBudget ? Math.round(campaignData.monthlyBudget / 30) : 50)}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Status:</span>
                  <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">PAUSED</Badge>
                </div>
              </div>

              {!isLinked ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Link2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium text-blue-900 mb-1">Link Your Google Ads Account</h4>
                        <p className="text-sm text-blue-700 mb-3">
                          Enter your Google Ads Customer ID to connect your account. You can find it in the top-right corner of Google Ads.
                        </p>
                        <div className="space-y-2">
                          <Input
                            placeholder="e.g. 123-456-7890"
                            value={customerIdInput}
                            onChange={(e) => {
                              setCustomerIdInput(e.target.value);
                              setLinkError(null);
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleLinkAccount()}
                            className="bg-white border-blue-200 text-slate-900"
                          />
                          {linkError && (
                            <div className="flex items-start gap-1.5 text-xs text-red-600">
                              <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                              <span>{linkError}</span>
                            </div>
                          )}
                          <Button
                            onClick={handleLinkAccount}
                            disabled={linking}
                            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full"
                          >
                            {linking ? (
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            ) : (
                              <Link2 className="w-4 h-4 mr-2" />
                            )}
                            {linking ? 'Linking...' : 'Link Google Ads Account'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Campaigns are always created as PAUSED so you can review them before they go live.
                  </p>
                </div>
              ) : invitePending ? (
                <div className="space-y-3">
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Clock className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <h4 className="font-medium text-amber-900 mb-1">Invitation Sent — Waiting for Acceptance</h4>
                        <p className="text-sm text-amber-700 mb-1">
                          We've sent a manager link invitation to your Google Ads account:
                        </p>
                        <p className="text-sm font-mono font-semibold text-amber-800 mb-3">
                          {linkedCustomerId ? formatCustomerId(linkedCustomerId) : ''}
                        </p>
                        <p className="text-xs text-amber-600 mb-3">
                          Check your Google Ads notifications (bell icon) or the email linked to your Google Ads account. Accept the invitation, then click "Verify Acceptance" below.
                        </p>
                        <Button
                          onClick={handleVerifyInvite}
                          disabled={verifying}
                          size="sm"
                          className="bg-amber-500 hover:bg-amber-600 text-white w-full"
                        >
                          {verifying ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Checking...</>
                          ) : (
                            <><RefreshCw className="w-4 h-4 mr-2" />Verify Acceptance</>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                  <button onClick={handleUnlink} className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1">
                    <Unlink className="w-3 h-3" /> Unlink and try different account
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-green-700">Google Ads Linked</span>
                    </div>
                    <button
                      onClick={handleUnlink}
                      className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                      title="Unlink Google Ads"
                    >
                      <Unlink className="w-3 h-3" />
                      Unlink
                    </button>
                  </div>

                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-green-600" />
                      <span className="text-sm text-green-800 font-medium">
                        Customer ID: {linkedCustomerId ? formatCustomerId(linkedCustomerId) : 'Linked'}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-500">
                    The campaign will be created as PAUSED so you can review it in Google Ads before enabling it.
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            {pushResult ? (
              <Button onClick={() => { setShowDialog(false); setPushResult(null); }}>
                Close
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setShowDialog(false)} disabled={pushing}>
                  Cancel
                </Button>
                {isLinked && !invitePending && (
                  <Button
                    onClick={handlePush}
                    disabled={pushing}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white disabled:opacity-50"
                  >
                    {pushing ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Pushing...
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4 mr-2" />
                        {isPushed ? 'Update Campaign' : 'Push Campaign'}
                      </>
                    )}
                  </Button>
                )}
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
