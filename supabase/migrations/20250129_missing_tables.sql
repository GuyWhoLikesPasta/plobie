-- Missing Tables Migration
-- Created: 2025-01-29
-- Adds: article_reads table (required for achievements system)

-- ================================
-- ARTICLE READS TABLE
-- ================================
-- Tracks which articles users have read (for XP and achievements)
CREATE TABLE IF NOT EXISTS public.article_reads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    article_id TEXT NOT NULL,
    read_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, article_id)
);

-- RLS Policies
ALTER TABLE public.article_reads ENABLE ROW LEVEL SECURITY;

-- Users can view their own reads
CREATE POLICY "article_reads_select_own" ON public.article_reads
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Users can insert their own reads
CREATE POLICY "article_reads_insert_own" ON public.article_reads
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_article_reads_user ON public.article_reads(user_id);
CREATE INDEX IF NOT EXISTS idx_article_reads_article ON public.article_reads(article_id);

-- Grant permissions
GRANT SELECT, INSERT ON public.article_reads TO authenticated;
