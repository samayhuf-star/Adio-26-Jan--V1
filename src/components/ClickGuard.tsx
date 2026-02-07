import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { getSessionToken } from '../utils/auth';
import {
  Shield, Plus, Trash2, Copy, Check, Globe, Activity,
  BarChart3, Lock, Eye, Loader2, RefreshCw, AlertTriangle,
  Monitor, Smartphone, Tablet, ChevronDown, X, Ban,
  Clock, Bot, ExternalLink, Code, Search, ArrowLeft,
  CheckCircle, XCircle, Link, Hash, Calendar, Zap
} from 'lucide-react';

const API_BASE = '/api/clickguard';

interface Domain {
  id: string;
  domain: string;
  siteId: string;
  verified: boolean;
  createdAt: string;
}

interface Visitor {
  id: string;
  ip: string;
  country: string;
  countryCode: string;
  city: string;
  device: string;
  browser: string;
  os: string;
  referrer: string;
  threatLevel: string;
  botScore: number;
  createdAt: string;
}

interface Analytics {
  totalVisitors: number;
  uniqueIPs: number;
  threatsBlocked: number;
  botRate: number;
  byDevice: Record<string, number>;
  byBrowser: Record<string, number>;
  byOS: Record<string, number>;
  byCountry: Record<string, number>;
  byThreatLevel: Record<string, number>;
}

interface BlockedIP {
  id: string;
  ipAddress: string;
  reason: string;
  autoBlocked: boolean;
  createdAt: string;
}

interface FraudEvent {
  id: string;
  eventType: string;
  severity: string;
  ip: string;
  details: string;
  createdAt: string;
}

function countryCodeToFlag(code: string): string {
  if (!code || code.length !== 2) return '🌍';
  const upper = code.toUpperCase();
  const offset = 127397;
  return String.fromCodePoint(upper.charCodeAt(0) + offset, upper.charCodeAt(1) + offset);
}

function timeAgo(dateStr: string): string {
  const now = Date.now();
  const date = new Date(dateStr).getTime();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function maskIP(ip: string): string {
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`;
  return ip;
}

function threatColor(level: string): string {
  switch (level?.toLowerCase()) {
    case 'low': return 'bg-green-100 text-green-700 border-green-300';
    case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-300';
    case 'high': return 'bg-orange-100 text-orange-700 border-orange-300';
    case 'critical': return 'bg-red-100 text-red-700 border-red-300';
    default: return 'bg-gray-100 text-gray-600 border-gray-300';
  }
}

function rowTint(level: string): string {
  switch (level?.toLowerCase()) {
    case 'low': return 'border-l-green-500/40';
    case 'medium': return 'border-l-yellow-500/40';
    case 'high': return 'border-l-orange-500/40';
    case 'critical': return 'border-l-red-500/40';
    default: return 'border-l-gray-500/40';
  }
}

function deviceIcon(device: string) {
  switch (device?.toLowerCase()) {
    case 'mobile': return <Smartphone className="w-4 h-4" />;
    case 'tablet': return <Tablet className="w-4 h-4" />;
    default: return <Monitor className="w-4 h-4" />;
  }
}

const tabs = [
  { id: 'domains', label: 'Domains', icon: Globe },
  { id: 'traffic', label: 'Live Traffic', icon: Activity },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'protection', label: 'Protection', icon: Lock },
] as const;

type TabId = typeof tabs[number]['id'];

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getSessionToken();
  return token
    ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }
    : { 'Content-Type': 'application/json' };
}

function BarChart({ data, colorClass }: { data: Record<string, number>; colorClass: string }) {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]);
  const max = Math.max(...entries.map(([, v]) => v), 1);
  return (
    <div className="space-y-2">
      {entries.map(([label, count]) => (
        <div key={label} className="flex items-center gap-3">
          <span className="text-sm text-slate-600 w-24 truncate">{label}</span>
          <div className="flex-1 bg-gray-200 rounded-full h-5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${(count / max) * 100}%` }}
              transition={{ duration: 0.6 }}
              className={`h-full rounded-full ${colorClass}`}
            />
          </div>
          <span className="text-sm text-slate-500 w-12 text-right">{count}</span>
        </div>
      ))}
      {entries.length === 0 && <p className="text-gray-500 text-sm">No data available</p>}
    </div>
  );
}

