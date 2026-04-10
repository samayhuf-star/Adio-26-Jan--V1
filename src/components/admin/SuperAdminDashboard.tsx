import { useState, useEffect, lazy, Suspense } from 'react';
import { 
  Shield, LogOut, Users, CreditCard, RefreshCw, Search, 
  Ban, CheckCircle, Eye, TrendingUp, DollarSign, Activity,
  UserCheck, AlertTriangle, Calendar, Mail, ChevronRight,
  Edit, Trash2, X, Save, MoreHorizontal, MessageSquare,
  Server, Tag, Brain, FileText, MessageCircle, Globe, Send, Route, Terminal, Zap
} from 'lucide-react';
import { VisitorsDashboard } from './VisitorsDashboard';
import { UserJourneyDashboard } from './UserJourneyDashboard';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { FeedbackManagement } from '../FeedbackManagement';
import { NotificationProvider } from '../../contexts/NotificationContext';
import EmailFlows from './EmailFlows';
import EmailLogs from './EmailLogs';
import { StripePaymentDashboard } from './StripePaymentDashboard';
import { SystemHealthDashboard } from './SystemHealthDashboard';
import { PromoCodeManager } from './PromoCodeManager';
import { EmailMonitoringDashboard } from './EmailMonitoringDashboard';
import { AuditLogsDashboard } from './AuditLogsDashboard';
import { AIUsageDashboard } from './AIUsageDashboard';
import { WhatsAppConfigPanel } from './WhatsAppConfigPanel';
import AnalyticsDashboard from './AnalyticsDashboard';
import { UserLifecyclePanel } from './UserLifecyclePanel';
import { AdSpendDashboard } from './AdSpendDashboard';
import { SystemLogsDashboard } from './SystemLogsDashboard';
import { LeadsDashboard } from './LeadsDashboard';
import { ChatbotDashboard } from './ChatbotDashboard';
import { BulkBlogGenerator } from './BulkBlogGenerator';
import { ArticlePerformanceDashboard } from './ArticlePerformanceDashboard';
const SEODashboard = lazy(() => import('./SEODashboard'));
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../ui/alert-dialog';

interface SuperAdminDashboardProps {
  token: string;
  onLogout: () => void;
}

interface DashboardStats {
  totalUsers: number;
  activeSubscriptions: number;
  monthlyRevenue: number;
  trialUsers: number;
  blockedUsers: number;
}

interface UserRecord {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  isBlocked: boolean;
  isInternal: boolean;
  signupIp?: string | null;
  createdAt: string;
  updatedAt: string | null;
  lastSignIn: string | null;
  emailVerified?: boolean;
  cardValidated?: boolean;
  stripeCustomerId?: string | null;
  subscriptionId?: string | null;
  subPlanName?: string | null;
  subStatus?: string | null;
  subPeriodStart?: string | null;
  subPeriodEnd?: string | null;
  subCancelAtPeriodEnd?: boolean;
  subTrialStart?: string | null;
  subTrialEnd?: string | null;
  subCreatedAt?: string | null;
  subUpdatedAt?: string | null;
  totalPaidCents?: number;
  lastPaymentDate?: string | null;
  lastPaymentStatus?: string | null;
  paymentCount?: number;
}

interface SubscriptionRecord {
  id: string;
  userId: string;
  userEmail?: string;
  planName: string;
  status: string;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string | null;
  paidAmountCents: number | string;
}

type ActiveTab = 'overview' | 'users' | 'emails' | 'email-monitoring' | 'analytics' | 'visitors' | 'system-health' | 'promo-codes' | 'feedback' | 'audit-logs' | 'ai-usage' | 'whatsapp' | 'seo' | 'user-journey' | 'ad-spend' | 'system-logs' | 'leads' | 'chatbot' | 'bulk-blog' | 'article-performance';

