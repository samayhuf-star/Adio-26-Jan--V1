# Overview

Adiology is a Google Ads campaign builder platform designed to automate and streamline the creation of comprehensive advertising campaigns. It generates keywords, ads, and targeting configurations, supporting campaign structure creation, keyword planning, ad generation, CSV validation, and export in Google Ads Editor format. The platform aims to simplify Google Ads campaign management, offering features like real-time expense tracking to enhance efficiency and unlock market potential for various business needs.

# User Preferences

Preferred communication style: Simple, everyday language.
- **Master Rule**: Never generate single-word keywords. Keywords must always be a minimum of 2 words. This applies to all modules and generation logic.

# System Architecture

## Frontend
- **Framework & UI/UX**: React 18 with TypeScript and Vite, Radix UI, and Tailwind CSS for a component-based, mobile-responsive design. Features include multi-step wizards, a SuperAdmin Console, Real-time Expense Tracking, and collapsible sidebar navigation.
- **Campaign Management**: Includes a 7-step Campaign Builder with AI analysis for URL input, various structure selections (SKAG, STAG, Intent-Based, Alpha-Beta), keyword generation, ad generation, geo-targeting, and CSV generation. Saved Campaigns display history and integrate with Google Ads via MCC-based push (REST API v18) using the platform's MCC account.
- **Content & Tools**: Ads Search uses a Playwright-based scraper for competitor research. An AI Blog Generator creates long-form content. A Task Manager provides full CRUD operations for projects and tasks with Kanban views. A Blog Section (`/blog`) serves 25 professional Google Ads articles with category filtering, search, and SEO meta tags.
- **Monitoring & Utility**: Community Integration via Discourse. Domain Monitoring tracks domain expiry, SSL certificates, and DNS records with email alerts. Proxy Mail offers anonymous email generation.
- **Click Guard**: Provides click fraud protection with a lightweight tracking script, bot detection engine, live traffic monitor, analytics dashboard, and IP blocking capabilities. It supports multiple detection methods and enforces protection rules like VPN/Proxy/Tor blocking, repetitive click detection, AI fraud detection, IP whitelist/blacklist, and IP cluster blocking.

## SEO & Routing
- **Path-Based Routing**: All public pages use clean path URLs for proper Google indexing. Routes are handled in `App.tsx`.
- **Public Feature Pages**: Dedicated landing pages at `/features/*` for various functionalities.
- **SEO Meta Tags**: `react-helmet-async` provides per-page title, description, canonical URL, OpenGraph, and Twitter Card meta tags. JSON-LD structured data is used on key pages.
- **Sitemap & Robots**: `public/sitemap.xml` lists crawlable URLs, and `public/robots.txt` manages indexing.
- **SEO Directory Guide**: SuperAdmin panel includes an "SEO & Directories" tab with directory submission links, SEO checklist, and progress tracking.
- **Internal Navigation**: Dashboard pages use custom event-based navigation, intentionally not indexed.

## Site Analytics
- **Built-in Analytics**: Self-hosted page view tracking stored in the `page_views` table, replacing external solutions.
- **Tracking**: Lightweight client-side tracker using `navigator.sendBeacon` for non-blocking page view collection, tracking various user and device data.
- **Dashboard**: Native analytics dashboard in SuperAdmin with traffic trend charts, top pages, referrers, and device breakdowns.
- **API**: `POST /api/analytics/track` for data collection and `GET /api/analytics/stats` for dashboard data.

## Backend
- **Core API**: Hono (Node.js/TypeScript) for primary API endpoints, with optional FastAPI (Python) for legacy ad generation.
- **Intelligence**: Cheerio-based URL Analyzer and OpenAI integration for marketing insights.
- **Asynchronous Processing**: Celery with Redis for background tasks.
- **Data Guardrails**: Ad generation enforces Google Search Ads policies.

## Data Storage
- **Database**: Replit PostgreSQL (Neon-backed) managed by Drizzle ORM.
- **Caching**: KV store for edge functions, localStorage for offline data, and Redis for Celery and API response caching.

