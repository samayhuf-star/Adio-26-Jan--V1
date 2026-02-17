import { useState, useEffect } from 'react';
import { 
  Brain, RefreshCw, Zap, DollarSign, Activity, 
  TrendingUp, Users, Clock, AlertTriangle
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface AIUsageOverview {
  totalRequests: number;
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalCostCents: number;
  todayRequests: number;
  todayTokens: number;
  todayCostCents: number;
}

interface ModelUsage {
  model: string;
  requests: number;
  tokens: number;
  costCents: number;
}

interface FeatureUsage {
  feature: string;
  requests: number;
  tokens: number;
  costCents: number;
}

interface DailyTrend {
  date: string;
  requests: number;
  tokens: number;
  costCents: number;
}

interface TopUser {
  userId: string;
  requests: number;
  tokens: number;
  costCents: number;
}

interface RecentLog {
  id: string;
  user_id: string;
  feature: string;
  model: string;
  prompt_tokens: number;
  completion_tokens: number;
  total_tokens: number;
  cost_cents: string;
  duration_ms: number;
  status: string;
  created_at: string;
}

interface AIUsageDashboardProps {
  token: string;
}

export function AIUsageDashboard({ token }: AIUsageDashboardProps) {
  const [loading, setLoading] = useState(true);
  const [overview, setOverview] = useState<AIUsageOverview>({
    totalRequests: 0, totalTokens: 0, totalPromptTokens: 0, totalCompletionTokens: 0,
    totalCostCents: 0, todayRequests: 0, todayTokens: 0, todayCostCents: 0,
  });
  const [byModel, setByModel] = useState<ModelUsage[]>([]);
  const [byFeature, setByFeature] = useState<FeatureUsage[]>([]);
  const [dailyTrend, setDailyTrend] = useState<DailyTrend[]>([]);
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/superadmin/ai-usage', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setOverview(data.overview);
        setByModel(data.byModel || []);
        setByFeature(data.byFeature || []);
        setDailyTrend(data.dailyTrend || []);
        setTopUsers(data.topUsers || []);
        setRecentLogs(data.recentLogs || []);
      }
    } catch (err) {
      console.error('Failed to load AI usage:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  const formatCost = (cents: number) => {
    if (cents < 100) return `${cents.toFixed(2)}¢`;
    return `$${(cents / 100).toFixed(2)}`;
  };

  const formatTokens = (n: number) => {
    if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
    if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
    return String(n);
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const formatTime = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + 
      ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const maxDailyTokens = Math.max(...dailyTrend.map(d => d.tokens), 1);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-400" />
            AI Usage Tracking
          </h3>
          <p className="text-sm text-slate-400 mt-1">Monitor OpenAI API usage, tokens, and costs</p>
        </div>
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
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-6 h-6 text-slate-400 animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Zap className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Total Requests</p>
                  <p className="text-2xl font-bold text-white">{overview.totalRequests.toLocaleString()}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">Today: {overview.todayRequests.toLocaleString()}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Activity className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Total Tokens</p>
                  <p className="text-2xl font-bold text-white">{formatTokens(overview.totalTokens)}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Prompt: {formatTokens(overview.totalPromptTokens)} | Completion: {formatTokens(overview.totalCompletionTokens)}
              </p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Total Cost</p>
                  <p className="text-2xl font-bold text-white">{formatCost(overview.totalCostCents)}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500">Today: {formatCost(overview.todayCostCents)}</p>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-slate-400 uppercase tracking-wider">Avg Cost/Request</p>
                  <p className="text-2xl font-bold text-white">
                    {overview.totalRequests > 0 
                      ? formatCost(overview.totalCostCents / overview.totalRequests) 
                      : '—'}
                  </p>
                </div>
              </div>
              <p className="text-xs text-slate-500">
                Avg tokens: {overview.totalRequests > 0 ? Math.round(overview.totalTokens / overview.totalRequests).toLocaleString() : '—'}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {dailyTrend.length > 0 && (
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                <h4 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-400" />
                  Daily Token Usage (30 days)
                </h4>
                <div className="space-y-2">
                  {dailyTrend.slice(0, 14).map((day) => (
                    <div key={day.date} className="flex items-center gap-3">
                      <span className="text-xs text-slate-400 w-16 flex-shrink-0">{formatDate(day.date)}</span>
                      <div className="flex-1 bg-slate-900/50 rounded-full h-5 overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-end pr-2"
                          style={{ width: `${Math.max(4, (day.tokens / maxDailyTokens) * 100)}%` }}
                        >
                          <span className="text-[10px] text-white font-medium">{formatTokens(day.tokens)}</span>
                        </div>
                      </div>
                      <span className="text-xs text-slate-500 w-14 text-right">{formatCost(day.costCents)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-6">
              {byModel.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-purple-400" />
                    Usage by Model
                  </h4>
                  <div className="space-y-3">
                    {byModel.map((m) => (
                      <div key={m.model} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-white">{m.model}</p>
                          <p className="text-xs text-slate-400">{m.requests} requests</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">{formatCost(m.costCents)}</p>
                          <p className="text-xs text-slate-400">{formatTokens(m.tokens)} tokens</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {byFeature.length > 0 && (
                <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
                  <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-amber-400" />
                    Usage by Feature
                  </h4>
                  <div className="space-y-3">
                    {byFeature.map((f) => (
                      <div key={f.feature} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                        <div>
                          <p className="text-sm font-medium text-white capitalize">{f.feature.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-slate-400">{f.requests} requests</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium text-white">{formatCost(f.costCents)}</p>
                          <p className="text-xs text-slate-400">{formatTokens(f.tokens)} tokens</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {topUsers.length > 0 && (
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
              <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                <Users className="w-4 h-4 text-emerald-400" />
                Top Users by Cost
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700/50">
                      <th className="text-left py-2 px-3">User ID</th>
                      <th className="text-right py-2 px-3">Requests</th>
                      <th className="text-right py-2 px-3">Tokens</th>
                      <th className="text-right py-2 px-3">Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topUsers.map((u) => (
                      <tr key={u.userId} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                        <td className="py-2 px-3 text-white font-mono text-xs truncate max-w-[200px]">{u.userId}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{u.requests.toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{formatTokens(u.tokens)}</td>
                        <td className="py-2 px-3 text-right text-emerald-400 font-medium">{formatCost(u.costCents)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-5">
            <h4 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
              <Clock className="w-4 h-4 text-slate-400" />
              Recent API Calls
            </h4>
            {recentLogs.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                <Brain className="w-10 h-10 mb-3 opacity-50" />
                <p className="text-sm">No AI API calls recorded yet</p>
                <p className="text-xs mt-1">Usage will appear here as features are used</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-700/50">
                      <th className="text-left py-2 px-3">Time</th>
                      <th className="text-left py-2 px-3">Feature</th>
                      <th className="text-left py-2 px-3">Model</th>
                      <th className="text-right py-2 px-3">Tokens</th>
                      <th className="text-right py-2 px-3">Cost</th>
                      <th className="text-right py-2 px-3">Duration</th>
                      <th className="text-center py-2 px-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentLogs.map((log) => (
                      <tr key={log.id} className="border-b border-slate-700/30 hover:bg-slate-700/20">
                        <td className="py-2 px-3 text-slate-300 text-xs">{formatTime(log.created_at)}</td>
                        <td className="py-2 px-3 text-white capitalize">{log.feature.replace(/_/g, ' ')}</td>
                        <td className="py-2 px-3 text-slate-300 font-mono text-xs">{log.model}</td>
                        <td className="py-2 px-3 text-right text-slate-300">{Number(log.total_tokens).toLocaleString()}</td>
                        <td className="py-2 px-3 text-right text-emerald-400">{formatCost(Number(log.cost_cents))}</td>
                        <td className="py-2 px-3 text-right text-slate-400">{log.duration_ms ? `${log.duration_ms}ms` : '—'}</td>
                        <td className="py-2 px-3 text-center">
                          <Badge className={log.status === 'success' 
                            ? 'bg-green-500/20 text-green-400 border-green-500/30' 
                            : 'bg-red-500/20 text-red-400 border-red-500/30'
                          }>
                            {log.status}
                          </Badge>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {overview.totalRequests === 0 && byModel.length === 0 && (
            <div className="bg-slate-800/30 border border-dashed border-slate-600 rounded-xl p-8 text-center">
              <Brain className="w-16 h-16 text-purple-400/30 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-slate-300 mb-2">No AI Usage Data Yet</h4>
              <p className="text-sm text-slate-500 max-w-md mx-auto">
                AI usage will be tracked automatically when users interact with features like campaign generation, keyword suggestions, ad writing, and blog generation.
              </p>
            </div>
          )}
        </>
      )}
    </div>
  );
}