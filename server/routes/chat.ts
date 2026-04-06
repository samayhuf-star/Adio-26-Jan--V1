import { Hono } from 'hono';
import pg from 'pg';
import OpenAI from 'openai';
import { getDatabaseUrl } from '../dbConfig';

const { Pool } = pg;
const pool = new Pool({ connectionString: getDatabaseUrl() });
const openai = new OpenAI();

export const chatRoutes = new Hono();

const TELEGRAM_API = 'https://api.telegram.org';

function getTelegramToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN || null;
}

function getTelegramAdminChatId(): string | null {
  return process.env.TELEGRAM_ADMIN_CHAT_ID || null;
}

async function sendTelegramMessage(text: string, parseMode: 'HTML' | 'Markdown' = 'HTML'): Promise<boolean> {
  const token = getTelegramToken();
  const chatId = getTelegramAdminChatId();
  if (!token || !chatId) return false;
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
    });
    const data: any = await res.json();
    return data.ok === true;
  } catch (e) {
    console.error('[Chat] Telegram send error:', e);
    return false;
  }
}

const BOT_SYSTEM_PROMPT = `You are Aria, the friendly and helpful support assistant for Adiology — an AI-powered Google Ads campaign management platform at adiology.io.

Your personality: warm, concise, professional, and knowledgeable. You help users understand the product, troubleshoot basic issues, and answer billing/account questions.

Key facts about Adiology:
- AI Campaign Builder: Launch Search Ads campaigns in minutes using 13 proven campaign structures
- Keyword Intelligence: AI-powered keyword research and competitor analysis  
- Click Fraud Protection (ClickGuard): Automatically blocks fraudulent clicks from your Google Ads
- Proxy Mail: Anonymous email addresses for privacy
- Domain Monitor: Track and protect your domains
- 7-day free trial, no credit card required
- Plans: Starter $29.99/mo, Professional $99/mo, Agency $149/mo, Lifetime deal $99 one-time
- Integrates with Google Ads accounts via secure OAuth
- Built for agencies and e-commerce businesses

Billing & Account:
- Users can upgrade/downgrade from the Billing section in the dashboard
- Payments processed securely via Stripe
- Cancel anytime with no penalties
- Refund requests: contact support@adiology.io

For technical issues specific to a user's account, campaigns, or anything that requires checking internal systems, you should offer to connect them with a live support agent.

Keep responses under 150 words unless a detailed explanation is needed. Be direct and helpful. If you don't know something specific, be honest and offer to escalate.

IMPORTANT: If the user asks to speak with a human, live agent, or support team, acknowledge it and ask if they'd like you to notify the support team now. Do NOT say you cannot connect them.`;