## Error Monitoring (Auto-Screenshot + Email)
- **Frontend monitor**: `src/utils/errorMonitor.ts` — installs `window.onerror` and `unhandledrejection` handlers on app mount. On any uncaught error, captures a screenshot of the current page using `html2canvas`, then POSTs to `POST /api/errors/report` with error details, stack trace, screenshot (base64 JPEG), user info, and page URL.
- **React Error Boundary**: `src/components/ErrorBoundary.tsx` — wraps the app component tree. On a React render crash, calls `reportError()` with component stack and triggers the email alert. Shows a user-friendly fallback UI (dark theme, Reload + Go Home buttons).
- **Backend route**: `server/routes/errors.ts` — receives the error report, deduplicates (same error within 2 min = skip), rate-limits (max 5 per 5 min), and sends a rich HTML email to `adiologyads@gmail.com` via Resend. Email includes severity badge, user identity, page URL, full stack trace, React component stack, and the screenshot inline.
- **Noise filtering**: Vite HMR, WebSocket, ResizeObserver, network/fetch errors, and analytics errors are silently ignored — only real app errors trigger alerts.

## Authentication & Authorization
- **Authentication**: Custom JWT-based authentication.
- **Authorization**: Role-based access control (users, paid users, super admins).

## Payment & Signup Flow
- **Stripe Checkout Integration**: Unified signup page, handles registration, Stripe customer creation, and checkout session management. Supports lifetime, monthly, and annual plans.
- **Webhook Processing**: Stripe webhooks manage subscription statuses (completed, payment succeeded/failed, deleted) and email verification.
- **Access Control**: User access is dynamically managed based on `subscription_status` (e.g., `cancelled`, `pending_payment`, `past_due`, `active`).

## Super Admin Panel
- **Access & Functionality**: Restricted access for managing users, subscriptions, database, real-time statistics, system logs, and email marketing automation.
- **Unified Users & Billing Tab**: Combines user, subscription, and payment information with a User Lifecycle Panel for chronological event timelines.
- **Operational Management**: Features for security (IP blocking, rate limiting), documentation, campaign template management, website tracking, AI usage tracking, and database administration.
- **Audit Logs**: Tracks all admin actions.
- **AI Usage Tracking**: Monitors OpenAI API usage and costs.
- **WhatsApp Reporting**: Hourly system reports sent to admin via Meta WhatsApp Cloud API.
- **Uptime Monitoring**: Automated health checks for website, API, and database, with WhatsApp status updates.
- **SuperAdmin Auth**: Token-based authentication for secure access.
- **Dashboards**: Payments Dashboard for revenue and subscription metrics, System Health for server diagnostics.
- **Promo Codes**: Full CRUD for creating and managing Stripe coupons.
- **Email Logs**: Provides a view of all system-sent emails.

# External Dependencies

## Third-Party Services
- **Stripe**: Payment processing for subscriptions and one-time payments.
- **Redis**: Message broker and caching.
- **OpenAI**: Natural language processing.
- **ResellerClub**: Email/webmail management.
- **GitHub**: Version control.
- **Vercel**: Deployment.
- **Replit**: Development platform.

## APIs & Integrations
- **Backend API (FastAPI)**: For keyword generation, ad generation, and CSV export.
- **Google Ads Editor CSV Format**: Uses the proper Google Ads Editor bulk upload format. Extensions (sitelinks, callouts, structured snippets) are exported as **separate rows** — one row per sitelink using `Link Text`/`Description Line 1`/`Description Line 2`/`Final URL` columns, one row per callout using `Callout Text`, one row per snippet using `Snippet Header`/`Snippet Values`. Each extension row has the campaign name set for association. The campaign row contains only campaign-level settings and the call extension. Sitelinks: up to 8 per campaign. Callouts: up to 10. Snippets: up to 3. If no extensions exist in state (user skipped Step 4), fallback auto-generates from campaign info via `generateCampaignAssets`.
- **AppSumo Integration**: Lifetime deal sales platform with webhook and OAuth integration for license management.