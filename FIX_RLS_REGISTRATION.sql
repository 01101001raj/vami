-- ============================================================
-- FIX USER REGISTRATION RLS POLICY ISSUE
-- ============================================================
-- Run this in your Supabase SQL Editor to fix registration
-- ============================================================

-- Step 1: Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can view own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Users can insert own data" ON public.users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Enable insert for service role" ON public.users;

-- Step 2: Recreate policies with INSERT support

-- Policy 1: Allow users to SELECT their own data
CREATE POLICY "Users can view own data"
    ON public.users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Allow users to UPDATE their own data
CREATE POLICY "Users can update own data"
    ON public.users
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy 3: CRITICAL - Allow INSERT during registration
-- This allows authenticated users to insert their own record
CREATE POLICY "Enable insert for authenticated users"
    ON public.users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 4: Allow backend service role to insert users
-- This is needed for server-side user profile creation
CREATE POLICY "Enable insert for service role"
    ON public.users
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Step 3: Verify policies were created successfully
SELECT
    tablename,
    policyname,
    cmd AS operation,
    roles,
    CASE
        WHEN qual IS NOT NULL THEN 'Has USING clause'
        ELSE 'No USING clause'
    END AS using_clause,
    CASE
        WHEN with_check IS NOT NULL THEN 'Has WITH CHECK clause'
        ELSE 'No WITH CHECK clause'
    END AS with_check_clause
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename = 'users'
ORDER BY policyname;

-- ============================================================
-- Expected Output:
-- You should see 4 policies:
-- 1. Enable insert for authenticated users (INSERT)
-- 2. Enable insert for service role (INSERT)
-- 3. Users can update own data (UPDATE)
-- 4. Users can view own data (SELECT)
-- ============================================================
