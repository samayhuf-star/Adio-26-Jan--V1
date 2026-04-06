import React, { useState } from 'react';
import { Clock, X, ArrowRight, Zap } from 'lucide-react';

interface TrialBannerProps {
  user: {
    subscription_status?: string;
    current_period_end?: string | null;
    created?: string;
  };
  onUpgrade: () => void;
}

function getTrialDaysRemaining(currentPeriodEnd?: string | null, created?: string): number | null {
  const endStr = currentPeriodEnd;
  if (!endStr) {
    if (!created) return null;
    const createdDate = new Date(created);
    if (isNaN(createdDate.getTime())) return null;
    const trialEnd = new Date(createdDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    const remaining = Math.ceil((trialEnd.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
    return Math.max(0, remaining);
  }
  const end = new Date(endStr);
  if (isNaN(end.getTime())) return null;
  const remaining = Math.ceil((end.getTime() - Date.now()) / (24 * 60 * 60 * 1000));
  return Math.max(0, remaining);
}

export function TrialBanner({ user, onUpgrade }: TrialBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;
  if (user.subscription_status !== 'trialing') return null;

  const daysLeft = getTrialDaysRemaining(user.current_period_end, user.created);
  if (daysLeft === null) return null;

  // Show from day 4 onward (4 or fewer days remaining out of 7)
  if (daysLeft > 4) return null;

  const isUrgent = daysLeft <= 1;

  return (
    <div className={`relative flex items-center gap-3 px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
      isUrgent
        ? 'bg-red-950/50 border-red-700/60 text-red-200'
        : 'bg-amber-950/40 border-amber-700/50 text-amber-200'
    }`}>
      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center ${
        isUrgent ? 'bg-red-800/60' : 'bg-amber-800/50'
      }`}>
        <Clock size={16} className={isUrgent ? 'text-red-300' : 'text-amber-300'} />
      </div>

      <div className="flex-1 min-w-0">
        {daysLeft === 0 ? (
          <span>Your free trial has <strong>expired</strong> — upgrade to keep using Adiology.</span>
        ) : (
          <span>
            Your free trial ends in{' '}
            <strong>{daysLeft} {daysLeft === 1 ? 'day' : 'days'}</strong>
            {' '}— no credit card was required, but you'll need a plan to continue.
          </span>
        )}
      </div>

      <button
        onClick={onUpgrade}
        className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold text-xs transition-colors ${
          isUrgent
            ? 'bg-red-600 hover:bg-red-500 text-white'
            : 'bg-amber-500 hover:bg-amber-400 text-white'
        }`}
      >
        <Zap size={12} />
        Upgrade Now
        <ArrowRight size={12} />
      </button>

      <button
        onClick={() => setDismissed(true)}
        className="flex-shrink-0 text-current opacity-50 hover:opacity-80 transition-opacity ml-1"
        title="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  );
}
