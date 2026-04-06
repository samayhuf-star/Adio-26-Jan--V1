import { useState, useEffect, useCallback } from 'react';
import {
  Search, Download, RefreshCw, Activity, AlertTriangle,
  Info, XCircle, Filter, User, Clock, Terminal, ChevronLeft, ChevronRight
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';

interface LogEntry {
  id: string;
  source: 'audit' | 'event';
  userId: string | null;
  action: string;
  resourceType: string | null;
  level: string;
  details: any;
  ipAddress: string | null;
  createdAt: string;
}

interface SystemLogsDashboardProps {
  token: string;
}

const LEVEL_STYLES: Record<string, { badge: string; icon: any }> = {
  error: { badge: 'bg-red-500/20 text-red-400 border-red-500/30', icon: XCircle },
  warning: { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertTriangle },
  warn: { badge: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30', icon: AlertTriangle },
  info: { badge: 'bg-blue-500/20 text-blue-400 border-blue-500/30', icon: Info },
};

const SOURCE_STYLES: Record<string, string> = {
  audit: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  event: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
};

function formatTs(ts: string) {
  if (!ts) return '—';
  const d = new Date(ts);
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hour12: false,
  });
}

function safeDetails(details: any): string {
  if (!details) return '';
  if (typeof details === 'string') return details;
  try { return JSON.stringify(details); } catch { return ''; }
}

