# Overview

Adiology is a Google Ads campaign builder platform designed to automate and streamline the creation of comprehensive advertising campaigns. It generates keywords, ads, and targeting configurations, supporting campaign structure creation, keyword planning, ad generation, CSV validation, and export in Google Ads Editor format. The platform aims to simplify Google Ads campaign management, offering features like real-time expense tracking to enhance efficiency and unlock market potential for various business needs.

# User Preferences

Preferred communication style: Simple, everyday language.
- **Master Rule**: Never generate single-word keywords. Keywords must always be a minimum of 2 words. This applies to all modules and generation logic.

# System Architecture

## Frontend
- **Framework & UI/UX**: React 18 with TypeScript and Vite, Radix UI, and Tailwind CSS for a component-based, mobile-responsive design. Features include multi-step wizards, a SuperAdmin Console, Real-time Expense Tracking, and collapsible sidebar navigation.
- **Campaign Management**: Includes a 7-step Campaign Builder with AI analysis for URL input, various structure selections (SKAG, STAG, Intent-Based, Alpha-Beta), keyword generation, ad generation, geo-targeting, and CSV generation. Saved Campaigns display history and integrate with Google Ads OAuth for direct campaign pushes via REST API v18.
- **Content & Tools**: Ads Search (Google Ads Transparency) uses a Playwright-based scraper for competitor research. An AI Blog Generator creates long-form content with configurable parameters. A Task Manager provides full CRUD operations for projects and tasks with Kanban views. **Blog Section** (`/blog` and `/blog/:slug`) serves 25 professional Google Ads articles from the `blog_posts` database table, with category filtering, search, featured articles, related articles, SEO meta tags, and beautiful responsive design. Components: `BlogListing.tsx` and `BlogArticle.tsx`.
- **Monitoring & Utility**: Community Integration via Discourse with SSO for community forums. Domain Monitoring tracks domain expiry, SSL certificates, and DNS records with email alerts. Proxy Mail offers anonymous email generation for competitive intelligence.
- **Click Guard**: Provides click fraud protection with a lightweight tracking script (v2.0 with WordPress compatibility), bot detection engine, live traffic monitor, and analytics dashboard, including IP blocking capabilities. The tracking script (`public/t.js`) supports multiple detection methods: `document.currentScript`, `data-sid` attribute, URL query parameter, and `window._clickguard_sid` global. Debug mode available via `?clickguard_debug=1`. Installation snippets provided for HTML, WordPress Plugin (Insert Headers and Footers), and WordPress PHP (`functions.php`). Verify endpoint at `/api/clickguard/verify?sid=xxx`. The `/api/clickguard/track` endpoint enforces all user-configured protection rules: VPN/Proxy/Tor blocking (via ip-api.com geo + hosting flags), repetitive click detection (per-minute/per-hour thresholds), AI fraud detection (configurable threshold + sensitivity multiplier), IP whitelist/blacklist (CIDR support), VPN-specific click fraud limits, and IP cluster blocking (subnet-level). Protection rules stored in `clickGuardDomains.settings.protectionRules` JSON field.

## SEO & Routing
- **Path-Based Routing**: All public pages use clean path URLs (not hash fragments) for proper Google indexing. Routes handled in App.tsx with `handleRoute()` + `popstate` listener.
- **Public Feature Pages**: Dedicated landing pages at `/features/keyword-planner`, `/features/ads-search`, `/features/blog-generator`, `/features/campaign-builder`, `/features/click-guard`, `/features/domain-monitor`, `/features/instant-mail`, and `/pricing`. Located in `src/components/feature-pages/`.
- **SEO Meta Tags**: react-helmet-async provides per-page title, description, canonical URL, OpenGraph tags, and Twitter Card meta tags on all public pages. JSON-LD structured data (Organization, SoftwareApplication, Product schemas) on homepage, feature pages, and lifetime deal page.
- **Sitemap & Robots**: `public/sitemap.xml` lists 43 crawlable path URLs (including 25 blog articles, /pricing, /features/instant-mail). `public/robots.txt` allows feature pages, blog, and blocks dashboard/admin paths.
- **SEO Directory Guide**: SuperAdmin panel includes an "SEO & Directories" tab (`src/components/admin/SEODirectoryGuide.tsx`) with 35+ directory submission links, SEO checklist, and progress tracking for off-page optimization.
- **Internal Navigation**: Dashboard pages (behind auth) use custom event-based navigation (`navigateTo` events) which is intentional since they shouldn't be indexed.

## Site Analytics
- **Built-in Analytics**: Self-hosted page view tracking stored in `page_views` table. Replaces broken Google Analytics iframe embed in SuperAdmin.
- **Tracking**: Lightweight client-side tracker (`src/utils/pageTracker.ts`) using `navigator.sendBeacon` for non-blocking page view collection. Tracks path, referrer, session, screen size, browser, OS, and device type.
- **Dashboard**: Native analytics dashboard in SuperAdmin (`src/components/admin/AnalyticsDashboard.tsx`) with traffic trend chart, top pages, referrers, browser/OS/device breakdowns, and live feed. Supports 7/30/90 day filters.
- **API**: `POST /api/analytics/track` (public, for collecting views) and `GET /api/analytics/stats?days=N` (for dashboard data).

## Backend
- **Core API**: Hono (Node.js/TypeScript) for primary API endpoints, with optional FastAPI (Python) for legacy ad generation.
- **Intelligence**: Cheerio-based URL Analyzer for website analysis and OpenAI integration for marketing insights.
- **Asynchronous Processing**: Celery with Redis for background tasks like keyword generation and AI suggestions.
- **Data Guardrails**: Ad generation enforces Google Search Ads policies for RSA, DKI, Call-Only ads, uniqueness, and ad strength calculation.

