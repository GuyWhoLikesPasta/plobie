-- Performance Optimization: Add missing indexes for common queries
-- This migration adds indexes to improve query performance across the application

-- Posts table indexes
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_hobby_group_idx ON public.posts(hobby_group) WHERE NOT COALESCE(hidden, false);
CREATE INDEX IF NOT EXISTS posts_author_created_idx ON public.posts(author_id, created_at DESC);

-- Comments table indexes  
CREATE INDEX IF NOT EXISTS comments_post_created_idx ON public.comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS comments_author_idx ON public.comments(author_id);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);
CREATE INDEX IF NOT EXISTS profiles_total_xp_idx ON public.profiles(total_xp DESC);

-- XP events indexes
CREATE INDEX IF NOT EXISTS xp_events_profile_date_idx ON public.xp_events(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS xp_events_action_date_idx ON public.xp_events(action_type, created_at DESC);

-- Post reactions indexes
CREATE INDEX IF NOT EXISTS post_reactions_post_idx ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS post_reactions_user_post_idx ON public.post_reactions(user_id, post_id);

-- Orders table indexes
CREATE INDEX IF NOT EXISTS orders_user_created_idx ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);

-- Pot claims indexes
CREATE INDEX IF NOT EXISTS pot_claims_user_idx ON public.pot_claims(user_id);
CREATE INDEX IF NOT EXISTS pot_claims_pot_idx ON public.pot_claims(pot_id);

-- Analyze tables to update statistics
ANALYZE public.posts;
ANALYZE public.comments;
ANALYZE public.profiles;
ANALYZE public.xp_events;
ANALYZE public.post_reactions;
ANALYZE public.orders;
ANALYZE public.pot_claims;
ANALYZE public.notifications;

COMMENT ON INDEX posts_created_at_idx IS 'Speeds up recent posts queries';
COMMENT ON INDEX posts_hobby_group_idx IS 'Speeds up filtering by hobby group';
COMMENT ON INDEX comments_post_created_idx IS 'Speeds up fetching comments for a post';
COMMENT ON INDEX profiles_username_idx IS 'Speeds up profile lookups by username';
COMMENT ON INDEX xp_events_profile_date_idx IS 'Speeds up XP history queries';

