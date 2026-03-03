-- Add level-up notification trigger to XP system
-- This trigger fires when a user levels up and creates a notification

CREATE OR REPLACE FUNCTION public.notify_level_up()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_new_level INT;
  v_old_level INT;
BEGIN
  -- Calculate old and new levels
  v_old_level := FLOOR(OLD.total_xp / 100) + 1;
  v_new_level := FLOOR(NEW.total_xp / 100) + 1;

  -- If level increased, send notification
  IF v_new_level > v_old_level THEN
    -- Get user_id from profile
    SELECT user_id INTO v_user_id
    FROM public.profiles
    WHERE id = NEW.profile_id;

    IF v_user_id IS NOT NULL THEN
      -- Create level-up notification
      PERFORM public.create_notification(
        v_user_id,
        'level_up',
        '🎉 Level Up!',
        format('Congratulations! You reached Level %s!', v_new_level),
        '/my-plants',
        jsonb_build_object(
          'old_level', v_old_level,
          'new_level', v_new_level,
          'total_xp', NEW.total_xp
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on xp_balances table
DROP TRIGGER IF EXISTS level_up_notification_trigger ON public.xp_balances;
CREATE TRIGGER level_up_notification_trigger
  AFTER UPDATE OF total_xp ON public.xp_balances
  FOR EACH ROW
  WHEN (NEW.total_xp > OLD.total_xp)
  EXECUTE FUNCTION public.notify_level_up();

-- Add XP cap notification to apply_xp function
-- This modifies the existing apply_xp function to send a notification when daily cap is reached

-- Drop existing function first (required to change return type)
DROP FUNCTION IF EXISTS public.apply_xp(UUID, TEXT, INT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.apply_xp(
  p_profile_id UUID,
  p_action_type TEXT,
  p_amount INT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS TABLE (
  xp_awarded INT,
  new_total_xp INT,
  daily_xp INT,
  cap_reached BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_xp INT;
  v_daily_cap INT := 100;
  v_action_cap INT;
  v_action_count INT;
  v_xp_to_award INT := 0;
  v_new_total_xp INT;
  v_cap_reached BOOLEAN := false;
  v_user_id UUID;
BEGIN
  -- Get daily XP total
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_xp
  FROM public.xp_events
  WHERE profile_id = p_profile_id
    AND created_at >= CURRENT_DATE;

  -- Check if daily cap reached
  IF v_daily_xp >= v_daily_cap THEN
    v_cap_reached := true;
    
    -- Get user_id for notification
    SELECT user_id INTO v_user_id FROM public.profiles WHERE id = p_profile_id;
    
    -- Send notification if cap just reached (only once per day)
    IF v_user_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = v_user_id
        AND type = 'xp_cap'
        AND created_at >= CURRENT_DATE
    ) THEN
      PERFORM public.create_notification(
        v_user_id,
        'xp_cap',
        '⚠️ Daily XP Cap Reached',
        format('You''ve earned %s XP today! Come back tomorrow for more.', v_daily_cap),
        '/my-plants',
        jsonb_build_object('daily_xp', v_daily_xp, 'cap', v_daily_cap)
      );
    END IF;

    RETURN QUERY SELECT 0, 0, v_daily_xp, v_cap_reached;
    RETURN;
  END IF;

  -- Get action-specific cap
  v_action_cap := CASE p_action_type
    WHEN 'post_create' THEN 3
    WHEN 'comment_create' THEN 10
    WHEN 'article_read' THEN 5
    WHEN 'pot_claim' THEN 1
    WHEN 'game_session' THEN 4
    ELSE 999
  END;

  -- Count today's actions of this type
  SELECT COUNT(*) INTO v_action_count
  FROM public.xp_events
  WHERE profile_id = p_profile_id
    AND action_type = p_action_type
    AND created_at >= CURRENT_DATE;

  -- Check if action cap reached
  IF v_action_count >= v_action_cap THEN
    RETURN QUERY SELECT 0, 0, v_daily_xp, false;
    RETURN;
  END IF;

  -- Calculate XP to award (respecting daily cap)
  v_xp_to_award := LEAST(p_amount, v_daily_cap - v_daily_xp);

  IF v_xp_to_award > 0 THEN
    -- Insert XP event
    INSERT INTO public.xp_events (
      profile_id,
      action_type,
      amount,
      reference_type,
      reference_id
    ) VALUES (
      p_profile_id,
      p_action_type,
      v_xp_to_award,
      p_reference_type,
      p_reference_id
    );

    -- Update XP balance
    INSERT INTO public.xp_balances (profile_id, total_xp)
    VALUES (p_profile_id, v_xp_to_award)
    ON CONFLICT (profile_id)
    DO UPDATE SET
      total_xp = xp_balances.total_xp + v_xp_to_award,
      updated_at = NOW()
    RETURNING total_xp INTO v_new_total_xp;

    -- Update daily XP
    v_daily_xp := v_daily_xp + v_xp_to_award;

    -- Check if cap reached after this award
    IF v_daily_xp >= v_daily_cap THEN
      v_cap_reached := true;
      
      -- Get user_id for notification
      SELECT user_id INTO v_user_id FROM public.profiles WHERE id = p_profile_id;
      
      -- Send cap notification
      IF v_user_id IS NOT NULL THEN
        PERFORM public.create_notification(
          v_user_id,
          'xp_cap',
          '⚠️ Daily XP Cap Reached',
          format('You''ve earned %s XP today! Come back tomorrow for more.', v_daily_cap),
          '/my-plants',
          jsonb_build_object('daily_xp', v_daily_xp, 'cap', v_daily_cap)
        );
      END IF;
    END IF;
  END IF;

  RETURN QUERY SELECT v_xp_to_award, v_new_total_xp, v_daily_xp, v_cap_reached;
END;
$$;

COMMENT ON FUNCTION public.notify_level_up IS 'Trigger function that sends a notification when user levels up';
COMMENT ON TRIGGER level_up_notification_trigger ON public.xp_balances IS 'Sends notification when user levels up';

