import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

const outputPath = path.resolve(process.cwd(), 'public/Adiology_Design_Document.pdf');
const publicDir = path.dirname(outputPath);
if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });

const doc = new PDFDocument({ size: 'A4', margin: 50, bufferPages: true });
const stream = fs.createWriteStream(outputPath);
doc.pipe(stream);

const colors = {
  primary: '#4F46E5',
  dark: '#1E1B4B',
  text: '#1F2937',
  muted: '#6B7280',
  accent: '#7C3AED',
  border: '#E5E7EB',
  bg: '#F9FAFB',
};

let pageNum = 0;

function heading1(text: string) {
  doc.moveDown(1);
  doc.fontSize(22).fillColor(colors.primary).font('Helvetica-Bold').text(text);
  doc.moveDown(0.3);
  doc.moveTo(doc.x, doc.y).lineTo(doc.x + 495, doc.y).strokeColor(colors.primary).lineWidth(2).stroke();
  doc.moveDown(0.7);
}

function heading2(text: string) {
  doc.moveDown(0.7);
  doc.fontSize(16).fillColor(colors.dark).font('Helvetica-Bold').text(text);
  doc.moveDown(0.3);
}

function heading3(text: string) {
  doc.moveDown(0.5);
  doc.fontSize(13).fillColor(colors.accent).font('Helvetica-Bold').text(text);
  doc.moveDown(0.2);
}

function body(text: string) {
  doc.fontSize(10).fillColor(colors.text).font('Helvetica').text(text, { lineGap: 3 });
}

function bullet(text: string) {
  doc.fontSize(10).fillColor(colors.text).font('Helvetica').text(`  \u2022  ${text}`, { lineGap: 2, indent: 10 });
}

function tableRow(label: string, value: string) {
  const startY = doc.y;
  doc.fontSize(9).fillColor(colors.muted).font('Helvetica-Bold').text(label, 60, startY, { width: 160 });
  doc.fontSize(9).fillColor(colors.text).font('Helvetica').text(value, 220, startY, { width: 320 });
  doc.moveDown(0.3);
}

function separator() {
  doc.moveDown(0.3);
  doc.moveTo(50, doc.y).lineTo(545, doc.y).strokeColor(colors.border).lineWidth(0.5).stroke();
  doc.moveDown(0.3);
}

function checkPageBreak(needed: number = 100) {
  if (doc.y > 720 - needed) {
    doc.addPage();
  }
}