function DomainSelector({
  domains,
  selectedId,
  onChange,
}: {
  domains: Domain[];
  selectedId: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="relative">
      <select
        value={selectedId}
        onChange={(e) => onChange(e.target.value)}
        className="w-full md:w-72 bg-white border border-gray-200 text-slate-800 rounded-lg px-4 py-2.5 pr-10 appearance-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      >
        <option value="">Select a domain</option>
        {domains.map((d) => (
          <option key={d.id} value={d.siteId}>
            {d.domain}
          </option>
        ))}
      </select>
      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
    </div>
  );
}

export default function ClickGuard({ defaultTab = 'domains' }: { defaultTab?: TabId }) {
  const [activeTab, setActiveTab] = useState<TabId>(defaultTab);
  const [domains, setDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDomain, setNewDomain] = useState('');
  const [addingDomain, setAddingDomain] = useState(false);
  const [snippetModal, setSnippetModal] = useState<{ open: boolean; snippet: string; domain: string }>({
    open: false,
    snippet: '',
    domain: '',
  });
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, { verified: boolean; message: string }>>({});
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [domainDetail, setDomainDetail] = useState<any>(null);
  const [domainDetailLoading, setDomainDetailLoading] = useState(false);
  const [copiedSiteId, setCopiedSiteId] = useState(false);
  const [copiedDetailSnippet, setCopiedDetailSnippet] = useState(false);

  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [visitorsLoading, setVisitorsLoading] = useState(false);

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);
  const [timePeriod, setTimePeriod] = useState('24h');

  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [fraudEvents, setFraudEvents] = useState<FraudEvent[]>([]);
  const [protectionLoading, setProtectionLoading] = useState(false);
  const [blockIP, setBlockIP] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blocking, setBlocking] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const refreshInterval = useRef<NodeJS.Timeout | null>(null);

  const fetchDomains = useCallback(async () => {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/domains`, { headers });
      if (!res.ok) throw new Error('Failed to fetch domains');
      const data = await res.json();
      setDomains(Array.isArray(data) ? data : data.domains || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDomains();
  }, [fetchDomains]);

  const handleAddDomain = async () => {
    if (!newDomain.trim()) return;
    setAddingDomain(true);
    setError(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/domains`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ domain: newDomain.trim() }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || 'Failed to add domain');
      }
      const domain = await res.json();
      setDomains((prev) => [domain, ...prev]);
      setNewDomain('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAddingDomain(false);
    }
  };

  const handleDeleteDomain = async (id: string) => {
    setDeletingId(id);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/domains/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed to delete domain');
      setDomains((prev) => prev.filter((d) => d.id !== id));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDeletingId(null);
    }
  };

  const handleGetSnippet = async (domain: Domain) => {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/domains/${domain.id}/snippet`, { headers });
      if (!res.ok) throw new Error('Failed to get snippet');
      const data = await res.json();
      setSnippetModal({ open: true, snippet: data.snippet || data.html || '', domain: domain.domain });
    } catch (err: any) {
      setError(err.message);
    }
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(snippetModal.snippet);
    setCopiedSnippet(true);
    setTimeout(() => setCopiedSnippet(false), 2000);
  };

  const handleVerifyDomain = async (domain: Domain) => {
    setVerifyingId(domain.id);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/domains/${domain.id}/verify`, {
        method: 'POST',
        headers,
      });
      if (!res.ok) throw new Error('Verification failed');
      const data = await res.json();
      setVerifyResults((prev) => ({ ...prev, [domain.id]: data }));
      if (data.verified) {
        setDomains((prev) =>
          prev.map((d) => (d.id === domain.id ? { ...d, verified: true } : d))
        );
      }
    } catch (err: any) {
      setVerifyResults((prev) => ({
        ...prev,
        [domain.id]: { verified: false, message: err.message || 'Verification failed' },
      }));
    } finally {
      setVerifyingId(null);
    }
  };

  const handleOpenDomainDetail = async (domain: Domain) => {
    setSelectedDomain(domain);
    setDomainDetailLoading(true);
    setCopiedDetailSnippet(false);
    setCopiedSiteId(false);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/domains/${domain.id}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch domain details');
      const data = await res.json();
      setDomainDetail(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setDomainDetailLoading(false);
    }
  };

  const handleBackFromDetail = () => {
    setSelectedDomain(null);
    setDomainDetail(null);
  };

  const fetchVisitors = useCallback(async (siteId: string) => {
    if (!siteId) return;
    setVisitorsLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/visitors/${siteId}?limit=50`, { headers });
      if (!res.ok) throw new Error('Failed to fetch visitors');
      const data = await res.json();
      setVisitors(Array.isArray(data) ? data : data.visitors || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVisitorsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'traffic' && selectedSiteId) {
      fetchVisitors(selectedSiteId);
      refreshInterval.current = setInterval(() => fetchVisitors(selectedSiteId), 10000);
    }
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [activeTab, selectedSiteId, fetchVisitors]);

  const fetchAnalytics = useCallback(async (siteId: string) => {
    if (!siteId) return;
    setAnalyticsLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/analytics/${siteId}?period=${timePeriod}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();
      setAnalytics(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [timePeriod]);

  useEffect(() => {
    if (activeTab === 'analytics' && selectedSiteId) {
      fetchAnalytics(selectedSiteId);
    }
  }, [activeTab, selectedSiteId, fetchAnalytics]);

  const fetchProtectionData = useCallback(async (siteId: string) => {
    if (!siteId) return;
    setProtectionLoading(true);
    try {
      const headers = await authHeaders();
      const [blockedRes, eventsRes] = await Promise.all([
        fetch(`${API_BASE}/blocked-ips/${siteId}`, { headers }),
        fetch(`${API_BASE}/fraud-events/${siteId}`, { headers }),
      ]);
      if (blockedRes.ok) {
        const d = await blockedRes.json();
        setBlockedIPs(Array.isArray(d) ? d : d.blockedIPs || []);
      }
      if (eventsRes.ok) {
        const d = await eventsRes.json();
        setFraudEvents(Array.isArray(d) ? d : d.events || []);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setProtectionLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'protection' && selectedSiteId) {
      fetchProtectionData(selectedSiteId);
    }
  }, [activeTab, selectedSiteId, fetchProtectionData]);

  const handleBlockIP = async (ip?: string, reason?: string, siteId?: string) => {
    const targetIP = ip || blockIP.trim();
    const targetReason = reason || blockReason.trim() || 'Manual block';
    const targetSiteId = siteId || selectedSiteId;
    if (!targetIP || !targetSiteId) return;
    setBlocking(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/blocked-ips/${targetSiteId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ ipAddress: targetIP, reason: targetReason }),
      });
      if (!res.ok) throw new Error('Failed to block IP');
      const data = await res.json();
      setBlockedIPs((prev) => [data, ...prev]);
      setBlockIP('');
      setBlockReason('');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBlocking(false);
    }
  };

  const handleUnblockIP = async (id: string) => {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/blocked-ips/${id}`, { method: 'DELETE', headers });
      if (!res.ok) throw new Error('Failed to unblock IP');
      setBlockedIPs((prev) => prev.filter((b) => b.id !== id));
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="text-slate-800 p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-7xl mx-auto"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <Shield className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Click Guard</h1>
            <p className="text-slate-500 text-sm">Click fraud protection & traffic analytics</p>
          </div>
        </div>

        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <span className="text-red-600 text-sm">{error}</span>
              </div>
              <button onClick={() => setError(null)}>
                <X className="w-4 h-4 text-red-500 hover:text-red-700" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg'
                  : 'text-slate-500 hover:text-slate-800 hover:bg-white'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'domains' && (
            <motion.div
              key="domains"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    placeholder="Enter domain (e.g. example.com)"
                    value={newDomain}
                    onChange={(e) => setNewDomain(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddDomain()}
                    className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                  />
                  <button
                    onClick={handleAddDomain}
                    disabled={addingDomain || !newDomain.trim()}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-medium disabled:opacity-50 transition-all"
                  >
                    {addingDomain ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    Add Domain
                  </button>
                </div>
              </div>

              {selectedDomain ? (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <button
                    onClick={handleBackFromDetail}
                    className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 mb-4 transition-colors"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Domains
                  </button>

                  {domainDetailLoading ? (
                    <div className="flex items-center justify-center py-20">
                      <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                    </div>
                  ) : domainDetail ? (
                    <div className="space-y-6">
                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                          <div className="flex items-center gap-3">
                            <div className="p-3 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
                              <Globe className="w-6 h-6 text-white" />
                            </div>
                            <div>
                              <h2 className="text-xl font-bold text-slate-800">{domainDetail.domain}</h2>
                              <p className="text-sm text-slate-400">Domain Details</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full border font-medium ${
                                domainDetail.verified
                                  ? 'bg-green-100 text-green-700 border-green-300'
                                  : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                              }`}
                            >
                              {domainDetail.verified ? (
                                <CheckCircle className="w-4 h-4" />
                              ) : (
                                <Clock className="w-4 h-4" />
                              )}
                              {domainDetail.verified ? 'Verified' : 'Pending Verification'}
                            </span>
                            <button
                              onClick={() => handleVerifyDomain(selectedDomain)}
                              disabled={verifyingId === selectedDomain.id}
                              className="flex items-center gap-1.5 px-4 py-2 text-sm bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white rounded-lg font-medium disabled:opacity-50 transition-all"
                            >
                              {verifyingId === selectedDomain.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <Shield className="w-4 h-4" />
                              )}
                              Verify Now
                            </button>
                          </div>
                        </div>

                        {verifyResults[selectedDomain.id] && (
                          <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`p-3 rounded-lg border mb-6 flex items-center gap-2 ${
                              verifyResults[selectedDomain.id].verified
                                ? 'bg-green-50 border-green-200 text-green-700'
                                : 'bg-amber-50 border-amber-200 text-amber-700'
                            }`}
                          >
                            {verifyResults[selectedDomain.id].verified ? (
                              <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            )}
                            <span className="text-sm">{verifyResults[selectedDomain.id].message}</span>
                          </motion.div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Hash className="w-4 h-4 text-indigo-500" />
                              <span className="text-xs text-slate-500 font-medium">Site ID</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-sm text-slate-700 truncate">{domainDetail.siteId}</span>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(domainDetail.siteId);
                                  setCopiedSiteId(true);
                                  setTimeout(() => setCopiedSiteId(false), 2000);
                                }}
                                className="text-slate-400 hover:text-indigo-500 flex-shrink-0"
                              >
                                {copiedSiteId ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                            </div>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Calendar className="w-4 h-4 text-indigo-500" />
                              <span className="text-xs text-slate-500 font-medium">Created</span>
                            </div>
                            <span className="text-sm text-slate-700">{new Date(domainDetail.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Activity className="w-4 h-4 text-blue-500" />
                              <span className="text-xs text-slate-500 font-medium">Total Visitors</span>
                            </div>
                            <span className="text-lg font-bold text-slate-700">{domainDetail.stats?.totalVisitors || 0}</span>
                          </div>
                          <div className="bg-gray-50 rounded-lg p-4 border border-gray-100">
                            <div className="flex items-center gap-2 mb-2">
                              <Shield className="w-4 h-4 text-red-500" />
                              <span className="text-xs text-slate-500 font-medium">Threats Blocked</span>
                            </div>
                            <span className="text-lg font-bold text-slate-700">{domainDetail.stats?.blockedIPs || 0}</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            <Code className="w-5 h-5 text-indigo-500" />
                            Verification Code
                          </h3>
                        </div>
                        <p className="text-sm text-slate-500 mb-4">
                          Add this tracking snippet to your website's <code className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">&lt;head&gt;</code> section to start tracking visitors and enable verification.
                        </p>
                        <div className="relative">
                          <pre className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                            {domainDetail.snippet}
                          </pre>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(domainDetail.snippet);
                              setCopiedDetailSnippet(true);
                              setTimeout(() => setCopiedDetailSnippet(false), 2000);
                            }}
                            className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 transition-colors"
                          >
                            {copiedDetailSnippet ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                            {copiedDetailSnippet ? 'Copied!' : 'Copy'}
                          </button>
                        </div>
                        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                          <h4 className="text-sm font-medium text-indigo-800 mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            How to Verify
                          </h4>
                          <ol className="text-sm text-indigo-700 space-y-1.5 list-decimal list-inside">
                            <li>Copy the snippet above</li>
                            <li>Paste it in your website's HTML before the closing <code className="text-xs bg-indigo-100 text-indigo-800 px-1 py-0.5 rounded">&lt;/head&gt;</code> tag</li>
                            <li>Deploy/publish your website changes</li>
                            <li>Click the "Verify Now" button above to confirm installation</li>
                          </ol>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <button
                          onClick={() => {
                            setSelectedSiteId(selectedDomain.siteId);
                            setActiveTab('analytics');
                            handleBackFromDetail();
                          }}
                          className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-indigo-400/60 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg">
                              <BarChart3 className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">View Analytics</span>
                          </div>
                          <p className="text-xs text-slate-400">See traffic data, device stats, and threat analysis</p>
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSiteId(selectedDomain.siteId);
                            setActiveTab('traffic');
                            handleBackFromDetail();
                          }}
                          className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:border-indigo-400/60 transition-colors text-left"
                        >
                          <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg">
                              <Activity className="w-4 h-4 text-white" />
                            </div>
                            <span className="text-sm font-semibold text-slate-700">Live Traffic</span>
                          </div>
                          <p className="text-xs text-slate-400">Monitor real-time visitor activity on your site</p>
                        </button>
                      </div>
                    </div>
                  ) : null}
                </motion.div>
              ) : loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              ) : domains.length === 0 ? (
                <div className="text-center py-20">
                  <Globe className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-slate-500">No domains added yet</p>
                  <p className="text-slate-400 text-sm mt-1">Add a domain above to start monitoring</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {domains.map((domain) => (
                    <motion.div
                      key={domain.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="bg-white border border-gray-200 rounded-xl p-5 hover:border-indigo-400/60 shadow-sm transition-colors cursor-pointer group"
                      onClick={() => handleOpenDomainDetail(domain)}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Globe className="w-5 h-5 text-indigo-500" />
                          <span className="font-semibold text-slate-800 group-hover:text-indigo-600 transition-colors">{domain.domain}</span>
                          <ExternalLink className="w-3.5 h-3.5 text-slate-300 group-hover:text-indigo-400 transition-colors" />
                        </div>
                        <span
                          className={`text-xs px-2 py-1 rounded-full border ${
                            domain.verified
                              ? 'bg-green-100 text-green-700 border-green-300'
                              : 'bg-yellow-100 text-yellow-700 border-yellow-300'
                          }`}
                        >
                          {domain.verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                      <div className="space-y-1.5 mb-4">
                        <p className="text-xs text-slate-400">
                          Site ID: <span className="text-slate-500 font-mono">{domain.siteId?.slice(0, 12)}...</span>
                        </p>
                        <p className="text-xs text-slate-400">
                          Created: <span className="text-slate-500">{new Date(domain.createdAt).toLocaleDateString()}</span>
                        </p>
                      </div>

                      {verifyResults[domain.id] && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className={`text-xs p-2 rounded-lg border mb-3 flex items-center gap-1.5 ${
                            verifyResults[domain.id].verified
                              ? 'bg-green-50 border-green-200 text-green-700'
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}
                        >
                          {verifyResults[domain.id].verified ? (
                            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
                          )}
                          <span className="truncate">{verifyResults[domain.id].message}</span>
                        </motion.div>
                      )}

                      <div className="flex gap-2 flex-wrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => handleVerifyDomain(domain)}
                          disabled={verifyingId === domain.id}
                          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg transition-colors disabled:opacity-50 ${
                            domain.verified
                              ? 'bg-green-100 hover:bg-green-200 text-green-700'
                              : 'bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white'
                          }`}
                        >
                          {verifyingId === domain.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : domain.verified ? (
                            <CheckCircle className="w-3.5 h-3.5" />
                          ) : (
                            <Shield className="w-3.5 h-3.5" />
                          )}
                          {verifyingId === domain.id ? 'Checking...' : domain.verified ? 'Verified' : 'Verify'}
                        </button>
                        <button
                          onClick={() => handleGetSnippet(domain)}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-gray-100 hover:bg-gray-200 rounded-lg text-slate-600 transition-colors"
                        >
                          <Code className="w-3.5 h-3.5" />
                          Get Snippet
                        </button>
                        <button
                          onClick={() => {
                            setSelectedSiteId(domain.siteId);
                            setActiveTab('analytics');
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-indigo-100 hover:bg-indigo-200 rounded-lg text-indigo-600 transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Analytics
                        </button>
                        <button
                          onClick={() => handleDeleteDomain(domain.id)}
                          disabled={deletingId === domain.id}
                          className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-red-100 hover:bg-red-200 rounded-lg text-red-600 transition-colors disabled:opacity-50"
                        >
                          {deletingId === domain.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="w-3.5 h-3.5" />
                          )}
                          Delete
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'traffic' && (
            <motion.div
              key="traffic"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                <DomainSelector domains={domains} selectedId={selectedSiteId} onChange={setSelectedSiteId} />
                {selectedSiteId && (
                  <button
                    onClick={() => fetchVisitors(selectedSiteId)}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 rounded-lg text-slate-600 hover:text-slate-800 transition-colors"
                  >
                    <RefreshCw className={`w-4 h-4 ${visitorsLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                )}
              </div>

              {!selectedSiteId ? (
                <div className="text-center py-20">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-slate-500">Select a domain to view live traffic</p>
                </div>
              ) : visitorsLoading && visitors.length === 0 ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              ) : visitors.length === 0 ? (
                <div className="text-center py-20">
                  <Activity className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-slate-500">No visitors recorded yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm text-slate-500">Live feed · Auto-refreshes every 10s</span>
                  </div>
                  {visitors.map((v) => (
                    <motion.div
                      key={v.id}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`bg-white border border-gray-200 border-l-4 ${rowTint(v.threatLevel)} rounded-lg p-4 shadow-sm`}
                    >
                      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="font-mono text-sm text-slate-600">{maskIP(v.ip)}</span>
                          </div>
                          <span className="text-lg" title={v.country}>
                            {countryCodeToFlag(v.countryCode)}
                          </span>
                          <span className="text-sm text-slate-500 truncate">{v.country}</span>
                          {v.city && <span className="text-sm text-slate-400">· {v.city}</span>}
                        </div>
                        <div className="flex items-center gap-3 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            {deviceIcon(v.device)} {v.device}
                          </span>
                          <span className="text-xs text-slate-400">{v.browser}</span>
                          <span className="text-xs text-slate-400">{v.os}</span>
                          {v.referrer && (
                            <span className="text-xs text-slate-400 flex items-center gap-1 truncate max-w-[150px]">
                              <ExternalLink className="w-3 h-3" />
                              {v.referrer}
                            </span>
                          )}
                          <span className={`text-xs px-2 py-0.5 rounded-full border ${threatColor(v.threatLevel)}`}>
                            {v.threatLevel}
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-500">
                            <Bot className="w-3 h-3" />
                            {v.botScore}%
                          </span>
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <Clock className="w-3 h-3" />
                            {timeAgo(v.createdAt)}
                          </span>
                          {(v.threatLevel?.toLowerCase() === 'high' || v.threatLevel?.toLowerCase() === 'critical') && (
                            <button
                              onClick={() => handleBlockIP(v.ip, `Suspicious traffic - ${v.threatLevel} threat level`)}
                              className="flex items-center gap-1 text-xs px-2 py-1 bg-red-100 hover:bg-red-200 text-red-600 rounded-lg transition-colors"
                            >
                              <Ban className="w-3 h-3" />
                              Block IP
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mb-6">
                <DomainSelector domains={domains} selectedId={selectedSiteId} onChange={setSelectedSiteId} />
                <div className="flex gap-1 bg-gray-100 border border-gray-200 rounded-lg p-1">
                  {['24h', '7d', '30d'].map((p) => (
                    <button
                      key={p}
                      onClick={() => setTimePeriod(p)}
                      className={`px-3 py-1.5 text-xs rounded-md font-medium transition-colors ${
                        timePeriod === p
                          ? 'bg-indigo-500 text-white'
                          : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>

              {!selectedSiteId ? (
                <div className="text-center py-20">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-slate-500">Select a domain to view analytics</p>
                </div>
              ) : analyticsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              ) : !analytics ? (
                <div className="text-center py-20">
                  <BarChart3 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-slate-500">No analytics data available</p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {[
                      { label: 'Total Visitors', value: analytics.totalVisitors, icon: Activity, color: 'from-blue-500 to-indigo-600' },
                      { label: 'Unique IPs', value: analytics.uniqueIPs, icon: Globe, color: 'from-purple-500 to-pink-600' },
                      { label: 'Threats Blocked', value: analytics.threatsBlocked, icon: Shield, color: 'from-red-500 to-orange-600' },
                      { label: 'Bot Rate', value: `${analytics.botRate?.toFixed(1) || 0}%`, icon: Bot, color: 'from-amber-500 to-yellow-600' },
                    ].map((stat) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm"
                      >
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`p-2 bg-gradient-to-br ${stat.color} rounded-lg`}>
                            <stat.icon className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-sm text-slate-500">{stat.label}</span>
                        </div>
                        <p className="text-2xl font-bold">{stat.value}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <Monitor className="w-4 h-4" /> By Device Type
                      </h3>
                      <BarChart data={analytics.byDevice || {}} colorClass="bg-gradient-to-r from-indigo-500 to-purple-500" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4" /> By Browser
                      </h3>
                      <BarChart data={analytics.byBrowser || {}} colorClass="bg-gradient-to-r from-blue-500 to-cyan-500" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <Monitor className="w-4 h-4" /> By Operating System
                      </h3>
                      <BarChart data={analytics.byOS || {}} colorClass="bg-gradient-to-r from-emerald-500 to-teal-500" />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        🌍 By Country (Top 10)
                      </h3>
                      <BarChart
                        data={Object.fromEntries(Object.entries(analytics.byCountry || {}).slice(0, 10))}
                        colorClass="bg-gradient-to-r from-amber-500 to-orange-500"
                      />
                    </div>
                    <div className="bg-white border border-gray-200 rounded-xl p-5 md:col-span-2 shadow-sm">
                      <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                        <Shield className="w-4 h-4" /> By Threat Level
                      </h3>
                      <BarChart data={analytics.byThreatLevel || {}} colorClass="bg-gradient-to-r from-red-500 to-pink-500" />
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          )}

          {activeTab === 'protection' && (
            <motion.div
              key="protection"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              <div className="mb-6">
                <DomainSelector domains={domains} selectedId={selectedSiteId} onChange={setSelectedSiteId} />
              </div>

              {!selectedSiteId ? (
                <div className="text-center py-20">
                  <Lock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-slate-500">Select a domain to manage protection</p>
                </div>
              ) : protectionLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 text-indigo-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <Ban className="w-4 h-4" /> Block IP Address
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="IP Address (e.g. 192.168.1.1)"
                        value={blockIP}
                        onChange={(e) => setBlockIP(e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                      <input
                        type="text"
                        placeholder="Reason"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                      />
                      <button
                        onClick={() => handleBlockIP()}
                        disabled={blocking || !blockIP.trim()}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors"
                      >
                        {blocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                        Block IP
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <Lock className="w-4 h-4" /> Blocked IPs
                    </h3>
                    {blockedIPs.length === 0 ? (
                      <p className="text-slate-400 text-sm">No blocked IPs</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 px-3 text-slate-500 font-medium">IP Address</th>
                              <th className="text-left py-2 px-3 text-slate-500 font-medium">Reason</th>
                              <th className="text-left py-2 px-3 text-slate-500 font-medium">Type</th>
                              <th className="text-left py-2 px-3 text-slate-500 font-medium">Date</th>
                              <th className="text-right py-2 px-3 text-slate-500 font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {blockedIPs.map((b) => (
                              <tr key={b.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-2.5 px-3 font-mono text-slate-600">{b.ipAddress}</td>
                                <td className="py-2.5 px-3 text-slate-500">{b.reason}</td>
                                <td className="py-2.5 px-3">
                                  <span
                                    className={`text-xs px-2 py-0.5 rounded-full border ${
                                      b.autoBlocked
                                        ? 'bg-purple-100 text-purple-600 border-purple-300'
                                        : 'bg-gray-100 text-gray-500 border-gray-300'
                                    }`}
                                  >
                                    {b.autoBlocked ? 'Auto' : 'Manual'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <button
                                    onClick={() => handleUnblockIP(b.id)}
                                    className="text-xs px-3 py-1 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors"
                                  >
                                    Unblock
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Recent Fraud Events
                    </h3>
                    {fraudEvents.length === 0 ? (
                      <p className="text-slate-400 text-sm">No fraud events detected</p>
                    ) : (
                      <div className="space-y-2">
                        {fraudEvents.map((ev) => (
                          <div
                            key={ev.id}
                            className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200"
                          >
                            <span className="text-sm font-medium text-slate-700">{ev.eventType}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${threatColor(ev.severity)}`}>
                              {ev.severity}
                            </span>
                            <span className="font-mono text-xs text-slate-500">{ev.ip}</span>
                            <span className="text-xs text-slate-400 flex-1 truncate">{ev.details}</span>
                            <span className="text-xs text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {timeAgo(ev.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {snippetModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSnippetModal({ open: false, snippet: '', domain: '' })}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white border border-gray-200 rounded-xl w-full max-w-lg p-6 shadow-xl"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                  <Code className="w-5 h-5 text-indigo-500" />
                  Tracking Snippet
                </h3>
                <button
                  onClick={() => setSnippetModal({ open: false, snippet: '', domain: '' })}
                  className="text-slate-400 hover:text-slate-800"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-3">
                Add this snippet to <span className="text-indigo-600 font-medium">{snippetModal.domain}</span> before the closing{' '}
                <code className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">&lt;/head&gt;</code> tag:
              </p>
              <div className="relative">
                <pre className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                  {snippetModal.snippet}
                </pre>
                <button
                  onClick={copySnippet}
                  className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 transition-colors"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSnippet ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}