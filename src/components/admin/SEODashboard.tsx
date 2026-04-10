import React, { useEffect, useState } from 'react';
import {
  Globe, TrendingUp, AlertTriangle, CheckCircle, XCircle,
  Search, BarChart2, FileText, Link, ExternalLink, RefreshCw,
  Info, Zap, Eye, Clock, Activity, AlertCircle, ChevronDown, ChevronUp
} from 'lucide-react';

const token = () => sessionStorage.getItem('superadmin_token') || '';
const authHeaders = () => ({ 'Authorization': `Bearer ${token()}`, 'Content-Type': 'application/json' });

interface OverviewData {
  organicVisits30d: number;
  organicVisits7d: number;
  totalVisits30d: number;
  organicSharePct: number;
  gscConnected: boolean;
  gscSummary?: { clicks: number; impressions: number; ctr: number; avgPosition: number } | null;
  pagesWithOrganicTraffic: number;
  topOrganicPages: { path: string; visits: number }[];
  topSearchEngines: { engine: string; referrer: string; visits: number }[];
}

interface GscKeyword {
  query: string;
  clicks: number;
  impressions: number;
  ctr: number;
  position: number;
}

interface PageData {
  path: string;
  label: string;
  priority: number;
  targetKeywords: string[];
  wordCount: number;
  seoScore: number;
  organicVisits30d: number;
  totalVisits30d: number;
  issues: string[];
  signals: {
    title: boolean;
    metaDesc: boolean;
    h1: boolean;
    structuredData: boolean;
    openGraph: boolean;
    canonical: boolean;
  };
  inSitemap: boolean;
}

type DashTab = 'overview' | 'pages' | 'keywords' | 'indexing';

const scoreColor = (s: number) =>
  s >= 80 ? 'text-emerald-400' : s >= 60 ? 'text-yellow-400' : 'text-red-400';
const scoreBg = (s: number) =>
  s >= 80 ? 'bg-emerald-900/40 border-emerald-700/40' : s >= 60 ? 'bg-yellow-900/40 border-yellow-700/40' : 'bg-red-900/40 border-red-700/40';

function ScoreBadge({ score }: { score: number }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold border ${scoreBg(score)} ${scoreColor(score)}`}>
      {score}%
    </span>
  );
}

function Signal({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded ${ok ? 'bg-emerald-900/40 text-emerald-400' : 'bg-red-900/40 text-red-400'}`}>
      {ok ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
      {label}
    </span>
  );
}

