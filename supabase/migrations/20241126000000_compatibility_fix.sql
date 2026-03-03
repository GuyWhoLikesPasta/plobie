-- Compatibility Fix for Week 3
-- This adds the missing columns and stored procedure needed for Week 3 features

-- Add profile_id to xp_events (alongside user_id for compatibility)
ALTER TABLE public.xp_events 
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reference_type TEXT,
  ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Backfill profile_id from user_id
UPDATE public.xp_events xe
SET profile_id = p.id
FROM public.profiles p
WHERE xe.user_id = p.user_id AND xe.profile_id IS NULL;

-- Add profile_id to xp_balances (alongside user_id for compatibility)
ALTER TABLE public.xp_balances
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS total_xp INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;

-- Backfill profile_id and total_xp from user_id and balance
UPDATE public.xp_balances xb
SET 
  profile_id = p.id,
  total_xp = COALESCE(xb.balance, 0),
  level = GREATEST(1, FLOOR(COALESCE(xb.balance, 0) / 100.0) + 1)
FROM public.profiles p
WHERE xb.user_id = p.user_id AND xb.profile_id IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_xp_events_profile_id ON public.xp_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_xp_balances_profile_id ON public.xp_balances(profile_id);

-- Drop old apply_xp if it exists
DROP FUNCTION IF EXISTS public.apply_xp CASCADE;

-- Create new apply_xp stored procedure for Week 3
CREATE OR REPLACE FUNCTION public.apply_xp(
  p_profile_id UUID,
  p_action_type TEXT,
  p_amount INT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  xp_awarded INT,
  new_total INT,
  new_level INT,
  reason TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_current_total INT;
  v_new_total INT;
  v_new_level INT;
  v_daily_total INT;
  v_action_today INT;
  v_last_action TIMESTAMPTZ;
BEGIN
  -- Get user_id for the profile
  SELECT user_id INTO v_user_id FROM public.profiles WHERE id = p_profile_id;
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 0, 0, 'Profile not found'::TEXT;
    RETURN;
  END IF;

  -- Check daily total cap (100 XP/day across all actions)
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.xp_events
  WHERE profile_id = p_profile_id
    AND created_at >= CURRENT_DATE;

  IF v_daily_total >= 100 THEN
    RETURN QUERY SELECT FALSE, 0, v_daily_total, 0, 'Daily XP cap reached (100 XP/day)'::TEXT;
    RETURN;
  END IF;

  -- Check for duplicate actions (idempotency)
  IF p_reference_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.xp_events
      WHERE profile_id = p_profile_id
        AND action_type = p_action_type
        AND reference_id = p_reference_id
    ) THEN
      RETURN QUERY SELECT FALSE, 0, v_daily_total, 0, 'Already completed this action'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Cap the XP if it would exceed daily limit
  IF v_daily_total + p_amount > 100 THEN
    p_amount := 100 - v_daily_total;
  END IF;

  -- Insert XP event
  INSERT INTO public.xp_events (
    user_id, profile_id, action_type, amount, reference_type, reference_id
  ) VALUES (
    v_user_id, p_profile_id, p_action_type, p_amount, p_reference_type, p_reference_id
  );

  -- Get current balance
  SELECT COALESCE(total_xp, 0) INTO v_current_total
  FROM public.xp_balances
  WHERE profile_id = p_profile_id;

  -- Calculate new totals
  v_new_total := v_current_total + p_amount;
  v_new_level := GREATEST(1, FLOOR(v_new_total / 100.0) + 1);

  -- Upsert balance
  INSERT INTO public.xp_balances (user_id, profile_id, balance, total_xp, level, updated_at)
  VALUES (v_user_id, p_profile_id, v_new_total, v_new_total, v_new_level, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance = v_new_total,
        total_xp = v_new_total,
        level = v_new_level,
        updated_at = NOW();

  -- Update profile xp_total (denormalized)
  UPDATE public.profiles
  SET xp_total = v_new_total
  WHERE id = p_profile_id;

  -- Return success
  RETURN QUERY SELECT TRUE, p_amount, v_new_total, v_new_level, 'XP awarded successfully'::TEXT;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.apply_xp TO authenticated;

