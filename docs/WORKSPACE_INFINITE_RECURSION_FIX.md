# Fix: Infinite Recursion in Workspaces RLS Policies

## 🔴 Root Cause

The infinite recursion error `"infinite recursion detected in policy for relation "workspaces""` was caused by a **circular dependency** between RLS policies:

1. **workspaces SELECT policy** (006_workspaces_schema.sql line 57-67) checks `workspace_members` table
2. **workspace_members SELECT policy** (009_fix_workspace_members_rls.sql line 18-39) checks `workspaces` table
3. This creates infinite recursion: `workspaces → workspace_members → workspaces → workspace_members → ...`

### The Problem Chain:
```
User tries to SELECT from workspaces
  ↓
workspaces RLS policy checks workspace_members
  ↓
workspace_members RLS policy checks workspaces (via JOIN or EXISTS)
  ↓
workspaces RLS policy checks workspace_members again
  ↓
INFINITE LOOP! 💥
```

## ✅ Solution

Created migration `011_fix_workspaces_infinite_recursion.sql` that:

1. **Creates SECURITY DEFINER helper functions** that bypass RLS when checking membership:
   - `check_workspace_membership()` - Checks if user is a member
   - `check_workspace_admin()` - Checks if user is owner/admin

2. **Updates workspaces SELECT policy** to use the helper function instead of directly querying `workspace_members`

3. **Updates workspace_modules policies** to use helper functions to avoid recursion

### Why This Works:

- `SECURITY DEFINER` functions run with elevated privileges and **bypass RLS**
- When the policy calls the function, the function can query `workspace_members` without triggering its RLS policy
- This breaks the circular dependency chain

## 📋 Migration File

**File:** `backend/supabase/migrations/011_fix_workspaces_infinite_recursion.sql`

**What it does:**
1. Drops the problematic `workspaces` SELECT policy
2. Creates `check_workspace_membership()` helper function
3. Creates `check_workspace_admin()` helper function  
4. Recreates `workspaces` SELECT policy using helper function
5. Fixes `workspace_modules` policies to use helper functions

## 🚀 How to Apply

Run the migration in your Supabase SQL Editor:

```sql
-- Copy and paste the contents of:
backend/supabase/migrations/011_fix_workspaces_infinite_recursion.sql
```

Or if using Supabase CLI:
```bash
supabase db push
```

## ✅ Verification

After applying the migration, test workspace creation:

1. Try creating a new workspace
2. Should no longer see "infinite recursion detected" error
3. Workspace should be created successfully
4. Owner should be added as member automatically

## 🔍 Technical Details

### Before (Problematic):
```sql
CREATE POLICY "Users can view workspaces they are members of"
  ON workspaces FOR SELECT
  USING (
    owner_id::text = auth.uid()::text OR
    EXISTS (
      SELECT 1 FROM workspace_members  -- ❌ Triggers workspace_members RLS
      WHERE workspace_members.workspace_id = workspaces.id
      AND workspace_members.user_id::text = auth.uid()::text
    )
  );
```

### After (Fixed):
```sql
CREATE POLICY "Users can view workspaces they are members of"
  ON workspaces FOR SELECT
  USING (
    owner_id::text = auth.uid()::text OR
    check_workspace_membership(workspaces.id, auth.uid())  -- ✅ Bypasses RLS
  );
```

The helper function:
```sql
CREATE OR REPLACE FUNCTION check_workspace_membership(workspace_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- SECURITY DEFINER bypasses RLS, breaking the recursion
  RETURN EXISTS (
    SELECT 1 FROM workspace_members
    WHERE workspace_id = workspace_uuid
    AND user_id::text = user_uuid::text
    AND status = 'active'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 📝 Related Files

- `backend/supabase/migrations/006_workspaces_schema.sql` - Original schema (has the problematic policy)
- `backend/supabase/migrations/009_fix_workspace_members_rls.sql` - Fixed workspace_members policies
- `backend/supabase/migrations/011_fix_workspaces_infinite_recursion.sql` - **This fix**

## 🎯 Summary

The infinite recursion was caused by RLS policies checking each other in a circle. The fix uses `SECURITY DEFINER` functions to bypass RLS when checking membership, breaking the circular dependency while maintaining security.

