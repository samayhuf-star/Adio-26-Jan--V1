import { useState, useEffect, useCallback, useRef } from 'react';
import { GOOGLE_ADS_ENABLED } from '../utils/featureFlags';
import { motion, AnimatePresence } from 'framer-motion';
import { getSessionToken } from '../utils/auth';
import {
  Shield, Plus, Trash2, Copy, Check, Globe, Activity,
  BarChart3, Lock, Eye, Loader2, RefreshCw, AlertTriangle,
  Monitor, Smartphone, Tablet, ChevronDown, X, Ban,
  Clock, Bot, ExternalLink, Code, Search, ArrowLeft,
  CheckCircle, XCircle, Link, Hash, Calendar, Zap,
  Download, Settings, Wifi, WifiOff, Brain, Network,
  ListPlus, ListMinus, ToggleLeft, ToggleRight, Save, Sliders, ChevronUp
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
  region: string;
  device: string;
  browser: string;
  browserVersion: string;
  os: string;
  osVersion: string;
  screenWidth: number;
  screenHeight: number;
  language: string;
  referrer: string;
  pageUrl: string;
  isp: string;
  org: string;
  isProxy: boolean;
  isVpn: boolean;
  isTor: boolean;
  threatLevel: string;
  botScore: number;
  clickCount: number;
  mouseMovements: number;
  timeOnPage: number;
  fingerprint: string;
  blocked: boolean;
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
  details: string | Record<string, any>;
  createdAt: string;
}

interface ProtectionRules {
  repetitiveClickDetection: {
    enabled: boolean;
    maxClicksPerMinute: number;
    maxClicksPerHour: number;
    blockDuration: number;
  };
  vpnProxyBlocking: {
    enabled: boolean;
    blockVpn: boolean;
    blockProxy: boolean;
    blockTor: boolean;
  };
  aiFraudDetection: {
    enabled: boolean;
    threshold: number;
    autoBlock: boolean;
    sensitivity: 'low' | 'medium' | 'high';
  };
  ipClusterBlocking: {
    enabled: boolean;
    maxClicksFromCluster: number;
    clusterRange: number;
  };
  ipWhitelistBlacklist: {
    enabled: boolean;
    whitelist: string[];
    blacklist: string[];
  };
  vpnClickFraud: {
    enabled: boolean;
    autoBlockAfterClicks: number;
    blockDuration: number;
  };
}

const DEFAULT_RULES: ProtectionRules = {
  repetitiveClickDetection: { enabled: true, maxClicksPerMinute: 5, maxClicksPerHour: 10, blockDuration: 24 },
  vpnProxyBlocking: { enabled: true, blockVpn: true, blockProxy: true, blockTor: true },
  aiFraudDetection: { enabled: true, threshold: 70, autoBlock: true, sensitivity: 'medium' },
  ipClusterBlocking: { enabled: false, maxClicksFromCluster: 20, clusterRange: 24 },
  ipWhitelistBlacklist: { enabled: true, whitelist: [], blacklist: [] },
  vpnClickFraud: { enabled: true, autoBlockAfterClicks: 2, blockDuration: 48 },
};

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

function maskIP(ip: string | undefined | null): string {
  if (!ip) return 'Unknown';
  const parts = ip.split('.');
  if (parts.length === 4) return `${parts[0]}.${parts[1]}.xxx.xxx`;
  return ip;
}

function formatDateTime(dateStr: string): { date: string; time: string } {
  if (!dateStr) return { date: '--', time: '--' };
  const d = new Date(dateStr);
  return {
    date: d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }).toUpperCase(),
  };
}

