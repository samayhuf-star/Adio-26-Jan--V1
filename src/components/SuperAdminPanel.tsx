import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Users, CreditCard, Database, FileText, Mail, Shield, 
  AlertTriangle, Activity, Settings, LogOut, ChevronRight, Search, 
  RefreshCw, Download, Trash2, Edit, Eye, Ban, CheckCircle, XCircle,
  Clock, TrendingUp, DollarSign, Server, Zap, Globe, Lock, Key,
  BarChart3, PieChart, ArrowUpRight, ArrowDownRight, Filter, MoreVertical,
  Bell, UserCheck, UserX, History, FileWarning, Send, Inbox, AlertCircle,
  Menu, X, BookOpen, GitBranch, BarChart
} from 'lucide-react';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Input } from './ui/input';
import { useAuthCompat } from '../utils/authCompat';
import BlogGenerator from './BlogGenerator';
import EmailFlows from './admin/EmailFlows';
import EmailLogs from './admin/EmailLogs';

interface SuperAdminPanelProps {
  user: any;
  onLogout: () => void;
}

type AdminSection = 'dashboard' | 'users' | 'subscriptions' | 'database' | 'logs' | 'emails' | 'security' | 'settings' | 'blogs';

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  errorCount: number;
  activeTrials: number;
  emailsSent: number;
}

interface UserRecord {
  id: string;
  email: string;
  full_name: string;
  role: string;
  subscription_plan: string;
  subscription_status: string;
  created_at: string;
  last_sign_in: string;
  is_blocked: boolean;
}

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  source: string;
  message: string;
  details?: any;
}

interface SecurityRule {
  id: string;
  type: 'ip_block' | 'rate_limit' | 'access_rule';
  value: string;
  reason: string;
  created_at: string;
  active: boolean;
}

