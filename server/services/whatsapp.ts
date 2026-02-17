import { db } from '../db';
import { sql } from 'drizzle-orm';
import { getUncachableStripeClient } from '../stripeClient';

const WHATSAPP_PHONE = process.env.WHATSAPP_PHONE_NUMBER_ID;
const WHATSAPP_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const WHATSAPP_API_VERSION = process.env.WHATSAPP_API_VERSION || 'v21.0';
const RECIPIENT_NUMBER = '919650000412';

let reportingEnabled = true;
let lastReportTime: Date | null = null;
let reportInterval: ReturnType<typeof setInterval> | null = null;

export function isWhatsAppConfigured(): boolean {
  return !!(WHATSAPP_PHONE && WHATSAPP_TOKEN);
}

export function getWhatsAppStatus() {
  return {
    configured: isWhatsAppConfigured(),
    enabled: reportingEnabled,
    lastReportTime: lastReportTime?.toISOString() || null,
    recipientNumber: `+${RECIPIENT_NUMBER}`,
    intervalMinutes: 60,
  };
}

export function setReportingEnabled(enabled: boolean) {
  reportingEnabled = enabled;
}

async function sendWhatsAppMessage(message: string): Promise<boolean> {
  if (!isWhatsAppConfigured()) {
    console.error('[WhatsApp] Not configured - missing WHATSAPP_PHONE_NUMBER_ID or WHATSAPP_ACCESS_TOKEN');
    return false;
  }

  try {
    const url = `https://graph.facebook.com/${WHATSAPP_API_VERSION}/${WHATSAPP_PHONE}/messages`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${WHATSAPP_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to: RECIPIENT_NUMBER,
        type: 'text',
        text: { body: message },
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('[WhatsApp] Send failed:', response.status, errorData);
      return false;
    }

    console.log('[WhatsApp] Message sent successfully');
    return true;
  } catch (error) {
    console.error('[WhatsApp] Send error:', error);
    return false;
  }
}

async function collectSystemMetrics() {
  const metrics: any = {
    timestamp: new Date(),
    users: { total: 0, newToday: 0, blocked: 0 },
    subscriptions: { active: 0, trialing: 0, canceled: 0 },
    revenue: { mrr: 0, todayPayments: 0 },
    emails: { sentToday: 0, totalSent: 0 },
    ai: { requestsToday: 0, tokensToday: 0, costToday: 0 },
    system: { memoryMB: 0, uptimeHours: 0, dbSize: 'N/A' },
  };

  try {
    const userStats = await db.execute(sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE created_at >= CURRENT_DATE) as new_today,
        COUNT(*) FILTER (WHERE is_blocked = true) as blocked
      FROM users
    `).catch(() => ({ rows: [{ total: 0, new_today: 0, blocked: 0 }] }));
    const u = userStats.rows[0] as any;
    metrics.users = { total: Number(u.total || 0), newToday: Number(u.new_today || 0), blocked: Number(u.blocked || 0) };
  } catch (e) { console.error('[WhatsApp] User stats error:', e); }

  try {
    const subStats = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'trialing') as trialing,
        COUNT(*) FILTER (WHERE status = 'canceled') as canceled
      FROM subscriptions
    `).catch(() => ({ rows: [{ active: 0, trialing: 0, canceled: 0 }] }));
    const s = subStats.rows[0] as any;
    metrics.subscriptions = { active: Number(s.active || 0), trialing: Number(s.trialing || 0), canceled: Number(s.canceled || 0) };
  } catch (e) { console.error('[WhatsApp] Sub stats error:', e); }

  try {
    const mrrResult = await db.execute(sql`
      SELECT COALESCE(SUM(CASE 
        WHEN plan_name = 'Starter' THEN 49
        WHEN plan_name = 'Professional' THEN 99
        WHEN plan_name = 'Agency' THEN 149
        ELSE 0 
      END), 0) as mrr
      FROM subscriptions WHERE status = 'active'
    `).catch(() => ({ rows: [{ mrr: 0 }] }));
    metrics.revenue.mrr = Number((mrrResult.rows[0] as any)?.mrr || 0);

    const todayPayResult = await db.execute(sql`
      SELECT COALESCE(SUM(amount_cents), 0) as total FROM payments WHERE created_at >= CURRENT_DATE AND status = 'succeeded'
    `).catch(() => ({ rows: [{ total: 0 }] }));
    metrics.revenue.todayPayments = Number((todayPayResult.rows[0] as any)?.total || 0) / 100;
  } catch (e) { console.error('[WhatsApp] Revenue stats error:', e); }

  try {
    const emailStats = await db.execute(sql`
      SELECT 
        COUNT(*) FILTER (WHERE sent_at >= CURRENT_DATE) as today,
        COUNT(*) as total
      FROM email_logs
    `).catch(() => ({ rows: [{ today: 0, total: 0 }] }));
    const e = emailStats.rows[0] as any;
    metrics.emails = { sentToday: Number(e.today || 0), totalSent: Number(e.total || 0) };
  } catch (e) { console.error('[WhatsApp] Email stats error:', e); }

  try {
    const aiStats = await db.execute(sql`
      SELECT 
        COUNT(*) as requests,
        COALESCE(SUM(total_tokens), 0) as tokens,
        COALESCE(SUM(CAST(cost_cents AS numeric)), 0) as cost_cents
      FROM ai_usage_logs
      WHERE created_at >= CURRENT_DATE
    `).catch(() => ({ rows: [{ requests: 0, tokens: 0, cost_cents: 0 }] }));
    const a = aiStats.rows[0] as any;
    metrics.ai = { requestsToday: Number(a.requests || 0), tokensToday: Number(a.tokens || 0), costToday: Number(a.cost_cents || 0) / 100 };
  } catch (e) { console.error('[WhatsApp] AI stats error:', e); }

  try {
    const mem = process.memoryUsage();
    metrics.system.memoryMB = Math.round(mem.rss / 1024 / 1024);
    metrics.system.uptimeHours = Math.round(process.uptime() / 3600 * 10) / 10;

    const dbSizeResult = await db.execute(sql`
      SELECT pg_size_pretty(pg_database_size(current_database())) as size
    `).catch(() => ({ rows: [{ size: 'N/A' }] }));
    metrics.system.dbSize = (dbSizeResult.rows[0] as any)?.size || 'N/A';
  } catch (e) { console.error('[WhatsApp] System stats error:', e); }

  return metrics;
}

