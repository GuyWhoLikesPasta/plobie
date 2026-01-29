-- ============================================
-- FIX: Add notifications when achievements unlock
-- Run in: https://supabase.com/dashboard/project/puhblesoxhizcfuubphh/sql/new
-- ============================================

-- First, ensure notifications table exists
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT,
    read BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes if they don't exist
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read) WHERE read = false;

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies (drop and recreate to avoid conflicts)
DROP POLICY IF EXISTS "notifications_read_own" ON public.notifications;
CREATE POLICY "notifications_read_own" ON public.notifications
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_update_own" ON public.notifications;
CREATE POLICY "notifications_update_own" ON public.notifications
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_delete_own" ON public.notifications;
CREATE POLICY "notifications_delete_own" ON public.notifications
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "notifications_insert_system" ON public.notifications;
CREATE POLICY "notifications_insert_system" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- Grant permissions
GRANT SELECT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT INSERT ON public.notifications TO authenticated;

-- Create or update the create_notification function
CREATE OR REPLACE FUNCTION public.create_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_link TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, type, title, message, link, metadata)
    VALUES (p_user_id, p_type, p_title, p_message, p_link, p_metadata)
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;

-- ============================================
-- UPDATE check_achievements to create notifications
-- ============================================
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
    
    -- Calculate level from XP
    v_level := FLOOR(SQRT(COALESCE(v_total_xp, 0) / 100.0))::INT + 1;
    
    -- Check each achievement
    FOR v_achievement IN 
        SELECT a.* FROM public.achievements a
        WHERE a.id NOT IN (
            SELECT achievement_id FROM public.user_achievements WHERE user_id = p_user_id
        )
    LOOP
        CASE v_achievement.requirement_type
            WHEN 'xp_total' THEN v_user_value := v_total_xp;
            WHEN 'posts_count' THEN v_user_value := v_posts_count;
            WHEN 'comments_count' THEN v_user_value := v_comments_count;
            WHEN 'articles_read' THEN v_user_value := v_articles_read;
            WHEN 'level' THEN v_user_value := v_level;
            ELSE v_user_value := 0;
        END CASE;
        
        IF v_user_value >= v_achievement.requirement_value THEN
            -- Insert the achievement
            INSERT INTO public.user_achievements (user_id, achievement_id)
            VALUES (p_user_id, v_achievement.id);
            
            -- Create notification for achievement unlock
            PERFORM public.create_notification(
                p_user_id,
                'achievement',
                'Achievement Unlocked! ' || v_achievement.icon,
                'You earned "' || v_achievement.name || '" - ' || v_achievement.description || ' (+' || v_achievement.xp_reward || ' XP)',
                '/achievements',
                jsonb_build_object(
                    'achievement_id', v_achievement.id,
                    'achievement_key', v_achievement.key,
                    'xp_reward', v_achievement.xp_reward
                )
            );
            
            v_total_bonus := v_total_bonus + v_achievement.xp_reward;
            v_newly_earned := array_append(v_newly_earned, v_achievement.id);
        END IF;
    END LOOP;
    
    RETURN QUERY SELECT v_newly_earned, v_total_bonus;
END;
$$;

-- ============================================
-- DONE! Test by unlocking an achievement
-- ============================================
