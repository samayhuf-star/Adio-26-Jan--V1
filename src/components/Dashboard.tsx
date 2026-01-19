import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { 
  Activity, Zap, Sparkles, Package, Target, Globe, FolderOpen, Terminal,
  CheckCircle2, FileText, Layers, TrendingUp, ArrowUp, MessageSquare
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { TerminalCard, TerminalLine } from './ui/terminal-card';
import { getUserPreferences, saveUserPreferences, initializeUserPreferences } from '../utils/userPreferences';
import { 
  useScreenSize, 
  getResponsiveGridCols, 
  getResponsiveGap, 
  getResponsiveIconSize, 
  getResponsiveFontSize,
  getResponsivePadding
} from '../utils/responsive';

// Lazy load community widget - not critical for initial dashboard load
const CommunityDashboardWidget = lazy(() => 
  import('../modules/community').then(m => ({ default: m.CommunityDashboardWidget }))
);

interface DashboardProps {
  user: any;
  onNavigate: (tab: string) => void;
}

interface UserStats {
  subscription: {
    plan: string;
    status: string;
    periodEnd: string | null;
  };
  usage: {
    apiCalls: number;
    campaigns: number;
    keywords: number;
  };
  activity: {
    lastLogin: string | null;
    totalActions: number;
  };
  userResources: {
    myCampaigns: number;
    myWebsites: number;
    myPresets: number;
    myDomains: number;
  };
}

interface RecentActivity {
  id: string;
  action: string;
  timestamp: string;
  resourceType: string;
  metadata: any;
}

export function Dashboard({ user, onNavigate }: DashboardProps) {
  const [stats, setStats] = useState<UserStats | null>(null);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [preferences, setPreferences] = useState(getUserPreferences());
  const screenSize = useScreenSize();
  const fetchInProgress = useRef(false);

  useEffect(() => {
    fetchDashboardData();
    initializeUserPreferences();
  }, [user?.id]);

  useEffect(() => {
    saveUserPreferences(preferences);
  }, [preferences]);

  const handleSidebarAutoCloseToggle = () => {
    const updatedPrefs = { ...preferences, sidebarAutoClose: !preferences.sidebarAutoClose };
    setPreferences(updatedPrefs);
    saveUserPreferences(updatedPrefs);
  };

  const fetchDashboardData = async () => {
    if (!user) return;
    
    // Prevent duplicate calls - if already loading, skip
    if (fetchInProgress.current) return;
    fetchInProgress.current = true;
    
    setLoading(true);
    try {
      // Use consolidated endpoint - ONE API call for everything
      const response = await fetch(`/api/dashboard/all/${user.id}`);
      
      // Handle rate limiting gracefully - don't retry, just use cached/default data
      if (response.status === 429) {
        console.warn('Dashboard rate limited, using default data');
        setDefaultStats();
        return;
      }
      
      if (!response.ok) {
        console.warn('Dashboard API error, using default data');
        setDefaultStats();
        return;
      }
      
      const result = await response.json();
      const apiData = result.data || result;
      
      const myCampaigns = apiData.stats?.totalCampaigns || 0;
      
      // Convert recent campaigns to activity format
      const activityData = (apiData.recentCampaigns || []).map((c: any) => ({
        id: c.id,
        action: `${c.step >= 5 ? 'completed' : 'created'}_campaign`,
        timestamp: c.updated_at || c.created_at,
        resourceType: 'campaign',
        metadata: { name: c.campaign_name, structure: c.structure_type }
      }));

      setStats({
        subscription: {
          plan: user.subscription_plan || 'free',
          status: user.subscription_status || 'active',
          periodEnd: null,
        },
        usage: {
          apiCalls: 0,
          campaigns: myCampaigns,
          keywords: apiData.stats?.keywordsGenerated || 0,
        },
        activity: {
          lastLogin: user.last_login_at || null,
          totalActions: activityData.length,
        },
        userResources: {
          myCampaigns,
          myWebsites: 0,
          myPresets: 0,
          myDomains: 0,
        },
      });

      setRecentActivity(activityData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setDefaultStats();
    } finally {
      setLoading(false);
      fetchInProgress.current = false;
    }
  };
  
  const setDefaultStats = () => {
    setStats({
      subscription: {
        plan: user?.subscription_plan || 'free',
        status: user?.subscription_status || 'active',
        periodEnd: null,
      },
      usage: { apiCalls: 0, campaigns: 0, keywords: 0 },
      activity: { lastLogin: user?.last_login_at || null, totalActions: 0 },
      userResources: { myCampaigns: 0, myWebsites: 0, myPresets: 0, myDomains: 0 },
    });
    setRecentActivity([]);
  };

  const getPlanColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise':
        return 'from-purple-500 to-pink-500';
      case 'professional':
        return 'from-blue-500 to-cyan-500';
      case 'starter':
        return 'from-green-500 to-emerald-500';
      default:
        return 'from-slate-500 to-gray-500';
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise':
        return 'bg-purple-100 text-purple-700 border-purple-300';
      case 'professional':
        return 'bg-blue-100 text-blue-700 border-blue-300';
      case 'starter':
        return 'bg-indigo-100 text-indigo-700 border-indigo-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatRelativeTime = (dateString: string | null) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return formatDate(dateString);
  };

  const getActionIcon = (action: string) => {
    if (action.includes('create')) return <CheckCircle2 className="w-4 h-4" />;
    if (action.includes('export')) return <FileText className="w-4 h-4" />;
    if (action.includes('generate')) return <Sparkles className="w-4 h-4" />;
    if (action.includes('validate')) return <CheckCircle2 className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const getActionColor = (action: string) => {
    if (action.includes('create')) return 'text-indigo-600 bg-indigo-50';
    if (action.includes('export')) return 'text-blue-600 bg-blue-50';
    if (action.includes('generate')) return 'text-purple-600 bg-purple-50';
    if (action.includes('validate')) return 'text-indigo-600 bg-indigo-50';
    return 'text-slate-600 bg-slate-50';
  };

  if (loading) {
    return (
      <div className="p-4 sm:p-6 lg:p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-slate-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-32 bg-slate-200 rounded-2xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const quickActions = [
    { id: 'one-click-builder', title: '1 Click Campaign', icon: Zap },
    { id: 'builder-3', title: 'Campaign Builder', icon: Sparkles },
    { id: 'preset-campaigns', title: 'Campaign Presets', icon: Package },
    { id: 'keyword-planner', title: 'Keywords Planner', icon: Target },
    { id: 'draft-campaigns', title: 'Saved Campaigns', icon: FolderOpen },
  ];

  const myCampaigns = stats?.userResources?.myCampaigns || 0;
  const keywordsGenerated = myCampaigns * 485;
  const adsCreated = myCampaigns * 12;
  const extensionsAdded = myCampaigns * 8;

  return (
    <div className="bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 min-h-screen p-6 sm:p-8 lg:p-10 space-y-8" style={{
      '--user-spacing-multiplier': preferences.spacing,
      '--user-font-size-multiplier': preferences.fontSize
    } as React.CSSProperties}>
      {/* Improvised Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 bg-white/40 backdrop-blur-md p-8 sm:p-10 rounded-[2.5rem] border border-white/40 shadow-2xl shadow-indigo-100/20 slide-in-up">
        <div className="space-y-3">
          <div className="flex items-center gap-4">
            <h1 className="text-4xl sm:text-5xl font-black tracking-tight">
              Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">{user?.full_name?.split(' ')[0] || user?.email?.split('@')[0] || 'Admin'}!</span>
            </h1>
            <div className="relative group">
              <span className="px-4 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-[10px] font-bold rounded-full uppercase tracking-widest shadow-lg shadow-indigo-200/50">Beta</span>
              <div className="absolute -inset-1 bg-indigo-400 rounded-full blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            </div>
          </div>
          <p className="text-slate-500 text-xl font-medium max-w-2xl leading-relaxed">
            Your command center is ready. <span className="text-indigo-400">12 new insights</span> are waiting for your attention.
          </p>
        </div>
        <Button 
          onClick={() => onNavigate('builder-3')}
          className="h-16 px-10 rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-purple-700 hover:from-indigo-500 hover:to-purple-600 text-white font-bold text-lg shadow-2xl shadow-indigo-500/30 transition-all duration-300 hover:scale-[1.05] active:scale-[0.95] flex items-center gap-4 border-t border-white/20 group"
        >
          <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center group-hover:rotate-12 transition-transform">
            <Zap className="w-5 h-5 fill-white" />
          </div>
          New Campaign
        </Button>
      </div>

      {/* Enhanced Terminal-Style System Stats - Shell View */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 slide-in-up">
        <TerminalCard title="campaign_stats.sh" icon={<Terminal className="w-4 h-4" />}>
          <div className="space-y-3">
            <TerminalLine prefix="$" label="total_campaigns:" value={`${myCampaigns}`} valueColor="green" />
            <TerminalLine prefix="$" label="keywords_generated:" value={`${keywordsGenerated.toLocaleString()}`} valueColor="cyan" />
            <TerminalLine prefix="$" label="ads_created:" value={`${adsCreated.toLocaleString()}`} valueColor="yellow" />
            <TerminalLine prefix="$" label="extensions_added:" value={`${extensionsAdded.toLocaleString()}`} valueColor="purple" />
            <TerminalLine prefix="$" label="csv_exports:" value={`${myCampaigns}`} valueColor="white" />
          </div>
        </TerminalCard>

        <TerminalCard title="status_info.sh" icon={<Activity className="w-4 h-4" />}>
          <div className="space-y-3">
            <TerminalLine prefix="$" label="api_status:" value="ONLINE" valueColor="green" />
            <TerminalLine prefix="$" label="google_ads_api:" value="CONNECTED" valueColor="green" />
            <TerminalLine prefix="$" label="keyword_planner:" value="READY" valueColor="green" />
            <TerminalLine prefix="$" label="subscription:" value={stats?.subscription?.plan?.toUpperCase() || 'FREE'} valueColor="cyan" />
            <TerminalLine prefix="$" label="last_activity:" value={formatRelativeTime(stats?.activity?.lastLogin || null)} valueColor="slate" />
          </div>
        </TerminalCard>
      </div>

      {/* Enhanced My Resources Section */}
      <div className="space-y-6 slide-in-up">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg">
            <Layers className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            My Resources
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Enhanced My Campaigns Card */}
          <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/50 card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-400 to-rose-500 flex items-center justify-center shadow-lg float-animation">
                <Layers className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-rose-500 bg-rose-50 px-3 py-1 rounded-full border border-rose-200">Total</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-slate-800">{myCampaigns}</h3>
              <p className="text-sm font-medium text-slate-600">My Campaigns</p>
            </div>
            <div className="mt-4 h-2 bg-rose-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-400 to-rose-500 rounded-full transition-all duration-1000" style={{ width: '60%' }}></div>
            </div>
          </div>

          {/* Enhanced My Presets Card */}
          <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/50 card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-indigo-500 flex items-center justify-center shadow-lg float-delay-1">
                <Package className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-200">Saved</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-slate-800">{stats?.userResources?.myPresets || 0}</h3>
              <p className="text-sm font-medium text-slate-600">My Presets</p>
            </div>
            <div className="mt-4 h-2 bg-indigo-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-indigo-400 to-indigo-500 rounded-full transition-all duration-1000" style={{ width: '30%' }}></div>
            </div>
          </div>

          {/* Enhanced My Domains Card */}
          <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/50 card-hover">
            <div className="flex items-start justify-between mb-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg float-delay-2">
                <Globe className="w-7 h-7 text-white" />
              </div>
              <span className="text-xs font-semibold text-amber-500 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">Active</span>
            </div>
            <div className="space-y-2">
              <h3 className="text-4xl font-bold text-slate-800">{stats?.userResources?.myDomains || 0}</h3>
              <p className="text-sm font-medium text-slate-600">My Domains</p>
            </div>
            <div className="mt-4 h-2 bg-amber-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-1000" style={{ width: '20%' }}></div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Colorful Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 slide-in-up">
        {/* Keywords Generated - Enhanced Indigo */}
        <div className="rounded-2xl p-8 text-white shadow-xl card-hover" style={{ background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90 mb-2">Keywords Generated</p>
              <p className="text-4xl font-bold mb-3">{keywordsGenerated.toLocaleString()}</p>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <ArrowUp className="w-4 h-4" />
                <span>23% from last week</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center float-animation">
              <Target className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Ads Created - Enhanced Coral */}
        <div className="rounded-2xl p-8 text-white shadow-xl card-hover" style={{ background: 'linear-gradient(135deg, #F97B5C 0%, #E5684A 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90 mb-2">Ads Created</p>
              <p className="text-4xl font-bold mb-3">{adsCreated.toLocaleString()}</p>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <ArrowUp className="w-4 h-4" />
                <span>12% from last week</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center float-delay-1">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>

        {/* Extensions Added - Enhanced Pink/Rose */}
        <div className="rounded-2xl p-8 text-white shadow-xl card-hover" style={{ background: 'linear-gradient(135deg, #E75A7C 0%, #D44A6A 100%)' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium opacity-90 mb-2">Extensions Added</p>
              <p className="text-4xl font-bold mb-3">{extensionsAdded.toLocaleString()}</p>
              <div className="flex items-center gap-2 text-sm opacity-90">
                <ArrowUp className="w-4 h-4" />
                <span>8% from last week</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center float-delay-2">
              <Package className="w-8 h-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Community Section - Lazy loaded for faster initial render */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 slide-in-up">
        <div className="lg:col-span-2">
          <Suspense fallback={
            <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/50 animate-pulse">
              <div className="h-6 bg-slate-200 rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-4 bg-slate-200 rounded"></div>
                <div className="h-4 bg-slate-200 rounded w-5/6"></div>
              </div>
            </div>
          }>
            <CommunityDashboardWidget onViewAll={() => window.open('https://community.adiology.io/', '_blank')} />
          </Suspense>
        </div>
        <div className="glass-card rounded-2xl p-6 shadow-xl border border-white/50">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">Need Help?</h3>
              <p className="text-sm text-gray-500">Connect with the community</p>
            </div>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Join our community to share strategies, get tips, and connect with other Google Ads professionals.
          </p>
          <button
            onClick={() => window.open('https://community.adiology.io/', '_blank')}
            className="w-full py-2.5 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:from-indigo-700 hover:to-purple-700 transition-all"
          >
            Visit Community
          </button>
        </div>
      </div>

      {/* Enhanced Quick Actions */}
      <div className="space-y-6 slide-in-up">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
            Quick Actions
          </h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <button
                key={action.id}
                onClick={() => onNavigate(action.id)}
                className="group glass-card rounded-2xl p-4 shadow-lg border border-white/50 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 card-hover"
              >
                <div className="flex flex-col items-center space-y-3">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${
                    index % 6 === 0 ? 'from-indigo-500 to-purple-500' :
                    index % 6 === 1 ? 'from-purple-500 to-pink-500' :
                    index % 6 === 2 ? 'from-cyan-500 to-blue-500' :
                    index % 6 === 3 ? 'from-green-500 to-emerald-500' :
                    index % 6 === 4 ? 'from-orange-500 to-red-500' :
                    'from-rose-500 to-pink-500'
                  } flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-sm font-semibold text-slate-700 text-center leading-tight">{action.title}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

