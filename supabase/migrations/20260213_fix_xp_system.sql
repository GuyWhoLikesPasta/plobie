-- =====================================================
-- Fix XP System: daily cap, level calculation, apply_xp
-- =====================================================

-- Helper function: calculate level from total XP using tiered formula
-- Tier 1 (L1-49):  150 + 17*(L-1) XP per level
-- Tier 2 (L50-99): 1000 + 30*(L-50) XP per level
-- Tier 3 (L100-249): 2500 + 40*(L-100) XP per level
CREATE OR REPLACE FUNCTION public.calculate_level(p_total_xp INT)
RETURNS INT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_level INT := 1;
  v_xp_used INT := 0;
  v_needed INT;
BEGIN
  WHILE v_level < 250 LOOP
    -- Calculate XP needed for next level
    IF v_level < 50 THEN
      v_needed := 150 + 17 * (v_level - 1);
    ELSIF v_level < 100 THEN
      v_needed := 1000 + 30 * (v_level - 50);
    ELSE
      v_needed := 2500 + 40 * (v_level - 100);
    END IF;

    IF v_xp_used + v_needed > p_total_xp THEN
      EXIT;
    END IF;

    v_xp_used := v_xp_used + v_needed;
    v_level := v_level + 1;
  END LOOP;

  RETURN v_level;
END;
$$;

