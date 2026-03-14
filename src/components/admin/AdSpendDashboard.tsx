import { useState, useEffect, useCallback } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend
} from 'recharts';
import {
  RefreshCw, Plus, Trash2, CheckCircle, AlertCircle, Link, X,
  TrendingUp, DollarSign, Eye, MousePointer, Target, ChevronDown, ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../ui/dialog';

// ─── Platform Config ──────────────────────────────────────────────────────────

const PLATFORMS: Record<string, {
  name: string;
  color: string;
  icon: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  docsUrl: string;
}> = {
  google: {
    name: 'Google Ads',
    color: '#4285F4',
    icon: 'G',
    docsUrl: 'https://developers.google.com/google-ads/api/docs/first-call/overview',
    fields: [
      { key: 'developer_token', label: 'Developer Token', placeholder: 'ABcd_efgh...' },
      { key: 'client_id', label: 'OAuth Client ID', placeholder: '123...apps.googleusercontent.com' },
      { key: 'client_secret', label: 'OAuth Client Secret', placeholder: 'GOCSPX-...' },
      { key: 'refresh_token', label: 'Refresh Token', placeholder: '1//0g...' },
      { key: 'customer_id', label: 'Manager (MCC) Customer ID', placeholder: '123-456-7890' },
      { key: 'login_customer_id', label: 'Login Customer ID (optional)', placeholder: '123-456-7890' },
    ],
  },
  meta: {
    name: 'Meta (Facebook & Instagram)',
    color: '#1877F2',
    icon: 'M',
    docsUrl: 'https://developers.facebook.com/docs/marketing-api/insights',
    fields: [
      { key: 'access_token', label: 'System User Access Token', placeholder: 'EAAg...' },
      { key: 'account_id', label: 'Ad Account ID', placeholder: '123456789 or act_123456789' },
    ],
  },
  linkedin: {
    name: 'LinkedIn',
    color: '#0A66C2',
    icon: 'in',
    docsUrl: 'https://learn.microsoft.com/en-us/linkedin/marketing/integrations/ads-reporting/',
    fields: [
      { key: 'access_token', label: 'OAuth Access Token', placeholder: 'AQV...' },
      { key: 'account_id', label: 'Sponsored Account ID', placeholder: '123456789' },
    ],
  },
  twitter: {
    name: 'Twitter / X Ads',
    color: '#000000',
    icon: 'X',
    docsUrl: 'https://developer.twitter.com/en/docs/twitter-ads-api',
    fields: [
      { key: 'consumer_key', label: 'Consumer Key (API Key)', placeholder: '...' },
      { key: 'consumer_secret', label: 'Consumer Secret', placeholder: '...' },
      { key: 'access_token', label: 'Access Token', placeholder: '...' },
      { key: 'access_token_secret', label: 'Access Token Secret', placeholder: '...' },
      { key: 'account_id', label: 'Ads Account ID', placeholder: 'abc123def' },
    ],
  },
  taboola: {
    name: 'Taboola',
    color: '#00A4DC',
    icon: 'T',
    docsUrl: 'https://developers.taboola.com/backstage-api/',
    fields: [
      { key: 'client_id', label: 'Backstage Client ID', placeholder: '...' },
      { key: 'client_secret', label: 'Backstage Client Secret', placeholder: '...' },
      { key: 'account_id', label: 'Account ID (network name)', placeholder: 'my-network' },
    ],
  },
  reddit: {
    name: 'Reddit Ads',
    color: '#FF4500',
    icon: 'R',
    docsUrl: 'https://ads-api.reddit.com/docs/',
    fields: [
      { key: 'client_id', label: 'App Client ID', placeholder: '...' },
      { key: 'client_secret', label: 'App Secret', placeholder: '...' },
      { key: 'refresh_token', label: 'Refresh Token', placeholder: '...' },
      { key: 'account_id', label: 'Account ID', placeholder: 'abc123' },
    ],
  },
};

const DATE_PRESETS = [
  { label: 'Last 7 days', days: 7 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface PlatformConnection {
  id: string;
  platform: string;
  accountId: string | null;
  accountName: string | null;
  status: 'connected' | 'error' | 'disconnected';
  lastError: string | null;
  lastSynced: string | null;
}

interface CampaignRow {
  campaign: string;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
}

interface PlatformInsights {
  platform: string;
  accountName: string | null;
  spend: number;
  impressions: number;
  clicks: number;
  conversions: number;
  campaigns: CampaignRow[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt$(v: number) {
  return '$' + v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtN(v: number) {
  return v >= 1_000_000 ? (v / 1_000_000).toFixed(1) + 'M'
    : v >= 1_000 ? (v / 1_000).toFixed(1) + 'K'
    : String(v);
}
function fmtPct(n: number, d: number) {
  return d > 0 ? ((n / d) * 100).toFixed(2) + '%' : '—';
}
function datesBefore(days: number) {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - days);
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  };
}

const PLATFORM_COLORS = Object.fromEntries(
  Object.entries(PLATFORMS).map(([k, v]) => [k, v.color])
);

// ─── Component ────────────────────────────────────────────────────────────────

export function AdSpendDashboard({ token }: { token: string }) {
  const [connections, setConnections] = useState<PlatformConnection[]>([]);
  const [insights, setInsights] = useState<PlatformInsights[]>([]);
  const [loadingConnections, setLoadingConnections] = useState(true);
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [credFields, setCredFields] = useState<Record<string, string>>({});
  const [accountName, setAccountName] = useState('');
  const [saving, setSaving] = useState(false);
  const [datePreset, setDatePreset] = useState(30);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);
  const [fetchErrors, setFetchErrors] = useState<Record<string, string>>({});

  const adminFetch = (url: string, opts: RequestInit = {}) =>
    fetch(url, {
      ...opts,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(opts.headers || {}),
      },
    });

  const loadConnections = useCallback(async () => {
    setLoadingConnections(true);
    try {
      const res = await adminFetch('/api/superadmin/ad-platforms');
      if (res.ok) {
        const data = await res.json();
        setConnections(data.connections || []);
      }
    } finally {
      setLoadingConnections(false);
    }
  }, [token]);

  const fetchAllInsights = useCallback(async (days = datePreset) => {
    const connected = connections.filter(c => c.status === 'connected');
    if (connected.length === 0) return;
    setLoadingInsights(true);
    setFetchErrors({});
    try {
      const { from, to } = datesBefore(days);
      const res = await adminFetch('/api/superadmin/ad-platforms/fetch-all', {
        method: 'POST',
        body: JSON.stringify({ from, to }),
      });
      if (res.ok) {
        const data = await res.json();
        setInsights(data.platforms || []);
        const errs: Record<string, string> = {};
        for (const e of (data.errors || [])) errs[e.platform] = e.error;
        setFetchErrors(errs);
      }
    } finally {
      setLoadingInsights(false);
    }
  }, [connections, datePreset, token]);

  useEffect(() => { loadConnections(); }, []);
  useEffect(() => {
    if (connections.some(c => c.status === 'connected')) fetchAllInsights(datePreset);
  }, [connections]);

  const saveConnection = async () => {
    if (!connectingPlatform) return;
    setSaving(true);
    try {
      const res = await adminFetch('/api/superadmin/ad-platforms', {
        method: 'POST',
        body: JSON.stringify({
          platform: connectingPlatform,
          accountName: accountName || PLATFORMS[connectingPlatform]?.name,
          credentials: credFields,
        }),
      });
      if (res.ok) {
        setConnectingPlatform(null);
        setCredFields({});
        setAccountName('');
        await loadConnections();
      } else {
        const err = await res.json();
        alert(err.error || 'Failed to save');
      }
    } finally {
      setSaving(false);
    }
  };

  const disconnect = async (platform: string) => {
    if (!confirm(`Disconnect ${PLATFORMS[platform]?.name}? Your credentials will be deleted.`)) return;
    await adminFetch(`/api/superadmin/ad-platforms/${platform}`, { method: 'DELETE' });
    setInsights(prev => prev.filter(i => i.platform !== platform));
    await loadConnections();
  };

  const openConnect = (platform: string) => {
    setConnectingPlatform(platform);
    setCredFields({});
    setAccountName('');
  };

  // ─── Aggregate totals ────────────────────────────────────────────────────────

  const totals = insights.reduce(
    (acc, p) => ({
      spend: acc.spend + p.spend,
      impressions: acc.impressions + p.impressions,
      clicks: acc.clicks + p.clicks,
      conversions: acc.conversions + p.conversions,
    }),
    { spend: 0, impressions: 0, clicks: 0, conversions: 0 }
  );

  const chartData = insights
    .filter(p => p.spend > 0)
    .map(p => ({
      name: PLATFORMS[p.platform]?.name?.split(' ')[0] || p.platform,
      platform: p.platform,
      spend: parseFloat(p.spend.toFixed(2)),
      clicks: p.clicks,
      conversions: p.conversions,
    }))
    .sort((a, b) => b.spend - a.spend);

  const connectedPlatforms = connections.filter(c => c.status === 'connected');
  const platformKeys = Object.keys(PLATFORMS);

  return (
    <div className="space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Ad Spend Intelligence</h2>
          <p className="text-sm text-slate-400 mt-0.5">Connect your ad platforms to see unified spend & conversions</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Date range */}
          <div className="flex gap-1">
            {DATE_PRESETS.map(p => (
              <Button
                key={p.days}
                size="sm"
                variant={datePreset === p.days ? 'default' : 'outline'}
                onClick={() => { setDatePreset(p.days); fetchAllInsights(p.days); }}
                className={datePreset === p.days
                  ? 'bg-blue-600 text-white text-xs'
                  : 'border-slate-600 text-slate-400 text-xs hover:bg-slate-700'}
              >
                {p.label}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={() => fetchAllInsights(datePreset)}
            disabled={loadingInsights || connectedPlatforms.length === 0}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loadingInsights ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* Summary stat cards */}
      {connectedPlatforms.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Spend', value: fmt$(totals.spend), icon: <DollarSign className="w-5 h-5" />, color: 'text-emerald-400' },
            { label: 'Impressions', value: fmtN(totals.impressions), icon: <Eye className="w-5 h-5" />, color: 'text-blue-400' },
            { label: 'Clicks', value: fmtN(totals.clicks), icon: <MousePointer className="w-5 h-5" />, color: 'text-purple-400' },
            { label: 'Conversions', value: fmtN(totals.conversions), icon: <Target className="w-5 h-5" />, color: 'text-orange-400' },
          ].map(card => (
            <div key={card.label} className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">{card.label}</span>
                <span className={card.color}>{card.icon}</span>
              </div>
              <div className={`text-2xl font-bold ${card.color}`}>
                {loadingInsights ? <span className="text-slate-500 text-base">Loading…</span> : card.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Bar chart: spend by platform */}
      {chartData.length > 0 && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Spend by Platform
          </h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 4, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="name" tick={{ fill: '#94a3b8', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} axisLine={false} tickLine={false}
                tickFormatter={v => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
              <Tooltip
                contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8, color: '#f1f5f9' }}
                formatter={(v: any, name: string) => [name === 'spend' ? fmt$(v) : fmtN(v), name === 'spend' ? 'Spend' : 'Clicks']}
              />
              <Legend formatter={(v: string) => <span style={{ color: '#94a3b8', fontSize: 12 }}>{v === 'spend' ? 'Spend ($)' : 'Clicks'}</span>} />
              <Bar dataKey="spend" name="spend" radius={[4, 4, 0, 0]}>
                {chartData.map((entry) => (
                  <Cell key={entry.platform} fill={PLATFORM_COLORS[entry.platform] || '#6366f1'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Per-platform cards */}
      <div className="space-y-3">
        {/* Connected platforms with data */}
        {insights.map(insight => {
          const cfg = PLATFORMS[insight.platform];
          const ctr = fmtPct(insight.clicks, insight.impressions);
          const cpa = insight.conversions > 0 ? fmt$(insight.spend / insight.conversions) : '—';
          const cpc = insight.clicks > 0 ? fmt$(insight.spend / insight.clicks) : '—';
          const isExpanded = expandedPlatform === insight.platform;

          return (
            <div key={insight.platform} className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              {/* Platform header */}
              <div
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-700/30 transition-colors"
                onClick={() => setExpandedPlatform(isExpanded ? null : insight.platform)}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                  style={{ backgroundColor: cfg?.color || '#6366f1' }}
                >
                  {cfg?.icon || insight.platform[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">{cfg?.name || insight.platform}</span>
                    <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30 text-[10px]">Connected</Badge>
                  </div>
                  {insight.accountName && (
                    <p className="text-xs text-slate-500">{insight.accountName}</p>
                  )}
                </div>
                {/* KPIs inline */}
                <div className="hidden md:flex items-center gap-6 text-right">
                  <div>
                    <p className="text-xs text-slate-500">Spend</p>
                    <p className="text-sm font-bold text-emerald-400">{fmt$(insight.spend)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Impressions</p>
                    <p className="text-sm font-semibold text-blue-400">{fmtN(insight.impressions)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Clicks</p>
                    <p className="text-sm font-semibold text-purple-400">{fmtN(insight.clicks)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">CTR</p>
                    <p className="text-sm font-semibold text-slate-300">{ctr}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">Conversions</p>
                    <p className="text-sm font-semibold text-orange-400">{fmtN(insight.conversions)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">CPA</p>
                    <p className="text-sm font-semibold text-slate-300">{cpa}</p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-500">CPC</p>
                    <p className="text-sm font-semibold text-slate-300">{cpc}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-3">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={(e) => { e.stopPropagation(); disconnect(insight.platform); }}
                    className="text-slate-500 hover:text-red-400 hover:bg-red-500/10 h-7 px-2"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                  {isExpanded ? <ChevronDown className="w-4 h-4 text-slate-400" /> : <ChevronRight className="w-4 h-4 text-slate-400" />}
                </div>
              </div>

              {/* Campaign drill-down */}
              {isExpanded && insight.campaigns.length > 0 && (
                <div className="border-t border-slate-700/50 overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-700/30">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-slate-400 font-medium">Campaign</th>
                        <th className="text-right px-4 py-2.5 text-slate-400 font-medium">Spend</th>
                        <th className="text-right px-4 py-2.5 text-slate-400 font-medium">Impressions</th>
                        <th className="text-right px-4 py-2.5 text-slate-400 font-medium">Clicks</th>
                        <th className="text-right px-4 py-2.5 text-slate-400 font-medium">CTR</th>
                        <th className="text-right px-4 py-2.5 text-slate-400 font-medium">CPC</th>
                        <th className="text-right px-4 py-2.5 text-slate-400 font-medium">Conversions</th>
                        <th className="text-right px-4 py-2.5 text-slate-400 font-medium">CPA</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-700/30">
                      {insight.campaigns
                        .sort((a, b) => b.spend - a.spend)
                        .map((c, i) => (
                          <tr key={i} className="hover:bg-slate-700/20">
                            <td className="px-4 py-2.5 text-slate-300 max-w-xs truncate">{c.campaign}</td>
                            <td className="px-4 py-2.5 text-right text-emerald-400 font-medium">{fmt$(c.spend)}</td>
                            <td className="px-4 py-2.5 text-right text-slate-400">{fmtN(c.impressions)}</td>
                            <td className="px-4 py-2.5 text-right text-slate-400">{fmtN(c.clicks)}</td>
                            <td className="px-4 py-2.5 text-right text-slate-400">{fmtPct(c.clicks, c.impressions)}</td>
                            <td className="px-4 py-2.5 text-right text-slate-400">{c.clicks > 0 ? fmt$(c.spend / c.clicks) : '—'}</td>
                            <td className="px-4 py-2.5 text-right text-orange-400">{fmtN(c.conversions)}</td>
                            <td className="px-4 py-2.5 text-right text-slate-400">{c.conversions > 0 ? fmt$(c.spend / c.conversions) : '—'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}
              {isExpanded && insight.campaigns.length === 0 && (
                <p className="px-4 py-3 text-sm text-slate-500 border-t border-slate-700/50">No campaign data for this period.</p>
              )}
            </div>
          );
        })}

        {/* Fetch errors */}
        {Object.entries(fetchErrors).map(([platform, error]) => (
          <div key={platform} className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-red-400">{PLATFORMS[platform]?.name || platform} — fetch failed</p>
              <p className="text-xs text-red-400/70 mt-0.5">{error}</p>
              <p className="text-xs text-slate-500 mt-1">Check your credentials and make sure the API is enabled for your account.</p>
            </div>
          </div>
        ))}

        {/* Disconnected / not yet connected platforms */}
        <div className="bg-slate-800/30 border border-slate-700/30 rounded-xl p-5">
          <h3 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
            <Plus className="w-4 h-4" />
            Connect a Platform
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {platformKeys.map(platform => {
              const cfg = PLATFORMS[platform];
              const conn = connections.find(c => c.platform === platform);
              const isConnected = conn?.status === 'connected';
              const hasError = conn?.status === 'error';

              return (
                <button
                  key={platform}
                  onClick={() => isConnected ? disconnect(platform) : openConnect(platform)}
                  className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border transition-all group
                    ${isConnected
                      ? 'border-emerald-500/40 bg-emerald-500/5 hover:bg-red-500/10 hover:border-red-500/30'
                      : hasError
                        ? 'border-red-500/40 bg-red-500/5 hover:bg-slate-700/40'
                        : 'border-slate-700/50 bg-slate-800/30 hover:bg-slate-700/40 hover:border-slate-600'
                    }`}
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-lg"
                    style={{ backgroundColor: cfg.color }}
                  >
                    {cfg.icon}
                  </div>
                  <span className="text-xs text-slate-300 text-center leading-tight font-medium">
                    {cfg.name.split(' ')[0]}
                  </span>
                  {isConnected && (
                    <span className="absolute top-2 right-2">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                    </span>
                  )}
                  {hasError && (
                    <span className="absolute top-2 right-2">
                      <AlertCircle className="w-3.5 h-3.5 text-red-400" />
                    </span>
                  )}
                  {!isConnected && (
                    <span className="text-[10px] text-slate-500 group-hover:text-slate-400">
                      {hasError ? 'Error — reconnect' : '+ Connect'}
                    </span>
                  )}
                  {isConnected && (
                    <span className="text-[10px] text-emerald-400 group-hover:text-red-400">
                      <span className="group-hover:hidden">Connected</span>
                      <span className="hidden group-hover:inline">Disconnect</span>
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Connect modal */}
      <Dialog open={!!connectingPlatform} onOpenChange={(open) => !open && setConnectingPlatform(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {connectingPlatform && (
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-xs"
                  style={{ backgroundColor: PLATFORMS[connectingPlatform]?.color }}
                >
                  {PLATFORMS[connectingPlatform]?.icon}
                </div>
              )}
              Connect {connectingPlatform ? PLATFORMS[connectingPlatform]?.name : ''}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              Enter your API credentials. They are stored securely and only used for reporting.{' '}
              {connectingPlatform && (
                <a
                  href={PLATFORMS[connectingPlatform]?.docsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:underline"
                >
                  View API docs →
                </a>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 max-h-[55vh] overflow-y-auto pr-1">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-400">Account Label (optional)</label>
              <Input
                value={accountName}
                onChange={e => setAccountName(e.target.value)}
                placeholder="e.g. Main Brand Account"
                className="bg-slate-700/50 border-slate-600 text-white text-sm"
              />
            </div>
            {connectingPlatform && PLATFORMS[connectingPlatform]?.fields.map(field => (
              <div key={field.key} className="space-y-1">
                <label className="text-xs font-medium text-slate-400">{field.label}</label>
                <Input
                  value={credFields[field.key] || ''}
                  onChange={e => setCredFields(prev => ({ ...prev, [field.key]: e.target.value }))}
                  placeholder={field.placeholder}
                  type={field.key.includes('secret') || field.key.includes('token') ? 'password' : 'text'}
                  className="bg-slate-700/50 border-slate-600 text-white text-sm font-mono"
                />
              </div>
            ))}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setConnectingPlatform(null)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={saveConnection}
              disabled={saving}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {saving ? <><RefreshCw className="w-4 h-4 mr-2 animate-spin" />Saving…</> : <><Link className="w-4 h-4 mr-2" />Connect</>}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
