# Overview

Adiology is a Google Ads campaign builder platform designed to automate and streamline the creation of comprehensive advertising campaigns. It generates keywords, ads, and targeting configurations, supporting campaign structure creation, keyword planning, ad generation, CSV validation, and export in Google Ads Editor format. The platform aims to simplify Google Ads campaign management, offering features like real-time expense tracking to enhance efficiency and unlock market potential for various business needs.

# User Preferences

Preferred communication style: Simple, everyday language.

# System Architecture

## Frontend
- **Framework**: React 18 with TypeScript and Vite, utilizing Radix UI and Tailwind CSS.
- **UI/UX**: Component-based architecture, multi-step wizards for Campaign and Ads Builders, client-side routing, React hooks, and context-based notification system. Features include a SuperAdmin Console and Real-time Expense Tracking. The design is mobile-responsive with collapsible sidebar navigation, responsive grids, compact navigation, and mobile-optimized data tables.
- **Ads Search (Google Ads Transparency)**: Allows users to research competitor ads from Google Ads Transparency Center using a Playwright-based scraper and an asynchronous job queue system.
- **Campaign Builder**: A 7-step wizard that guides users through URL input with AI analysis, structure selection (SKAG, STAG, Intent-Based, Alpha-Beta), keyword generation (410-710 keywords), ad generation, geo-targeting, and CSV generation.
- **Saved Campaigns**: Displays campaign history with search and filter options, including Google Ads OAuth integration for direct, paused campaign pushes to Google Ads.
- **Data Export**: Generates a master 183-column Google Ads Editor CSV format, ensuring full compatibility for various campaign, ad group, keyword, and extension data.
- **AI Blog Generator**: Generates 2000+ word blog posts with 5+ content sections, case studies, tips, image prompts, optional code snippets and statistics. Configurable content type, tone, and target audience. Includes HTML export, markdown preview, and copy-to-clipboard.
- **Task Manager**: Full task and project management system with CRUD operations for projects and tasks. Features include:
  - Projects: Create, edit, delete with 2-step confirmation dialog
  - Tasks: Create, edit, delete, mark complete, set priority and due dates
  - Views: Sidebar navigation, All Projects grid view, Kanban board
  - Visible Edit/Delete buttons on project cards and in sidebar (no hidden menus)
  - Database: task_projects (user_id varchar, name, color, order) and tasks tables
- **Community Integration**: Discourse-powered community forum with native React UI.
  - Dashboard widget showing latest 3 topics with "Ask Community" button
  - Full community page with topic cards, search, and category filtering
  - SSO auto-login via Clerk authentication (HMAC-SHA256 signature verification)
  - "Ask Community" modal for creating new discussion posts
  - Mobile-responsive design with modern card-based UI
  - API: /api/community endpoints for SSO, topics, posts, and categories
  - Requires: DISCOURSE_URL, DISCOURSE_API_KEY, DISCOURSE_SSO_SECRET environment variables
  - Setup guide: docs/discourse-setup.md

## Backend
- **Primary API**: Hono (Node.js/TypeScript) for all API endpoints, with optional FastAPI (Python) for legacy ad generation.
- **URL Analyzer**: Cheerio-based HTML parser for website analysis, extracting key information and integrating with OpenAI for marketing insights.
- **Background Processing**: Celery with Redis for asynchronous tasks like keyword generation and AI-powered keyword suggestions.
- **Ads Transparency Scraper**: Playwright-based web scraper for competitor ad data, processed by an hourly cron job.
- **Edge Functions**: Supabase Edge Functions (Deno/TypeScript) for health checks, payment processing, and campaign history storage.
- **Fallback Systems**: Python-based ad generator, local storage, and a three-tier save system.
- **Business Logic**: Automatic business type detection, intent classification, service/product-specific ad templates, and Dynamic Keyword Insertion (DKI).
- **Ad Generation Guardrails**: Enforces Google Search Ads policies for RSA, DKI, Call-Only ads, uniqueness checks (Levenshtein distance), and ad strength calculation.

