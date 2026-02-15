import React, { useState, useEffect } from 'react';
import { useAuthCompat } from '../utils/authCompat';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { notifications } from '../utils/notifications';
import { Loader2, Upload, CheckCircle2, ExternalLink, AlertCircle, Link2, Unlink, Building2, ChevronDown, RefreshCw, KeyRound } from 'lucide-react';

interface GoogleAdsAccount {
  id: string;
  name: string;
  isManager: boolean;
  managerId?: string;
  currencyCode?: string;
  timezone?: string;
}

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
  const [isConnected, setIsConnected] = useState(false);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [loginCustomerId, setLoginCustomerId] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [pushing, setPushing] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [pushResult, setPushResult] = useState<{ success: boolean; campaignId?: string; error?: string } | null>(null);
  const [manualCustomerId, setManualCustomerId] = useState('');
  const [accounts, setAccounts] = useState<GoogleAdsAccount[]>([]);
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [loadingAccounts, setLoadingAccounts] = useState(false);
  const [useManualEntry, setUseManualEntry] = useState(false);

  useEffect(() => {
    checkConnectionStatus();

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
        setIsConnected(data.connected);
        setCustomerId(data.customerId || null);
        setLoginCustomerId(data.loginCustomerId || null);
      }
    } catch (err) {
      console.error('Error checking Google Ads status:', err);
    } finally {
      setChecking(false);
    }
  };

  const fetchAccounts = async () => {
    setLoadingAccounts(true);
    try {
      const token = await getToken();
      if (!token) return;
      const response = await fetch('/api/google-ads/auth/accounts', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        const allAccounts: GoogleAdsAccount[] = data.accounts || [];
        setAccounts(allAccounts);
        if (allAccounts.length === 0) {
          setUseManualEntry(true);
        } else {
          setUseManualEntry(false);
          setSelectedAccountId(null);
        }
        if (data.loginCustomerId) {
          setLoginCustomerId(data.loginCustomerId);
        }
      }
    } catch (err) {
      console.error('Error fetching Google Ads accounts:', err);
      setUseManualEntry(true);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleConnectGoogleAds = async () => {
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
    try {
      const token = await getToken();
      const response = await fetch('/api/google-ads/auth/disconnect', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (response.ok) {
        setIsConnected(false);
        setCustomerId(null);
        setAccounts([]);
        setSelectedAccountId(null);
        setManualCustomerId('');
        setUseManualEntry(false);
        notifications.success('Google Ads disconnected');
      }
    } catch (err) {
      notifications.error('Error disconnecting');
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

      const targetAccountId = selectedAccountId;
      if (!targetAccountId) {
        setPushResult({ success: false, error: 'Please select a Google Ads account or enter a Customer ID' });
        setPushing(false);
        return;
      }
      const selectedAccount = accounts.find(a => a.id === targetAccountId);
      const managerForSelected = selectedAccount?.managerId 
        ? selectedAccount.managerId 
        : loginCustomerId;

      const payload: any = {
        campaignName: campaignData.campaignName,
        dailyBudget: budget,
        adGroups,
        headlines: headlines.slice(0, 15),
        descriptions: descriptions.slice(0, 4),
        finalUrl: campaignData.ads?.[0]?.finalUrl || campaignData.url || '',
        customerId: targetAccountId.replace(/-/g, ''),
      };

      if (managerForSelected) {
        payload.loginCustomerId = managerForSelected.replace(/-/g, '');
      }

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
    setManualCustomerId('');
    setSelectedAccountId(null);
    setUseManualEntry(false);
    setShowDialog(true);
    if (isConnected) {
      fetchAccounts();
    }
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

  const hasValidTarget = !!selectedAccountId;

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

              {!isConnected ? (
                <div className="space-y-3">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Link2 className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <h4 className="font-medium text-blue-900 mb-1">Connect Your Google Ads Account</h4>
                        <p className="text-sm text-blue-700 mb-3">
                          Sign in with Google to authorize Adiology to push campaigns to your account.
                        </p>
                        <ul className="text-xs text-blue-600 space-y-1 mb-3">
                          <li>1. Sign in with your Google account</li>
                          <li>2. Grant access to manage your Google Ads</li>
                          <li>3. Return here and select your account</li>
                          <li>4. Push your campaign</li>
                        </ul>
                        <Button
                          onClick={handleConnectGoogleAds}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white w-full"
                        >
                          <ExternalLink className="w-4 h-4 mr-2" />
                          Connect Google Ads Account
                        </Button>
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-500">
                    Campaigns are always created as PAUSED so you can review them before they go live.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-green-500"></div>
                      <span className="text-sm font-medium text-green-700">Google Ads Connected</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={handleDisconnect}
                        className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                        title="Disconnect Google Ads"
                      >
                        <Unlink className="w-3 h-3" />
                        Disconnect
                      </button>
                    </div>
                  </div>

                  <Label className="text-sm text-slate-700 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5" />
                    Select Google Ads Account
                  </Label>

                  {loadingAccounts ? (
                    <div className="flex items-center gap-2 text-sm text-slate-500 py-3 justify-center">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading your Google Ads accounts...
                    </div>
                  ) : !useManualEntry && accounts.length > 0 ? (
                    <div className="space-y-2">
                      <div className="relative">
                        <select
                          value={selectedAccountId || ''}
                          onChange={(e) => setSelectedAccountId(e.target.value)}
                          className="w-full px-3 py-2.5 pr-8 text-sm bg-white border border-slate-200 rounded-lg appearance-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-slate-900"
                        >
                          <option value="" disabled>Choose an account...</option>
                          {accounts.filter(a => !a.isManager).length > 0 && (
                            <optgroup label="Client Accounts">
                              {accounts.filter(a => !a.isManager).map(acct => (
                                <option key={acct.id} value={acct.id}>
                                  {acct.name} ({acct.id.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')})
                                  {acct.currencyCode ? ` - ${acct.currencyCode}` : ''}
                                </option>
                              ))}
                            </optgroup>
                          )}
                          {accounts.filter(a => a.isManager).length > 0 && (
                            <optgroup label="Manager Accounts (MCC)">
                              {accounts.filter(a => a.isManager).map(acct => (
                                <option key={acct.id} value={acct.id} disabled>
                                  {acct.name} ({acct.id.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}) - MCC
                                </option>
                              ))}
                            </optgroup>
                          )}
                        </select>
                        <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                      </div>
                      {accounts.find(a => a.id === selectedAccountId)?.managerId && (
                        <p className="text-xs text-indigo-600 flex items-center gap-1">
                          <Building2 className="w-3 h-3" />
                          Managed by MCC: {accounts.find(a => a.id === selectedAccountId)?.managerId?.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')}
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setUseManualEntry(true);
                          setSelectedAccountId(null);
                        }}
                        className="text-xs text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                      >
                        <KeyRound className="w-3 h-3" />
                        Enter Customer ID manually instead
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {accounts.length === 0 && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                          <p className="text-sm text-amber-800 font-medium mb-1">Auto-detection unavailable</p>
                          <p className="text-xs text-amber-700">
                            This can happen when the API is in test mode or still pending approval. Enter your Customer ID manually below.
                          </p>
                        </div>
                      )}
                      <Input
                        placeholder="e.g. 123-456-7890 or 1234567890"
                        value={manualCustomerId}
                        onChange={(e) => {
                          setManualCustomerId(e.target.value);
                          const cleaned = e.target.value.replace(/[-\s]/g, '');
                          if (cleaned.length === 10 && /^\d+$/.test(cleaned)) {
                            setSelectedAccountId(cleaned);
                          } else {
                            setSelectedAccountId(null);
                          }
                        }}
                        className="bg-white border-slate-200 text-slate-900"
                      />
                      <p className="text-xs text-slate-500">
                        Find this in Google Ads: top-right corner, or under Account Settings.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setUseManualEntry(false);
                            fetchAccounts();
                          }}
                          className="text-xs text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" />
                          Retry auto-detection
                        </button>
                        <span className="text-xs text-slate-400">|</span>
                        <button
                          onClick={handleConnectGoogleAds}
                          className="text-xs text-indigo-600 hover:text-indigo-800 underline flex items-center gap-1"
                        >
                          <ExternalLink className="w-3 h-3" />
                          Reconnect Google Ads
                        </button>
                      </div>
                    </div>
                  )}

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
                {isConnected && (
                  <Button
                    onClick={handlePush}
                    disabled={pushing || !hasValidTarget}
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