function formatReport(m: any): string {
  const now = m.timestamp as Date;
  const timeStr = now.toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', hour12: true, hour: '2-digit', minute: '2-digit' });
  const dateStr = now.toLocaleDateString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: 'short', year: 'numeric' });

  return `📊 *ADIOLOGY SYSTEM REPORT*
🕐 ${timeStr} | ${dateStr}
━━━━━━━━━━━━━━━━━━━━

👥 *USERS*
• Total: ${m.users.total}
• New Today: ${m.users.newToday}
• Blocked: ${m.users.blocked}

💳 *SUBSCRIPTIONS*
• Active: ${m.subscriptions.active}
• Trialing: ${m.subscriptions.trialing}
• Canceled: ${m.subscriptions.canceled}

💰 *REVENUE*
• MRR: $${m.revenue.mrr}
• Today's Payments: $${m.revenue.todayPayments.toFixed(2)}

📧 *EMAILS*
• Sent Today: ${m.emails.sentToday}
• Total Sent: ${m.emails.totalSent}

🤖 *AI USAGE (Today)*
• Requests: ${m.ai.requestsToday}
• Tokens: ${m.ai.tokensToday.toLocaleString()}
• Cost: $${m.ai.costToday.toFixed(4)}

🖥️ *SYSTEM*
• Memory: ${m.system.memoryMB} MB
• Uptime: ${m.system.uptimeHours} hrs
• DB Size: ${m.system.dbSize}

━━━━━━━━━━━━━━━━━━━━
✅ All systems operational`;
}

export async function sendHourlyReport(): Promise<boolean> {
  if (!reportingEnabled || !isWhatsAppConfigured()) {
    return false;
  }

  try {
    const metrics = await collectSystemMetrics();
    const report = formatReport(metrics);
    const success = await sendWhatsAppMessage(report);
    if (success) {
      lastReportTime = new Date();
    }
    return success;
  } catch (error) {
    console.error('[WhatsApp] Hourly report error:', error);
    return false;
  }
}

export async function sendTestMessage(): Promise<boolean> {
  if (!isWhatsAppConfigured()) {
    return false;
  }

  const testMsg = `🧪 *ADIOLOGY TEST MESSAGE*
━━━━━━━━━━━━━━━━━━━━
This is a test message from your Adiology admin panel.
WhatsApp integration is working correctly!
━━━━━━━━━━━━━━━━━━━━
📅 ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}`;

  return sendWhatsAppMessage(testMsg);
}

export function startHourlyReporting() {
  if (reportInterval) {
    clearInterval(reportInterval);
  }

  if (!isWhatsAppConfigured()) {
    console.log('[WhatsApp] Not configured - hourly reporting disabled');
    return;
  }

  console.log(`[WhatsApp] Starting hourly reporting to +${RECIPIENT_NUMBER}`);

  reportInterval = setInterval(async () => {
    if (reportingEnabled) {
      await sendHourlyReport();
    }
  }, 60 * 60 * 1000);

  setTimeout(() => {
    if (reportingEnabled && isWhatsAppConfigured()) {
      sendHourlyReport().catch(e => console.error('[WhatsApp] Initial report failed:', e));
    }
  }, 5000);
}

export function stopHourlyReporting() {
  if (reportInterval) {
    clearInterval(reportInterval);
    reportInterval = null;
  }
}
