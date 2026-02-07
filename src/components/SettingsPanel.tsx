import React, { useState, useEffect } from 'react';
import { getCurrentUserProfile, getCurrentUser, isAuthenticated, getSessionTokenSync } from '../utils/auth';
import { 
  User, Mail, Lock, Globe,
  Save, Eye, EyeOff,
  CheckCircle2, AlertCircle, Loader,
  PanelLeftClose, PanelLeftOpen
} from 'lucide-react';
import { getUserPreferences, saveUserPreferences } from '../utils/userPreferences';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { BillingPanel } from './BillingPanel';
import { notifications } from '../utils/notifications';
import { TerminalCard, TerminalLine } from './ui/terminal-card';

interface GoogleAdsAccount {
  id: string;
  name: string;
}

interface SettingsPanelProps {
  defaultTab?: 'settings' | 'billing';
}

export const SettingsPanel = ({ defaultTab = 'settings' }: SettingsPanelProps) => {
  const currentUser = getCurrentUser();
  const getToken = async () => getSessionTokenSync();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [activeTab, setActiveTab] = useState<string>(defaultTab);
  
  // Google Ads state
  const [googleAdsConnected, setGoogleAdsConnected] = useState(false);
  const [googleAdsLoading, setGoogleAdsLoading] = useState(true);
  const [googleAdsAccounts, setGoogleAdsAccounts] = useState<GoogleAdsAccount[]>([]);
  const [defaultAccount, setDefaultAccount] = useState<string>('');
  
  // Sidebar auto-close preference
  const [sidebarAutoClose, setSidebarAutoClose] = useState(() => getUserPreferences().sidebarAutoClose);

  useEffect(() => {
    // Load user data and Google Ads info
    const loadData = async () => {
      try {
        setLoading(true);
        const userProfile = await getCurrentUserProfile();
        if (userProfile) {
          setUser(userProfile);
          setName(userProfile.full_name || '');
          setEmail(userProfile.email || '');
        }
        
        // Load Google Ads connection status
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
          
          // Load default account from user profile
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

  // Update active tab when defaultTab prop changes
  useEffect(() => {
    setActiveTab(defaultTab);
  }, [defaultTab]);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    setSaveMessage(null);
    
    try {
      // Bug_08: Validate that name and email are not blank
      const trimmedName = name.trim();
      const trimmedEmail = email.trim();
      
      if (!trimmedName) {
        setSaveMessage({ type: 'error', text: 'Full Name cannot be blank. Please enter your name.' });
        setIsSaving(false);
        return;
      }
      
      // Get current user
      const currentUser = await getCurrentUserProfile();
      if (!currentUser) {
        throw new Error('User not found');
      }

      // Update user profile in database via API
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

      const { error } = { error: null }; // Placeholder for compatibility

      if (error) throw error;

      // Refresh user data
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
    const trimmedCurrentPassword = currentPassword.trim();
    const trimmedNewPassword = newPassword.trim();
    const trimmedConfirmPassword = confirmPassword.trim();
    
    if (!currentUser) {
      setSaveMessage({ type: 'error', text: 'You must be signed in to change your password.' });
      return;
    }
    
    if (!trimmedCurrentPassword) {
      setSaveMessage({ type: 'error', text: 'Current password is required. Please enter your current password.' });
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
      const userProfile = await getCurrentUserProfile();
      if (!userProfile) throw new Error('User not found');
      
      // Update password via API
      const token = await getToken();
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword: trimmedCurrentPassword,
          newPassword: trimmedNewPassword,
          confirmPassword: trimmedConfirmPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }
      
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
      setSaveMessage({ type: 'success', text: 'Password changed successfully!' });
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error changing password:', error);
      let errorMessage = 'Failed to change password. Please try again.';
      
      if (error.message) {
        if (error.message.includes('incorrect') || error.message.includes('invalid')) {
          errorMessage = 'Current password is incorrect. Please try again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setSaveMessage({ type: 'error', text: errorMessage });
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

  return (
    <div className="p-8 lg:p-10 max-w-7xl mx-auto w-full">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-slate-900 mb-3">
          Settings
        </h1>
        <p className="text-slate-600 text-lg">Manage your account settings, billing, and preferences</p>
      </div>

      {/* Terminal-Style Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-8">
        <TerminalCard title="Account Status" showDots={true} variant="compact">
          <div className="space-y-1.5">
            <TerminalLine prefix="$" label="user:" value={name || 'NOT_SET'} valueColor={name ? 'green' : 'yellow'} />
            <TerminalLine prefix="$" label="email:" value={email ? email.substring(0, 20) + (email.length > 20 ? '...' : '') : 'NOT_SET'} valueColor={email ? 'cyan' : 'yellow'} />
            <TerminalLine prefix="$" label="auth_provider:" value="CUSTOM" valueColor="purple" />
            <TerminalLine prefix="$" label="status:" value={user ? 'AUTHENTICATED' : 'NOT_LOGGED_IN'} valueColor={user ? 'green' : 'yellow'} />
          </div>
        </TerminalCard>

        <TerminalCard title="Integrations" showDots={true} variant="compact">
          <div className="space-y-1.5">
            <TerminalLine prefix=">" label="google_ads:" value={googleAdsConnected ? 'CONNECTED' : googleAdsLoading ? 'CHECKING...' : 'DISCONNECTED'} valueColor={googleAdsConnected ? 'green' : googleAdsLoading ? 'slate' : 'yellow'} />
            <TerminalLine prefix=">" label="accounts:" value={`${googleAdsAccounts.length}`} valueColor="cyan" />
            <TerminalLine prefix=">" label="default_account:" value={defaultAccount ? defaultAccount.substring(0, 12) + '...' : 'NONE'} valueColor={defaultAccount ? 'green' : 'slate'} />
            <TerminalLine prefix=">" label="tab:" value={activeTab.toUpperCase()} valueColor="purple" />
          </div>
        </TerminalCard>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-10 p-2 bg-slate-100 rounded-lg">
          <TabsTrigger value="settings" className="text-base py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Settings</TabsTrigger>
          <TabsTrigger value="billing" className="text-base py-3 data-[state=active]:bg-white data-[state=active]:shadow-sm">Billing</TabsTrigger>
        </TabsList>
        
        <TabsContent value="settings" className="space-y-10 mt-0">

      {saveMessage && (
        <Alert 
          variant={saveMessage.type === 'success' ? 'default' : 'destructive'}
          className={saveMessage.type === 'success' ? 'border-green-500 bg-indigo-50' : ''}
        >
          {saveMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4" />
          )}
          <AlertDescription className={saveMessage.type === 'success' ? 'text-green-700 font-medium' : ''}>
            {saveMessage.text}
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Settings */}
      <Card className="p-8">
        <CardHeader className="pb-6 mb-6 border-b border-slate-200">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <User className="w-6 h-6 text-blue-600" />
            Profile Information
          </CardTitle>
          <CardDescription className="text-base mt-2">Update your personal information and account details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="name" className="text-base font-semibold">Full Name</Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="pl-12 pr-4 h-12 text-base"
                  placeholder="Enter your full name"
                />
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="email" className="text-base font-semibold">Email Address</Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  readOnly
                  disabled
                  className="pl-12 pr-4 h-12 text-base bg-slate-50 cursor-not-allowed"
                  placeholder="Enter your email"
                />
              </div>
              <p className="text-xs text-slate-500">Email cannot be changed. Contact support if you need to update your email.</p>
            </div>
          </div>
          <div className="flex justify-start pt-4">
            <Button onClick={handleSaveProfile} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 h-12 text-base">
              <Save className="w-5 h-5 mr-2" />
              Save Profile Changes
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Password Settings */}
      <Card className="p-8">
        <CardHeader className="pb-6 mb-6 border-b border-slate-200">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Lock className="w-6 h-6 text-blue-600" />
            Change Password
          </CardTitle>
          <CardDescription className="text-base mt-2">Update your password to keep your account secure</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8 pt-6">
          <div className="space-y-3">
            <Label htmlFor="currentPassword" className="text-base font-semibold">Current Password</Label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
              <Input
                id="currentPassword"
                type={showPassword ? 'text' : 'password'}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="pl-12 pr-12 h-12 text-base"
                placeholder="Enter current password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <Label htmlFor="newPassword" className="text-base font-semibold">New Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                <Input
                  id="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 text-base"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <Label htmlFor="confirmPassword" className="text-base font-semibold">Confirm New Password</Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none z-10" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="pl-12 pr-12 h-12 text-base"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
          <div className="flex justify-start pt-4">
            <Button onClick={handleChangePassword} disabled={isSaving} className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 h-12 text-base">
              <Lock className="w-5 h-5 mr-2" />
              Change Password
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Google Ads Connection */}
      <Card className={`p-8 ${googleAdsConnected ? 'border-indigo-200 bg-indigo-50' : 'border-blue-200 bg-blue-50'}`}>
        <CardHeader className="pb-6 mb-6 border-b border-slate-200">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <Globe className="w-6 h-6 text-blue-600" />
            Google Ads Accounts
          </CardTitle>
          <CardDescription className="text-base mt-2">Connect and manage your Google Ads accounts for direct campaign pushes</CardDescription>
        </CardHeader>
        
        <CardContent className="pt-6 space-y-6">
          {googleAdsLoading ? (
            <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
              <Loader className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-blue-700">Checking connection status...</span>
            </div>
          ) : googleAdsConnected ? (
            <>
              <Alert className="border-indigo-200 bg-indigo-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-green-800">
                  Your Google Ads account is connected
                </AlertDescription>
              </Alert>
              
              {googleAdsAccounts.length > 0 && (
                <div className="space-y-4">
                  <div>
                    <Label className="text-base font-semibold mb-2 block">Select Default Account</Label>
                    <p className="text-sm text-slate-600 mb-3">Campaigns will be pushed to this account by default</p>
                    <Select value={defaultAccount} onValueChange={setDefaultAccount}>
                      <SelectTrigger className="w-full h-10">
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
                  
                  <Button onClick={saveDefaultAccount} className="bg-green-600 hover:bg-green-700 text-white w-full">
                    <Save className="w-4 h-4 mr-2" />
                    Save Default Account
                  </Button>
                </div>
              )}
            </>
          ) : (
            <>
              <Alert className="border-blue-200 bg-blue-50">
                <AlertCircle className="h-4 w-4 text-blue-600" />
                <AlertDescription className="text-blue-800">
                  Connect your Google Ads account to push campaigns directly
                </AlertDescription>
              </Alert>
              
              <div className="relative">
                <Button disabled className="bg-gray-400 cursor-not-allowed text-white w-full opacity-70">
                  <Globe className="w-4 h-4 mr-2" />
                  Connect Google Ads Account
                </Button>
                <Badge className="absolute -top-2 -right-2 bg-amber-500 text-white text-xs px-2 py-0.5">Coming Soon</Badge>
              </div>
            </>
          )}
        </CardContent>
      </Card>


      {/* Sidebar Behavior */}
      <Card className="p-8">
        <CardHeader className="pb-6 mb-6 border-b border-slate-200">
          <CardTitle className="flex items-center gap-3 text-2xl">
            {sidebarAutoClose ? (
              <PanelLeftClose className="w-6 h-6 text-blue-600" />
            ) : (
              <PanelLeftOpen className="w-6 h-6 text-blue-600" />
            )}
            Sidebar Behavior
          </CardTitle>
          <CardDescription className="text-base mt-2">Configure how the sidebar behaves when you select a menu item</CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-1">
              <p className="font-semibold text-slate-900">Auto-Close Sidebar</p>
              <p className="text-sm text-slate-600">Automatically close the sidebar after selecting a menu item</p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newValue = !sidebarAutoClose;
                setSidebarAutoClose(newValue);
                saveUserPreferences({ sidebarAutoClose: newValue });
              }}
              className={`h-10 px-4 gap-2 ${
                sidebarAutoClose 
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700 hover:bg-indigo-100' 
                  : 'bg-slate-50 border-slate-300 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {sidebarAutoClose ? (
                <>
                  <PanelLeftClose className="w-4 h-4" />
                  <span>ON</span>
                </>
              ) : (
                <>
                  <PanelLeftOpen className="w-4 h-4" />
                  <span>OFF</span>
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

        </TabsContent>
        
        <TabsContent value="billing" className="mt-0 w-full">
          <BillingPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
};


