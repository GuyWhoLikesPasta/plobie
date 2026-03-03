-- Achievements System Foundation
-- Created: 2025-01-08

-- ================================
-- ACHIEVEMENTS TABLE
-- ================================
CREATE TABLE IF NOT EXISTS public.achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    icon TEXT NOT NULL DEFAULT '🏆',
    category TEXT NOT NULL DEFAULT 'general',
    xp_reward INT NOT NULL DEFAULT 0,
    requirement_type TEXT NOT NULL, -- 'xp_total', 'posts_count', 'comments_count', 'articles_read', 'login_streak', 'level'
    requirement_value INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================
-- USER ACHIEVEMENTS (Join Table)
-- ================================
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id UUID NOT NULL REFERENCES public.achievements(id) ON DELETE CASCADE,
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, achievement_id)
);

-- ================================
-- RLS POLICIES
-- ================================
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- Anyone can view achievements
CREATE POLICY "achievements_select_all" ON public.achievements
    FOR SELECT TO authenticated USING (true);

-- Users can view their own achievements
CREATE POLICY "user_achievements_select_own" ON public.user_achievements
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- System can insert user achievements (via RPC)
CREATE POLICY "user_achievements_insert" ON public.user_achievements
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- ================================
-- SEED ACHIEVEMENTS
-- ================================
INSERT INTO public.achievements (key, name, description, icon, category, xp_reward, requirement_type, requirement_value) VALUES
-- XP Milestones
('xp_100', 'Seedling', 'Earn your first 100 XP', '🌱', 'xp', 10, 'xp_total', 100),
('xp_500', 'Sprout', 'Earn 500 XP', '🌿', 'xp', 25, 'xp_total', 500),
('xp_1000', 'Growing Strong', 'Earn 1,000 XP', '🌳', 'xp', 50, 'xp_total', 1000),
('xp_5000', 'Garden Master', 'Earn 5,000 XP', '🏆', 'xp', 100, 'xp_total', 5000),

-- Posting Milestones
('first_post', 'First Bloom', 'Create your first post', '📝', 'social', 5, 'posts_count', 1),
('posts_10', 'Active Gardener', 'Create 10 posts', '✍️', 'social', 25, 'posts_count', 10),
('posts_50', 'Community Leader', 'Create 50 posts', '🌟', 'social', 75, 'posts_count', 50),

-- Comment Milestones
('first_comment', 'Conversation Starter', 'Leave your first comment', '💬', 'social', 5, 'comments_count', 1),
('comments_25', 'Engaged Member', 'Leave 25 comments', '🗣️', 'social', 25, 'comments_count', 25),
('comments_100', 'Discussion Pro', 'Leave 100 comments', '🎯', 'social', 75, 'comments_count', 100),

-- Learning Milestones
('first_article', 'Curious Mind', 'Read your first article', '📖', 'learning', 5, 'articles_read', 1),
('articles_10', 'Knowledge Seeker', 'Read 10 articles', '📚', 'learning', 25, 'articles_read', 10),
('articles_25', 'Avid Learner', 'Read 25 articles', '🎓', 'learning', 75, 'articles_read', 25),

-- Level Milestones
('level_5', 'Rising Star', 'Reach Level 5', '⭐', 'level', 25, 'level', 5),
('level_10', 'Plant Expert', 'Reach Level 10', '🌟', 'level', 50, 'level', 10),
('level_25', 'Master Gardener', 'Reach Level 25', '👑', 'level', 150, 'level', 25)
ON CONFLICT (key) DO NOTHING;

-- ================================
-- ACHIEVEMENT CHECK FUNCTION
-- ================================
CREATE OR REPLACE FUNCTION public.check_achievements(p_user_id UUID)
RETURNS TABLE (
    newly_earned UUID[],
    total_xp_bonus INT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_newly_earned UUID[] := '{}';
    v_total_bonus INT := 0;
    v_achievement RECORD;
    v_user_value INT;
    v_total_xp INT;
    v_posts_count INT;
    v_comments_count INT;
    v_articles_read INT;
    v_level INT;
BEGIN
    -- Get user stats
    SELECT COALESCE(total_xp, 0) INTO v_total_xp
    FROM public.xp_balances WHERE profile_id = p_user_id;
    
    SELECT COUNT(*) INTO v_posts_count
    FROM public.posts WHERE author_id = p_user_id;
    
    SELECT COUNT(*) INTO v_comments_count
    FROM public.comments WHERE author_id = p_user_id;
    
    SELECT COUNT(*) INTO v_articles_read
    FROM public.article_reads WHERE user_id = p_user_id;
    
    -- Calculate level from XP (same formula as apply_xp)
    v_level := FLOOR(SQRT(COALESCE(v_total_xp, 0) / 100.0))::INT + 1;
    
    -- Check each achievement
    FOR v_achievement IN 
        SELECT a.* FROM public.achievements a
        WHERE a.id NOT IN (
            SELECT achievement_id FROM public.user_achievements WHERE user_id = p_user_id
        )
    LOOP
        -- Determine current value based on requirement type
        CASE v_achievement.requirement_type
            WHEN 'xp_total' THEN v_user_value := v_total_xp;
            WHEN 'posts_count' THEN v_user_value := v_posts_count;
            WHEN 'comments_count' THEN v_user_value := v_comments_count;
            WHEN 'articles_read' THEN v_user_value := v_articles_read;
            WHEN 'level' THEN v_user_value := v_level;
            ELSE v_user_value := 0;
        END CASE;
        
        -- Check if requirement is met
        IF v_user_value >= v_achievement.requirement_value THEN
            -- Award the achievement
            INSERT INTO public.user_achievements (user_id, achievement_id)
            VALUES (p_user_id, v_achievement.id);
            
            -- Track bonus XP
            v_total_bonus := v_total_bonus + v_achievement.xp_reward;
            v_newly_earned := array_append(v_newly_earned, v_achievement.id);
        END IF;
    END LOOP;
    
    -- Award bonus XP for achievements if any were earned
    IF v_total_bonus > 0 THEN
        PERFORM public.apply_xp(
            p_user_id,
            'achievement_bonus',
            v_total_bonus,
            'Achievement bonus XP',
            NULL
        );
    END IF;
    
    RETURN QUERY SELECT v_newly_earned, v_total_bonus;
END;
$$;

-- ================================
-- INDEXES
-- ================================
CREATE INDEX IF NOT EXISTS idx_achievements_category ON public.achievements(category);
CREATE INDEX IF NOT EXISTS idx_user_achievements_user ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_earned ON public.user_achievements(earned_at);

-- Grant permissions
GRANT SELECT ON public.achievements TO authenticated;
GRANT SELECT, INSERT ON public.user_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_achievements TO authenticated;
