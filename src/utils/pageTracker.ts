const SESSION_KEY = 'adiology_session_id';

function getSessionId(): string {
  let sid = sessionStorage.getItem(SESSION_KEY);
  if (!sid) {
    sid = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem(SESSION_KEY, sid);
  }
  return sid;
}

let lastTrackedPath = '';

export function trackPageView(path?: string) {
  const currentPath = path || window.location.pathname;
  if (currentPath === lastTrackedPath) return;
  lastTrackedPath = currentPath;

  const payload = {
    path: currentPath,
    referrer: document.referrer || '',
    sessionId: getSessionId(),
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
  };

  if (navigator.sendBeacon) {
    navigator.sendBeacon('/api/analytics/track', JSON.stringify(payload));
  } else {
    fetch('/api/analytics/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {});
  }
}

export function initPageTracking() {
  trackPageView();

  const originalPushState = history.pushState;
  history.pushState = function (...args) {
    originalPushState.apply(this, args);
    trackPageView();
  };

  window.addEventListener('popstate', () => {
    trackPageView();
  });

  window.addEventListener('navigateTo', () => {
    setTimeout(() => trackPageView(), 50);
  });
}
