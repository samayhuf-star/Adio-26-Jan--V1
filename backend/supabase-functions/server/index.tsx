import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Cookie handling middleware - ensures cookies work in cross-site contexts
app.use("/*", async (c, next) => {
  await next();
  
  // Get all Set-Cookie headers from response
  const setCookieHeaders = c.res.headers.get("Set-Cookie");
  
  if (setCookieHeaders) {
    // Parse and update cookie attributes
    const cookies = Array.isArray(setCookieHeaders) ? setCookieHeaders : [setCookieHeaders];
    const updatedCookies = cookies.map((cookie: string) => {
      // If cookie doesn't have SameSite, add SameSite=None; Secure
      if (!cookie.includes("SameSite")) {
        // Ensure Secure is present when SameSite=None
        if (cookie.includes("Secure") || cookie.includes("secure")) {
          return `${cookie}; SameSite=None`;
        } else {
          return `${cookie}; SameSite=None; Secure`;
        }
      }
      // If SameSite is Lax or Strict but we need cross-site, update to None
      if (cookie.includes("SameSite=Lax") || cookie.includes("SameSite=Strict")) {
        return cookie
          .replace(/SameSite=Lax/gi, "SameSite=None")
          .replace(/SameSite=Strict/gi, "SameSite=None")
          .replace(/; Secure/gi, "")
          .concat("; Secure");
      }
      return cookie;
    });
    
    // Set updated cookies
    c.res.headers.delete("Set-Cookie");
    updatedCookies.forEach((cookie: string) => {
      c.res.headers.append("Set-Cookie", cookie);
    });
  }
});

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization", "Cookie"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length", "Set-Cookie"],
    credentials: true,
    maxAge: 600,
  }),
);

// Global error handler
app.onError((err, c) => {
  console.error('Server Error:', err);
  return c.json({ error: err.message || "Internal Server Error" }, 500);
});

// Health check endpoint
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/generate-keywords", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { seeds, negatives } = body;
    
    console.log("Received generate-keywords request:", { seeds: seeds?.substring(0, 50), negatives: negatives?.substring(0, 50) });
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return c.json({ error: "Server misconfiguration: API Key missing" }, 500);
    }

    if (!seeds) {
        console.error("Seeds parameter is missing");
        return c.json({ error: "Seeds are required" }, 400);
    }

    const prompt = `
      Act as a Google Ads expert. Generate 15-20 relevant keywords based on these Seed Keywords:
      ${seeds}

      STRICTLY EXCLUDE any keywords related to these Negative Keywords:
      ${negatives || ''}

      Return a pure JSON array of objects (no markdown, no backticks) with these keys:
      - id: string (unique id like 'k-1', 'k-2')
      - text: string (the keyword)
      - volume: string (e.g., 'High', 'Medium', 'Low', or range '1K-10K')
      - cpc: string (e.g., '$1.50')
      - type: string ('Broad', 'Phrase', or 'Exact')
      - competition: string ('High', 'Medium', 'Low')
    `;

    console.log("Calling Gemini API...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error("Gemini API Error:", errData);
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    console.log("Gemini raw response:", JSON.stringify(data).substring(0, 200));
    
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      console.error("No content generated from Gemini");
      throw new Error("No content generated");
    }

    console.log("Gemini text response (first 200 chars):", textResponse.substring(0, 200));

    // Clean potential markdown
    const cleanJson = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    console.log("Cleaned JSON (first 200 chars):", cleanJson.substring(0, 200));
    
    const keywords = JSON.parse(cleanJson);
    console.log("Successfully parsed keywords. Count:", keywords.length);
    console.log("Sample keyword:", keywords[0]);

    return c.json({ keywords });
  } catch (err) {
    console.error("Generate Keywords Error:", err);
    console.error("Error stack:", err.stack);
    return c.json({ error: err.message || "Failed to generate keywords" }, 500);
  }
});