// ========== COVER PAGE ==========
doc.moveDown(6);
doc.fontSize(36).fillColor(colors.primary).font('Helvetica-Bold').text('ADIOLOGY', { align: 'center' });
doc.moveDown(0.3);
doc.fontSize(14).fillColor(colors.accent).font('Helvetica').text('Search Ads Intelligence Platform', { align: 'center' });
doc.moveDown(1.5);
doc.moveTo(150, doc.y).lineTo(445, doc.y).strokeColor(colors.primary).lineWidth(3).stroke();
doc.moveDown(1.5);
doc.fontSize(24).fillColor(colors.dark).font('Helvetica-Bold').text('System Design Document', { align: 'center' });
doc.moveDown(0.5);
doc.fontSize(12).fillColor(colors.muted).font('Helvetica').text('Comprehensive Technical Architecture & Specification', { align: 'center' });
doc.moveDown(4);
doc.fontSize(10).fillColor(colors.muted).font('Helvetica').text(`Document Version: 2.0`, { align: 'center' });
doc.text(`Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, { align: 'center' });
doc.text(`Classification: Internal / Confidential`, { align: 'center' });
doc.moveDown(1);
doc.text(`https://adiology.io`, { align: 'center', link: 'https://adiology.io' });

// ========== TABLE OF CONTENTS ==========
doc.addPage();
heading1('Table of Contents');
doc.moveDown(0.5);
const tocItems = [
  '1. Executive Summary',
  '2. System Architecture Overview',
  '3. Technology Stack',
  '4. Frontend Architecture',
  '5. Backend Architecture',
  '6. Database Schema',
  '7. API Endpoints',
  '8. Authentication & Authorization',
  '9. Feature Modules',
  '10. Third-Party Integrations',
  '11. Security Architecture',
  '12. Deployment & Infrastructure',
];
tocItems.forEach(item => {
  doc.fontSize(11).fillColor(colors.text).font('Helvetica').text(item, { lineGap: 8 });
});

// ========== 1. EXECUTIVE SUMMARY ==========
doc.addPage();
heading1('1. Executive Summary');
body('Adiology is a comprehensive Google Ads campaign intelligence platform designed to automate and streamline the creation, management, and optimization of search advertising campaigns. The platform provides end-to-end campaign management from keyword research through ad generation, CSV export in Google Ads Editor format, and direct push to Google Ads via OAuth integration.');
doc.moveDown(0.5);
body('The platform serves digital marketing professionals, agencies, and businesses seeking to maximize their search advertising efficiency through AI-powered automation, competitive intelligence, and click fraud protection.');
doc.moveDown(0.5);

heading2('Core Value Propositions');
bullet('Automated campaign structure generation (SKAG, STAG, Intent-Based, Alpha-Beta)');
bullet('AI-powered keyword generation and ad copy creation');
bullet('Direct Google Ads integration via OAuth for campaign push/update');
bullet('Click fraud protection with IP blocking and Google Ads exclusion sync');
bullet('Competitive intelligence through ad transparency research');
bullet('Domain monitoring with SSL, DNS, and WHOIS tracking');
bullet('Anonymous proxy email for competitive research');

// ========== 2. SYSTEM ARCHITECTURE ==========
doc.addPage();
heading1('2. System Architecture Overview');
body('Adiology follows a monolithic full-stack architecture with clear separation of concerns between the frontend React application and the backend Hono API server. Both are deployed together but serve distinct responsibilities.');
doc.moveDown(0.5);

heading2('High-Level Architecture');
body('The system is structured as follows:');
doc.moveDown(0.3);
bullet('Client Layer: React SPA served via Vite dev server (port 5000)');
bullet('API Layer: Hono (Node.js/TypeScript) backend server (port 3001)');
bullet('Data Layer: PostgreSQL (Neon-backed) with Drizzle ORM');
bullet('Auth Layer: Clerk authentication with JWT tokens');
bullet('Payment Layer: Stripe subscriptions with webhook handlers');
bullet('AI Layer: OpenAI GPT integration for content generation');
bullet('Email Layer: Resend API for transactional and marketing emails');

heading2('Request Flow');
body('1. User interacts with the React frontend');
body('2. Frontend sends API requests with Clerk JWT tokens');
body('3. Vite dev server proxies /api/* requests to Hono backend on port 3001');
body('4. Hono middleware validates JWT, extracts userId');
body('5. Route handler processes business logic with Drizzle ORM');
body('6. Response returns through the proxy chain to the client');

// ========== 3. TECHNOLOGY STACK ==========
doc.addPage();
heading1('3. Technology Stack');

heading2('Frontend');
tableRow('Framework', 'React 18 with TypeScript');
tableRow('Build Tool', 'Vite 6.x');
tableRow('UI Library', 'Radix UI + Tailwind CSS');
tableRow('State Management', 'React Context + Hooks');
tableRow('Routing', 'Wouter (lightweight router)');
tableRow('Animation', 'Framer Motion');
tableRow('Charts', 'Recharts');
tableRow('Icons', 'Lucide React');
tableRow('HTTP Client', 'Native fetch API');
tableRow('Form Validation', 'Zod schemas');

separator();

heading2('Backend');
tableRow('Runtime', 'Node.js with TypeScript (tsx)');
tableRow('Web Framework', 'Hono');
tableRow('Database ORM', 'Drizzle ORM');
tableRow('Validation', 'Zod + drizzle-zod');
tableRow('Auth', 'Clerk JWT verification');
tableRow('API Format', 'RESTful JSON APIs');

separator();

heading2('Database & Infrastructure');
tableRow('Database', 'PostgreSQL (Neon-backed via Replit)');
tableRow('Hosting', 'Replit (development) / Custom domain');
tableRow('CDN/Proxy', 'Vite dev server proxy');
tableRow('SSL', 'Managed via Replit/Cloudflare');

separator();

heading2('Third-Party Services');
tableRow('Authentication', 'Clerk');
tableRow('Payments', 'Stripe');
tableRow('AI/NLP', 'OpenAI GPT-4');
tableRow('Email', 'Resend');
tableRow('Analytics', 'Google Analytics (gtag.js)');
tableRow('Ads Platform', 'Google Ads API v18');
tableRow('Temp Email', 'temp-mail.io API');

// ========== 4. FRONTEND ARCHITECTURE ==========
doc.addPage();
heading1('4. Frontend Architecture');

heading2('Directory Structure');
doc.font('Courier').fontSize(9).fillColor(colors.text);
doc.text(`src/
  App.tsx                    # Main app with routing
  main.tsx                   # Entry point
  components/                # Feature components (~95 files)
    ui/                      # Shared UI primitives (Radix)
    admin/                   # Admin panel components
    ai-chat/                 # AI assistant chat
    feature-pages/           # Marketing feature pages
    onboarding/              # User onboarding flow
  contexts/                  # React contexts (Auth, Theme)
  hooks/                     # Custom React hooks
  utils/                     # Utility functions & API helpers
  modules/                   # Feature modules (community)
  schemas/                   # Zod validation schemas
  styles/                    # Global CSS styles`);
doc.font('Helvetica');
doc.moveDown(0.5);

heading2('Key Frontend Components');
heading3('Campaign Builder (CampaignBuilder3.tsx)');
body('A 7-step wizard for building Google Ads campaigns: URL Analysis -> Structure Selection -> Keyword Generation -> Ad Generation -> Geo Targeting -> Preview -> CSV Export/Push.');

heading3('Click Guard (ClickGuard.tsx)');
body('Click fraud protection dashboard with tabs for: Domain Management, Live Traffic Monitor, Analytics Dashboard, Protection Rules, and Blocked IPs with Google Ads IP exclusion sync.');

heading3('Google Ads Push (GoogleAdsPushButton.tsx)');
body('OAuth-based Google Ads integration for pushing/updating campaigns directly. Supports auto-detection of accounts with manual Customer ID fallback.');

checkPageBreak(150);
heading3('Domain Monitoring (DomainMonitoring.tsx)');
body('Tracks domain expiry, SSL certificates, and DNS records with email alert configuration.');

heading3('Proxy Mail (TempMail.tsx)');
body('Anonymous disposable email generation for competitive intelligence research.');

heading3('Keyword Tools');
body('Suite of keyword tools: Keyword Planner, Long Tail Generator, Negative Keywords Builder, Keyword Mixer, and Saved Lists management.');

heading3('Super Admin Panel (SuperAdminPanel.tsx)');
body('Comprehensive admin console for user management, subscription management, system logs, email marketing automation, database administration, and security configuration.');

// ========== 5. BACKEND ARCHITECTURE ==========
doc.addPage();
heading1('5. Backend Architecture');

heading2('Server Configuration');
body('The backend runs as a Hono application on Node.js, using tsx for TypeScript execution. It serves API routes and includes CORS configuration, error handling, and request logging.');
doc.moveDown(0.3);

heading2('Route Modules');
doc.moveDown(0.3);

const routes = [
  ['Account (/api/account)', 'User profile management, settings, preferences'],
  ['Admin (/api/admin)', 'Admin-only operations, user management, system config'],
  ['Super Admin (/api/superadmin)', 'Super admin operations, database CRUD, email automation'],
  ['Click Guard (/api/clickguard)', 'Domain tracking, visitor logging, IP blocking, fraud detection'],
  ['Google Ads (/api/google-ads)', 'OAuth flow, campaign push/update, IP exclusion sync'],
  ['Stripe (/api/stripe)', 'Subscription management, webhook handlers, payment processing'],
  ['Community (/api/community)', 'Discourse SSO integration, forum topics and categories'],
  ['Domains (/api/domains)', 'Domain monitoring, WHOIS/SSL/DNS checking, alerts'],
  ['Tasks (/api/tasks)', 'Task management CRUD, project organization'],
  ['Organizations (/api/organizations)', 'Multi-tenant organization management'],
  ['Invites (/api/invites)', 'Organization invite system with codes'],
  ['Seats (/api/organization)', 'Seat-based billing and member management'],
  ['Temp Mail (/api/tempmail)', 'Disposable email proxy via temp-mail.io'],
  ['User (/api/user)', 'User sync, profile management'],
  ['Promo (/api/promo)', 'Promotional trial management'],
  ['Tickets (/api/tickets)', 'Support ticket CRUD with admin replies (not yet registered)'],
];

routes.forEach(([name, desc]) => {
  checkPageBreak(30);
  doc.fontSize(10).fillColor(colors.dark).font('Helvetica-Bold').text(name);
  doc.fontSize(9).fillColor(colors.muted).font('Helvetica').text(desc);
  doc.moveDown(0.3);
});

heading2('Middleware Stack');
bullet('CORS: Allow all origins with credential support');
bullet('Logger: Request/response logging via Hono logger');
bullet('Auth: JWT verification via Clerk tokens (per-route)');
bullet('Admin Auth: Separate admin token middleware for admin routes');
bullet('Error Handler: Global error boundary returning JSON errors');

// ========== 6. DATABASE SCHEMA ==========
doc.addPage();
heading1('6. Database Schema');
body('The database uses PostgreSQL (Neon-backed) managed through Drizzle ORM. All tables use UUID primary keys (except tasks/task_projects which use serial) and include indexing for performance.');
doc.moveDown(0.5);

heading2('Core Tables');

const tables: [string, string, string[]][] = [
  ['users', 'User accounts and profiles', [
    'id (text PK), email, fullName, avatarUrl, role, subscriptionPlan',
    'subscriptionStatus, stripeCustomerId, stripeSubscriptionId, aiUsage',
    'isBlocked, lastSignIn, passwordHash, emailVerified, cardValidated, selectedPlan',
  ]],
  ['subscriptions', 'Stripe subscription tracking', [
    'id (uuid PK), userId, stripeCustomerId, stripeSubscriptionId, stripePriceId',
    'planName, status, currentPeriodStart/End, cancelAtPeriodEnd, trialStart/End',
  ]],
  ['payments', 'Payment history and receipts', [
    'id (uuid PK), userId, subscriptionId, stripePaymentIntentId, stripeInvoiceId',
    'amountCents, currency, status, paymentMethodType, description, receiptUrl',
  ]],
  ['campaign_history', 'Saved campaign builds', [
    'id (uuid PK), userId, workspaceId, type, name, data (JSONB), status',
    'googleAdsId, googleAdsPushStatus, googleAdsPushedAt',
  ]],
  ['workspaces', 'Workspace/multi-tenant containers', [
    'id (uuid PK), name, slug, ownerId, isAdminWorkspace, settings (JSONB)',
  ]],
  ['workspace_members', 'Workspace membership', [
    'id (uuid PK), workspaceId, userId, role, status',
  ]],
];

tables.forEach(([name, desc, columns]) => {
  checkPageBreak(80);
  heading3(name);
  doc.fontSize(9).fillColor(colors.muted).font('Helvetica').text(desc);
  columns.forEach(col => {
    doc.fontSize(8.5).fillColor(colors.text).font('Courier').text(`  ${col}`, { lineGap: 1 });
  });
  doc.moveDown(0.3);
});

checkPageBreak(200);
heading2('Click Guard Tables');

const cgTables: [string, string, string[]][] = [
  ['click_guard_domains', 'Tracked domains for click protection', [
    'id (uuid PK), userId, domain, siteId (unique), verified, settings (JSONB)',
  ]],
  ['click_guard_visitors', 'Visitor tracking logs', [
    'id (uuid PK), siteId, ipAddress, userAgent, fingerprint, country, city',
    'deviceType, browser, os, isProxy, isVpn, isBot, isTor, botScore, threatLevel',
    'clickCount, mouseMovements, timeOnPage, blocked',
  ]],
  ['click_guard_blocked_ips', 'Blocked IP addresses', [
    'id (uuid PK), siteId, ipAddress, reason, autoBlocked, expiresAt',
  ]],
  ['click_guard_fraud_events', 'Detected fraud events', [
    'id (uuid PK), siteId, visitorId, eventType, severity, ipAddress, details (JSONB)',
  ]],
  ['click_guard_ip_push_log', 'Google Ads IP exclusion push history', [
    'id (uuid PK), siteId, userId, googleAdsCustomerId, campaignIds (JSONB)',
    'ipsCount, ipsPushed (JSONB), status, errorMessage, pushedAt',
  ]],
];

cgTables.forEach(([name, desc, columns]) => {
  checkPageBreak(60);
  heading3(name);
  doc.fontSize(9).fillColor(colors.muted).font('Helvetica').text(desc);
  columns.forEach(col => {
    doc.fontSize(8.5).fillColor(colors.text).font('Courier').text(`  ${col}`, { lineGap: 1 });
  });
  doc.moveDown(0.3);
});

doc.addPage();
heading2('Domain Monitoring Tables');

const domTables: [string, string, string[]][] = [
  ['monitored_domains', 'Tracked domains for monitoring', [
    'id (uuid PK), userId, domain, registrar, expiryDate, nameServers (JSONB)',
    'sslIssuer, sslExpiryDate, sslData (JSONB), dnsRecords (JSONB)',
    'alertDays (JSONB), alertsEnabled, alertEmail, status',
  ]],
  ['domain_snapshots', 'Point-in-time domain snapshots', [
    'id (uuid PK), domainId (FK), snapshotType, data (JSONB), changes (JSONB)',
  ]],
  ['domain_alerts', 'Domain alert history', [
    'id (uuid PK), domainId (FK), alertType, message, daysUntilExpiry, sentAt, acknowledged',
  ]],
];

domTables.forEach(([name, desc, columns]) => {
  checkPageBreak(60);
  heading3(name);
  doc.fontSize(9).fillColor(colors.muted).font('Helvetica').text(desc);
  columns.forEach(col => {
    doc.fontSize(8.5).fillColor(colors.text).font('Courier').text(`  ${col}`, { lineGap: 1 });
  });
  doc.moveDown(0.3);
});

heading2('Other Tables');
const otherTables: [string, string][] = [
  ['emails', 'Transactional email tracking with delivery/open/click status'],
  ['email_logs', 'Email sequence and marketing email logs'],
  ['email_sequence_progress', 'Email automation sequence tracking per user'],
  ['audit_logs', 'System audit trail with action/resource/IP tracking'],
  ['security_rules', 'IP blocking, rate limiting rules'],
  ['templates', 'Website/landing page templates'],
  ['saved_sites', 'User-saved website builds'],
  ['published_websites', 'Vercel-deployed website records'],
  ['feedback', 'User feedback and ratings'],
  ['forms / form_submissions', 'Custom form builder and submission storage'],
  ['task_projects / tasks', 'Task management with projects and priorities'],
  ['organizations / org_members / org_invites', 'Multi-tenant organization system'],
  ['workspace_projects / project_items', 'Workspace project organization'],
  ['conversations / messages', 'AI chat conversation history'],
  ['user_notifications', 'In-app notification system'],
  ['ad_search_requests', 'Google Ads transparency search history'],
  ['promo_trials', 'Promotional trial tracking'],
  ['support_tickets', 'Customer support ticket system'],
  ['google_ads_tokens', 'Google Ads OAuth token storage'],
  ['kv_store', 'General key-value storage'],
  ['invoices', 'Invoice tracking with Stripe integration'],
  ['documentation_images', 'Help center documentation images'],
];

otherTables.forEach(([name, desc]) => {
  checkPageBreak(20);
  doc.fontSize(9).fillColor(colors.dark).font('Helvetica-Bold').text(name, { continued: true });
  doc.font('Helvetica').fillColor(colors.muted).text(` - ${desc}`);
  doc.moveDown(0.15);
});

// ========== 7. API ENDPOINTS ==========
doc.addPage();
heading1('7. API Endpoints');

heading2('Authentication & Account');
const authEndpoints = [
  'GET  /api/account/me - Get current user profile',
  'POST /api/user/sync - Sync user from Clerk to database',
  'GET  /api/google-ads/auth/url - Get Google Ads OAuth URL',
  'GET  /api/google-ads/auth/callback - OAuth callback handler',
  'GET  /api/google-ads/auth/status - Check Google Ads connection status',
  'GET  /api/google-ads/auth/accounts - List accessible Google Ads accounts',
  'POST /api/google-ads/auth/disconnect - Disconnect Google Ads',
];
authEndpoints.forEach(e => { checkPageBreak(15); doc.fontSize(8.5).fillColor(colors.text).font('Courier').text(e); });

heading2('Campaign Management');
const campaignEndpoints = [
  'GET  /api/campaign-history - List user campaign history',
  'POST /api/campaign-history - Save campaign to history',
  'POST /api/google-ads/push - Push campaign to Google Ads',
  'POST /api/google-ads/update - Update existing Google Ads campaign',
  'GET  /api/google-ads/campaigns - List Google Ads campaigns',
  'POST /api/analyze-url - Analyze URL for campaign building',
];
campaignEndpoints.forEach(e => { checkPageBreak(15); doc.fontSize(8.5).fillColor(colors.text).font('Courier').text(e); });

heading2('Click Guard');
const cgEndpoints = [
  'POST /api/clickguard/domains - Register domain for tracking',
  'GET  /api/clickguard/domains/:userId - List tracked domains',
  'GET  /api/clickguard/stats/:siteId - Get site analytics stats',
  'GET  /api/clickguard/visitors/:siteId - List visitor logs',
  'POST /api/clickguard/track - Record visitor event',
  'GET  /api/clickguard/blocked-ips/:siteId - List blocked IPs',
  'POST /api/clickguard/block-ip - Block an IP address',
  'DELETE /api/clickguard/unblock-ip/:id - Unblock an IP',
  'GET  /api/clickguard/export-blocked-ips/:siteId - Export IPs as CSV',
  'POST /api/clickguard/push-ip-exclusions - Push IPs to Google Ads',
];
cgEndpoints.forEach(e => { checkPageBreak(15); doc.fontSize(8.5).fillColor(colors.text).font('Courier').text(e); });

heading2('Stripe & Billing');
const stripeEndpoints = [
  'POST /api/stripe/create-checkout - Create Stripe checkout session',
  'POST /api/stripe/webhook - Stripe webhook handler',
  'GET  /api/stripe/subscription/:userId - Get subscription details',
  'POST /api/stripe/cancel - Cancel subscription',
  'POST /api/stripe/create-portal-session - Stripe billing portal',
];
stripeEndpoints.forEach(e => { checkPageBreak(15); doc.fontSize(8.5).fillColor(colors.text).font('Courier').text(e); });

heading2('Domain Monitoring');
const domEndpoints = [
  'GET  /api/domains/:userId - List monitored domains',
  'POST /api/domains - Add domain to monitoring',
  'PUT  /api/domains/:id - Update domain settings',
  'DELETE /api/domains/:id - Remove domain from monitoring',
  'POST /api/domains/:id/check - Trigger domain check',
];
domEndpoints.forEach(e => { checkPageBreak(15); doc.fontSize(8.5).fillColor(colors.text).font('Courier').text(e); });

checkPageBreak(150);
heading2('Other Endpoints');
const otherEndpoints = [
  'GET/POST /api/tempmail/* - Proxy email operations',
  'GET/POST /api/tasks/* - Task management CRUD',
  'GET/POST /api/organizations/* - Organization management',
  'GET/POST /api/invites/* - Invite system',
  'GET/POST /api/community/* - Discourse SSO & forum proxy',
  'GET/POST /api/admin/* - Admin operations',
  'GET/POST /api/superadmin/* - Super admin operations',
  'GET/POST /api/promo/* - Promo trial management',
  'GET  /api/health - Health check',
  'GET  /api/notifications/:userId - User notifications',
];
otherEndpoints.forEach(e => { checkPageBreak(15); doc.fontSize(8.5).fillColor(colors.text).font('Courier').text(e); });

// ========== 8. AUTH & AUTHORIZATION ==========
doc.addPage();
heading1('8. Authentication & Authorization');

heading2('Authentication Flow');
body('Adiology uses Clerk as the primary authentication provider. The flow works as follows:');
doc.moveDown(0.3);
bullet('User signs up/logs in via Clerk (email/password or social login)');
bullet('Clerk issues a JWT token stored in the browser session');
bullet('Frontend includes the JWT as Bearer token in API requests');
bullet('Backend verifies JWT using Clerk\'s public key');
bullet('User ID is extracted from the verified token for authorization');
doc.moveDown(0.3);
body('For Google Ads integration, a separate OAuth 2.0 flow connects users\' Google Ads accounts. OAuth tokens (access + refresh) are stored in the google_ads_tokens table and automatically refreshed when expired.');

heading2('Authorization Levels');
doc.moveDown(0.3);
tableRow('Role: user', 'Default role. Access to all user-facing features based on subscription plan.');
tableRow('Role: admin', 'Access to admin panel, user management, and system configuration.');
tableRow('Role: superadmin', 'Full access including database administration, email automation, and security rules.');
doc.moveDown(0.3);

heading2('Subscription Tiers');
tableRow('Free', 'Limited campaign builds, basic features');
tableRow('Starter', 'Extended limits, keyword tools, domain monitoring');
tableRow('Professional', 'Full access, Click Guard, Google Ads push, priority support');
tableRow('Agency', 'Multi-user, organization management, seats, white-label options');

heading2('Security Measures');
bullet('JWT token verification on all authenticated endpoints');
bullet('CORS configured with credential support');
bullet('Admin routes protected by separate admin auth middleware');
bullet('IP-based security rules for blocking suspicious activity');
bullet('Rate limiting via security rules table');
bullet('Content Security Policy headers');
bullet('Stripe webhook signature verification');

// ========== 9. FEATURE MODULES ==========
doc.addPage();
heading1('9. Feature Modules');

heading2('9.1 Campaign Builder');
body('The flagship feature - a 7-step wizard that guides users through creating a complete Google Ads campaign:');
doc.moveDown(0.3);
bullet('Step 1: URL Input & AI Analysis - Analyzes target website using Cheerio scraper');
bullet('Step 2: Campaign Structure - Choose SKAG, STAG, Intent-Based, or Alpha-Beta');
bullet('Step 3: Keyword Generation - AI-powered keyword suggestions with match types');
bullet('Step 4: Ad Generation - RSA ads with headlines/descriptions following Google policies');
bullet('Step 5: Geo Targeting - Country, state, city, and ZIP code targeting');
bullet('Step 6: Preview - Campaign review with ad preview');
bullet('Step 7: Export - CSV download (Google Ads Editor format) or direct Push to Google Ads');

heading2('9.2 Click Guard');
body('Click fraud protection system providing:');
doc.moveDown(0.3);
bullet('Lightweight JavaScript tracking script for websites');
bullet('Bot detection engine with fingerprinting');
bullet('Live traffic monitor showing real-time visitors');
bullet('Analytics dashboard with charts and threat analysis');
bullet('Automatic and manual IP blocking');
bullet('Google Ads IP exclusion sync - push blocked IPs as campaign exclusions');
bullet('CSV export of blocked IP lists');

checkPageBreak(200);
heading2('9.3 Domain Monitoring');
body('Comprehensive domain health tracking:');
doc.moveDown(0.3);
bullet('WHOIS data monitoring with registrar and expiry tracking');
bullet('SSL certificate monitoring with validity and issuer info');
bullet('DNS record tracking (A, AAAA, MX, TXT, CNAME, NS)');
bullet('Configurable email alerts at 30, 15, 7, and 1 day before expiry');
bullet('Point-in-time snapshots for change tracking');

heading2('9.4 Proxy Mail');
body('Anonymous email system for competitive research:');
doc.moveDown(0.3);
bullet('Generate disposable email addresses instantly');
bullet('Subscribe to competitor newsletters anonymously');
bullet('Live inbox with message viewing');
bullet('Auto-expiry for privacy protection');
bullet('Email history tracking');

heading2('9.5 Keyword Intelligence');
body('Suite of keyword research tools:');
doc.moveDown(0.3);
bullet('Keyword Planner - AI-powered keyword suggestions');
bullet('Long Tail Keywords - Extended keyword variations');
bullet('Negative Keywords Builder - Identify irrelevant keywords');
bullet('Keyword Mixer - Combine keyword components');
bullet('Saved Lists - Organize and manage keyword collections');

checkPageBreak(150);
heading2('9.6 Task Manager');
body('Built-in project and task management:');
doc.moveDown(0.3);
bullet('Project-based organization with color coding');
bullet('Task priorities (low, medium, high)');
bullet('Due dates and completion tracking');
bullet('Today view for focused task management');

heading2('9.7 AI Blog Generator');
body('AI-powered content creation tool for generating long-form blog posts with configurable parameters for topic, length, tone, and SEO optimization.');

heading2('9.8 Campaign Presets');
body('Pre-built campaign templates for common industries and use cases, allowing users to start with proven structures and customize from there.');

// ========== 10. THIRD-PARTY INTEGRATIONS ==========
doc.addPage();
heading1('10. Third-Party Integrations');

heading2('Clerk Authentication');
body('Handles all user authentication including email/password, social login (Google, GitHub), email verification, and session management. Integration via Clerk publishable key on frontend and JWT verification on backend.');

heading2('Stripe Payments');
body('Complete payment infrastructure:');
bullet('Three subscription tiers (Starter, Professional, Agency)');
bullet('7-day free trial support');
bullet('Stripe Checkout for secure payment processing');
bullet('Webhook handlers for subscription lifecycle events');
bullet('Customer portal for self-service billing management');
bullet('Invoice generation and receipt tracking');

heading2('Google Ads API v18');
body('Direct Google Ads integration:');
bullet('OAuth 2.0 authorization flow with token management');
bullet('Auto-detection of accessible customer accounts');
bullet('Manual Customer ID fallback for test mode compatibility');
bullet('Campaign creation with ad groups, keywords, and ads');
bullet('Campaign update support for existing campaigns');
bullet('Geo-targeting with location criteria');
bullet('IP exclusion management for click fraud protection');
bullet('Campaign listing via searchStream API');

checkPageBreak(150);
heading2('OpenAI');
body('AI integration for intelligent content generation:');
bullet('URL analysis for marketing insights');
bullet('Keyword generation and expansion');
bullet('Ad copy writing following Google Ads policies');
bullet('Blog content generation');
bullet('AI chat assistant for campaign optimization advice');

heading2('Resend');
body('Email delivery service for:');
bullet('Transactional emails (welcome, verification, receipts)');
bullet('Email marketing sequences with automation');
bullet('Open/click/bounce tracking');
bullet('Template-based email rendering');

heading2('Google Analytics');
body('Client-side analytics via gtag.js for tracking user behavior, page views, and conversion events.');

heading2('Discourse Community');
body('Forum integration via SSO for community discussions, knowledge sharing, and support.');

// ========== 11. SECURITY ==========
doc.addPage();
heading1('11. Security Architecture');

heading2('Application Security');
bullet('JWT-based authentication with Clerk token verification');
bullet('Role-based access control (user, admin, superadmin)');
bullet('API key authentication for admin endpoints');
bullet('CORS configuration with credential support');
bullet('Content Security Policy headers');
bullet('Input validation via Zod schemas');
bullet('SQL injection prevention via Drizzle ORM parameterized queries');

heading2('Payment Security');
bullet('PCI-DSS compliance via Stripe Checkout (no card data on server)');
bullet('Stripe webhook signature verification');
bullet('Server-side subscription status verification');

heading2('Data Protection');
bullet('Google Ads OAuth tokens encrypted at rest in database');
bullet('Environment variables for all secrets and API keys');
bullet('No secrets exposed in client-side code');
bullet('Audit logging for administrative actions');
bullet('IP-based security rules for threat mitigation');

heading2('Click Fraud Protection');
bullet('Bot detection via behavioral analysis (mouse movements, timing)');
bullet('Device fingerprinting for visitor identification');
bullet('VPN/Proxy/Tor detection flags');
bullet('Automated IP blocking based on threat score');
bullet('Google Ads IP exclusion sync for active protection');

// ========== 12. DEPLOYMENT ==========
heading1('12. Deployment & Infrastructure');

heading2('Development Environment');
bullet('Replit-based development with NixOS environment');
bullet('Frontend: Vite dev server on port 5000 with HMR');
bullet('Backend: Hono server on port 3001 via tsx');
bullet('Database: Replit PostgreSQL (Neon-backed)');
bullet('Hot reload for both frontend and backend changes');

heading2('Production Configuration');
bullet('Frontend: Vite production build to /build directory');
bullet('Backend: Hono serving static files + API routes');
bullet('Custom domain: adiology.io');
bullet('SSL: Managed via hosting platform');
bullet('Database: Production PostgreSQL with connection pooling');

heading2('Environment Variables');
const envVars = [
  'DATABASE_URL - PostgreSQL connection string',
  'CLERK_PUBLISHABLE_KEY / CLERK_SECRET_KEY - Authentication',
  'STRIPE_SECRET_KEY / STRIPE_WEBHOOK_SECRET - Payments',
  'GOOGLE_ADS_CLIENT_ID / CLIENT_SECRET / DEVELOPER_TOKEN - Google Ads',
  'OPENAI_API_KEY - AI features',
  'RESEND_API_KEY - Email delivery',
  'TEMP_MAIL_API_KEY - Proxy email service',
  'GOOGLE_ANALYTICS_ID - Analytics tracking',
];
envVars.forEach(v => { checkPageBreak(15); bullet(v); });

// ========== FOOTER ON ALL PAGES ==========
const totalPages = doc.bufferedPageRange();
for (let i = 0; i < totalPages.count; i++) {
  doc.switchToPage(i);
  doc.fontSize(8).fillColor(colors.muted).font('Helvetica');
  doc.text(
    `Adiology Design Document  |  Page ${i + 1} of ${totalPages.count}  |  Confidential`,
    50, 770, { align: 'center', width: 495 }
  );
}

doc.end();

stream.on('finish', () => {
  console.log(`PDF generated successfully: ${outputPath}`);
  console.log(`File size: ${(fs.statSync(outputPath).size / 1024).toFixed(1)} KB`);
});
