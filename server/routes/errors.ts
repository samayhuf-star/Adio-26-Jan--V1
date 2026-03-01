import { Hono } from 'hono';
import { sendEmail, isResendConfigured } from '../resendClient';

export const errorsRoutes = new Hono();

const ADMIN_EMAIL = 'adiologyads@gmail.com';

// Dedup: track recently reported errors to avoid spam (error key → timestamp)
const recentErrors = new Map<string, number>();
const DEDUP_WINDOW_MS = 2 * 60 * 1000; // 2 minutes

function cleanupOldErrors() {
  const cutoff = Date.now() - DEDUP_WINDOW_MS;
  for (const [key, ts] of recentErrors.entries()) {
    if (ts < cutoff) recentErrors.delete(key);
  }
}

errorsRoutes.post('/report', async (c) => {
  try {
    const body = await c.req.json();
    const {
      message,
      stack,
      componentStack,
      url,
      userId,
      userEmail,
      userName,
      screenshot,
      severity = 'error',
      source = 'unknown',
      timestamp = new Date().toISOString(),
    } = body;

    if (!message) {
      return c.json({ success: false, error: 'message is required' }, 400);
    }

    // Dedup check: skip if we already sent this error recently
    cleanupOldErrors();
    const dedupKey = `${source}:${message?.slice(0, 120)}:${url?.split('?')[0]}`;
    if (recentErrors.has(dedupKey)) {
      return c.json({ success: true, deduplicated: true });
    }
    recentErrors.set(dedupKey, Date.now());

    console.log(`[ErrorMonitor] Reporting error to admin: [${severity}] ${message?.slice(0, 100)}`);

    const screenshotSection = screenshot
      ? `<div style="margin-top:24px">
           <h3 style="color:#e2e8f0;font-size:15px;margin:0 0 10px">Screenshot at time of error</h3>
           <img src="${screenshot}" style="max-width:100%;border-radius:8px;border:1px solid #334155" alt="Error screenshot" />
         </div>`
      : '<p style="color:#94a3b8;font-style:italic">No screenshot captured.</p>';

    const stackSection = stack
      ? `<pre style="background:#0f172a;color:#f87171;padding:16px;border-radius:8px;font-size:12px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;margin:0">${stack}</pre>`
      : '';

    const componentStackSection = componentStack
      ? `<div style="margin-top:16px">
           <h3 style="color:#e2e8f0;font-size:14px;margin:0 0 8px">React Component Stack</h3>
           <pre style="background:#0f172a;color:#fbbf24;padding:12px;border-radius:8px;font-size:11px;overflow-x:auto;white-space:pre-wrap;word-break:break-all;margin:0">${componentStack}</pre>
         </div>`
      : '';

    const severityColor = severity === 'critical' ? '#ef4444' : severity === 'error' ? '#f87171' : '#fbbf24';
    const severityBg = severity === 'critical' ? '#450a0a' : severity === 'error' ? '#1c0a0a' : '#1c1000';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0f172a;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
  <div style="max-width:700px;margin:0 auto;padding:24px">

    <!-- Header -->
    <div style="background:#1e293b;border-radius:12px 12px 0 0;padding:20px 24px;border-bottom:1px solid #334155">
      <div style="display:flex;align-items:center;gap:12px">
        <span style="font-size:24px">🚨</span>
        <div>
          <h1 style="margin:0;color:#f1f5f9;font-size:20px;font-weight:700">User Error Detected — Adiology</h1>
          <p style="margin:4px 0 0;color:#94a3b8;font-size:13px">${new Date(timestamp).toUTCString()}</p>
        </div>
      </div>
    </div>

    <!-- Severity badge + message -->
    <div style="background:${severityBg};border:1px solid ${severityColor}33;border-top:none;padding:20px 24px">
      <span style="display:inline-block;background:${severityColor};color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:12px">${severity}</span>
      <p style="margin:0;color:#fca5a5;font-size:16px;font-weight:600;line-height:1.4">${message}</p>
    </div>

    <!-- User info -->
    <div style="background:#1e293b;padding:16px 24px;border:1px solid #334155;border-top:none">
      <h3 style="color:#e2e8f0;font-size:14px;margin:0 0 12px">User Details</h3>
      <table style="width:100%;border-collapse:collapse">
        <tr>
          <td style="color:#64748b;font-size:13px;padding:4px 0;width:120px">User ID</td>
          <td style="color:#e2e8f0;font-size:13px;padding:4px 0">${userId || '—'}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:13px;padding:4px 0">Email</td>
          <td style="color:#e2e8f0;font-size:13px;padding:4px 0">${userEmail || '—'}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:13px;padding:4px 0">Name</td>
          <td style="color:#e2e8f0;font-size:13px;padding:4px 0">${userName || '—'}</td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:13px;padding:4px 0">Page URL</td>
          <td style="color:#7c3aed;font-size:13px;padding:4px 0"><a href="${url}" style="color:#a78bfa">${url || '—'}</a></td>
        </tr>
        <tr>
          <td style="color:#64748b;font-size:13px;padding:4px 0">Source</td>
          <td style="color:#e2e8f0;font-size:13px;padding:4px 0">${source}</td>
        </tr>
      </table>
    </div>

    <!-- Stack trace -->
    ${stackSection ? `
    <div style="background:#1e293b;padding:16px 24px;border:1px solid #334155;border-top:none">
      <h3 style="color:#e2e8f0;font-size:14px;margin:0 0 10px">Stack Trace</h3>
      ${stackSection}
      ${componentStackSection}
    </div>` : ''}

    <!-- Screenshot -->
    <div style="background:#1e293b;padding:16px 24px;border:1px solid #334155;border-top:none;border-radius:0 0 12px 12px">
      ${screenshotSection}
    </div>

    <p style="text-align:center;color:#475569;font-size:11px;margin:16px 0 0">
      Adiology Error Monitor · Automatic alert
    </p>
  </div>
</body>
</html>`;

    await sendEmail({
      to: ADMIN_EMAIL,
      subject: `🚨 [${severity.toUpperCase()}] User Error on Adiology — ${message?.slice(0, 60)}`,
      html,
      from: 'Adiology Alerts <noreply@adiology.io>',
    });

    return c.json({ success: true });
  } catch (err: any) {
    console.error('[ErrorMonitor] Failed to send error report:', err);
    return c.json({ success: false, error: err.message }, 500);
  }
});

const ADMIN_EMAILS_LIST = ['samayhuf@gmail.com', 'adiologyads@gmail.com', 'oadiology@gmail.com'];

errorsRoutes.get('/health', async (c) => {
  const adminEmail = (c.req.header('x-admin-email') || '').toLowerCase();
  if (!ADMIN_EMAILS_LIST.includes(adminEmail)) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  const configured = await isResendConfigured();
  return c.json({ configured, adminEmail: ADMIN_EMAIL });
});

errorsRoutes.post('/test-email', async (c) => {
  const adminEmail = (c.req.header('x-admin-email') || '').toLowerCase();
  if (!ADMIN_EMAILS_LIST.includes(adminEmail)) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  const result = await sendEmail({
    to: ADMIN_EMAIL,
    subject: 'Adiology — Test Email (Admin Panel)',
    html: `<div style="font-family:sans-serif;padding:24px;background:#0f172a;color:#f1f5f9;border-radius:12px;max-width:500px">
      <h2 style="color:#818cf8">Test Email from Adiology</h2>
      <p style="color:#94a3b8">This is a test email sent from the Adiology Admin Panel to confirm that email delivery (Resend) is working correctly.</p>
      <p style="color:#64748b;font-size:12px">Sent at: ${new Date().toUTCString()}</p>
    </div>`,
    from: 'Adiology Alerts <noreply@adiology.io>',
  });
  return c.json(result);
});
