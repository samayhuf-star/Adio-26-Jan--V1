# Feedback System Fix

## Issues Identified

1. **Database Error**: Table `public.feedback` doesn't exist or has wrong schema
   - Error: `Could not find the table 'public.feedback' in the schema cache`
   - Root cause: The table hasn't been created, or the schema cache needs refresh

2. **Edge Function 404**: The `/send-feedback-email` endpoint returns 404
   - Error: `POST https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/send-feedback-email` returns 404
   - Root cause: Edge function may not be deployed or needs to be redeployed

## Schema Mismatch Fixed

The original migration used `'feature'` but the code uses `'feature_request'`. This has been fixed in:
- ✅ `supabase/migrations/create_feedback_table.sql` - Updated for new deployments
- ✅ `supabase/migrations/fix_feedback_table_type_constraint.sql` - Fixes existing tables
- ✅ `supabase/migrations/fix_feedback_table_complete.sql` - Complete fix for all scenarios

## Solution Steps

### Step 1: Run Database Migration

Run the migration to create/fix the feedback table:

#### Option A: Via Supabase Dashboard (Recommended)
1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj
2. Navigate to: **SQL Editor**
3. Copy and paste the contents of `supabase/migrations/fix_feedback_table_complete.sql`
4. Click **Run** to execute the migration

#### Option B: Via Supabase CLI
```bash
# Link your project (if not already linked)
supabase link --project-ref kkdnnrwhzofttzajnwlj

# Run the migration
supabase db push

# Or run the specific migration file
supabase db reset  # This will run all migrations
```

### Step 2: Refresh Schema Cache (if needed)

If the table exists but you still see the error, refresh Supabase's schema cache:

1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj
2. Navigate to: **Database** → **Tables**
3. The schema cache should auto-refresh, but you can also:
   - Wait a few seconds for automatic refresh
   - Or restart the Supabase project if possible

### Step 3: Deploy Edge Function (if 404 persists)

The edge function endpoint exists in code but needs to be deployed:

#### Option A: Via Supabase CLI (Recommended)
```bash
# Install Supabase CLI (if not installed)
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref kkdnnrwhzofttzajnwlj

# Deploy the function
supabase functions deploy make-server-6757d0ca --no-verify-jwt
```

#### Option B: Via Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/kkdnnrwhzofttzajnwlj
2. Navigate to: **Edge Functions** → **make-server-6757d0ca**
3. Upload the files from: `supabase/functions/make-server-6757d0ca/`
   - `index.ts`
   - `kv_store.ts`
4. Click **Deploy**

### Step 4: Verify Deployment

Test the health endpoint:
```bash
curl -X GET \
  "https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/health" \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

Expected response:
```json
{ "status": "ok" }
```

Test the feedback endpoint:
```bash
curl -X POST \
  "https://kkdnnrwhzofttzajnwlj.supabase.co/functions/v1/make-server-6757d0ca/send-feedback-email" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{
    "to": "test@example.com",
    "subject": "Test Feedback",
    "body": "This is a test"
  }'
```

## Current Status

- ✅ **Migration files updated** - Schema now matches code (`'feature_request'` instead of `'feature'`)
- ✅ **Complete migration created** - Handles both new and existing tables
- ⚠️  **Database migration needed** - Run the migration to create/fix the table
- ⚠️  **Edge function deployment needed** - Deploy to fix the 404 error

## Notes

- The feedback system will continue to work even if the email endpoint fails (it's designed to fail gracefully)
- The database error is blocking feedback from being saved, so fixing that should be the priority
- Once the migration is run, the table will be created with the correct schema and all constraints

## Related Files

- `src/utils/feedbackService.ts` - Feedback service implementation
- `src/components/FeedbackButton.tsx` - UI component for feedback
- `src/components/SuperAdminPanel.tsx` - Admin panel for viewing feedback
- `supabase/functions/make-server-6757d0ca/index.ts` - Edge function with `/send-feedback-email` endpoint

