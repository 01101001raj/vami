-- ============================================================
-- FIX USER REGISTRATION RLS POLICY
-- ============================================================
-- Issue: Users table has RLS enabled but no INSERT policy
-- Result: Registration fails with RLS violation
-- Solution: Add INSERT policy to allow user creation
-- ============================================================

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Users can view own data" ON users;
DROP POLICY IF EXISTS "Users can update own data" ON users;
DROP POLICY IF EXISTS "Users can insert own data" ON users;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON users;
DROP POLICY IF EXISTS "Enable insert for service role" ON users;

-- ============================================================
-- USERS TABLE POLICIES
-- ============================================================

-- Policy 1: Allow users to view their own data
CREATE POLICY "Users can view own data"
    ON users
    FOR SELECT
    USING (auth.uid() = id);

-- Policy 2: Allow users to update their own data
CREATE POLICY "Users can update own data"
    ON users
    FOR UPDATE
    USING (auth.uid() = id);

-- Policy 3: CRITICAL - Allow inserting new user records during registration
-- This is needed for the registration flow to work
CREATE POLICY "Enable insert for authenticated users"
    ON users
    FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Policy 4: Allow service role to insert users (backend with service key)
-- This allows the backend to create user profiles using the service role key
CREATE POLICY "Enable insert for service role"
    ON users
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- ============================================================
-- EXPLANATION
-- ============================================================
--
-- Registration Flow:
-- 1. User signs up → Supabase Auth creates auth.users record
-- 2. Backend receives webhook or API call
-- 3. Backend inserts into public.users table (using service role)
-- 4. Without INSERT policy → RLS blocks → Registration fails
-- 5. With INSERT policy → RLS allows → Registration succeeds
--
-- Two approaches supported:
-- A) Client-side: User inserts their own record (auth.uid() = id)
-- B) Server-side: Backend uses service role (service_role policy)
--
-- ============================================================

-- Verify policies were created
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'users'
ORDER BY policyname;
