-- Migration: Create knowledge base tables
-- Description: Tables for knowledge base files and content
-- Created: 2025-01-08

-- Knowledge base files table
CREATE TABLE IF NOT EXISTS knowledge_base_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id VARCHAR(255) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    file_size BIGINT NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    storage_path VARCHAR(1000) NOT NULL,
    storage_url VARCHAR(1000),
    processed BOOLEAN DEFAULT FALSE,
    processing_status VARCHAR(50) DEFAULT 'pending',
    processing_error TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    processed_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}'
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_files_user_id ON knowledge_base_files(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_files_agent_id ON knowledge_base_files(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_files_processed ON knowledge_base_files(processed);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_files_uploaded_at ON knowledge_base_files(uploaded_at);

-- Knowledge base content table (extracted content from files)
CREATE TABLE IF NOT EXISTS knowledge_base_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_id UUID NOT NULL REFERENCES knowledge_base_files(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id VARCHAR(255) NOT NULL,
    content_type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    embedding VECTOR(1536),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_file_id ON knowledge_base_content(file_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_user_id ON knowledge_base_content(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_agent_id ON knowledge_base_content(agent_id);
-- Vector index for similarity search (if using pgvector)
-- CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_embedding ON knowledge_base_content USING ivfflat (embedding vector_cosine_ops);

-- Knowledge base queries table (for analytics)
CREATE TABLE IF NOT EXISTS knowledge_base_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    agent_id VARCHAR(255) NOT NULL,
    query TEXT NOT NULL,
    results_count INTEGER DEFAULT 0,
    response_time_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_knowledge_base_queries_user_id ON knowledge_base_queries(user_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_queries_agent_id ON knowledge_base_queries(agent_id);
CREATE INDEX IF NOT EXISTS idx_knowledge_base_queries_created_at ON knowledge_base_queries(created_at);

-- Add RLS policies
ALTER TABLE knowledge_base_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_queries ENABLE ROW LEVEL SECURITY;

-- Policies for knowledge_base_files
CREATE POLICY "Users can view their own knowledge base files"
    ON knowledge_base_files FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own knowledge base files"
    ON knowledge_base_files FOR ALL
    USING (auth.uid() = user_id);

-- Policies for knowledge_base_content
CREATE POLICY "Users can view their own knowledge base content"
    ON knowledge_base_content FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own knowledge base content"
    ON knowledge_base_content FOR ALL
    USING (auth.uid() = user_id);

-- Policies for knowledge_base_queries
CREATE POLICY "Users can view their own knowledge base queries"
    ON knowledge_base_queries FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create knowledge base queries"
    ON knowledge_base_queries FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Function to update file processing status
CREATE OR REPLACE FUNCTION update_file_processing_status(
    file_id UUID,
    status VARCHAR,
    error_message TEXT DEFAULT NULL
)
RETURNS void AS $$
BEGIN
    UPDATE knowledge_base_files
    SET
        processing_status = status,
        processing_error = error_message,
        processed = (status = 'completed'),
        processed_at = CASE WHEN status = 'completed' THEN NOW() ELSE NULL END
    WHERE id = file_id;
END;
$$ LANGUAGE plpgsql;

-- Function to get knowledge base statistics
CREATE OR REPLACE FUNCTION get_knowledge_base_stats(p_user_id UUID)
RETURNS TABLE (
    total_files BIGINT,
    total_size_bytes BIGINT,
    processed_files BIGINT,
    pending_files BIGINT,
    failed_files BIGINT,
    content_chunks BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(DISTINCT kbf.id)::BIGINT as total_files,
        COALESCE(SUM(kbf.file_size), 0)::BIGINT as total_size_bytes,
        COUNT(DISTINCT CASE WHEN kbf.processed = TRUE THEN kbf.id END)::BIGINT as processed_files,
        COUNT(DISTINCT CASE WHEN kbf.processing_status = 'pending' THEN kbf.id END)::BIGINT as pending_files,
        COUNT(DISTINCT CASE WHEN kbf.processing_status = 'failed' THEN kbf.id END)::BIGINT as failed_files,
        COUNT(DISTINCT kbc.id)::BIGINT as content_chunks
    FROM knowledge_base_files kbf
    LEFT JOIN knowledge_base_content kbc ON kbc.file_id = kbf.id
    WHERE kbf.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Function to search knowledge base (simplified version)
CREATE OR REPLACE FUNCTION search_knowledge_base(
    p_user_id UUID,
    p_agent_id VARCHAR,
    p_query TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    content TEXT,
    filename VARCHAR,
    relevance NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        kbc.id,
        kbc.content,
        kbf.filename,
        ts_rank(
            to_tsvector('english', kbc.content),
            plainto_tsquery('english', p_query)
        ) as relevance
    FROM knowledge_base_content kbc
    JOIN knowledge_base_files kbf ON kbf.id = kbc.file_id
    WHERE
        kbc.user_id = p_user_id
        AND kbc.agent_id = p_agent_id
        AND to_tsvector('english', kbc.content) @@ plainto_tsquery('english', p_query)
    ORDER BY relevance DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Create full-text search index
CREATE INDEX IF NOT EXISTS idx_knowledge_base_content_fts
    ON knowledge_base_content
    USING gin(to_tsvector('english', content));

-- Comments
COMMENT ON TABLE knowledge_base_files IS 'Uploaded files for agent knowledge base';
COMMENT ON TABLE knowledge_base_content IS 'Extracted and processed content from knowledge base files';
COMMENT ON TABLE knowledge_base_queries IS 'Log of knowledge base search queries';
COMMENT ON FUNCTION update_file_processing_status IS 'Update the processing status of a knowledge base file';
COMMENT ON FUNCTION get_knowledge_base_stats IS 'Get statistics about user knowledge base';
COMMENT ON FUNCTION search_knowledge_base IS 'Full-text search in knowledge base content';