export function SystemLogsDashboard({ token }: SystemLogsDashboardProps) {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'audit' | 'events'>('all');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const limit = 100;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
        source: sourceFilter,
        ...(search ? { search } : {}),
      });
      const res = await fetch(`/api/superadmin/system-logs?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Failed to fetch system logs', e);
    } finally {
      setLoading(false);
    }
  }, [token, page, search, sourceFilter]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearch = () => {
    setPage(1);
    setSearch(searchInput);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const exportCSV = () => {
    const header = ['Timestamp', 'Source', 'Level', 'User ID', 'Action', 'Resource Type', 'IP Address', 'Details'];
    const rows = logs.map(l => [
      formatTs(l.createdAt),
      l.source,
      l.level,
      l.userId || '',
      l.action,
      l.resourceType || '',
      l.ipAddress || '',
      safeDetails(l.details).replace(/"/g, '""'),
    ].map(v => `"${v}"`).join(','));
    const csv = [header.join(','), ...rows].join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-5 h-5 text-emerald-400" />
            System Logs
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Live server events — every action happening on the platform
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchLogs} variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:text-white">
            <RefreshCw className={`w-4 h-4 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={exportCSV} variant="outline" size="sm" className="border-slate-600 text-slate-300 hover:text-white">
            <Download className="w-4 h-4 mr-1.5" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events', value: total.toLocaleString(), color: 'text-white' },
          { label: 'On Screen', value: logs.length.toLocaleString(), color: 'text-blue-400' },
          { label: 'Errors', value: logs.filter(l => l.level === 'error').length, color: 'text-red-400' },
          { label: 'Warnings', value: logs.filter(l => l.level === 'warning' || l.level === 'warn').length, color: 'text-yellow-400' },
        ].map(s => (
          <div key={s.label} className="bg-slate-800 border border-white/10 rounded-xl p-4">
            <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-slate-400 text-xs mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex flex-1 min-w-[220px] gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <Input
              placeholder="Search actions, users, resources..."
              className="pl-9 bg-slate-800 border-white/10 text-slate-200 placeholder:text-slate-500"
              value={searchInput}
              onChange={e => setSearchInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
          </div>
          <Button onClick={handleSearch} size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white px-4">
            Search
          </Button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-slate-400" />
          {(['all', 'audit', 'events'] as const).map(s => (
            <button
              key={s}
              onClick={() => { setSourceFilter(s); setPage(1); }}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                sourceFilter === s
                  ? 'bg-emerald-600 border-emerald-600 text-white'
                  : 'bg-slate-800 border-white/10 text-slate-400 hover:text-slate-200'
              }`}
            >
              {s === 'all' ? 'All Sources' : s === 'audit' ? 'Audit Logs' : 'User Events'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-slate-900 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-slate-400">
              <RefreshCw className="w-5 h-5 animate-spin mr-3" />
              Loading logs...
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-slate-500">
              <Activity className="w-10 h-10 mb-3 opacity-40" />
              <p>No log entries found</p>
              {search && <p className="text-xs mt-1">Try clearing your search</p>}
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 bg-slate-800/60">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium whitespace-nowrap">
                    <Clock className="w-3.5 h-3.5 inline mr-1.5" />Timestamp
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Source</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Level</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">
                    <User className="w-3.5 h-3.5 inline mr-1.5" />User
                  </th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Action</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Resource</th>
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Details</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log, i) => {
                  const levelStyle = LEVEL_STYLES[log.level] || LEVEL_STYLES.info;
                  const LevelIcon = levelStyle.icon;
                  const isExpanded = expandedId === log.id;
                  const detailStr = safeDetails(log.details);

                  return (
                    <>
                      <tr
                        key={log.id}
                        className={`border-b border-white/5 transition-colors cursor-pointer ${
                          i % 2 === 0 ? 'bg-slate-900' : 'bg-slate-800/30'
                        } hover:bg-slate-700/40`}
                        onClick={() => setExpandedId(isExpanded ? null : log.id)}
                      >
                        <td className="px-4 py-2.5 text-slate-400 text-xs whitespace-nowrap font-mono">
                          {formatTs(log.createdAt)}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded border ${SOURCE_STYLES[log.source] || ''}`}>
                            {log.source}
                          </span>
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`text-xs px-2 py-0.5 rounded border flex items-center gap-1 w-fit ${levelStyle.badge}`}>
                            <LevelIcon className="w-3 h-3" />
                            {log.level}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs font-mono max-w-[140px] truncate">
                          {log.userId ? (
                            <span title={log.userId}>{log.userId.slice(0, 8)}…</span>
                          ) : (
                            <span className="text-slate-600">system</span>
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-slate-200 font-medium text-xs max-w-[200px] truncate">
                          {log.action}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400 text-xs max-w-[140px] truncate">
                          {log.resourceType || '—'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-500 text-xs max-w-[220px] truncate">
                          {detailStr ? (
                            <span title={detailStr}>{detailStr.slice(0, 60)}{detailStr.length > 60 ? '…' : ''}</span>
                          ) : '—'}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${log.id}-exp`} className="bg-slate-800/80 border-b border-white/5">
                          <td colSpan={7} className="px-6 py-3">
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                              <div>
                                <span className="text-slate-500">Full User ID</span>
                                <p className="text-slate-300 font-mono mt-0.5 break-all">{log.userId || 'system'}</p>
                              </div>
                              <div>
                                <span className="text-slate-500">IP Address</span>
                                <p className="text-slate-300 font-mono mt-0.5">{log.ipAddress || '—'}</p>
                              </div>
                              <div>
                                <span className="text-slate-500">Timestamp (UTC)</span>
                                <p className="text-slate-300 font-mono mt-0.5">{log.createdAt}</p>
                              </div>
                            </div>
                            {detailStr && (
                              <div className="mt-3">
                                <span className="text-slate-500 text-xs">Full Details</span>
                                <pre className="mt-1 text-xs text-emerald-300 bg-slate-900 p-3 rounded-lg overflow-x-auto whitespace-pre-wrap break-all border border-white/5">
                                  {typeof log.details === 'object'
                                    ? JSON.stringify(log.details, null, 2)
                                    : detailStr}
                                </pre>
                              </div>
                            )}
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between text-slate-400 text-sm">
          <span>Page {page} of {totalPages} · {total.toLocaleString()} total events</span>
          <div className="flex gap-2">
            <Button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:text-white disabled:opacity-30"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:text-white disabled:opacity-30"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
