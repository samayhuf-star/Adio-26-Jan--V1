// Google Analytics 4 Integration
const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID || 'G-62WFJQNTXV';

let initialized = false;

export function initGA(): void {
  if (initialized || typeof window === 'undefined') return;
  
  // Load gtag script
  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
  document.head.appendChild(script);

  // Initialize gtag
  (window as any).dataLayer = (window as any).dataLayer || [];
  function gtag(...args: any[]) {
    (window as any).dataLayer.push(arguments);
  }
  (window as any).gtag = gtag;
  gtag('js', new Date());
  gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false, // We'll send page views manually for SPA
  });

  initialized = true;
}

export function trackPageView(path?: string): void {
  if (typeof window === 'undefined' || !(window as any).gtag) return;
  
  const pagePath = path || window.location.pathname;
  (window as any).gtag('event', 'page_view', {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function trackEvent(eventName: string, params?: Record<string, any>): void {
  if (typeof window === 'undefined' || !(window as any).gtag) return;
  (window as any).gtag('event', eventName, params);
}

// Track key conversion events
export function trackSignup(method?: string): void {
  trackEvent('sign_up', { method: method || 'email' });
}

export function trackCampaignCreated(structureType?: string): void {
  trackEvent('campaign_created', { structure_type: structureType });
}

export function trackPlanSelected(planName: string, value: number): void {
  trackEvent('select_plan', { plan_name: planName, value });
}

export function trackFeatureUsed(featureName: string): void {
  trackEvent('feature_used', { feature_name: featureName });
}
