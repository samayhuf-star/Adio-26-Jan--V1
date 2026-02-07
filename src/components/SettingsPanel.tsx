import React, { useState, useEffect } from 'react';
import { getCurrentUserProfile, getCurrentUser, isAuthenticated, getSessionTokenSync } from '../utils/auth';
import { 
  User, Mail, Lock, Globe,
  Save, Eye, EyeOff,
  CheckCircle2, AlertCircle, Loader,
  PanelLeftClose, PanelLeftOpen,
  Settings, CreditCard, Shield, ChevronRight
} from 'lucide-react';
import { getUserPreferences, saveUserPreferences } from '../utils/userPreferences';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BillingPanel } from './BillingPanel';
import { notifications } from '../utils/notifications';

interface GoogleAdsAccount {
  id: string;
  name: string;
}

interface SettingsPanelProps {
  defaultTab?: 'settings' | 'billing';
}

type SettingsSection = 'profile' | 'password' | 'integrations' | 'preferences' | 'billing';

export const SettingsPanel = ({ defaultTab = 'settings' }: SettingsPanelProps) => {
  const currentUser = getCurrentUser();
  const getToken = async () => getSessionTokenSync();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeSection, setActiveSection] = useState<SettingsSection>(defaultTab === 'billing' ? 'billing' : 'profile');
  
  const [googleAdsConnected, setGoogleAdsConnected] = useState(false);
  const [googleAdsLoading, setGoogleAdsLoading] = useState(true);
  const [googleAdsAccounts, setGoogleAdsAccounts] = useState<GoogleAdsAccount[]>([]);
  const [defaultAccount, setDefaultAccount] = useState<string>('');
  
  const [sidebarAutoClose, setSidebarAutoClose] = useState(() => getUserPreferences().sidebarAutoClose);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const userProfile = await getCurrentUserProfile();
        if (userProfile) {
          setUser(userProfile);
          setName(userProfile.full_name || '');
          setEmail(userProfile.email || '');
        }
        await checkGoogleAdsConnection();
      } catch (e) {
        console.error('Failed to load user data', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);
  
  const checkGoogleAdsConnection = async () => {
    try {
      setGoogleAdsLoading(true);
      const response = await fetch('/api/google-ads/status');
      const data = await response.json();
      setGoogleAdsConnected(data.connected);
      
      if (data.connected) {
        const accountsResponse = await fetch('/api/google-ads/accounts');
        const accountsData = await accountsResponse.json();
        if (accountsData.accounts) {
          const accounts = accountsData.accounts.map((acc: string) => ({
            id: acc.replace('customers/', ''),
            name: `Account ${acc.replace('customers/', '')}`
          }));
          setGoogleAdsAccounts(accounts);
          
          const userProfile = await getCurrentUserProfile();
          if (userProfile?.google_ads_default_account) {
            setDefaultAccount(userProfile.google_ads_default_account);
          } else if (accounts.length > 0) {
            setDefaultAccount(accounts[0].id);
          }
        }
      }
    } catch (err) {
      console.error('Failed to check Google Ads connection:', err);
    } finally {
      setGoogleAdsLoading(false);
    }
  };
  
  const connectGoogleAds = async () => {
    try {
      const response = await fetch('/api/google-ads/auth-url');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      } else {
        notifications.error('Could not get Google Ads auth URL', { title: 'Connection Error' });
      }
    } catch (err) {
      console.error('Failed to get auth URL:', err);
      notifications.error('Failed to connect to Google Ads', { title: 'Connection Error' });
    }
  };
  
  const saveDefaultAccount = async () => {
    try {
      const userProfile = await getCurrentUserProfile();
      if (!userProfile) throw new Error('User not found');
      
      const token = await getToken();
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          google_ads_default_account: defaultAccount 
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save default account');
      }
      
      notifications.success('Default account saved', { title: 'Success' });
    } catch (err) {
      console.error('Failed to save default account:', err);
      notifications.error('Failed to save default account', { title: 'Error' });
    }
  };

  useEffect(() => {
    setActiveSection(defaultTab === 'billing' ? 'billing' : 'profile');
  }, [defaultTab]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      
      if (!trimmedName) {
        setSaveMessage({ type: 'error', text: 'Full Name cannot be blank. Please enter your name.' });
        setIsSaving(false);
        return;
      }
      
      const currentUser = await getCurrentUserProfile();
      if (!currentUser) {
        throw new Error('User not found');
      }

      const token = await getToken();
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          full_name: trimmedName,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const { error } = { error: null };
      if (error) throw error;

      const updatedProfile = await getCurrentUserProfile();
      if (updatedProfile) {
        setUser(updatedProfile);
      }
      
      setSaveMessage({ type: 'success', text: 'Profile updated successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error) {
      console.error('Error updating profile:', error);
      setSaveMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    
    if (!currentUser) {
      setSaveMessage({ type: 'error', text: 'You must be signed in to change your password.' });
      return;
    }
    
    if (!trimmedNewPassword) {
      setSaveMessage({ type: 'error', text: 'New password is required. Please enter a new password.' });
      return;
    }
    
    if (!trimmedConfirmPassword) {
      setSaveMessage({ type: 'error', text: 'Please confirm your new password by entering it again.' });
      return;
    }
    
    if (trimmedNewPassword.length < 8) {
      setSaveMessage({ type: 'error', text: 'Password must be at least 8 characters.' });
      return;
    }
    
    if (trimmedNewPassword !== trimmedConfirmPassword) {
      setSaveMessage({ type: 'error', text: 'Passwords do not match. Please make sure both password fields are the same.' });
      return;
    }
    
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      const token = await getToken();
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          newPassword: trimmedNewPassword,
          confirmPassword: trimmedConfirmPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change password');
      }
      
      setNewPassword('');
      setConfirmPassword('');
      
      setSaveMessage({ type: 'success', text: 'Password updated successfully! You can now log in with your new password.' });
      setTimeout(() => setSaveMessage(null), 5000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      setSaveMessage({ type: 'error', text: error.message || 'Failed to change password. Please try again.' });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mb-4"></div>
          <p className="text-slate-600">Loading settings...</p>
        </div>
      </div>
    );
  }

  const navItems: { id: SettingsSection; label: string; icon: React.ReactNode; description: string }[] = [
    { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" />, description: 'Personal info' },
    { id: 'password', label: 'Security', icon: <Shield className="w-4 h-4" />, description: 'Password' },
    { id: 'integrations', label: 'Integrations', icon: <Globe className="w-4 h-4" />, description: 'Connected apps' },
    { id: 'preferences', label: 'Preferences', icon: <Settings className="w-4 h-4" />, description: 'App settings' },
    { id: 'billing', label: 'Billing', icon: <CreditCard className="w-4 h-4" />, description: 'Plans & payments' },
  ];

  const userInitial = (name || email || 'U').charAt(0).toUpperCase();

  return (
    <div className="p-4 md:p-6 lg:p-8 max-w-6xl mx-auto w-full">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-1">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-violet-200">
            {userInitial}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-sm text-slate-500">Manage your account, security, and preferences</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Navigation */}
        <div className="lg:w-56 shrink-0">
          <nav className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-all border-b border-gray-100 last:border-b-0 ${
                  activeSection === item.id
                    ? 'bg-gradient-to-r from-violet-50 to-purple-50 text-violet-700 font-medium border-l-[3px] border-l-violet-500'
                    : 'text-slate-600 hover:bg-gray-50 border-l-[3px] border-l-transparent'
                }`}
              >
                <span className={activeSection === item.id ? 'text-violet-500' : 'text-slate-400'}>{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="truncate">{item.label}</p>
                </div>
                {activeSection === item.id && <ChevronRight className="w-3.5 h-3.5 text-violet-400" />}
              </button>
            ))}
          </nav>

          {/* Quick Status */}
          <div className="mt-4 bg-white rounded-xl border border-gray-200 shadow-sm p-4">
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Account</p>
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Status</span>
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                  Active
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Google Ads</span>
                <span className={`text-xs font-medium ${googleAdsConnected ? 'text-green-600' : 'text-slate-400'}`}>
                  {googleAdsConnected ? 'Connected' : 'Not connected'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">Sidebar</span>
                <span className="text-xs font-medium text-slate-600">{sidebarAutoClose ? 'Auto-close' : 'Stay open'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {saveMessage && (
            <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-lg text-sm ${
              saveMessage.type === 'success'
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            }`}>
              {saveMessage.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
              {saveMessage.text}
            </div>
          )}

          {/* Profile Section */}
          {activeSection === 'profile' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-violet-100 rounded-lg">
                    <User className="w-5 h-5 text-violet-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Profile Information</h2>
                    <p className="text-sm text-slate-500">Update your personal details</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                {/* Avatar Preview */}
                <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-xl shadow-lg">
                    {userInitial}
                  </div>
                  <div>
                    <p className="font-semibold text-slate-800">{name || 'Your Name'}</p>
                    <p className="text-sm text-slate-500">{email}</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-sm font-medium text-slate-700">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                      <Input
                        id="name"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="pl-10 h-10 bg-white border-gray-200 focus:border-violet-400 focus:ring-violet-400/20"
                        placeholder="Enter your full name"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium text-slate-700">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        readOnly
                        disabled
                        className="pl-10 h-10 bg-gray-50 border-gray-200 cursor-not-allowed text-slate-500"
                        placeholder="Enter your email"
                      />
                    </div>
                    <p className="text-xs text-slate-400">Email cannot be changed. Contact support to update.</p>
                  </div>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 h-10 shadow-sm"
                  >
                    {isSaving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Security / Password Section */}
          {activeSection === 'password' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Shield className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Security</h2>
                    <p className="text-sm text-slate-500">Manage your password and account security</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-5">
                <div className="grid md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword" className="text-sm font-medium text-slate-700">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                      <Input
                        id="newPassword"
                        type={showNewPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10 pr-10 h-10 bg-white border-gray-200 focus:border-violet-400 focus:ring-violet-400/20"
                        placeholder="Enter new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNewPassword(!showNewPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                      >
                        {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword" className="text-sm font-medium text-slate-700">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none z-10" />
                      <Input
                        id="confirmPassword"
                        type={showConfirmPassword ? 'text' : 'password'}
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10 pr-10 h-10 bg-white border-gray-200 focus:border-violet-400 focus:ring-violet-400/20"
                        placeholder="Confirm new password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                      >
                        {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
                  <p className="text-xs text-slate-500">Password must be at least 8 characters long. Use a mix of letters, numbers, and symbols for better security.</p>
                </div>

                <div className="pt-2 flex justify-end">
                  <Button
                    onClick={handleChangePassword}
                    disabled={isSaving}
                    className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white px-6 h-10 shadow-sm"
                  >
                    {isSaving ? <Loader className="w-4 h-4 mr-2 animate-spin" /> : <Lock className="w-4 h-4 mr-2" />}
                    Update Password
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Integrations Section */}
          {activeSection === 'integrations' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Globe className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Integrations</h2>
                    <p className="text-sm text-slate-500">Connect external services to your account</p>
                  </div>
                </div>
              </div>
              <div className="p-6">
                {/* Google Ads Integration Card */}
                <div className={`rounded-lg border p-5 ${googleAdsConnected ? 'border-green-200 bg-green-50/50' : 'border-gray-200 bg-gray-50/50'}`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white rounded-lg border border-gray-200 flex items-center justify-center shadow-sm">
                        <Globe className="w-5 h-5 text-blue-500" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">Google Ads</p>
                        <p className="text-xs text-slate-500">Push campaigns directly to your ad account</p>
                      </div>
                    </div>
                    {googleAdsLoading ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        <Loader className="w-3 h-3 animate-spin" />
                        Checking...
                      </span>
                    ) : googleAdsConnected ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Connected
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full">
                        Disconnected
                      </span>
                    )}
                  </div>

                  {googleAdsConnected && googleAdsAccounts.length > 0 ? (
                    <div className="space-y-3 pt-3 border-t border-gray-200">
                      <div>
                        <Label className="text-sm font-medium text-slate-700 mb-1.5 block">Default Account</Label>
                        <Select value={defaultAccount} onValueChange={setDefaultAccount}>
                          <SelectTrigger className="w-full h-10 bg-white">
                            <SelectValue placeholder="Select an account" />
                          </SelectTrigger>
                          <SelectContent>
                            {googleAdsAccounts.map(account => (
                              <SelectItem key={account.id} value={account.id}>
                                {account.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <Button onClick={saveDefaultAccount} className="bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white w-full h-10">
                        <Save className="w-4 h-4 mr-2" />
                        Save Default Account
                      </Button>
                    </div>
                  ) : !googleAdsConnected && !googleAdsLoading ? (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="relative">
                        <Button disabled className="bg-gray-300 cursor-not-allowed text-white w-full opacity-70 h-10">
                          <Globe className="w-4 h-4 mr-2" />
                          Connect Google Ads Account
                        </Button>
                        <Badge className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5">Coming Soon</Badge>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
          )}

          {/* Preferences Section */}
          {activeSection === 'preferences' && (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Settings className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">Preferences</h2>
                    <p className="text-sm text-slate-500">Customize how the app works for you</p>
                  </div>
                </div>
              </div>
              <div className="p-6 space-y-4">
                {/* Sidebar Behavior Toggle */}
                <div className="flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg border border-gray-200 shadow-sm">
                      {sidebarAutoClose ? <PanelLeftClose className="w-4 h-4 text-violet-500" /> : <PanelLeftOpen className="w-4 h-4 text-slate-500" />}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-800">Auto-Close Sidebar</p>
                      <p className="text-xs text-slate-500">Close sidebar after selecting a menu item</p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      const newValue = !sidebarAutoClose;
                      setSidebarAutoClose(newValue);
                      saveUserPreferences({ sidebarAutoClose: newValue });
                    }}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      sidebarAutoClose ? 'bg-violet-600' : 'bg-gray-300'
                    }`}
                  >
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-sm ${
                      sidebarAutoClose ? 'translate-x-6' : 'translate-x-1'
                    }`} />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Billing Section */}
          {activeSection === 'billing' && (
            <BillingPanel />
          )}
        </div>
      </div>
    </div>
  );
};