// Generate negative keywords with AI using website URL analysis
app.post("/ai/generate-negative-keywords", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { url, coreKeywords, userGoal } = body;
    
    console.log("Received generate-negative-keywords request:", { url, coreKeywords, userGoal });
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return c.json({ error: "Server misconfiguration: API Key missing" }, 500);
    }

    if (!url || !coreKeywords || !userGoal) {
        console.error("Required parameters missing");
        return c.json({ error: "URL, core keywords, and user goal are required" }, 400);
    }

    const prompt = `
      Act as a Google Ads expert specializing in negative keyword research.
      
      Website URL: ${url}
      Core Keywords: ${coreKeywords}
      User Goal: ${userGoal}
      
      Based on the URL provided, imagine you are analyzing this website to understand:
      1. What business/service it provides
      2. What the call-to-action (CTA) is
      3. What type of customers they want to attract
      4. What searches would waste their ad budget
      
      Generate a comprehensive list of 50-100 negative keywords that would:
      - Prevent ads from showing for irrelevant searches
      - Filter out job seekers, DIY searchers, or free/cheap seekers (if not appropriate)
      - Exclude competitor brand names
      - Block informational queries if the goal is transactional
      - Prevent wasted spend based on the user goal (${userGoal})
      
      Consider common negative keyword categories:
      - Employment-related (job, career, salary, resume, hiring)
      - Educational (free, how to, tutorial, DIY, course, training)
      - Competitor brands
      - Low-intent (review, comparison, vs, alternative)
      - Price-focused (cheap, free, discount) if not appropriate for the business
      - Informational (what is, definition, meaning)
      - Wrong product/service type
      
      Return a pure JSON array of objects (no markdown, no backticks) with these keys:
      - keyword: string (the negative keyword without brackets)
      - reason: string (why this should be excluded)
      - category: string (category like "Employment", "Educational", "Low Intent", "Competitor", etc.)
      
      Important: Return ONLY the JSON array, no other text or formatting.
    `;

    console.log("Calling Gemini API for negative keywords...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errData = await response.json();
      console.error("Gemini API Error:", errData);
      throw new Error(`Gemini API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const textResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!textResponse) {
      throw new Error("No content generated");
    }

    // Clean potential markdown
    const cleanJson = textResponse.replace(/```json/g, "").replace(/```/g, "").trim();
    const keywords = JSON.parse(cleanJson);

    console.log("Successfully generated negative keywords:", keywords.length);
    return c.json({ keywords });
  } catch (err) {
    console.error("Generate Negative Keywords Error:", err);
    return c.json({ error: err.message || "Failed to generate negative keywords" }, 500);
  }
});

// Generate AI-optimized ads
app.post("/generate-ads", async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const { keywords, adType, count, groupName } = body;
    
    console.log("Received generate-ads request:", { keywords, adType, count, groupName });
    
    const apiKey = Deno.env.get("GEMINI_API_KEY");

    if (!apiKey) {
      console.error("GEMINI_API_KEY is missing");
      return c.json({ error: "Server misconfiguration: API Key missing" }, 500);
    }

    if (!keywords || !Array.isArray(keywords) || keywords.length === 0) {
      console.error("Keywords parameter is missing or invalid");
      return c.json({ error: "Keywords array is required" }, 400);
    }

    if (!adType || !['RSA', 'DKI', 'CallOnly'].includes(adType)) {
      console.error("Invalid ad type");
      return c.json({ error: "Valid adType is required (RSA, DKI, or CallOnly)" }, 400);
    }

    const keywordList = keywords.join(', ');
    
    let prompt = '';
    
    if (adType === 'RSA') {
      prompt = `You are a Google Ads expert specializing in creating high-performing Responsive Search Ads (RSA) that maximize Ad Rank and Quality Score.

Create ${count || 5} unique Responsive Search Ad variations for these keywords: ${keywordList}

Each ad should be optimized for maximum Google Ad Rank with:
- Compelling, click-worthy headlines that include keywords naturally
- Clear value propositions and calls-to-action
- Description text that reinforces the headlines
- Excellent keyword relevance
- Strong expected CTR signals

RSA Requirements:
- Headlines should be 30 characters or less
- Descriptions should be 90 characters or less
- Include the main keyword in at least one headline
- Use power words and urgency when appropriate
- Add path1 and path2 (each 15 characters max) that are relevant to keywords

Return a pure JSON array (no markdown, no backticks) with these exact keys for each ad:
{
  "headline1": "string",
  "headline2": "string", 
  "headline3": "string",
  "headline4": "string (optional)",
  "headline5": "string (optional)",
  "description1": "string",
  "description2": "string",
  "path1": "string",
  "path2": "string",
  "finalUrl": "https://www.example.com"
}

Important: Return ONLY the JSON array, no other text or formatting.`;
    } else if (adType === 'DKI') {
      prompt = `You are a Google Ads expert specializing in Dynamic Keyword Insertion (DKI) ads that maximize relevance and Quality Score.

Create ${count || 5} unique DKI ad variations for these keywords: ${keywordList}

DKI ads should:
- Use {KeyWord:DefaultText} syntax to dynamically insert the user's search query
- Have compelling default text that makes sense if keyword insertion fails
- Maximize relevance and expected CTR
- Include the keyword placeholder in headlines and descriptions strategically
- Work well across all the provided keywords

Each DKI ad headline/description should be 30/90 characters or less including the DKI syntax.

Return a pure JSON array (no markdown, no backticks) with these exact keys for each ad:
{
  "headline1": "string with {KeyWord:default}",
  "headline2": "string with {KeyWord:default}",
  "headline3": "string with {KeyWord:default}",
  "description1": "string with {KeyWord:default}",
  "description2": "string with {KeyWord:default}",
  "path1": "string",
  "path2": "string",
  "finalUrl": "https://www.example.com"
}

Important: Return ONLY the JSON array, no other text or formatting.`;
    } else if (adType === 'CallOnly') {
      prompt = `You are a Google Ads expert specializing in Call-Only ads that drive phone calls and maximize conversion rates.

Create ${count || 5} unique Call-Only ad variations for these keywords: ${keywordList}

Call-Only ads should:
- Encourage immediate phone calls with strong CTAs
- Highlight availability (24/7, speak to expert, etc.)
- Create urgency and trust
- Be optimized for mobile users
- Include compelling reasons to call NOW

Requirements:
- Headline 1: 30 characters or less
- Headline 2: 30 characters or less  
- Descriptions: 90 characters or less
- Focus on driving calls, not clicks to website

Return a pure JSON array (no markdown, no backticks) with these exact keys for each ad:
{
  "headline1": "string",
  "headline2": "string",
  "description1": "string",
  "description2": "string",
  "phoneNumber": "+1-800-123-4567",
  "businessName": "Your Business Name"
}

Important: Return ONLY the JSON array, no other text or formatting.`;
    }

    console.log("Calling Gemini API for ad generation...");
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API error:", errorText);
      return c.json({ error: `Gemini API error: ${errorText}` }, response.status);
    }

    const data = await response.json();
    console.log("Gemini API response received");

    const textContent = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!textContent) {
      console.error("No text content in Gemini response");
      return c.json({ error: "Invalid response from AI" }, 500);
    }

    console.log("Raw AI response:", textContent.substring(0, 200));

    // Parse the JSON from the response (handle markdown code blocks)
    let cleanedText = textContent.trim();
    if (cleanedText.startsWith('```json')) {
      cleanedText = cleanedText.replace(/^```json\s*/, '').replace(/```\s*$/, '');
    } else if (cleanedText.startsWith('```')) {
      cleanedText = cleanedText.replace(/^```\s*/, '').replace(/```\s*$/, '');
    }

    let ads;
    try {
      ads = JSON.parse(cleanedText);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Attempted to parse:", cleanedText);
      return c.json({ error: "Failed to parse AI response as JSON" }, 500);
    }

    if (!Array.isArray(ads)) {
      console.error("Response is not an array");
      return c.json({ error: "Invalid response format from AI" }, 500);
    }

    console.log(`✅ Successfully generated ${ads.length} ${adType} ads`);

    return c.json({ 
      ads,
      count: ads.length,
      adType,
      groupName
    });

  } catch (error: any) {
    console.error("Error in generate-ads endpoint:", error);
    return c.json({ error: error.message || "Failed to generate ads" }, 500);
  }
});

