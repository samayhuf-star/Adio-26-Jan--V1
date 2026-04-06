export function buildLeadPayload(email: string, source: string, extra: Record<string, unknown> = {}) {
  const params = new URLSearchParams(window.location.search);
  const utmMetadata: Record<string, string> = {};
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'].forEach((k) => {
    const v = params.get(k);
    if (v) utmMetadata[k] = v;
  });

  const metadata: Record<string, unknown> = {
    ...utmMetadata,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    ...extra,
  };

  return {
    email: email.trim().toLowerCase(),
    source,
    page: window.location.pathname,
    referrer: document.referrer || '',
    metadata,
  };
}

export function captureLead(email: string, source: string, extra: Record<string, unknown> = {}) {
  const payload = buildLeadPayload(email, source, extra);
  fetch('/api/leads/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  }).catch(() => {});
}
