-- Fix posts table schema to match what the code expects
-- The code uses 'title' and 'content' but database has 'caption' and different structure

-- Add missing columns if they don't exist
ALTER TABLE public.posts 
  ADD COLUMN IF NOT EXISTS title TEXT,
  ADD COLUMN IF NOT EXISTS content TEXT NOT NULL DEFAULT '';

-- If we have caption data, migrate it to content
UPDATE public.posts 
SET content = COALESCE(caption, '')
WHERE content = '' OR content IS NULL;

-- Drop caption column if it exists (after migration)
ALTER TABLE public.posts DROP COLUMN IF EXISTS caption;

-- Ensure hobby_group exists (should already exist from CLEAN_RESTORE)
-- ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS hobby_group TEXT;

-- Make content NOT NULL now that it has data
ALTER TABLE public.posts ALTER COLUMN content SET NOT NULL;

-- Update the posts table to have correct indexes
CREATE INDEX IF NOT EXISTS idx_posts_title ON public.posts(title);
CREATE INDEX IF NOT EXISTS idx_posts_content ON public.posts USING gin(to_tsvector('english', content));

