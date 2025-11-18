# Registration Fix - RLS Policy Issue

## Problem

You're getting this error when trying to register:
```
Registration failed: {'message': 'new row violates row-level security policy for table "users"', 'code': '42501'}
```

## Root Cause

The `users` table has **Row Level Security (RLS) enabled** but is missing an **INSERT policy**. This blocks the backend from creating user records during registration.

## Quick Fix (2 minutes)

### Step 1: Go to Supabase SQL Editor

1. Open your Supabase project: https://supabase.com/dashboard
2. Go to **SQL Editor** in the left sidebar
3. Click **New Query**

### Step 2: Run This SQL

Copy and paste this entire SQL script:

```sql
-- Fix User Registration RLS Policy

-- Drop existing policies (avoid conflicts)
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for service role" ON users;

-- Allow users to view their own data
CREATE POLICY "Users can view own data"
    ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Allow users to update their own data
CREATE POLICY "Users can update own data"
    ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- CRITICAL: Allow inserting new users during registration
CREATE POLICY "Enable insert for authenticated users"
    ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Allow service role (backend) to insert users
CREATE POLICY "Enable insert for service role"
    ON users
    FOR INSERT
    TO service_role
    WITH CHECK (true);
```

### Step 3: Click "Run"

The query should complete successfully.

### Step 4: Verify

Run this query to confirm policies exist:

```sql
SELECT policyname, cmd
FROM pg_policies
WHERE tablename = 'users';
```

You should see:
- `Users can view own data` (SELECT)
- `Users can update own data` (UPDATE)
- `Enable insert for authenticated users` (INSERT)
- `Enable insert for service role` (INSERT)

### Step 5: Test Registration

Go back to your app and try registering again:
```
http://localhost:5173/register
```

Registration should now work! ✅

---

## Alternative: Run Migration File

Or run the complete migration file:

1. Go to Supabase SQL Editor
2. Copy the contents of: `backend/migrations/002_fix_user_registration_rls.sql`
3. Paste and run

---

## What This Does

### Before (Broken):
```
User tries to register
  ↓
Backend inserts into users table
  ↓
RLS: ❌ No INSERT policy → BLOCKED
  ↓
Error: "violates row-level security policy"
```

### After (Fixed):
```
User tries to register
  ↓
Backend inserts into users table (using service role)
  ↓
RLS: ✅ Service role policy exists → ALLOWED
  ↓
Registration successful!
```

---

## Technical Details

### Why This Happened

The original migration (`000_COMPLETE_DATABASE_SETUP.sql`) enabled RLS but only created SELECT policies:

```sql
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);
-- ❌ Missing INSERT policy!
```

### The Fix

Added two INSERT policies:

1. **Client-side inserts** (for authenticated users):
```sql
CREATE POLICY "Enable insert for authenticated users"
    ON users FOR INSERT
    WITH CHECK (auth.uid() = id);
```

2. **Server-side inserts** (for backend with service role key):
```sql
CREATE POLICY "Enable insert for service role"
    ON users FOR INSERT
    TO service_role
    WITH CHECK (true);
```

Now both approaches work:
- ✅ Frontend can create user records (client-side)
- ✅ Backend can create user records (server-side with service key)

---

## Prevention

This fix is now included in the migration file:
- `backend/migrations/002_fix_user_registration_rls.sql`

For new Supabase projects, run this after the initial migration to prevent the issue.

---

## Troubleshooting

### Still Getting Errors?

**Error: "permission denied for table users"**
- Make sure you're using the service role key in backend `.env`
- Check: `SUPABASE_SERVICE_KEY=your-service-role-key`

**Error: "JWT expired"**
- Clear browser local storage
- Try registering in incognito mode

**Error: "duplicate key value"**
- Email already exists in database
- Try a different email
- Or check Supabase Authentication → Users

### Check Backend Logs

```bash
# In backend terminal
# Should see: "User registered successfully"
```

### Check Supabase Logs

1. Go to Supabase Dashboard
2. Logs → Postgres Logs
3. Look for INSERT statements

---

## Summary

✅ **Problem**: RLS blocked user registration (missing INSERT policy)
✅ **Solution**: Added INSERT policies for both authenticated users and service role
✅ **Time**: 2 minutes to fix
✅ **Result**: Registration now works!

Run the SQL script above and try registering again!
