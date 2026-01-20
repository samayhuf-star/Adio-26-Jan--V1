import React, { useState, useEffect, useRef } from 'react';
import { useAuthCompat, useUser } from '../utils/authCompat';
import { Users, UserPlus, Mail, Trash2, XCircle, AlertCircle, Send, Plus, CheckCircle, Clock, Copy, Link2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { toast } from 'sonner';

interface TeamMember {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending';
  joined_at?: string;
  invited_at?: string;
}

interface Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  member_count: number;
}

interface Invite {
  id: string;
  code: string;
  email?: string;
  role: string;
  status: string;
  expires_at: string;
  use_count: number;
  max_uses: number;
  created_at: string;
}

export const Teams: React.FC = () => {
  const { getToken, isSignedIn } = useAuthCompat();
  const { user } = useUserCompat();
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [isInviteDialogOpen, setIsInviteDialogOpen] = useState(false);
  const [isCreateOrgDialogOpen, setIsCreateOrgDialogOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  useEffect(() => {
    if (isSignedIn) {
      loadOrganization();
    }
  }, [isSignedIn]);

  const loadOrganization = async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      
      const response = await fetch('/api/organizations/my', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (!response.ok) {
        console.error('Failed to load organization');
        setIsLoading(false);
        return;
      }
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setOrganization(data.data);
        await Promise.all([
          loadMembers(data.data.id),
          loadInvites(data.data.id)
        ]);
      } else {
        setOrganization(null);
      }
    } catch (err) {
      console.error('Error loading organization:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMembers = async (orgId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/organizations/${orgId}/members`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTeamMembers(data.data);
        }
      }
    } catch (err) {
      console.error('Error loading members:', err);
    }
  };

  const loadInvites = async (orgId: string) => {
    try {
      const token = await getToken();
      const response = await fetch(`/api/organizations/${orgId}/invites`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setInvites(data.data.filter((i: Invite) => i.status === 'pending'));
        }
      }
    } catch (err) {
      console.error('Error loading invites:', err);
    }
  };

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      setError('Please enter an organization name');
      return;
    }

    setIsCreating(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ name: orgName.trim() })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create organization');
        return;
      }

      setOrganization(data.data);
      setIsCreateOrgDialogOpen(false);
      setOrgName('');
      toast.success('Organization created successfully!');
      await loadMembers(data.data.id);
    } catch (err: any) {
      setError(err.message || 'Failed to create organization');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCreateInvite = async () => {
    if (!organization) return;

    setIsCreating(true);
    setError(null);

    try {
      const token = await getToken();
      const response = await fetch(`/api/organizations/${organization.id}/invites`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          email: inviteEmail.trim() || null,
          role: inviteRole,
          expiresInDays: 7,
          maxUses: inviteEmail.trim() ? 1 : 10
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create invite');
        return;
      }

      setGeneratedCode(data.data.code);
      await loadInvites(organization.id);
      setInviteEmail('');
    } catch (err: any) {
      setError(err.message || 'Failed to create invite');
    } finally {
      setIsCreating(false);
    }
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success('Invite code copied to clipboard!');
  };

  const handleCopyLink = (code: string) => {
    const link = `${window.location.origin}/join?code=${code}`;
    navigator.clipboard.writeText(link);
    toast.success('Invite link copied to clipboard!');
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!organization) return;
    
    const member = teamMembers.find(m => m.id === memberId);
    if (!member) return;

    if (member.role === 'owner') {
      toast.error('Cannot remove the team owner');
      return;
    }

    try {
      const token = await getToken();
      const response = await fetch(`/api/organizations/${organization.id}/members/${memberId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to remove member');
        return;
      }

      setTeamMembers(prev => prev.filter(m => m.id !== memberId));
      toast.success(`${member.name || member.email} has been removed`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  const handleRevokeInvite = async (inviteId: string) => {
    if (!organization) return;

    try {
      const token = await getToken();
      const response = await fetch(`/api/organizations/${organization.id}/invites/${inviteId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to revoke invite');
        return;
      }

      setInvites(prev => prev.filter(i => i.id !== inviteId));
      toast.success('Invite revoked');
    } catch (err: any) {
      toast.error(err.message || 'Failed to revoke invite');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: 'admin' | 'editor' | 'viewer') => {
    if (!organization) return;

    try {
      const token = await getToken();
      const response = await fetch(`/api/organizations/${organization.id}/members/${memberId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: newRole })
      });

      if (!response.ok) {
        const data = await response.json();
        toast.error(data.error || 'Failed to update role');
        return;
      }

      setTeamMembers(prev => prev.map(m => 
        m.id === memberId ? { ...m, role: newRole } : m
      ));

      const member = teamMembers.find(m => m.id === memberId);
      if (member) {
        toast.success(`${member.name}'s role updated to ${newRole}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to update role');
    }
  };

  const getCurrentUserRole = () => {
    const currentMember = teamMembers.find(m => m.user_id === user?.id);
    return currentMember?.role || null;
  };

  const canManageTeam = () => {
    const role = getCurrentUserRole();
    return role === 'owner' || role === 'admin';
  };

  if (!isSignedIn) {
    return (
      <div className="p-6 max-w-3xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-xl font-semibold text-gray-700">Please sign in</h2>
          <p className="text-gray-500 mt-2">Sign in to access your team settings.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6 max-w-3xl mx-auto flex items-center justify-center min-h-[400px]">
        <RefreshCw className="w-6 h-6 animate-spin text-purple-600" />
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-6 max-w-3xl mx-auto space-y-6">
        <div className="text-center py-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h2 className="text-2xl font-bold text-gray-800 mb-2">No Organization Yet</h2>
          <p className="text-gray-600 mb-6">Create an organization to start inviting team members.</p>
          <Button 
            onClick={() => setIsCreateOrgDialogOpen(true)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Organization
          </Button>
        </div>

        <Dialog open={isCreateOrgDialogOpen} onOpenChange={setIsCreateOrgDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create Organization</DialogTitle>
              <DialogDescription>
                Give your team a name. This will be visible to all team members.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {error && (
                <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                  <AlertCircle className="h-4 w-4" />
                  {error}
                </div>
              )}
              <Input
                placeholder="e.g., Marketing Team, Acme Corp"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOrgDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateOrganization} 
                disabled={isCreating}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isCreating ? 'Creating...' : 'Create'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7" style={{ color: '#9333ea' }} />
            <span style={{ background: 'linear-gradient(90deg, #9333ea, #c026d3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {organization.name}
            </span>
          </h1>
          <p className="text-gray-500 mt-1">
            {teamMembers.length} member{teamMembers.length !== 1 ? 's' : ''}
          </p>
        </div>
        {canManageTeam() && (
          <Button 
            onClick={() => {
              setGeneratedCode(null);
              setIsInviteDialogOpen(true);
            }}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Invite Member
          </Button>
        )}
      </div>

      {success && (
        <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
          <CheckCircle className="h-4 w-4" />
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg border shadow-sm">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-medium">Team Members</h3>
        </div>
        <div className="divide-y">
          {teamMembers.map((member) => (
            <div key={member.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-medium">
                  {(member.name || member.email || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{member.name || member.email}</p>
                  <p className="text-sm text-gray-500">{member.email}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {member.role === 'owner' ? (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                    Owner
                  </span>
                ) : canManageTeam() ? (
                  <Select
                    value={member.role}
                    onValueChange={(value: string) => handleChangeRole(member.id, value as 'admin' | 'editor' | 'viewer')}
                  >
                    <SelectTrigger className="w-28 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 capitalize">
                    {member.role}
                  </span>
                )}
                {canManageTeam() && member.role !== 'owner' && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveMember(member.id)}
                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {canManageTeam() && invites.length > 0 && (
        <div className="bg-white rounded-lg border shadow-sm">
          <div className="p-4 border-b bg-gray-50">
            <h3 className="font-medium">Pending Invites</h3>
          </div>
          <div className="divide-y">
            {invites.map((invite) => (
              <div key={invite.id} className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-gray-500" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-gray-100 rounded font-mono text-sm">
                        {invite.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyCode(invite.code)}
                        className="h-7 w-7 p-0"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopyLink(invite.code)}
                        className="h-7 w-7 p-0"
                      >
                        <Link2 className="w-3 h-3" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {invite.email ? `For: ${invite.email} • ` : ''}
                      Role: {invite.role} • 
                      Uses: {invite.use_count}/{invite.max_uses} • 
                      Expires: {new Date(invite.expires_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRevokeInvite(invite.id)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <XCircle className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isInviteDialogOpen} onOpenChange={setIsInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Member</DialogTitle>
            <DialogDescription>
              Generate an invite code to share with your team member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {error && (
              <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            {generatedCode ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-sm text-green-700 mb-2">Invite code generated!</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-4 py-3 bg-white rounded-lg font-mono text-xl text-center border">
                      {generatedCode}
                    </code>
                    <Button
                      variant="outline"
                      onClick={() => handleCopyCode(generatedCode)}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => handleCopyLink(generatedCode)}
                  >
                    <Link2 className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </div>
                <p className="text-xs text-gray-500 text-center">
                  Share this code or link with your team member. They can use it to join your organization.
                </p>
              </div>
            ) : (
              <>
                <div>
                  <label className="text-sm font-medium mb-1 block">Email (optional)</label>
                  <Input
                    placeholder="teammate@company.com"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    If provided, only this email can use the invite code.
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-1 block">Role</label>
                  <Select value={inviteRole} onValueChange={(v: string) => setInviteRole(v as 'admin' | 'editor' | 'viewer')}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin - Can manage team and settings</SelectItem>
                      <SelectItem value="editor">Editor - Can create and edit campaigns</SelectItem>
                      <SelectItem value="viewer">Viewer - Read-only access</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setIsInviteDialogOpen(false);
              setGeneratedCode(null);
              setInviteEmail('');
              setError(null);
            }}>
              {generatedCode ? 'Done' : 'Cancel'}
            </Button>
            {!generatedCode && (
              <Button 
                onClick={handleCreateInvite} 
                disabled={isCreating}
                className="bg-gradient-to-r from-purple-600 to-pink-600"
              >
                {isCreating ? 'Generating...' : 'Generate Invite Code'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
