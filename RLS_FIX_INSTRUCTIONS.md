# 🔧 Fix Registration RLS Policy Error

## Error Message
```
Registration failed: {'message': 'new row violates row-level security policy for table "users"', 'code': '42501'}
```

## Root Cause
Your Supabase `users` table has Row-Level Security (RLS) enabled but is missing **INSERT policies**. This blocks user registration.

## Solution Steps

### Option 1: Using Supabase Dashboard (Recommended)

1. **Go to Supabase Dashboard**
   - Navigate to https://supabase.com/dashboard
   - Select your project

2. **Open SQL Editor**
   - Click on "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Run the Fix Script**
   - Copy the entire contents of `FIX_RLS_REGISTRATION.sql`
   - Paste it into the SQL Editor
   - Click "Run" button

4. **Verify Success**
   - You should see a table showing 4 policies created
   - Check that you see both INSERT policies

### Option 2: Using Supabase CLI

```bash
# If you have Supabase CLI installed
supabase db push --file FIX_RLS_REGISTRATION.sql
```

### Option 3: Manual Policy Creation

If you prefer to create policies manually:

1. Go to **Database** → **Tables** → `users`
2. Click on **Policies** tab
3. Add these two INSERT policies:

**Policy 1: Enable insert for authenticated users**
- Name: `Enable insert for authenticated users`
- Command: `INSERT`
- Target roles: `authenticated`
- WITH CHECK: `auth.uid() = id`

**Policy 2: Enable insert for service role**
- Name: `Enable insert for service role`
- Command: `INSERT`
- Target roles: `service_role`
- WITH CHECK: `true`

## After Applying the Fix

### Test Registration
1. Clear your browser cache/cookies
2. Try registering a new user
3. Registration should now succeed without RLS errors

### What the Fix Does

The SQL script creates **4 RLS policies** for the `users` table:

| Policy | Operation | Purpose |
|--------|-----------|---------|
| `Users can view own data` | SELECT | Users can read their own profile |
| `Users can update own data` | UPDATE | Users can update their own profile |
| `Enable insert for authenticated users` | INSERT | Users can create their own profile during registration |
| `Enable insert for service role` | INSERT | Backend can create user profiles |

## Why This Happened

The initial database schema (`schema.sql`) enabled RLS but only created SELECT and UPDATE policies. The INSERT policies were added in migration `002_fix_user_registration_rls.sql` but may not have been applied to your database.

## Verification

After running the fix, verify with this SQL query:

```sql
SELECT policyname, cmd, roles
FROM pg_policies
WHERE tablename = 'users' AND schemaname = 'public'
ORDER BY policyname;
```

Expected output:
```
Enable insert for authenticated users | INSERT | {authenticated}
Enable insert for service role        | INSERT | {service_role}
Users can update own data              | UPDATE | {public}
Users can view own data                | SELECT | {public}
```

## Need Help?

If you still encounter issues:

1. **Check if RLS is enabled**:
   ```sql
   SELECT tablename, rowsecurity
   FROM pg_tables
   WHERE tablename = 'users' AND schemaname = 'public';
   ```
   Should show `rowsecurity = true`

2. **Check existing policies**:
   ```sql
   SELECT * FROM pg_policies WHERE tablename = 'users';
   ```

3. **Test with a simple insert** (in SQL Editor):
   ```sql
   -- This should work after the fix
   SELECT auth.uid(); -- Shows your current user ID
   ```

## Related Files

- `backend/migrations/002_fix_user_registration_rls.sql` - Original migration
- `backend/database/schema.sql` - Base schema
- `backend/app/services/supabase_service.py:33` - Where INSERT happens
- `backend/app/api/routes/auth.py:47-52` - Registration endpoint

---

**Status**: Once applied, registration will work immediately. No backend restart required.