## Data Storage
- **Primary Database**: Replit PostgreSQL (Neon-backed) for user data, campaign history, subscriptions, and billing. Managed via Drizzle ORM.
- **Schema**: Defined in `shared/schema.ts` with Drizzle schema definitions. Use `npm run db:push` to sync schema changes.
- **Caching**: KV store for edge functions, localStorage for offline data, and Redis for Celery.
- **Data Models**: Supports campaign structure, user profiles, and billing records.
- **Website Analysis Storage**: localStorage-based analysis service for quick reuse of URL analysis results, with backend sync.

## Authentication & Authorization
- **Authentication Provider**: Clerk with email/password, social login, and managed user sessions.
- **Frontend Integration**: ClerkProvider wraps the app, useUser/useAuth/useClerk hooks for auth state.
- **Backend Verification**: @clerk/backend.verifyToken() validates JWT tokens on API endpoints.
- **Authorization**: Role-based access (users, paid users, super admins) with API key authentication, CORS, and Content Security Policy.

## Super Admin Panel
- **Access**: Restricted to specific users via /admin path or admin.adiology.io subdomain.
- **Authentication**: Server-side middleware protects API endpoints.
- **Dashboard**: Real-time statistics including users, subscriptions, revenue, and errors.
- **Management**: User management (block, edit roles), subscription & billing management (Stripe sync), database management (browse/edit records).
- **System Logs**: View error, activity, and API logs.
- **Email Management**: Comprehensive email marketing automation with Resend API integration.
  - **Email Sequences**: 25-email marketing funnel across 5 customer journey stages:
    - Lead Nurturing (5 emails): Day 0-10 from lead magnet download
    - Onboarding (8 emails): Day 0-13 of trial period
    - Conversion (6 emails): Day 1-35 post-trial expiry
    - Churn Prevention (3 emails): Cancel events + 60 days after
    - Advocacy (3 emails): 30-365 days for loyal customers
  - **Email Flows UI**: Visual timeline interface showing all sequences with expandable sections
  - **Email Logs**: Searchable/filterable table with delivery status, opens, clicks tracking
  - **Templates**: server/email-sequence-templates.ts contains all 25 email templates with HTML content
  - **Database Tables**: email_sequence_progress (user progress), email_logs (delivery tracking)
- **Security & Firewall**: IP blocking and rate limiting configuration.
- **Documentation Manager**: Create, edit, and publish help documentation with rich text, images, and video.
- **Template Management**: Manage campaign templates, versions, and status.
- **Website Management**: Track deployed websites and domains.
- **Real-time Expenses**: Integrates with various APIs (Stripe, OpenAI, Supabase, Vercel, GitHub) to track and calculate actual usage costs from production data.
- **AI Usage Tracking**: Monitors AI token consumption per user.
- **Database Admin**: Full CRUD interface for all database tables using React-Admin.

# External Dependencies

## Third-Party Services
- **Clerk**: Authentication provider with email/password and social login support.
- **Supabase**: PostgreSQL database and Edge Functions (Note: Auth migrated to Clerk).
- **Stripe**: Payment processing for subscriptions, integrated via `stripe-replit-sync`. Three pricing tiers:
  - Starter: $29/month (5 campaigns, 1 team member, 25% early adopter discount)
  - Professional: $59/month (50 campaigns, 3 team members, 45% early adopter discount, Most Popular)
  - Agency: $129/month (unlimited campaigns/members, 65% early adopter discount)
  - Features: 7-day free trial, 14-day money-back guarantee, 20% annual discount
- **Redis**: Message broker and result backend for Celery tasks.
- **OpenAI**: Natural language processing for the web template editor chatbot and AI Blog Generator (gpt-4o-mini).
- **ResellerClub**: Email/webmail management API.
- **GitHub**: Version control and CI/CD.
- **Vercel**: Deployment platform.
- **Replit**: Development platform.

## APIs & Integrations
- **Backend API (FastAPI)**: Provides endpoints for keyword generation, ad generation, and CSV export.
- **Google Ads Editor CSV Format**: Adheres strictly to Google's schema for data export.
- **Real-time Expense Tracking**: Integrates with Stripe, OpenAI, Supabase, Vercel, SendGrid, GitHub, and Replit APIs.