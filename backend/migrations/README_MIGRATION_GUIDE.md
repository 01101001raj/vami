# Database Migration Guide

## Quick Start

### Option 1: Run Complete Setup (Recommended for new projects)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Create a new query
4. Copy the contents of `000_COMPLETE_DATABASE_SETUP.sql`
5. Paste and click **Run**
6. Wait for completion (should take 10-30 seconds)
7. Verify success by checking the output

### Option 2: Run Individual Migrations (If you have existing tables)

Run in this order:
1. `001_create_team_tables.sql`
2. `002_create_calendar_tables.sql`
3. `003_create_settings_tables.sql`
4. `004_create_knowledge_base_tables.sql`

## Post-Migration Steps

### 1. Create Storage Bucket

Go to **Storage** in Supabase dashboard:

1. Click **New bucket**
2. Name: `knowledge-base`
3. Public: **No** (private)
4. Click **Create bucket**

### 2. Add Storage Policies

In SQL Editor, run:

```sql
-- Allow users to upload to their own folder
CREATE POLICY "Users can upload to own folder" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'knowledge-base' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to view their own files
CREATE POLICY "Users can view own files" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'knowledge-base' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'knowledge-base' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );
```

### 3. Verify Migration

Run this query to check all tables exist:

```sql
SELECT tablename
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
```

Expected tables:
- agents
- api_keys
- appointments
- calendar_integrations
- calls
- conversations
- knowledge_base_files
- notification_preferences
- organizations
- team_invitations
- team_members
- usage_records
- users
- webhooks

### 4. Get Your Supabase Credentials

From **Project Settings** → **API**:

- **Project URL**: `https://xxxxx.supabase.co`
- **anon public** key: Your public API key
- **service_role** key: Your service/secret key (keep this secret!)

Add these to your backend `.env` file:

```bash
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_KEY=your_anon_public_key
SUPABASE_SERVICE_KEY=your_service_role_key
```

## Troubleshooting

### Error: "relation already exists"

Some tables already exist. You can either:
- Drop the existing table: `DROP TABLE table_name CASCADE;`
- Skip that table's creation in the migration

### Error: "permission denied"

You need admin access to the Supabase project. Contact the project owner.

### Error: "extension does not exist"

Run: `CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`

### Want to start fresh?

⚠️ **WARNING**: This deletes ALL data!

```sql
-- Drop all tables
DROP TABLE IF EXISTS webhooks CASCADE;
DROP TABLE IF EXISTS notification_preferences CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS calls CASCADE;
DROP TABLE IF EXISTS team_invitations CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS calendar_integrations CASCADE;
DROP TABLE IF EXISTS knowledge_base_files CASCADE;
DROP TABLE IF EXISTS usage_records CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS agents CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- Then re-run the migration
```

## Next Steps

After successful migration:
1. ✅ Database is ready
2. → Configure external services (Stripe, ElevenLabs, etc.)
3. → Set up environment variables
4. → Test database connection from backend
5. → Deploy backend to Railway
6. → Deploy frontend to Vercel
