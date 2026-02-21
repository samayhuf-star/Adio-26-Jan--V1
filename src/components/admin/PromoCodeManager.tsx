import { useState, useEffect } from 'react';
import {
  Tag,
  Plus,
  RefreshCw,
  Trash2,
  X
} from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
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

interface PromoCode {
  id: string;
  code: string;
  percentOff: number;
  timesRedeemed: number;
  maxRedemptions?: number;
  active: boolean;
  created: string;
}

interface PromoCodeManagerProps {
  token: string;
}

export function PromoCodeManager({ token }: PromoCodeManagerProps) {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [deactivateConfirm, setDeactivateConfirm] = useState<PromoCode | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    code: '',
    percentOff: '',
    maxRedemptions: '',
    duration: 'forever'
  });

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

  const loadPromoCodes = async () => {
    try {
      setLoading(true);
      const response = await adminFetch('/api/superadmin/promo-codes');
      if (response.ok) {
        const data = await response.json();
        setPromoCodes(data.promoCodes || []);
      }
    } catch (error) {
      console.error('Failed to load promo codes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const handleCreatePromoCode = async () => {
    if (!formData.code.trim() || !formData.percentOff) {
      alert('Please fill in required fields');
      return;
    }

    const percentOff = parseInt(formData.percentOff);
    if (percentOff < 1 || percentOff > 100) {
      alert('Percent off must be between 1 and 100');
      return;
    }

    try {
      setActionLoading(true);
      const body: any = {
        code: formData.code.toUpperCase(),
        percentOff,
      };

      if (formData.maxRedemptions) {
        body.maxRedemptions = parseInt(formData.maxRedemptions);
      }

      if (formData.duration && formData.duration !== 'forever') {
        body.duration = formData.duration;
      }

      const response = await adminFetch('/api/superadmin/promo-codes', {
        method: 'POST',
        body: JSON.stringify(body)
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.promoCode) {
          setPromoCodes([...promoCodes, data.promoCode]);
          setFormData({ code: '', percentOff: '', maxRedemptions: '', duration: 'forever' });
          setShowCreateForm(false);
        } else {
          alert(data.error || 'Failed to create promo code');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to create promo code');
      }
    } catch (error) {
      console.error('Failed to create promo code:', error);
      alert('Failed to create promo code');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivatePromoCode = async () => {
    if (!deactivateConfirm) return;

    try {
      setActionLoading(true);
      const response = await adminFetch(
        `/api/superadmin/promo-codes/${deactivateConfirm.id}/deactivate`,
        { method: 'POST' }
      );

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setPromoCodes(promoCodes.map(pc =>
            pc.id === deactivateConfirm.id ? { ...pc, active: false } : pc
          ));
          setDeactivateConfirm(null);
        } else {
          alert(data.error || 'Failed to deactivate promo code');
        }
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to deactivate promo code');
      }
    } catch (error) {
      console.error('Failed to deactivate promo code:', error);
      alert('Failed to deactivate promo code');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
            <Tag className="w-5 h-5 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-white">Promo Codes</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={loadPromoCodes}
            disabled={loading}
            variant="outline"
            size="sm"
            className="border-slate-600 text-slate-300 hover:bg-slate-700"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create New Code
          </Button>
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-white">Create Promo Code</h3>
            <Button
              onClick={() => setShowCreateForm(false)}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Code <span className="text-red-400">*</span>
              </label>
              <Input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g., SAVE20"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Percent Off <span className="text-red-400">*</span>
              </label>
              <Input
                type="number"
                min="1"
                max="100"
                value={formData.percentOff}
                onChange={(e) => setFormData({ ...formData, percentOff: e.target.value })}
                placeholder="e.g., 20"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Max Redemptions (Optional)
              </label>
              <Input
                type="number"
                min="1"
                value={formData.maxRedemptions}
                onChange={(e) => setFormData({ ...formData, maxRedemptions: e.target.value })}
                placeholder="e.g., 100"
                className="bg-slate-700/50 border-slate-600 text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">
                Duration
              </label>
              <select
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                className="w-full bg-slate-700/50 border border-slate-600 text-white rounded-md px-3 py-2"
              >
                <option value="once">Once</option>
                <option value="repeating">Repeating</option>
                <option value="forever">Forever</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button
              onClick={() => setShowCreateForm(false)}
              variant="outline"
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreatePromoCode}
              disabled={actionLoading}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700"
            >
              {actionLoading ? 'Creating...' : 'Create Promo Code'}
            </Button>
          </div>
        </div>
      )}

      {/* Promo Codes Table */}
      <div className="bg-slate-800/50 border border-slate-700/50 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-700/50">
              <tr>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Code</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Discount</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Uses</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Max Uses</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Created</th>
                <th className="text-left px-4 py-3 text-sm font-medium text-slate-300">Status</th>
                <th className="text-right px-4 py-3 text-sm font-medium text-slate-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {promoCodes.map(promoCode => (
                <tr key={promoCode.id} className="hover:bg-slate-700/30">
                  <td className="px-4 py-3">
                    <p className="text-white font-mono font-semibold">{promoCode.code}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-white">{promoCode.percentOff}% off</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-300">{promoCode.timesRedeemed}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-slate-300">
                      {promoCode.maxRedemptions ? promoCode.maxRedemptions : 'Unlimited'}
                    </p>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-sm">
                    {formatDate(promoCode.created)}
                  </td>
                  <td className="px-4 py-3">
                    {promoCode.active ? (
                      <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                        Active
                      </Badge>
                    ) : (
                      <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                        Deactivated
                      </Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {promoCode.active && (
                      <Button
                        onClick={() => setDeactivateConfirm(promoCode)}
                        variant="outline"
                        size="sm"
                        disabled={actionLoading}
                        className="border-red-500/50 text-red-400 hover:bg-red-500/20"
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Deactivate
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {promoCodes.length === 0 && (
          <div className="px-4 py-8 text-center text-slate-400">
            <p>No promo codes created yet</p>
          </div>
        )}
      </div>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={deactivateConfirm !== null} onOpenChange={(open) => {
        if (!open) setDeactivateConfirm(null);
      }}>
        <AlertDialogContent className="bg-slate-800 border-slate-700">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Deactivate Promo Code</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              Are you sure you want to deactivate the promo code <span className="font-mono font-semibold text-slate-300">{deactivateConfirm?.code}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-slate-600 text-slate-300 hover:bg-slate-700">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeactivatePromoCode}
              disabled={actionLoading}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {actionLoading ? 'Deactivating...' : 'Deactivate'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
