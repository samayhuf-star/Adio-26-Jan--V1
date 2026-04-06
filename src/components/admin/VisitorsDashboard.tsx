import React, { useState, useEffect, useCallback } from 'react';
import { Monitor, Smartphone, Tablet, Globe, Clock, RefreshCw, ChevronDown, ChevronRight, MapPin, Wifi, User, ExternalLink, Shield, ShieldOff, X, ChevronUp } from 'lucide-react';

interface VisitorSession {
  sessionId: string;
  ip: string;
  country: string | null;
  city: string | null;
  region: string | null;
  isp: string | null;
  org: string | null;
  deviceType: string;
  browser: string;
  os: string;
  screenWidth: number | null;
  screenHeight: number | null;
  referrer: string | null;
  firstSeen: string;
  lastSeen: string;
  pageCount: number;
  pagesVisited: string[];
  capturedEmail: string | null;
  registeredEmail: string | null;
  converted: boolean;
  durationSeconds: number;
}

interface BlockedIp {
  ip: string;
  reason: string | null;
  blocked_by: string | null;
  created_at: string;
}

interface Summary {
  uniqueSessions: number;
  totalPageViews: number;
  mobileSessions: number;
  desktopSessions: number;
  tabletSessions: number;
  uniqueCountries: number;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface TopCountry {
  country: string;
  sessions: number;
}

interface VisitorsData {
  sessions: VisitorSession[];
  pagination: Pagination;
  summary: Summary;
  topCountries: TopCountry[];
}

const DAYS_OPTIONS = [
  { label: 'Today', value: 'today' },
  { label: 'Last 7 days', value: '7' },
  { label: 'Last 30 days', value: '30' },
  { label: 'Last 90 days', value: '90' },
  { label: 'All time', value: 'all' },
];

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '< 30s';
  if (seconds < 60) return `${seconds}s`;
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins < 60) return `${mins}m ${secs}s`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

function formatDateTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
      hour12: false,
    });
  } catch {
    return dateStr;
  }
}

function DeviceIcon({ deviceType }: { deviceType: string }) {
  if (deviceType === 'mobile') return <Smartphone size={14} className="text-blue-400" />;
  if (deviceType === 'tablet') return <Tablet size={14} className="text-purple-400" />;
  return <Monitor size={14} className="text-gray-400" />;
}

function ConvertedBadge({ session }: { session: VisitorSession }) {
  const email = session.registeredEmail || session.capturedEmail;
  if (email) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-900/50 text-green-400 border border-green-700">
        <User size={10} />
        {email.length > 22 ? email.substring(0, 22) + '…' : email}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs text-gray-500 bg-gray-800">
      —
    </span>
  );
}