async function generateAIResponse(conversationHistory: Array<{role: string, content: string}>): Promise<string> {
  try {
    const messages: Array<{role: 'system' | 'user' | 'assistant', content: string}> = [
      { role: 'system', content: BOT_SYSTEM_PROMPT },
      ...conversationHistory.map(m => ({
        role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
        content: m.content,
      })),
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 300,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content || "I'm having trouble responding right now. Please try again or contact support@adiology.io.";
  } catch (err) {
    console.error('[Chat] OpenAI error:', err);
    return "I'm having a brief technical issue. For immediate help, please email support@adiology.io.";
  }
}

function detectLiveAgentRequest(message: string): boolean {
  const keywords = ['live agent', 'human', 'real person', 'support team', 'talk to someone', 'speak with', 'speak to', 'connect me', 'live support', 'live chat with', 'agent please'];
  const lower = message.toLowerCase();
  return keywords.some(k => lower.includes(k));
}

// ── Send message ──────────────────────────────────────────────────────────────
chatRoutes.post('/send', async (c) => {
  try {
    const { sessionId, message, userEmail, userName, pageUrl } = await c.req.json();
    if (!sessionId || !message?.trim()) {
      return c.json({ success: false, error: 'sessionId and message are required' }, 400);
    }

    // Get or create conversation
    let convRow: any;
    const convResult = await pool.query(
      'SELECT * FROM chat_conversations WHERE session_id = $1',
      [sessionId]
    );

    if (convResult.rows.length === 0) {
      const newConv = await pool.query(
        `INSERT INTO chat_conversations (session_id, user_email, user_name, page_url, status)
         VALUES ($1, $2, $3, $4, 'open') RETURNING *`,
        [sessionId, userEmail || null, userName || null, pageUrl || null]
      );
      convRow = newConv.rows[0];

      // Notify Telegram — new conversation started
      const userLabel = userEmail ? `👤 ${userEmail}` : '👤 Anonymous visitor';
      const pageLabel = pageUrl ? `\n🔗 ${pageUrl}` : '';
      await sendTelegramMessage(
        `💬 <b>New support chat started</b>\n${userLabel}${pageLabel}\n\n<i>"${message.trim().substring(0, 200)}"</i>\n\n🔗 Review at: <a href="https://adiology.io/superadmin">SuperAdmin Panel</a>`
      );
    } else {
      convRow = convResult.rows[0];
    }

    // Save user message
    await pool.query(
      `INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, 'user', $2)`,
      [convRow.id, message.trim()]
    );

    // Detect live agent request
    const wantsLiveAgent = detectLiveAgentRequest(message);

    // Load recent conversation history (last 10 messages)
    const histResult = await pool.query(
      `SELECT role, content FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC LIMIT 20`,
      [convRow.id]
    );
    const history = histResult.rows;

    // Generate AI response
    const aiResponse = await generateAIResponse(history);

    // Save assistant message
    await pool.query(
      `INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, 'assistant', $2)`,
      [convRow.id, aiResponse]
    );

    // Update conversation timestamp
    await pool.query(
      `UPDATE chat_conversations SET updated_at = NOW() WHERE id = $1`,
      [convRow.id]
    );

    // Notify Telegram of user message (but not first message, already sent above)
    if (convResult.rows.length > 0) {
      const userLabel = convRow.user_email ? `👤 ${convRow.user_email}` : '👤 Anonymous';
      await sendTelegramMessage(
        `💬 <b>Chat message from ${userLabel}</b>\n\n<i>"${message.trim().substring(0, 300)}"</i>`
      );
    }

    return c.json({
      success: true,
      response: aiResponse,
      conversationId: convRow.id,
      wantsLiveAgent,
    });
  } catch (error: any) {
    console.error('[Chat] Send error:', error);
    return c.json({ success: false, error: 'Failed to process message' }, 500);
  }
});

// ── Request live agent ────────────────────────────────────────────────────────
chatRoutes.post('/live-agent-request', async (c) => {
  try {
    const { sessionId, userEmail, userName } = await c.req.json();
    if (!sessionId) return c.json({ success: false, error: 'sessionId required' }, 400);

    const convResult = await pool.query(
      'SELECT * FROM chat_conversations WHERE session_id = $1',
      [sessionId]
    );
    if (convResult.rows.length === 0) {
      return c.json({ success: false, error: 'Conversation not found' }, 404);
    }

    const conv = convResult.rows[0];
    await pool.query(
      `UPDATE chat_conversations SET status = 'live_requested', updated_at = NOW() WHERE id = $1`,
      [conv.id]
    );

    // Load full conversation history for Telegram notification
    const msgResult = await pool.query(
      `SELECT role, content, created_at FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conv.id]
    );

    const emailLabel = userEmail || conv.user_email || 'Anonymous';
    const nameLabel = userName || conv.user_name || '';
    let historyText = msgResult.rows.map(m => {
      const who = m.role === 'user' ? '🧑 User' : '🤖 Aria';
      return `${who}: ${m.content.substring(0, 150)}`;
    }).join('\n\n');

    if (historyText.length > 3000) historyText = historyText.substring(0, 3000) + '...';

    const urgentMsg = `🚨 <b>LIVE AGENT REQUESTED</b>\n\n👤 <b>${nameLabel || emailLabel}</b>${nameLabel ? `\n✉️ ${emailLabel}` : ''}\n\n<b>Conversation history:</b>\n${historyText}\n\n📌 Session: ${sessionId}\n🔗 <a href="https://adiology.io/superadmin">View in SuperAdmin</a>`;

    await sendTelegramMessage(urgentMsg);

    return c.json({ success: true });
  } catch (error: any) {
    console.error('[Chat] Live agent request error:', error);
    return c.json({ success: false, error: 'Failed to request live agent' }, 500);
  }
});

// ── Get conversation history ──────────────────────────────────────────────────
chatRoutes.get('/history/:sessionId', async (c) => {
  try {
    const { sessionId } = c.req.param();
    const convResult = await pool.query(
      'SELECT * FROM chat_conversations WHERE session_id = $1',
      [sessionId]
    );
    if (convResult.rows.length === 0) {
      return c.json({ success: true, messages: [] });
    }

    const conv = convResult.rows[0];
    const msgResult = await pool.query(
      `SELECT id, role, content, created_at FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [conv.id]
    );

    return c.json({ success: true, messages: msgResult.rows, conversationId: conv.id });
  } catch (error: any) {
    console.error('[Chat] History error:', error);
    return c.json({ success: false, error: 'Failed to load history' }, 500);
  }
});

// ── SuperAdmin: list all conversations ───────────────────────────────────────
chatRoutes.get('/admin/conversations', async (c) => {
  try {
    const token = c.req.header('Authorization')?.replace('Bearer ', '');
    if (!token) return c.json({ success: false, error: 'Unauthorized' }, 401);

    const page = parseInt(c.req.query('page') || '1');
    const status = c.req.query('status') || 'all';
    const limit = 50;
    const offset = (page - 1) * limit;

    let whereClause = '';
    const params: any[] = [limit, offset];
    if (status !== 'all') {
      whereClause = `WHERE c.status = $3`;
      params.push(status);
    }

    const result = await pool.query(
      `SELECT c.*, 
        (SELECT COUNT(*) FROM chat_messages WHERE conversation_id = c.id) AS message_count,
        (SELECT content FROM chat_messages WHERE conversation_id = c.id AND role = 'user' ORDER BY created_at DESC LIMIT 1) AS last_message
       FROM chat_conversations c
       ${whereClause}
       ORDER BY c.updated_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    const countResult = await pool.query(
      `SELECT COUNT(*) FROM chat_conversations ${status !== 'all' ? `WHERE status = $1` : ''}`,
      status !== 'all' ? [status] : []
    );

    return c.json({
      success: true,
      conversations: result.rows,
      total: parseInt(countResult.rows[0].count),
      page,
    });
  } catch (error: any) {
    console.error('[Chat] Admin conversations error:', error);
    return c.json({ success: false, error: 'Failed to load conversations' }, 500);
  }
});

// ── SuperAdmin: get single conversation ──────────────────────────────────────
chatRoutes.get('/admin/conversation/:id', async (c) => {
  try {
    const { id } = c.req.param();
    const convResult = await pool.query('SELECT * FROM chat_conversations WHERE id = $1', [id]);
    if (convResult.rows.length === 0) return c.json({ success: false, error: 'Not found' }, 404);

    const msgResult = await pool.query(
      `SELECT id, role, content, created_at FROM chat_messages WHERE conversation_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    return c.json({ success: true, conversation: convResult.rows[0], messages: msgResult.rows });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to load conversation' }, 500);
  }
});

// ── SuperAdmin: send admin reply ─────────────────────────────────────────────
chatRoutes.post('/admin/reply/:conversationId', async (c) => {
  try {
    const { conversationId } = c.req.param();
    const { message } = await c.req.json();
    if (!message?.trim()) return c.json({ success: false, error: 'Message required' }, 400);

    await pool.query(
      `INSERT INTO chat_messages (conversation_id, role, content) VALUES ($1, 'assistant', $2)`,
      [conversationId, message.trim()]
    );
    await pool.query(
      `UPDATE chat_conversations SET updated_at = NOW(), status = 'live_active' WHERE id = $1`,
      [conversationId]
    );

    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to send reply' }, 500);
  }
});

// ── SuperAdmin: close conversation ────────────────────────────────────────────
chatRoutes.post('/admin/close/:conversationId', async (c) => {
  try {
    const { conversationId } = c.req.param();
    await pool.query(
      `UPDATE chat_conversations SET status = 'closed', updated_at = NOW() WHERE id = $1`,
      [conversationId]
    );
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to close conversation' }, 500);
  }
});

// ── SuperAdmin: get stats ─────────────────────────────────────────────────────
chatRoutes.get('/admin/stats', async (c) => {
  try {
    const result = await pool.query(`
      SELECT
        COUNT(*) AS total,
        SUM(CASE WHEN status = 'open' THEN 1 ELSE 0 END) AS open_count,
        SUM(CASE WHEN status = 'live_requested' THEN 1 ELSE 0 END) AS live_requested_count,
        SUM(CASE WHEN status = 'closed' THEN 1 ELSE 0 END) AS closed_count,
        SUM(CASE WHEN created_at > NOW() - INTERVAL '24 hours' THEN 1 ELSE 0 END) AS today_count
      FROM chat_conversations
    `);

    const msgResult = await pool.query(`SELECT COUNT(*) AS total FROM chat_messages`);

    return c.json({
      success: true,
      stats: {
        ...result.rows[0],
        total_messages: msgResult.rows[0].total,
      },
    });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to load stats' }, 500);
  }
});

// ── SuperAdmin: Telegram settings ────────────────────────────────────────────
chatRoutes.get('/admin/telegram-status', async (c) => {
  const hasToken = !!getTelegramToken();
  const hasChatId = !!getTelegramAdminChatId();
  return c.json({
    success: true,
    configured: hasToken && hasChatId,
    hasToken,
    hasChatId,
    chatId: hasChatId ? getTelegramAdminChatId() : null,
  });
});

chatRoutes.post('/admin/telegram-test', async (c) => {
  const ok = await sendTelegramMessage('✅ <b>Adiology Chat Bot</b>\n\nTelegram notifications are working correctly! You will receive alerts here whenever users message the support chat.');
  if (ok) {
    return c.json({ success: true, message: 'Test message sent to Telegram successfully!' });
  }
  return c.json({ success: false, error: 'Failed to send test message. Please check your TELEGRAM_BOT_TOKEN and TELEGRAM_ADMIN_CHAT_ID environment variables.' }, 400);
});

// Helper to fetch the admin's chat ID (by calling getUpdates after the admin messages the bot)
chatRoutes.get('/admin/telegram-get-updates', async (c) => {
  const token = getTelegramToken();
  if (!token) {
    return c.json({ success: false, error: 'TELEGRAM_BOT_TOKEN not configured' }, 400);
  }
  try {
    const res = await fetch(`${TELEGRAM_API}/bot${token}/getUpdates?limit=10`);
    const data: any = await res.json();
    if (!data.ok) {
      return c.json({ success: false, error: data.description || 'Failed to get updates' }, 400);
    }
    const updates = data.result || [];
    const chatIds = updates
      .filter((u: any) => u.message?.from)
      .map((u: any) => ({
        chatId: u.message.chat.id,
        username: u.message.from.username,
        firstName: u.message.from.first_name,
        text: u.message.text,
      }));
    return c.json({ success: true, updates: chatIds });
  } catch (err: any) {
    return c.json({ success: false, error: err.message }, 500);
  }
});

// ── SuperAdmin: get chatbot custom FAQs ──────────────────────────────────────
chatRoutes.get('/admin/settings', async (c) => {
  try {
    const result = await pool.query(
      `SELECT value FROM system_settings WHERE key = 'chatbot_settings' LIMIT 1`
    );
    const defaults = {
      botName: 'Aria',
      welcomeMessage: "Hi! I'm Aria, your Adiology assistant 👋 How can I help you today?",
      offlineMessage: "We're currently offline but your message has been saved. We'll get back to you soon!",
      quickReplies: [
        'How does the free trial work?',
        'What are the pricing plans?',
        'How do I connect my Google Ads?',
        'I need help with my campaign',
      ],
      telegramNotifications: true,
    };
    if (result.rows.length === 0) {
      return c.json({ success: true, settings: defaults });
    }
    return c.json({ success: true, settings: { ...defaults, ...result.rows[0].value } });
  } catch {
    return c.json({ success: true, settings: {} });
  }
});

chatRoutes.post('/admin/settings', async (c) => {
  try {
    const settings = await c.req.json();
    await pool.query(
      `INSERT INTO system_settings (key, value, updated_at) VALUES ('chatbot_settings', $1, NOW())
       ON CONFLICT (key) DO UPDATE SET value = $1, updated_at = NOW()`,
      [JSON.stringify(settings)]
    );
    return c.json({ success: true });
  } catch (error: any) {
    return c.json({ success: false, error: 'Failed to save settings' }, 500);
  }
});
