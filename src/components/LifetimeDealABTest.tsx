import { useEffect, useRef, useState } from 'react';
import { LifetimeDealPage } from './LifetimeDealPage';
import { LifetimeDealVariantB } from './LifetimeDealVariantB';
import { LifetimeDealVariantC } from './LifetimeDealVariantC';

type Variant = 'A' | 'B' | 'C';

interface Props {
  onNavigate?: (page: string) => void;
}

function assignVariant(): Variant {
  const params = new URLSearchParams(window.location.search);
  const forced = params.get('variant')?.toUpperCase() as Variant | null;
  if (forced === 'A' || forced === 'B' || forced === 'C') return forced;
  const stored = sessionStorage.getItem('ltd_ab_variant') as Variant | null;
  if (stored === 'A' || stored === 'B' || stored === 'C') return stored;
  const roll = Math.random();
  const variant: Variant = roll < 0.333 ? 'A' : roll < 0.666 ? 'B' : 'C';
  sessionStorage.setItem('ltd_ab_variant', variant);
  return variant;
}

function trackVariant(variant: Variant) {
  try {
    const sessionId = sessionStorage.getItem('analytics_session') || crypto.randomUUID();
    sessionStorage.setItem('analytics_session', sessionId);
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event: 'ltd_variant_view',
        properties: {
          variant,
          page: '/lifetime-deal',
          ab_test: 'lifetime_deal_v1',
        },
      }),
    }).catch(() => {});
  } catch {
  }
}

export function LifetimeDealABTest({ onNavigate }: Props) {
  const [variant] = useState<Variant>(() => assignVariant());
  const tracked = useRef(false);

  useEffect(() => {
    if (!tracked.current) {
      tracked.current = true;
      trackVariant(variant);
      window.dispatchEvent(new CustomEvent('ltd_ab_variant', { detail: { variant } }));
    }
  }, [variant]);

  if (variant === 'B') return <LifetimeDealVariantB onNavigate={onNavigate} />;
  if (variant === 'C') return <LifetimeDealVariantC onNavigate={onNavigate} />;
  return <LifetimeDealPage onNavigate={onNavigate} />;
}
