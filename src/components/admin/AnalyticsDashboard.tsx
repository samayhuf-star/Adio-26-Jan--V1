import { useState, useEffect, useMemo } from 'react';
import {
  Activity, RefreshCw, Eye, Users, Globe, Monitor,
  Smartphone, Tablet, TrendingUp, Clock, ExternalLink,
  BarChart3, ArrowUp, ArrowDown
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface AnalyticsData {
  totalViews: number;
  uniqueVisitors: number;
  todayViews: number;
  todayUnique: number;
  topPages: { path: string; views: number; uniqueVisitors: number }[];
  topReferrers: { referrer: string; count: number }[];
  browsers: { browser: string; count: number }[];
  devices: { deviceType: string; count: number }[];
  operatingSystems: { os: string; count: number }[];
  dailyViews: { date: string; views: number; uniqueVisitors: number }[];
  recentViews: { id: number; path: string; referrer: string | null; browser: string; os: string; deviceType: string; createdAt: string }[];
  period: number;
}

const COLORS = ['#818cf8', '#34d399', '#f59e0b', '#f87171', '#a78bfa', '#38bdf8', '#fb923c', '#4ade80'];

function StatCard({ label, value, icon: Icon, color, sub }: { label: string; value: string | number; icon: any; color: string; sub?: string }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-slate-400">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <div className="text-2xl font-bold text-white">{typeof value === 'number' ? value.toLocaleString() : value}</div>
      {sub && <div className="text-xs text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

function MiniBarChart({ data, maxVal }: { data: { label: string; value: number }[]; maxVal: number }) {
  return (
    <div className="space-y-2">
      {data.map((item, i) => (
        <div key={i} className="flex items-center gap-3">
          <span className="text-xs text-slate-400 w-24 truncate flex-shrink-0" title={item.label}>{item.label}</span>
          <div className="flex-1 h-5 bg-slate-700/50 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${maxVal > 0 ? (item.value / maxVal) * 100 : 0}%`,
                backgroundColor: COLORS[i % COLORS.length],
              }}
            />
          </div>
          <span className="text-xs text-slate-300 w-12 text-right flex-shrink-0">{item.value.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

function SimpleLineChart({ data }: { data: { date: string; views: number; uniqueVisitors: number }[] }) {
  if (!data.length) return <div className="text-slate-500 text-center py-10">No data yet</div>;

  const maxViews = Math.max(...data.map(d => d.views), 1);
  const chartWidth = 100;
  const chartHeight = 160;

  const viewPoints = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * chartWidth : 50;
    const y = chartHeight - (d.views / maxViews) * (chartHeight - 20);
    return `${x},${y}`;
  }).join(' ');

  const uniquePoints = data.map((d, i) => {
    const x = data.length > 1 ? (i / (data.length - 1)) * chartWidth : 50;
    const y = chartHeight - (d.uniqueVisitors / maxViews) * (chartHeight - 20);
    return `${x},${y}`;
  }).join(' ');

  const areaPath = `M0,${chartHeight} L${viewPoints} L${chartWidth},${chartHeight} Z`;

  return (
    <div className="relative">
      <svg viewBox={`0 0 ${chartWidth} ${chartHeight + 10}`} className="w-full h-40" preserveAspectRatio="none">
        <defs>
          <linearGradient id="viewsGrad" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#818cf8" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#viewsGrad)" />
        <polyline fill="none" stroke="#818cf8" strokeWidth="0.8" points={viewPoints} />
        <polyline fill="none" stroke="#34d399" strokeWidth="0.8" strokeDasharray="2,1" points={uniquePoints} />
      </svg>
      <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-indigo-400 inline-block" /> Views</span>
        <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-emerald-400 inline-block border-dashed" /> Unique</span>
      </div>
      <div className="flex justify-between text-xs text-slate-500 mt-1">
        <span>{data[0]?.date ? new Date(data[0].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
        <span>{data[data.length - 1]?.date ? new Date(data[data.length - 1].date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : ''}</span>
      </div>
    </div>
  );
}

function DeviceIcon({ type }: { type: string }) {
  if (type === 'mobile') return <Smartphone className="w-4 h-4" />;
  if (type === 'tablet') return <Tablet className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
}

export default function AnalyticsDashboard({ token }: { token: string }) {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'live'>('overview');

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/analytics/stats?days=${days}`, {
        headers: { 'X-Admin-Token': token },
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      }
    } catch (err) {
      console.error('Analytics fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [days]);

  const deviceTotal = useMemo(() => {
    if (!data) return 0;
    return data.devices.reduce((a, b) => a + b.count, 0);
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin" />
        <span className="ml-3 text-slate-400">Loading analytics...</span>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-20 text-slate-400">
        <Activity className="w-10 h-10 mx-auto mb-3 opacity-40" />
        <p>Failed to load analytics data</p>
        <Button variant="outline" size="sm" className="mt-3" onClick={fetchData}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-6 h-6 text-indigo-400" />
          Site Analytics
        </h3>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-800 rounded-lg p-0.5">
            {[7, 30, 90].map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`px-3 py-1.5 text-xs rounded-md transition-all ${days === d ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                {d}d
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchData} disabled={loading} className="border-slate-700 text-slate-300">
            <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Views" value={data.totalViews} icon={Eye} color="bg-indigo-500/20" sub={`Last ${days} days`} />
        <StatCard label="Unique Visitors" value={data.uniqueVisitors} icon={Users} color="bg-emerald-500/20" sub={`Last ${days} days`} />
        <StatCard label="Today's Views" value={data.todayViews} icon={TrendingUp} color="bg-amber-500/20" />
        <StatCard label="Today's Unique" value={data.todayUnique} icon={Activity} color="bg-blue-500/20" />
      </div>

      <div className="flex gap-2 border-b border-slate-700/50 pb-1">
        {(['overview', 'pages', 'live'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm rounded-t-lg transition-all ${activeTab === tab ? 'bg-slate-800 text-white border-b-2 border-indigo-500' : 'text-slate-400 hover:text-white'}`}
          >
            {tab === 'overview' ? 'Overview' : tab === 'pages' ? 'Top Pages' : 'Live Feed'}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-indigo-400" /> Traffic Trend
            </h4>
            <SimpleLineChart data={data.dailyViews} />
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Globe className="w-4 h-4 text-indigo-400" /> Browsers
            </h4>
            <MiniBarChart
              data={data.browsers.map(b => ({ label: b.browser, value: b.count }))}
              maxVal={Math.max(...data.browsers.map(b => b.count), 1)}
            />
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Monitor className="w-4 h-4 text-indigo-400" /> Devices
            </h4>
            <div className="flex items-center gap-4 flex-wrap">
              {data.devices.map((d, i) => {
                const pct = deviceTotal > 0 ? ((d.count / deviceTotal) * 100).toFixed(1) : '0';
                return (
                  <div key={i} className="flex items-center gap-2 bg-slate-700/30 rounded-lg px-4 py-3 flex-1 min-w-[120px]">
                    <DeviceIcon type={d.deviceType || 'desktop'} />
                    <div>
                      <div className="text-sm font-medium text-white capitalize">{d.deviceType || 'Unknown'}</div>
                      <div className="text-xs text-slate-400">{d.count.toLocaleString()} ({pct}%)</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <ExternalLink className="w-4 h-4 text-indigo-400" /> Top Referrers
            </h4>
            {data.topReferrers.length > 0 ? (
              <MiniBarChart
                data={data.topReferrers.map(r => {
                  let label = 'Direct';
                  try { label = r.referrer ? new URL(r.referrer).hostname : 'Direct'; } catch { label = r.referrer || 'Direct'; }
                  return { label, value: r.count };
                })}
                maxVal={Math.max(...data.topReferrers.map(r => r.count), 1)}
              />
            ) : (
              <div className="text-slate-500 text-sm text-center py-6">No referrer data yet</div>
            )}
          </div>

          <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl p-5 lg:col-span-2">
            <h4 className="text-sm font-semibold text-slate-300 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-400" /> Operating Systems
            </h4>
            <MiniBarChart
              data={data.operatingSystems.map(o => ({ label: o.os, value: o.count }))}
              maxVal={Math.max(...data.operatingSystems.map(o => o.count), 1)}
            />
          </div>
        </div>
      )}

      {activeTab === 'pages' && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-700/50">
                <th className="text-left text-xs font-medium text-slate-400 p-4">Page</th>
                <th className="text-right text-xs font-medium text-slate-400 p-4">Views</th>
                <th className="text-right text-xs font-medium text-slate-400 p-4">Unique</th>
              </tr>
            </thead>
            <tbody>
              {data.topPages.map((page, i) => (
                <tr key={i} className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors">
                  <td className="p-4">
                    <span className="text-sm text-white font-mono">{page.path}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm text-slate-300">{page.views.toLocaleString()}</span>
                  </td>
                  <td className="p-4 text-right">
                    <span className="text-sm text-slate-400">{page.uniqueVisitors?.toLocaleString() || '-'}</span>
                  </td>
                </tr>
              ))}
              {data.topPages.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-slate-500">No page view data yet</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'live' && (
        <div className="bg-slate-800/60 border border-slate-700/50 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-slate-700/50 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm text-slate-300">Recent Page Views</span>
            <Badge variant="outline" className="ml-auto text-slate-400 border-slate-600">{data.recentViews.length} entries</Badge>
          </div>
          <div className="max-h-[500px] overflow-y-auto">
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-800">
                <tr className="border-b border-slate-700/50">
                  <th className="text-left text-xs font-medium text-slate-400 p-3">Time</th>
                  <th className="text-left text-xs font-medium text-slate-400 p-3">Page</th>
                  <th className="text-left text-xs font-medium text-slate-400 p-3">Browser</th>
                  <th className="text-left text-xs font-medium text-slate-400 p-3">Device</th>
                </tr>
              </thead>
              <tbody>
                {data.recentViews.map((view, i) => (
                  <tr key={i} className="border-b border-slate-700/20 hover:bg-slate-700/20 transition-colors">
                    <td className="p-3">
                      <span className="text-xs text-slate-400">
                        {new Date(view.createdAt).toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' })}
                      </span>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-white font-mono">{view.path}</span>
                    </td>
                    <td className="p-3">
                      <span className="text-xs text-slate-400">{view.browser} / {view.os}</span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1 text-slate-400">
                        <DeviceIcon type={view.deviceType || 'desktop'} />
                        <span className="text-xs capitalize">{view.deviceType || 'desktop'}</span>
                      </div>
                    </td>
                  </tr>
                ))}
                {data.recentViews.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-500">No recent page views</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