// --- History Endpoints ---

app.post("/history/save", async (c) => {
  try {
    const body = await c.req.json();
    const { type, name, data } = body;
    
    const userId = "user-default"; 
    const id = crypto.randomUUID();
    const timestamp = new Date().toISOString();
    
    const entry = { id, userId, type, name, data, timestamp };
    const key = `history:${userId}:${id}`;
    
    await kv.set(key, entry);
    return c.json({ success: true, id });
  } catch (err) {
    console.error("History Save Error:", err);
    return c.json({ error: "Failed to save history" }, 500);
  }
});

app.get("/history/list", async (c) => {
  try {
    const userId = "user-default"; 
    const prefix = `history:${userId}`;
    
    const entries = await kv.getByPrefix(prefix);
    const sorted = entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    return c.json({ history: sorted });
  } catch (err) {
    console.error("History List Error:", err);
    return c.json({ error: "Failed to fetch history" }, 500);
  }
});

app.post("/history/delete", async (c) => {
    try {
        const { id } = await c.req.json();
        const userId = "user-default";
        await kv.del(`history:${userId}:${id}`);
        return c.json({ success: true });
    } catch (err) {
        console.error("History Delete Error:", err);
        return c.json({ error: "Failed to delete" }, 500);
    }
});

// --- Support Ticket Endpoints ---

app.post("/tickets/create", async (c) => {
  try {
    const { subject, message, priority } = await c.req.json();
    const id = crypto.randomUUID();
    const userId = "user-default";
    const timestamp = new Date().toISOString();
    
    const ticket = { 
      id, 
      userId, 
      subject, 
      message, 
      priority, 
      status: 'Open', 
      timestamp 
    };
    
    await kv.set(`ticket:${userId}:${id}`, ticket);
    return c.json({ success: true, ticket });
  } catch (err) {
    console.error("Ticket Create Error:", err);
    return c.json({ error: "Failed to create ticket" }, 500);
  }
});

app.get("/tickets/list", async (c) => {
  try {
    const userId = "user-default";
    const tickets = await kv.getByPrefix(`ticket:${userId}`);
    const sorted = tickets.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    return c.json({ tickets: sorted });
  } catch (err) {
    console.error("Tickets List Error:", err);
    return c.json({ error: "Failed to fetch tickets" }, 500);
  }
});

// --- Billing Endpoints (Mock) ---

app.get("/billing/info", (c) => {
  return c.json({
    plan: "Free",
    nextBillingDate: "2025-12-01",
    invoices: [
        { id: "inv_1", date: "2025-11-01", amount: "$0.00", status: "Paid" },
        { id: "inv_2", date: "2025-10-01", amount: "$0.00", status: "Paid" }
    ]
  });
});

app.post("/billing/subscribe", async (c) => {
    return c.json({ success: true, message: "Redirecting to payment provider..." });
});

// ============================================
// SUPER ADMIN ENDPOINTS
// ============================================

// Helper to verify super admin
async function verifySuperAdmin(c: any): Promise<{ valid: boolean; userId?: string }> {
  try {
    const authHeader = c.req.header("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return { valid: false };
    }

    const token = authHeader.substring(7);
    // In production, verify JWT token with Supabase
    // For now, we'll use a simple check - in production use Supabase Admin API
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials missing");
      return { valid: false };
    }

    // Verify token and check user role
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: { persistSession: false }
    });

    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return { valid: false };
    }

    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!userData || userData.role !== "superadmin") {
      return { valid: false };
    }

    return { valid: true, userId: user.id };
  } catch (err) {
    console.error("Super admin verification error:", err);
    return { valid: false };
  }
}

