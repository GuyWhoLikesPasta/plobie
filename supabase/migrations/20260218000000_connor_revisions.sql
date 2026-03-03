-- Connor's Feb 8 Revisions: navigation restructure, community follows, expanded communities
-- Run in Supabase Dashboard SQL Editor

-- ==============================================
-- 1. Community follows (for personalized feeds)
-- ==============================================
CREATE TABLE IF NOT EXISTS public.community_follows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  community_slug TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(profile_id, community_slug)
);

CREATE INDEX IF NOT EXISTS idx_community_follows_profile ON public.community_follows(profile_id);
CREATE INDEX IF NOT EXISTS idx_community_follows_slug ON public.community_follows(community_slug);

ALTER TABLE public.community_follows ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own follows"
  ON public.community_follows FOR SELECT
  USING (profile_id = auth.uid());

CREATE POLICY "Users can follow communities"
  ON public.community_follows FOR INSERT
  WITH CHECK (profile_id = auth.uid());

CREATE POLICY "Users can unfollow communities"
  ON public.community_follows FOR DELETE
  USING (profile_id = auth.uid());

-- ==============================================
-- 2. Newsletter subscription on profiles
-- ==============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS newsletter_subscribed BOOLEAN DEFAULT false;

-- ==============================================
-- 3. Featured/editorial posts
-- ==============================================
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_editorial BOOLEAN DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_posts_featured ON public.posts(is_featured) WHERE is_featured = true;

-- ==============================================
-- 4. Extend game_sessions for arcade games
-- ==============================================
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS game_type TEXT DEFAULT 'unity';
ALTER TABLE public.game_sessions ADD COLUMN IF NOT EXISTS game_name TEXT;

CREATE INDEX IF NOT EXISTS idx_game_sessions_type ON public.game_sessions(game_type);

-- ==============================================
-- 5. Hot-score materialized view for top posts
-- ==============================================
CREATE OR REPLACE VIEW public.posts_with_stats AS
SELECT
  p.*,
  COALESCE(rc.reaction_count, 0) AS like_count,
  COALESCE(cc.comment_count, 0) AS comment_count,
  (
    COALESCE(rc.reaction_count, 0) * 2
    + COALESCE(cc.comment_count, 0) * 3
    + GREATEST(0, 10 - EXTRACT(EPOCH FROM (NOW() - p.created_at)) / 3600)
  ) AS hot_score
FROM public.posts p
LEFT JOIN (
  SELECT post_id, COUNT(*) AS reaction_count
  FROM public.post_reactions
  GROUP BY post_id
) rc ON rc.post_id = p.id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS comment_count
  FROM public.comments
  GROUP BY post_id
) cc ON cc.post_id = p.id
WHERE p.hidden = false;