export function SuperAdminDashboard({ token, onLogout }: SuperAdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    trialUsers: 0,
    blockedUsers: 0
  });
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [subscriptions, setSubscriptions] = useState<SubscriptionRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'blocked'>('all');
  const [subFilter, setSubFilter] = useState<'all' | 'active' | 'trialing' | 'canceled'>('all');
  
  // Internal user toggle
  const [showInternalUsers, setShowInternalUsers] = useState(false);

  // CRUD state for users
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({ displayName: '', email: '', newPassword: '', isInternal: false });
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [sendingCredentialsUserId, setSendingCredentialsUserId] = useState<string | null>(null);
  
  // CRUD state for subscriptions
  const [editingSub, setEditingSub] = useState<SubscriptionRecord | null>(null);
  const [subEditForm, setSubEditForm] = useState({ planName: '', status: '' });
  const [deleteConfirmSub, setDeleteConfirmSub] = useState<SubscriptionRecord | null>(null);

  // User lifecycle panel
  const [lifecycleUserId, setLifecycleUserId] = useState<string | null>(null);
  const [planFilter, setPlanFilter] = useState<string>('all');

  // Replit Dev Spend widget
  const [replitSpend, setReplitSpend] = useState<number>(0);
  const [replitSpendUpdatedAt, setReplitSpendUpdatedAt] = useState<string | null>(null);
  const [editingSpend, setEditingSpend] = useState(false);
  const [spendInput, setSpendInput] = useState('');
  const [spendSaving, setSpendSaving] = useState(false);

  const adminFetch = async (url: string, options: RequestInit = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...(options.headers || {})
      }
    });
  };

  const loadStats = async () => {
    try {
      const response = await adminFetch('/api/superadmin/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Failed to load stats:', error);
    }
  };

  const loadUsers = async (showInternal = false) => {
    try {
      const response = await adminFetch(`/api/superadmin/users-unified?showInternal=${showInternal}`);
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to load users:', error);
    }
  };

  const loadSubscriptions = async () => {
    try {
      const response = await adminFetch('/api/superadmin/subscriptions');
      if (response.ok) {
        const data = await response.json();
        setSubscriptions(data.subscriptions || []);
      }
    } catch (error) {
      console.error('Failed to load subscriptions:', error);
    }
  };

  const loadReplitSpend = async () => {
    try {
      const response = await adminFetch('/api/superadmin/replit-spend');
      if (response.ok) {
        const data = await response.json();
        setReplitSpend(data.amount ?? 0);
        setReplitSpendUpdatedAt(data.updatedAt ?? null);
      }
    } catch (error) {
      console.error('Failed to load Replit spend:', error);
    }
  };

  const saveReplitSpend = async () => {
    const parsed = parseFloat(spendInput);
    if (isNaN(parsed) || parsed < 0) return;
    setSpendSaving(true);
    try {
      const response = await adminFetch('/api/superadmin/replit-spend', {
        method: 'PUT',
        body: JSON.stringify({ amount: parsed })
      });
      if (response.ok) {
        setReplitSpend(parsed);
        setReplitSpendUpdatedAt(new Date().toISOString());
        setEditingSpend(false);
      }
    } catch (error) {
      console.error('Failed to save Replit spend:', error);
    } finally {
      setSpendSaving(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadUsers(), loadSubscriptions()]);
    setLoading(false);
  };

  useEffect(() => {
    loadReplitSpend();
    const spendInterval = setInterval(loadReplitSpend, 30000);
    return () => clearInterval(spendInterval);
  }, []);

  useEffect(() => {
    refreshData();
  }, []);

  const toggleBlockUser = async (userId: string, currentlyBlocked: boolean) => {
    try {
      setActionLoading(true);
      const response = await adminFetch(`/api/superadmin/users/${userId}/block`, {
        method: 'POST',
        body: JSON.stringify({ block: !currentlyBlocked })
      });
      if (response.ok) {
        setUsers(users.map(u => 
          u.id === userId ? { ...u, isBlocked: !currentlyBlocked } : u
        ));
        await loadStats();
      }
    } catch (error) {
      console.error('Failed to toggle block:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const openEditModal = (user: UserRecord) => {
    setEditingUser(user);
    setEditForm({
      displayName: user.fullName || '',
      email: user.email,
      newPassword: '',
      isInternal: user.isInternal ?? false,
    });
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;
    
    try {
      setActionLoading(true);

      // Handle user type (internal/real) change via dedicated endpoint
      const internalChanged = editForm.isInternal !== (editingUser.isInternal ?? false);
      if (internalChanged) {
        const intRes = await adminFetch(`/api/superadmin/users/${editingUser.id}/set-internal`, {
          method: 'POST',
          body: JSON.stringify({ isInternal: editForm.isInternal })
        });
        if (intRes.ok) {
          const intData = await intRes.json();
          if (editForm.isInternal && intData.affectedCount > 1) {
            alert(`Marked as Internal. Also automatically marked ${intData.affectedCount - 1} other user(s) from the same IP as internal.`);
          }
        }
      }

      const response = await adminFetch(`/api/superadmin/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          displayName: editForm.displayName,
          email: editForm.email
        })
      });
      
      if (response.ok) {
        if (editForm.newPassword.trim().length > 0) {
          const pwRes = await adminFetch(`/api/superadmin/users/${editingUser.id}/password`, {
            method: 'PUT',
            body: JSON.stringify({ password: editForm.newPassword.trim() })
          });
          if (!pwRes.ok) {
            const pwErr = await pwRes.json();
            alert(pwErr.error || 'User saved but password change failed');
          }
        }

        // Reload users to reflect any bulk internal changes
        await loadUsers(showInternalUsers);
        setEditingUser(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update user');
      }
    } catch (error) {
      console.error('Failed to update user:', error);
      alert('Failed to update user');
    } finally {
      setActionLoading(false);
    }
  };

  const deleteUser = async () => {
    if (!deleteConfirmUser) return;
    
    try {
      setActionLoading(true);
      const response = await adminFetch(`/api/superadmin/users/${deleteConfirmUser.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setUsers(users.filter(u => u.id !== deleteConfirmUser.id));
        setDeleteConfirmUser(null);
        await loadStats();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete user');
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user');
    } finally {
      setActionLoading(false);
    }
  };

  const sendCredentials = async (user: UserRecord) => {
    try {
      setSendingCredentialsUserId(user.id);
      const response = await adminFetch(`/api/superadmin/users/${user.id}/send-credentials`, {
        method: 'POST'
      });
      if (response.ok) {
        alert(`Login credentials email sent to ${user.email}`);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to send credentials email');
      }
    } catch (error) {
      console.error('Failed to send credentials:', error);
      alert('Failed to send credentials email');
    } finally {
      setSendingCredentialsUserId(null);
    }
  };

  // Subscription CRUD functions
  const openSubEditModal = (sub: SubscriptionRecord) => {
    setEditingSub(sub);
    setSubEditForm({
      planName: sub.planName,
      status: sub.status
    });
  };

  const saveSubEdit = async () => {
    if (!editingSub) return;
    
    try {
      setActionLoading(true);
      const response = await adminFetch(`/api/superadmin/subscriptions/${editingSub.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          planName: subEditForm.planName,
          status: subEditForm.status
        })
      });
      
      if (response.ok) {
        setSubscriptions(subscriptions.map(s => 
          s.id === editingSub.id 
            ? { ...s, planName: subEditForm.planName, status: subEditForm.status } 
            : s
        ));
        setEditingSub(null);
        await loadStats();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to update subscription');
      }
    } catch (error) {
      console.error('Failed to update subscription:', error);
      alert('Failed to update subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const cancelSubscription = async (subId: string, immediate: boolean) => {
    try {
      setActionLoading(true);
      const response = await adminFetch(`/api/superadmin/subscriptions/${subId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ immediate })
      });
      
      if (response.ok) {
        setSubscriptions(subscriptions.map(s => 
          s.id === subId 
            ? { ...s, status: immediate ? 'canceled' : s.status, cancelAtPeriodEnd: !immediate } 
            : s
        ));
        await loadStats();
      }
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const reactivateSubscription = async (subId: string) => {
    try {
      setActionLoading(true);
      const response = await adminFetch(`/api/superadmin/subscriptions/${subId}/reactivate`, {
        method: 'POST'
      });
      
      if (response.ok) {
        setSubscriptions(subscriptions.map(s => 
          s.id === subId 
            ? { ...s, status: 'active', cancelAtPeriodEnd: false } 
            : s
        ));
        await loadStats();
      }
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteSubscription = async () => {
    if (!deleteConfirmSub) return;
    
    try {
      setActionLoading(true);
      const response = await adminFetch(`/api/superadmin/subscriptions/${deleteConfirmSub.id}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setSubscriptions(subscriptions.filter(s => s.id !== deleteConfirmSub.id));
        setDeleteConfirmSub(null);
        await loadStats();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete subscription');
      }
    } catch (error) {
      console.error('Failed to delete subscription:', error);
      alert('Failed to delete subscription');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchTerm || 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.fullName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = userFilter === 'all' ||
      (userFilter === 'blocked' && user.isBlocked) ||
      (userFilter === 'active' && !user.isBlocked);

    const matchesPlan = planFilter === 'all' ||
      (user.subscriptionPlan || 'free').toLowerCase() === planFilter.toLowerCase();
    
    return matchesSearch && matchesFilter && matchesPlan;
  }).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

  const filteredSubscriptions = subscriptions.filter(sub => {
    const matchesSearch = !searchTerm ||
      sub.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.planName.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = subFilter === 'all' ||
      (subFilter === 'active' && sub.status === 'active') ||
      (subFilter === 'trialing' && sub.status === 'trialing') ||
      (subFilter === 'canceled' && (sub.status === 'canceled' || sub.cancelAtPeriodEnd));
    
    return matchesSearch && matchesFilter;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Asia/Kolkata',
    });
  };

  const getStatusBadge = (status: string, isBlocked?: boolean) => {
    if (isBlocked) {
      return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Blocked</Badge>;
    }
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Active</Badge>;
      case 'trialing':
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Trial</Badge>;
      case 'canceled':
      case 'cancelled':
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Canceled</Badge>;
      case 'past_due':
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Past Due</Badge>;
      default:
        return <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <header className="bg-slate-800/50 backdrop-blur-xl border-b border-slate-700/50 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-white">Super Admin</h1>
                <p className="text-xs text-slate-400">Control Panel</p>
              </div>
            </div>

            {/* Replit Dev Spend Widget */}
            <div className="flex items-center gap-2 bg-slate-900/70 border border-emerald-500/30 rounded-xl px-4 py-2 min-w-[220px]">
              <div className="flex flex-col flex-1">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-[10px] font-medium text-emerald-400 uppercase tracking-widest">Replit Dev Cost</span>
                </div>
                {editingSpend ? (
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-emerald-400 text-sm font-bold">$</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={spendInput}
                      onChange={e => setSpendInput(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') saveReplitSpend(); if (e.key === 'Escape') setEditingSpend(false); }}
                      className="bg-slate-700 text-white text-sm font-bold rounded px-2 py-0.5 w-24 border border-emerald-500/50 outline-none focus:border-emerald-400"
                      autoFocus
                    />
                    <button
                      onClick={saveReplitSpend}
                      disabled={spendSaving}
                      className="text-emerald-400 hover:text-emerald-300 text-xs font-bold px-1"
                    >
                      {spendSaving ? '...' : <Save className="w-3.5 h-3.5" />}
                    </button>
                    <button onClick={() => setEditingSpend(false)} className="text-slate-400 hover:text-slate-300">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => { setSpendInput(replitSpend.toFixed(2)); setEditingSpend(true); }}
                    className="text-left group"
                    title="Click to update amount"
                  >
                    <span className="text-2xl font-black text-emerald-400 group-hover:text-emerald-300 transition-colors tabular-nums">
                      ${replitSpend.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <Edit className="w-3 h-3 text-slate-500 group-hover:text-emerald-400 inline ml-1.5 mb-1 transition-colors" />
                  </button>
                )}
                {replitSpendUpdatedAt && !editingSpend && (
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Updated {new Date(replitSpendUpdatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={refreshData}
              disabled={loading}
              variant="outline"
              size="sm"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={onLogout}
              variant="outline"
              size="sm"
              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Navigation Tabs */}
        <div className="flex flex-wrap gap-2 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'Users & Billing', icon: Users },
            { id: 'emails', label: 'Email Flows', icon: Mail },
            { id: 'email-monitoring', label: 'Email Stats', icon: Mail },
            { id: 'promo-codes', label: 'Promo Codes', icon: Tag },
            { id: 'system-health', label: 'System Health', icon: Server },
            { id: 'audit-logs', label: 'Audit Logs', icon: FileText },
            { id: 'ai-usage', label: 'AI Usage', icon: Brain },
            { id: 'whatsapp', label: 'WhatsApp', icon: MessageCircle },
            { id: 'analytics', label: 'Analytics', icon: Activity },
            { id: 'visitors', label: 'Visitors', icon: Eye },
            { id: 'seo', label: 'SEO & Directories', icon: Globe },
            { id: 'feedback', label: 'Feedback', icon: MessageSquare },
            { id: 'user-journey', label: 'User Journey', icon: Route },
            { id: 'ad-spend', label: 'Ad Spend', icon: TrendingUp },
            { id: 'system-logs', label: 'System Logs', icon: Terminal },
            { id: 'leads', label: 'Leads', icon: Mail },
            { id: 'chatbot', label: 'Chat Support', icon: MessageCircle },
            { id: 'bulk-blog', label: 'Bulk Blog', icon: Zap },
            { id: 'article-performance', label: 'Article ROI', icon: TrendingUp },
          ].map(tab => (
            <Button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as ActiveTab)}
              variant={activeTab === tab.id ? 'default' : 'outline'}
              className={activeTab === tab.id 
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                : 'border-slate-600 text-slate-300 hover:bg-slate-700'
              }
            >
              <tab.icon className="w-4 h-4 mr-2" />
              {tab.label}
            </Button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <StatCard
                title="Total Users"
                value={stats.totalUsers}
                icon={<Users className="w-5 h-5" />}
                color="blue"
              />
              <StatCard
                title="Active Subscriptions"
                value={stats.activeSubscriptions}
                icon={<CreditCard className="w-5 h-5" />}
                color="green"
              />
              <StatCard
                title="Monthly Revenue"
                value={`$${stats.monthlyRevenue.toLocaleString()}`}
                icon={<DollarSign className="w-5 h-5" />}
                color="purple"
              />
              <StatCard
                title="Trial Users"
                value={stats.trialUsers}
                icon={<UserCheck className="w-5 h-5" />}
                color="orange"
              />
              <StatCard
                title="Blocked Users"
                value={stats.blockedUsers}
                icon={<Ban className="w-5 h-5" />}
                color="red"
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  Recent Users
                </h3>
                <div className="space-y-3">
                  {users.slice(0, 5).map(user => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{user.email}</p>
                        <p className="text-sm text-slate-400">{user.subscriptionPlan}</p>
                      </div>
                      {getStatusBadge(user.subscriptionStatus, user.isBlocked)}
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-green-400" />
                  Recent Subscriptions
                </h3>
                <div className="space-y-3">
                  {subscriptions.slice(0, 5).map(sub => (
                    <div key={sub.id} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                      <div>
                        <p className="text-white font-medium">{sub.planName}</p>
                        <p className="text-sm text-slate-400">{sub.userEmail || 'Unknown user'}</p>
                      </div>
                      {getStatusBadge(sub.status)}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unified Users & Billing Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by email or name..."
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                {(['all', 'active', 'blocked'] as const).map(filter => (
                  <Button
                    key={filter}
                    onClick={() => setUserFilter(filter)}
                    variant={userFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    className={userFilter === filter 
                      ? 'bg-slate-600 text-white'
                      : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                    }
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
                <span className="w-px bg-slate-600 mx-1" />
                {['all', 'Free', 'Starter', 'Professional', 'Agency', 'Lifetime'].map(plan => (
                  <Button
                    key={plan}
                    onClick={() => setPlanFilter(plan === 'all' ? 'all' : plan)}
                    variant={planFilter === (plan === 'all' ? 'all' : plan) ? 'default' : 'outline'}
                    size="sm"
                    className={planFilter === (plan === 'all' ? 'all' : plan)
                      ? 'bg-indigo-600 text-white'
                      : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                    }
                  >
                    {plan === 'all' ? 'All Plans' : plan}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-slate-500">{filteredUsers.length} users found. Click a row to view full lifecycle.</span>
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const next = !showInternalUsers;
                  setShowInternalUsers(next);
                  loadUsers(next);
                }}
                className={showInternalUsers
                  ? 'border-amber-500/50 text-amber-400 bg-amber-500/10 hover:bg-amber-500/20'
                  : 'border-slate-600 text-slate-500 hover:bg-slate-700'
                }
              >
                {showInternalUsers ? 'Hide Internal Users' : 'Show Internal Users'}
              </Button>
            </div>

            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400 w-10">#</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">User</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">IP Address</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Plan</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Sub Status</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Joined</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Last Login</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Total Paid</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Last Payment</th>
                      <th className="text-left px-3 py-2.5 text-xs font-medium text-slate-400">Period End</th>
                      <th className="text-right px-3 py-2.5 text-xs font-medium text-slate-400">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/30">
                    {filteredUsers.map((user, index) => (
                      <tr 
                        key={user.id} 
                        className="hover:bg-slate-700/30 cursor-pointer transition-colors"
                        onClick={() => setLifecycleUserId(user.id)}
                      >
                        <td className="px-3 py-2.5 text-slate-500 font-mono text-xs">{index + 1}</td>
                        <td className="px-3 py-2.5">
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="text-white font-medium text-sm">{user.email}</p>
                              {user.isInternal && (
                                <span className="inline-flex items-center text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">
                                  Internal
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-500">{user.fullName || 'No name'}</p>
                          </div>
                        </td>
                        <td className="px-3 py-2.5">
                          {user.signupIp ? (
                            <span className="font-mono text-xs text-slate-400">{user.signupIp}</span>
                          ) : (
                            <span className="text-xs text-slate-600">—</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge className={
                            user.subscriptionPlan === 'Lifetime' ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' :
                            user.subscriptionPlan === 'Agency' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                            user.subscriptionPlan === 'Professional' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                            user.subscriptionPlan === 'Starter' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                            'bg-slate-600/50 text-slate-400'
                          }>
                            {user.subscriptionPlan || 'free'}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5">
                          {getStatusBadge(user.subStatus || user.subscriptionStatus, user.isBlocked)}
                          {user.subCancelAtPeriodEnd && (
                            <Badge className="ml-1 bg-yellow-500/20 text-yellow-400 text-[10px] px-1">Canceling</Badge>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400 text-xs">{formatDate(user.createdAt)}</td>
                        <td className="px-3 py-2.5 text-slate-400 text-xs">{user.lastSignIn ? formatDate(user.lastSignIn) : 'Never'}</td>
                        <td className="px-3 py-2.5 text-xs font-medium">
                          {Number(user.totalPaidCents || 0) > 0 ? (
                            <span className="text-emerald-400">${(Number(user.totalPaidCents) / 100).toFixed(2)}</span>
                          ) : (
                            <span className="text-slate-600">$0.00</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-xs">
                          {user.lastPaymentDate ? (
                            <div>
                              <span className="text-slate-400">{formatDate(user.lastPaymentDate)}</span>
                              {user.lastPaymentStatus && (
                                <Badge className={`ml-1 text-[10px] px-1 ${user.lastPaymentStatus === 'succeeded' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                  {user.lastPaymentStatus}
                                </Badge>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-600">None</span>
                          )}
                        </td>
                        <td className="px-3 py-2.5 text-slate-400 text-xs">
                          {user.subPeriodEnd ? formatDate(user.subPeriodEnd) : '—'}
                        </td>
                        <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              onClick={() => openEditModal(user)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20 h-7 px-2 text-xs"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => sendCredentials(user)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading || sendingCredentialsUserId === user.id}
                              className="border-purple-500/50 text-purple-400 hover:bg-purple-500/20 h-7 px-2 text-xs"
                              title="Send login credentials email"
                            >
                              <Send className="w-3 h-3" />
                            </Button>
                            <Button
                              onClick={() => toggleBlockUser(user.id, user.isBlocked)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              className={`h-7 px-2 text-xs ${user.isBlocked 
                                ? 'border-green-500/50 text-green-400 hover:bg-green-500/20'
                                : 'border-orange-500/50 text-orange-400 hover:bg-orange-500/20'
                              }`}
                            >
                              {user.isBlocked ? <CheckCircle className="w-3 h-3" /> : <Ban className="w-3 h-3" />}
                            </Button>
                            <Button
                              onClick={() => setDeleteConfirmUser(user)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20 h-7 px-2 text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-slate-400">No users found</div>
              )}
            </div>
          </div>
        )}

        {/* Emails Tab */}
        {activeTab === 'emails' && (
          <EmailManagementSection token={token} />
        )}

        {/* Lifecycle Panel */}
        {lifecycleUserId && (
          <UserLifecyclePanel 
            userId={lifecycleUserId} 
            token={token} 
            onClose={() => setLifecycleUserId(null)} 
          />
        )}

        {/* Email Monitoring Tab */}
        {activeTab === 'email-monitoring' && (
          <EmailMonitoringDashboard token={token} />
        )}

        {/* Promo Codes Tab */}
        {activeTab === 'promo-codes' && (
          <PromoCodeManager token={token} />
        )}

        {/* System Health Tab */}
        {activeTab === 'system-health' && (
          <SystemHealthDashboard token={token} />
        )}

        {activeTab === 'audit-logs' && (
          <AuditLogsDashboard token={token} />
        )}

        {activeTab === 'ai-usage' && (
          <AIUsageDashboard token={token} />
        )}

        {activeTab === 'whatsapp' && (
          <WhatsAppConfigPanel token={token} />
        )}

        {/* Ad Spend Tab */}
        {activeTab === 'ad-spend' && (
          <AdSpendDashboard token={token} />
        )}

        {/* System Logs Tab */}
        {activeTab === 'system-logs' && (
          <SystemLogsDashboard token={token} />
        )}

        {/* Leads Tab */}
        {activeTab === 'leads' && (
          <LeadsDashboard token={token} />
        )}

        {/* Chatbot Tab */}
        {activeTab === 'chatbot' && (
          <ChatbotDashboard token={token} />
        )}

        {/* Bulk Blog Generator Tab */}
        {activeTab === 'bulk-blog' && (
          <BulkBlogGenerator token={token} />
        )}

        {/* Article Performance Tab */}
        {activeTab === 'article-performance' && (
          <ArticlePerformanceDashboard token={token} />
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <AnalyticsDashboard token={token} />
        )}

        {/* Visitors Tab */}
        {activeTab === 'visitors' && (
          <VisitorsDashboard adminToken={token} />
        )}

        {/* SEO & Directories Tab */}
        {activeTab === 'seo' && (
          <Suspense fallback={<div className="text-center text-slate-400 py-10">Loading SEO dashboard...</div>}>
            <SEODashboard />
          </Suspense>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <NotificationProvider>
            <FeedbackManagement />
          </NotificationProvider>
        )}

        {/* User Journey Tab */}
        {activeTab === 'user-journey' && (
          <UserJourneyDashboard token={token} />
        )}
      </div>

      {/* Edit User Modal */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit User</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update user information. Changes will be saved to the database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Display Name</label>
              <Input
                value={editForm.displayName}
                onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                placeholder="User's display name"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Email</label>
              <Input
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                placeholder="user@example.com"
                type="email"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">New Password</label>
              <Input
                value={editForm.newPassword}
                onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                placeholder="Leave blank to keep current password"
                type="password"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
              <p className="text-xs text-slate-500">Minimum 6 characters. Leave empty to keep existing password.</p>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">User Type</label>
              <select
                value={editForm.isInternal ? 'internal' : 'real'}
                onChange={(e) => setEditForm({ ...editForm, isInternal: e.target.value === 'internal' })}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
              >
                <option value="real">Real (default)</option>
                <option value="internal">Internal (test / team account)</option>
              </select>
              {editForm.isInternal && !editingUser?.isInternal && editingUser?.signupIp && (
                <p className="text-xs text-amber-400">
                  All users registered from the same IP address will also be marked as Internal.
                </p>
              )}
              {editForm.isInternal && !editingUser?.isInternal && !editingUser?.signupIp && (
                <p className="text-xs text-slate-500">
                  No signup IP on record — only this user will be marked Internal.
                </p>
              )}
            </div>
            {editingUser && (
              <div className="p-3 bg-slate-700/30 rounded-lg text-sm text-slate-400 space-y-0.5">
                <p>User ID: {editingUser.id}</p>
                <p>Created: {formatDate(editingUser.createdAt)}</p>
                <p>Last Sign In: {editingUser.lastSignIn ? formatDate(editingUser.lastSignIn) : 'Never'}</p>
                {editingUser.signupIp && <p>Signup IP: {editingUser.signupIp}</p>}
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingUser(null)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={saveUserEdit}
              disabled={actionLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmUser} onOpenChange={(open) => !open && setDeleteConfirmUser(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete User</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete <span className="font-semibold text-white">{deleteConfirmUser?.email}</span>? 
              This action cannot be undone. All user data will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              onClick={() => setDeleteConfirmUser(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteUser}
              disabled={actionLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete User
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit Subscription Modal */}
      <Dialog open={!!editingSub} onOpenChange={(open) => !open && setEditingSub(null)}>
        <DialogContent className="bg-slate-800 border-slate-700 text-white">
          <DialogHeader>
            <DialogTitle className="text-white">Edit Subscription</DialogTitle>
            <DialogDescription className="text-slate-400">
              Update subscription details. Changes will be saved to the database.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Plan Name</label>
              <select
                value={subEditForm.planName}
                onChange={(e) => setSubEditForm({ ...subEditForm, planName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
              >
                <option value="Starter">Starter</option>
                <option value="Professional">Professional</option>
                <option value="Agency">Agency</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-300">Status</label>
              <select
                value={subEditForm.status}
                onChange={(e) => setSubEditForm({ ...subEditForm, status: e.target.value })}
                className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-md text-white"
              >
                <option value="active">Active</option>
                <option value="trialing">Trialing</option>
                <option value="canceled">Canceled</option>
                <option value="past_due">Past Due</option>
                <option value="incomplete">Incomplete</option>
              </select>
            </div>
            {editingSub && (
              <div className="p-3 bg-slate-700/30 rounded-lg text-sm text-slate-400">
                <p>Subscription ID: {editingSub.id}</p>
                <p>User: {editingSub.userEmail || 'Unknown'}</p>
                <p>Created: {formatDate(editingSub.createdAt)}</p>
                <p>Period End: {formatDate(editingSub.currentPeriodEnd)}</p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setEditingSub(null)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={saveSubEdit}
              disabled={actionLoading}
              className="bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Subscription Confirmation Dialog */}
      <AlertDialog open={!!deleteConfirmSub} onOpenChange={(open) => !open && setDeleteConfirmSub(null)}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Delete Subscription</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to delete the <span className="font-semibold text-white">{deleteConfirmSub?.planName}</span> subscription for <span className="font-semibold text-white">{deleteConfirmSub?.userEmail || 'this user'}</span>? 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel 
              className="border-slate-600 text-slate-300 hover:bg-slate-700 bg-transparent"
              onClick={() => setDeleteConfirmSub(null)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={deleteSubscription}
              disabled={actionLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {actionLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Subscription
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function EmailManagementSection({ token }: { token: string }) {
  const [emailTab, setEmailTab] = useState<'overview' | 'flows' | 'logs'>('overview');
  const [emailStats, setEmailStats] = useState({ sentToday: 0, deliveryRate: 0, openRate: 0, bounceRate: 0 });

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/superadmin/email-stats', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (response.ok) {
          const data = await response.json();
          setEmailStats(data);
        }
      } catch (err) {
        console.error('Failed to fetch email stats:', err);
      }
    }
    fetchStats();
  }, [token]);

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-slate-700 pb-2">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'flows', label: 'Email Flows (25)', icon: Mail },
          { id: 'logs', label: 'Email Logs', icon: CheckCircle },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setEmailTab(tab.id as any)}
            className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-colors flex items-center gap-2 ${
              emailTab === tab.id
                ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white'
                : 'text-slate-400 hover:text-white hover:bg-slate-700'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {emailTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Mail className="w-5 h-5 text-blue-400" />
                <span className="text-slate-400 text-sm">Sent Today</span>
              </div>
              <div className="text-2xl font-bold text-white">{emailStats.sentToday}</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-slate-400 text-sm">Delivery Rate</span>
              </div>
              <div className="text-2xl font-bold text-white">{emailStats.deliveryRate}%</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Eye className="w-5 h-5 text-amber-400" />
                <span className="text-slate-400 text-sm">Open Rate</span>
              </div>
              <div className="text-2xl font-bold text-white">{emailStats.openRate}%</div>
            </div>
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <span className="text-slate-400 text-sm">Bounce Rate</span>
              </div>
              <div className="text-2xl font-bold text-white">{emailStats.bounceRate}%</div>
            </div>
          </div>
          <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-3">Email Sequence Overview</h3>
            <p className="text-slate-400 text-sm">
              25 automated emails across 5 customer journey stages: Lead Nurturing (5), Onboarding (8), Conversion (6), Churn Prevention (3), and Advocacy (3).
              Switch to the "Email Flows" tab to view and manage individual sequences.
            </p>
          </div>
        </div>
      )}

      {emailTab === 'flows' && (
        <div className="bg-white rounded-xl p-6">
          <EmailFlows />
        </div>
      )}

      {emailTab === 'logs' && (
        <div className="bg-white rounded-xl p-6">
          <EmailLogs token={token} />
        </div>
      )}
    </div>
  );
}

function StatCard({ 
  title, 
  value, 
  icon, 
  color 
}: { 
  title: string; 
  value: string | number; 
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'red';
}) {
  const colors = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    orange: 'from-orange-500 to-orange-600',
    red: 'from-red-500 to-red-600'
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-slate-400 text-sm">{title}</span>
        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${colors[color]} flex items-center justify-center text-white`}>
          {icon}
        </div>
      </div>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
