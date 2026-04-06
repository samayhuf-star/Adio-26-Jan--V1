import { useState, useEffect } from 'react';
import { Download, RefreshCw, Search, Mail, Globe, Monitor, Clock, Filter, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface Lead {
  id: string;
  email: string;
  source: string;
  page: string | null;
  referrer: string | null;
  userAgent: string | null;
  ipAddress: string | null;
  metadata: Record<string, unknown> | null;
  converted: boolean;
  createdAt: string;
}

interface LeadsDashboardProps {
  token: string;
}

const SOURCE_COLORS: Record<string, string> = {
  'signup-email-step': 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  'signup': 'bg-violet-500/20 text-violet-300 border-violet-500/30',
  'lifetime_deal': 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  'unknown': 'bg-slate-500/20 text-slate-400 border-slate-500/30',
};

function sourceColor(source: string) {
  return SOURCE_COLORS[source] || 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30';
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function parseUA(ua: string | null) {
  if (!ua) return 'Unknown';
  if (/iPhone|iPad/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh/i.test(ua)) return 'macOS';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

function parseBrowser(ua: string | null) {
  if (!ua) return 'Unknown';
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/OPR\//i.test(ua)) return 'Opera';
  if (/Firefox\//i.test(ua)) return 'Firefox';
  if (/Safari\//i.test(ua) && !/Chrome/i.test(ua)) return 'Safari';
  if (/Chrome\//i.test(ua)) return 'Chrome';
  return 'Other';
}

export function LeadsDashboard({ token }: LeadsDashboardProps) {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const adminFetch = (url: string) =>
    fetch(url, { headers: { Authorization: `Bearer ${token}` } });

  const fetchLeads = async () => {
    try {
      const res = await adminFetch('/api/superadmin/leads');
      if (res.ok) {
        const data = await res.json();
        setLeads(data.leads || []);
      }
    } catch (e) {
      console.error('Failed to fetch leads', e);
    }
  };

  useEffect(() => {
    fetchLeads().finally(() => setLoading(false));
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeads();
    setRefreshing(false);
  };

  const sources = ['all', ...Array.from(new Set(leads.map((l) => l.source)))];

  const filtered = leads.filter((l) => {
    const q = search.toLowerCase();
    const matchesSearch =
      !q ||
      l.email.includes(q) ||
      (l.ipAddress || '').includes(q) ||
      (l.page || '').includes(q) ||
      l.source.includes(q);
    const matchesSource = sourceFilter === 'all' || l.source === sourceFilter;
    return matchesSearch && matchesSource;
  });

  const exportCsv = () => {
    const rows = [
      ['Email', 'Source', 'IP Address', 'Page', 'Referrer', 'OS', 'Browser', 'UTMs', 'Variant', 'Date'],
      ...filtered.map((l) => {
        const meta = l.metadata || {};
        const utms = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
          .map((k) => (meta[k] ? `${k}=${meta[k]}` : ''))
          .filter(Boolean)
          .join('&');
        return [
          l.email,
          l.source,
          l.ipAddress || '',
          l.page || '',
          l.referrer || '',
          parseUA(l.userAgent),
          parseBrowser(l.userAgent),
          utms,
          (meta.variant as string) || '',
          formatDate(l.createdAt),
        ];
      }),
    ];
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `adiology-leads-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400">
        <RefreshCw className="w-5 h-5 animate-spin mr-2" />
        Loading leads…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Email Leads</h2>
          <p className="text-slate-400 text-sm mt-0.5">
            {leads.length} total captured · {filtered.length} shown
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={refreshing}
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-1.5 ${refreshing ? 'animate-spin' : ''}`} />
            {refreshing ? 'Refreshing…' : 'Refresh'}
          </Button>
          <Button
            size="sm"
            onClick={exportCsv}
            className="bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search email, IP, page…"
            className="pl-9 bg-slate-800 border-slate-700 text-slate-200 placeholder:text-slate-500"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
              <X className="w-3.5 h-3.5 text-slate-400 hover:text-white" />
            </button>
          )}
        </div>
        <div className="flex gap-1.5 flex-wrap">
          {sources.map((s) => (
            <button
              key={s}
              onClick={() => setSourceFilter(s)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                sourceFilter === s
                  ? 'bg-red-600 text-white border-red-600'
                  : 'border-slate-600 text-slate-400 hover:border-slate-400 hover:text-slate-200'
              }`}
            >
              {s === 'all' ? 'All sources' : s}
            </button>
          ))}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: leads.length, icon: Mail },
          { label: 'Signup step', value: leads.filter((l) => l.source === 'signup-email-step').length, icon: Filter },
          { label: 'LTD page', value: leads.filter((l) => l.source === 'lifetime_deal').length, icon: Globe },
          { label: 'Converted', value: leads.filter((l) => l.converted).length, icon: Monitor },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-slate-800 border border-slate-700 rounded-xl p-4">
            <div className="flex items-center gap-2 text-slate-400 text-xs mb-1">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
          </div>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-slate-400">No leads match your filters.</div>
      ) : (
        <div className="bg-slate-800 border border-slate-700 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-400 text-xs uppercase tracking-wider">
                  <th className="text-left px-4 py-3">Email</th>
                  <th className="text-left px-4 py-3">Source</th>
                  <th className="text-left px-4 py-3">IP Address</th>
                  <th className="text-left px-4 py-3">OS / Browser</th>
                  <th className="text-left px-4 py-3">Page</th>
                  <th className="text-left px-4 py-3">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => {
                  const meta = lead.metadata || {};
                  const utms = ['utm_source', 'utm_medium', 'utm_campaign']
                    .map((k) => (meta[k] ? String(meta[k]) : ''))
                    .filter(Boolean);
                  const isExpanded = expandedId === lead.id;
                  return (
                    <>
                      <tr
                        key={lead.id}
                        onClick={() => setExpandedId(isExpanded ? null : lead.id)}
                        className="border-b border-slate-700/50 hover:bg-slate-700/40 cursor-pointer transition-colors"
                      >
                        <td className="px-4 py-3 text-white font-medium">{lead.email}</td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${sourceColor(lead.source)}`}>
                            {lead.source}
                            {meta.variant ? ` · ${meta.variant}` : ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-300 font-mono text-xs">
                          {lead.ipAddress || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                          {parseUA(lead.userAgent)} / {parseBrowser(lead.userAgent)}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs max-w-[140px] truncate" title={lead.page || ''}>
                          {lead.page || '—'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDate(lead.createdAt)}
                          </div>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${lead.id}-detail`} className="border-b border-slate-700 bg-slate-900/50">
                          <td colSpan={6} className="px-4 py-4">
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
                              <div>
                                <div className="text-slate-500 mb-1 font-medium uppercase tracking-wider">Referrer</div>
                                <div className="text-slate-300 break-all">{lead.referrer || '—'}</div>
                              </div>
                              <div>
                                <div className="text-slate-500 mb-1 font-medium uppercase tracking-wider">Full User Agent</div>
                                <div className="text-slate-300 break-all">{lead.userAgent || '—'}</div>
                              </div>
                              {utms.length > 0 && (
                                <div>
                                  <div className="text-slate-500 mb-1 font-medium uppercase tracking-wider">UTM Params</div>
                                  <div className="text-slate-300 space-y-0.5">
                                    {['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].map((k) =>
                                      meta[k] ? (
                                        <div key={k}>
                                          <span className="text-slate-500">{k}:</span> {String(meta[k])}
                                        </div>
                                      ) : null
                                    )}
                                  </div>
                                </div>
                              )}
                              {(meta.screenWidth || meta.language || meta.timezone) && (
                                <div>
                                  <div className="text-slate-500 mb-1 font-medium uppercase tracking-wider">Device / Browser Info</div>
                                  <div className="text-slate-300 space-y-0.5">
                                    {meta.screenWidth && (
                                      <div>Screen: {String(meta.screenWidth)}×{String(meta.screenHeight)}</div>
                                    )}
                                    {meta.language && <div>Language: {String(meta.language)}</div>}
                                    {meta.timezone && <div>Timezone: {String(meta.timezone)}</div>}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