export function VisitorsDashboard({ adminToken }: { adminToken: string }) {
  const [data, setData] = useState<VisitorsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState('30');
  const [page, setPage] = useState(1);
  const [deviceFilter, setDeviceFilter] = useState('');
  const [countryFilter, setCountryFilter] = useState('');
  const [expandedSessions, setExpandedSessions] = useState<Set<string>>(new Set());

  const [blockedIps, setBlockedIps] = useState<BlockedIp[]>([]);
  const [blockedIpSet, setBlockedIpSet] = useState<Set<string>>(new Set());
  const [blockingIp, setBlockingIp] = useState<string | null>(null);
  const [showBlockedPanel, setShowBlockedPanel] = useState(false);
  const [hoveredIp, setHoveredIp] = useState<string | null>(null);

  const fetchBlockedIps = useCallback(async () => {
    try {
      const res = await fetch('/api/superadmin/blocked-ips', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      const list: BlockedIp[] = json.blockedIps || [];
      setBlockedIps(list);
      setBlockedIpSet(new Set(list.map(b => b.ip)));
    } catch {
    }
  }, [adminToken]);

  const fetchVisitors = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        days,
        page: String(page),
        limit: '50',
      });
      if (deviceFilter) params.set('device', deviceFilter);
      if (countryFilter) params.set('country', countryFilter);

      const res = await fetch(`/api/superadmin/visitors?${params}`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to load visitors');
    } finally {
      setLoading(false);
    }
  }, [adminToken, days, page, deviceFilter, countryFilter]);

  useEffect(() => {
    fetchVisitors();
  }, [fetchVisitors]);

  useEffect(() => {
    fetchBlockedIps();
  }, [fetchBlockedIps]);

  const handleBlockIp = async (ip: string) => {
    if (!ip || blockingIp) return;
    setBlockingIp(ip);
    try {
      const res = await fetch('/api/superadmin/blocked-ips', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ ip }),
      });
      if (res.ok) {
        await fetchBlockedIps();
        await fetchVisitors();
      }
    } catch {
    } finally {
      setBlockingIp(null);
    }
  };

  const handleUnblockIp = async (ip: string) => {
    if (!ip || blockingIp) return;
    setBlockingIp(ip);
    try {
      const res = await fetch(`/api/superadmin/blocked-ips/${encodeURIComponent(ip)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      if (res.ok) {
        await fetchBlockedIps();
        await fetchVisitors();
      }
    } catch {
    } finally {
      setBlockingIp(null);
    }
  };

  const toggleExpand = (sessionId: string) => {
    setExpandedSessions(prev => {
      const next = new Set(prev);
      if (next.has(sessionId)) next.delete(sessionId);
      else next.add(sessionId);
      return next;
    });
  };

  const handleFilterChange = (newDevice: string, newCountry: string, newDays: string) => {
    setDeviceFilter(newDevice);
    setCountryFilter(newCountry);
    setDays(newDays);
    setPage(1);
  };

  const summary = data?.summary;
  const mobilePercent = summary && summary.uniqueSessions > 0
    ? Math.round((summary.mobileSessions / summary.uniqueSessions) * 100)
    : 0;
  const desktopPercent = summary && summary.uniqueSessions > 0
    ? Math.round((summary.desktopSessions / summary.uniqueSessions) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-white">Visitors</h2>
          <p className="text-sm text-gray-400 mt-0.5">Every person who visited your website — anonymous or signed up</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowBlockedPanel(p => !p)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors border ${
              blockedIps.length > 0
                ? 'bg-red-900/30 hover:bg-red-900/50 text-red-400 border-red-700'
                : 'bg-gray-800 hover:bg-gray-700 text-gray-300 border-gray-700'
            }`}
          >
            <Shield size={14} />
            Blocked IPs {blockedIps.length > 0 && `(${blockedIps.length})`}
            {showBlockedPanel ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
          <button
            onClick={fetchVisitors}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-lg text-sm transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {/* Blocked IPs Panel */}
      {showBlockedPanel && (
        <div className="bg-gray-800/50 border border-red-800/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Shield size={16} className="text-red-400" />
            <h3 className="text-sm font-medium text-red-300">Blocked IP Addresses</h3>
            <span className="text-xs text-gray-500">— these IPs are hidden from all visitor views</span>
          </div>
          {blockedIps.length === 0 ? (
            <p className="text-sm text-gray-500">No IPs blocked yet. Click an IP in the table below to block it.</p>
          ) : (
            <div className="space-y-1.5">
              {blockedIps.map(b => (
                <div key={b.ip} className="flex items-center justify-between bg-gray-900/60 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-sm text-red-300">{b.ip}</span>
                    <span className="text-xs text-gray-500">
                      blocked {new Date(b.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUnblockIp(b.ip)}
                    disabled={blockingIp === b.ip}
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-400 hover:text-green-400 hover:bg-green-900/20 rounded transition-colors disabled:opacity-40"
                  >
                    <ShieldOff size={12} />
                    Unblock
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Summary cards */}
      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          {[
            { label: 'Unique Visitors', value: summary.uniqueSessions.toLocaleString(), icon: <User size={16} className="text-blue-400" /> },
            { label: 'Total Page Views', value: summary.totalPageViews.toLocaleString(), icon: <Globe size={16} className="text-green-400" /> },
            { label: 'Desktop', value: `${desktopPercent}%`, sub: `${summary.desktopSessions}`, icon: <Monitor size={16} className="text-gray-400" /> },
            { label: 'Mobile', value: `${mobilePercent}%`, sub: `${summary.mobileSessions}`, icon: <Smartphone size={16} className="text-blue-400" /> },
            { label: 'Tablet', value: `${summary.tabletSessions}`, icon: <Tablet size={16} className="text-purple-400" /> },
            { label: 'Countries', value: summary.uniqueCountries.toLocaleString(), icon: <MapPin size={16} className="text-orange-400" /> },
          ].map(card => (
            <div key={card.label} className="bg-gray-800/50 border border-gray-700 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                {card.icon}
                <span className="text-xs text-gray-400">{card.label}</span>
              </div>
              <div className="text-xl font-bold text-white">{card.value}</div>
              {card.sub && <div className="text-xs text-gray-500">{card.sub} sessions</div>}
            </div>
          ))}
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Period:</label>
          <select
            value={days}
            onChange={e => handleFilterChange(deviceFilter, countryFilter, e.target.value)}
            className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1 focus:outline-none focus:border-blue-500"
          >
            {DAYS_OPTIONS.map(o => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-400">Device:</label>
          <select
            value={deviceFilter}
            onChange={e => handleFilterChange(e.target.value, countryFilter, days)}
            className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1 focus:outline-none focus:border-blue-500"
          >
            <option value="">All devices</option>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
            <option value="tablet">Tablet</option>
          </select>
        </div>
        {data?.topCountries && data.topCountries.length > 0 && (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400">Country:</label>
            <select
              value={countryFilter}
              onChange={e => handleFilterChange(deviceFilter, e.target.value, days)}
              className="bg-gray-800 border border-gray-700 text-gray-200 text-sm rounded px-2 py-1 focus:outline-none focus:border-blue-500"
            >
              <option value="">All countries</option>
              {data.topCountries.map(c => (
                <option key={c.country} value={c.country}>{c.country} ({c.sessions})</option>
              ))}
            </select>
          </div>
        )}
        {(deviceFilter || countryFilter) && (
          <button
            onClick={() => handleFilterChange('', '', days)}
            className="text-xs text-red-400 hover:text-red-300 underline"
          >
            Clear filters
          </button>
        )}
        {data?.pagination && (
          <span className="text-xs text-gray-500 ml-auto">
            {data.pagination.total.toLocaleString()} total sessions
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-700 rounded-lg p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Visitor table */}
      <div className="bg-gray-800/30 border border-gray-700 rounded-xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-gray-400">
            <RefreshCw size={20} className="animate-spin mr-2" /> Loading visitors…
          </div>
        ) : !data?.sessions?.length ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-500">
            <Globe size={36} className="mb-3 opacity-40" />
            <p className="text-base">No visitors found for this period</p>
            <p className="text-sm mt-1 opacity-60">Try extending the date range</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-400 border-b border-gray-700 bg-gray-800/60">
                  <th className="text-left px-4 py-3 font-medium w-6">#</th>
                  <th className="text-left px-4 py-3 font-medium">First Seen</th>
                  <th className="text-left px-4 py-3 font-medium">Duration</th>
                  <th className="text-left px-4 py-3 font-medium">Pages</th>
                  <th className="text-left px-4 py-3 font-medium">Location</th>
                  <th className="text-left px-4 py-3 font-medium">ISP / Provider</th>
                  <th className="text-left px-4 py-3 font-medium">IP</th>
                  <th className="text-left px-4 py-3 font-medium">Device</th>
                  <th className="text-left px-4 py-3 font-medium">Browser / OS</th>
                  <th className="text-left px-4 py-3 font-medium">Screen</th>
                  <th className="text-left px-4 py-3 font-medium">Referrer</th>
                  <th className="text-left px-4 py-3 font-medium">Converted</th>
                </tr>
              </thead>
              <tbody>
                {data.sessions.map((session, idx) => {
                  const isExpanded = expandedSessions.has(session.sessionId);
                  const rowNum = ((page - 1) * 50) + idx + 1;
                  const locationParts = [session.city, session.region, session.country].filter(Boolean);
                  const location = locationParts.join(', ') || '—';
                  const isp = session.isp || session.org || '—';
                  const isIpHovered = hoveredIp === session.sessionId;
                  const isBeingBlocked = blockingIp === session.ip;

                  return (
                    <React.Fragment key={session.sessionId}>
                      <tr
                        className={`border-b border-gray-700/50 hover:bg-gray-700/30 cursor-pointer transition-colors ${isExpanded ? 'bg-gray-700/20' : ''}`}
                        onClick={() => toggleExpand(session.sessionId)}
                      >
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          <span className="flex items-center gap-1">
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                            {rowNum}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                          {formatDateTime(session.firstSeen)}
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          <span className="flex items-center gap-1">
                            <Clock size={12} />
                            {formatDuration(session.durationSeconds)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-gray-700 text-gray-200 text-xs font-medium">
                            {session.pageCount}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-orange-400 flex-shrink-0" />
                            <span className="max-w-[150px] truncate" title={location}>{location}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-400">
                          <span className="flex items-center gap-1">
                            <Wifi size={12} className="flex-shrink-0 text-gray-500" />
                            <span className="max-w-[160px] truncate" title={isp}>{isp}</span>
                          </span>
                        </td>
                        <td
                          className="px-4 py-3 font-mono text-xs"
                          onMouseEnter={() => setHoveredIp(session.sessionId)}
                          onMouseLeave={() => setHoveredIp(null)}
                          onClick={e => e.stopPropagation()}
                        >
                          {session.ip ? (
                            <div className="flex items-center gap-1.5 group">
                              <span className="text-gray-400">{session.ip}</span>
                              {isIpHovered && (
                                <button
                                  onClick={() => handleBlockIp(session.ip)}
                                  disabled={isBeingBlocked}
                                  title={`Block ${session.ip}`}
                                  className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-xs bg-red-900/40 text-red-400 hover:bg-red-800/60 border border-red-800/50 transition-colors disabled:opacity-40 whitespace-nowrap"
                                >
                                  {isBeingBlocked ? <RefreshCw size={10} className="animate-spin" /> : <Shield size={10} />}
                                  Block
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="flex items-center gap-1.5 text-gray-300">
                            <DeviceIcon deviceType={session.deviceType} />
                            <span className="capitalize">{session.deviceType}</span>
                          </span>
                        </td>
                        <td className="px-4 py-3 text-gray-300">
                          <div>{session.browser}</div>
                          <div className="text-xs text-gray-500">{session.os}</div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {session.screenWidth && session.screenHeight
                            ? `${session.screenWidth}×${session.screenHeight}`
                            : '—'}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400">
                          {session.referrer ? (
                            <span className="flex items-center gap-1">
                              <ExternalLink size={10} />
                              <span className="max-w-[100px] truncate" title={session.referrer}>{session.referrer}</span>
                            </span>
                          ) : (
                            <span className="text-gray-600">Direct</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <ConvertedBadge session={session} />
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="border-b border-gray-700/50 bg-gray-900/40">
                          <td colSpan={12} className="px-8 py-4">
                            <div className="space-y-2">
                              <div className="text-xs font-medium text-gray-400 mb-2">
                                Pages visited in this session ({session.pageCount})
                              </div>
                              <div className="grid grid-cols-1 gap-1">
                                {session.pagesVisited.map((pg, i) => (
                                  <div key={i} className="flex items-center gap-2 text-sm">
                                    <span className="w-4 h-4 rounded bg-gray-700 text-gray-400 text-xs flex items-center justify-center flex-shrink-0">
                                      {i + 1}
                                    </span>
                                    <span className="text-blue-400 font-mono text-xs">{pg}</span>
                                  </div>
                                ))}
                              </div>
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3 pt-3 border-t border-gray-700">
                                <div>
                                  <div className="text-xs text-gray-500">Full IP</div>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    <span className="text-sm font-mono text-gray-300">{session.ip || '—'}</span>
                                    {session.ip && (
                                      <button
                                        onClick={() => handleBlockIp(session.ip)}
                                        disabled={!!blockingIp}
                                        className="flex items-center gap-1 px-2 py-0.5 text-xs rounded bg-red-900/30 text-red-400 hover:bg-red-900/50 border border-red-800/50 transition-colors disabled:opacity-40"
                                      >
                                        <Shield size={10} />
                                        Block IP
                                      </button>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">ISP</div>
                                  <div className="text-sm text-gray-300">{session.isp || '—'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Organization</div>
                                  <div className="text-sm text-gray-300">{session.org || '—'}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Session ID</div>
                                  <div className="text-xs font-mono text-gray-500">{session.sessionId}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">First seen</div>
                                  <div className="text-sm text-gray-300">{formatDateTime(session.firstSeen)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Last seen</div>
                                  <div className="text-sm text-gray-300">{formatDateTime(session.lastSeen)}</div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Screen resolution</div>
                                  <div className="text-sm text-gray-300">
                                    {session.screenWidth && session.screenHeight
                                      ? `${session.screenWidth} × ${session.screenHeight}`
                                      : '—'}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-gray-500">Referrer</div>
                                  <div className="text-sm text-gray-300">{session.referrer || 'Direct / None'}</div>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-400">
            Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} sessions)
          </span>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage(p => p - 1)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 rounded text-sm transition-colors"
            >
              Previous
            </button>
            {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(data.pagination.totalPages - 4, page - 2)) + i;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`px-3 py-1.5 rounded text-sm transition-colors ${
                    pageNum === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              disabled={page >= data.pagination.totalPages}
              onClick={() => setPage(p => p + 1)}
              className="px-3 py-1.5 bg-gray-800 hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed text-gray-300 rounded text-sm transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
