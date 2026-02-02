import { useState, useEffect, useCallback, useRef } from 'react';
import { useAccessToken, useAuthenticationStatus, useUserData } from '@nhost/react';
import { nhost } from '../lib/nhost';
import { getSessionToken } from '../utils/auth';
import { useAuthCompat } from '../utils/authCompat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { notifications } from '../utils/notifications';
import { 
  Globe, 
  Plus, 
  RefreshCw, 
  Trash2, 
  Shield, 
  Server, 
  Clock, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  ExternalLink,
  Settings,
  Search,
  Copy,
  Eye
} from 'lucide-react';

interface MonitoredDomain {
  id: string;
  userId: string;
  domain: string;
  registrar: string | null;
  expiryDate: string | null;
  createdDate: string | null;
  updatedDate: string | null;
  nameServers: string[];
  whoisData: any;
  sslIssuer: string | null;
  sslExpiryDate: string | null;
  sslValidFrom: string | null;
  sslData: any;
  dnsRecords: any;
  lastCheckedAt: string | null;
  alertDays: number[];
  alertsEnabled: boolean;
  alertEmail: string | null;
  notes: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export default function DomainMonitoring() {
  const accessToken = useAccessToken();
  const { isLoading: isAuthLoading, isAuthenticated } = useAuthenticationStatus();
  const userData = useUserData();
  const { getToken } = useAuthCompat();
  const getTokenRef = useRef(getToken);
  getTokenRef.current = getToken;
  const [domains, setDomains] = useState<MonitoredDomain[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [settingsModalOpen, setSettingsModalOpen] = useState(false);
  const [selectedDomain, setSelectedDomain] = useState<MonitoredDomain | null>(null);
  const [newDomain, setNewDomain] = useState('');
  const [newAlertEmail, setNewAlertEmail] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [refreshingId, setRefreshingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('whois');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupModalOpen, setLookupModalOpen] = useState(false);

  // State for async token fetching - initialize from localStorage immediately
  const [cachedToken, setCachedToken] = useState<string | null>(() => {
    // Try to get token immediately on mount
    try {
      return localStorage.getItem('auth_token');
    } catch {
      return null;
    }
  });

  // Log only once per "not authenticated" or "auth loading" state to avoid console spam
  const hasLoggedNotAuthenticated = useRef(false);
  const hasLoggedAuthLoading = useRef(false);
  const retryCountRef = useRef(0);
  
  // Fetch token on mount and when auth state changes with retry mechanism
  useEffect(() => {
    let isMounted = true;
    const maxRetries = 5;
    retryCountRef.current = 0; // Reset on each effect run
    
    const tryGetToken = (): string | null => {
      if (accessToken) return accessToken;
      try {
        const session = nhost.auth.getSession();
        if (session?.accessToken) return session.accessToken;
      } catch {
        // ignore
      }
      try {
        const localToken = localStorage.getItem('auth_token');
        if (localToken) return localToken;
      } catch {
        // ignore
      }
      return null;
    };
    
    const fetchToken = async () => {
      if (isAuthLoading) {
        if (!hasLoggedAuthLoading.current) {
          hasLoggedAuthLoading.current = true;
        }
        return;
      }
      hasLoggedAuthLoading.current = false;
      
      let token = tryGetToken();
      
      if (!token && isAuthenticated && retryCountRef.current < maxRetries) {
        retryCountRef.current += 1;
        setTimeout(() => {
          if (isMounted) {
            const retryToken = tryGetToken();
            if (retryToken) {
              setCachedToken(retryToken);
              retryCountRef.current = 0;
            } else if (retryCountRef.current < maxRetries) {
              fetchToken();
            }
          }
        }, 500);
        return;
      }
      
      if (!token) {
        try {
          token = await getSessionToken();
        } catch {
          // ignore
        }
      }
      
      if (isMounted) {
        if (token) {
          setCachedToken(token);
          hasLoggedNotAuthenticated.current = false;
        } else {
          setCachedToken(null);
          if (!hasLoggedNotAuthenticated.current) {
            hasLoggedNotAuthenticated.current = true;
          }
        }
      }
    };
    
    fetchToken();
    
    return () => {
      isMounted = false;
    };
  }, [accessToken, isAuthenticated, isAuthLoading]);
  
  const getAuthHeaders = useCallback((): Record<string, string> => {
    return cachedToken ? { Authorization: `Bearer ${cachedToken}` } : {};
  }, [cachedToken]);

  const fetchDomains = useCallback(async () => {
    try {
      // Try to get token - first from cache, then from hook (via ref to avoid dependency loop)
      let token = cachedToken;
      if (!token) {
        token = await getTokenRef.current();
      }
      
      if (!token) {
        console.log('[DomainMonitoring] No auth token for fetching domains');
        setLoading(false);
        return;
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      console.log('[DomainMonitoring] Fetching domains with auth token');
      
      const response = await fetch('/api/domains', {
        headers
      });
      
      if (response.ok) {
        const data = await response.json();
        setDomains(data);
      } else if (response.status === 401) {
        console.error('[DomainMonitoring] Authentication required - user not logged in');
        notifications.error('Please sign in to view your domains');
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        console.error('[DomainMonitoring] Fetch error:', error);
        notifications.error(error.error || 'Failed to load domains');
      }
    } catch (error) {
      console.error('Failed to fetch domains:', error);
      notifications.error('Failed to load domains. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [cachedToken]);

  useEffect(() => {
    if (isAuthLoading) {
      return;
    }
    if (isAuthenticated) {
      hasLoggedNotAuthenticated.current = false;
    }
    if (cachedToken) {
      fetchDomains();
    } else if (!isAuthenticated) {
      if (!hasLoggedNotAuthenticated.current) {
        hasLoggedNotAuthenticated.current = true;
      }
      setLoading(false);
      setDomains([]);
    }
  }, [isAuthLoading, isAuthenticated, cachedToken, fetchDomains]);

  const [addProgress, setAddProgress] = useState<string>('');
  
  const addDomain = async () => {
    if (!newDomain.trim()) return;
    
    // Try to get token - first from cache, then from hook
    let token = cachedToken;
    if (!token) {
      console.log('[DomainMonitoring] No cached token, trying getToken()...');
      token = await getTokenRef.current();
    }
    
    if (!token) {
      notifications.error('Please sign in to add domains');
      console.error('[DomainMonitoring] Cannot add domain - no auth token available');
      return;
    }
    
    const headers = { Authorization: `Bearer ${token}` };
    
    try {
      setAddLoading(true);
      setAddProgress('Adding domain...');
      console.log('[DomainMonitoring] Adding domain with auth token');
      
      const response = await fetch('/api/domains', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers
        },
        body: JSON.stringify({
          domain: newDomain,
          alertEmail: newAlertEmail || undefined,
          notes: newNotes || undefined
        })
      });
      
      if (response.ok) {
        const domain = await response.json();
        setAddProgress('Fetching WHOIS data...');
        
        await new Promise(r => setTimeout(r, 1000));
        setAddProgress('Checking SSL certificate...');
        
        await new Promise(r => setTimeout(r, 1000));
        setAddProgress('Resolving DNS records...');
        
        await new Promise(r => setTimeout(r, 1000));
        
        setDomains(prev => [domain, ...prev]);
        setAddModalOpen(false);
        setNewDomain('');
        setNewAlertEmail('');
        setNewNotes('');
        setAddProgress('');
        notifications.success('Domain added successfully! Fetching latest information...');
        
        setTimeout(() => {
          refreshDomain(domain.id);
        }, 500);
      } else {
        const error = await response.json();
        const errorMsg = error.error || 'Failed to add domain';
        console.error('[DomainMonitoring] Add domain error:', errorMsg);
        notifications.error(errorMsg);
      }
    } catch (error) {
      console.error('Failed to add domain:', error);
      notifications.error('Failed to add domain. Please try again.');
    } finally {
      setAddLoading(false);
      setAddProgress('');
    }
  };

  const refreshDomain = async (domainId: string) => {
    try {
      setRefreshingId(domainId);
      
      let token = cachedToken;
      if (!token) {
        token = await getTokenRef.current();
      }
      if (!token) {
        notifications.error('Please sign in to refresh domain');
        return;
      }
      
      const response = await fetch(`/api/domains/${domainId}/refresh`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        const updated = await response.json();
        setDomains(prev => prev.map(d => d.id === domainId ? updated : d));
        if (selectedDomain?.id === domainId) {
          setSelectedDomain(updated);
        }
        notifications.success('Domain data refreshed');
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        notifications.error(error.error || 'Failed to refresh domain data');
      }
    } catch (error) {
      console.error('Failed to refresh domain:', error);
      notifications.error('Failed to refresh domain data. Please try again.');
    } finally {
      setRefreshingId(null);
    }
  };

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  
  const deleteDomain = async (domainId: string) => {
    try {
      let token = cachedToken;
      if (!token) {
        token = await getTokenRef.current();
      }
      if (!token) {
        notifications.error('Please sign in to delete domain');
        return;
      }
      
      const response = await fetch(`/api/domains/${domainId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      
      if (response.ok) {
        setDomains(prev => prev.filter(d => d.id !== domainId));
        if (selectedDomain?.id === domainId) {
          setDetailModalOpen(false);
          setSelectedDomain(null);
        }
        notifications.success('Domain removed from monitoring');
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        notifications.error(error.error || 'Failed to delete domain');
      }
    } catch (error) {
      console.error('Failed to delete domain:', error);
      notifications.error('Failed to delete domain. Please try again.');
    } finally {
      setDeleteConfirmId(null);
    }
  };

  const quickLookup = async () => {
    if (!searchTerm.trim()) {
      notifications.error('Please enter a domain name to search');
      return;
    }
    
    try {
      setLookupLoading(true);
      setLookupResult(null);
      
      const domain = searchTerm.trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
      
      const [whoisRes, sslRes, dnsRes] = await Promise.all([
        fetch(`/api/domains/lookup/whois?domain=${encodeURIComponent(domain)}`),
        fetch(`/api/domains/lookup/ssl?domain=${encodeURIComponent(domain)}`),
        fetch(`/api/domains/lookup/dns?domain=${encodeURIComponent(domain)}`)
      ]);
      
      const whoisData = whoisRes.ok ? await whoisRes.json() : null;
      const sslData = sslRes.ok ? await sslRes.json() : null;
      const dnsData = dnsRes.ok ? await dnsRes.json() : null;
      
      setLookupResult({
        domain,
        whois: whoisData,
        ssl: sslData,
        dns: dnsData
      });
      setLookupModalOpen(true);
    } catch (error) {
      console.error('Quick lookup failed:', error);
      notifications.error('Failed to lookup domain. Please try again.');
    } finally {
      setLookupLoading(false);
    }
  };

  const updateDomainSettings = async () => {
    if (!selectedDomain) return;
    
    try {
      let token = cachedToken;
      if (!token) {
        token = await getTokenRef.current();
      }
      if (!token) {
        notifications.error('Please sign in to update settings');
        return;
      }
      
      const response = await fetch(`/api/domains/${selectedDomain.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          alertsEnabled: selectedDomain.alertsEnabled,
          alertEmail: selectedDomain.alertEmail,
          notes: selectedDomain.notes
        })
      });
      
      if (response.ok) {
        const updated = await response.json();
        setDomains(prev => prev.map(d => d.id === selectedDomain.id ? updated : d));
        setSelectedDomain(updated);
        setSettingsModalOpen(false);
        notifications.success('Domain settings updated');
      } else {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        notifications.error(error.error || 'Failed to update settings');
      }
    } catch (error) {
      console.error('Failed to update domain settings:', error);
      notifications.error('Failed to update settings. Please try again.');
    }
  };

  const openDetailModal = (domain: MonitoredDomain) => {
    setSelectedDomain(domain);
    setDetailModalOpen(true);
    setActiveTab('whois');
  };

  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return 'Unknown';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getDaysUntilExpiry = (dateStr: string | null): number | null => {
    if (!dateStr) return null;
    const expiry = new Date(dateStr);
    const now = new Date();
    return Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getExpiryStatus = (days: number | null) => {
    if (days === null) return { color: 'bg-slate-500', label: 'Unknown' };
    if (days < 0) return { color: 'bg-red-600', label: 'Expired' };
    if (days <= 7) return { color: 'bg-red-500', label: 'Critical' };
    if (days <= 30) return { color: 'bg-orange-500', label: 'Warning' };
    if (days <= 90) return { color: 'bg-yellow-500', label: 'Attention' };
    return { color: 'bg-green-500', label: 'Good' };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const filteredDomains = domains.filter(d => 
    d.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Globe className="w-7 h-7 text-blue-600" />
            Domain Monitoring
          </h1>
          <p className="text-gray-600 mt-1">Track domain expiry, SSL certificates, and DNS records</p>
        </div>
        <Button 
          onClick={() => {
            if (!cachedToken) {
              notifications.error('Please sign in to add domains');
              return;
            }
            setAddModalOpen(true);
          }}
          disabled={isAuthLoading}
          className="bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Domain
        </Button>
      </div>

      <div className="flex gap-2 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && quickLookup()}
            placeholder="Enter domain to lookup (e.g., example.com)"
            className="pl-10 bg-white border-gray-300 text-gray-900"
          />
        </div>
        <Button 
          onClick={quickLookup}
          disabled={lookupLoading || !searchTerm.trim()}
          className="bg-blue-600 hover:bg-blue-700 min-w-[100px]"
        >
          {lookupLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <>
              <Search className="w-4 h-4 mr-2" />
              Lookup
            </>
          )}
        </Button>
      </div>

      {filteredDomains.length === 0 ? (
        <Card className="bg-white border-gray-200 shadow-sm">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Globe className="w-16 h-16 text-gray-400 mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">No domains yet</h3>
            <p className="text-gray-500 text-center mb-4">
              Add your first domain to start monitoring its status
            </p>
            <Button 
              onClick={() => {
                const headers = getAuthHeaders();
                if (Object.keys(headers).length === 0) {
                  notifications.error('Please sign in to add domains');
                  return;
                }
                setAddModalOpen(true);
              }}
              disabled={isAuthLoading}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Domain
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDomains.map((domain) => {
            const domainExpiry = getDaysUntilExpiry(domain.expiryDate);
            const sslExpiry = getDaysUntilExpiry(domain.sslExpiryDate);
            const domainStatus = getExpiryStatus(domainExpiry);
            const sslStatus = getExpiryStatus(sslExpiry);

            return (
              <Card 
                key={domain.id} 
                className="bg-white border-gray-200 hover:border-blue-300 transition-colors cursor-pointer shadow-sm"
                onClick={() => openDetailModal(domain)}
              >
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-gray-900 text-lg truncate flex items-center gap-2">
                        <Globe className="w-4 h-4 text-blue-600 flex-shrink-0" />
                        {domain.domain}
                      </CardTitle>
                      <CardDescription className="text-gray-500 text-sm mt-1">
                        {domain.registrar || 'Unknown registrar'}
                      </CardDescription>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          refreshDomain(domain.id);
                        }}
                        disabled={refreshingId === domain.id}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-blue-600"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshingId === domain.id ? 'animate-spin' : ''}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDomain(domain.id);
                        }}
                        className="h-8 w-8 p-0 text-gray-500 hover:text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Domain Expiry</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{formatDate(domain.expiryDate)}</span>
                      <Badge className={`${domainStatus.color} text-white text-xs`}>
                        {domainExpiry !== null ? `${domainExpiry}d` : '?'}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-gray-500" />
                      <span className="text-sm text-gray-600">SSL Expiry</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-900">{formatDate(domain.sslExpiryDate)}</span>
                      {domain.sslExpiryDate ? (
                        <Badge className={`${sslStatus.color} text-white text-xs`}>
                          {sslExpiry !== null ? `${sslExpiry}d` : '?'}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-400 text-white text-xs">No SSL</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>Last checked: {formatDate(domain.lastCheckedAt)}</span>
                    {domain.alertsEnabled ? (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    ) : (
                      <XCircle className="w-4 h-4 text-gray-400" />
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={addModalOpen} onOpenChange={(open) => !addLoading && setAddModalOpen(open)}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Add Domain</DialogTitle>
            <DialogDescription className="text-gray-500">
              Enter a domain name to start monitoring. We'll fetch WHOIS, SSL, and DNS information automatically.
            </DialogDescription>
          </DialogHeader>
          
          {addLoading && addProgress ? (
            <div className="py-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <RefreshCw className="w-12 h-12 text-blue-600 animate-spin" />
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">{addProgress}</p>
                  <p className="text-sm text-gray-500">This may take up to 30 seconds...</p>
                </div>
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mt-4">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-1000"
                    style={{ 
                      width: addProgress.includes('Adding') ? '10%' : 
                             addProgress.includes('WHOIS') ? '40%' : 
                             addProgress.includes('SSL') ? '70%' : 
                             addProgress.includes('DNS') ? '90%' : '100%' 
                    }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Domain Name</label>
                <Input
                  value={newDomain}
                  onChange={(e) => setNewDomain(e.target.value)}
                  placeholder="example.com"
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Alert Email (optional)</label>
                <Input
                  value={newAlertEmail}
                  onChange={(e) => setNewAlertEmail(e.target.value)}
                  placeholder="alerts@example.com"
                  type="email"
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                <Input
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Internal notes about this domain..."
                  className="bg-white border-gray-300 text-gray-900"
                />
              </div>
            </div>
          )}
          
          {!addLoading && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                className="border-gray-300 text-gray-700 hover:bg-gray-100"
              >
                Cancel
              </Button>
              <Button
                onClick={addDomain}
                disabled={!newDomain.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Domain
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-gray-900 text-xl flex items-center gap-2">
                  <Globe className="w-5 h-5 text-blue-600" />
                  {selectedDomain?.domain}
                </DialogTitle>
                <DialogDescription className="text-gray-500">
                  {selectedDomain?.registrar || 'Unknown registrar'}
                </DialogDescription>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => selectedDomain && refreshDomain(selectedDomain.id)}
                  disabled={refreshingId === selectedDomain?.id}
                  className="border-gray-300 text-gray-700"
                >
                  <RefreshCw className={`w-4 h-4 mr-1 ${refreshingId === selectedDomain?.id ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSettingsModalOpen(true)}
                  className="border-gray-300 text-gray-700"
                >
                  <Settings className="w-4 h-4 mr-1" />
                  Settings
                </Button>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="bg-gray-100 border-gray-200">
              <TabsTrigger value="whois" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Clock className="w-4 h-4 mr-2" />
                WHOIS
              </TabsTrigger>
              <TabsTrigger value="ssl" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Shield className="w-4 h-4 mr-2" />
                SSL
              </TabsTrigger>
              <TabsTrigger value="dns" className="data-[state=active]:bg-white data-[state=active]:text-gray-900">
                <Server className="w-4 h-4 mr-2" />
                DNS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="whois" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Registration Date</div>
                  <div className="text-gray-900 font-medium">{formatDate(selectedDomain?.createdDate)}</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Expiry Date</div>
                  <div className="text-gray-900 font-medium">{formatDate(selectedDomain?.expiryDate)}</div>
                  {selectedDomain?.expiryDate && (
                    <div className="mt-1">
                      <Badge className={`${getExpiryStatus(getDaysUntilExpiry(selectedDomain.expiryDate)).color} text-white text-xs`}>
                        {getDaysUntilExpiry(selectedDomain.expiryDate)} days remaining
                      </Badge>
                    </div>
                  )}
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Last Updated</div>
                  <div className="text-gray-900 font-medium">{formatDate(selectedDomain?.updatedDate)}</div>
                </div>
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-1">Registrar</div>
                  <div className="text-gray-900 font-medium">{selectedDomain?.registrar || 'Unknown'}</div>
                </div>
              </div>

              {selectedDomain?.nameServers && selectedDomain.nameServers.length > 0 && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="text-sm text-gray-500 mb-2">Name Servers</div>
                  <div className="space-y-1">
                    {selectedDomain.nameServers.map((ns, i) => (
                      <div key={i} className="flex items-center justify-between text-gray-900 text-sm">
                        <span>{ns}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(ns)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDomain?.whoisData?.raw && (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Raw WHOIS Data</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedDomain.whoisData.raw)}
                      className="h-6 text-gray-500 hover:text-blue-600"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-xs text-gray-700 overflow-auto max-h-60 whitespace-pre-wrap font-mono bg-gray-100 rounded p-3">
                    {selectedDomain.whoisData.raw}
                  </pre>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ssl" className="mt-4 space-y-4">
              {selectedDomain?.sslData && Object.keys(selectedDomain.sslData).length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Issuer</div>
                      <div className="text-gray-900 font-medium">{selectedDomain.sslIssuer || 'Unknown'}</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Valid From</div>
                      <div className="text-gray-900 font-medium">{formatDate(selectedDomain.sslValidFrom)}</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Valid Until</div>
                      <div className="text-gray-900 font-medium">{formatDate(selectedDomain.sslExpiryDate)}</div>
                      {selectedDomain.sslExpiryDate && (
                        <div className="mt-1">
                          <Badge className={`${getExpiryStatus(getDaysUntilExpiry(selectedDomain.sslExpiryDate)).color} text-white text-xs`}>
                            {getDaysUntilExpiry(selectedDomain.sslExpiryDate)} days remaining
                          </Badge>
                        </div>
                      )}
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Status</div>
                      <div className="flex items-center gap-2">
                        {selectedDomain.sslData.isValid ? (
                          <>
                            <CheckCircle className="w-4 h-4 text-green-500" />
                            <span className="text-green-600 font-medium">Valid</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-red-500" />
                            <span className="text-red-600 font-medium">Invalid</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedDomain.sslData.altNames && selectedDomain.sslData.altNames.length > 0 && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-2">Subject Alternative Names</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedDomain.sslData.altNames.map((name: string, i: number) => (
                          <Badge key={i} className="bg-blue-100 text-blue-800">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Protocol</div>
                      <div className="text-gray-900 font-medium">{selectedDomain.sslData.protocol || 'Unknown'}</div>
                    </div>
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-1">Cipher</div>
                      <div className="text-gray-900 font-medium text-sm">{selectedDomain.sslData.cipher || 'Unknown'}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No SSL certificate found or unable to retrieve SSL data</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="dns" className="mt-4 space-y-4">
              {selectedDomain?.dnsRecords && Object.keys(selectedDomain.dnsRecords).length > 0 ? (
                <>
                  {selectedDomain.dnsRecords.a && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-2">A Records (IPv4)</div>
                      <div className="space-y-1">
                        {selectedDomain.dnsRecords.a.map((ip: string, i: number) => (
                          <div key={i} className="flex items-center justify-between text-gray-900 text-sm font-mono">
                            <span>{ip}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(ip)}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDomain.dnsRecords.aaaa && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-2">AAAA Records (IPv6)</div>
                      <div className="space-y-1">
                        {selectedDomain.dnsRecords.aaaa.map((ip: string, i: number) => (
                          <div key={i} className="flex items-center justify-between text-gray-900 text-sm font-mono">
                            <span className="truncate">{ip}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(ip)}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-blue-600 flex-shrink-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDomain.dnsRecords.mx && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-2">MX Records (Mail)</div>
                      <div className="space-y-1">
                        {selectedDomain.dnsRecords.mx.map((mx: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-gray-900 text-sm">
                            <span className="font-mono">
                              <span className="text-blue-600">{mx.priority}</span> {mx.exchange}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDomain.dnsRecords.ns && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-2">NS Records (Nameservers)</div>
                      <div className="space-y-1">
                        {selectedDomain.dnsRecords.ns.map((ns: string, i: number) => (
                          <div key={i} className="text-gray-900 text-sm font-mono">{ns}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDomain.dnsRecords.txt && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-2">TXT Records</div>
                      <div className="space-y-2">
                        {selectedDomain.dnsRecords.txt.map((txt: string[], i: number) => (
                          <div key={i} className="text-gray-700 text-xs font-mono bg-gray-100 rounded p-2 break-all">
                            {txt.join('')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDomain.dnsRecords.cname && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="text-sm text-gray-500 mb-2">CNAME Records</div>
                      <div className="space-y-1">
                        {selectedDomain.dnsRecords.cname.map((cname: string, i: number) => (
                          <div key={i} className="text-gray-900 text-sm font-mono">{cname}</div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <Server className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">No DNS records found or unable to retrieve DNS data</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900">
          <DialogHeader>
            <DialogTitle className="text-gray-900">Domain Settings</DialogTitle>
            <DialogDescription className="text-gray-500">
              Configure alerts and notifications for {selectedDomain?.domain}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm font-medium text-gray-900">Enable Alerts</div>
                <div className="text-xs text-gray-500">Receive notifications before expiry</div>
              </div>
              <Switch
                checked={selectedDomain?.alertsEnabled ?? true}
                onCheckedChange={(checked) => 
                  setSelectedDomain(prev => prev ? { ...prev, alertsEnabled: checked } : null)
                }
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Alert Email</label>
              <Input
                value={selectedDomain?.alertEmail || ''}
                onChange={(e) => 
                  setSelectedDomain(prev => prev ? { ...prev, alertEmail: e.target.value } : null)
                }
                placeholder="alerts@example.com"
                type="email"
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Notes</label>
              <Input
                value={selectedDomain?.notes || ''}
                onChange={(e) => 
                  setSelectedDomain(prev => prev ? { ...prev, notes: e.target.value } : null)
                }
                placeholder="Internal notes..."
                className="bg-white border-gray-300 text-gray-900"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsModalOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button onClick={updateDomainSettings} className="bg-blue-600 hover:bg-blue-700">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lookupModalOpen} onOpenChange={setLookupModalOpen}>
        <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-600" />
              Domain Lookup: {lookupResult?.domain}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Quick lookup results for the specified domain
            </DialogDescription>
          </DialogHeader>
          
          {lookupResult && (
            <Tabs defaultValue="whois" className="mt-4">
              <TabsList className="bg-gray-100 p-1">
                <TabsTrigger value="whois" className="data-[state=active]:bg-white">
                  <Clock className="w-4 h-4 mr-2" />
                  WHOIS
                </TabsTrigger>
                <TabsTrigger value="ssl" className="data-[state=active]:bg-white">
                  <Shield className="w-4 h-4 mr-2" />
                  SSL
                </TabsTrigger>
                <TabsTrigger value="dns" className="data-[state=active]:bg-white">
                  <Server className="w-4 h-4 mr-2" />
                  DNS
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="whois" className="mt-4">
                {lookupResult.whois ? (
                  <div className="space-y-3 text-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-gray-500">Registrar:</div>
                      <div className="font-medium">{lookupResult.whois.registrar || 'N/A'}</div>
                      <div className="text-gray-500">Created:</div>
                      <div className="font-medium">{lookupResult.whois.creationDate ? new Date(lookupResult.whois.creationDate).toLocaleDateString() : 'N/A'}</div>
                      <div className="text-gray-500">Expires:</div>
                      <div className="font-medium">{lookupResult.whois.expiryDate ? new Date(lookupResult.whois.expiryDate).toLocaleDateString() : 'N/A'}</div>
                      <div className="text-gray-500">Updated:</div>
                      <div className="font-medium">{lookupResult.whois.updatedDate ? new Date(lookupResult.whois.updatedDate).toLocaleDateString() : 'N/A'}</div>
                    </div>
                    {lookupResult.whois.nameServers && lookupResult.whois.nameServers.length > 0 && (
                      <div className="mt-4">
                        <div className="text-gray-500 mb-1">Name Servers:</div>
                        <div className="space-y-1">
                          {lookupResult.whois.nameServers.map((ns: string, i: number) => (
                            <Badge key={i} variant="secondary" className="mr-1 bg-gray-100">{ns}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>WHOIS data not available</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="ssl" className="mt-4">
                {lookupResult.ssl ? (
                  <div className="space-y-3 text-sm">
                    <div className="flex items-center gap-2 mb-4">
                      {lookupResult.ssl.valid ? (
                        <Badge className="bg-green-100 text-green-800">
                          <CheckCircle className="w-3 h-3 mr-1" /> Valid SSL
                        </Badge>
                      ) : (
                        <Badge className="bg-red-100 text-red-800">
                          <XCircle className="w-3 h-3 mr-1" /> Invalid SSL
                        </Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-gray-500">Issuer:</div>
                      <div className="font-medium">{lookupResult.ssl.issuer || 'N/A'}</div>
                      <div className="text-gray-500">Valid From:</div>
                      <div className="font-medium">{lookupResult.ssl.validFrom ? new Date(lookupResult.ssl.validFrom).toLocaleDateString() : 'N/A'}</div>
                      <div className="text-gray-500">Valid To:</div>
                      <div className="font-medium">{lookupResult.ssl.validTo ? new Date(lookupResult.ssl.validTo).toLocaleDateString() : 'N/A'}</div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>SSL data not available or no HTTPS configured</p>
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="dns" className="mt-4">
                {lookupResult.dns && Object.keys(lookupResult.dns).length > 0 ? (
                  <div className="space-y-4 text-sm">
                    {Object.entries(lookupResult.dns).map(([type, records]: [string, any]) => (
                      records && records.length > 0 && (
                        <div key={type}>
                          <div className="text-gray-500 font-medium mb-1">{type} Records:</div>
                          <div className="space-y-1">
                            {records.map((record: any, i: number) => (
                              <div key={i} className="bg-gray-50 p-2 rounded text-xs font-mono">
                                {typeof record === 'string' ? record : JSON.stringify(record)}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Server className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>DNS records not available</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          )}
          
          <DialogFooter className="mt-4">
            <Button
              variant="outline"
              onClick={() => setLookupModalOpen(false)}
              className="border-gray-300 text-gray-700 hover:bg-gray-100"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setLookupModalOpen(false);
                setNewDomain(lookupResult?.domain || searchTerm);
                setAddModalOpen(true);
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Monitoring
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