// Get all users (Super Admin only)
app.get("/admin/users", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { search, page = "1", limit = "50" } = c.req.query();
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    let query = supabase
      .from("users")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (search) {
      query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%`);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching users:", error);
      return c.json({ error: "Failed to fetch users" }, 500);
    }

    return c.json({
      users: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (err) {
    console.error("Get users error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get user by ID
app.get("/admin/users/:id", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = c.req.param("id");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      return c.json({ error: "User not found" }, 404);
    }

    return c.json({ user: data });
  } catch (err) {
    console.error("Get user error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Update user
app.put("/admin/users/:id", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = c.req.param("id");
    const body = await c.req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("users")
      .update(body)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Error updating user:", error);
      return c.json({ error: "Failed to update user" }, 500);
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      user_id: auth.userId,
      action: "update_user",
      resource_type: "user",
      resource_id: userId,
      metadata: { changes: body }
    });

    return c.json({ user: data });
  } catch (err) {
    console.error("Update user error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Delete user
app.delete("/admin/users/:id", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = c.req.param("id");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from("users")
      .delete()
      .eq("id", userId);

    if (error) {
      console.error("Error deleting user:", error);
      return c.json({ error: "Failed to delete user" }, 500);
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      user_id: auth.userId,
      action: "delete_user",
      resource_type: "user",
      resource_id: userId
    });

    return c.json({ success: true });
  } catch (err) {
    console.error("Delete user error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get system overview stats
app.get("/admin/overview", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get total users
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    // Get active subscriptions
    const { count: activeSubscriptions } = await supabase
      .from("subscriptions")
      .select("*", { count: "exact", head: true })
      .eq("status", "active");

    // Get recent signups (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: recentSignups } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .gte("created_at", thirtyDaysAgo.toISOString());

    // Get system health
    const { data: healthData } = await supabase
      .from("system_health")
      .select("*")
      .order("last_check_at", { ascending: false })
      .limit(10);

    return c.json({
      totalUsers: totalUsers || 0,
      activeSubscriptions: activeSubscriptions || 0,
      recentSignups: recentSignups || 0,
      systemHealth: healthData || []
    });
  } catch (err) {
    console.error("Get overview error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get audit logs
app.get("/admin/audit-logs", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { page = "1", limit = "50", action, userId } = c.req.query();
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("audit_logs")
      .select("*, users(email, full_name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (action) {
      query = query.eq("action", action);
    }
    if (userId) {
      query = query.eq("user_id", userId);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching audit logs:", error);
      return c.json({ error: "Failed to fetch audit logs" }, 500);
    }

    return c.json({
      logs: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum)
      }
    });
  } catch (err) {
    console.error("Get audit logs error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get billing/subscription stats
app.get("/admin/billing/stats", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get subscription counts by plan
    const { data: subscriptions } = await supabase
      .from("subscriptions")
      .select("plan, status");

    const planDistribution: Record<string, number> = {};
    subscriptions?.forEach(sub => {
      const key = `${sub.plan}_${sub.status}`;
      planDistribution[key] = (planDistribution[key] || 0) + 1;
    });

    // Get recent transactions
    const { data: recentInvoices } = await supabase
      .from("invoices")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(20);

    return c.json({
      planDistribution,
      recentTransactions: recentInvoices || []
    });
  } catch (err) {
    console.error("Get billing stats error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get usage metrics
app.get("/admin/usage", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { metricType, period = "24h" } = c.req.query();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const periodStart = new Date();
    if (period === "24h") {
      periodStart.setHours(periodStart.getHours() - 24);
    } else if (period === "7d") {
      periodStart.setDate(periodStart.getDate() - 7);
    } else {
      periodStart.setDate(periodStart.getDate() - 30);
    }

    let query = supabase
      .from("usage_metrics")
      .select("*")
      .gte("period_start", periodStart.toISOString())
      .order("created_at", { ascending: false });

    if (metricType) {
      query = query.eq("metric_type", metricType);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching usage metrics:", error);
      return c.json({ error: "Failed to fetch usage metrics" }, 500);
    }

    return c.json({ metrics: data || [] });
  } catch (err) {
    console.error("Get usage metrics error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Get system health
app.get("/admin/health", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("system_health")
      .select("*")
      .order("last_check_at", { ascending: false })
      .limit(20);

    if (error) {
      console.error("Error fetching system health:", error);
      return c.json({ error: "Failed to fetch system health" }, 500);
    }

    return c.json({ health: data || [] });
  } catch (err) {
    console.error("Get system health error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Feature flags endpoints
app.get("/admin/feature-flags", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("feature_flags")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching feature flags:", error);
      return c.json({ error: "Failed to fetch feature flags" }, 500);
    }

    return c.json({ flags: data || [] });
  } catch (err) {
    console.error("Get feature flags error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/admin/feature-flags", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("feature_flags")
      .insert(body)
      .select()
      .single();

    if (error) {
      console.error("Error creating feature flag:", error);
      return c.json({ error: "Failed to create feature flag" }, 500);
    }

    return c.json({ flag: data });
  } catch (err) {
    console.error("Create feature flag error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/admin/feature-flags/:id", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const flagId = c.req.param("id");
    const body = await c.req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("feature_flags")
      .update(body)
      .eq("id", flagId)
      .select()
      .single();

    if (error) {
      console.error("Error updating feature flag:", error);
      return c.json({ error: "Failed to update feature flag" }, 500);
    }

    return c.json({ flag: data });
  } catch (err) {
    console.error("Update feature flag error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Create user (Super Admin only)
app.post("/admin/users", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid || !auth.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const { email, password, full_name, subscription_plan = "free" } = body;

    if (!email || !password) {
      return c.json({ error: "Email and password are required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Create auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: full_name || "",
        subscription_plan,
      },
    });

    if (authError) {
      console.error("Error creating auth user:", authError);
      return c.json({ error: "Failed to create user: " + authError.message }, 500);
    }

    // Create user record in users table
    const { data: userData, error: userError } = await supabase
      .from("users")
      .insert({
        id: authUser.user.id,
        email,
        full_name: full_name || null,
        subscription_plan,
        subscription_status: "active",
        role: "user",
      })
      .select()
      .single();

    if (userError) {
      console.error("Error creating user record:", userError);
      // Try to clean up auth user if user record creation fails
      await supabase.auth.admin.deleteUser(authUser.user.id);
      return c.json({ error: "Failed to create user record" }, 500);
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      user_id: auth.userId,
      action: "create_user",
      resource_type: "user",
      resource_id: authUser.user.id,
      metadata: { email, subscription_plan },
    });

    return c.json({ user: userData });
  } catch (err) {
    console.error("Create user error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Reset password (Super Admin only)
app.post("/admin/users/:id/reset-password", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid || !auth.userId) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userId = c.req.param("id");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user email first
    const { data: userData } = await supabase
      .from("users")
      .select("email")
      .eq("id", userId)
      .single();

    if (!userData) {
      return c.json({ error: "User not found" }, 404);
    }

    const { data: linkData, error: linkError } = await supabase.auth.admin.generateLink({
      type: "recovery",
      email: userData.email,
    });

    if (linkError) {
      console.error("Error generating reset link:", linkError);
      return c.json({ error: "Failed to generate reset link" }, 500);
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      user_id: auth.userId,
      action: "reset_password",
      resource_type: "user",
      resource_id: userId,
    });

    return c.json({ 
      link: linkData.properties?.action_link || linkData.properties?.recovery_link,
      message: "Password reset link generated"
    });
  } catch (err) {
    console.error("Reset password error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Support Tickets endpoints
app.get("/admin/support/tickets", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { page = "1", limit = "50", status, priority } = c.req.query();
    const pageNum = parseInt(page) || 1;
    const limitNum = parseInt(limit) || 50;
    const offset = (pageNum - 1) * limitNum;

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase
      .from("support_tickets")
      .select("*, users(email, full_name)", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limitNum - 1);

    if (status) query = query.eq("status", status);
    if (priority) query = query.eq("priority", priority);

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching support tickets:", error);
      return c.json({ error: "Failed to fetch support tickets" }, 500);
    }

    return c.json({
      tickets: data || [],
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limitNum),
      },
    });
  } catch (err) {
    console.error("Get support tickets error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/admin/support/tickets/:id", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const ticketId = c.req.param("id");
    const body = await c.req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const updateData: any = { ...body };
    if (body.status === "resolved" && !body.resolved_at) {
      updateData.resolved_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from("support_tickets")
      .update(updateData)
      .eq("id", ticketId)
      .select()
      .single();

    if (error) {
      console.error("Error updating support ticket:", error);
      return c.json({ error: "Failed to update ticket" }, 500);
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      user_id: auth.userId,
      action: "update_support_ticket",
      resource_type: "support_ticket",
      resource_id: ticketId,
      metadata: { changes: body },
    });

    return c.json({ ticket: data });
  } catch (err) {
    console.error("Update support ticket error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Announcements endpoints
app.get("/admin/announcements", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching announcements:", error);
      return c.json({ error: "Failed to fetch announcements" }, 500);
    }

    return c.json({ announcements: data || [] });
  } catch (err) {
    console.error("Get announcements error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/admin/announcements", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("announcements")
      .insert({
        ...body,
        created_by: auth.userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating announcement:", error);
      return c.json({ error: "Failed to create announcement" }, 500);
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      user_id: auth.userId,
      action: "create_announcement",
      resource_type: "announcement",
      resource_id: data.id,
    });

    return c.json({ announcement: data });
  } catch (err) {
    console.error("Create announcement error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/admin/announcements/:id", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const announcementId = c.req.param("id");
    const body = await c.req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("announcements")
      .update(body)
      .eq("id", announcementId)
      .select()
      .single();

    if (error) {
      console.error("Error updating announcement:", error);
      return c.json({ error: "Failed to update announcement" }, 500);
    }

    return c.json({ announcement: data });
  } catch (err) {
    console.error("Update announcement error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.delete("/admin/announcements/:id", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const announcementId = c.req.param("id");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error } = await supabase
      .from("announcements")
      .delete()
      .eq("id", announcementId);

    if (error) {
      console.error("Error deleting announcement:", error);
      return c.json({ error: "Failed to delete announcement" }, 500);
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      user_id: auth.userId,
      action: "delete_announcement",
      resource_type: "announcement",
      resource_id: announcementId,
    });

    return c.json({ success: true });
  } catch (err) {
    console.error("Delete announcement error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Email Templates endpoints
app.get("/admin/email-templates", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("email_templates")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching email templates:", error);
      return c.json({ error: "Failed to fetch email templates" }, 500);
    }

    return c.json({ templates: data || [] });
  } catch (err) {
    console.error("Get email templates error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.post("/admin/email-templates", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const body = await c.req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("email_templates")
      .insert({
        ...body,
        created_by: auth.userId,
      })
      .select()
      .single();

    if (error) {
      console.error("Error creating email template:", error);
      return c.json({ error: "Failed to create email template" }, 500);
    }

    return c.json({ template: data });
  } catch (err) {
    console.error("Create email template error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/admin/email-templates/:id", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const templateId = c.req.param("id");
    const body = await c.req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("email_templates")
      .update(body)
      .eq("id", templateId)
      .select()
      .single();

    if (error) {
      console.error("Error updating email template:", error);
      return c.json({ error: "Failed to update email template" }, 500);
    }

    return c.json({ template: data });
  } catch (err) {
    console.error("Update email template error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Configuration endpoints
app.get("/admin/config", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const { category } = c.req.query();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    let query = supabase.from("config_settings").select("*");

    if (category) {
      query = query.eq("category", category);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching config:", error);
      return c.json({ error: "Failed to fetch config" }, 500);
    }

    return c.json({ settings: data || [] });
  } catch (err) {
    console.error("Get config error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/admin/config/:key", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const configKey = c.req.param("key");
    const body = await c.req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("config_settings")
      .update({
        ...body,
        updated_by: auth.userId,
      })
      .eq("key", configKey)
      .select()
      .single();

    if (error) {
      console.error("Error updating config:", error);
      return c.json({ error: "Failed to update config" }, 500);
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      user_id: auth.userId,
      action: "update_config",
      resource_type: "config",
      resource_id: configKey,
      metadata: { changes: body },
    });

    return c.json({ setting: data });
  } catch (err) {
    console.error("Update config error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// Pricing Plans endpoints
app.get("/admin/pricing-plans", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("pricing_plans")
      .select("*")
      .order("sort_order", { ascending: true });

    if (error) {
      console.error("Error fetching pricing plans:", error);
      return c.json({ error: "Failed to fetch pricing plans" }, 500);
    }

    return c.json({ plans: data || [] });
  } catch (err) {
    console.error("Get pricing plans error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

app.put("/admin/pricing-plans/:id", async (c) => {
  try {
    const auth = await verifySuperAdmin(c);
    if (!auth.valid) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const planId = c.req.param("id");
    const body = await c.req.json();
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { data, error } = await supabase
      .from("pricing_plans")
      .update(body)
      .eq("id", planId)
      .select()
      .single();

    if (error) {
      console.error("Error updating pricing plan:", error);
      return c.json({ error: "Failed to update pricing plan" }, 500);
    }

    // Log audit
    await supabase.from("audit_logs").insert({
      user_id: auth.userId,
      action: "update_pricing_plan",
      resource_type: "pricing_plan",
      resource_id: planId,
      metadata: { changes: body },
    });

    return c.json({ plan: data });
  } catch (err) {
    console.error("Update pricing plan error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ========== EMAIL FUNCTIONALITY WITH POSTMARK ==========

/**
 * Send email using Postmark API
 */
async function sendEmailViaPostmark(
  to: string,
  subject: string,
  htmlBody: string,
  textBody?: string
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  const postmarkApiKey = Deno.env.get("POSTMARK_API_KEY");
  const postmarkFromEmail = Deno.env.get("POSTMARK_FROM_EMAIL") || "noreply@adiology.online";

  if (!postmarkApiKey) {
    console.error("POSTMARK_API_KEY is not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const response = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Accept": "application/json",
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkApiKey,
      },
      body: JSON.stringify({
        From: postmarkFromEmail,
        To: to,
        Subject: subject,
        HtmlBody: htmlBody,
        TextBody: textBody || htmlBody.replace(/<[^>]*>/g, ""), // Strip HTML for text version
        MessageStream: "outbound",
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Postmark API Error:", data);
      return {
        success: false,
        error: data.Message || `HTTP ${response.status}`,
      };
    }

    console.log("Email sent successfully via Postmark:", data.MessageID);
    return {
      success: true,
      messageId: data.MessageID,
    };
  } catch (error) {
    console.error("Error sending email via Postmark:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

/**
 * Generate email verification HTML template
 */
function generateVerificationEmailHtml(
  email: string,
  verificationUrl: string,
  token: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify Your Email - Adiology</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Adiology</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">~ Samay</p>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #1a202c; margin-top: 0;">Verify Your Email Address</h2>
    
    <p style="color: #4a5568; font-size: 16px;">
      Hi there,
    </p>
    
    <p style="color: #4a5568; font-size: 16px;">
      Thank you for signing up for Adiology! Please verify your email address by clicking the button below:
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${verificationUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Verify Email Address
      </a>
    </div>
    
    <p style="color: #718096; font-size: 14px; margin-top: 30px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="color: #667eea; font-size: 12px; word-break: break-all; background: #f7fafc; padding: 15px; border-radius: 6px; font-family: monospace;">
      ${verificationUrl}
    </p>
    
    <p style="color: #718096; font-size: 14px; margin-top: 30px;">
      This verification link will expire in 24 hours. If you didn't create an account with Adiology, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #a0aec0; font-size: 12px; text-align: center; margin: 0;">
      © ${new Date().getFullYear()} Adiology. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate activation email HTML template
 */
function generateActivationEmailHtml(
  email: string,
  activationUrl: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Activate Your Account - Adiology</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 28px;">Adiology</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">~ Samay</p>
  </div>
  
  <div style="background: #ffffff; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
    <h2 style="color: #1a202c; margin-top: 0;">Activate Your Account</h2>
    
    <p style="color: #4a5568; font-size: 16px;">
      Hi there,
    </p>
    
    <p style="color: #4a5568; font-size: 16px;">
      Welcome to Adiology! Your account has been created. Please activate your account by clicking the button below:
    </p>
    
    <div style="text-align: center; margin: 40px 0;">
      <a href="${activationUrl}" 
         style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
        Activate Account
      </a>
    </div>
    
    <p style="color: #718096; font-size: 14px; margin-top: 30px;">
      Or copy and paste this link into your browser:
    </p>
    <p style="color: #667eea; font-size: 12px; word-break: break-all; background: #f7fafc; padding: 15px; border-radius: 6px; font-family: monospace;">
      ${activationUrl}
    </p>
    
    <p style="color: #718096; font-size: 14px; margin-top: 30px;">
      This activation link will expire in 24 hours. If you didn't create an account with Adiology, you can safely ignore this email.
    </p>
    
    <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
    
    <p style="color: #a0aec0; font-size: 12px; text-align: center; margin: 0;">
      © ${new Date().getFullYear()} Adiology. All rights reserved.
    </p>
  </div>
</body>
</html>
  `.trim();
}

// ========== EMAIL API ENDPOINTS ==========

/**
 * Send verification email endpoint
 */
app.post("/email/send-verification", async (c) => {
  try {
    const body = await c.req.json();
    const { email, token, baseUrl } = body;

    if (!email || !token) {
      return c.json({ error: "Email and token are required" }, 400);
    }

    const frontendUrl = baseUrl || Deno.env.get("FRONTEND_URL") || "https://adiology.online";
    const verificationUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    const htmlBody = generateVerificationEmailHtml(email, verificationUrl, token);
    const textBody = `Verify your email address by visiting: ${verificationUrl}`;

    const result = await sendEmailViaPostmark(
      email,
      "Verify Your Email - Adiology",
      htmlBody,
      textBody
    );

    if (!result.success) {
      console.error("Failed to send verification email:", result.error);
      return c.json(
        { error: result.error || "Failed to send email" },
        500
      );
    }

    console.log(`Verification email sent to ${email}, MessageID: ${result.messageId}`);

    return c.json({
      success: true,
      messageId: result.messageId,
      message: "Verification email sent successfully",
    });
  } catch (err) {
    console.error("Send verification email error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * Send activation email endpoint
 */
app.post("/email/send-activation", async (c) => {
  try {
    const body = await c.req.json();
    const { email, token, baseUrl } = body;

    if (!email || !token) {
      return c.json({ error: "Email and token are required" }, 400);
    }

    const frontendUrl = baseUrl || Deno.env.get("FRONTEND_URL") || "https://adiology.online";
    const activationUrl = `${frontendUrl}/verify-email?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;

    const htmlBody = generateActivationEmailHtml(email, activationUrl);
    const textBody = `Activate your account by visiting: ${activationUrl}`;

    const result = await sendEmailViaPostmark(
      email,
      "Activate Your Account - Adiology",
      htmlBody,
      textBody
    );

    if (!result.success) {
      console.error("Failed to send activation email:", result.error);
      return c.json(
        { error: result.error || "Failed to send email" },
        500
      );
    }

    console.log(`Activation email sent to ${email}, MessageID: ${result.messageId}`);

    return c.json({
      success: true,
      messageId: result.messageId,
      message: "Activation email sent successfully",
    });
  } catch (err) {
    console.error("Send activation email error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

/**
 * Test email endpoint (for testing Postmark configuration)
 */
app.post("/email/test", async (c) => {
  try {
    const body = await c.req.json();
    const { email } = body;

    if (!email) {
      return c.json({ error: "Email is required" }, 400);
    }

    const testHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Test Email - Adiology</title>
</head>
<body style="font-family: Arial, sans-serif; padding: 20px;">
  <h2>Test Email from Adiology</h2>
  <p>This is a test email to verify Postmark integration is working correctly.</p>
  <p>If you received this email, the email service is configured properly!</p>
  <p style="color: #666; font-size: 12px; margin-top: 30px;">
    Sent at: ${new Date().toISOString()}
  </p>
</body>
</html>
    `.trim();

    const result = await sendEmailViaPostmark(
      email,
      "Test Email - Adiology Postmark Integration",
      testHtml,
      "This is a test email to verify Postmark integration is working correctly."
    );

    if (!result.success) {
      return c.json(
        { error: result.error || "Failed to send test email" },
        500
      );
    }

    return c.json({
      success: true,
      messageId: result.messageId,
      message: "Test email sent successfully",
    });
  } catch (err) {
    console.error("Test email error:", err);
    return c.json({ error: "Internal server error" }, 500);
  }
});

// ========== STRIPE PAYMENT ENDPOINTS ==========

/**
 * Create a Stripe Payment Intent for one-time payments
 */
app.post("/stripe/create-payment-intent", async (c) => {
  try {
    const body = await c.req.json();
    const { priceId, planName, amount, isSubscription, userId } = body;

    if (!amount || amount <= 0) {
      return c.json({ error: "Invalid amount" }, 400);
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return c.json({ error: "Payment service not configured" }, 500);
    }

    // Import Stripe SDK
    const Stripe = (await import("npm:stripe@^17.0.0")).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    // Get user email from Supabase if userId provided
    let customerEmail: string | undefined;
    if (userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseServiceKey) {
        const { createClient } = await import("npm:@supabase/supabase-js@2");
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: userData } = await supabase
          .from("users")
          .select("email")
          .eq("id", userId)
          .single();
        if (userData) {
          customerEmail = userData.email;
        }
      }
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: "usd",
      metadata: {
        planName: planName || "Unknown",
        priceId: priceId || "",
        isSubscription: isSubscription ? "true" : "false",
        userId: userId || "",
      },
      receipt_email: customerEmail,
    });

    return c.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (err) {
    console.error("Create payment intent error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Failed to create payment intent" },
      500
    );
  }
});

/**
 * Create a Stripe Checkout Session for subscriptions
 */
app.post("/stripe/create-checkout-session", async (c) => {
  try {
    const body = await c.req.json();
    const { priceId, planName, userId } = body;

    if (!priceId) {
      return c.json({ error: "Price ID is required" }, 400);
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return c.json({ error: "Payment service not configured" }, 500);
    }

    // Import Stripe SDK
    const Stripe = (await import("npm:stripe@^17.0.0")).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    // Get user email and create/get Stripe customer
    let customerId: string | undefined;
    let customerEmail: string | undefined;

    if (userId) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL");
      const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
      if (supabaseUrl && supabaseServiceKey) {
        const { createClient } = await import("npm:@supabase/supabase-js@2");
        const supabase = createClient(supabaseUrl, supabaseServiceKey);
        const { data: userData } = await supabase
          .from("users")
          .select("email, subscription_id")
          .eq("id", userId)
          .single();

        if (userData) {
          customerEmail = userData.email;

          // Check if user has existing Stripe customer ID
          if (userData.subscription_id) {
            const { data: subscriptionData } = await supabase
              .from("subscriptions")
              .select("stripe_customer_id")
              .eq("user_id", userId)
              .single();

            if (subscriptionData?.stripe_customer_id) {
              customerId = subscriptionData.stripe_customer_id;
            }
          }

          // Create Stripe customer if doesn't exist
          if (!customerId && customerEmail) {
            const customer = await stripe.customers.create({
              email: customerEmail,
              metadata: {
                userId: userId,
                planName: planName || "Unknown",
              },
            });
            customerId = customer.id;
          }
        }
      }
    }

    const frontendUrl = Deno.env.get("FRONTEND_URL") || "https://adiology.online";
    const successUrl = `${frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${frontendUrl}/payment?plan=${encodeURIComponent(planName || "")}`;

    // Create checkout session
    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      customer_email: customerId ? undefined : customerEmail,
      payment_method_types: ["card"],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: {
        userId: userId || "",
        planName: planName || "Unknown",
      },
    });

    return c.json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (err) {
    console.error("Create checkout session error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Failed to create checkout session" },
      500
    );
  }
});

