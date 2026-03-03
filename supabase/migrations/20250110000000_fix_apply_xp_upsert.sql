-- Fix apply_xp function to handle users without existing xp_balances record
-- Uses UPSERT pattern to create record if it doesn't exist

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
  v_xp_acc INT := 0;
  v_lvl INT := 1;
  v_needed INT;
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
  
  -- Calculate level before using tiered formula:
  -- Tier 1 (L1-49): 150 + 17*(L-1) per level
  -- Tier 2 (L50-99): 1000 + 30*(L-50) per level
  -- Tier 3 (L100-249): 2500 + 40*(L-100) per level
  v_xp_acc := 0; v_lvl := 1;
  WHILE v_lvl < 250 LOOP
    IF v_lvl < 50 THEN v_needed := 150 + 17 * (v_lvl - 1);
    ELSIF v_lvl < 100 THEN v_needed := 1000 + 30 * (v_lvl - 50);
    ELSE v_needed := 2500 + 40 * (v_lvl - 100);
    END IF;
    EXIT WHEN v_xp_acc + v_needed > v_current_total_xp;
    v_xp_acc := v_xp_acc + v_needed;
    v_lvl := v_lvl + 1;
  END LOOP;
  v_level_before := v_lvl;
  
  -- Check if daily cap would be exceeded
  IF v_current_daily_xp + p_xp_amount > v_daily_cap THEN
    v_xp_to_add := GREATEST(0, v_daily_cap - v_current_daily_xp);
    v_capped := true;
    
    -- Create XP cap notification (only if we have a notification function)
    BEGIN
      PERFORM public.create_notification(
        p_profile_id,
        'xp_cap',
        'Daily XP Cap Reached',
        'You''ve reached your daily XP cap of ' || v_daily_cap || ' XP. Come back tomorrow for more!',
        '/my-plants'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Ignore notification errors
      NULL;
    END;
  ELSE
    v_xp_to_add := p_xp_amount;
  END IF;
  
  -- UPSERT XP balance (insert if not exists, update if exists)
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
  v_xp_acc := 0; v_lvl := 1;
  WHILE v_lvl < 250 LOOP
    IF v_lvl < 50 THEN v_needed := 150 + 17 * (v_lvl - 1);
    ELSIF v_lvl < 100 THEN v_needed := 1000 + 30 * (v_lvl - 50);
    ELSE v_needed := 2500 + 40 * (v_lvl - 100);
    END IF;
    EXIT WHEN v_xp_acc + v_needed > v_current_total_xp;
    v_xp_acc := v_xp_acc + v_needed;
    v_lvl := v_lvl + 1;
  END LOOP;
  v_level_after := v_lvl;
  
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

-- Re-grant execute permission
GRANT EXECUTE ON FUNCTION public.apply_xp TO authenticated;
GRANT EXECUTE ON FUNCTION public.apply_xp TO service_role;