export function SuperAdminPanel({ user, onLogout }: SuperAdminPanelProps) {
  const [activeSection, setActiveSection] = useState<AdminSection>('dashboard');
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Get PocketBase auth context for token retrieval
  const { getToken } = useAuthCompat();
  
  // Helper to get admin headers for API calls
  const getAdminHeaders = async (): Promise<HeadersInit> => {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'X-Admin-Email': user?.email || ''
    };
    
    // Get PocketBase token for authentication
    try {
      const token = await getToken();
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Failed to get PocketBase token:', error);
    }
    
    return headers;
  };
  
  // Helper for authenticated fetch
  const adminFetch = async (url: string, options: RequestInit = {}) => {
    const headers = await getAdminHeaders();
    return fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...(options.headers || {})
      }
    });
  };
  
  // Dashboard stats
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    errorCount: 0,
    activeTrials: 0,
    emailsSent: 0
  });
  
  // Users
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  
  // Logs
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [logFilter, setLogFilter] = useState<'all' | 'info' | 'warning' | 'error'>('all');
  
  // Security
  const [securityRules, setSecurityRules] = useState<SecurityRule[]>([]);
  const [newRuleType, setNewRuleType] = useState<'ip_block' | 'rate_limit' | 'access_rule'>('ip_block');
  const [newRuleValue, setNewRuleValue] = useState('');
  const [newRuleReason, setNewRuleReason] = useState('');
  
  // Database tables
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableColumns, setTableColumns] = useState<string[]>([]);
  
  // Recent activity
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  
  // Billing stats
  const [billingStats, setBillingStats] = useState<any>({
    lifetimePlans: 0,
    churnRate: 0,
    planBreakdown: []
  });
  
  // Email stats
  const [emailStats, setEmailStats] = useState<any>({
    sentToday: 0,
    deliveryRate: 0,
    openRate: 0,
    bounceRate: 0,
    templates: []
  });

  // Fetch dashboard stats
  useEffect(() => {
    fetchDashboardStats();
    fetchRecentActivity();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/admin/stats');
      if (response.ok) {
        const result = await response.json();
        // Handle nested data structure from API
        const statsData = result.data || result;
        setStats({
          totalUsers: statsData.totalUsers || 0,
          activeSubscriptions: statsData.activeSubscriptions || 0,
          monthlyRevenue: statsData.monthlyRevenue || 0,
          errorCount: statsData.errorCount || 0,
          activeTrials: statsData.activeTrials || 0,
          emailsSent: statsData.emailsSent || 0
        });
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const fetchRecentActivity = async () => {
    try {
      const response = await adminFetch('/api/admin/activity');
      if (response.ok) {
        const result = await response.json();
        setRecentActivity(result.data?.activities || []);
      }
    } catch (error) {
      console.error('Failed to fetch activity:', error);
    }
  };
  
  const fetchBillingStats = async () => {
    try {
      const response = await adminFetch('/api/admin/billing/stats');
      if (response.ok) {
        const result = await response.json();
        setBillingStats(result.data || { lifetimePlans: 0, churnRate: 0, planBreakdown: [] });
      }
    } catch (error) {
      console.error('Failed to fetch billing stats:', error);
    }
  };
  
  const fetchEmailStats = async () => {
    try {
      const response = await adminFetch('/api/admin/email/stats');
      if (response.ok) {
        const result = await response.json();
        setEmailStats(result.data || { sentToday: 0, deliveryRate: 0, openRate: 0, bounceRate: 0, templates: [] });
      }
    } catch (error) {
      console.error('Failed to fetch email stats:', error);
    }
  };
  
  const formatTimeAgo = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins} min${mins > 1 ? 's' : ''} ago`;
    if (hours < 24) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    return `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/admin/users');
      if (response.ok) {
        const result = await response.json();
        // Handle nested data structure from API
        const usersData = result.data?.users || result.users || [];
        setUsers(usersData);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const response = await adminFetch(`/api/admin/logs?level=${logFilter}`);
      if (response.ok) {
        const result = await response.json();
        // Handle nested data structure from API
        const logsData = result.data?.logs || result.logs || [];
        setLogs(logsData);
      }
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSecurityRules = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/admin/security/rules');
      if (response.ok) {
        const result = await response.json();
        // Handle nested data structure from API
        const rulesData = result.data?.rules || result.rules || [];
        setSecurityRules(rulesData);
      }
    } catch (error) {
      console.error('Failed to fetch security rules:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTables = async () => {
    setLoading(true);
    try {
      const response = await adminFetch('/api/admin/database/tables');
      if (response.ok) {
        const result = await response.json();
        // Handle nested data structure from API
        const tablesData = result.data?.tables || result.tables || [];
        setTables(tablesData);
      }
    } catch (error) {
      console.error('Failed to fetch tables:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    try {
      const response = await adminFetch(`/api/admin/database/table/${tableName}`);
      if (response.ok) {
        const result = await response.json();
        // Handle nested data structure from API
        const rowsData = result.data?.rows || result.rows || [];
        const columnsData = result.data?.columns || result.columns || [];
        setTableData(rowsData);
        setTableColumns(columnsData);
        setSelectedTable(tableName);
      }
    } catch (error) {
      console.error('Failed to fetch table data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBlockUser = async (userId: string, block: boolean) => {
    try {
      const response = await adminFetch(`/api/admin/users/${userId}/block`, {
        method: 'POST',
        body: JSON.stringify({ blocked: block })
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to block/unblock user:', error);
    }
  };

  const handleUpdateUserRole = async (userId: string, role: string) => {
    try {
      const response = await adminFetch(`/api/admin/users/${userId}/role`, {
        method: 'POST',
        body: JSON.stringify({ role })
      });
      if (response.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to update user role:', error);
    }
  };

  const handleAddSecurityRule = async () => {
    if (!newRuleValue || !newRuleReason) return;
    
    try {
      const response = await adminFetch('/api/admin/security/rules', {
        method: 'POST',
        body: JSON.stringify({
          type: newRuleType,
          value: newRuleValue,
          reason: newRuleReason
        })
      });
      if (response.ok) {
        setNewRuleValue('');
        setNewRuleReason('');
        fetchSecurityRules();
      }
    } catch (error) {
      console.error('Failed to add security rule:', error);
    }
  };

  const handleDeleteSecurityRule = async (ruleId: string) => {
    try {
      const response = await adminFetch(`/api/admin/security/rules/${ruleId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        fetchSecurityRules();
      }
    } catch (error) {
      console.error('Failed to delete security rule:', error);
    }
  };

  useEffect(() => {
    if (activeSection === 'users') fetchUsers();
    else if (activeSection === 'logs') fetchLogs();
    else if (activeSection === 'security') fetchSecurityRules();
    else if (activeSection === 'database') fetchTables();
    else if (activeSection === 'subscriptions') fetchBillingStats();
    else if (activeSection === 'emails') fetchEmailStats();
  }, [activeSection]);

  useEffect(() => {
    if (activeSection === 'logs') fetchLogs();
  }, [logFilter]);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'subscriptions', label: 'Billing', icon: CreditCard },
    { id: 'database', label: 'Database', icon: Database },
    { id: 'logs', label: 'System Logs', icon: FileText },
    { id: 'emails', label: 'Email Management', icon: Mail },
    { id: 'blogs', label: 'Blog Generator', icon: BookOpen },
    { id: 'security', label: 'Security & Firewall', icon: Shield },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const renderDashboard = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg sm:text-2xl font-bold text-white">Admin Dashboard</h2>
        <Button onClick={fetchDashboardStats} variant="outline" size="sm" className="text-xs sm:text-sm">
          <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-4">
        <div className="bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Users className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" />
            <span className="text-gray-400 text-xs sm:text-sm">Total Users</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-white">{stats?.totalUsers ?? 0}</div>
        </div>
        
        <div className="bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <CreditCard className="w-4 h-4 sm:w-5 sm:h-5 text-green-400" />
            <span className="text-gray-400 text-xs sm:text-sm">Active Subs</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-white">{stats?.activeSubscriptions ?? 0}</div>
        </div>
        
        <div className="bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" />
            <span className="text-gray-400 text-xs sm:text-sm">Revenue</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-white">${(stats?.monthlyRevenue ?? 0).toFixed(0)}</div>
        </div>
        
        <div className="bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-red-400" />
            <span className="text-gray-400 text-xs sm:text-sm">Errors</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-white">{stats?.errorCount ?? 0}</div>
        </div>
        
        <div className="bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-purple-400" />
            <span className="text-gray-400 text-xs sm:text-sm">Trials</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-white">{stats?.activeTrials ?? 0}</div>
        </div>
        
        <div className="bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl p-2.5 sm:p-4">
          <div className="flex items-center gap-1.5 sm:gap-2 mb-1 sm:mb-2">
            <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            <span className="text-gray-400 text-xs sm:text-sm">Emails</span>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-white">{stats?.emailsSent ?? 0}</div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        <button 
          onClick={() => setActiveSection('users')}
          className="bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-blue-500/50 transition-all text-left"
        >
          <Users className="w-6 h-6 sm:w-8 sm:h-8 text-blue-400 mb-1.5 sm:mb-2" />
          <h3 className="text-white font-semibold text-sm sm:text-base">Manage Users</h3>
          <p className="text-gray-400 text-xs sm:text-sm">View, edit, block users</p>
        </button>
        
        <button 
          onClick={() => setActiveSection('subscriptions')}
          className="bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-green-500/50 transition-all text-left"
        >
          <CreditCard className="w-6 h-6 sm:w-8 sm:h-8 text-green-400 mb-1.5 sm:mb-2" />
          <h3 className="text-white font-semibold text-sm sm:text-base">Billing</h3>
          <p className="text-gray-400 text-xs sm:text-sm">Subscriptions & payments</p>
        </button>
        
        <button 
          onClick={() => setActiveSection('logs')}
          className="bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-amber-500/50 transition-all text-left"
        >
          <FileText className="w-6 h-6 sm:w-8 sm:h-8 text-amber-400 mb-1.5 sm:mb-2" />
          <h3 className="text-white font-semibold text-sm sm:text-base">View Logs</h3>
          <p className="text-gray-400 text-xs sm:text-sm">System & error logs</p>
        </button>
        
        <button 
          onClick={() => setActiveSection('security')}
          className="bg-slate-800 border border-white/10 rounded-lg sm:rounded-xl p-3 sm:p-4 hover:border-red-500/50 transition-all text-left"
        >
          <Shield className="w-6 h-6 sm:w-8 sm:h-8 text-red-400 mb-1.5 sm:mb-2" />
          <h3 className="text-white font-semibold text-sm sm:text-base">Security</h3>
          <p className="text-gray-400 text-xs sm:text-sm">Firewall & rules</p>
        </button>
      </div>

      {/* Recent Activity */}
      <div className="bg-slate-800 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${
                  activity.type === 'success' ? 'bg-green-400' :
                  activity.type === 'warning' ? 'bg-amber-400' : 'bg-blue-400'
                }`} />
                <div>
                  <p className="text-white text-sm">{activity.action}</p>
                  <p className="text-gray-500 text-xs">{activity.user}</p>
                </div>
              </div>
              <span className="text-gray-500 text-xs">{formatTimeAgo(activity.time)}</span>
            </div>
          )) : (
            <p className="text-gray-500 text-sm text-center py-4">No recent activity</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderUsers = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">User Management</h2>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <Input 
              placeholder="Search users..." 
              className="pl-10 bg-slate-800 border-white/10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button onClick={fetchUsers} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-800 border border-white/10 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left p-4 text-gray-400 font-medium">User</th>
                <th className="text-left p-4 text-gray-400 font-medium">Role</th>
                <th className="text-left p-4 text-gray-400 font-medium">Plan</th>
                <th className="text-left p-4 text-gray-400 font-medium">Status</th>
                <th className="text-left p-4 text-gray-400 font-medium">Joined</th>
                <th className="text-left p-4 text-gray-400 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => 
                u.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
              ).map((u) => (
                <tr key={u.id} className="border-b border-white/5 hover:bg-slate-700/50">
                  <td className="p-4">
                    <div>
                      <p className="text-white font-medium">{u.full_name || 'No name'}</p>
                      <p className="text-gray-400 text-sm">{u.email}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <Badge className={
                      u.role === 'super_admin' ? 'bg-red-500/20 text-red-300' :
                      u.role === 'admin' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-gray-500/20 text-gray-300'
                    }>
                      {u.role}
                    </Badge>
                  </td>
                  <td className="p-4">
                    <Badge className={
                      u.subscription_plan === 'lifetime' ? 'bg-amber-500/20 text-amber-300' :
                      u.subscription_plan === 'pro' ? 'bg-purple-500/20 text-purple-300' :
                      u.subscription_plan === 'basic' ? 'bg-blue-500/20 text-blue-300' :
                      'bg-gray-500/20 text-gray-300'
                    }>
                      {u.subscription_plan || 'free'}
                    </Badge>
                  </td>
                  <td className="p-4">
                    {u.is_blocked ? (
                      <Badge className="bg-red-500/20 text-red-300">Blocked</Badge>
                    ) : u.subscription_status === 'active' ? (
                      <Badge className="bg-green-500/20 text-green-300">Active</Badge>
                    ) : (
                      <Badge className="bg-gray-500/20 text-gray-300">Inactive</Badge>
                    )}
                  </td>
                  <td className="p-4 text-gray-400 text-sm">
                    {new Date(u.created_at).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setSelectedUser(u)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleBlockUser(u.id, !u.is_blocked)}
                      >
                        {u.is_blocked ? <UserCheck className="w-4 h-4 text-green-400" /> : <Ban className="w-4 h-4 text-red-400" />}
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Billing</h2>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Sync with Stripe
          </Button>
        </div>
      </div>

      {/* Revenue Overview */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">MRR</span>
            <ArrowUpRight className="w-4 h-4 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-white">${(stats?.monthlyRevenue ?? 0).toFixed(2)}</div>
          <p className="text-green-400 text-xs">+12% from last month</p>
        </div>
        
        <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Active Subs</span>
            <Users className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white">{stats?.activeSubscriptions ?? 0}</div>
        </div>
        
        <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Lifetime Plans</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-white">{billingStats.lifetimePlans}</div>
        </div>
        
        <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Churn Rate</span>
            <ArrowDownRight className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-bold text-white">{billingStats.churnRate}%</div>
        </div>
      </div>

      {/* Subscription Plans */}
      <div className="bg-slate-800 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Active Plans</h3>
        <div className="space-y-4">
          {billingStats.planBreakdown.length > 0 ? billingStats.planBreakdown.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${
                  item.color === 'amber' ? 'bg-amber-400' :
                  item.color === 'purple' ? 'bg-purple-400' :
                  item.color === 'blue' ? 'bg-blue-400' :
                  item.color === 'green' ? 'bg-green-400' : 'bg-gray-400'
                }`} />
                <span className="text-white font-medium">{item.plan}</span>
              </div>
              <div className="flex items-center gap-6">
                <span className="text-gray-400">{item.count} users</span>
                <span className="text-white font-medium">${(item.revenue ?? 0).toFixed(2)}</span>
              </div>
            </div>
          )) : (
            <p className="text-gray-500 text-sm text-center py-4">No subscription data available</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderDatabase = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Database Management</h2>
        <Button onClick={fetchTables} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      <div className="grid md:grid-cols-4 gap-6">
        {/* Tables List */}
        <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
          <h3 className="text-white font-semibold mb-4">Tables</h3>
          <div className="space-y-2">
            {tables.map((table) => (
              <button
                key={table}
                onClick={() => fetchTableData(table)}
                className={`w-full text-left px-3 py-2 rounded-lg transition-all ${
                  selectedTable === table 
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50' 
                    : 'text-gray-400 hover:bg-slate-700 hover:text-white'
                }`}
              >
                <Database className="w-4 h-4 inline mr-2" />
                {table}
              </button>
            ))}
          </div>
        </div>

        {/* Table Data */}
        <div className="md:col-span-3 bg-slate-800 border border-white/10 rounded-xl p-4">
          {selectedTable ? (
            <>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-semibold">{selectedTable}</h3>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Export
                  </Button>
                </div>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/10">
                      {tableColumns.map((col) => (
                        <th key={col} className="text-left p-2 text-gray-400 font-medium">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.slice(0, 50).map((row, i) => (
                      <tr key={i} className="border-b border-white/5">
                        {tableColumns.map((col) => (
                          <td key={col} className="p-2 text-gray-300 max-w-[200px] truncate">
                            {typeof row[col] === 'object' ? JSON.stringify(row[col]) : String(row[col] ?? '')}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Select a table to view data
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderLogs = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">System Logs</h2>
        <div className="flex items-center gap-3">
          <select 
            value={logFilter}
            onChange={(e) => setLogFilter(e.target.value as any)}
            className="bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white text-sm"
          >
            <option value="all">All Levels</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="error">Error</option>
          </select>
          <Button onClick={fetchLogs} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Log Entries */}
      <div className="bg-slate-800 border border-white/10 rounded-xl overflow-hidden">
        <div className="max-h-[600px] overflow-y-auto">
          {logs.length > 0 ? logs.map((log) => (
            <div key={log.id} className="flex items-start gap-4 p-4 border-b border-white/5 hover:bg-slate-700/50">
              <div className={`mt-1 p-1 rounded ${
                log.level === 'error' ? 'bg-red-500/20' :
                log.level === 'warning' ? 'bg-amber-500/20' : 'bg-blue-500/20'
              }`}>
                {log.level === 'error' ? <XCircle className="w-4 h-4 text-red-400" /> :
                 log.level === 'warning' ? <AlertTriangle className="w-4 h-4 text-amber-400" /> :
                 <Activity className="w-4 h-4 text-blue-400" />}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Badge className={
                    log.level === 'error' ? 'bg-red-500/20 text-red-300' :
                    log.level === 'warning' ? 'bg-amber-500/20 text-amber-300' :
                    'bg-blue-500/20 text-blue-300'
                  }>
                    {log.level.toUpperCase()}
                  </Badge>
                  <span className="text-gray-500 text-xs">{log.source}</span>
                  <span className="text-gray-600 text-xs">{log.timestamp}</span>
                </div>
                <p className="text-white text-sm">{log.message}</p>
                {log.details && (
                  <pre className="mt-2 p-2 bg-slate-900 rounded text-xs text-gray-400 overflow-x-auto">
                    {JSON.stringify(log.details, null, 2)}
                  </pre>
                )}
              </div>
            </div>
          )) : (
            <div className="p-8 text-center text-gray-500">
              No logs found
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const [emailTab, setEmailTab] = useState<'overview' | 'flows' | 'logs'>('overview');

  const renderEmails = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Email Management</h2>
        <Button variant="outline" size="sm">
          <Send className="w-4 h-4 mr-2" />
          Send Test Email
        </Button>
      </div>

      <div className="flex gap-2 border-b border-white/10 pb-2">
        <button
          onClick={() => setEmailTab('overview')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            emailTab === 'overview'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <BarChart className="w-4 h-4" />
          Overview
        </button>
        <button
          onClick={() => setEmailTab('flows')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            emailTab === 'flows'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <GitBranch className="w-4 h-4" />
          Email Flows (25)
        </button>
        <button
          onClick={() => setEmailTab('logs')}
          className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            emailTab === 'logs'
              ? 'bg-indigo-600 text-white'
              : 'text-gray-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <FileText className="w-4 h-4" />
          Email Logs
        </button>
      </div>

      {emailTab === 'overview' && (
        <>
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Send className="w-5 h-5 text-blue-400" />
                <span className="text-gray-400 text-sm">Sent Today</span>
              </div>
              <div className="text-2xl font-bold text-white">{emailStats.sentToday}</div>
            </div>
            
            <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-gray-400 text-sm">Delivered</span>
              </div>
              <div className="text-2xl font-bold text-white">{emailStats.deliveryRate}%</div>
            </div>
            
            <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Inbox className="w-5 h-5 text-amber-400" />
                <span className="text-gray-400 text-sm">Open Rate</span>
              </div>
              <div className="text-2xl font-bold text-white">{emailStats.openRate}%</div>
            </div>
            
            <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="w-5 h-5 text-red-400" />
                <span className="text-gray-400 text-sm">Bounced</span>
              </div>
              <div className="text-2xl font-bold text-white">{emailStats.bounceRate}%</div>
            </div>
          </div>

          <div className="bg-slate-800 border border-white/10 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Email Templates (Sendune)</h3>
            <div className="space-y-3">
              {emailStats.templates.length > 0 ? emailStats.templates.map((template: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Mail className="w-5 h-5 text-purple-400" />
                    <span className="text-white">{template.name}</span>
                  </div>
                  <div className="flex items-center gap-6">
                    <span className="text-gray-400 text-sm">{template.sends} sent</span>
                    <span className="text-gray-500 text-xs">{formatTimeAgo(template.lastSent)}</span>
                    <Button variant="ghost" size="sm">
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              )) : (
                <p className="text-gray-500 text-sm text-center py-4">No email templates yet</p>
              )}
            </div>
          </div>
        </>
      )}

      {emailTab === 'flows' && (
        <div className="bg-white rounded-xl p-6">
          <EmailFlows />
        </div>
      )}

      {emailTab === 'logs' && (
        <div className="bg-white rounded-xl p-6">
          <EmailLogs />
        </div>
      )}
    </div>
  );

  const renderSecurity = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">Security & Firewall</h2>
        <Button onClick={fetchSecurityRules} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Security Stats */}
      <div className="grid md:grid-cols-4 gap-4">
        <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-green-400" />
            <span className="text-gray-400 text-sm">Blocked IPs</span>
          </div>
          <div className="text-2xl font-bold text-white">23</div>
        </div>
        
        <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <span className="text-gray-400 text-sm">Threats (24h)</span>
          </div>
          <div className="text-2xl font-bold text-white">7</div>
        </div>
        
        <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-5 h-5 text-blue-400" />
            <span className="text-gray-400 text-sm">Active Rules</span>
          </div>
          <div className="text-2xl font-bold text-white">{securityRules.filter(r => r.active).length}</div>
        </div>
        
        <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-5 h-5 text-purple-400" />
            <span className="text-gray-400 text-sm">Rate Limits</span>
          </div>
          <div className="text-2xl font-bold text-white">5</div>
        </div>
      </div>

      {/* Add New Rule */}
      <div className="bg-slate-800 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Add Security Rule</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <select 
            value={newRuleType}
            onChange={(e) => setNewRuleType(e.target.value as any)}
            className="bg-slate-700 border border-white/10 rounded-lg px-3 py-2 text-white"
          >
            <option value="ip_block">Block IP</option>
            <option value="rate_limit">Rate Limit</option>
            <option value="access_rule">Access Rule</option>
          </select>
          <Input 
            placeholder="IP address or pattern"
            value={newRuleValue}
            onChange={(e) => setNewRuleValue(e.target.value)}
            className="bg-slate-700 border-white/10"
          />
          <Input 
            placeholder="Reason"
            value={newRuleReason}
            onChange={(e) => setNewRuleReason(e.target.value)}
            className="bg-slate-700 border-white/10"
          />
          <Button onClick={handleAddSecurityRule} className="bg-red-600 hover:bg-red-700">
            <Shield className="w-4 h-4 mr-2" />
            Add Rule
          </Button>
        </div>
      </div>

      {/* Existing Rules */}
      <div className="bg-slate-800 border border-white/10 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-white mb-4">Active Rules</h3>
        <div className="space-y-3">
          {securityRules.map((rule) => (
            <div key={rule.id} className="flex items-center justify-between p-3 bg-slate-700/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge className={
                  rule.type === 'ip_block' ? 'bg-red-500/20 text-red-300' :
                  rule.type === 'rate_limit' ? 'bg-amber-500/20 text-amber-300' :
                  'bg-blue-500/20 text-blue-300'
                }>
                  {rule.type.replace('_', ' ')}
                </Badge>
                <span className="text-white font-mono">{rule.value}</span>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-gray-400 text-sm">{rule.reason}</span>
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => handleDeleteSecurityRule(rule.id)}
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </Button>
              </div>
            </div>
          ))}
          {securityRules.length === 0 && (
            <p className="text-gray-500 text-center py-4">No security rules configured</p>
          )}
        </div>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Admin Settings</h2>
      
      <div className="grid md:grid-cols-2 gap-6">
        <div className="bg-slate-800 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Platform Settings</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Maintenance Mode</span>
              <input type="checkbox" className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Allow New Registrations</span>
              <input type="checkbox" defaultChecked className="toggle" />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-300">Debug Mode</span>
              <input type="checkbox" className="toggle" />
            </div>
          </div>
        </div>

        <div className="bg-slate-800 border border-white/10 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Admin Account</h3>
          <div className="space-y-3">
            <p className="text-gray-400">Logged in as:</p>
            <p className="text-white font-medium">{user?.email}</p>
            <p className="text-gray-500 text-sm">Role: Super Admin</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderBlogs = () => (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-lg sm:text-2xl font-bold text-white">AI Blog Generator</h2>
      </div>
      <div className="bg-slate-800 border border-white/10 rounded-xl p-4">
        <BlogGenerator onBack={() => setActiveSection('dashboard')} />
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': return renderDashboard();
      case 'users': return renderUsers();
      case 'subscriptions': return renderSubscriptions();
      case 'database': return renderDatabase();
      case 'logs': return renderLogs();
      case 'emails': return renderEmails();
      case 'blogs': return renderBlogs();
      case 'security': return renderSecurity();
      case 'settings': return renderSettings();
      default: return renderDashboard();
    }
  };

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-900 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-950 border-r border-white/10 flex flex-col transform transition-transform duration-300 lg:transform-none ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        {/* Logo */}
        <div className="p-4 sm:p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold">Adiology</h1>
              <p className="text-gray-500 text-xs">Super Admin</p>
            </div>
            <button 
              onClick={() => setSidebarOpen(false)}
              className="ml-auto lg:hidden text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 sm:p-4 overflow-y-auto">
          <ul className="space-y-1">
            {menuItems.map((item) => (
              <li key={item.id}>
                <button
                  onClick={() => {
                    setActiveSection(item.id as AdminSection);
                    setSidebarOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg transition-all text-sm sm:text-base ${
                    activeSection === item.id
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/50'
                      : 'text-gray-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <item.icon className="w-5 h-5 flex-shrink-0" />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>

        {/* Logout */}
        <div className="p-3 sm:p-4 border-t border-white/10">
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-lg text-gray-400 hover:bg-red-500/20 hover:text-red-300 transition-all text-sm sm:text-base"
          >
            <LogOut className="w-5 h-5" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto lg:ml-0">
        {/* Header */}
        <header className="bg-slate-800/50 border-b border-white/10 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden text-gray-400 hover:text-white p-1"
              >
                <Menu className="w-6 h-6" />
              </button>
              <h2 className="text-base sm:text-xl font-semibold text-white capitalize truncate">
                {activeSection.replace('-', ' ')}
              </h2>
            </div>
            <div className="flex items-center gap-2 sm:gap-4">
              <Button variant="ghost" size="sm" className="p-1 sm:p-2">
                <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs sm:text-sm">
                  {user?.email?.[0]?.toUpperCase() || 'A'}
                </div>
                <span className="hidden sm:inline text-gray-300 text-sm truncate max-w-[150px]">{user?.email}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="p-3 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <RefreshCw className="w-8 h-8 text-purple-400 animate-spin" />
            </div>
          ) : (
            renderContent()
          )}
        </main>
      </div>
    </div>
  );
}