-- Rebuild apply_xp with correct daily cap (3000) and tiered level calculation
DROP FUNCTION IF EXISTS public.apply_xp(UUID, TEXT, INT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.apply_xp(
  p_profile_id UUID,
  p_action_type TEXT,
  p_xp_amount INT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  xp_awarded INT,
  new_total_xp INT,
  new_daily_xp INT,
  level_before INT,
  level_after INT,
  capped BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_total_xp INT := 0;
  v_current_daily_xp INT := 0;
  v_last_reset_at TIMESTAMPTZ;
  v_level_before INT := 1;
  v_level_after INT;
  v_xp_to_add INT;
  v_capped BOOLEAN := false;
  v_daily_cap INT := 3000;
BEGIN
  -- Get current XP balance (may not exist)
  SELECT xp_balances.total_xp, xp_balances.daily_xp, xp_balances.last_reset_at
  INTO v_current_total_xp, v_current_daily_xp, v_last_reset_at
  FROM public.xp_balances
  WHERE profile_id = p_profile_id;

  -- Handle case where no record exists
  IF v_current_total_xp IS NULL THEN
    v_current_total_xp := 0;
    v_current_daily_xp := 0;
    v_last_reset_at := NOW();
  END IF;

  -- Reset daily XP if it's a new day
  IF v_last_reset_at IS NULL OR v_last_reset_at < CURRENT_DATE THEN
    v_current_daily_xp := 0;
    v_last_reset_at := NOW();
  END IF;

  -- Calculate level before using tiered formula
  v_level_before := public.calculate_level(v_current_total_xp);

  -- Check if daily cap would be exceeded
  IF v_current_daily_xp + p_xp_amount > v_daily_cap THEN
    v_xp_to_add := GREATEST(0, v_daily_cap - v_current_daily_xp);
    v_capped := true;

    -- Create XP cap notification
    BEGIN
      PERFORM public.create_notification(
        p_profile_id,
        'xp_cap',
        'Daily XP Cap Reached',
        'You''ve reached your daily XP cap of ' || v_daily_cap || ' XP. Come back tomorrow for more!',
        '/my-plants'
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  ELSE
    v_xp_to_add := p_xp_amount;
  END IF;

  -- Skip if nothing to add
  IF v_xp_to_add <= 0 THEN
    RETURN QUERY SELECT
      false::BOOLEAN,
      0,
      v_current_total_xp,
      v_current_daily_xp,
      v_level_before,
      v_level_before,
      true;
    RETURN;
  END IF;

  -- UPSERT XP balance
  INSERT INTO public.xp_balances (profile_id, total_xp, daily_xp, last_reset_at, updated_at)
  VALUES (p_profile_id, v_xp_to_add, v_xp_to_add, v_last_reset_at, NOW())
  ON CONFLICT (profile_id) DO UPDATE
  SET
    total_xp = xp_balances.total_xp + v_xp_to_add,
    daily_xp = CASE
      WHEN xp_balances.last_reset_at < CURRENT_DATE THEN v_xp_to_add
      ELSE xp_balances.daily_xp + v_xp_to_add
    END,
    last_reset_at = v_last_reset_at,
    updated_at = NOW()
  RETURNING xp_balances.total_xp, xp_balances.daily_xp
  INTO v_current_total_xp, v_current_daily_xp;

  -- Log XP event
  INSERT INTO public.xp_events (profile_id, action_type, xp_amount, description)
  VALUES (p_profile_id, p_action_type, v_xp_to_add, p_description);

  -- Calculate level after using tiered formula
  v_level_after := public.calculate_level(v_current_total_xp);

  -- Notify on level up
  IF v_level_after > v_level_before THEN
    BEGIN
      PERFORM public.create_notification(
        p_profile_id,
        'level_up',
        'Level Up!',
        'You reached Level ' || v_level_after || '!',
        '/achievements'
      );
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  -- Return results
  RETURN QUERY SELECT
    true::BOOLEAN,
    v_xp_to_add,
    v_current_total_xp,
    v_current_daily_xp,
    v_level_before,
    v_level_after,
    v_capped;
END;
$$;

-- Re-grant execute permissions
GRANT EXECUTE ON FUNCTION public.apply_xp TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_xp TO service_role;
GRANT EXECUTE ON FUNCTION public.calculate_level TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_level TO service_role;

-- Also fix the check_achievements function to use the new level calculation
DROP FUNCTION IF EXISTS public.check_achievements(UUID);

CREATE OR REPLACE FUNCTION public.check_achievements(p_profile_id UUID)
RETURNS TABLE (
  achievement_id UUID,
  achievement_name TEXT,
  achievement_category TEXT,
  xp_reward INT,
  newly_unlocked BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total_xp INT;
  v_level INT;
  v_posts_count INT;
  v_comments_count INT;
  v_articles_read INT;
  v_achievement RECORD;
BEGIN
  -- Gather user stats
  SELECT COALESCE(total_xp, 0) INTO v_total_xp
  FROM public.xp_balances WHERE profile_id = p_profile_id;

  v_total_xp := COALESCE(v_total_xp, 0);
  v_level := public.calculate_level(v_total_xp);

  SELECT COUNT(*) INTO v_posts_count
  FROM public.posts WHERE author_id = p_profile_id;

  SELECT COUNT(*) INTO v_comments_count
  FROM public.comments WHERE author_id = p_profile_id;

  SELECT COUNT(*) INTO v_articles_read
  FROM public.article_reads WHERE profile_id = p_profile_id;

  -- Check each achievement
  FOR v_achievement IN
    SELECT a.id, a.name, a.category, a.xp_reward, a.requirement_type, a.requirement_value
    FROM public.achievements a
    WHERE NOT EXISTS (
      SELECT 1 FROM public.user_achievements ua
      WHERE ua.achievement_id = a.id AND ua.profile_id = p_profile_id
    )
  LOOP
    -- Check if requirement is met
    IF (v_achievement.requirement_type = 'xp_total' AND v_total_xp >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'posts_count' AND v_posts_count >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'comments_count' AND v_comments_count >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'articles_read' AND v_articles_read >= v_achievement.requirement_value) OR
       (v_achievement.requirement_type = 'level' AND v_level >= v_achievement.requirement_value) THEN

      -- Award achievement
      INSERT INTO public.user_achievements (profile_id, achievement_id)
      VALUES (p_profile_id, v_achievement.id)
      ON CONFLICT DO NOTHING;

      -- Award bonus XP if any
      IF v_achievement.xp_reward > 0 THEN
        INSERT INTO public.xp_events (profile_id, action_type, xp_amount, description)
        VALUES (p_profile_id, 'achievement_bonus', v_achievement.xp_reward, 'Achievement: ' || v_achievement.name);

        UPDATE public.xp_balances
        SET total_xp = total_xp + v_achievement.xp_reward, updated_at = NOW()
        WHERE profile_id = p_profile_id;
      END IF;

      RETURN QUERY SELECT v_achievement.id, v_achievement.name, v_achievement.category, v_achievement.xp_reward, true;
    END IF;
  END LOOP;
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_achievements TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_achievements TO service_role;
