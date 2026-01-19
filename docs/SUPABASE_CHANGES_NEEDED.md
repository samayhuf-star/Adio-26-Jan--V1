# Supabase Edge Function Changes Needed

## Problem
All routes in the edge function include the function name prefix `/make-server-6757d0ca/`, but Supabase automatically includes the function name in the URL path when deployed. This causes routes to be unreachable and results in "Project not specified" errors.

## Current (WRONG) Structure:
```
Function deployed as: make-server-6757d0ca
Route defined as: /make-server-6757d0ca/health
Full URL becomes: /functions/v1/make-server-6757d0ca/make-server-6757d0ca/health ❌
```

## Correct Structure:
```
Function deployed as: make-server-6757d0ca
Route should be: /health
Full URL becomes: /functions/v1/make-server-6757d0ca/health ✅
```

## Files to Update:

### 1. `/backend/supabase-functions/server/index.tsx`
### 2. `/supabase/functions/make-server-6757d0ca/index.tsx`

## Required Changes:

Remove `/make-server-6757d0ca/` prefix from ALL route definitions (41 routes total).

### Route Changes:

1. **Health Check:**
   - ❌ `app.get("/make-server-6757d0ca/health", ...)`
   - ✅ `app.get("/health", ...)`

2. **All Other Routes:** Remove `/make-server-6757d0ca/` prefix from:
   - `/generate-keywords` → already correct format
   - `/ai/generate-negative-keywords` → already correct format
   - `/generate-ads` → already correct format
   - `/history/save` → already correct format
   - `/history/list` → already correct format
   - `/history/delete` → already correct format
   - `/tickets/create` → already correct format
   - `/tickets/list` → already correct format
   - `/billing/info` → already correct format
   - `/billing/subscribe` → already correct format
   - `/admin/*` routes → already correct format
   - `/email/*` routes → already correct format

## Example Fix:

```typescript
// BEFORE (WRONG):
app.get("/make-server-6757d0ca/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/make-server-6757d0ca/generate-keywords", async (c) => {
  // ...
});

// AFTER (CORRECT):
app.get("/health", (c) => {
  return c.json({ status: "ok" });
});

app.post("/generate-keywords", async (c) => {
  // ...
});
```

## Impact:

This change will fix:
- ✅ Health check endpoint accessibility
- ✅ All API endpoint routing
- ✅ "Project not specified" errors
- ✅ HTTP 400 errors from edge functions

## Files to Update:

1. `backend/supabase-functions/server/index.tsx` - Remove prefix from all 41 routes
2. `supabase/functions/make-server-6757d0ca/index.tsx` - Same changes (sync both files)

## After Changes:

The API calls in `src/utils/api.ts` are already correct:
```typescript
const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-6757d0ca`;
// This is correct - the function name IS part of the base URL
```

So calls like:
```typescript
fetch(`${API_BASE}/health`) // Will correctly resolve to /functions/v1/make-server-6757d0ca/health
```

## Total Routes to Fix: 41