function formatDuration(seconds: number): string {
  if (!seconds || seconds <= 0) return '0s';
  if (seconds < 60) return `${seconds}s`;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return s > 0 ? `${m}m ${s}s` : `${m}m`;
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
  { id: 'blockedips', label: 'Blocked IPs', icon: Ban },
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
  const [snippetModal, setSnippetModal] = useState<{ open: boolean; snippet: string; wordpressSnippet?: string; wordpressPluginSnippet?: string; domain: string }>({
    open: false,
    snippet: '',
    domain: '',
  });
  const [modalSnippetType, setModalSnippetType] = useState<'html' | 'wordpress-plugin' | 'wordpress-php'>('html');
  const [copiedSnippet, setCopiedSnippet] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);
  const [verifyResults, setVerifyResults] = useState<Record<string, { verified: boolean; message: string }>>({});
  const [selectedDomain, setSelectedDomain] = useState<Domain | null>(null);
  const [domainDetail, setDomainDetail] = useState<any>(null);
  const [domainDetailLoading, setDomainDetailLoading] = useState(false);
  const [copiedSiteId, setCopiedSiteId] = useState(false);
  const [copiedDetailSnippet, setCopiedDetailSnippet] = useState(false);
  const [snippetType, setSnippetType] = useState<'html' | 'wordpress-plugin' | 'wordpress-php'>('html');
  const [verifyStatus, setVerifyStatus] = useState<any>(null);
  const [verifyLoading, setVerifyLoading] = useState(false);

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

  const [protectionRules, setProtectionRules] = useState<ProtectionRules>(DEFAULT_RULES);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [rulesDirty, setRulesDirty] = useState(false);
  const [newWhitelistIP, setNewWhitelistIP] = useState('');
  const [newBlacklistIP, setNewBlacklistIP] = useState('');
  const [exportingIPs, setExportingIPs] = useState(false);

  const [selectedIPs, setSelectedIPs] = useState<Set<string>>(new Set());
  const [showGAdsPushDialog, setShowGAdsPushDialog] = useState(false);
  const [gAdsConnected, setGAdsConnected] = useState(false);
  const [gAdsAccounts, setGAdsAccounts] = useState<any[]>([]);
  const [gAdsSelectedAccount, setGAdsSelectedAccount] = useState('');
  const [gAdsLoginCustomerId, setGAdsLoginCustomerId] = useState('');
  const [gAdsCampaigns, setGAdsCampaigns] = useState<any[]>([]);
  const [gAdsSelectedCampaigns, setGAdsSelectedCampaigns] = useState<Set<string>>(new Set());
  const [gAdsCampaignsLoading, setGAdsCampaignsLoading] = useState(false);
  const [gAdsPushing, setGAdsPushing] = useState(false);
  const [gAdsPushResult, setGAdsPushResult] = useState<any>(null);
  const [gAdsManualCustomerId, setGAdsManualCustomerId] = useState('');
  const [lastIpPush, setLastIpPush] = useState<any>(null);

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
      setSnippetModal({ open: true, snippet: data.snippet || data.html || '', wordpressSnippet: data.wordpressSnippet, wordpressPluginSnippet: data.wordpressPluginSnippet, domain: domain.domain });
      setModalSnippetType('html');
    } catch (err: any) {
      setError(err.message);
    }
  };

  const getActiveModalSnippet = () => {
    if (modalSnippetType === 'wordpress-plugin') return snippetModal.wordpressPluginSnippet || snippetModal.snippet;
    if (modalSnippetType === 'wordpress-php') return snippetModal.wordpressSnippet || '';
    return snippetModal.snippet;
  };

  const copySnippet = () => {
    navigator.clipboard.writeText(getActiveModalSnippet());
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
      const raw = Array.isArray(data) ? data : data.visitors || [];
      const mapped = raw.map((v: any) => ({
        id: v.id,
        ip: v.ipAddress || v.ip || '',
        country: v.country || '',
        countryCode: v.countryCode || '',
        city: v.city || '',
        region: v.region || '',
        device: v.deviceType || v.device || '',
        browser: v.browser || '',
        browserVersion: v.browserVersion || v.browser_version || '',
        os: v.os || '',
        osVersion: v.osVersion || v.os_version || '',
        screenWidth: v.screenWidth || v.screen_width || 0,
        screenHeight: v.screenHeight || v.screen_height || 0,
        language: v.language || '',
        referrer: v.referrer || '',
        pageUrl: v.pageUrl || v.page_url || '',
        isp: v.isp || '',
        org: v.org || '',
        isProxy: v.isProxy || v.is_proxy || false,
        isVpn: v.isVpn || v.is_vpn || false,
        isTor: v.isTor || v.is_tor || false,
        threatLevel: v.threatLevel || v.threat_level || 'low',
        botScore: v.botScore || v.bot_score || 0,
        clickCount: v.clickCount || v.click_count || 0,
        mouseMovements: v.mouseMovements || v.mouse_movements || 0,
        timeOnPage: v.timeOnPage || v.time_on_page || 0,
        fingerprint: v.fingerprint || '',
        blocked: v.blocked || false,
        createdAt: v.createdAt || v.created_at || '',
      }));
      setVisitors(mapped);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setVisitorsLoading(false);
    }
  }, []);

  const fetchBlockedIPsOnly = useCallback(async (siteId: string) => {
    if (!siteId) return;
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/blocked-ips/${siteId}`, { headers });
      if (res.ok) {
        const d = await res.json();
        setBlockedIPs(Array.isArray(d) ? d : d.blockedIPs || []);
      }
    } catch {}
  }, []);

  useEffect(() => {
    if (activeTab === 'traffic' && selectedSiteId) {
      fetchVisitors(selectedSiteId);
      fetchBlockedIPsOnly(selectedSiteId);
      refreshInterval.current = setInterval(() => fetchVisitors(selectedSiteId), 10000);
    }
    return () => {
      if (refreshInterval.current) clearInterval(refreshInterval.current);
    };
  }, [activeTab, selectedSiteId, fetchVisitors, fetchBlockedIPsOnly]);

  const fetchAnalytics = useCallback(async (siteId: string) => {
    if (!siteId) return;
    setAnalyticsLoading(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/analytics/${siteId}?period=${timePeriod}`, { headers });
      if (!res.ok) throw new Error('Failed to fetch analytics');
      const data = await res.json();

      const toRecord = (arr: any[], key: string): Record<string, number> => {
        if (!Array.isArray(arr)) return arr || {};
        const result: Record<string, number> = {};
        for (const item of arr) {
          const label = item[key] || 'Unknown';
          result[label] = Number(item.count) || 0;
        }
        return result;
      };

      const byDevice = toRecord(data.byDeviceType, 'deviceType');
      const byBrowser = toRecord(data.byBrowser, 'browser');
      const byOS = toRecord(data.byOs, 'os');
      const byCountry = toRecord(data.byCountry, 'country');
      const byThreatLevel = toRecord(data.byThreatLevel, 'threatLevel');

      const totalVisitors = data.visitors?.last30d || data.visitors?.last7d || 0;
      const uniqueIPs = totalVisitors;
      const threatCounts = byThreatLevel;
      const threatsBlocked = (threatCounts['high'] || 0) + (threatCounts['critical'] || 0);
      const botRate = totalVisitors > 0 ? (threatsBlocked / totalVisitors) * 100 : 0;

      setAnalytics({
        totalVisitors,
        uniqueIPs,
        threatsBlocked,
        botRate,
        byDevice,
        byBrowser,
        byOS,
        byCountry,
        byThreatLevel,
      });
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
    if ((activeTab === 'protection' || activeTab === 'blockedips') && selectedSiteId) {
      fetchProtectionData(selectedSiteId);
    }
  }, [activeTab, selectedSiteId, fetchProtectionData]);

  const fetchProtectionRules = useCallback(async (siteId: string) => {
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/protection-rules/${siteId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        const incoming = data.protectionRules || {};
        const merged: ProtectionRules = {
          repetitiveClickDetection: { ...DEFAULT_RULES.repetitiveClickDetection, ...(incoming.repetitiveClickDetection || {}) },
          vpnProxyBlocking: { ...DEFAULT_RULES.vpnProxyBlocking, ...(incoming.vpnProxyBlocking || {}) },
          aiFraudDetection: { ...DEFAULT_RULES.aiFraudDetection, ...(incoming.aiFraudDetection || {}) },
          ipClusterBlocking: { ...DEFAULT_RULES.ipClusterBlocking, ...(incoming.ipClusterBlocking || {}) },
          ipWhitelistBlacklist: {
            ...DEFAULT_RULES.ipWhitelistBlacklist,
            ...(incoming.ipWhitelistBlacklist || {}),
            whitelist: Array.isArray(incoming.ipWhitelistBlacklist?.whitelist) ? incoming.ipWhitelistBlacklist.whitelist : [],
            blacklist: Array.isArray(incoming.ipWhitelistBlacklist?.blacklist) ? incoming.ipWhitelistBlacklist.blacklist : [],
          },
          vpnClickFraud: { ...DEFAULT_RULES.vpnClickFraud, ...(incoming.vpnClickFraud || {}) },
        };
        setProtectionRules(merged);
      }
    } catch (err) {
      console.error('Failed to fetch protection rules:', err);
    }
  }, []);

  const saveProtectionRules = async () => {
    if (!selectedSiteId) return;
    setRulesSaving(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/protection-rules/${selectedSiteId}`, {
        method: 'PUT',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ protectionRules }),
      });
      if (!res.ok) throw new Error('Failed to save');
      setRulesDirty(false);
    } catch (err) {
      console.error('Failed to save protection rules:', err);
    } finally {
      setRulesSaving(false);
    }
  };

  const updateRule = <K extends keyof ProtectionRules>(ruleKey: K, updates: Partial<ProtectionRules[K]>) => {
    setProtectionRules(prev => ({
      ...prev,
      [ruleKey]: { ...prev[ruleKey], ...updates },
    }));
    setRulesDirty(true);
  };

  const handleExportBlockedIPs = async (format: 'csv' | 'googleads') => {
    if (!selectedSiteId) return;
    setExportingIPs(true);
    try {
      const headers = await authHeaders();
      const res = await fetch(`${API_BASE}/export-blocked-ips/${selectedSiteId}?format=${format}`, { headers });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'csv' ? `blocked-ips.csv` : `google-ads-ip-exclusions.txt`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Export failed:', err);
    } finally {
      setExportingIPs(false);
    }
  };

  const copyBlockedIPsToClipboard = async () => {
    const ips = blockedIPs.map(b => b.ipAddress).join('\n');
    await navigator.clipboard.writeText(ips);
  };

  useEffect(() => {
    if (selectedSiteId) {
      fetchProtectionRules(selectedSiteId);
    }
  }, [selectedSiteId, fetchProtectionRules]);

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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to block IP');
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

  const toggleIPSelection = (ipAddress: string) => {
    setSelectedIPs(prev => {
      const next = new Set(prev);
      if (next.has(ipAddress)) next.delete(ipAddress);
      else next.add(ipAddress);
      return next;
    });
  };

  const toggleAllIPs = () => {
    if (selectedIPs.size === blockedIPs.length) {
      setSelectedIPs(new Set());
    } else {
      setSelectedIPs(new Set(blockedIPs.map(b => b.ipAddress)));
    }
  };

  const fetchGAdsStatus = async () => {
    try {
      const headers = await authHeaders();
      const statusRes = await fetch('/api/google-ads/auth/status', { headers });
      if (statusRes.ok) {
        const data = await statusRes.json();
        setGAdsConnected(data.connected);
        if (data.connected) {
          const accRes = await fetch('/api/google-ads/auth/accounts', { headers });
          if (accRes.ok) {
            const accData = await accRes.json();
            setGAdsAccounts(accData.accounts || []);
            if (accData.selectedCustomerId) {
              setGAdsSelectedAccount(accData.selectedCustomerId);
            }
            if (accData.loginCustomerId) {
              setGAdsLoginCustomerId(accData.loginCustomerId);
            }
          }
        }
      }
    } catch (err) {
      console.error('Failed to check Google Ads status:', err);
    }
  };

  const fetchGAdsCampaigns = async (accountId: string) => {
    if (!accountId) return;
    setGAdsCampaignsLoading(true);
    setGAdsCampaigns([]);
    try {
      const headers = await authHeaders();
      const account = gAdsAccounts.find(a => a.id === accountId);
      const loginCid = account?.managerId || gAdsLoginCustomerId || '';
      const res = await fetch(`/api/google-ads/campaigns?customerId=${accountId}&loginCustomerId=${loginCid}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setGAdsCampaigns(data.campaigns || []);
      }
    } catch (err) {
      console.error('Failed to fetch campaigns:', err);
    } finally {
      setGAdsCampaignsLoading(false);
    }
  };

  const fetchLastIpPush = async (siteId: string) => {
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/google-ads/ip-push-history/${siteId}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setLastIpPush(data.lastPush);
      }
    } catch (err) {
      console.error('Failed to fetch IP push history:', err);
    }
  };

  useEffect(() => {
    if (selectedSiteId) {
      fetchLastIpPush(selectedSiteId);
    }
  }, [selectedSiteId]);

  const openGAdsPushDialog = async () => {
    setShowGAdsPushDialog(true);
    setGAdsPushResult(null);
    setGAdsSelectedCampaigns(new Set());
    await fetchGAdsStatus();
  };

  useEffect(() => {
    if (activeTab === 'blockedips') {
      fetchGAdsStatus();
    }
  }, [activeTab]);

  useEffect(() => {
    if (gAdsSelectedAccount) {
      fetchGAdsCampaigns(gAdsSelectedAccount);
    }
  }, [gAdsSelectedAccount]);

  const toggleCampaignSelection = (campaignId: string) => {
    setGAdsSelectedCampaigns(prev => {
      const next = new Set(prev);
      if (next.has(campaignId)) next.delete(campaignId);
      else next.add(campaignId);
      return next;
    });
  };

  const toggleAllCampaigns = () => {
    if (gAdsSelectedCampaigns.size === gAdsCampaigns.length) {
      setGAdsSelectedCampaigns(new Set());
    } else {
      setGAdsSelectedCampaigns(new Set(gAdsCampaigns.map(c => String(c.id))));
    }
  };

  const handlePushIPsToGAds = async () => {
    const ips = selectedIPs.size > 0 ? Array.from(selectedIPs) : blockedIPs.map(b => b.ipAddress);
    const campaigns = Array.from(gAdsSelectedCampaigns);

    if (ips.length === 0 || campaigns.length === 0) return;

    setGAdsPushing(true);
    setGAdsPushResult(null);
    try {
      const headers = await authHeaders();
      const account = gAdsAccounts.find(a => a.id === gAdsSelectedAccount);
      const loginCid = account?.managerId || gAdsLoginCustomerId || '';

      const res = await fetch('/api/google-ads/push-ip-exclusions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ipAddresses: ips,
          campaignIds: campaigns,
          customerId: gAdsSelectedAccount,
          loginCustomerId: loginCid,
          siteId: selectedSiteId,
        }),
      });

      const data = await res.json();
      setGAdsPushResult(data);

      if (data.success || data.status === 'partial') {
        fetchLastIpPush(selectedSiteId);
      }
    } catch (err: any) {
      setGAdsPushResult({ success: false, error: err.message });
    } finally {
      setGAdsPushing(false);
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
                            {!domainDetail.verified && (
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
                            )}
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
                            Installation Code
                          </h3>
                        </div>

                        <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1">
                          <button
                            onClick={() => { setSnippetType('html'); setCopiedDetailSnippet(false); }}
                            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${snippetType === 'html' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            HTML / Static Sites
                          </button>
                          <button
                            onClick={() => { setSnippetType('wordpress-plugin'); setCopiedDetailSnippet(false); }}
                            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${snippetType === 'wordpress-plugin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            WordPress (Plugin)
                          </button>
                          <button
                            onClick={() => { setSnippetType('wordpress-php'); setCopiedDetailSnippet(false); }}
                            className={`flex-1 px-3 py-2 rounded-md text-xs font-medium transition-colors ${snippetType === 'wordpress-php' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                          >
                            WordPress (PHP)
                          </button>
                        </div>

                        {snippetType === 'html' && (
                          <>
                            <p className="text-sm text-slate-500 mb-4">
                              Add this tracking snippet to your website's <code className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">&lt;head&gt;</code> section.
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
                          </>
                        )}

                        {snippetType === 'wordpress-plugin' && (
                          <>
                            <p className="text-sm text-slate-500 mb-4">
                              Use the <strong>"Insert Headers and Footers"</strong> plugin (or similar) in WordPress. Go to <code className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">Settings &gt; Insert Headers and Footers</code> and paste this in the <strong>Scripts in Header</strong> section.
                            </p>
                            <div className="relative">
                              <pre className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto whitespace-pre-wrap break-all font-mono">
                                {domainDetail.wordpressPluginSnippet || domainDetail.snippet}
                              </pre>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(domainDetail.wordpressPluginSnippet || domainDetail.snippet);
                                  setCopiedDetailSnippet(true);
                                  setTimeout(() => setCopiedDetailSnippet(false), 2000);
                                }}
                                className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 transition-colors"
                              >
                                {copiedDetailSnippet ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedDetailSnippet ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-xs text-amber-800">
                                <strong>Recommended Plugins:</strong> "Insert Headers and Footers" by WPBeginner, "WPCode", or "Header Footer Code Manager". If you use a caching plugin (WP Rocket, W3 Total Cache, etc.), make sure to exclude this script from minification and combining.
                              </p>
                            </div>
                          </>
                        )}

                        {snippetType === 'wordpress-php' && (
                          <>
                            <p className="text-sm text-slate-500 mb-4">
                              Add this PHP code to your theme's <code className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">functions.php</code> file, or use a <strong>Code Snippets</strong> plugin to add it safely.
                            </p>
                            <div className="relative">
                              <pre className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-green-400 overflow-x-auto whitespace-pre-wrap break-all font-mono text-xs">
                                {domainDetail.wordpressSnippet || '// WordPress PHP snippet unavailable'}
                              </pre>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(domainDetail.wordpressSnippet || '');
                                  setCopiedDetailSnippet(true);
                                  setTimeout(() => setCopiedDetailSnippet(false), 2000);
                                }}
                                className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 transition-colors"
                              >
                                {copiedDetailSnippet ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                {copiedDetailSnippet ? 'Copied!' : 'Copy'}
                              </button>
                            </div>
                            <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                              <p className="text-xs text-amber-800">
                                <strong>Important:</strong> If using a child theme, add this to the child theme's functions.php. If your caching plugin minifies or combines JavaScript files, exclude "adiology-clickguard" from optimization.
                              </p>
                            </div>
                          </>
                        )}

                        <div className="mt-4 p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                          <h4 className="text-sm font-medium text-indigo-800 mb-2 flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            How to Verify
                          </h4>
                          <ol className="text-sm text-indigo-700 space-y-1.5 list-decimal list-inside">
                            <li>Copy the snippet above for your platform</li>
                            <li>Install it on your website using the method shown</li>
                            <li>Deploy/publish your website changes</li>
                            <li>Click the "Verify Now" button above to confirm installation</li>
                          </ol>
                        </div>

                        <div className="mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg">
                          <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
                            <Search className="w-4 h-4" />
                            Connection Test
                          </h4>
                          <p className="text-xs text-slate-500 mb-3">
                            Test if your site can communicate with Click Guard servers.
                          </p>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={async () => {
                                setVerifyLoading(true);
                                setVerifyStatus(null);
                                try {
                                  const res = await fetch(`${API_BASE}/verify?sid=${domainDetail.siteId}`);
                                  const data = await res.json();
                                  setVerifyStatus(data);
                                } catch (err: any) {
                                  setVerifyStatus({ success: false, error: err.message || 'Connection failed' });
                                } finally {
                                  setVerifyLoading(false);
                                }
                              }}
                              disabled={verifyLoading}
                              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                            >
                              {verifyLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wifi className="w-3.5 h-3.5" />}
                              Run Connection Test
                            </button>
                            {verifyStatus && (
                              <div className={`flex items-center gap-2 text-xs font-medium ${verifyStatus.success ? 'text-green-600' : 'text-red-600'}`}>
                                {verifyStatus.success ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                                {verifyStatus.message || verifyStatus.error}
                              </div>
                            )}
                          </div>
                          {verifyStatus?.checks && (
                            <div className="mt-3 grid grid-cols-2 gap-2">
                              {Object.entries(verifyStatus.checks).filter(([k]) => ['cors', 'endpoint', 'siteId', 'verified'].includes(k)).map(([key, val]) => (
                                <div key={key} className="flex items-center gap-2 text-xs">
                                  {val ? <CheckCircle className="w-3.5 h-3.5 text-green-500" /> : <XCircle className="w-3.5 h-3.5 text-red-500" />}
                                  <span className="text-slate-600 capitalize">{key === 'siteId' ? 'Site ID Valid' : key === 'cors' ? 'CORS OK' : key === 'endpoint' ? 'Server Reachable' : key === 'verified' ? 'Receiving Data' : key}</span>
                                </div>
                              ))}
                              {verifyStatus.checks.recentVisitors24h !== undefined && (
                                <div className="flex items-center gap-2 text-xs col-span-2">
                                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                                  <span className="text-slate-600">Visitors (last 24h): {verifyStatus.checks.recentVisitors24h}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                          <h4 className="text-sm font-medium text-amber-800 mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4" />
                            Troubleshooting
                          </h4>
                          <p className="text-xs text-amber-700 mb-2">
                            Not seeing traffic data? Try these steps:
                          </p>
                          <ul className="text-xs text-amber-700 space-y-1 list-disc list-inside">
                            <li>Add <code className="bg-amber-100 px-1 rounded">?clickguard_debug=1</code> to your site URL and check the browser console for [ClickGuard] messages</li>
                            <li>If using a caching plugin, clear the cache after installation</li>
                            <li>WordPress security plugins (Wordfence, Sucuri) may block external scripts - whitelist the tracking URL</li>
                            <li>Ensure your site isn't blocking external scripts via Content Security Policy headers</li>
                          </ul>
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
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                      <span className="text-sm text-slate-500">Live feed · Auto-refreshes every 10s</span>
                    </div>
                    <span className="text-xs text-slate-400">{visitors.length} records</span>
                  </div>
                  <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-gradient-to-r from-slate-50 to-gray-50 border-b border-gray-200">
                            <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">#</th>
                            <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Date</th>
                            <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Time</th>
                            <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">IP Address</th>
                            <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Location</th>
                            <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">ISP / Org</th>
                            <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Device</th>
                            <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Browser</th>
                            <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">OS</th>
                            <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Screen</th>
                            <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Page URL</th>
                            <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Referrer</th>
                            <th className="px-3 py-3 text-left font-semibold text-slate-600 whitespace-nowrap">Language</th>
                            <th className="px-3 py-3 text-center font-semibold text-slate-600 whitespace-nowrap">Clicks</th>
                            <th className="px-3 py-3 text-center font-semibold text-slate-600 whitespace-nowrap">Mouse</th>
                            <th className="px-3 py-3 text-center font-semibold text-slate-600 whitespace-nowrap">Time on Page</th>
                            <th className="px-3 py-3 text-center font-semibold text-slate-600 whitespace-nowrap">Flags</th>
                            <th className="px-3 py-3 text-center font-semibold text-slate-600 whitespace-nowrap">Threat</th>
                            <th className="px-3 py-3 text-center font-semibold text-slate-600 whitespace-nowrap">Bot Score</th>
                            <th className="px-3 py-3 text-center font-semibold text-slate-600 whitespace-nowrap">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {visitors.map((v, idx) => {
                            const dt = formatDateTime(v.createdAt);
                            return (
                              <motion.tr
                                key={v.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className={`border-b border-gray-100 hover:bg-slate-50/60 transition-colors ${v.blocked ? 'bg-red-50/40' : ''} ${v.threatLevel?.toLowerCase() === 'critical' ? 'bg-red-50/30' : v.threatLevel?.toLowerCase() === 'high' ? 'bg-orange-50/30' : ''}`}
                              >
                                <td className="px-3 py-2.5 text-slate-400 font-mono">{idx + 1}</td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <span className="text-slate-600">{dt.date}</span>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <div className="flex items-center gap-1">
                                    <span className="text-slate-600">{dt.time}</span>
                                    <span className="text-slate-400 ml-1">({timeAgo(v.createdAt)})</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <span className="font-mono text-slate-700">{maskIP(v.ip)}</span>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-base leading-none">{countryCodeToFlag(v.countryCode)}</span>
                                    <div className="flex flex-col">
                                      <span className="text-slate-700">{v.country || '--'}</span>
                                      {(v.city || v.region) && (
                                        <span className="text-[10px] text-slate-400">{[v.city, v.region].filter(Boolean).join(', ')}</span>
                                      )}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap max-w-[140px]">
                                  <div className="flex flex-col">
                                    <span className="text-slate-600 truncate" title={v.isp}>{v.isp || '--'}</span>
                                    {v.org && v.org !== v.isp && (
                                      <span className="text-[10px] text-slate-400 truncate" title={v.org}>{v.org}</span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <span className="flex items-center gap-1 text-slate-600">
                                    {deviceIcon(v.device)} {v.device || '--'}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-slate-600">{v.browser || '--'}</span>
                                    {v.browserVersion && <span className="text-[10px] text-slate-400">v{v.browserVersion}</span>}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap">
                                  <div className="flex flex-col">
                                    <span className="text-slate-600">{v.os || '--'}</span>
                                    {v.osVersion && <span className="text-[10px] text-slate-400">{v.osVersion}</span>}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">
                                  {v.screenWidth && v.screenHeight ? `${v.screenWidth}×${v.screenHeight}` : '--'}
                                </td>
                                <td className="px-3 py-2.5 max-w-[160px]">
                                  <span className="text-slate-500 truncate block" title={v.pageUrl}>
                                    {v.pageUrl ? v.pageUrl.replace(/^https?:\/\//, '').replace(/\/$/, '') : '--'}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 max-w-[120px]">
                                  {v.referrer ? (
                                    <span className="text-slate-500 truncate block" title={v.referrer}>
                                      {v.referrer.replace(/^https?:\/\//, '').replace(/\/$/, '')}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">Direct</span>
                                  )}
                                </td>
                                <td className="px-3 py-2.5 whitespace-nowrap text-slate-500">{v.language || '--'}</td>
                                <td className="px-3 py-2.5 text-center text-slate-600">{v.clickCount}</td>
                                <td className="px-3 py-2.5 text-center text-slate-600">{v.mouseMovements}</td>
                                <td className="px-3 py-2.5 text-center whitespace-nowrap text-slate-600">{formatDuration(v.timeOnPage)}</td>
                                <td className="px-3 py-2.5 text-center whitespace-nowrap">
                                  <div className="flex items-center gap-1 justify-center">
                                    {v.isVpn && <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 rounded text-[10px] font-medium">VPN</span>}
                                    {v.isProxy && <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">Proxy</span>}
                                    {v.isTor && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">TOR</span>}
                                    {v.blocked && <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-medium">Blocked</span>}
                                    {!v.isVpn && !v.isProxy && !v.isTor && !v.blocked && <span className="text-slate-300">—</span>}
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <span className={`inline-flex px-2 py-0.5 rounded-full border text-[10px] font-semibold ${threatColor(v.threatLevel)}`}>
                                    {v.threatLevel}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <div className="flex items-center gap-1 justify-center">
                                    <div className="w-10 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                      <div
                                        className={`h-full rounded-full ${v.botScore >= 70 ? 'bg-red-500' : v.botScore >= 50 ? 'bg-orange-500' : v.botScore >= 30 ? 'bg-yellow-500' : 'bg-green-500'}`}
                                        style={{ width: `${Math.min(v.botScore, 100)}%` }}
                                      />
                                    </div>
                                    <span className="text-slate-600 font-mono">{v.botScore}%</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  {blockedIPs.some(b => b.ipAddress === v.ip) ? (
                                    <span className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-500 rounded-lg text-xs whitespace-nowrap">
                                      <Lock className="w-3 h-3" />
                                      Blocked
                                    </span>
                                  ) : (
                                    <button
                                      onClick={() => handleBlockIP(v.ip, `Manual block - ${v.threatLevel || 'unknown'} threat level`)}
                                      className={`flex items-center gap-1 px-2 py-1 rounded-lg transition-colors whitespace-nowrap text-xs ${
                                        v.threatLevel?.toLowerCase() === 'critical' || v.threatLevel?.toLowerCase() === 'high'
                                          ? 'bg-red-100 hover:bg-red-200 text-red-600'
                                          : 'bg-slate-100 hover:bg-red-100 text-slate-500 hover:text-red-600'
                                      }`}
                                    >
                                      <Ban className="w-3 h-3" />
                                      Block
                                    </button>
                                  )}
                                </td>
                              </motion.tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
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
                      {
                        label: 'Total Visitors',
                        value: analytics.totalVisitors,
                        icon: Activity,
                        gradient: 'from-blue-500 to-indigo-600',
                        tint: 'bg-blue-50 border-blue-100',
                        sub: analytics.totalVisitors > 0
                          ? `${((analytics.totalVisitors - analytics.threatsBlocked) / analytics.totalVisitors * 100).toFixed(1)}% valid visits`
                          : 'No visits yet',
                      },
                      {
                        label: 'Unique IPs',
                        value: analytics.uniqueIPs,
                        icon: Globe,
                        gradient: 'from-purple-500 to-pink-600',
                        tint: 'bg-purple-50 border-purple-100',
                        sub: analytics.totalVisitors > 0
                          ? `${(analytics.uniqueIPs / analytics.totalVisitors * 100).toFixed(1)}% unique rate`
                          : 'No data',
                      },
                      {
                        label: 'Threats Blocked',
                        value: analytics.threatsBlocked,
                        icon: Shield,
                        gradient: 'from-[#FF6B6B] to-[#E84393]',
                        tint: 'bg-red-50 border-red-100',
                        sub: analytics.totalVisitors > 0
                          ? `${(analytics.threatsBlocked / analytics.totalVisitors * 100).toFixed(1)}% of all traffic`
                          : 'No threats',
                      },
                      {
                        label: 'Bot Rate',
                        value: `${analytics.botRate?.toFixed(1) || 0}%`,
                        icon: Bot,
                        gradient: 'from-[#FF9F43] to-[#FDCB6E]',
                        tint: 'bg-amber-50 border-amber-100',
                        sub: analytics.threatsBlocked > 0
                          ? `${analytics.threatsBlocked} suspicious visits`
                          : 'All traffic clean',
                      },
                    ].map((stat, i) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, delay: i * 0.08 }}
                        className={`${stat.tint} border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow`}
                      >
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`p-2.5 bg-gradient-to-br ${stat.gradient} rounded-xl shadow-sm`}>
                            <stat.icon className="w-5 h-5 text-white" />
                          </div>
                          <span className="text-sm font-medium text-slate-500">{stat.label}</span>
                        </div>
                        <p className="text-3xl font-extrabold text-[#2D3436] mb-1">{stat.value}</p>
                        <p className="text-xs text-slate-400">{stat.sub}</p>
                      </motion.div>
                    ))}
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 mb-6">
                    {(() => {
                      const threatData = analytics.byThreatLevel || {};
                      const totalThreats = Object.values(threatData).reduce((a, b) => a + b, 0);
                      const botCount = (threatData['high'] || 0) + (threatData['critical'] || 0);
                      const suspiciousCount = threatData['medium'] || 0;
                      const cleanCount = threatData['low'] || 0;
                      const groupEntries = [
                        { label: 'Bot Activity', count: botCount, color: '#E84393' },
                        { label: 'Suspicious', count: suspiciousCount, color: '#FF9F43' },
                        { label: 'Clean Traffic', count: cleanCount, color: '#00B894' },
                      ].filter(e => e.count > 0);
                      const groupTotal = groupEntries.reduce((a, b) => a + b.count, 0) || 1;
                      let groupOffset = 0;
                      const circumference = 2 * Math.PI * 54;

                      const levelEntries = [
                        { label: 'Low', count: threatData['low'] || 0, color: '#00B894' },
                        { label: 'Medium', count: threatData['medium'] || 0, color: '#FDCB6E' },
                        { label: 'High', count: threatData['high'] || 0, color: '#FF9F43' },
                        { label: 'Critical', count: threatData['critical'] || 0, color: '#FF6B6B' },
                      ].filter(e => e.count > 0);
                      const levelTotal = levelEntries.reduce((a, b) => a + b.count, 0) || 1;
                      let levelOffset = 0;

                      return (
                        <>
                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.1 }}
                            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
                          >
                            <h3 className="text-sm font-semibold text-[#2D3436] mb-5 flex items-center gap-2">
                              <Shield className="w-4 h-4 text-[#E84393]" /> Threat Groups Distribution
                            </h3>
                            {groupEntries.length === 0 ? (
                              <p className="text-gray-400 text-sm text-center py-8">No threat data available</p>
                            ) : (
                              <div className="flex flex-col items-center">
                                <svg width="140" height="140" viewBox="0 0 120 120" className="mb-4">
                                  <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                                  {groupEntries.map((entry) => {
                                    const segLen = (entry.count / groupTotal) * circumference;
                                    const dash = `${segLen} ${circumference - segLen}`;
                                    const offset = -groupOffset + circumference * 0.25;
                                    groupOffset += segLen;
                                    return (
                                      <circle
                                        key={entry.label}
                                        cx="60" cy="60" r="54"
                                        fill="none"
                                        stroke={entry.color}
                                        strokeWidth="12"
                                        strokeDasharray={dash}
                                        strokeDashoffset={offset}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dasharray 0.6s ease' }}
                                      />
                                    );
                                  })}
                                  <text x="60" y="56" textAnchor="middle" className="text-lg font-bold" fill="#2D3436" fontSize="18">{totalThreats}</text>
                                  <text x="60" y="72" textAnchor="middle" fill="#94a3b8" fontSize="10">total</text>
                                </svg>
                                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                                  {groupEntries.map((entry) => (
                                    <div key={entry.label} className="flex items-center gap-2 text-sm">
                                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                                      <span className="text-slate-600">{entry.label}</span>
                                      <span className="font-semibold text-[#2D3436]">{entry.count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>

                          <motion.div
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.4, delay: 0.15 }}
                            className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
                          >
                            <h3 className="text-sm font-semibold text-[#2D3436] mb-5 flex items-center gap-2">
                              <AlertTriangle className="w-4 h-4 text-[#FF9F43]" /> Traffic by Threat Level
                            </h3>
                            {levelEntries.length === 0 ? (
                              <p className="text-gray-400 text-sm text-center py-8">No threat level data</p>
                            ) : (
                              <div className="flex flex-col items-center">
                                <svg width="140" height="140" viewBox="0 0 120 120" className="mb-4">
                                  <circle cx="60" cy="60" r="54" fill="none" stroke="#f1f5f9" strokeWidth="12" />
                                  {levelEntries.map((entry) => {
                                    const segLen = (entry.count / levelTotal) * circumference;
                                    const dash = `${segLen} ${circumference - segLen}`;
                                    const offset = -levelOffset + circumference * 0.25;
                                    levelOffset += segLen;
                                    return (
                                      <circle
                                        key={entry.label}
                                        cx="60" cy="60" r="54"
                                        fill="none"
                                        stroke={entry.color}
                                        strokeWidth="12"
                                        strokeDasharray={dash}
                                        strokeDashoffset={offset}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dasharray 0.6s ease' }}
                                      />
                                    );
                                  })}
                                  <text x="60" y="56" textAnchor="middle" className="text-lg font-bold" fill="#2D3436" fontSize="18">{levelTotal}</text>
                                  <text x="60" y="72" textAnchor="middle" fill="#94a3b8" fontSize="10">events</text>
                                </svg>
                                <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
                                  {levelEntries.map((entry) => (
                                    <div key={entry.label} className="flex items-center gap-2 text-sm">
                                      <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: entry.color }} />
                                      <span className="text-slate-600">{entry.label}</span>
                                      <span className="font-semibold text-[#2D3436]">{entry.count}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        </>
                      );
                    })()}
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.2 }}
                    className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm mb-6"
                  >
                    <h3 className="text-sm font-semibold text-[#2D3436] mb-4 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-[#FF9F43]" /> Top Countries
                    </h3>
                    {Object.keys(analytics.byCountry || {}).length === 0 ? (
                      <p className="text-gray-400 text-sm text-center py-6">No country data available</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 text-slate-500">
                              <th className="text-left py-2.5 px-4 rounded-l-lg font-medium">#</th>
                              <th className="text-left py-2.5 px-4 font-medium">Country</th>
                              <th className="text-right py-2.5 px-4 font-medium">Traffic</th>
                              <th className="text-right py-2.5 px-4 rounded-r-lg font-medium">% of All</th>
                            </tr>
                          </thead>
                          <tbody>
                            {(() => {
                              const countryEntries = Object.entries(analytics.byCountry || {})
                                .sort((a, b) => b[1] - a[1])
                                .slice(0, 10);
                              const countryTotal = Object.values(analytics.byCountry || {}).reduce((a, b) => a + b, 0) || 1;
                              return countryEntries.map(([country, count], idx) => {
                                const code = country.length === 2 ? country : '';
                                return (
                                  <tr
                                    key={country}
                                    className={`border-b border-gray-50 ${idx % 2 === 1 ? 'bg-gray-50/50' : ''} hover:bg-gray-50 transition-colors`}
                                  >
                                    <td className="py-2.5 px-4 text-slate-400 font-medium">{idx + 1}</td>
                                    <td className="py-2.5 px-4 flex items-center gap-2">
                                      <span className="text-lg">{countryCodeToFlag(code)}</span>
                                      <span className="text-[#2D3436] font-medium">{country}</span>
                                    </td>
                                    <td className="py-2.5 px-4 text-right font-semibold text-[#2D3436]">{count.toLocaleString()}</td>
                                    <td className="py-2.5 px-4 text-right text-slate-500">{(count / countryTotal * 100).toFixed(1)}%</td>
                                  </tr>
                                );
                              });
                            })()}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </motion.div>

                  <div className="grid gap-6 md:grid-cols-3 mb-6">
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.25 }}
                      className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                    >
                      <h3 className="text-sm font-semibold text-[#2D3436] mb-4 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-purple-500" /> By Device Type
                      </h3>
                      <BarChart data={analytics.byDevice || {}} colorClass="bg-gradient-to-r from-purple-500 to-violet-500" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.3 }}
                      className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                    >
                      <h3 className="text-sm font-semibold text-[#2D3436] mb-4 flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-500" /> By Browser
                      </h3>
                      <BarChart data={analytics.byBrowser || {}} colorClass="bg-gradient-to-r from-cyan-500 to-blue-500" />
                    </motion.div>
                    <motion.div
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.4, delay: 0.35 }}
                      className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm"
                    >
                      <h3 className="text-sm font-semibold text-[#2D3436] mb-4 flex items-center gap-2">
                        <Monitor className="w-4 h-4 text-emerald-500" /> By Operating System
                      </h3>
                      <BarChart data={analytics.byOS || {}} colorClass="bg-gradient-to-r from-emerald-500 to-green-500" />
                    </motion.div>
                  </div>

                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: 0.4 }}
                    className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm"
                  >
                    <h3 className="text-sm font-semibold text-[#2D3436] mb-5 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-[#FF6B6B]" /> Threat Level Breakdown
                    </h3>
                    {(() => {
                      const threatData = analytics.byThreatLevel || {};
                      const levels = [
                        { key: 'low', label: 'Low', color: '#00B894', bg: 'bg-green-50' },
                        { key: 'medium', label: 'Medium', color: '#FDCB6E', bg: 'bg-yellow-50' },
                        { key: 'high', label: 'High', color: '#FF9F43', bg: 'bg-orange-50' },
                        { key: 'critical', label: 'Critical', color: '#FF6B6B', bg: 'bg-red-50' },
                      ];
                      const maxCount = Math.max(...levels.map(l => threatData[l.key] || 0), 1);
                      const totalCount = levels.reduce((a, l) => a + (threatData[l.key] || 0), 0) || 1;
                      return (
                        <div className="space-y-3">
                          {levels.map((level) => {
                            const count = threatData[level.key] || 0;
                            const pct = (count / totalCount * 100).toFixed(1);
                            return (
                              <div key={level.key} className="flex items-center gap-4">
                                <span className="text-sm font-medium text-slate-600 w-16">{level.label}</span>
                                <div className="flex-1 bg-gray-100 rounded-full h-6 overflow-hidden relative">
                                  <motion.div
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(count / maxCount) * 100}%` }}
                                    transition={{ duration: 0.7 }}
                                    className="h-full rounded-full"
                                    style={{ backgroundColor: level.color }}
                                  />
                                </div>
                                <span className="text-sm font-bold text-[#2D3436] w-14 text-right">{count}</span>
                                <span className="text-xs text-slate-400 w-14 text-right">{pct}%</span>
                              </div>
                            );
                          })}
                          {levels.every(l => !(threatData[l.key])) && (
                            <p className="text-gray-400 text-sm text-center py-4">No threat level data available</p>
                          )}
                        </div>
                      );
                    })()}
                  </motion.div>
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
                  {rulesDirty && (
                    <div className="sticky top-0 z-10 bg-indigo-600 text-white rounded-xl px-5 py-3 flex items-center justify-between shadow-lg">
                      <span className="text-sm font-medium">You have unsaved changes</span>
                      <button
                        onClick={saveProtectionRules}
                        disabled={rulesSaving}
                        className="flex items-center gap-2 px-4 py-1.5 bg-white text-indigo-600 rounded-lg text-sm font-semibold hover:bg-indigo-50 transition-colors disabled:opacity-50"
                      >
                        {rulesSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        Save Rules
                      </button>
                    </div>
                  )}

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${protectionRules.repetitiveClickDetection.enabled ? 'border-indigo-200 ring-1 ring-indigo-100' : 'border-gray-200 opacity-75'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${protectionRules.repetitiveClickDetection.enabled ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Zap className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">Repetitive Click Detection</h3>
                            <p className="text-xs text-slate-500">Block repeated clicks from the same device</p>
                          </div>
                        </div>
                        <button
                          onClick={() => updateRule('repetitiveClickDetection', { enabled: !protectionRules.repetitiveClickDetection.enabled })}
                          className={`relative w-11 h-6 rounded-full transition-colors ${protectionRules.repetitiveClickDetection.enabled ? 'bg-indigo-600' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${protectionRules.repetitiveClickDetection.enabled ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                      {protectionRules.repetitiveClickDetection.enabled && (
                        <div className="space-y-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-600">Max clicks/minute</label>
                            <input type="number" min="1" max="100" value={protectionRules.repetitiveClickDetection.maxClicksPerMinute} onChange={e => updateRule('repetitiveClickDetection', { maxClicksPerMinute: parseInt(e.target.value) || 1 })} className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-center bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-600">Max clicks/hour</label>
                            <input type="number" min="1" max="1000" value={protectionRules.repetitiveClickDetection.maxClicksPerHour} onChange={e => updateRule('repetitiveClickDetection', { maxClicksPerHour: parseInt(e.target.value) || 1 })} className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-center bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-600">Block duration (hours)</label>
                            <input type="number" min="1" max="720" value={protectionRules.repetitiveClickDetection.blockDuration} onChange={e => updateRule('repetitiveClickDetection', { blockDuration: parseInt(e.target.value) || 1 })} className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-center bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${protectionRules.vpnProxyBlocking.enabled ? 'border-purple-200 ring-1 ring-purple-100' : 'border-gray-200 opacity-75'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${protectionRules.vpnProxyBlocking.enabled ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                            <WifiOff className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">VPN & Proxy Blocking</h3>
                            <p className="text-xs text-slate-500">Block clicks from VPNs for authentic traffic</p>
                          </div>
                        </div>
                        <button
                          onClick={() => updateRule('vpnProxyBlocking', { enabled: !protectionRules.vpnProxyBlocking.enabled })}
                          className={`relative w-11 h-6 rounded-full transition-colors ${protectionRules.vpnProxyBlocking.enabled ? 'bg-purple-600' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${protectionRules.vpnProxyBlocking.enabled ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                      {protectionRules.vpnProxyBlocking.enabled && (
                        <div className="space-y-3 pt-3 border-t border-gray-100">
                          {[
                            { key: 'blockVpn' as const, label: 'Block VPN connections' },
                            { key: 'blockProxy' as const, label: 'Block proxy servers' },
                            { key: 'blockTor' as const, label: 'Block Tor exit nodes' },
                          ].map(item => (
                            <div key={item.key} className="flex items-center justify-between">
                              <label className="text-xs text-slate-600">{item.label}</label>
                              <button
                                onClick={() => updateRule('vpnProxyBlocking', { [item.key]: !protectionRules.vpnProxyBlocking[item.key] })}
                                className={`relative w-9 h-5 rounded-full transition-colors ${protectionRules.vpnProxyBlocking[item.key] ? 'bg-purple-600' : 'bg-gray-300'}`}
                              >
                                <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${protectionRules.vpnProxyBlocking[item.key] ? 'translate-x-4' : ''}`} />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${protectionRules.aiFraudDetection.enabled ? 'border-emerald-200 ring-1 ring-emerald-100' : 'border-gray-200 opacity-75'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${protectionRules.aiFraudDetection.enabled ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Brain className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">AI Fraud Detection</h3>
                            <p className="text-xs text-slate-500">Analyze & block fraudulent behavior with AI</p>
                          </div>
                        </div>
                        <button
                          onClick={() => updateRule('aiFraudDetection', { enabled: !protectionRules.aiFraudDetection.enabled })}
                          className={`relative w-11 h-6 rounded-full transition-colors ${protectionRules.aiFraudDetection.enabled ? 'bg-emerald-600' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${protectionRules.aiFraudDetection.enabled ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                      {protectionRules.aiFraudDetection.enabled && (
                        <div className="space-y-4 pt-3 border-t border-gray-100">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-xs text-slate-600">Fraud threshold</label>
                              <span className="text-xs font-semibold text-emerald-600">{protectionRules.aiFraudDetection.threshold}%</span>
                            </div>
                            <input type="range" min="10" max="100" step="5" value={protectionRules.aiFraudDetection.threshold} onChange={e => updateRule('aiFraudDetection', { threshold: parseInt(e.target.value) })} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" />
                            <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                              <span>Strict (10%)</span>
                              <span>Lenient (100%)</span>
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-600">Sensitivity</label>
                            <select value={protectionRules.aiFraudDetection.sensitivity} onChange={e => updateRule('aiFraudDetection', { sensitivity: e.target.value as 'low' | 'medium' | 'high' })} className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:ring-2 focus:ring-emerald-500 outline-none">
                              <option value="low">Low</option>
                              <option value="medium">Medium</option>
                              <option value="high">High</option>
                            </select>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-600">Auto-block detected fraud</label>
                            <button
                              onClick={() => updateRule('aiFraudDetection', { autoBlock: !protectionRules.aiFraudDetection.autoBlock })}
                              className={`relative w-9 h-5 rounded-full transition-colors ${protectionRules.aiFraudDetection.autoBlock ? 'bg-emerald-600' : 'bg-gray-300'}`}
                            >
                              <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${protectionRules.aiFraudDetection.autoBlock ? 'translate-x-4' : ''}`} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={`bg-white border rounded-xl p-5 shadow-sm transition-all ${protectionRules.ipClusterBlocking.enabled ? 'border-orange-200 ring-1 ring-orange-100' : 'border-gray-200 opacity-75'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${protectionRules.ipClusterBlocking.enabled ? 'bg-orange-100 text-orange-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Network className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">IP Cluster Blocking</h3>
                            <p className="text-xs text-slate-500">Block suspicious activity from similar IP ranges</p>
                          </div>
                        </div>
                        <button
                          onClick={() => updateRule('ipClusterBlocking', { enabled: !protectionRules.ipClusterBlocking.enabled })}
                          className={`relative w-11 h-6 rounded-full transition-colors ${protectionRules.ipClusterBlocking.enabled ? 'bg-orange-600' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${protectionRules.ipClusterBlocking.enabled ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                      {protectionRules.ipClusterBlocking.enabled && (
                        <div className="space-y-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-600">Max clicks from cluster</label>
                            <input type="number" min="1" max="200" value={protectionRules.ipClusterBlocking.maxClicksFromCluster} onChange={e => updateRule('ipClusterBlocking', { maxClicksFromCluster: parseInt(e.target.value) || 1 })} className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-center bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none" />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-600">Cluster subnet range (/x)</label>
                            <input type="number" min="16" max="32" value={protectionRules.ipClusterBlocking.clusterRange} onChange={e => updateRule('ipClusterBlocking', { clusterRange: parseInt(e.target.value) || 24 })} className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-center bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none" />
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={`lg:col-span-2 bg-white border rounded-xl p-5 shadow-sm transition-all ${protectionRules.ipWhitelistBlacklist.enabled ? 'border-blue-200 ring-1 ring-blue-100' : 'border-gray-200 opacity-75'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${protectionRules.ipWhitelistBlacklist.enabled ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-400'}`}>
                            <ListPlus className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">IP Whitelist & Blacklist</h3>
                            <p className="text-xs text-slate-500">Add or exclude specific IPs or IP ranges (e.g., 192.168.1.0/24)</p>
                          </div>
                        </div>
                        <button
                          onClick={() => updateRule('ipWhitelistBlacklist', { enabled: !protectionRules.ipWhitelistBlacklist.enabled })}
                          className={`relative w-11 h-6 rounded-full transition-colors ${protectionRules.ipWhitelistBlacklist.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${protectionRules.ipWhitelistBlacklist.enabled ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                      {protectionRules.ipWhitelistBlacklist.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                          <div>
                            <label className="text-xs font-medium text-green-700 flex items-center gap-1 mb-2">
                              <CheckCircle className="w-3.5 h-3.5" /> Whitelisted IPs (Always Allow)
                            </label>
                            <div className="flex gap-2 mb-2">
                              <input type="text" placeholder="IP or range (e.g. 10.0.0.0/8)" value={newWhitelistIP} onChange={e => setNewWhitelistIP(e.target.value)} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:ring-2 focus:ring-green-500 outline-none" onKeyDown={e => { if (e.key === 'Enter' && newWhitelistIP.trim()) { updateRule('ipWhitelistBlacklist', { whitelist: [...(protectionRules.ipWhitelistBlacklist.whitelist || []), newWhitelistIP.trim()] }); setNewWhitelistIP(''); } }} />
                              <button onClick={() => { if (newWhitelistIP.trim()) { updateRule('ipWhitelistBlacklist', { whitelist: [...(protectionRules.ipWhitelistBlacklist.whitelist || []), newWhitelistIP.trim()] }); setNewWhitelistIP(''); } }} className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm hover:bg-green-700 transition-colors">
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {(protectionRules.ipWhitelistBlacklist.whitelist || []).map((ip, i) => (
                                <div key={i} className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-1.5 text-sm">
                                  <span className="font-mono text-green-800">{ip}</span>
                                  <button onClick={() => updateRule('ipWhitelistBlacklist', { whitelist: (protectionRules.ipWhitelistBlacklist.whitelist || []).filter((_, idx) => idx !== i) })} className="text-green-500 hover:text-red-500 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              {(protectionRules.ipWhitelistBlacklist.whitelist || []).length === 0 && <p className="text-xs text-slate-400 italic">No whitelisted IPs</p>}
                            </div>
                          </div>
                          <div>
                            <label className="text-xs font-medium text-red-700 flex items-center gap-1 mb-2">
                              <XCircle className="w-3.5 h-3.5" /> Blacklisted IPs (Always Block)
                            </label>
                            <div className="flex gap-2 mb-2">
                              <input type="text" placeholder="IP or range (e.g. 192.168.1.0/24)" value={newBlacklistIP} onChange={e => setNewBlacklistIP(e.target.value)} className="flex-1 text-sm border border-gray-200 rounded-lg px-3 py-1.5 bg-gray-50 focus:ring-2 focus:ring-red-500 outline-none" onKeyDown={e => { if (e.key === 'Enter' && newBlacklistIP.trim()) { updateRule('ipWhitelistBlacklist', { blacklist: [...(protectionRules.ipWhitelistBlacklist.blacklist || []), newBlacklistIP.trim()] }); setNewBlacklistIP(''); } }} />
                              <button onClick={() => { if (newBlacklistIP.trim()) { updateRule('ipWhitelistBlacklist', { blacklist: [...(protectionRules.ipWhitelistBlacklist.blacklist || []), newBlacklistIP.trim()] }); setNewBlacklistIP(''); } }} className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors">
                                <Plus className="w-4 h-4" />
                              </button>
                            </div>
                            <div className="space-y-1 max-h-32 overflow-y-auto">
                              {(protectionRules.ipWhitelistBlacklist.blacklist || []).map((ip, i) => (
                                <div key={i} className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg px-3 py-1.5 text-sm">
                                  <span className="font-mono text-red-800">{ip}</span>
                                  <button onClick={() => updateRule('ipWhitelistBlacklist', { blacklist: (protectionRules.ipWhitelistBlacklist.blacklist || []).filter((_, idx) => idx !== i) })} className="text-red-500 hover:text-red-700 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ))}
                              {(protectionRules.ipWhitelistBlacklist.blacklist || []).length === 0 && <p className="text-xs text-slate-400 italic">No blacklisted IPs</p>}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className={`lg:col-span-2 bg-white border rounded-xl p-5 shadow-sm transition-all ${protectionRules.vpnClickFraud.enabled ? 'border-rose-200 ring-1 ring-rose-100' : 'border-gray-200 opacity-75'}`}>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${protectionRules.vpnClickFraud.enabled ? 'bg-rose-100 text-rose-600' : 'bg-gray-100 text-gray-400'}`}>
                            <Shield className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-slate-800">VPN Click Fraud Prevention</h3>
                            <p className="text-xs text-slate-500">Stop fraudulent clicks from VPN users with automatic blocking</p>
                          </div>
                        </div>
                        <button
                          onClick={() => updateRule('vpnClickFraud', { enabled: !protectionRules.vpnClickFraud.enabled })}
                          className={`relative w-11 h-6 rounded-full transition-colors ${protectionRules.vpnClickFraud.enabled ? 'bg-rose-600' : 'bg-gray-300'}`}
                        >
                          <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${protectionRules.vpnClickFraud.enabled ? 'translate-x-5' : ''}`} />
                        </button>
                      </div>
                      {protectionRules.vpnClickFraud.enabled && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-600">Auto-block after X clicks</label>
                            <input type="number" min="1" max="20" value={protectionRules.vpnClickFraud.autoBlockAfterClicks} onChange={e => updateRule('vpnClickFraud', { autoBlockAfterClicks: parseInt(e.target.value) || 1 })} className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-center bg-gray-50 focus:ring-2 focus:ring-rose-500 outline-none" />
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-xs text-slate-600">Block duration (hours)</label>
                            <input type="number" min="1" max="720" value={protectionRules.vpnClickFraud.blockDuration} onChange={e => updateRule('vpnClickFraud', { blockDuration: parseInt(e.target.value) || 1 })} className="w-20 text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-center bg-gray-50 focus:ring-2 focus:ring-rose-500 outline-none" />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <Ban className="w-4 h-4" /> Block IP Address
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input type="text" placeholder="IP Address (e.g. 192.168.1.1)" value={blockIP} onChange={(e) => setBlockIP(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                      <input type="text" placeholder="Reason" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} className="flex-1 bg-gray-50 border border-gray-200 rounded-lg px-4 py-2.5 text-slate-800 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none" />
                      <button onClick={() => handleBlockIP()} disabled={blocking || !blockIP.trim()} className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium disabled:opacity-50 transition-colors">
                        {blocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />}
                        Block IP
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <div className="flex flex-col gap-3 mb-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Lock className="w-4 h-4" /> Blocked IPs ({blockedIPs.length})
                        </h3>
                        {blockedIPs.length > 0 && (
                          <div className="flex items-center gap-2 flex-wrap">
                            <button onClick={copyBlockedIPsToClipboard} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors">
                              <Copy className="w-3.5 h-3.5" /> Copy All
                            </button>
                            <button onClick={() => handleExportBlockedIPs('csv')} disabled={exportingIPs} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                              <Download className="w-3.5 h-3.5" /> Export CSV
                            </button>
                            <button onClick={() => handleExportBlockedIPs('googleads')} disabled={exportingIPs} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                              <Download className="w-3.5 h-3.5" /> Download Google Ads Format
                            </button>
                            {GOOGLE_ADS_ENABLED && (
                            <button
                              onClick={openGAdsPushDialog}
                              className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                              {selectedIPs.size > 0 ? `Push ${selectedIPs.size} IPs to Google Ads` : 'Push to Google Ads'}
                            </button>
                            )}
                          </div>
                        )}
                      </div>
                      {GOOGLE_ADS_ENABLED && lastIpPush && (
                        <div className="flex items-center gap-2 text-xs text-slate-500 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                          <CheckCircle className="w-3.5 h-3.5 text-orange-500" />
                          <span>
                            Last pushed to Google Ads: <strong className="text-slate-700">{new Date(lastIpPush.pushedAt).toLocaleDateString()} at {new Date(lastIpPush.pushedAt).toLocaleTimeString()}</strong>
                            {' '}&middot; {lastIpPush.ipsCount} IP{lastIpPush.ipsCount !== 1 ? 's' : ''} to {(lastIpPush.campaignIds as any[])?.length || 0} campaign{(lastIpPush.campaignIds as any[])?.length !== 1 ? 's' : ''}
                            {' '}&middot; Account: {lastIpPush.googleAdsCustomerId}
                            {lastIpPush.status === 'partial' && <span className="text-amber-600 ml-1">(partial)</span>}
                          </span>
                        </div>
                      )}
                    </div>
                    {blockedIPs.length === 0 ? (
                      <p className="text-slate-400 text-sm">No blocked IPs</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="py-2 px-2 w-8">
                                <input
                                  type="checkbox"
                                  checked={selectedIPs.size === blockedIPs.length && blockedIPs.length > 0}
                                  onChange={toggleAllIPs}
                                  className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                />
                              </th>
                              <th className="text-left py-2 px-3 text-slate-500 font-medium">IP Address</th>
                              <th className="text-left py-2 px-3 text-slate-500 font-medium">Reason</th>
                              <th className="text-left py-2 px-3 text-slate-500 font-medium">Type</th>
                              <th className="text-left py-2 px-3 text-slate-500 font-medium">Date</th>
                              <th className="text-right py-2 px-3 text-slate-500 font-medium">Action</th>
                            </tr>
                          </thead>
                          <tbody>
                            {blockedIPs.map((b) => (
                              <tr key={b.id} className={`border-b border-gray-100 hover:bg-gray-50 ${selectedIPs.has(b.ipAddress) ? 'bg-orange-50/50' : ''}`}>
                                <td className="py-2.5 px-2">
                                  <input
                                    type="checkbox"
                                    checked={selectedIPs.has(b.ipAddress)}
                                    onChange={() => toggleIPSelection(b.ipAddress)}
                                    className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                  />
                                </td>
                                <td className="py-2.5 px-3 font-mono text-slate-600">{b.ipAddress}</td>
                                <td className="py-2.5 px-3 text-slate-500">{b.reason}</td>
                                <td className="py-2.5 px-3">
                                  <span className={`text-xs px-2 py-0.5 rounded-full border ${b.autoBlocked ? 'bg-purple-100 text-purple-600 border-purple-300' : 'bg-gray-100 text-gray-500 border-gray-300'}`}>
                                    {b.autoBlocked ? 'Auto' : 'Manual'}
                                  </span>
                                </td>
                                <td className="py-2.5 px-3 text-slate-400">{new Date(b.createdAt).toLocaleDateString()}</td>
                                <td className="py-2.5 px-3 text-right">
                                  <button onClick={() => handleUnblockIP(b.id)} className="text-xs px-3 py-1 bg-green-100 hover:bg-green-200 text-green-600 rounded-lg transition-colors">
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

                  <AnimatePresence>
                    {showGAdsPushDialog && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
                        onClick={(e) => { if (e.target === e.currentTarget) setShowGAdsPushDialog(false); }}
                      >
                        <motion.div
                          initial={{ scale: 0.95, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.95, opacity: 0 }}
                          className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[85vh] overflow-y-auto"
                        >
                          <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center justify-between">
                              <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                                <ExternalLink className="w-5 h-5 text-orange-500" />
                                Push Blocked IPs to Google Ads
                              </h2>
                              <button onClick={() => setShowGAdsPushDialog(false)} className="p-1 hover:bg-gray-100 rounded-lg">
                                <X className="w-5 h-5 text-slate-400" />
                              </button>
                            </div>
                            <p className="text-sm text-slate-500 mt-1">
                              Add IP exclusions to your Google Ads campaigns to block fraudulent traffic.
                            </p>
                          </div>

                          <div className="p-6 space-y-5">
                            {!gAdsConnected ? (
                              <div className="text-center py-6">
                                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-3">
                                  <Globe className="w-6 h-6 text-orange-500" />
                                </div>
                                <h3 className="font-semibold text-slate-700 mb-2">Connect Google Ads</h3>
                                <p className="text-sm text-slate-500 mb-4">
                                  You need to connect your Google Ads account first. Go to Campaign Builder and connect via the Push to Google Ads feature.
                                </p>
                              </div>
                            ) : (
                              <>
                                <div>
                                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Google Ads Account</label>
                                  {gAdsAccounts.length > 0 ? (
                                    <select
                                      value={gAdsSelectedAccount}
                                      onChange={(e) => setGAdsSelectedAccount(e.target.value)}
                                      className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none"
                                    >
                                      <option value="">Select account</option>
                                      {gAdsAccounts.filter(a => !a.isManager).map(a => (
                                        <option key={a.id} value={a.id}>
                                          {a.name} ({a.id})
                                        </option>
                                      ))}
                                    </select>
                                  ) : (
                                    <p className="text-sm text-slate-400">No accounts found</p>
                                  )}
                                </div>

                                {gAdsSelectedAccount && (
                                  <div>
                                    <div className="flex items-center justify-between mb-1.5">
                                      <label className="text-xs font-semibold text-slate-600">Select Campaigns</label>
                                      {gAdsCampaigns.length > 0 && (
                                        <button
                                          onClick={toggleAllCampaigns}
                                          className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                                        >
                                          {gAdsSelectedCampaigns.size === gAdsCampaigns.length ? 'Deselect All' : 'Select All'}
                                        </button>
                                      )}
                                    </div>
                                    {gAdsCampaignsLoading ? (
                                      <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                                        <Loader2 className="w-4 h-4 animate-spin" /> Loading campaigns...
                                      </div>
                                    ) : gAdsCampaigns.length === 0 ? (
                                      <p className="text-sm text-slate-400 py-2">No active campaigns found in this account.</p>
                                    ) : (
                                      <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                                        {gAdsCampaigns.map(c => (
                                          <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                                            <input
                                              type="checkbox"
                                              checked={gAdsSelectedCampaigns.has(String(c.id))}
                                              onChange={() => toggleCampaignSelection(String(c.id))}
                                              className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                            />
                                            <div className="flex-1 min-w-0">
                                              <span className="text-sm text-slate-700 truncate block">{c.name}</span>
                                              <span className="text-xs text-slate-400">{c.status} &middot; {c.channelType}</span>
                                            </div>
                                          </label>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                                  <h4 className="text-xs font-semibold text-slate-600 mb-1">IPs to push</h4>
                                  <p className="text-sm text-slate-700">
                                    {selectedIPs.size > 0
                                      ? `${selectedIPs.size} selected IP${selectedIPs.size !== 1 ? 's' : ''}`
                                      : `All ${blockedIPs.length} blocked IP${blockedIPs.length !== 1 ? 's' : ''}`
                                    }
                                  </p>
                                  <div className="mt-2 max-h-20 overflow-y-auto text-xs font-mono text-slate-500 space-y-0.5">
                                    {(selectedIPs.size > 0 ? Array.from(selectedIPs) : blockedIPs.map(b => b.ipAddress)).slice(0, 10).map(ip => (
                                      <div key={ip}>{ip}</div>
                                    ))}
                                    {(selectedIPs.size > 0 ? selectedIPs.size : blockedIPs.length) > 10 && (
                                      <div className="text-slate-400">...and {(selectedIPs.size > 0 ? selectedIPs.size : blockedIPs.length) - 10} more</div>
                                    )}
                                  </div>
                                </div>

                                {gAdsPushResult && (
                                  <div className={`rounded-lg p-3 border text-sm ${gAdsPushResult.success ? 'bg-green-50 border-green-200 text-green-700' : gAdsPushResult.status === 'partial' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                    {gAdsPushResult.success ? (
                                      <div className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        <span>Successfully pushed {gAdsPushResult.totalIpsPushed} IP{gAdsPushResult.totalIpsPushed !== 1 ? 's' : ''} to {gAdsPushResult.totalCampaigns} campaign{gAdsPushResult.totalCampaigns !== 1 ? 's' : ''}</span>
                                      </div>
                                    ) : gAdsPushResult.status === 'partial' ? (
                                      <div className="flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        <span>Partially pushed. Some IPs may already be excluded.</span>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-2">
                                        <XCircle className="w-4 h-4" />
                                        <span>{gAdsPushResult.error || 'Failed to push IP exclusions'}</span>
                                      </div>
                                    )}
                                    {gAdsPushResult.pushedAt && (
                                      <div className="text-xs mt-1 opacity-75">
                                        Pushed at: {new Date(gAdsPushResult.pushedAt).toLocaleString()}
                                      </div>
                                    )}
                                  </div>
                                )}

                                <button
                                  onClick={handlePushIPsToGAds}
                                  disabled={gAdsPushing || gAdsSelectedCampaigns.size === 0 || blockedIPs.length === 0}
                                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
                                >
                                  {gAdsPushing ? (
                                    <>
                                      <Loader2 className="w-4 h-4 animate-spin" />
                                      Pushing to Google Ads...
                                    </>
                                  ) : (
                                    <>
                                      <ExternalLink className="w-4 h-4" />
                                      Push {selectedIPs.size > 0 ? selectedIPs.size : blockedIPs.length} IP{(selectedIPs.size > 0 ? selectedIPs.size : blockedIPs.length) !== 1 ? 's' : ''} to {gAdsSelectedCampaigns.size} Campaign{gAdsSelectedCampaigns.size !== 1 ? 's' : ''}
                                    </>
                                  )}
                                </button>
                              </>
                            )}
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" /> Recent Fraud Events
                    </h3>
                    {fraudEvents.length === 0 ? (
                      <p className="text-slate-400 text-sm">No fraud events detected</p>
                    ) : (
                      <div className="space-y-2">
                        {fraudEvents.map((ev) => (
                          <div key={ev.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <span className="text-sm font-medium text-slate-700">{ev.eventType}</span>
                            <span className={`text-xs px-2 py-0.5 rounded-full border ${threatColor(ev.severity)}`}>
                              {ev.severity}
                            </span>
                            <span className="font-mono text-xs text-slate-500">{ev.ip}</span>
                            <span className="text-xs text-slate-400 flex-1 truncate">{typeof ev.details === 'object' ? JSON.stringify(ev.details) : ev.details}</span>
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

          {activeTab === 'blockedips' && (
            <motion.div
              key="blockedips"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              transition={{ duration: 0.2 }}
            >
              {!selectedSiteId ? (
                <div className="bg-white border border-gray-200 rounded-xl p-8 text-center shadow-sm">
                  <Ban className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="font-semibold text-slate-700 mb-1">Select a Domain</h3>
                  <p className="text-sm text-slate-400">Choose a domain above to view and manage blocked IPs.</p>
                  <DomainSelector domains={domains} selectedId={selectedSiteId} onChange={setSelectedSiteId} />
                </div>
              ) : (
                <div className="space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-2">
                    <DomainSelector domains={domains} selectedId={selectedSiteId} onChange={setSelectedSiteId} />
                    <div className="flex items-center gap-2 ml-auto">
                      <button
                        onClick={() => fetchProtectionData(selectedSiteId)}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                      >
                        <RefreshCw className="w-3.5 h-3.5" />
                        Refresh
                      </button>
                      <button
                        onClick={async () => {
                          setExportingIPs(true);
                          try {
                            const headers = await authHeaders();
                            const res = await fetch(`${API_BASE}/export-blocked-ips/${selectedSiteId}?format=csv`, { headers });
                            if (res.ok) {
                              const blob = await res.blob();
                              const url = URL.createObjectURL(blob);
                              const a = document.createElement('a');
                              a.href = url;
                              a.download = `blocked-ips-${selectedSiteId}.csv`;
                              a.click();
                              URL.revokeObjectURL(url);
                            }
                          } catch (err: any) {
                            setError(err.message);
                          } finally {
                            setExportingIPs(false);
                          }
                        }}
                        disabled={exportingIPs || blockedIPs.length === 0}
                        className="flex items-center gap-1.5 px-3 py-2 text-sm text-slate-600 hover:text-slate-800 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Export CSV
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-indigo-500" />
                      Add IP to Block List
                    </h3>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        value={blockIP}
                        onChange={(e) => setBlockIP(e.target.value)}
                        placeholder="e.g. 192.168.1.100"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <input
                        type="text"
                        value={blockReason}
                        onChange={(e) => setBlockReason(e.target.value)}
                        placeholder="Reason (optional)"
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
                      />
                      <button
                        onClick={() => handleBlockIP()}
                        disabled={blocking || !blockIP.trim()}
                        className="flex items-center justify-center gap-1.5 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white text-sm font-medium rounded-lg hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 transition-all shadow-sm"
                      >
                        {blocking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                        Block IP
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <Ban className="w-4 h-4 text-red-500" />
                          Blocked IPs
                          {blockedIPs.length > 0 && (
                            <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{blockedIPs.length}</span>
                          )}
                        </h3>
                        {blockedIPs.length > 0 && (
                          <button
                            onClick={toggleAllIPs}
                            className="text-xs text-indigo-600 hover:text-indigo-800 font-medium"
                          >
                            {selectedIPs.size === blockedIPs.length ? 'Deselect All' : 'Select All'}
                          </button>
                        )}
                      </div>
                    </div>

                    {protectionLoading ? (
                      <div className="flex items-center justify-center gap-2 py-12 text-slate-400">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span className="text-sm">Loading blocked IPs...</span>
                      </div>
                    ) : blockedIPs.length === 0 ? (
                      <div className="py-12 text-center">
                        <Shield className="w-10 h-10 text-slate-200 mx-auto mb-2" />
                        <p className="text-sm text-slate-400">No blocked IPs yet</p>
                        <p className="text-xs text-slate-300 mt-1">Add IPs manually above or enable auto-blocking in the Protection tab.</p>
                      </div>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase w-10">
                                <input
                                  type="checkbox"
                                  checked={selectedIPs.size === blockedIPs.length && blockedIPs.length > 0}
                                  onChange={toggleAllIPs}
                                  className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                                />
                              </th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">IP Address</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Reason</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Type</th>
                              <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Blocked</th>
                              <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500 uppercase">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {blockedIPs.map((ip) => (
                              <tr key={ip.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-4 py-3">
                                  <input
                                    type="checkbox"
                                    checked={selectedIPs.has(ip.ipAddress)}
                                    onChange={() => toggleIPSelection(ip.ipAddress)}
                                    className="w-4 h-4 rounded border-gray-300 text-indigo-500 focus:ring-indigo-500"
                                  />
                                </td>
                                <td className="px-4 py-3 font-mono text-slate-800 font-medium">{ip.ipAddress}</td>
                                <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">{ip.reason || 'No reason'}</td>
                                <td className="px-4 py-3">
                                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${
                                    ip.autoBlocked
                                      ? 'bg-orange-50 text-orange-600 border-orange-200'
                                      : 'bg-blue-50 text-blue-600 border-blue-200'
                                  }`}>
                                    {ip.autoBlocked ? 'Auto' : 'Manual'}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs text-slate-400 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {new Date(ip.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-4 py-3 text-right">
                                  <button
                                    onClick={() => handleUnblockIP(ip.id)}
                                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-2 py-1 rounded transition-colors"
                                    title="Unblock IP"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>

                  {GOOGLE_ADS_ENABLED && (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                    <div className="p-5 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                          <ExternalLink className="w-4 h-4 text-orange-500" />
                          Sync to Google Ads
                        </h3>
                        {lastIpPush && (
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Last synced: {new Date(lastIpPush.pushedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        Push blocked IPs as exclusions to your Google Ads campaigns to prevent fraudulent clicks.
                      </p>
                    </div>

                    <div className="p-5 space-y-4">
                      {!gAdsConnected ? (
                        <div className="flex flex-col items-center text-center py-4">
                          <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3">
                            <Globe className="w-6 h-6 text-orange-500" />
                          </div>
                          <h4 className="font-semibold text-slate-700 mb-1">Connect Google Ads</h4>
                          <p className="text-xs text-slate-400 mb-4 max-w-xs">
                            Link your Google Ads account to automatically sync blocked IPs as campaign exclusions.
                          </p>
                          <div className="w-full max-w-xs space-y-2">
                            <input
                              type="text"
                              placeholder="Enter Customer ID (e.g. 123-456-7890)"
                              value={gAdsManualCustomerId || ''}
                              onChange={(e) => setGAdsManualCustomerId(e.target.value)}
                              className="w-full px-3 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-orange-500"
                            />
                            <button
                              onClick={async () => {
                                const cleaned = (gAdsManualCustomerId || '').replace(/[-\s]/g, '');
                                if (cleaned.length !== 10 || !/^\d+$/.test(cleaned)) {
                                  setError('Enter a valid 10-digit Customer ID');
                                  return;
                                }
                                try {
                                  const headers = await authHeaders();
                                  const res = await fetch('/api/google-ads/link-account', {
                                    method: 'POST',
                                    headers: { ...headers, 'Content-Type': 'application/json' },
                                    body: JSON.stringify({ customerId: cleaned }),
                                  });
                                  const data = await res.json();
                                  if (res.ok && data.success) {
                                    setGAdsConnected(true);
                                    await fetchGAdsStatus();
                                  } else {
                                    setError(data.error || 'Failed to link account');
                                  }
                                } catch (err) {
                                  setError('Failed to link Google Ads account');
                                }
                              }}
                              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-sm font-semibold rounded-lg hover:from-orange-600 hover:to-amber-600 transition-all shadow-sm w-full justify-center"
                            >
                              <Link className="w-4 h-4" />
                              Link Google Ads Account
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          <div className="flex items-center justify-between mb-1">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              <span className="text-sm font-medium text-green-700">Google Ads Connected</span>
                            </div>
                            <button
                              onClick={async () => {
                                try {
                                  const headers = await authHeaders();
                                  const res = await fetch('/api/google-ads/auth/disconnect', { method: 'POST', headers });
                                  if (res.ok) {
                                    setGAdsConnected(false);
                                    setGAdsAccounts([]);
                                    setGAdsSelectedAccount('');
                                    setGAdsCampaigns([]);
                                    setGAdsSelectedCampaigns(new Set());
                                  }
                                } catch (err) {
                                  setError('Failed to disconnect Google Ads');
                                }
                              }}
                              className="text-xs text-slate-400 hover:text-red-600 flex items-center gap-1 transition-colors"
                              title="Disconnect Google Ads"
                            >
                              <X className="w-3 h-3" />
                              Disconnect
                            </button>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Google Ads Account</label>
                            {gAdsAccounts.length > 0 ? (
                              <select
                                value={gAdsSelectedAccount}
                                onChange={(e) => setGAdsSelectedAccount(e.target.value)}
                                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm bg-gray-50 focus:ring-2 focus:ring-orange-500 outline-none"
                              >
                                <option value="">Select account</option>
                                {gAdsAccounts.filter(a => !a.isManager).map(a => (
                                  <option key={a.id} value={a.id}>
                                    {a.name} ({a.id.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')})
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <p className="text-sm text-slate-400">No accounts found. Your developer token may be in test mode.</p>
                            )}
                          </div>

                          {gAdsSelectedAccount && (
                            <div>
                              <div className="flex items-center justify-between mb-1.5">
                                <label className="text-xs font-semibold text-slate-600">Select Campaigns</label>
                                {gAdsCampaigns.length > 0 && (
                                  <button
                                    onClick={toggleAllCampaigns}
                                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                                  >
                                    {gAdsSelectedCampaigns.size === gAdsCampaigns.length ? 'Deselect All' : 'Select All'}
                                  </button>
                                )}
                              </div>
                              {gAdsCampaignsLoading ? (
                                <div className="flex items-center gap-2 text-sm text-slate-400 py-4">
                                  <Loader2 className="w-4 h-4 animate-spin" /> Loading campaigns...
                                </div>
                              ) : gAdsCampaigns.length === 0 ? (
                                <p className="text-sm text-slate-400 py-2">No active campaigns found in this account.</p>
                              ) : (
                                <div className="max-h-48 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                                  {gAdsCampaigns.map(c => (
                                    <label key={c.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 cursor-pointer">
                                      <input
                                        type="checkbox"
                                        checked={gAdsSelectedCampaigns.has(String(c.id))}
                                        onChange={() => toggleCampaignSelection(String(c.id))}
                                        className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-500"
                                      />
                                      <div className="flex-1 min-w-0">
                                        <span className="text-sm text-slate-700 truncate block">{c.name}</span>
                                        <span className="text-xs text-slate-400">{c.status} &middot; {c.channelType}</span>
                                      </div>
                                    </label>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}

                          <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-slate-600 mb-1">IPs to sync</h4>
                            <p className="text-sm text-slate-700">
                              {selectedIPs.size > 0
                                ? `${selectedIPs.size} selected IP${selectedIPs.size !== 1 ? 's' : ''}`
                                : `All ${blockedIPs.length} blocked IP${blockedIPs.length !== 1 ? 's' : ''}`
                              }
                            </p>
                          </div>

                          {gAdsPushResult && (
                            <div className={`rounded-lg p-3 border text-sm ${gAdsPushResult.success ? 'bg-green-50 border-green-200 text-green-700' : gAdsPushResult.status === 'partial' ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                              {gAdsPushResult.success ? (
                                <div className="flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  <span>Successfully synced {gAdsPushResult.totalIpsPushed} IP{gAdsPushResult.totalIpsPushed !== 1 ? 's' : ''} to {gAdsPushResult.totalCampaigns} campaign{gAdsPushResult.totalCampaigns !== 1 ? 's' : ''}</span>
                                </div>
                              ) : gAdsPushResult.status === 'partial' ? (
                                <div className="flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span>Partially synced. Some IPs may already be excluded.</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <XCircle className="w-4 h-4" />
                                  <span>{gAdsPushResult.error || 'Failed to sync IP exclusions'}</span>
                                </div>
                              )}
                            </div>
                          )}

                          <button
                            onClick={handlePushIPsToGAds}
                            disabled={gAdsPushing || gAdsSelectedCampaigns.size === 0 || blockedIPs.length === 0}
                            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
                          >
                            {gAdsPushing ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                Syncing to Google Ads...
                              </>
                            ) : (
                              <>
                                <ExternalLink className="w-4 h-4" />
                                Sync {selectedIPs.size > 0 ? selectedIPs.size : blockedIPs.length} IP{(selectedIPs.size > 0 ? selectedIPs.size : blockedIPs.length) !== 1 ? 's' : ''} to {gAdsSelectedCampaigns.size} Campaign{gAdsSelectedCampaigns.size !== 1 ? 's' : ''}
                              </>
                            )}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  )}
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
              <div className="flex gap-1 mb-3 bg-slate-100 rounded-lg p-1">
                <button
                  onClick={() => { setModalSnippetType('html'); setCopiedSnippet(false); }}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${modalSnippetType === 'html' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  HTML
                </button>
                <button
                  onClick={() => { setModalSnippetType('wordpress-plugin'); setCopiedSnippet(false); }}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${modalSnippetType === 'wordpress-plugin' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  WP Plugin
                </button>
                <button
                  onClick={() => { setModalSnippetType('wordpress-php'); setCopiedSnippet(false); }}
                  className={`flex-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${modalSnippetType === 'wordpress-php' ? 'bg-white text-indigo-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  WP PHP
                </button>
              </div>
              <p className="text-sm text-slate-500 mb-3">
                {modalSnippetType === 'html' && <>Add this snippet to <span className="text-indigo-600 font-medium">{snippetModal.domain}</span> before the closing <code className="text-xs bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded">&lt;/head&gt;</code> tag:</>}
                {modalSnippetType === 'wordpress-plugin' && <>Paste this in your WordPress header using a plugin like "Insert Headers and Footers" or "WPCode":</>}
                {modalSnippetType === 'wordpress-php' && <>Add this PHP code to your theme's functions.php or use a Code Snippets plugin:</>}
              </p>
              <div className="relative">
                <pre className={`bg-slate-800 border border-slate-700 rounded-lg p-4 text-green-400 overflow-x-auto whitespace-pre-wrap break-all font-mono ${modalSnippetType === 'wordpress-php' ? 'text-xs' : 'text-sm'}`}>
                  {getActiveModalSnippet()}
                </pre>
                <button
                  onClick={copySnippet}
                  className="absolute top-2 right-2 flex items-center gap-1.5 px-3 py-1.5 bg-slate-700 hover:bg-slate-600 rounded-lg text-xs text-slate-300 transition-colors"
                >
                  {copiedSnippet ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedSnippet ? 'Copied!' : 'Copy'}
                </button>
              </div>
              {modalSnippetType !== 'html' && (
                <p className="mt-2 text-xs text-amber-600">
                  If using a caching plugin (WP Rocket, W3 Total Cache), exclude this script from minification and combining.
                </p>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}