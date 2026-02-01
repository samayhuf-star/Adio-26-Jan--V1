import { useState, useEffect } from 'react';
import { 
  Shield, LogOut, Users, CreditCard, RefreshCw, Search, 
  Ban, CheckCircle, Eye, TrendingUp, DollarSign, Activity,
  UserCheck, AlertTriangle, Calendar, Mail, ChevronRight,
  Edit, Trash2, X, Save, MoreHorizontal
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
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
  createdAt: string;
  lastSignIn: string | null;
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
}

type ActiveTab = 'overview' | 'users' | 'subscriptions';

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
  
  // CRUD state for users
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [editForm, setEditForm] = useState({ displayName: '', email: '' });
  const [deleteConfirmUser, setDeleteConfirmUser] = useState<UserRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // CRUD state for subscriptions
  const [editingSub, setEditingSub] = useState<SubscriptionRecord | null>(null);
  const [subEditForm, setSubEditForm] = useState({ planName: '', status: '' });
  const [deleteConfirmSub, setDeleteConfirmSub] = useState<SubscriptionRecord | null>(null);

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

  const loadUsers = async () => {
    try {
      const response = await adminFetch('/api/superadmin/users');
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

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([loadStats(), loadUsers(), loadSubscriptions()]);
    setLoading(false);
  };

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
      email: user.email
    });
  };

  const saveUserEdit = async () => {
    if (!editingUser) return;
    
    try {
      setActionLoading(true);
      const response = await adminFetch(`/api/superadmin/users/${editingUser.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          displayName: editForm.displayName,
          email: editForm.email
        })
      });
      
      if (response.ok) {
        setUsers(users.map(u => 
          u.id === editingUser.id 
            ? { ...u, fullName: editForm.displayName, email: editForm.email } 
            : u
        ));
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
    
    return matchesSearch && matchesFilter;
  });

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
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
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
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-white">Super Admin</h1>
              <p className="text-xs text-slate-400">Control Panel</p>
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
        <div className="flex gap-2 mb-6">
          {[
            { id: 'overview', label: 'Overview', icon: Activity },
            { id: 'users', label: 'Users', icon: Users },
            { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard }
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

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            {/* Search and Filter */}
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
              <div className="flex gap-2">
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
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">User</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Plan</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Joined</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredUsers.map(user => (
                      <tr key={user.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <div>
                            <p className="text-white font-medium">{user.email}</p>
                            <p className="text-sm text-slate-400">{user.fullName || 'No name'}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-slate-600/50 text-slate-300">
                            {user.subscriptionPlan}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(user.subscriptionStatus, user.isBlocked)}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {formatDate(user.createdAt)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => openEditModal(user)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              onClick={() => toggleBlockUser(user.id, user.isBlocked)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              className={user.isBlocked 
                                ? 'border-green-500/50 text-green-400 hover:bg-green-500/20'
                                : 'border-orange-500/50 text-orange-400 hover:bg-orange-500/20'
                              }
                            >
                              {user.isBlocked ? (
                                <>
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  Unblock
                                </>
                              ) : (
                                <>
                                  <Ban className="w-3 h-3 mr-1" />
                                  Block
                                </>
                              )}
                            </Button>
                            <Button
                              onClick={() => setDeleteConfirmUser(user)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredUsers.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No users found
                </div>
              )}
            </div>
          </div>
        )}

        {/* Subscriptions Tab */}
        {activeTab === 'subscriptions' && (
          <div className="space-y-4">
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by email or plan..."
                  className="pl-10 bg-slate-700/50 border-slate-600 text-white"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'active', 'trialing', 'canceled'] as const).map(filter => (
                  <Button
                    key={filter}
                    onClick={() => setSubFilter(filter)}
                    variant={subFilter === filter ? 'default' : 'outline'}
                    size="sm"
                    className={subFilter === filter 
                      ? 'bg-slate-600 text-white'
                      : 'border-slate-600 text-slate-400 hover:bg-slate-700'
                    }
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* Subscriptions Table */}
            <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-700/50">
                    <tr>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">User</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Plan</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Status</th>
                      <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Period End</th>
                      <th className="text-right px-4 py-3 text-sm font-medium text-slate-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-700/50">
                    {filteredSubscriptions.map(sub => (
                      <tr key={sub.id} className="hover:bg-slate-700/30">
                        <td className="px-4 py-3">
                          <p className="text-white font-medium">{sub.userEmail || 'Unknown'}</p>
                          <p className="text-xs text-slate-500">{formatDate(sub.createdAt)}</p>
                        </td>
                        <td className="px-4 py-3">
                          <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/30">
                            {sub.planName}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          {getStatusBadge(sub.status)}
                          {sub.cancelAtPeriodEnd && (
                            <Badge className="ml-2 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                              Canceling
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-sm">
                          {formatDate(sub.currentPeriodEnd)}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              onClick={() => openSubEditModal(sub)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              className="border-blue-500/50 text-blue-400 hover:bg-blue-500/20"
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            {sub.status === 'active' || sub.status === 'trialing' ? (
                              <Button
                                onClick={() => cancelSubscription(sub.id, true)}
                                variant="outline"
                                size="sm"
                                disabled={actionLoading}
                                className="border-orange-500/50 text-orange-400 hover:bg-orange-500/20"
                              >
                                <Ban className="w-3 h-3 mr-1" />
                                Cancel
                              </Button>
                            ) : (
                              <Button
                                onClick={() => reactivateSubscription(sub.id)}
                                variant="outline"
                                size="sm"
                                disabled={actionLoading}
                                className="border-green-500/50 text-green-400 hover:bg-green-500/20"
                              >
                                <CheckCircle className="w-3 h-3 mr-1" />
                                Reactivate
                              </Button>
                            )}
                            <Button
                              onClick={() => setDeleteConfirmSub(sub)}
                              variant="outline"
                              size="sm"
                              disabled={actionLoading}
                              className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {filteredSubscriptions.length === 0 && (
                <div className="text-center py-8 text-slate-400">
                  No subscriptions found
                </div>
              )}
            </div>
          </div>
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
            {editingUser && (
              <div className="p-3 bg-slate-700/30 rounded-lg text-sm text-slate-400">
                <p>User ID: {editingUser.id}</p>
                <p>Created: {formatDate(editingUser.createdAt)}</p>
                <p>Last Sign In: {editingUser.lastSignIn ? formatDate(editingUser.lastSignIn) : 'Never'}</p>
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
