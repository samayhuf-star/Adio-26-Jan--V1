# PocketBase Migration Summary

## Status: In Progress

This document tracks the migration from Clerk + Supabase to PocketBase.

## Completed

1. ✅ Installed PocketBase SDK
2. ✅ Created PocketBase client configuration (`src/utils/pocketbase/client.ts`)
3. ✅ Created PocketBase auth utilities (`src/utils/pocketbase/auth.ts`)
4. ✅ Updated main auth utilities (`src/utils/auth.ts`)
5. ✅ Updated Auth component to use PocketBase
6. ✅ Removed ClerkProvider from main.tsx
7. ✅ Updated App.tsx to use PocketBase instead of Clerk
8. ✅ Created server-side PocketBase utilities (`server/pocketbase.ts`)
9. ✅ Updated server authentication (`verifyUserToken`, `verifySuperAdmin`)
10. ✅ Removed Clerk and Supabase from package.json

## Remaining Tasks

### Database Migration
- [ ] Update all database queries that reference `clerk_user_id` to use PocketBase user IDs
- [ ] Migrate existing user data from Supabase/Clerk to PocketBase
- [ ] Update all Supabase database calls to use PocketBase collections

### API Endpoints
- [ ] Review and update all API endpoints that use Supabase
- [ ] Update user sync endpoint to use PocketBase
- [ ] Update all endpoints that query user data

### Components
- [ ] Update components that directly use Supabase client
- [ ] Update components that use Clerk hooks
- [ ] Test all authentication flows

### Environment Variables
- [ ] Set `VITE_POCKETBASE_URL` for frontend
- [ ] Set `POCKETBASE_URL` for backend
- [ ] Set `POCKETBASE_ADMIN_EMAIL` and `POCKETBASE_ADMIN_PASSWORD` for server operations
- [ ] Remove `CLERK_SECRET_KEY`, `CLERK_PUBLISHABLE_KEY`
- [ ] Remove `SUPABASE_URL`, `SUPABASE_ANON_KEY`

### PocketBase Setup
- [ ] Deploy PocketBase instance (or use PocketBase Cloud)
- [ ] Create `users` collection in PocketBase with required fields:
  - email (email, unique, required)
  - password (password, required)
  - name (text)
  - role (text, default: 'user')
  - subscription_plan (text, default: 'free')
  - subscription_status (text, default: 'active')
  - google_ads_default_account (text, nullable)
  - company_name, job_title, industry, company_size, phone, website, country, bio (all optional text fields)
- [ ] Set up email verification in PocketBase
- [ ] Configure password reset in PocketBase

## Important Notes

1. **PocketBase Instance**: You need to run PocketBase separately. Options:
   - Self-hosted on a server
   - PocketBase Cloud (managed service)
   - Docker container

2. **Database Schema**: PocketBase uses collections instead of SQL tables. The migration requires:
   - Creating collections in PocketBase
   - Migrating data from PostgreSQL/Supabase to PocketBase
   - Updating all database queries

3. **Authentication Flow**: PocketBase handles auth differently:
   - Users sign up/sign in directly with PocketBase
   - Tokens are managed by PocketBase
   - No separate auth service needed

## Next Steps

1. Set up PocketBase instance
2. Create required collections
3. Update remaining database queries
4. Test authentication flows
5. Deploy to Vercel
