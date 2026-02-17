import { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  CheckCircle,
  XCircle,
  BarChart3,
  RefreshCw,
  Eye,
  MousePointerClick
} from 'lucide-react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface RecentEmail {
  id: string;
  to: string;
  subject: string;
  status: string;
  opened: boolean;
  clicked: boolean;
  sentAt: string;
}

interface DailyStat {
  date: string;
  count: number;
  delivered: number;
  opened: number;
}

interface EmailMonitoringData {
  sentToday: number;
  deliveryRate: number;
  openRate: number;
  bounceRate: number;
  totalSent: number;
  recentEmails: RecentEmail[];
  dailyStats: DailyStat[];
}

interface EmailMonitoringDashboardProps {
  token: string;
}

export function EmailMonitoringDashboard({ token }: EmailMonitoringDashboardProps) {
  const [data, setData] = useState<EmailMonitoringData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/superadmin/email-monitoring', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch email monitoring data');
      }

      const rawData = await response.json();
      
      // Transform raw response to match expected data shape
      const transformedData: EmailMonitoringData = {
        sentToday: rawData.sentToday || 0,
        deliveryRate: rawData.deliveryRate || 0,
        openRate: rawData.openRate || 0,
        bounceRate: rawData.bounceRate || 0,
        totalSent: rawData.totalSent || 0,
        recentEmails: (rawData.recentEmails || []).map((email: any) => ({
          id: email.id,
          to: email.to || email.recipient_email,
          subject: email.subject,
          status: email.status,
          opened: email.opened,
          clicked: email.clicked,
          sentAt: email.sentAt || email.created_at
        })),
        dailyStats: rawData.dailyStats || []
      };

      setData(transformedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'delivered':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
            Delivered
          </Badge>
        );
      case 'sent':
        return (
          <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
            Sent
          </Badge>
        );
      case 'bounced':
      case 'failed':
        return (
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            {status === 'bounced' ? 'Bounced' : 'Failed'}
          </Badge>
        );
      default:
        return (
          <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">
            {status}
          </Badge>
        );
    }
  };

  const truncateSubject = (subject: string, maxLength: number = 40) => {
    if (subject.length <= maxLength) return subject;
    return subject.substring(0, maxLength) + '...';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const getDayLabel = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'short'
      });
    } catch {
      return dateStr;
    }
  };

  // Find max value for chart scaling
  const maxChartValue = data
    ? Math.max(
        ...data.dailyStats.map(stat => Math.max(stat.count, stat.delivered, stat.opened)),
        1
      )
    : 1;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-slate-400" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="text-center py-12">
        <Mail className="w-12 h-12 mx-auto mb-4 text-slate-400" />
        <p className="text-slate-300 font-medium">{error || 'No data available'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center">
            <Mail className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">Email Monitoring</h2>
            <p className="text-sm text-slate-400">Track email delivery and engagement</p>
          </div>
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

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatCard
          title="Total Sent"
          value={data.totalSent}
          icon={<Send className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Sent Today"
          value={data.sentToday}
          icon={<Mail className="w-5 h-5" />}
          color="cyan"
        />
        <StatCard
          title="Delivery Rate"
          value={`${data.deliveryRate}%`}
          icon={<CheckCircle className="w-5 h-5" />}
          color="green"
        />
        <StatCard
          title="Open Rate"
          value={`${data.openRate}%`}
          icon={<Eye className="w-5 h-5" />}
          color="blue"
        />
        <StatCard
          title="Bounce Rate"
          value={`${data.bounceRate}%`}
          icon={<XCircle className="w-5 h-5" />}
          color="orange"
        />
      </div>

      {/* Daily Stats Chart */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <BarChart3 className="w-5 h-5 text-slate-300" />
          <h3 className="text-lg font-semibold text-white">Daily Statistics (Last 7 Days)</h3>
        </div>

        {data.dailyStats.length === 0 ? (
          <div className="text-center py-8 text-slate-400">
            No data available
          </div>
        ) : (
          <div className="space-y-6">
            {/* Bar Chart */}
            <div className="flex items-flex-end gap-4 overflow-x-auto pb-4">
              {data.dailyStats.map((stat, index) => (
                <div key={index} className="flex flex-col items-center gap-2 min-w-max">
                  <div className="h-40 flex items-flex-end gap-1">
                    {/* Sent Bar (Blue) */}
                    <div
                      className="w-3 bg-blue-500/70 rounded-t hover:bg-blue-500 transition-colors group relative"
                      style={{
                        height: `${(stat.count / maxChartValue) * 100}%`,
                        minHeight: '4px'
                      }}
                    >
                      <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap mb-1">
                        Sent: {stat.count}
                      </div>
                    </div>

                    {/* Delivered Bar (Green) */}
                    <div
                      className="w-3 bg-green-500/70 rounded-t hover:bg-green-500 transition-colors group relative"
                      style={{
                        height: `${(stat.delivered / maxChartValue) * 100}%`,
                        minHeight: '4px'
                      }}
                    >
                      <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap mb-1">
                        Delivered: {stat.delivered}
                      </div>
                    </div>

                    {/* Opened Bar (Purple) */}
                    <div
                      className="w-3 bg-purple-500/70 rounded-t hover:bg-purple-500 transition-colors group relative"
                      style={{
                        height: `${(stat.opened / maxChartValue) * 100}%`,
                        minHeight: '4px'
                      }}
                    >
                      <div className="invisible group-hover:visible absolute bottom-full left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap mb-1">
                        Opened: {stat.opened}
                      </div>
                    </div>
                  </div>

                  {/* Day Label */}
                  <span className="text-xs text-slate-400 text-center">
                    {getDayLabel(stat.date)}
                  </span>
                </div>
              ))}
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center gap-6 pt-4 border-t border-slate-700/50">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500/70 rounded"></div>
                <span className="text-sm text-slate-400">Sent</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500/70 rounded"></div>
                <span className="text-sm text-slate-400">Delivered</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-purple-500/70 rounded"></div>
                <span className="text-sm text-slate-400">Opened</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Recent Emails Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="p-6 border-b border-slate-700/50">
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Mail className="w-5 h-5 text-slate-300" />
            Recent Emails
          </h3>
        </div>

        <div className="overflow-x-auto">
          {data.recentEmails.length === 0 ? (
            <div className="text-center py-8 text-slate-400">
              <Mail className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No recent emails</p>
            </div>
          ) : (
            <table className="w-full">
              <thead className="bg-slate-700/30">
                <tr>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">
                    Recipient
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">
                    Subject
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">
                    Status
                  </th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-300">
                    Opened
                  </th>
                  <th className="text-center px-6 py-3 text-sm font-medium text-slate-300">
                    Clicked
                  </th>
                  <th className="text-left px-6 py-3 text-sm font-medium text-slate-300">
                    Sent
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {data.recentEmails.map((email) => (
                  <tr key={email.id} className="hover:bg-slate-700/20 transition-colors">
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-300 truncate">{email.to}</p>
                    </td>
                    <td className="px-6 py-4">
                      <p
                        className="text-sm text-slate-300 truncate max-w-xs"
                        title={email.subject}
                      >
                        {truncateSubject(email.subject)}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(email.status)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {email.opened ? (
                        <CheckCircle className="w-5 h-5 text-green-400 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {email.clicked ? (
                        <MousePointerClick className="w-5 h-5 text-green-400 mx-auto" />
                      ) : (
                        <XCircle className="w-5 h-5 text-slate-600 mx-auto" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm text-slate-400">
                        {formatDate(email.sentAt)}
                      </p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'cyan' | 'green' | 'orange' | 'purple';
}

function StatCard({ title, value, icon, color }: StatCardProps) {
  const colorClasses: Record<string, string> = {
    blue: 'from-blue-500 to-blue-600',
    cyan: 'from-cyan-500 to-blue-500',
    green: 'from-green-500 to-emerald-600',
    orange: 'from-orange-500 to-red-600',
    purple: 'from-purple-500 to-pink-600'
  };

  const iconColorClasses: Record<string, string> = {
    blue: 'text-blue-300',
    cyan: 'text-cyan-300',
    green: 'text-green-300',
    orange: 'text-orange-300',
    purple: 'text-purple-300'
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 bg-gradient-to-br ${colorClasses[color]} rounded-lg flex items-center justify-center`}>
          <div className={iconColorClasses[color]}>
            {icon}
          </div>
        </div>
      </div>
      <h3 className="text-slate-400 text-sm font-medium mb-2">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
