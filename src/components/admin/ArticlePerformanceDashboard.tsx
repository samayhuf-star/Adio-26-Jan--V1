import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, RefreshCw, Download, ExternalLink, ChevronDown, ChevronUp,
  BarChart3, MousePointerClick, Users, DollarSign, Eye, X, ArrowUpDown
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface ArticleRow {
  slug: string;
  title: string;
  url: string;
  viewsAllTime: number;
  views7d: number;
  views30d: number;
  signups: number;
  paidConversions: number;
  revenueCents: number;
  conversionRate: number;
  createdAt: string | null;
}

interface DailyDataPoint {
  day: string;
  views: number;
}

interface ConversionRecord {
  id: number;
  eventType: string;
  planName: string | null;
  revenueCents: number;
  createdAt: string;
}

interface ArticlePerformanceDashboardProps {
  token: string;
}

type SortKey = 'views_alltime' | 'views_30d' | 'views_7d' | 'signups' | 'paid' | 'revenue' | 'conversion_rate' | 'newest';

const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: 'views_30d', label: 'Views (30d)' },
  { value: 'views_7d', label: 'Views (7d)' },
  { value: 'views_alltime', label: 'Views (All-time)' },
  { value: 'conversion_rate', label: 'Conversion Rate' },
  { value: 'signups', label: 'Signups' },
  { value: 'paid', label: 'Paid Conversions' },
  { value: 'revenue', label: 'Revenue' },
  { value: 'newest', label: 'Newest' },
];