## Data Storage
- **Database**: Replit PostgreSQL (Neon-backed) managed by Drizzle ORM for user data, campaign history, subscriptions, and billing.
- **Caching**: KV store for edge functions, localStorage for offline data, and Redis for Celery. API Response Cache provides TTL-based expiration, request deduplication, and stale-while-revalidate patterns.

## Authentication & Authorization
- **Authentication**: Clerk handles email/password, social login, and user sessions.
- **Authorization**: Role-based access control (users, paid users, super admins) with API key authentication, CORS, and Content Security Policy.

## Super Admin Panel
- **Access & Functionality**: Restricted access for managing users, subscriptions (Stripe sync), and the database. Includes real-time statistics, system logs, and comprehensive email marketing automation with Resend API for managing email sequences and tracking.
- **Operational Management**: Features for security (IP blocking, rate limiting), documentation management, campaign template management, website tracking, AI usage tracking, and a full CRUD interface for database administration.
- **Audit Logs**: Tracks all admin actions (user edits, blocks, deletions, subscription changes, promo code operations, login events) with timeline view, filters by action/resource/level, and expandable detail panels. Data stored in `audit_logs` table.
- **AI Usage Tracking**: Monitors OpenAI API usage with `ai_usage_logs` table tracking model, tokens (prompt/completion), cost, duration, feature, and user. Dashboard shows total/daily stats, breakdowns by model and feature, top users, and recent API calls.
- **WhatsApp Reporting**: Hourly system reports sent to admin WhatsApp (+919650000412) via Meta WhatsApp Cloud API. Reports include users, subscriptions, revenue/MRR, email stats, AI usage, and system health. Configurable via SuperAdmin panel with toggle on/off, test message, and manual report triggers. Requires `WHATSAPP_PHONE_NUMBER_ID` and `WHATSAPP_ACCESS_TOKEN` environment variables.
- **Uptime Monitoring**: Automated 15-minute health checks via `server/services/uptimeMonitor.ts`. Checks website HTTP status, API server health, and database connectivity. Reports total registered users and logged-in users (24h). Sends status updates to admin WhatsApp with green/red indicators. Starts automatically with the server via `startUptimeMonitoring()` in `server/index.ts`.
- **SuperAdmin Auth**: Token-based authentication with in-memory session store. Login via `POST /api/superadmin/login` returns a session token valid for 24 hours. Token stored in `sessionStorage` as `superadmin_token`. Token validation via `GET /api/superadmin/validate`. All superadmin CRUD endpoints protected by token-based middleware.
- **Payments Dashboard**: `GET /api/superadmin/stripe-dashboard` returns total revenue, MRR, lifetime deals, churn rate, recent transactions, and plan distribution from Stripe API and users table.
- **System Health**: `GET /api/superadmin/system-health` returns server uptime, memory usage, Node version, DB status/size/table count, active admin sessions, and server time. Auto-refreshes every 30 seconds in the frontend.
- **Promo Codes**: Full CRUD via `GET/POST /api/superadmin/promo-codes` and `POST /api/superadmin/promo-codes/:id/deactivate`. Creates Stripe coupons and promotion codes with configurable percent off, max redemptions, and duration.
- **Email Logs**: `GET /api/superadmin/email-logs` with pagination, search, and status filtering. Returns logs from `email_logs` table with stats (total, sent, failed, opened, clicked).

# External Dependencies

## Third-Party Services
- **Clerk**: Authentication provider.
- **Supabase**: PostgreSQL database and Edge Functions.
- **Stripe**: Payment processing for subscriptions with four pricing tiers (Starter, Professional, Agency, Lifetime), supporting a 7-day free trial and 14-day money-back guarantee. The Lifetime plan ($99 one-time payment) uses Stripe's `mode: 'payment'` instead of subscriptions. **Lifetime Deal Flow**: User enters email → Stripe checkout → webhook creates user with Lifetime plan (no password) → redirect to `/lifetime-deal?success=true` → success banner shows email and "Set Up Your Account" button → navigates to signup wizard with `isLifetimeDeal` flag → user sets password → `/register` detects existing passwordless user, sets password + email_verified + card_validated, returns JWT → signup wizard skips payment step → dashboard. Email stored in `sessionStorage` (`lifetime_checkout_email`) to survive Stripe redirect. Confirmation email includes "Set Up Your Account" CTA.
- **Redis**: Message broker and result backend for Celery.
- **OpenAI**: Natural language processing for AI features like the AI Blog Generator.
- **ResellerClub**: Email/webmail management API.
- **GitHub**: Version control and CI/CD.
- **Vercel**: Deployment platform.
- **Replit**: Development platform.

## APIs & Integrations
- **Backend API (FastAPI)**: Provides endpoints for keyword generation, ad generation, and CSV export.
- **Google Ads Editor CSV Format**: Strict adherence to Google's schema for data export.
- **Real-time Expense Tracking**: Integrates with Stripe, OpenAI, Supabase, Vercel, SendGrid, GitHub, and Replit APIs.
- **AppSumo Integration**: Lifetime deal sales via AppSumo marketplace. Webhook endpoint at `POST /api/appsumo/webhook` handles purchase, activate, upgrade, downgrade, and deactivate events. OAuth flow at `/api/appsumo/auth` and `/api/appsumo/callback` for license verification. Activation endpoint at `POST /api/appsumo/activate` links license to user account. Frontend redemption page at `/appsumo/redeem` (`src/components/AppSumoRedeem.tsx`). License data stored in `appsumo_licenses` table with event log tracking. Secrets: `APPSUMO_API_KEY`, `APPSUMO_CLIENT_ID`, `APPSUMO_CLIENT_SECRET`.