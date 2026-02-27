import html2canvas from 'html2canvas';
import { getCurrentUser } from './auth';

interface ErrorReportPayload {
  message: string;
  stack?: string;
  componentStack?: string;
  url: string;
  userId?: string;
  userEmail?: string;
  userName?: string;
  screenshot?: string;
  severity: 'warning' | 'error' | 'critical';
  source: string;
  timestamp: string;
}

// Noise filters — errors we never want to report
const IGNORED_PATTERNS = [
  /vite.*hmr/i,
  /websocket/i,
  /ws:\/\//i,
  /wss:\/\//i,
  /hot.*update/i,
  /chunk.*load.*error/i,
  /loading.*css.*chunk/i,
  /ResizeObserver loop/i,
  /Script error/i,
  /Non-Error promise rejection/i,
  /Object captured as exception/i,
  /The user aborted a request/i,
  /Failed to fetch.*api\/analytics/i,
  /Failed to fetch.*heartbeat/i,
  /Network request failed/i,
  /Load failed/i,
];

// Dedup tracker: errorKey → last reported timestamp
const reportedErrors = new Map<string, number>();
const DEDUP_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

// Cooldown: no more than 5 reports in any 5-minute window
const reportTimestamps: number[] = [];
const MAX_REPORTS = 5;
const COOLDOWN_WINDOW_MS = 5 * 60 * 1000;

let isCapturingScreenshot = false;

function shouldIgnore(message: string): boolean {
  return IGNORED_PATTERNS.some((pattern) => pattern.test(message));
}

function isDuplicate(key: string): boolean {
  const last = reportedErrors.get(key);
  if (!last) return false;
  return Date.now() - last < DEDUP_WINDOW_MS;
}

function isRateLimited(): boolean {
  const now = Date.now();
  const cutoff = now - COOLDOWN_WINDOW_MS;
  while (reportTimestamps.length > 0 && reportTimestamps[0] < cutoff) {
    reportTimestamps.shift();
  }
  return reportTimestamps.length >= MAX_REPORTS;
}

async function captureScreenshot(): Promise<string | undefined> {
  if (isCapturingScreenshot) return undefined;
  try {
    isCapturingScreenshot = true;
    const canvas = await html2canvas(document.body, {
      useCORS: true,
      allowTaint: true,
      scale: 0.6,
      logging: false,
      ignoreElements: (el) => {
        // Skip iframes and scripts which can cause cross-origin issues
        return el.tagName === 'IFRAME' || el.tagName === 'SCRIPT';
      },
    });
    return canvas.toDataURL('image/jpeg', 0.7);
  } catch {
    return undefined;
  } finally {
    isCapturingScreenshot = false;
  }
}

export async function reportError(opts: {
  message: string;
  stack?: string;
  componentStack?: string;
  source?: string;
  severity?: 'warning' | 'error' | 'critical';
}): Promise<void> {
  try {
    const message = opts.message || 'Unknown error';

    if (shouldIgnore(message)) return;

    const dedupKey = `${opts.source || 'js'}:${message.slice(0, 120)}`;
    if (isDuplicate(dedupKey)) return;
    if (isRateLimited()) return;

    // Mark as reported
    reportedErrors.set(dedupKey, Date.now());
    reportTimestamps.push(Date.now());

    // Get current user
    let userId: string | undefined;
    let userEmail: string | undefined;
    let userName: string | undefined;
    try {
      const user = getCurrentUser();
      if (user) {
        userId = user.id;
        userEmail = (user as any).email;
        userName = (user as any).name || (user as any).displayName;
      }
    } catch {
      // Ignore auth errors
    }

    // Capture screenshot (don't block on failure)
    const screenshot = await captureScreenshot();

    const payload: ErrorReportPayload = {
      message,
      stack: opts.stack,
      componentStack: opts.componentStack,
      url: window.location.href,
      userId,
      userEmail,
      userName,
      screenshot,
      severity: opts.severity || 'error',
      source: opts.source || 'javascript',
      timestamp: new Date().toISOString(),
    };

    // Send to backend (fire-and-forget)
    fetch('/api/errors/report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
    }).catch(() => {
      // Silently fail — never let the error reporter itself cause errors
    });
  } catch {
    // Never throw from an error reporter
  }
}

// Install global handlers
export function installGlobalErrorHandlers(): void {
  if (typeof window === 'undefined') return;

  window.addEventListener('error', (event) => {
    const message = event.error?.message || event.message || 'JavaScript Error';
    if (shouldIgnore(message)) return;
    reportError({
      message,
      stack: event.error?.stack,
      source: 'window.onerror',
      severity: 'error',
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
        ? reason
        : JSON.stringify(reason) || 'Unhandled Promise Rejection';
    if (shouldIgnore(message)) return;
    reportError({
      message,
      stack: reason instanceof Error ? reason.stack : undefined,
      source: 'unhandledrejection',
      severity: 'error',
    });
  });
}
