'use client';

import { useState, useEffect } from 'react';
import { Server, Database, Clock, Cpu, HardDrive, RefreshCw, Wifi, WifiOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface SystemHealth {
  uptime: number;
  memoryUsage: { rss: number; heapTotal: number; heapUsed: number };
  nodeVersion: string;
  environment: string;
  dbStatus: string;
  dbStats: { tableCount: number; dbSize: string };
  serverTime: string;
  activeAdminSessions: number;
}

interface SystemHealthDashboardProps {
  token: string;
}

export function SystemHealthDashboard({ token }: SystemHealthDashboardProps) {
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(30);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchHealth = async () => {
    try {
      setIsRefreshing(true);
      setError(null);
      const response = await fetch('/api/superadmin/system-health', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch system health: ${response.status}`);
      }

      const data = await response.json();
      setHealth(data);
      setCountdown(30);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch system health');
      console.error('Error fetching system health:', err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHealth();
  }, [token]);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          fetchHealth();
          return 30;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [token]);

  const formatUptime = (seconds: number): string => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    return `${days}d ${hours}h ${minutes}m ${secs}s`;
  };

  const getMemoryPercentage = (used: number, total: number): number => {
    return (used / total) * 100;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-slate-700/30 rounded-xl" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !health) {
    return (
      <div className="bg-slate-800/50 border border-red-500/50 rounded-xl p-6">
        <div className="flex items-center gap-3">
          <WifiOff className="w-5 h-5 text-red-400" />
          <div>
            <h3 className="text-white font-semibold">System Health Unavailable</h3>
            <p className="text-sm text-slate-400">{error || 'Failed to load system health data'}</p>
          </div>
        </div>
        <Button
          onClick={fetchHealth}
          variant="outline"
          size="sm"
          className="mt-4 border-red-500/50 text-red-400 hover:bg-red-500/20"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  const rssPercent = getMemoryPercentage(health.memoryUsage.rss, health.memoryUsage.heapTotal);
  const heapPercent = getMemoryPercentage(health.memoryUsage.heapUsed, health.memoryUsage.heapTotal);

  return (
    <div className="space-y-6">
      {/* Header with refresh */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Server className="w-5 h-5 text-blue-400" />
          System Health
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-slate-400">
            Next refresh in {countdown}s
          </span>
          <Button
            onClick={fetchHealth}
            disabled={isRefreshing}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh Now
          </Button>
        </div>
      </div>

      {/* Top Stats Row - 4 Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Uptime Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-400">Uptime</h3>
            <Clock className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {formatUptime(health.uptime)}
          </p>
        </div>

        {/* Memory Usage Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-400">Memory Usage</h3>
            <Cpu className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {health.memoryUsage.heapUsed.toFixed(1)} MB
          </p>
          <p className="text-xs text-slate-500 mt-1">
            of {health.memoryUsage.heapTotal.toFixed(1)} MB
          </p>
        </div>

        {/* DB Status Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-400">DB Status</h3>
            <Database className="w-4 h-4 text-green-400" />
          </div>
          <div className="flex items-center gap-2 mt-2">
            <div className={`w-2 h-2 rounded-full ${health.dbStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'}`} />
            <Badge className={health.dbStatus === 'connected'
              ? 'bg-green-500/20 text-green-400 border-green-500/30'
              : 'bg-red-500/20 text-red-400 border-red-500/30'
            }>
              {health.dbStatus.charAt(0).toUpperCase() + health.dbStatus.slice(1)}
            </Badge>
          </div>
        </div>

        {/* Active Sessions Card */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-start justify-between mb-2">
            <h3 className="text-sm font-medium text-slate-400">Active Sessions</h3>
            <Wifi className="w-4 h-4 text-orange-400" />
          </div>
          <p className="text-2xl font-bold text-white font-mono">
            {health.activeAdminSessions}
          </p>
          <p className="text-xs text-slate-500 mt-1">admin sessions</p>
        </div>
      </div>

      {/* Memory Breakdown Bar */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <h3 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
          <HardDrive className="w-4 h-4 text-slate-400" />
          Memory Breakdown
        </h3>

        <div className="space-y-4">
          {/* RSS Memory */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Resident Set Size (RSS)</span>
              <span className="text-sm font-medium text-white">
                {health.memoryUsage.rss.toFixed(1)} MB
                <span className="text-slate-500 ml-1">
                  ({rssPercent.toFixed(1)}%)
                </span>
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-blue-600"
                style={{ width: `${Math.min(rssPercent, 100)}%` }}
              />
            </div>
          </div>

          {/* Heap Total */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Heap Total</span>
              <span className="text-sm font-medium text-white">
                {health.memoryUsage.heapTotal.toFixed(1)} MB
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-slate-500 to-slate-600"
                style={{ width: '100%' }}
              />
            </div>
          </div>

          {/* Heap Used */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Heap Used</span>
              <span className="text-sm font-medium text-white">
                {health.memoryUsage.heapUsed.toFixed(1)} MB
                <span className="text-slate-500 ml-1">
                  ({heapPercent.toFixed(1)}%)
                </span>
              </span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-orange-500 to-orange-600"
                style={{ width: `${heapPercent}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* System Info Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Property</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              <tr className="hover:bg-slate-700/30">
                <td className="px-4 py-3 text-sm text-slate-400">Node Version</td>
                <td className="px-4 py-3 text-sm font-mono text-white">{health.nodeVersion}</td>
              </tr>
              <tr className="hover:bg-slate-700/30">
                <td className="px-4 py-3 text-sm text-slate-400">Environment</td>
                <td className="px-4 py-3 text-sm">
                  <Badge className="bg-slate-600/50 text-slate-300">
                    {health.environment}
                  </Badge>
                </td>
              </tr>
              <tr className="hover:bg-slate-700/30">
                <td className="px-4 py-3 text-sm text-slate-400">Server Time</td>
                <td className="px-4 py-3 text-sm font-mono text-white">
                  {new Date(health.serverTime).toLocaleString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                    hour12: true
                  })}
                </td>
              </tr>
              <tr className="hover:bg-slate-700/30">
                <td className="px-4 py-3 text-sm text-slate-400">Database Size</td>
                <td className="px-4 py-3 text-sm font-mono text-white">{health.dbStats.dbSize}</td>
              </tr>
              <tr className="hover:bg-slate-700/30">
                <td className="px-4 py-3 text-sm text-slate-400">Table Count</td>
                <td className="px-4 py-3 text-sm font-mono text-white">{health.dbStats.tableCount}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
