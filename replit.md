# Overview

Adiology is a Google Ads campaign builder platform designed to automate and streamline the creation of comprehensive advertising campaigns. It generates keywords, ads, and targeting configurations, supporting campaign structure creation, keyword planning, ad generation, CSV validation, and export in Google Ads Editor format. The platform aims to simplify Google Ads campaign management, offering features like real-time expense tracking to enhance efficiency and unlock market potential for various business needs.

# User Preferences

Preferred communication style: Simple, everyday language.
- **Master Rule**: Never generate single-word keywords. Keywords must always be a minimum of 2 words. This applies to all modules and generation logic.

# System Architecture

## Frontend
- **Framework & UI/UX**: React 18 with TypeScript and Vite, Radix UI, and Tailwind CSS for a component-based, mobile-responsive design. Features include multi-step wizards, a SuperAdmin Console, Real-time Expense Tracking, and collapsible sidebar navigation.
- **Campaign Management**: Includes a 7-step Campaign Builder with AI analysis for URL input, various structure selections (SKAG, STAG, Intent-Based, Alpha-Beta), keyword generation, ad generation, geo-targeting, and CSV generation. Saved Campaigns display history and integrate with Google Ads OAuth for direct campaign pushes via REST API v18.
- **Content & Tools**: Ads Search (Google Ads Transparency) uses a Playwright-based scraper for competitor research. An AI Blog Generator creates long-form content with configurable parameters. A Task Manager provides full CRUD operations for projects and tasks with Kanban views.
- **Monitoring & Utility**: Community Integration via Discourse with SSO for community forums. Domain Monitoring tracks domain expiry, SSL certificates, and DNS records with email alerts. Proxy Mail offers anonymous email generation for competitive intelligence.
- **Click Guard**: Provides click fraud protection with a lightweight tracking script (v2.0 with WordPress compatibility), bot detection engine, live traffic monitor, and analytics dashboard, including IP blocking capabilities. The tracking script (`public/t.js`) supports multiple detection methods: `document.currentScript`, `data-sid` attribute, URL query parameter, and `window._clickguard_sid` global. Debug mode available via `?clickguard_debug=1`. Installation snippets provided for HTML, WordPress Plugin (Insert Headers and Footers), and WordPress PHP (`functions.php`). Verify endpoint at `/api/clickguard/verify?sid=xxx`.

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

# External Dependencies

## Third-Party Services
- **Clerk**: Authentication provider.
- **Supabase**: PostgreSQL database and Edge Functions.
- **Stripe**: Payment processing for subscriptions with four pricing tiers (Starter, Professional, Agency, Lifetime), supporting a 7-day free trial and 14-day money-back guarantee. The Lifetime plan ($149 one-time payment) uses Stripe's `mode: 'payment'` instead of subscriptions.
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