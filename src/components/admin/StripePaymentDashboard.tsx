import { useState, useEffect, useCallback } from 'react';
import {
  DollarSign, TrendingUp, CreditCard, Users, Activity, RefreshCw
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface StripeDashboardData {
  totalRevenue: number;
  mrr: number;
  lifetimeDeals: number;
  lifetimeRevenue: number;
  churnRate: number;
  recentTransactions: Array<{
    amount: number;
    currency: string;
    status: string;
    created: string;
    customerEmail: string | null;
    description: string | null;
  }>;
  planDistribution: Array<{ plan: string; count: number }>;
}

interface StripePaymentDashboardProps {
  token: string;
}

const PLAN_COLORS: Record<string, string> = {
  starter: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  professional: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  enterprise: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  lifetime: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  free: 'bg-slate-500/20 text-slate-400 border-slate-500/30',
  trial: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
};

function getPlanColor(plan: string): string {
  const key = plan.toLowerCase();
  for (const [k, v] of Object.entries(PLAN_COLORS)) {
    if (key.includes(k)) return v;
  }
  return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30';
}

function formatUSD(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
}

function formatUSDDollars(dollars: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(dollars);
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

function getStatusBadge(status: string) {
  switch (status) {
    case 'succeeded':
      return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Succeeded</Badge>;
    case 'failed':
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Failed</Badge>;
    case 'pending':
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pending</Badge>;
    default:
      return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
  }
}

export function StripePaymentDashboard({ token }: StripePaymentDashboardProps) {
  const [data, setData] = useState<StripeDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/superadmin/stripe-dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to fetch Stripe dashboard data (${res.status})`);
      }
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Failed to load Stripe data');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading && !data) {
    return (
      <div className="flex items-center justify-center py-20">
        <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
        <span className="ml-3 text-slate-400 text-lg">Loading Stripe data...</span>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-6 text-center">
        <p className="text-red-400 mb-4">{error}</p>
        <Button
          onClick={fetchData}
          variant="outline"
          className="border-red-500/50 text-red-400 hover:bg-red-500/20"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-white flex items-center gap-2">
          <Activity className="w-5 h-5 text-green-400" />
          Stripe Payment Dashboard
        </h2>
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

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Total Revenue</span>
            <div className="w-9 h-9 bg-green-500/20 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{formatUSD(data.totalRevenue)}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">MRR</span>
            <div className="w-9 h-9 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-blue-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{formatUSDDollars(data.mrr)}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Lifetime Deals</span>
            <div className="w-9 h-9 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-purple-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{data.lifetimeDeals}</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-slate-400">Churn Rate</span>
            <div className="w-9 h-9 bg-red-500/20 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-red-400" />
            </div>
          </div>
          <p className="text-3xl font-bold text-white">{data.churnRate.toFixed(1)}%</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-400" />
            Plan Distribution
          </h3>
          <div className="flex flex-wrap gap-3">
            {data.planDistribution.map((item) => (
              <div key={item.plan} className="flex items-center gap-2">
                <Badge className={getPlanColor(item.plan)}>
                  {item.plan}
                </Badge>
                <span className="text-white font-medium">{item.count}</span>
              </div>
            ))}
            {data.planDistribution.length === 0 && (
              <p className="text-slate-500 text-sm">No plan data available</p>
            )}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            Lifetime Revenue
          </h3>
          <p className="text-3xl font-bold text-white">{formatUSDDollars(data.lifetimeRevenue)}</p>
          <p className="text-sm text-slate-400 mt-2">From all lifetime deal purchases</p>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-6 pb-3">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-green-400" />
            Recent Transactions
          </h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Date</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Customer</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Description</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Amount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {data.recentTransactions.map((tx, i) => (
                <tr key={i} className="hover:bg-slate-700/30">
                  <td className="px-4 py-3 text-slate-400 text-sm">{formatDate(tx.created)}</td>
                  <td className="px-4 py-3 text-white text-sm">{tx.customerEmail || 'Unknown'}</td>
                  <td className="px-4 py-3 text-slate-400 text-sm">{tx.description || '—'}</td>
                  <td className="px-4 py-3 text-white font-medium text-sm">
                    {formatUSD(tx.amount)}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(tx.status)}</td>
                </tr>
              ))}
              {data.recentTransactions.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-slate-500">
                    No recent transactions
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}