export default function SEODashboard() {
  const [activeTab, setActiveTab] = useState<DashTab>('overview');
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [pages, setPages] = useState<PageData[]>([]);
  const [gscKeywords, setGscKeywords] = useState<GscKeyword[]>([]);
  const [gscKeywordsLoading, setGscKeywordsLoading] = useState(false);
  const [gscKeywordsError, setGscKeywordsError] = useState('');
  const [kwDays, setKwDays] = useState(28);
  const [kwSearch, setKwSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');
  const [expandedPage, setExpandedPage] = useState<string | null>(null);

  const loadGscKeywords = async (days = kwDays) => {
    setGscKeywordsLoading(true);
    setGscKeywordsError('');
    try {
      const res = await fetch(`/api/superadmin/seo/keywords?days=${days}&limit=500`, { headers: authHeaders() });
      if (res.ok) {
        const data = await res.json();
        setGscKeywords(data.keywords || []);
        if (data.error) setGscKeywordsError(data.error);
      }
    } catch (e: any) {
      setGscKeywordsError(e.message);
    } finally {
      setGscKeywordsLoading(false);
    }
  };

  const fetchData = async (bust = false) => {
    setError('');
    try {
      const bustParam = bust ? '?bust=1' : '';
      const [ovRes, pgRes] = await Promise.all([
        fetch(`/api/superadmin/seo/overview${bustParam}`, { headers: authHeaders() }),
        fetch(`/api/superadmin/seo/pages${bustParam}`, { headers: authHeaders() }),
      ]);
      if (ovRes.ok) {
        const ovData = await ovRes.json();
        setOverview(ovData);
        if (ovData.gscConnected) loadGscKeywords();
      }
      if (pgRes.ok) {
        const data = await pgRes.json();
        setPages(data.pages || []);
      }
    } catch (e: any) {
      setError(e.message);
    }
  };

  const load = async () => {
    setLoading(true);
    await fetchData(false);
    setLoading(false);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData(true);
    setRefreshing(false);
  };

  useEffect(() => { load(); }, []);

  const avgScore = pages.length > 0 ? Math.round(pages.reduce((s, p) => s + p.seoScore, 0) / pages.length) : 0;
  const pagesWithIssues = pages.filter(p => p.issues.length > 0).length;
  const totalIssues = pages.reduce((s, p) => s + p.issues.length, 0);

  const tabs: { id: DashTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { id: 'pages', label: 'Pages & Health', icon: <FileText className="w-4 h-4" /> },
    { id: 'keywords', label: 'Keyword Rankings', icon: <Search className="w-4 h-4" /> },
    { id: 'indexing', label: 'Indexing Issues', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="w-6 h-6 text-blue-400 animate-spin mr-3" />
        <span className="text-slate-400">Loading SEO data…</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Globe className="w-6 h-6 text-blue-400" />
          <h2 className="text-xl font-bold text-white">SEO Intelligence</h2>
          <span className="text-xs text-slate-500 bg-slate-800 px-2 py-0.5 rounded">adiology.io</span>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs text-slate-400 hover:text-white bg-slate-800 hover:bg-slate-700 disabled:opacity-60 disabled:cursor-wait px-3 py-1.5 rounded transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
          {refreshing ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 text-red-400 text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error}
        </div>
      )}

      {/* Sub-tabs */}
      <div className="flex gap-1 bg-slate-800/60 p-1 rounded-lg w-fit">
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded text-sm font-medium transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-700'}`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW TAB ─────────────────────────────────────────── */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* KPI cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Site SEO Health</p>
              <p className={`text-3xl font-bold ${scoreColor(avgScore)}`}>{avgScore}%</p>
              <p className="text-xs text-slate-500 mt-1">avg across {pages.length} pages</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Organic Visits (30d)</p>
              <p className="text-3xl font-bold text-white">{overview?.organicVisits30d?.toLocaleString() ?? '—'}</p>
              <p className="text-xs text-slate-500 mt-1">{overview?.organicSharePct ?? 0}% of total traffic</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Pages Indexed (Sitemap)</p>
              <p className="text-3xl font-bold text-white">17</p>
              <p className="text-xs text-slate-500 mt-1">{overview?.pagesWithOrganicTraffic ?? 0} getting organic traffic</p>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
              <p className="text-xs text-slate-500 mb-1">Open SEO Issues</p>
              <p className={`text-3xl font-bold ${totalIssues > 10 ? 'text-red-400' : totalIssues > 5 ? 'text-yellow-400' : 'text-emerald-400'}`}>{totalIssues}</p>
              <p className="text-xs text-slate-500 mt-1">across {pagesWithIssues} pages</p>
            </div>
          </div>

          {/* GSC banner */}
          {!overview?.gscConnected && (
            <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-4">
              <div className="flex items-start gap-3 mb-3">
                <Info className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-blue-300">Google Search Console API — Not Yet Connected</p>
                  <p className="text-xs text-slate-400 mt-1">
                    You've verified your site in GSC ✓ — but the <strong className="text-slate-300">API connection</strong> needs a Google Cloud Service Account to pull data into this dashboard. Follow the 4 steps below.
                  </p>
                </div>
              </div>
              <ol className="space-y-1.5 text-xs text-slate-300 ml-8">
                <li><span className="text-blue-400 font-bold">Step 1.</span> Go to <a href="https://console.cloud.google.com/iam-admin/serviceaccounts" target="_blank" rel="noopener noreferrer" className="underline text-blue-300 hover:text-blue-200">Google Cloud → IAM → Service Accounts</a> → Create a new service account → Download its JSON key file.</li>
                <li><span className="text-blue-400 font-bold">Step 2.</span> In <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="underline text-blue-300 hover:text-blue-200">Google Search Console</a> → Settings → Users and permissions → Add user → paste the service account email (ends in <code className="bg-slate-700 px-1 rounded">@...iam.gserviceaccount.com</code>) → Role: Full.</li>
                <li><span className="text-blue-400 font-bold">Step 3.</span> In Replit Secrets (🔒 padlock icon), add:
                  <div className="mt-1 space-y-0.5 ml-3">
                    <div><code className="bg-slate-700 px-1 rounded text-blue-300">GSC_SERVICE_ACCOUNT_EMAIL</code> = the service account email from the JSON key</div>
                    <div><code className="bg-slate-700 px-1 rounded text-blue-300">GSC_SERVICE_ACCOUNT_PRIVATE_KEY</code> = the <code className="bg-slate-700 px-1 rounded">private_key</code> field from the JSON (include the full <code className="bg-slate-700 px-1 rounded">-----BEGIN PRIVATE KEY-----</code> block)</div>
                    <div><code className="bg-slate-700 px-1 rounded text-blue-300">GSC_PROPERTY_URL</code> = <code className="bg-slate-700 px-1 rounded">https://adiology.io</code></div>
                  </div>
                </li>
                <li><span className="text-blue-400 font-bold">Step 4.</span> Restart the server and click Refresh above — the banner will disappear and keyword ranking data will populate.</li>
              </ol>
            </div>
          )}

          {/* GSC live stats bar — shown when connected */}
          {overview?.gscConnected && overview?.gscSummary && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Total Clicks (30d)', value: overview.gscSummary.clicks.toLocaleString(), color: 'text-emerald-400' },
                { label: 'Impressions (30d)', value: overview.gscSummary.impressions.toLocaleString(), color: 'text-blue-400' },
                { label: 'Avg CTR', value: `${overview.gscSummary.ctr}%`, color: 'text-purple-400' },
                { label: 'Avg Position', value: `#${overview.gscSummary.avgPosition}`, color: overview.gscSummary.avgPosition <= 10 ? 'text-emerald-400' : 'text-yellow-400' },
              ].map(stat => (
                <div key={stat.label} className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-3 text-center">
                  <p className={`text-xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                  <p className="text-xs text-emerald-600 mt-0.5">via GSC</p>
                </div>
              ))}
            </div>
          )}

          {/* Two-col: top pages + search engines */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-400" /> Top Organic Pages (30d)</h3>
              {(overview?.topOrganicPages?.length ?? 0) === 0 ? (
                <p className="text-xs text-slate-500">No organic traffic detected yet in the last 30 days.</p>
              ) : (
                <div className="space-y-2">
                  {overview?.topOrganicPages?.slice(0, 8).map((p, i) => (
                    <div key={p.path} className="flex items-center gap-2">
                      <span className="text-xs text-slate-600 w-4">{i + 1}</span>
                      <span className="text-xs text-slate-300 flex-1 truncate">{p.path}</span>
                      <span className="text-xs font-semibold text-emerald-400">{p.visits.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2"><Search className="w-4 h-4 text-blue-400" /> Search Engine Breakdown (30d)</h3>
              {(overview?.topSearchEngines?.length ?? 0) === 0 ? (
                <p className="text-xs text-slate-500">No search engine traffic detected yet.</p>
              ) : (
                <div className="space-y-2">
                  {Array.from(
                    overview?.topSearchEngines?.reduce((acc, r) => {
                      acc.set(r.engine, (acc.get(r.engine) || 0) + r.visits);
                      return acc;
                    }, new Map<string, number>()) || new Map(),
                  ).sort((a, b) => b[1] - a[1]).map(([engine, visits]) => (
                    <div key={engine} className="flex items-center gap-2">
                      <span className="text-xs text-slate-300 flex-1">{engine}</span>
                      <span className="text-xs font-semibold text-blue-400">{visits.toLocaleString()} visits</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 pt-3 border-t border-slate-700/40 grid grid-cols-2 gap-3 text-center">
                <div>
                  <p className="text-2xl font-bold text-white">{overview?.totalVisits30d?.toLocaleString() ?? '—'}</p>
                  <p className="text-xs text-slate-500">Total visits (30d)</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-emerald-400">{overview?.organicVisits30d?.toLocaleString() ?? '—'}</p>
                  <p className="text-xs text-slate-500">Organic visits (30d)</p>
                </div>
              </div>
            </div>
          </div>

          {/* SEO score summary bar */}
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3">Site-wide SEO Score by Page</h3>
            <div className="space-y-2">
              {pages.sort((a, b) => b.seoScore - a.seoScore).map(p => (
                <div key={p.path} className="flex items-center gap-3">
                  <span className="text-xs text-slate-400 w-44 truncate">{p.label}</span>
                  <div className="flex-1 bg-slate-700/40 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-2 rounded-full transition-all ${p.seoScore >= 80 ? 'bg-emerald-500' : p.seoScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'}`}
                      style={{ width: `${p.seoScore}%` }}
                    />
                  </div>
                  <span className={`text-xs font-bold w-10 text-right ${scoreColor(p.seoScore)}`}>{p.seoScore}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── PAGES TAB ─────────────────────────────────────────────── */}
      {activeTab === 'pages' && (
        <div className="space-y-3">
          <p className="text-xs text-slate-500">All 17 pages from sitemap.xml — SEO health analysis, organic traffic, and open issues.</p>
          {pages.map(page => (
            <div key={page.path} className="bg-slate-800/60 border border-slate-700/40 rounded-xl overflow-hidden">
              <button
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-slate-700/20 transition-colors"
                onClick={() => setExpandedPage(expandedPage === page.path ? null : page.path)}
              >
                <ScoreBadge score={page.seoScore} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-white">{page.label}</span>
                    <span className="text-xs text-slate-500 truncate">{page.path}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {page.targetKeywords.slice(0, 2).map(kw => (
                      <span key={kw} className="text-xs bg-slate-700/50 text-slate-400 px-1.5 py-0.5 rounded">{kw}</span>
                    ))}
                    {page.issues.length > 0 && (
                      <span className="text-xs text-amber-400 flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> {page.issues.length} issue{page.issues.length !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-right shrink-0">
                  <div>
                    <p className="text-sm font-bold text-emerald-400">{page.organicVisits30d}</p>
                    <p className="text-xs text-slate-600">organic/30d</p>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-300">{page.totalVisits30d}</p>
                    <p className="text-xs text-slate-600">total/30d</p>
                  </div>
                  {expandedPage === page.path ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </div>
              </button>

              {expandedPage === page.path && (
                <div className="border-t border-slate-700/40 p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-900/40">
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">SEO Signals</h4>
                    <div className="flex flex-wrap gap-1.5">
                      <Signal ok={page.signals.title} label="Title tag" />
                      <Signal ok={page.signals.metaDesc} label="Meta desc" />
                      <Signal ok={page.signals.h1} label="H1 tag" />
                      <Signal ok={page.signals.structuredData} label="JSON-LD" />
                      <Signal ok={page.signals.openGraph} label="Open Graph" />
                      <Signal ok={page.signals.canonical} label="Canonical" />
                      <Signal ok={page.wordCount >= 400} label={`${page.wordCount}+ words`} />
                      <Signal ok={page.targetKeywords.length > 0} label="Target KW" />
                    </div>
                    {page.targetKeywords.length > 0 && (
                      <div>
                        <p className="text-xs text-slate-500 mb-1">Target keywords</p>
                        <div className="flex flex-wrap gap-1">
                          {page.targetKeywords.map(kw => (
                            <span key={kw} className="text-xs bg-blue-900/30 text-blue-300 border border-blue-700/30 px-2 py-0.5 rounded">{kw}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Issues to Fix</h4>
                    {page.issues.length === 0 ? (
                      <p className="text-xs text-emerald-400 flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5" /> No issues found</p>
                    ) : (
                      <ul className="space-y-1.5">
                        {page.issues.map((issue, i) => (
                          <li key={i} className="text-xs text-amber-300 flex items-start gap-1.5">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                            {issue}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="flex items-center gap-4 pt-2">
                      <div><p className="text-lg font-bold text-white">{page.wordCount}</p><p className="text-xs text-slate-500">words</p></div>
                      <div><p className="text-lg font-bold text-white">{page.priority}</p><p className="text-xs text-slate-500">sitemap priority</p></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── KEYWORDS TAB ──────────────────────────────────────────── */}
      {activeTab === 'keywords' && (
        <div className="space-y-5">
          {/* If GSC not connected */}
          {!overview?.gscConnected && (
            <div className="bg-slate-800/60 border border-blue-700/30 rounded-xl p-5">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-blue-900/40 rounded-lg flex items-center justify-center shrink-0">
                  <Search className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">Google Search Console — Not Connected</h3>
                  <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                    Keyword rankings, average positions, impressions, and click-through rates require a live Google Search Console API connection. See the Setup Guide in the Overview tab.
                  </p>
                  <a href="https://search.google.com/search-console" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 mt-3 text-xs text-blue-400 hover:text-blue-300 transition-colors">
                    Open Google Search Console <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            </div>
          )}

          {/* If GSC IS connected — show real keyword data */}
          {overview?.gscConnected && (
            <div className="space-y-4">
              {/* Controls */}
              <div className="flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-800 rounded-lg p-1">
                  {[7, 28, 90].map(d => (
                    <button key={d} onClick={() => { setKwDays(d); loadGscKeywords(d); }}
                      className={`px-3 py-1 text-xs rounded-md transition-colors ${kwDays === d ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}>
                      {d}d
                    </button>
                  ))}
                </div>
                <input
                  value={kwSearch}
                  onChange={e => setKwSearch(e.target.value)}
                  placeholder="Filter keywords…"
                  className="flex-1 min-w-40 text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                />
                <button onClick={() => loadGscKeywords(kwDays)} disabled={gscKeywordsLoading}
                  className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white bg-slate-800 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50">
                  <RefreshCw className={`w-3 h-3 ${gscKeywordsLoading ? 'animate-spin' : ''}`} /> Refresh
                </button>
                <span className="text-xs text-slate-500">{gscKeywords.length} keywords</span>
              </div>

              {gscKeywordsError && (
                <div className="bg-red-900/30 border border-red-700/40 rounded-lg px-4 py-3 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" /> {gscKeywordsError}
                </div>
              )}

              {gscKeywordsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <RefreshCw className="w-5 h-5 text-blue-400 animate-spin mr-3" />
                  <span className="text-slate-400 text-sm">Fetching keyword data from GSC…</span>
                </div>
              ) : gscKeywords.length === 0 ? (
                <div className="text-center py-12 bg-slate-800/40 rounded-xl border border-slate-700/30">
                  <Search className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                  <p className="text-sm text-slate-400">No keyword data yet for this period.</p>
                  <p className="text-xs text-slate-500 mt-1">GSC data typically appears 2–3 days after your site receives its first organic visits.</p>
                </div>
              ) : (
                <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-slate-400 bg-slate-900/50 border-b border-slate-700/40">
                          <th className="text-left px-4 py-3 font-medium w-8">#</th>
                          <th className="text-left px-4 py-3 font-medium">Keyword</th>
                          <th className="text-right px-4 py-3 font-medium">Clicks</th>
                          <th className="text-right px-4 py-3 font-medium">Impressions</th>
                          <th className="text-right px-4 py-3 font-medium">CTR</th>
                          <th className="text-right px-4 py-3 font-medium">Avg Position</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-700/30">
                        {gscKeywords
                          .filter(k => !kwSearch || k.query.toLowerCase().includes(kwSearch.toLowerCase()))
                          .map((kw, i) => (
                            <tr key={kw.query} className="hover:bg-slate-700/20 transition-colors">
                              <td className="px-4 py-2.5 text-slate-600">{i + 1}</td>
                              <td className="px-4 py-2.5 text-slate-200 font-medium">{kw.query}</td>
                              <td className="px-4 py-2.5 text-right text-emerald-400 font-semibold">{kw.clicks.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right text-slate-400">{kw.impressions.toLocaleString()}</td>
                              <td className="px-4 py-2.5 text-right text-blue-400">{kw.ctr}%</td>
                              <td className="px-4 py-2.5 text-right">
                                <span className={`font-semibold ${kw.position <= 3 ? 'text-emerald-400' : kw.position <= 10 ? 'text-yellow-400' : 'text-slate-400'}`}>
                                  {kw.position}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Organic traffic by page (always shown as supplemental) */}
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-1 flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-purple-400" /> Pages Receiving Organic Traffic
            </h3>
            <p className="text-xs text-slate-500 mb-4">Inferred from referrer data — visits from Google, Bing, DuckDuckGo, Yahoo</p>
            {(overview?.topOrganicPages?.length ?? 0) === 0 ? (
              <div className="text-center py-8">
                <Globe className="w-10 h-10 text-slate-600 mx-auto mb-3" />
                <p className="text-sm text-slate-500">No organic traffic detected in the last 30 days.</p>
                <p className="text-xs text-slate-600 mt-1">This could mean adiology.io is not yet indexed, traffic levels are very low, or visitors are arriving via direct/referral links.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-500 border-b border-slate-700/40">
                      <th className="text-left pb-2 font-medium">Page</th>
                      <th className="text-left pb-2 font-medium">Target Keywords</th>
                      <th className="text-right pb-2 font-medium">Organic (30d)</th>
                      <th className="text-right pb-2 font-medium">SEO Score</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {pages
                      .filter(p => p.organicVisits30d > 0)
                      .sort((a, b) => b.organicVisits30d - a.organicVisits30d)
                      .map(p => (
                        <tr key={p.path} className="hover:bg-slate-700/20">
                          <td className="py-2 font-medium text-white">{p.label}<span className="text-slate-600 ml-1">{p.path}</span></td>
                          <td className="py-2">
                            <div className="flex flex-wrap gap-1">
                              {p.targetKeywords.slice(0, 2).map(kw => (
                                <span key={kw} className="bg-slate-700 text-slate-300 px-1.5 py-0.5 rounded">{kw}</span>
                              ))}
                              {p.targetKeywords.length === 0 && <span className="text-slate-600 italic">not set</span>}
                            </div>
                          </td>
                          <td className="py-2 text-right font-bold text-emerald-400">{p.organicVisits30d}</td>
                          <td className="py-2 text-right"><ScoreBadge score={p.seoScore} /></td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Target keywords reference */}
          <div className="bg-slate-800/60 border border-slate-700/40 rounded-xl p-4">
            <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Zap className="w-4 h-4 text-yellow-400" /> All Target Keywords by Page
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="text-slate-500 border-b border-slate-700/40">
                    <th className="text-left pb-2 font-medium">Page</th>
                    <th className="text-left pb-2 font-medium">Keywords Being Targeted</th>
                    <th className="text-right pb-2 font-medium">Priority</th>
                    <th className="text-right pb-2 font-medium">Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {pages
                    .filter(p => p.targetKeywords.length > 0)
                    .sort((a, b) => b.priority - a.priority)
                    .map(p => (
                      <tr key={p.path} className="hover:bg-slate-700/20">
                        <td className="py-2 font-medium text-white">{p.label}</td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-1">
                            {p.targetKeywords.map(kw => (
                              <span key={kw} className="bg-blue-900/30 border border-blue-700/30 text-blue-300 px-1.5 py-0.5 rounded">{kw}</span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2 text-right text-slate-400">{p.priority}</td>
                        <td className="py-2 text-right"><ScoreBadge score={p.seoScore} /></td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── INDEXING ISSUES TAB ───────────────────────────────────── */}
      {activeTab === 'indexing' && (
        <div className="space-y-4">
          <p className="text-xs text-slate-500">Why certain pages aren't ranking or aren't appearing in Google — specific diagnosed reasons.</p>

          {/* Fixed items summary */}
          <div className="bg-emerald-900/10 border border-emerald-700/30 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-emerald-300">4 Issues Resolved</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {[
                { label: 'JSON-LD structured data', detail: 'Added to all 17 pages (Organization, SoftwareApplication, Article, FAQPage schemas)' },
                { label: 'Blog articles in sitemap', detail: 'All 25 blog article URLs added to sitemap.xml with lastmod + priority tags' },
                { label: 'Open Graph tags', detail: 'og:title, og:description, og:image added to all pages including legal pages' },
                { label: 'Meta descriptions', detail: 'Unique meta descriptions added to all pages including /privacy-policy, /terms, /refund-policy' },
              ].map((fix, i) => (
                <div key={i} className="flex items-start gap-2 text-xs">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <span className="text-emerald-300 font-medium">{fix.label}</span>
                    <span className="text-slate-500"> — {fix.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {[
            {
              severity: 'critical',
              title: 'Domain Authority Too Low to Rank Competitively',
              icon: <TrendingUp className="w-5 h-5 text-red-400" />,
              affects: ['All pages'],
              detail: 'adiology.io is a relatively new domain with very few external backlinks. Google weights domain authority heavily — pages targeting competitive keywords like "google ads tool" or "click fraud protection" are competing against domains with 10+ years of history and thousands of backlinks. New sites typically need 6–12 months of active link-building before pages break into page 1.',
              fix: 'Build backlinks: guest posts on PPC/marketing blogs, get listed on Product Hunt, G2, Capterra, and SaaS directories. Each high-quality backlink boosts the entire domain.',
            },
            {
              severity: 'high',
              title: 'Google Crawl Budget Limiting Indexing Speed',
              icon: <RefreshCw className="w-5 h-5 text-amber-400" />,
              affects: ['Feature pages', 'Blog articles'],
              detail: 'Submitting a sitemap or URL to Google does not guarantee indexing. Google\'s crawl budget is limited for new/low-authority domains — it may visit your sitemap but choose not to index pages it considers low-value. Common reasons: (1) pages are too similar to competitor content, (2) thin content under 500 words, (3) no external signals pointing to the page (no backlinks = Google sees low demand), (4) pages don\'t demonstrate E-E-A-T (Experience, Expertise, Authority, Trust).',
              fix: 'Increase content depth on feature pages to 800+ words. Add author bio/credentials to blog posts. Get 1-2 quality backlinks specifically to unindexed pages.',
            },
            {
              severity: 'high',
              title: 'Thin Content on Several Feature Pages',
              icon: <AlertTriangle className="w-5 h-5 text-amber-400" />,
              affects: ['/contact', '/blog', '/features/proxy-mail', '/features/instant-mail'],
              detail: 'Pages under 400 words are considered thin content by Google. /contact has ~180 words, /blog index has ~300 words. Google actively de-prioritizes thin pages. In a post-Helpful Content Update world, each page needs to demonstrate genuine value and depth.',
              fix: 'Expand /blog to include featured articles, category descriptions, and author intros. Add FAQ sections to feature pages. Each feature page should have a "How it works", use cases, and an FAQ to hit 800+ words naturally.',
            },
            {
              severity: 'medium',
              title: 'No Internal Linking Strategy to Feature Pages',
              icon: <Link className="w-5 h-5 text-blue-400" />,
              affects: ['Blog articles', 'Feature pages'],
              detail: 'Internal links pass PageRank between pages. If blog articles don\'t link to feature pages (and vice versa), Google can\'t efficiently crawl and rank the whole site. With 25 blog articles covering PPC and Google Ads topics, each one is an opportunity to pass link equity to relevant feature pages.',
              fix: 'In each blog article, add 2-3 contextual links to related feature pages (e.g., a blog about ad fraud should link to /features/click-guard). Add a "Related Features" section to blog posts.',
            },
          ].map((item, i) => (
            <div key={i} className={`rounded-xl border p-4 ${item.severity === 'critical' ? 'bg-red-900/10 border-red-700/30' : item.severity === 'high' ? 'bg-amber-900/10 border-amber-700/30' : item.severity === 'medium' ? 'bg-blue-900/10 border-blue-700/30' : 'bg-slate-800/60 border-slate-700/40'}`}>
              <div className="flex items-start gap-3">
                <div className="shrink-0 mt-0.5">{item.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-white">{item.title}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium uppercase tracking-wide ${item.severity === 'critical' ? 'bg-red-900/40 text-red-400' : item.severity === 'high' ? 'bg-amber-900/40 text-amber-400' : item.severity === 'medium' ? 'bg-blue-900/40 text-blue-400' : 'bg-slate-700 text-slate-400'}`}>
                      {item.severity}
                    </span>
                  </div>
                  <div className="flex gap-1 flex-wrap mt-1.5 mb-2">
                    {item.affects.map(a => (
                      <span key={a} className="text-xs bg-slate-700/60 text-slate-400 px-1.5 py-0.5 rounded">{a}</span>
                    ))}
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{item.detail}</p>
                  <div className="mt-2 pt-2 border-t border-slate-700/30">
                    <p className="text-xs text-slate-300"><span className="font-semibold text-emerald-400">Fix: </span>{item.fix}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
