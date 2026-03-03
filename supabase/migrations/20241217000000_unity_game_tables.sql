-- Unity Game Integration Tables
-- Created: December 17, 2025
-- Purpose: Support Unity WebGL game integration with session tracking and state persistence

-- =======================
-- 1. GAME SESSIONS TABLE
-- =======================
-- Track when users play games and for how long
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INT CHECK (duration_minutes >= 0),
  xp_earned INT DEFAULT 0 CHECK (xp_earned >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user session queries
CREATE INDEX IF NOT EXISTS game_sessions_user_id_idx ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS game_sessions_started_at_idx ON public.game_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS game_sessions_status_idx ON public.game_sessions(status) WHERE status = 'active';

-- =======================
-- 2. GAME PROGRESS TABLE
-- =======================
-- Store user's game state (pot positions, growth, unlocks, etc.)
CREATE TABLE IF NOT EXISTS public.game_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  game_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for user progress lookups
CREATE INDEX IF NOT EXISTS game_progress_user_id_idx ON public.game_progress(user_id);
CREATE INDEX IF NOT EXISTS game_progress_updated_at_idx ON public.game_progress(updated_at DESC);

-- =======================
-- 3. ROW LEVEL SECURITY
-- =======================

-- Enable RLS
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;

-- Game Sessions Policies
CREATE POLICY "Users can view own game sessions"
  ON public.game_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own game sessions"
  ON public.game_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game sessions"
  ON public.game_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Game Progress Policies
CREATE POLICY "Users can view own game progress"
  ON public.game_progress
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own game progress"
  ON public.game_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game progress"
  ON public.game_progress
  FOR UPDATE
  USING (auth.uid() = user_id);

-- =======================
-- 4. HELPER FUNCTIONS
-- =======================

-- Update updated_at timestamp automatically
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for game_sessions
DROP TRIGGER IF EXISTS update_game_sessions_updated_at ON public.game_sessions;
CREATE TRIGGER update_game_sessions_updated_at
  BEFORE UPDATE ON public.game_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for game_progress
DROP TRIGGER IF EXISTS update_game_progress_updated_at ON public.game_progress;
CREATE TRIGGER update_game_progress_updated_at
  BEFORE UPDATE ON public.game_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- =======================
-- 5. UTILITY FUNCTIONS
-- =======================

-- Get user's active game session (if any)
CREATE OR REPLACE FUNCTION get_active_game_session(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  started_at TIMESTAMPTZ,
  status TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gs.id,
    gs.user_id,
    gs.started_at,
    gs.status,
    gs.metadata
  FROM public.game_sessions gs
  WHERE gs.user_id = p_user_id
    AND gs.status = 'active'
  ORDER BY gs.started_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Clean up abandoned sessions (sessions active for > 4 hours)
CREATE OR REPLACE FUNCTION cleanup_abandoned_sessions()
RETURNS INT AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE public.game_sessions
  SET 
    status = 'abandoned',
    ended_at = started_at + INTERVAL '4 hours',
    duration_minutes = 240
  WHERE 
    status = 'active'
    AND started_at < NOW() - INTERVAL '4 hours';
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =======================
-- 6. COMMENTS
-- =======================

COMMENT ON TABLE public.game_sessions IS 'Tracks Unity game play sessions for XP rewards';
COMMENT ON TABLE public.game_progress IS 'Stores user game state (JSONB for flexibility)';

COMMENT ON COLUMN public.game_sessions.duration_minutes IS 'Total play time in minutes';
COMMENT ON COLUMN public.game_sessions.xp_earned IS 'XP awarded for this session';
COMMENT ON COLUMN public.game_sessions.status IS 'active, completed, or abandoned';
COMMENT ON COLUMN public.game_sessions.metadata IS 'Extra context (client info, etc.)';

COMMENT ON COLUMN public.game_progress.game_state IS 'Unity game state as JSON (pots, camera, unlocks, etc.)';
COMMENT ON COLUMN public.game_progress.version IS 'Schema version for migrations';

-- =======================
-- 7. GRANT PERMISSIONS
-- =======================

-- Grant access to authenticated users
GRANT SELECT, INSERT, UPDATE ON public.game_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.game_progress TO authenticated;

-- Grant usage on utility functions
GRANT EXECUTE ON FUNCTION get_active_game_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_abandoned_sessions() TO authenticated;

-- =======================
-- SUCCESS
-- =======================

-- Analyze tables for query optimization
ANALYZE public.game_sessions;
ANALYZE public.game_progress;

-- Done!
DO $$
BEGIN
  RAISE NOTICE '✅ Unity game tables created successfully!';
  RAISE NOTICE '   - game_sessions (with RLS)';
  RAISE NOTICE '   - game_progress (with RLS)';
  RAISE NOTICE '   - Helper functions added';
  RAISE NOTICE '   - Indexes created';
END $$;

