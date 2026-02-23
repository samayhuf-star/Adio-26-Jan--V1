import { db } from '../db';
import { sql } from 'drizzle-orm';

const CHECK_INTERVAL_MS = 15 * 60 * 1000;
let monitorInterval: ReturnType<typeof setInterval> | null = null;
let monitoringEnabled = true;

interface HealthCheckResult {
  website: { status: 'up' | 'down'; responseMs: number; statusCode?: number };
  api: { status: 'up' | 'down'; responseMs: number };
  database: { status: 'up' | 'down'; responseMs: number };
  users: { total: number; activeRecently: number };
  timestamp: Date;
}

async function checkWebsite(): Promise<{ status: 'up' | 'down'; responseMs: number; statusCode?: number }> {
  const start = Date.now();
  try {
    const port = process.env.PORT || '5000';
    const response = await fetch(`http://localhost:${port}/`, {
      signal: AbortSignal.timeout(10000),
    });
    return { status: response.ok ? 'up' : 'down', responseMs: Date.now() - start, statusCode: response.status };
  } catch {
    return { status: 'down', responseMs: Date.now() - start };
  }
}

async function checkApi(): Promise<{ status: 'up' | 'down'; responseMs: number }> {
  const start = Date.now();
  try {
    const apiPort = process.env.API_PORT || '3001';
    const response = await fetch(`http://localhost:${apiPort}/api/health`, {
      signal: AbortSignal.timeout(10000),
    });
    return { status: response.ok ? 'up' : 'down', responseMs: Date.now() - start };
  } catch {
    return { status: 'down', responseMs: Date.now() - start };
  }
}

async function checkDatabase(): Promise<{ status: 'up' | 'down'; responseMs: number }> {
  const start = Date.now();
  try {
    await db.execute(sql`SELECT 1`);
    return { status: 'up', responseMs: Date.now() - start };
  } catch {
    return { status: 'down', responseMs: Date.now() - start };
  }
}

async function getUserCounts(): Promise<{ total: number; activeRecently: number }> {
  try {
    const totalResult = await db.execute(sql`SELECT COUNT(*) as count FROM users`).catch(() => ({ rows: [{ count: 0 }] }));
    const total = Number((totalResult.rows[0] as any)?.count || 0);

    const activeResult = await db.execute(sql`
      SELECT COUNT(DISTINCT path) as count FROM page_views 
      WHERE viewed_at >= NOW() - INTERVAL '15 minutes'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    const activeRecently = Number((activeResult.rows[0] as any)?.count || 0);

    const loggedInResult = await db.execute(sql`
      SELECT COUNT(*) as count FROM users 
      WHERE last_sign_in >= NOW() - INTERVAL '24 hours'
    `).catch(() => ({ rows: [{ count: 0 }] }));
    const loggedIn = Number((loggedInResult.rows[0] as any)?.count || 0);

    return { total, activeRecently: loggedIn };
  } catch {
    return { total: 0, activeRecently: 0 };
  }
}

async function runHealthCheck(): Promise<HealthCheckResult> {
  const [website, api, database, users] = await Promise.all([
    checkWebsite(),
    checkApi(),
    checkDatabase(),
    getUserCounts(),
  ]);

  return { website, api, database, users, timestamp: new Date() };
}

function formatHealthReport(result: HealthCheckResult): string {
  const time = result.timestamp.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' });
  const date = result.timestamp.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });

  const websiteIcon = result.website.status === 'up' ? '✅' : '🔴';
  const apiIcon = result.api.status === 'up' ? '✅' : '🔴';
  const dbIcon = result.database.status === 'up' ? '✅' : '🔴';

  const allUp = result.website.status === 'up' && result.api.status === 'up' && result.database.status === 'up';
  const headerIcon = allUp ? '✅' : '🚨';

  return `${headerIcon} *ADIOLOGY HEALTH CHECK*
🕐 ${time} | ${date}
━━━━━━━━━━━━━━━━━━━━

🌐 *SERVICE STATUS*
${websiteIcon} Website: ${result.website.status.toUpperCase()} (${result.website.responseMs}ms)
${apiIcon} API Server: ${result.api.status.toUpperCase()} (${result.api.responseMs}ms)
${dbIcon} Database: ${result.database.status.toUpperCase()} (${result.database.responseMs}ms)

👥 *USERS*
• Total Registered: ${result.users.total}
• Logged In (24h): ${result.users.activeRecently}

━━━━━━━━━━━━━━━━━━━━
${allUp ? '✅ All systems operational' : '🚨 ALERT: Some services are down!'}`;
}

async function sendWhatsAppHealthReport(message: string): Promise<boolean> {
  const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const apiVersion = process.env.WHATSAPP_API_VERSION || 'v21.0';
  const recipient = '919650000412';

  if (!phoneId || !token) {
    return false;
  }

  try {
    const url = `https://graph.facebook.com/${apiVersion}/${phoneId}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: recipient,
        type: 'text',
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[UptimeMonitor] WhatsApp send failed:', response.status, errorData);
      return false;
    }
    return true;
  } catch (error) {
    console.error('[UptimeMonitor] WhatsApp send error:', error);
    return false;
  }
}

async function performCheck() {
  if (!monitoringEnabled) return;

  try {
    const result = await runHealthCheck();
    const report = formatHealthReport(result);

    const sent = await sendWhatsAppHealthReport(report);
    if (sent) {
      console.log('[UptimeMonitor] Health report sent via WhatsApp');
    } else {
      console.log('[UptimeMonitor] Health check completed (WhatsApp not configured)');
      console.log(`[UptimeMonitor] Website: ${result.website.status}, API: ${result.api.status}, DB: ${result.database.status}, Users: ${result.users.total}`);
    }
  } catch (error) {
    console.error('[UptimeMonitor] Check failed:', error);
  }
}

export function startUptimeMonitoring() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
  }

  console.log('[UptimeMonitor] Starting 15-minute health monitoring');

  monitorInterval = setInterval(performCheck, CHECK_INTERVAL_MS);

  setTimeout(performCheck, 10000);
}

export function stopUptimeMonitoring() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
    console.log('[UptimeMonitor] Monitoring stopped');
  }
}

export function setMonitoringEnabled(enabled: boolean) {
  monitoringEnabled = enabled;
}

export function getMonitoringStatus() {
  return {
    enabled: monitoringEnabled,
    intervalMinutes: 15,
    running: !!monitorInterval,
  };
}
