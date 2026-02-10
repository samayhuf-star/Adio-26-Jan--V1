import { useState, useEffect, useCallback, useRef } from 'react';
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

  const [protectionRules, setProtectionRules] = useState<ProtectionRules>(DEFAULT_RULES);
  const [rulesSaving, setRulesSaving] = useState(false);
  const [rulesDirty, setRulesDirty] = useState(false);
  const [newWhitelistIP, setNewWhitelistIP] = useState('');
  const [newBlacklistIP, setNewBlacklistIP] = useState('');
  const [exportingIPs, setExportingIPs] = useState(false);

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
    if (activeTab === 'protection' && selectedSiteId) {
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
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Lock className="w-4 h-4" /> Blocked IPs ({blockedIPs.length})
                      </h3>
                      {blockedIPs.length > 0 && (
                        <div className="flex items-center gap-2">
                          <button onClick={copyBlockedIPsToClipboard} className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg text-xs font-medium transition-colors">
                            <Copy className="w-3.5 h-3.5" /> Copy All
                          </button>
                          <button onClick={() => handleExportBlockedIPs('googleads')} disabled={exportingIPs} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                            <Download className="w-3.5 h-3.5" /> Google Ads Format
                          </button>
                          <button onClick={() => handleExportBlockedIPs('csv')} disabled={exportingIPs} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-100 hover:bg-green-200 text-green-700 rounded-lg text-xs font-medium transition-colors disabled:opacity-50">
                            <Download className="w-3.5 h-3.5" /> Export CSV
                          </button>
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