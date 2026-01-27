# API Endpoints Audit – Working vs Not Working

**Scope:** Main app API (`/api/*`) served by Hono (`server/index.ts`) + Community routes.  
**Excluded:** Supabase Edge Function (`make-server-6757d0ca`), Nhost, external APIs (Stripe, OpenAI, etc.).  
**Last updated:** From codebase analysis (server + frontend fetch calls).

---

## At a Glance

| Status | Count | Endpoints |
|--------|------:|-----------|
| **Working** | **39** | Health, products, checkout, portal, admin/status, user/sync, notifications, workspace-projects (list/create), dashboard, errors, google-ads (all stubs), item-projects (stubs), community (topics, categories, sso, posts). |
| **Not implemented** | **99+** | Stripe (/api/stripe/*), workspace-projects :id & items, campaigns, campaign-history, orgs/invites/seats, admin panel, AI, docs, domains, promo, tasks/projects, user profile, etc. See full table. |

---

## Summary Table

| # | Method | Endpoint | Implemented | Called by frontend | Status | Notes |
|---|--------|----------|:-----------:|:------------------:|--------|-------|
| 1 | GET | `/api/health` | ✅ | ✅ | **Working** | Returns `{ status, timestamp }` |
| 2 | GET | `/api/products` | ✅ | ❌ | **Working** | Stripe products; frontend uses `/api/stripe/products` |
| 3 | POST | `/api/checkout` | ✅ | ❌ | **Working** | Stripe checkout; frontend uses `/api/stripe/checkout` |
| 4 | POST | `/api/portal` | ✅ | ❌ | **Working** | Stripe portal; frontend uses `/api/stripe/portal` |
| 5 | GET | `/api/admin/status` | ✅ | ❌ | **Working** | Admin auth check; SuperAdmin uses other admin routes |
| 6 | POST | `/api/user/sync` | ✅ | ✅ | **Working** | Stub; returns success |
| 7 | GET | `/api/notifications/:userId` | ✅ | ✅ | **Working** | Returns `{ notifications: [] }` |
| 8 | PUT | `/api/notifications/:id/read` | ✅ | ✅ | **Working** | Stub; returns success |
| 9 | PUT | `/api/notifications/user/:userId/read-all` | ✅ | ✅ | **Working** | Stub; returns success |
| 10 | GET | `/api/workspace-projects` | ✅ | ✅ | **Working** | Stub; returns `{ data: [] }` |
| 11 | POST | `/api/workspace-projects` | ✅ | ✅ | **Working** | Stub; returns mock project |
| 12 | GET | `/api/workspace-projects/:id` | ❌ | ✅ | **Not implemented** | 404; WorkspaceProjects, ProjectMultiSelect, etc. |
| 13 | PUT | `/api/workspace-projects/:id` | ❌ | ✅ | **Not implemented** | 404; WorkspaceProjects |
| 14 | DELETE | `/api/workspace-projects/:id` | ❌ | ✅ | **Not implemented** | 404; WorkspaceProjects |
| 15 | GET | `/api/workspace-projects/:id/items` | ❌ | ✅ | **Not implemented** | 404; CampaignBuilder3, ProjectMultiSelect, etc. |
| 16 | POST | `/api/workspace-projects/:id/items` | ❌ | ✅ | **Not implemented** | 404; ProjectTagSelector, LinkProjectDialog |
| 17 | GET | `/api/workspace-projects/:id/items/:itemId` | ❌ | ✅ | **Not implemented** | 404; ProjectMultiSelect, ProjectTagSelector |
| 18 | PUT | `/api/workspace-projects/:id/items/:itemId` | ❌ | ✅ | **Not implemented** | 404; ProjectTagSelector (link/update) |
| 19 | DELETE | `/api/workspace-projects/:id/items/:itemId` | ❌ | ✅ | **Not implemented** | 404; ProjectTagSelector |
| 20 | GET | `/api/dashboard/all/:userId` | ✅ | ✅ | **Working** | Stub; returns default stats, recentCampaigns, workspaces |
| 21 | POST | `/api/errors` | ✅ | ✅ | **Working** | Logs client errors; fixed for malformed JSON (400) |
| 22 | GET | `/api/google-ads/accounts` | ✅ | ✅ | **Working** | Stub; returns `[]` |
| 23 | GET | `/api/google-ads/status` | ✅ | ✅ | **Working** | Stub; `connected: false` |
| 24 | GET | `/api/google-ads/auth-url` | ✅ | ✅ | **Working** | Stub; `url: null` |
| 25 | GET | `/api/google-ads/requests` | ✅ | ✅ | **Working** | Stub; returns `[]` |
| 26 | POST | `/api/google-ads/search-advertiser` | ✅ | ✅ | **Working** | Stub; returns `[]` |
| 27 | GET | `/api/google-ads/search/:id` | ✅ | ✅ | **Working** | Stub; returns `{ id, results: [] }` |
| 28 | POST | `/api/google-ads/fetch-ad` | ✅ | ✅ | **Working** | Stub; returns `{ ad: null }` |
| 29 | POST | `/api/google-ads/keyword-planner` | ✅ | ✅ | **Working** | Stub; `success: false`, `keywords: []` |
| 30 | POST | `/api/google-ads/keyword-metrics` | ❌ | ✅ | **Not implemented** | 404; keywordPlannerApi.ts |
| 31 | GET | `/api/item-projects/campaign/:id` | ✅ | ✅ | **Working** | Stub; `data: null` |
| 32 | GET | `/api/item-projects/keyword-list/:id` | ✅ | ✅ | **Working** | Stub; `data: null` |
| 33 | GET | `/api/item-projects/:type/:id` | ✅ | ✅ | **Working** | Stub; `data: null` |
| 34 | GET | `/api/community/topics` | ✅ | ✅ | **Working** | Mock or Discourse; useDiscourse |
| 35 | GET | `/api/community/topics/:id` | ✅ | ✅ | **Working** | Mock or Discourse |
| 36 | GET | `/api/community/categories` | ✅ | ✅ | **Working** | Mock or Discourse |
| 37 | GET | `/api/community/sso` | ✅ | ✅ | **Working** | SSO callback; query `sso`, `sig`, `user_data` |
| 38 | POST | `/api/community/sso/initiate` | ✅ | ✅ | **Working** | SSO initiate |
| 39 | POST | `/api/community/posts` | ✅ | ✅ | **Working** | Create post; mock if no Discourse |
| 40 | GET | `/api/stripe/config` | ✅ | ✅ | **Working** | Phase 1; `server/routes/stripe.ts` |
| 41 | GET | `/api/stripe/products` | ✅ | ✅ | **Working** | Phase 1; `server/routes/stripe.ts` |
| 42 | POST | `/api/stripe/checkout` | ✅ | ✅ | **Working** | Phase 1; accepts `priceId`, `email`, `userId` |
| 43 | POST | `/api/stripe/portal` | ✅ | ✅ | **Working** | Phase 1; accepts `email`, `returnUrl` |
| 44 | GET | `/api/stripe/subscription` | ✅ | ✅ | **Working** | Phase 1; Bearer token or use `/:email` |
| 45 | GET | `/api/stripe/subscription/:email` | ✅ | ✅ | **Working** | Phase 1; `server/routes/stripe.ts` |
| 46 | POST | `/api/stripe/expenses` | ❌ | ✅ | **Not implemented** | 404; expenseTracking.ts |
| 47 | GET | `/api/analyze-url` | ❌ | ✅ | **Not implemented** | 404; CampaignBuilder3, KeywordPlanner |
| 48 | POST | `/api/ai/generate-negative-keywords` | ❌ | ✅ | **Not implemented** | 404; NegativeKeywordsBuilder |
| 49 | POST | `/api/ai/generate-seed-keywords` | ❌ | ✅ | **Not implemented** | 404; CampaignBuilder3 |
| 50 | POST | `/api/ai/generate-blog` | ❌ | ✅ | **Not implemented** | 404; BlogGenerator |
| 51 | GET | `/api/long-tail-keywords/lists` | ❌ | ✅ | **Not implemented** | 404; LongTailKeywords |
| 52 | GET | `/api/long-tail-keywords/lists?userId=...` | ❌ | ✅ | **Not implemented** | 404; LongTailKeywords |
| 53 | POST | `/api/long-tail-keywords/generate` | ❌ | ✅ | **Not implemented** | 404; LongTailKeywords |
| 54 | GET | `/api/long-tail-keywords/lists/:listId` | ❌ | ✅ | **Not implemented** | 404; LongTailKeywords |
| 55 | GET | `/api/docs/all-images` | ❌ | ✅ | **Not implemented** | 404; HelpSupport |
| 56 | GET | `/api/docs/images` | ❌ | ✅ | **Not implemented** | 404; HelpSupport |
| 57 | GET | `/api/docs/images/:imageId` | ❌ | ✅ | **Not implemented** | 404; HelpSupport |
| 58 | GET | `/api/verify-domain` | ❌ | ✅ | **Not implemented** | 404; TemplateEditorBuilder |
| 59 | POST | `/api/publish-website` | ❌ | ✅ | **Not implemented** | 404; TemplateEditorBuilder |
| 60 | POST | `/api/publish-site` | ❌ | ✅ | **Not implemented** | 404; SavedSites |
| 61 | GET | `/api/organizations/my` | ❌ | ✅ | **Not implemented** | 404; Teams, authCompat |
| 62 | GET | `/api/organizations` | ❌ | ✅ | **Not implemented** | 404; Teams |
| 63 | GET | `/api/organizations/:id/members` | ❌ | ✅ | **Not implemented** | 404; Teams |
| 64 | GET | `/api/organizations/:id/invites` | ❌ | ✅ | **Not implemented** | 404; Teams |
| 65 | POST | `/api/organizations/:id/invites` | ❌ | ✅ | **Not implemented** | 404; Teams |
| 66 | DELETE | `/api/organizations/:id/members/:memberId` | ❌ | ✅ | **Not implemented** | 404; Teams |
| 67 | DELETE | `/api/organizations/:id/invites/:inviteId` | ❌ | ✅ | **Not implemented** | 404; Teams |
| 68 | PUT | `/api/organizations/:id/members/:memberId` | ❌ | ✅ | **Not implemented** | 404; Teams |
| 69 | GET | `/api/organization/:id/seats` | ❌ | ✅ | **Not implemented** | 404; useSeatManagement |
| 70 | GET | `/api/organization/:id/seats/can-add` | ❌ | ✅ | **Not implemented** | 404; useSeatManagement |
| 71 | POST | `/api/organization/:id/seats/add` | ❌ | ✅ | **Not implemented** | 404; useSeatManagement |
| 72 | POST | `/api/organization/:id/plan/upgrade` | ❌ | ✅ | **Not implemented** | 404; useSeatManagement |
| 73 | GET | `/api/organization/:id/plan/can-downgrade/:plan` | ❌ | ✅ | **Not implemented** | 404; useSeatManagement |
| 74 | GET | `/api/invites/:code` | ❌ | ✅ | **Not implemented** | 404; JoinTeam |
| 75 | POST | `/api/invites/:code/join` | ❌ | ✅ | **Not implemented** | 404; JoinTeam |
| 76 | POST | `/api/team/accept-invite` | ❌ | ✅ | **Not implemented** | 404; AcceptInvite |
| 77 | GET | `/api/billing/invoices/:id/download` | ❌ | ✅ | **Not implemented** | 404; BillingPanel |
| 78 | GET | `/api/analyses` | ❌ | ✅ | **Not implemented** | 404; analysisService |
| 79 | POST | `/api/ai-chat/message` | ❌ | ✅ | **Not implemented** | 404; AIChatContext |
| 80 | POST | `/api/ai-chat/conversation` | ❌ | ✅ | **Not implemented** | 404; AIChatContext |
| 81 | GET | `/api/ai-chat/conversation/:id/history` | ❌ | ✅ | **Not implemented** | 404; AIChatContext |
| 82 | POST | `/api/ai-chat/escalate` | ❌ | ✅ | **Not implemented** | 404; AIChatContext |
| 83 | POST | `/api/ai-chat/feedback` | ❌ | ✅ | **Not implemented** | 404; AIChatWidget |
| 84 | POST | `/api/generate-section-content` | ❌ | ✅ | **Not implemented** | 404; VisualSectionsEditor |
| 85 | POST | `/api/generate-dki-ad` | ❌ | ✅ | **Not implemented** | 404; dkiAdGeneratorAI |
| 86 | GET | `/api/blogs` | ❌ | ✅ | **Not implemented** | 404; Blog |
| 87 | GET | `/api/admin/blogs` | ❌ | ✅ | **Not implemented** | 404; BlogGenerator |
| 88 | GET | `/api/admin/stats` | ❌ | ✅ | **Not implemented** | 404; SuperAdminPanel |
| 89 | GET | `/api/admin/activity` | ❌ | ✅ | **Not implemented** | 404; SuperAdminPanel |
| 90 | GET | `/api/admin/billing/stats` | ❌ | ✅ | **Not implemented** | 404; SuperAdminPanel |
| 91 | GET | `/api/admin/email/stats` | ❌ | ✅ | **Not implemented** | 404; SuperAdminPanel |
| 92 | GET | `/api/admin/users` | ❌ | ✅ | **Not implemented** | 404; SuperAdminPanel. Only `/api/admin/status` exists |
| 93 | GET | `/api/admin/logs` | ❌ | ✅ | **Not implemented** | 404; SuperAdminPanel |
| 94 | GET | `/api/admin/security/rules` | ❌ | ✅ | **Not implemented** | 404; SuperAdminPanel |
| 95 | GET | `/api/admin/security/rules/:id` | ❌ | ✅ | **Not implemented** | 404; SuperAdminPanel |
| 96 | GET | `/api/admin/database/tables` | ❌ | ✅ | **Not implemented** | 404; SuperAdminPanel |
| 97 | GET | `/api/admin/database/table/:name` | ❌ | ✅ | **Not implemented** | 404; SuperAdminPanel |
| 98 | POST | `/api/admin/users/:id/block` | ❌ | ✅ | **Not implemented** | 404; SuperAdminPanel |
| 99 | PUT | `/api/admin/users/:id/role` | ❌ | ✅ | **Not implemented** | 404; SuperAdminPanel |
| 100 | GET | `/api/admin/email/logs` | ❌ | ✅ | **Not implemented** | 404; EmailLogs |
| 101 | GET | `/api/admin/services-billing` | ❌ | ✅ | **Not implemented** | 404; expenseTracking |
| 102 | POST | `/api/campaign-history` | ❌ | ✅ | **Not implemented** | 404; historyService |
| 103 | GET | `/api/campaign-history` | ❌ | ✅ | **Not implemented** | 404; historyService |
| 104 | GET | `/api/campaign-history/:id` | ❌ | ✅ | **Not implemented** | 404; historyService |
| 105 | PUT | `/api/campaign-history/:id` | ❌ | ✅ | **Not implemented** | 404; historyService |
| 106 | DELETE | `/api/campaign-history/:id` | ❌ | ✅ | **Not implemented** | 404; historyService |
| 107 | POST | `/api/campaigns/one-click` | ❌ | ✅ | **Not implemented** | 404; OneClickCampaignBuilder |
| 108 | POST | `/api/campaigns/save` | ❌ | ✅ | **Not implemented** | 404; OneClickCampaignBuilder, localStorageHistory |
| 109 | GET | `/api/user/profile` | ❌ | ✅ | **Not implemented** | 404; SettingsPanel |
| 110 | PUT | `/api/user/profile` | ❌ | ✅ | **Not implemented** | 404; SettingsPanel |
| 111 | POST | `/api/user/password` | ❌ | ✅ | **Not implemented** | 404; SettingsPanel |
| 112 | GET | `/api/tasks` | ❌ | ✅ | **Not implemented** | 404; TaskManager |
| 113 | POST | `/api/tasks` | ❌ | ✅ | **Not implemented** | 404; TaskManager |
| 114 | PUT | `/api/tasks/:id` | ❌ | ✅ | **Not implemented** | 404; TaskManager |
| 115 | DELETE | `/api/tasks/:id` | ❌ | ✅ | **Not implemented** | 404; TaskManager |
| 116 | GET | `/api/projects` | ❌ | ✅ | **Not implemented** | 404; TaskManager |
| 117 | POST | `/api/projects` | ❌ | ✅ | **Not implemented** | 404; TaskManager |
| 118 | DELETE | `/api/projects/:id` | ❌ | ✅ | **Not implemented** | 404; TaskManager |
| 119 | GET | `/api/domains` | ❌ | ✅ | **Not implemented** | 404; WebTemplates |
| 120 | POST | `/api/domains` | ❌ | ✅ | **Not implemented** | 404; WebTemplates |
| 121 | GET | `/api/domains/:id` | ❌ | ✅ | **Not implemented** | 404; WebTemplates |
| 122 | GET | `/api/domains/:id/refresh` | ❌ | ✅ | **Not implemented** | 404; WebTemplates |
| 123 | POST | `/api/dns/verify` | ❌ | ✅ | **Not implemented** | 404; WebTemplates |
| 124 | GET | `/api/promo/status` | ❌ | ✅ | **Not implemented** | 404; PromoLandingPage |
| 125 | POST | `/api/promo/trial` | ❌ | ✅ | **Not implemented** | 404; PromoLandingPage |
| 126 | POST | `/api/promo/lifetime-direct` | ❌ | ✅ | **Not implemented** | 404; PromoLandingPage |
| 127 | POST | `/api/logs` | ❌ | ✅ | **Not implemented** | 404; logger.ts (productionLogger commented) |
| 128 | GET | `/api/db/:table` | ❌ | ✅ | **Not implemented** | 404; database.ts |
| 129 | POST | `/api/db/:table` | ❌ | ✅ | **Not implemented** | 404; database.ts |
| 130 | PUT | `/api/db/:table/:id` | ❌ | ✅ | **Not implemented** | 404; database.ts |
| 131 | DELETE | `/api/db/:table/:id` | ❌ | ✅ | **Not implemented** | 404; database.ts |
| 132 | GET | `/api/admin/users` | ❌ | ✅ | **Not implemented** | 404; database loadAdminUsers |
| 133 | GET | `/api/admin/templates` | ❌ | ✅ | **Not implemented** | 404; database loadAdminTemplates |
| 134 | GET | `/api/admin/deployments` | ❌ | ✅ | **Not implemented** | 404; database loadAdminDeployments |
| 135 | GET | `/api/admin/websites` | ❌ | ✅ | **Not implemented** | 404; database loadAdminWebsites |
| 136 | GET | `/api/admin/tickets` | ❌ | ✅ | **Not implemented** | 404; database loadSupportTickets |
| 137 | GET | `/api/admin/structures` | ❌ | ✅ | **Not implemented** | 404; database loadCampaignStructures |
| 138 | GET | `/api/admin/expenses` | ❌ | ✅ | **Not implemented** | 404; database loadAdminExpenses |

---

## Quick Counts

| Status | Count |
|--------|------:|
| **Working** (implemented, called or relevant) | 39 |
| **Not implemented** (frontend calls, 404) | 99+ |
| **Path mismatch** (logic exists at different path) | 3 (`/api/products` vs `/api/stripe/products`, etc.) |

---

## Implemented vs Called (Stripe path mismatch)

| Frontend calls | Server implements | Action |
|----------------|-------------------|--------|
| `GET /api/stripe/products` | `GET /api/products` | Add `/api/stripe/products` proxy or switch frontend to `/api/products` |
| `POST /api/stripe/checkout` | `POST /api/checkout` | Same |
| `POST /api/stripe/portal` | `POST /api/portal` | Same |

---

## Other Backends (Out of Scope)

- **Supabase Edge Function** (`/functions/v1/make-server-6757d0ca/...`): e.g. `export-csv`, `generate-keywords`, `history/save`, `history/list`, etc. Used by `csvExportBackend`, `HistoryPanel`, and potentially other server-side flows.
- **Nhost**: Auth (`/v1/token`, etc.), GraphQL.
- **External**: Stripe, OpenAI, Vercel, etc.

---

## How to Verify

1. Start API server: `npm run start` (requires `SUPABASE_DB_PASSWORD` or `DATABASE_URL` for Stripe).
2. Start frontend: `npm run dev` (proxies `/api` → `localhost:3001`).
3. Call `GET /api/health` (e.g. `curl http://localhost:3001/api/health`) and then hit other endpoints as needed.

---

## Files Reference

- **Server routes:** `server/index.ts`, `server/routes/community.ts`
- **Vercel handler:** `api/[...path].ts` → `app.fetch`
- **Frontend fetch usage:** `src/**` (grep `fetch('/api/` or `fetch(\`/api/`)