/**
 * Create a Stripe Customer Portal session
 */
app.post("/stripe/create-portal-session", async (c) => {
  try {
    const body = await c.req.json();
    const { customerEmail, returnUrl } = body;

    if (!customerEmail) {
      return c.json({ error: "Customer email is required" }, 400);
    }

    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return c.json({ error: "Payment service not configured" }, 500);
    }

    // Import Stripe SDK
    const Stripe = (await import("npm:stripe@^17.0.0")).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    // Find customer by email
    const customers = await stripe.customers.list({
      email: customerEmail,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return c.json({ error: "Customer not found" }, 404);
    }

    const customerId = customers.data[0].id;

    // Create portal session
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: returnUrl || `${Deno.env.get("FRONTEND_URL") || "https://adiology.online"}/billing`,
    });

    return c.json({
      url: session.url,
    });
  } catch (err) {
    console.error("Create portal session error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Failed to create portal session" },
      500
    );
  }
});

/**
 * Stripe Webhook Handler
 * Handles subscription events and updates database
 */
app.post("/stripe/webhook", async (c) => {
  try {
    const stripeSecretKey = Deno.env.get("STRIPE_SECRET_KEY");
    const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

    if (!stripeSecretKey) {
      console.error("STRIPE_SECRET_KEY is not configured");
      return c.json({ error: "Payment service not configured" }, 500);
    }

    // Import Stripe SDK
    const Stripe = (await import("npm:stripe@^17.0.0")).default;
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: "2024-12-18.acacia",
    });

    const signature = c.req.header("stripe-signature");
    if (!signature) {
      return c.json({ error: "Missing signature" }, 400);
    }

    const body = await c.req.text();

    // Verify webhook signature
    let event;
    try {
      event = webhookSecret
        ? stripe.webhooks.constructEvent(body, signature, webhookSecret)
        : JSON.parse(body); // For testing without webhook secret
    } catch (err) {
      console.error("Webhook signature verification failed:", err);
      return c.json({ error: "Invalid signature" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("Supabase credentials missing");
      return c.json({ error: "Database not configured" }, 500);
    }

    const { createClient } = await import("npm:@supabase/supabase-js@2");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Handle different event types
    switch (event.type) {
      case "payment_intent.succeeded": {
        const paymentIntent = event.data.object;
        const userId = paymentIntent.metadata?.userId;
        const planName = paymentIntent.metadata?.planName;
        const isSubscription = paymentIntent.metadata?.isSubscription === "true";

        if (userId && planName) {
          // Update user subscription
          await supabase
            .from("users")
            .update({
              subscription_plan: planName.toLowerCase().replace(/\s+/g, "_"),
              subscription_status: "active",
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);

          // Create invoice record
          await supabase.from("invoices").insert({
            user_id: userId,
            stripe_invoice_id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: "paid",
            paid_at: new Date().toISOString(),
          });
        }
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (subscriptionData) {
          const userId = subscriptionData.user_id;

          // Update subscription record
          await supabase
            .from("subscriptions")
            .upsert(
              {
                user_id: userId,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: customerId,
                plan: subscription.metadata?.planName || "unknown",
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
                updated_at: new Date().toISOString(),
              },
              { onConflict: "stripe_subscription_id" }
            );

          // Update user record
          await supabase
            .from("users")
            .update({
              subscription_plan: subscription.metadata?.planName?.toLowerCase().replace(/\s+/g, "_") || "free",
              subscription_status: subscription.status === "active" ? "active" : "inactive",
              subscription_id: subscription.id,
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object;
        const customerId = subscription.customer as string;

        // Find user by Stripe customer ID
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (subscriptionData) {
          const userId = subscriptionData.user_id;

          // Update subscription status
          await supabase
            .from("subscriptions")
            .update({
              status: "canceled",
              canceled_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_subscription_id", subscription.id);

          // Update user record
          await supabase
            .from("users")
            .update({
              subscription_status: "canceled",
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }
        break;
      }

      case "invoice.paid": {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        // Find user by Stripe customer ID
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (subscriptionData) {
          const userId = subscriptionData.user_id;

          // Create invoice record
          await supabase.from("invoices").upsert(
            {
              user_id: userId,
              stripe_invoice_id: invoice.id,
              amount: invoice.amount_paid,
              currency: invoice.currency,
              status: "paid",
              invoice_pdf_url: invoice.invoice_pdf || null,
              hosted_invoice_url: invoice.hosted_invoice_url || null,
              due_date: invoice.due_date ? new Date(invoice.due_date * 1000).toISOString() : null,
              paid_at: new Date().toISOString(),
            },
            { onConflict: "stripe_invoice_id" }
          );
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object;
        const customerId = invoice.customer as string;

        // Find user by Stripe customer ID
        const { data: subscriptionData } = await supabase
          .from("subscriptions")
          .select("user_id")
          .eq("stripe_customer_id", customerId)
          .single();

        if (subscriptionData) {
          const userId = subscriptionData.user_id;

          // Update subscription status
          await supabase
            .from("subscriptions")
            .update({
              status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("stripe_customer_id", customerId);

          // Update user record
          await supabase
            .from("users")
            .update({
              subscription_status: "past_due",
              updated_at: new Date().toISOString(),
            })
            .eq("id", userId);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return c.json({ received: true });
  } catch (err) {
    console.error("Webhook error:", err);
    return c.json(
      { error: err instanceof Error ? err.message : "Webhook processing failed" },
      500
    );
  }
});

Deno.serve(app.fetch);