function formatCents(cents: number): string {
  return `$${(cents / 100).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDayLabel(isoDate: string): string {
  const d = new Date(isoDate + 'T12:00:00Z');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'UTC' });
}

function MiniBarChart({ data }: { data: DailyDataPoint[] }) {
  if (!data.length) return <p className="text-slate-500 text-sm text-center py-8">No view data available for this period.</p>;

  const max = Math.max(...data.map((d) => d.views), 1);
  const hasAnyViews = data.some((d) => d.views > 0);

  if (!hasAnyViews) {
    return <p className="text-slate-500 text-sm text-center py-8">No views recorded in the last 30 days.</p>;
  }

  return (
    <div className="flex items-end gap-[2px] h-24 mt-2">
      {data.map((d) => (
        <div key={d.day} className="flex-1 flex flex-col items-center group relative" style={{ minWidth: 0 }}>
          <div
            className={`w-full rounded-t-sm transition-colors ${d.views > 0 ? 'bg-blue-500/70 hover:bg-blue-400' : 'bg-slate-700/30'}`}
            style={{ height: `${(d.views / max) * 88}px`, minHeight: d.views > 0 ? '3px' : '2px' }}
          />
          <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 hidden group-hover:flex bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap z-20 border border-slate-700 pointer-events-none shadow-lg">
            {formatDayLabel(d.day)}: {d.views} view{d.views !== 1 ? 's' : ''}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArticleDetailPanel({
  slug,
  title,
  token,
  onClose,
}: {
  slug: string;
  title: string;
  token: string;
  onClose: () => void;
}) {
  const [daily, setDaily] = useState<DailyDataPoint[]>([]);
  const [conversions, setConversions] = useState<ConversionRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/superadmin/blog/article-daily/${encodeURIComponent(slug)}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const data = await res.json();
        if (data.success) {
          setDaily(data.daily || []);
          setConversions(data.conversions || []);
        }
      } catch {
        // silent
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [slug, token]);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h3 className="text-white font-semibold text-lg">{title}</h3>
            <a
              href={`https://adiology.io/blog/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 text-sm hover:underline flex items-center gap-1 mt-0.5"
            >
              /blog/{slug} <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-slate-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="w-6 h-6 text-blue-400 animate-spin" />
            </div>
          ) : (
            <>
              <div>
                <h4 className="text-slate-300 font-medium text-sm mb-3 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-blue-400" />
                  Daily Views — Last 30 Days
                </h4>
                <MiniBarChart data={daily} />
                {daily.length > 0 && (
                  <div className="flex justify-between text-xs text-slate-500 mt-1">
                    <span>{daily[0]?.day}</span>
                    <span>{daily[daily.length - 1]?.day}</span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="text-slate-300 font-medium text-sm mb-3 flex items-center gap-2">
                  <MousePointerClick className="w-4 h-4 text-green-400" />
                  Conversions Attributed
                </h4>
                {conversions.length === 0 ? (
                  <p className="text-slate-500 text-sm">No conversions attributed to this article yet.</p>
                ) : (
                  <div className="space-y-2">
                    {conversions.map((c) => (
                      <div key={c.id} className="flex items-center justify-between bg-slate-700/30 rounded-lg p-3">
                        <div className="flex items-center gap-3">
                          <Badge
                            className={
                              c.eventType === 'paid'
                                ? 'bg-green-500/20 text-green-400 border-green-500/30'
                                : c.eventType === 'signup'
                                ? 'bg-blue-500/20 text-blue-400 border-blue-500/30'
                                : 'bg-slate-500/20 text-slate-400 border-slate-500/30'
                            }
                          >
                            {c.eventType === 'paid' ? 'Paid' : c.eventType === 'signup' ? 'Signup' : c.eventType}
                          </Badge>
                          <span className="text-slate-300 text-sm">{c.planName || '—'}</span>
                        </div>
                        <div className="text-right">
                          {c.revenueCents > 0 && (
                            <span className="text-green-400 text-sm font-medium">{formatCents(c.revenueCents)}</span>
                          )}
                          <p className="text-slate-500 text-xs">{formatDate(c.createdAt)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export function ArticlePerformanceDashboard({ token }: ArticlePerformanceDashboardProps) {
  const [rows, setRows] = useState<ArticleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sort, setSort] = useState<SortKey>('views_30d');
  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string>('');
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/superadmin/blog/article-performance?sort=${sort}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const data = await res.json();
      if (data.success) {
        setRows(data.rows || []);
        setLastRefresh(new Date());
      }
    } catch {
      // silent
    } finally {
      setLoading(false);
    }
  }, [token, sort]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const totalViews = rows.reduce((s, r) => s + r.viewsAllTime, 0);
  const totalSignups = rows.reduce((s, r) => s + r.signups, 0);
  const totalPaid = rows.reduce((s, r) => s + r.paidConversions, 0);
  const totalRevenue = rows.reduce((s, r) => s + r.revenueCents, 0);

  function exportCSV() {
    const headers = ['title', 'url', 'views_alltime', 'views_30d', 'views_7d', 'signups', 'paid_conversions', 'revenue_usd', 'conversion_rate_pct'];
    const csvRows = [
      headers,
      ...rows.map((r) => [
        r.title,
        r.url,
        String(r.viewsAllTime),
        String(r.views30d),
        String(r.views7d),
        String(r.signups),
        String(r.paidConversions),
        (r.revenueCents / 100).toFixed(2),
        r.conversionRate.toFixed(2),
      ]),
    ];
    const csv = csvRows
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'article-performance.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-400" />
            Article ROI & Performance
          </h2>
          <p className="text-slate-400 text-sm mt-0.5">
            Track which articles drive signups and revenue. 30-day attribution window.
            {lastRefresh && (
              <span className="ml-2 text-slate-600">
                Updated {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchData}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={exportCSV}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Eye className="w-4 h-4 text-blue-400" />
            <span className="text-slate-400 text-xs">Total Views</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalViews.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-green-400" />
            <span className="text-slate-400 text-xs">Attributed Signups</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalSignups.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <MousePointerClick className="w-4 h-4 text-orange-400" />
            <span className="text-slate-400 text-xs">Paid Conversions</span>
          </div>
          <p className="text-2xl font-bold text-white">{totalPaid.toLocaleString()}</p>
        </div>
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-emerald-400" />
            <span className="text-slate-400 text-xs">Attributed Revenue</span>
          </div>
          <p className="text-2xl font-bold text-white">{formatCents(totalRevenue)}</p>
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-slate-400 text-sm flex items-center gap-1.5">
          <ArrowUpDown className="w-3.5 h-3.5" /> Sort by:
        </span>
        {SORT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            onClick={() => setSort(opt.value)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              sort === opt.value
                ? 'bg-blue-600 text-white'
                : 'bg-slate-700/50 text-slate-400 hover:bg-slate-700 hover:text-slate-300'
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
        </div>
      ) : rows.length === 0 ? (
        <div className="text-center py-20">
          <BarChart3 className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400 text-lg font-medium">No article data yet</p>
          <p className="text-slate-600 text-sm mt-1">
            Article view tracking will start as soon as visitors read your blog posts.
          </p>
        </div>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700">
                  <th className="text-left px-4 py-3 text-slate-400 font-medium">Article</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium whitespace-nowrap">7d Views</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium whitespace-nowrap">30d Views</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium whitespace-nowrap">All-time</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Signups</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Paid</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Revenue</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Conv%</th>
                  <th className="text-right px-4 py-3 text-slate-400 font-medium">Published</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr
                    key={row.slug}
                    onClick={() => { setSelectedSlug(row.slug); setSelectedTitle(row.title); }}
                    className={`border-b border-slate-700/50 cursor-pointer transition-colors hover:bg-slate-700/30 ${
                      idx % 2 === 0 ? '' : 'bg-slate-800/30'
                    }`}
                  >
                    <td className="px-4 py-3">
                      <div className="max-w-xs">
                        <p className="text-white font-medium truncate" title={row.title}>{row.title || row.slug}</p>
                        <a
                          href={row.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="text-slate-500 text-xs hover:text-blue-400 flex items-center gap-1"
                        >
                          /blog/{row.slug} <ExternalLink className="w-2.5 h-2.5 flex-shrink-0" />
                        </a>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-slate-300">{row.views7d.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{row.views30d.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right text-slate-300">{row.viewsAllTime.toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      {row.signups > 0 ? (
                        <span className="text-green-400 font-medium">{row.signups}</span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.paidConversions > 0 ? (
                        <span className="text-orange-400 font-medium">{row.paidConversions}</span>
                      ) : (
                        <span className="text-slate-600">0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.revenueCents > 0 ? (
                        <span className="text-emerald-400 font-medium">{formatCents(row.revenueCents)}</span>
                      ) : (
                        <span className="text-slate-600">$0</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      {row.conversionRate > 0 ? (
                        <span className={`font-medium ${row.conversionRate >= 2 ? 'text-green-400' : row.conversionRate >= 1 ? 'text-yellow-400' : 'text-slate-400'}`}>
                          {row.conversionRate}%
                        </span>
                      ) : (
                        <span className="text-slate-600">0%</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-xs text-slate-500">{formatDate(row.createdAt)}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-slate-700 flex items-center justify-between text-xs text-slate-500">
            <span>{rows.length} article{rows.length !== 1 ? 's' : ''} tracked</span>
            <span>Click any row to see day-by-day breakdown and attributed conversions</span>
          </div>
        </div>
      )}

      {selectedSlug && (
        <ArticleDetailPanel
          slug={selectedSlug}
          title={selectedTitle}
          token={token}
          onClose={() => setSelectedSlug(null)}
        />
      )}
    </div>
  );
}
