# Database Migrations

This directory contains SQL migration scripts for the Vami AI Platform database.

## Prerequisites

- PostgreSQL 14+ (with Supabase)
- pgvector extension (optional, for vector embeddings)
- uuid-ossp extension

## Migration Files

1. **001_create_team_tables.sql** - Team management tables
   - organizations
   - team_members
   - team_invitations

2. **002_create_calendar_tables.sql** - Calendar integration tables
   - calendar_integrations
   - appointments
   - calendar_settings
   - oauth_states

3. **003_create_settings_tables.sql** - Settings and configuration tables
   - notification_settings
   - voice_settings
   - ai_model_settings
   - integration_settings
   - api_keys
   - webhook_endpoints
   - webhook_delivery_log
   - data_exports
   - call_feedback

4. **004_create_knowledge_base_tables.sql** - Knowledge base tables
   - knowledge_base_files
   - knowledge_base_content
   - knowledge_base_queries

## Running Migrations

### Option 1: Using Supabase Dashboard

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and paste each migration file content
4. Run them in order (001, 002, 003, 004)

### Option 2: Using Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Initialize Supabase (if not already done)
supabase init

# Link to your remote project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push

# Or apply individual migrations
psql -h your-db-host -U postgres -d postgres -f migrations/001_create_team_tables.sql
psql -h your-db-host -U postgres -d postgres -f migrations/002_create_calendar_tables.sql
psql -h your-db-host -U postgres -d postgres -f migrations/003_create_settings_tables.sql
psql -h your-db-host -U postgres -d postgres -f migrations/004_create_knowledge_base_tables.sql
```

### Option 3: Using psql

```bash
# Connect to your database
psql "postgresql://user:password@host:port/database"

# Run migrations in order
\i migrations/001_create_team_tables.sql
\i migrations/002_create_calendar_tables.sql
\i migrations/003_create_settings_tables.sql
\i migrations/004_create_knowledge_base_tables.sql
```

## Required Extensions

Before running migrations, ensure the following PostgreSQL extensions are enabled:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgvector (optional, for embeddings)
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable full-text search extensions
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

## Storage Buckets

Create the following storage buckets in Supabase Storage:

1. **knowledge-base** - For storing uploaded knowledge base files
   - Public: false
   - File size limit: 10MB
   - Allowed MIME types: application/pdf, text/plain, text/csv, application/json, etc.

```sql
-- Storage policies for knowledge-base bucket
CREATE POLICY "Users can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-base' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'knowledge-base' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'knowledge-base' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

## Row Level Security (RLS)

All tables have RLS enabled with appropriate policies to ensure users can only access their own data. The policies are defined in each migration file.

## Scheduled Jobs

For production, set up the following scheduled jobs (using pg_cron or external scheduler):

```sql
-- Clean up expired OAuth states (every hour)
SELECT cron.schedule('cleanup-oauth-states', '0 * * * *', 'SELECT cleanup_expired_oauth_states()');

-- Clean up old webhook logs (daily)
SELECT cron.schedule('cleanup-webhook-logs', '0 0 * * *', 'SELECT cleanup_old_webhook_logs()');

-- Clean up expired data exports (daily)
SELECT cron.schedule('cleanup-exports', '0 1 * * *', 'SELECT cleanup_expired_exports()');
```

## Rollback

If you need to rollback migrations, run the following in reverse order:

```sql
-- Drop knowledge base tables
DROP TABLE IF EXISTS knowledge_base_queries CASCADE;
DROP TABLE IF EXISTS knowledge_base_content CASCADE;
DROP TABLE IF EXISTS knowledge_base_files CASCADE;

-- Drop settings tables
DROP TABLE IF EXISTS call_feedback CASCADE;
DROP TABLE IF EXISTS data_exports CASCADE;
DROP TABLE IF EXISTS webhook_delivery_log CASCADE;
DROP TABLE IF EXISTS webhook_endpoints CASCADE;
DROP TABLE IF EXISTS api_keys CASCADE;
DROP TABLE IF EXISTS integration_settings CASCADE;
DROP TABLE IF EXISTS ai_model_settings CASCADE;
DROP TABLE IF EXISTS voice_settings CASCADE;
DROP TABLE IF EXISTS notification_settings CASCADE;

-- Drop calendar tables
DROP TABLE IF EXISTS oauth_states CASCADE;
DROP TABLE IF EXISTS calendar_settings CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TABLE IF EXISTS calendar_integrations CASCADE;

-- Drop team tables
DROP TABLE IF EXISTS team_invitations CASCADE;
DROP TABLE IF EXISTS team_members CASCADE;
DROP TABLE IF EXISTS organizations CASCADE;
```

## Verification

After running migrations, verify that all tables were created:

```sql
-- List all tables
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND rowsecurity = true;

-- Verify indexes
SELECT schemaname, tablename, indexname
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;
```

## Support

For issues with migrations:
1. Check Supabase logs
2. Verify PostgreSQL version compatibility
3. Ensure all required extensions are installed
4. Check user permissions

## Notes

- Always backup your database before running migrations
- Test migrations in a development environment first
- Migrations are idempotent (using IF NOT EXISTS)
- Some tables include JSONB columns for flexibility
- Vector embeddings (VECTOR type) require pgvector extension
