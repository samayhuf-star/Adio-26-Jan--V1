import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSessionToken, getSessionTokenSync, getCurrentUser, isAuthenticated as checkIsAuthenticated } from '../utils/auth';
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
  Eye,
  LayoutGrid,
  List,
  Mail
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
  const isAuthLoading = false;
  const isAuthenticated = checkIsAuthenticated();
  const userData = getCurrentUser();
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
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [currentView, setCurrentView] = useState<'home' | 'monitor'>('home');
  const [emailReportLoading, setEmailReportLoading] = useState(false);
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
  const getTokenRef = useRef(async () => {
    try {
      return await getSessionToken();
    } catch {
      return null;
    }
  });
  
  // Fetch token on mount and when auth state changes with retry mechanism
  useEffect(() => {
    let isMounted = true;
    const maxRetries = 5;
    retryCountRef.current = 0; // Reset on each effect run
    
    const tryGetToken = (): string | null => {
      return getSessionTokenSync();
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
  }, [isAuthenticated, isAuthLoading]);
  
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

  const sendEmailReport = async () => {
    const headers = getAuthHeaders();
    if (Object.keys(headers).length === 0) {
      notifications.error('Please sign in to send email report');
      return;
    }
    setEmailReportLoading(true);
    try {
      const response = await fetch('/api/domains/email-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...headers,
        },
      });
      const data = await response.json();
      if (response.ok) {
        notifications.success(`Report sent to ${data.email}`);
      } else {
        notifications.error(data.error || 'Failed to send report');
      }
    } catch (error) {
      notifications.error('Failed to send email report');
    } finally {
      setEmailReportLoading(false);
    }
  };

  const filteredDomains = domains.filter(d => 
    d.domain.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 min-h-screen">
        <div className="flex items-center justify-center min-h-[400px] flex-1">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center gap-4"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-200">
              <RefreshCw className="w-8 h-8 animate-spin text-white" />
            </div>
            <p className="text-sm text-gray-500 font-medium">Loading domains...</p>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 min-h-screen">
      <div className="px-4 sm:px-6 lg:px-8 pt-6 pb-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Globe className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Domain Monitoring</h1>
            <p className="text-sm text-gray-500">Track domain expiry, SSL certificates, and DNS records</p>
          </div>
        </div>
      </div>

      {currentView === 'home' ? (
        <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            <div className="relative mb-8">
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-2xl shadow-indigo-300/50">
                <Globe className="w-14 h-14 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center shadow-lg">
                <Shield className="w-4 h-4 text-white" />
              </div>
            </div>
            <h2 className="text-3xl font-bold text-gray-900 mb-3 text-center">
              Monitor Your Domains
            </h2>
            <p className="text-gray-500 text-center max-w-md mb-8 leading-relaxed">
              Add your domains to track expiry dates, SSL certificates, and DNS records.
              Get alerts before anything expires.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10 max-w-lg w-full">
              {[
                { icon: Clock, label: 'WHOIS Lookup', desc: 'Track registration & expiry' },
                { icon: Shield, label: 'SSL Monitoring', desc: 'Certificate status alerts' },
                { icon: Server, label: 'DNS Tracking', desc: 'Monitor DNS changes' },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.1 }}
                  className="bg-white rounded-xl border border-gray-100 p-4 text-center shadow-sm"
                >
                  <feature.icon className="w-5 h-5 text-indigo-500 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-gray-800">{feature.label}</p>
                  <p className="text-xs text-gray-500">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
            <div className="flex items-center gap-4">
              <motion.button
                onClick={() => {
                  const headers = getAuthHeaders();
                  if (Object.keys(headers).length === 0) {
                    notifications.error('Please sign in to add domains');
                    return;
                  }
                  setAddModalOpen(true);
                }}
                disabled={isAuthLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-semibold text-lg shadow-xl shadow-indigo-300/40 hover:shadow-2xl hover:shadow-indigo-300/50 transition-all disabled:opacity-60 flex items-center gap-3"
              >
                <Plus className="w-5 h-5" />
                Add Domain
              </motion.button>
              <motion.button
                onClick={() => setCurrentView('monitor')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-8 py-4 bg-white text-gray-700 rounded-2xl font-semibold text-lg border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all flex items-center gap-3"
              >
                <Eye className="w-5 h-5 text-indigo-500" />
                Monitor
              </motion.button>
            </div>
          </motion.div>
        </div>
      ) : (
        <>
          <div className="px-4 sm:px-6 lg:px-8 pb-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
              <motion.button
                onClick={() => setCurrentView('home')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1.5 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
                Back to Home
              </motion.button>
              <motion.button
                onClick={() => {
                  if (!cachedToken) {
                    notifications.error('Please sign in to add domains');
                    return;
                  }
                  setAddModalOpen(true);
                }}
                disabled={isAuthLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200/50 hover:shadow-xl hover:shadow-indigo-300/50 transition-all disabled:opacity-60 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Domain
              </motion.button>
              <motion.button
                onClick={sendEmailReport}
                disabled={emailReportLoading || domains.length === 0}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-white text-gray-700 rounded-xl font-semibold text-sm border border-gray-200 shadow-sm hover:shadow-md hover:border-indigo-200 transition-all disabled:opacity-60 flex items-center gap-2"
              >
                {emailReportLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <Mail className="w-4 h-4 text-indigo-500" />
                )}
                Email Me
              </motion.button>
            </div>

            <div className="flex gap-2 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && quickLookup()}
                  placeholder="Search or lookup domain (e.g., example.com)"
                  className="pl-10 bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
              <div className="flex items-center bg-white border border-gray-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2.5 transition-colors ${viewMode === 'grid' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  title="Grid view"
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2.5 transition-colors ${viewMode === 'list' ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white' : 'text-gray-400 hover:text-gray-600'}`}
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              <motion.button
                onClick={quickLookup}
                disabled={lookupLoading || !searchTerm.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-5 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200/50 hover:shadow-xl transition-all disabled:opacity-60 flex items-center gap-2 min-w-[100px] justify-center"
              >
                {lookupLoading ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <Search className="w-4 h-4" />
                    Lookup
                  </>
                )}
              </motion.button>
            </div>
          </div>

          <div className="flex-1 px-4 sm:px-6 lg:px-8 pb-6">
            {filteredDomains.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center py-16"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 flex items-center justify-center mb-6">
                  <Globe className="w-10 h-10 text-indigo-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No domains monitored yet</h3>
                <p className="text-gray-500 text-center max-w-sm mb-6">Add your first domain to start tracking expiry dates, SSL certificates, and DNS records.</p>
                <motion.button
                  onClick={() => {
                    if (!cachedToken) {
                      notifications.error('Please sign in to add domains');
                      return;
                    }
                    setAddModalOpen(true);
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-6 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold text-sm shadow-lg shadow-indigo-200/50 flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Domain
                </motion.button>
              </motion.div>
            ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence>
              {filteredDomains.map((domain, index) => {
                const domainExpiry = getDaysUntilExpiry(domain.expiryDate);
                const sslExpiry = getDaysUntilExpiry(domain.sslExpiryDate);
                const domainStatus = getExpiryStatus(domainExpiry);
                const sslStatus = getExpiryStatus(sslExpiry);

                return (
                  <motion.div
                    key={domain.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:border-indigo-200 transition-all cursor-pointer overflow-hidden"
                    onClick={() => openDetailModal(domain)}
                  >
                    <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 px-4 py-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="w-7 h-7 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0">
                            <Globe className="w-3.5 h-3.5 text-white" />
                          </div>
                          <span className="text-white font-semibold truncate">{domain.domain}</span>
                        </div>
                        <div className="flex gap-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              refreshDomain(domain.id);
                            }}
                            disabled={refreshingId === domain.id}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 ${refreshingId === domain.id ? 'animate-spin' : ''}`} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteDomain(domain.id);
                            }}
                            className="h-7 w-7 flex items-center justify-center rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                      <p className="text-white/70 text-xs mt-1 pl-9 truncate">
                        {domain.registrar || 'Unknown registrar'}
                      </p>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-indigo-400" />
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
                          <Shield className="w-4 h-4 text-indigo-400" />
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

                      <div className="flex items-center justify-between text-xs text-gray-500 pt-1 border-t border-gray-50">
                        <span>Last checked: {formatDate(domain.lastCheckedAt)}</span>
                        {domain.alertsEnabled ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 shadow-lg shadow-gray-100/50 overflow-hidden">
            <div className="hidden sm:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-5 py-3 bg-gradient-to-r from-gray-50 to-gray-100/80 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
              <span>Domain</span>
              <span>Domain Expiry</span>
              <span>SSL Expiry</span>
              <span>Last Checked</span>
              <span>Actions</span>
            </div>
            <AnimatePresence>
              {filteredDomains.map((domain, index) => {
                const domainExpiry = getDaysUntilExpiry(domain.expiryDate);
                const sslExpiry = getDaysUntilExpiry(domain.sslExpiryDate);
                const domainStatus = getExpiryStatus(domainExpiry);
                const sslStatus = getExpiryStatus(sslExpiry);

                return (
                  <motion.div
                    key={domain.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    transition={{ delay: index * 0.03 }}
                    className="grid grid-cols-1 sm:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-3 sm:gap-4 items-center px-5 py-3.5 border-b border-gray-50 hover:bg-indigo-50/30 transition-colors cursor-pointer"
                    onClick={() => openDetailModal(domain)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center flex-shrink-0">
                        <Globe className="w-4 h-4 text-white" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">{domain.domain}</p>
                        <p className="text-xs text-gray-400 truncate">{domain.registrar || 'Unknown registrar'}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">{formatDate(domain.expiryDate)}</span>
                      <Badge className={`${domainStatus.color} text-white text-xs`}>
                        {domainExpiry !== null ? `${domainExpiry}d` : '?'}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-700">{formatDate(domain.sslExpiryDate)}</span>
                      {domain.sslExpiryDate ? (
                        <Badge className={`${sslStatus.color} text-white text-xs`}>
                          {sslExpiry !== null ? `${sslExpiry}d` : '?'}
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-400 text-white text-xs">No SSL</Badge>
                      )}
                    </div>

                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <span>{formatDate(domain.lastCheckedAt)}</span>
                      {domain.alertsEnabled ? (
                        <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </div>

                    <div className="flex gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          refreshDomain(domain.id);
                        }}
                        disabled={refreshingId === domain.id}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                      >
                        <RefreshCw className={`w-4 h-4 ${refreshingId === domain.id ? 'animate-spin' : ''}`} />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteDomain(domain.id);
                        }}
                        className="h-8 w-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
          </div>
        </>
      )}

      <Dialog open={addModalOpen} onOpenChange={(open) => !addLoading && setAddModalOpen(open)}>
        <DialogContent className="bg-white border-gray-100 text-gray-900 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Plus className="w-4 h-4 text-white" />
              </div>
              Add Domain
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Enter a domain name to start monitoring. We'll fetch WHOIS, SSL, and DNS information automatically.
            </DialogDescription>
          </DialogHeader>
          
          {addLoading && addProgress ? (
            <div className="py-8 text-center">
              <div className="flex flex-col items-center gap-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl shadow-indigo-200">
                    <RefreshCw className="w-8 h-8 text-white animate-spin" />
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-lg font-medium text-gray-900">{addProgress}</p>
                  <p className="text-sm text-gray-500">This may take up to 30 seconds...</p>
                </div>
                <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 mt-4">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2 rounded-full transition-all duration-1000"
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
                  className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Alert Email (optional)</label>
                <Input
                  value={newAlertEmail}
                  onChange={(e) => setNewAlertEmail(e.target.value)}
                  placeholder="alerts@example.com"
                  type="email"
                  className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Notes (optional)</label>
                <Input
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Internal notes about this domain..."
                  className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
                />
              </div>
            </div>
          )}
          
          {!addLoading && (
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setAddModalOpen(false)}
                className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
              >
                Cancel
              </Button>
              <Button
                onClick={addDomain}
                disabled={!newDomain.trim()}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Domain
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={detailModalOpen} onOpenChange={setDetailModalOpen}>
        <DialogContent className="bg-white border-gray-100 text-gray-900 max-w-3xl max-h-[80vh] overflow-y-auto rounded-2xl shadow-xl">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                  <Globe className="w-5 h-5 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-gray-900 text-xl">
                    {selectedDomain?.domain}
                  </DialogTitle>
                  <DialogDescription className="text-gray-500">
                    {selectedDomain?.registrar || 'Unknown registrar'}
                  </DialogDescription>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => selectedDomain && refreshDomain(selectedDomain.id)}
                  disabled={refreshingId === selectedDomain?.id}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg hover:bg-indigo-50 text-gray-700 border border-gray-200 transition-colors"
                >
                  <RefreshCw className={`w-4 h-4 ${refreshingId === selectedDomain?.id ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
                <button
                  onClick={() => setSettingsModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded-lg hover:bg-indigo-50 text-gray-700 border border-gray-200 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  Settings
                </button>
              </div>
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
            <TabsList className="bg-gray-100 border-gray-200 rounded-xl p-1">
              <TabsTrigger value="whois" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-lg">
                <Clock className="w-4 h-4 mr-2" />
                WHOIS
              </TabsTrigger>
              <TabsTrigger value="ssl" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-lg">
                <Shield className="w-4 h-4 mr-2" />
                SSL
              </TabsTrigger>
              <TabsTrigger value="dns" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-lg">
                <Server className="w-4 h-4 mr-2" />
                DNS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="whois" className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Registration Date</div>
                  <div className="text-gray-900 font-medium">{formatDate(selectedDomain?.createdDate)}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
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
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Last Updated</div>
                  <div className="text-gray-900 font-medium">{formatDate(selectedDomain?.updatedDate)}</div>
                </div>
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-1">Registrar</div>
                  <div className="text-gray-900 font-medium">{selectedDomain?.registrar || 'Unknown'}</div>
                </div>
              </div>

              {selectedDomain?.nameServers && selectedDomain.nameServers.length > 0 && (
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                  <div className="text-sm text-gray-500 mb-2">Name Servers</div>
                  <div className="space-y-1">
                    {selectedDomain.nameServers.map((ns, i) => (
                      <div key={i} className="flex items-center justify-between text-gray-900 text-sm">
                        <span>{ns}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => copyToClipboard(ns)}
                          className="h-6 w-6 p-0 text-gray-500 hover:text-indigo-600"
                        >
                          <Copy className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedDomain?.whoisData?.raw && (
                <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-500">Raw WHOIS Data</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(selectedDomain.whoisData.raw)}
                      className="h-6 text-gray-500 hover:text-indigo-600"
                    >
                      <Copy className="w-3 h-3 mr-1" />
                      Copy
                    </Button>
                  </div>
                  <pre className="text-xs text-gray-700 overflow-auto max-h-60 whitespace-pre-wrap font-mono bg-gray-100 rounded-lg p-3">
                    {selectedDomain.whoisData.raw}
                  </pre>
                </div>
              )}
            </TabsContent>

            <TabsContent value="ssl" className="mt-4 space-y-4">
              {selectedDomain?.sslData && Object.keys(selectedDomain.sslData).length > 0 ? (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-1">Issuer</div>
                      <div className="text-gray-900 font-medium">{selectedDomain.sslIssuer || 'Unknown'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-1">Valid From</div>
                      <div className="text-gray-900 font-medium">{formatDate(selectedDomain.sslValidFrom)}</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
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
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
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
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-2">Subject Alternative Names</div>
                      <div className="flex flex-wrap gap-2">
                        {selectedDomain.sslData.altNames.map((name: string, i: number) => (
                          <Badge key={i} className="bg-indigo-100 text-indigo-800">
                            {name}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-1">Protocol</div>
                      <div className="text-gray-900 font-medium">{selectedDomain.sslData.protocol || 'Unknown'}</div>
                    </div>
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-1">Cipher</div>
                      <div className="text-gray-900 font-medium text-sm">{selectedDomain.sslData.cipher || 'Unknown'}</div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mx-auto mb-3">
                    <Shield className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No SSL certificate found or unable to retrieve SSL data</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="dns" className="mt-4 space-y-4">
              {selectedDomain?.dnsRecords && Object.keys(selectedDomain.dnsRecords).length > 0 ? (
                <>
                  {selectedDomain.dnsRecords.a && (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-2">A Records (IPv4)</div>
                      <div className="space-y-1">
                        {selectedDomain.dnsRecords.a.map((ip: string, i: number) => (
                          <div key={i} className="flex items-center justify-between text-gray-900 text-sm font-mono">
                            <span>{ip}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(ip)}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-indigo-600"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDomain.dnsRecords.aaaa && (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-2">AAAA Records (IPv6)</div>
                      <div className="space-y-1">
                        {selectedDomain.dnsRecords.aaaa.map((ip: string, i: number) => (
                          <div key={i} className="flex items-center justify-between text-gray-900 text-sm font-mono">
                            <span className="truncate">{ip}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => copyToClipboard(ip)}
                              className="h-6 w-6 p-0 text-gray-500 hover:text-indigo-600 flex-shrink-0"
                            >
                              <Copy className="w-3 h-3" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDomain.dnsRecords.mx && (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-2">MX Records (Mail)</div>
                      <div className="space-y-1">
                        {selectedDomain.dnsRecords.mx.map((mx: any, i: number) => (
                          <div key={i} className="flex items-center justify-between text-gray-900 text-sm">
                            <span className="font-mono">
                              <span className="text-indigo-600">{mx.priority}</span> {mx.exchange}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDomain.dnsRecords.ns && (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-2">NS Records (Nameservers)</div>
                      <div className="space-y-1">
                        {selectedDomain.dnsRecords.ns.map((ns: string, i: number) => (
                          <div key={i} className="text-gray-900 text-sm font-mono">{ns}</div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDomain.dnsRecords.txt && (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
                      <div className="text-sm text-gray-500 mb-2">TXT Records</div>
                      <div className="space-y-2">
                        {selectedDomain.dnsRecords.txt.map((txt: string[], i: number) => (
                          <div key={i} className="text-gray-700 text-xs font-mono bg-gray-100 rounded-lg p-2 break-all">
                            {txt.join('')}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedDomain.dnsRecords.cname && (
                    <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
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
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mx-auto mb-3">
                    <Server className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-500">No DNS records found or unable to retrieve DNS data</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      <Dialog open={settingsModalOpen} onOpenChange={setSettingsModalOpen}>
        <DialogContent className="bg-white border-gray-100 text-gray-900 rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Settings className="w-4 h-4 text-white" />
              </div>
              Domain Settings
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Configure alerts and notifications for {selectedDomain?.domain}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="flex items-center justify-between bg-gradient-to-br from-gray-50 to-white border border-gray-100 rounded-xl p-4">
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
                className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
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
                className="bg-white border-gray-200 text-gray-900 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setSettingsModalOpen(false)}
              className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
            >
              Cancel
            </Button>
            <Button onClick={updateDomainSettings} className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl">
              Save Settings
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={lookupModalOpen} onOpenChange={setLookupModalOpen}>
        <DialogContent className="bg-white border-gray-100 text-gray-900 max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                <Globe className="w-4 h-4 text-white" />
              </div>
              Domain Lookup: {lookupResult?.domain}
            </DialogTitle>
            <DialogDescription className="text-gray-500">
              Quick lookup results for the specified domain
            </DialogDescription>
          </DialogHeader>
          
          {lookupResult && (
            <Tabs defaultValue="whois" className="mt-4">
              <TabsList className="bg-gray-100 p-1 rounded-xl">
                <TabsTrigger value="whois" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-lg">
                  <Clock className="w-4 h-4 mr-2" />
                  WHOIS
                </TabsTrigger>
                <TabsTrigger value="ssl" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-lg">
                  <Shield className="w-4 h-4 mr-2" />
                  SSL
                </TabsTrigger>
                <TabsTrigger value="dns" className="data-[state=active]:bg-white data-[state=active]:text-indigo-700 data-[state=active]:shadow-sm rounded-lg">
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
                            <Badge key={i} variant="secondary" className="mr-1 bg-indigo-50 text-indigo-700">{ns}</Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mx-auto mb-3">
                      <Clock className="w-8 h-8 text-gray-400" />
                    </div>
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
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mx-auto mb-3">
                      <Shield className="w-8 h-8 text-gray-400" />
                    </div>
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
                              <div key={i} className="bg-gradient-to-br from-gray-50 to-white border border-gray-100 p-2 rounded-lg text-xs font-mono">
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
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center mx-auto mb-3">
                      <Server className="w-8 h-8 text-gray-400" />
                    </div>
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
              className="border-gray-200 text-gray-700 hover:bg-gray-50 rounded-xl"
            >
              Close
            </Button>
            <Button 
              onClick={() => {
                setLookupModalOpen(false);
                setNewDomain(lookupResult?.domain || searchTerm);
                setAddModalOpen(true);
              }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-xl"
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
