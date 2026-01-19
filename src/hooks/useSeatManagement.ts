import { useState, useCallback } from 'react';
import { useAuth, useOrganization } from '../../utils/authCompat';

export type PlanType = 'lifetime' | 'basic' | 'pro';

export interface SeatInfo {
  plan: PlanType;
  baseSeatLimit: number;
  extraSeats: number;
  totalSeatLimit: number;
  seatsUsed: number;
  seatsAvailable: number;
  stripeCustomerId?: string;
}

export interface CanAddSeatResult {
  allowed: boolean;
  reason?: string;
  seatsUsed: number;
  totalLimit: number;
}

export function useSeatManagement() {
  const { getToken } = useAuth();
  const { organization } = useOrganization();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [seatInfo, setSeatInfo] = useState<SeatInfo | null>(null);

  const fetchSeatInfo = useCallback(async () => {
    if (!organization?.id) return null;

    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      
      const response = await fetch(`/api/organization/${organization.id}/seats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        setSeatInfo(data.data);
        return data.data as SeatInfo;
      } else {
        setError(data.error);
        return null;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [organization?.id, getToken]);

  const canAddSeat = useCallback(async (): Promise<CanAddSeatResult | null> => {
    if (!organization?.id) return null;

    try {
      const token = await getToken();
      
      const response = await fetch(`/api/organization/${organization.id}/seats/can-add`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        return data.data as CanAddSeatResult;
      }
      return null;
    } catch (err) {
      console.error('Error checking seat availability:', err);
      return null;
    }
  }, [organization?.id, getToken]);

  const purchaseExtraSeat = useCallback(async (quantity: number = 1): Promise<string | null> => {
    if (!organization?.id) return null;

    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch(`/api/organization/${organization.id}/seats/add`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          quantity,
          successUrl: `${window.location.origin}/settings?success=seat`,
          cancelUrl: `${window.location.origin}/settings?canceled=seat`
        })
      });
      
      const data = await response.json();
      if (data.success) {
        return data.data.checkoutUrl;
      } else {
        setError(data.error);
        return null;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [organization?.id, getToken]);

  const upgradePlan = useCallback(async (plan: 'basic' | 'pro'): Promise<string | null> => {
    if (!organization?.id) return null;

    try {
      setLoading(true);
      const token = await getToken();
      
      const response = await fetch(`/api/organization/${organization.id}/plan/upgrade`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          plan,
          successUrl: `${window.location.origin}/settings?success=plan`,
          cancelUrl: `${window.location.origin}/settings?canceled=plan`
        })
      });
      
      const data = await response.json();
      if (data.success) {
        return data.data.checkoutUrl;
      } else {
        setError(data.error);
        return null;
      }
    } catch (err: any) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [organization?.id, getToken]);

  const canDowngradePlan = useCallback(async (newPlan: PlanType): Promise<{ allowed: boolean; reason?: string } | null> => {
    if (!organization?.id) return null;

    try {
      const token = await getToken();
      
      const response = await fetch(`/api/organization/${organization.id}/plan/can-downgrade/${newPlan}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      const data = await response.json();
      if (data.success) {
        return data.data;
      }
      return null;
    } catch (err) {
      console.error('Error checking downgrade eligibility:', err);
      return null;
    }
  }, [organization?.id, getToken]);

  return {
    seatInfo,
    loading,
    error,
    fetchSeatInfo,
    canAddSeat,
    purchaseExtraSeat,
    upgradePlan,
    canDowngradePlan,
  };
}

export function useInviteWithSeatCheck() {
  const { canAddSeat } = useSeatManagement();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [seatCheckResult, setSeatCheckResult] = useState<CanAddSeatResult | null>(null);

  const checkBeforeInvite = useCallback(async (): Promise<boolean> => {
    const result = await canAddSeat();
    setSeatCheckResult(result);
    
    if (result && !result.allowed) {
      setShowUpgradeModal(true);
      return false;
    }
    
    return true;
  }, [canAddSeat]);

  return {
    checkBeforeInvite,
    showUpgradeModal,
    setShowUpgradeModal,
    seatCheckResult,
  };
}
