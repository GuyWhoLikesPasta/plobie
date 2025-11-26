-- XP System Implementation
-- Stored procedure for atomic XP awarding with caps and cooldowns

-- Function to apply XP atomically
CREATE OR REPLACE FUNCTION apply_xp(
  p_profile_id UUID,
  p_action_type TEXT,
  p_amount INTEGER,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS TABLE (
  success BOOLEAN,
  xp_awarded INTEGER,
  reason TEXT
) AS $$
DECLARE
  v_today_start TIMESTAMP;
  v_daily_total INTEGER;
  v_action_count INTEGER;
  v_action_daily_xp INTEGER;
  v_action_cap INTEGER;
  v_daily_cap_per_action INTEGER;
  v_new_balance INTEGER;
  v_cooldown_hours INTEGER;
  v_last_action TIMESTAMP;
BEGIN
  -- Get start of current day in UTC
  v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');

  -- Get total XP earned today across all actions
  SELECT COALESCE(SUM(amount), 0)
  INTO v_daily_total
  FROM xp_events
  WHERE profile_id = p_profile_id
    AND created_at >= v_today_start;

  -- Check daily total cap (100 XP)
  IF v_daily_total >= 100 THEN
    RETURN QUERY SELECT FALSE, 0, 'Daily XP cap of 100 reached';
    RETURN;
  END IF;

  -- Get action-specific limits
  CASE p_action_type
    WHEN 'post_create' THEN
      v_daily_cap_per_action := 5;  -- 5 posts per day
      v_action_cap := 3;            -- +3 XP per post
    WHEN 'comment_create' THEN
      v_daily_cap_per_action := 10; -- 10 comments per day
      v_action_cap := 1;            -- +1 XP per comment
    WHEN 'learn_read' THEN
      v_daily_cap_per_action := 5;  -- 5 articles per day
      v_action_cap := 1;            -- +1 XP per article
      v_cooldown_hours := 0;        -- No repeat reads of same article
    WHEN 'game_play_30m' THEN
      v_daily_cap_per_action := 4;  -- 4 sessions per day
      v_action_cap := 2;            -- +2 XP per 30min session
    WHEN 'pot_link' THEN
      v_daily_cap_per_action := NULL; -- No daily cap (one-time per pot)
      v_action_cap := 50;           -- +50 XP per pot
    WHEN 'admin_adjust' THEN
      v_daily_cap_per_action := NULL; -- No cap for admin adjustments
      v_action_cap := p_amount;     -- Use provided amount
    ELSE
      RETURN QUERY SELECT FALSE, 0, 'Invalid action type';
      RETURN;
  END CASE;

  -- Count actions of this type today
  SELECT COUNT(*)
  INTO v_action_count
  FROM xp_events
  WHERE profile_id = p_profile_id
    AND action_type = p_action_type
    AND created_at >= v_today_start;

  -- Check per-action daily cap
  IF v_daily_cap_per_action IS NOT NULL AND v_action_count >= v_daily_cap_per_action THEN
    RETURN QUERY SELECT FALSE, 0, 'Daily cap for ' || p_action_type || ' reached';
    RETURN;
  END IF;

  -- Check cooldown for specific reference (e.g., same article, same pot)
  IF p_reference_id IS NOT NULL THEN
    SELECT MAX(created_at)
    INTO v_last_action
    FROM xp_events
    WHERE profile_id = p_profile_id
      AND action_type = p_action_type
      AND reference_id = p_reference_id;

    IF v_last_action IS NOT NULL THEN
      -- For learn_read and pot_link, disallow duplicates entirely
      IF p_action_type IN ('learn_read', 'pot_link') THEN
        RETURN QUERY SELECT FALSE, 0, 'Already completed this action';
        RETURN;
      END IF;

      -- For other actions with cooldowns, check time elapsed
      IF v_cooldown_hours IS NOT NULL 
         AND v_last_action + (v_cooldown_hours || ' hours')::INTERVAL > NOW() THEN
        RETURN QUERY SELECT FALSE, 0, 'Cooldown period not elapsed';
        RETURN;
      END IF;
    END IF;
  END IF;

  -- Get XP to award (use action cap, or provided amount for admin)
  IF p_action_type = 'admin_adjust' THEN
    v_action_cap := p_amount;
  END IF;

  -- Cap XP to not exceed daily total limit
  IF v_daily_total + v_action_cap > 100 THEN
    v_action_cap := 100 - v_daily_total;
  END IF;

  -- Insert XP event
  INSERT INTO xp_events (
    profile_id,
    action_type,
    amount,
    reference_type,
    reference_id
  ) VALUES (
    p_profile_id,
    p_action_type,
    v_action_cap,
    p_reference_type,
    p_reference_id
  );

  -- Update or insert XP balance
  INSERT INTO xp_balances (profile_id, total_xp, level)
  VALUES (p_profile_id, v_action_cap, 1)
  ON CONFLICT (profile_id) DO UPDATE
  SET 
    total_xp = xp_balances.total_xp + v_action_cap,
    level = FLOOR((xp_balances.total_xp + v_action_cap) / 100) + 1,
    updated_at = NOW();

  -- Return success
  RETURN QUERY SELECT TRUE, v_action_cap, 'XP awarded successfully';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users (service role will call this)
GRANT EXECUTE ON FUNCTION apply_xp TO authenticated, service_role;

-- Create index on xp_events for performance
CREATE INDEX IF NOT EXISTS idx_xp_events_profile_date 
  ON xp_events (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_xp_events_profile_action_date 
  ON xp_events (profile_id, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_xp_events_reference 
  ON xp_events (profile_id, action_type, reference_id);

