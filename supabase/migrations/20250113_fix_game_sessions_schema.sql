-- Fix game_sessions table schema
-- Add missing columns needed for Unity integration

-- Add status column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'game_sessions' 
    AND column_name = 'status'
  ) THEN
    ALTER TABLE public.game_sessions 
    ADD COLUMN status TEXT NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'completed', 'abandoned'));
  END IF;
END $$;

-- Add metadata column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'game_sessions' 
    AND column_name = 'metadata'
  ) THEN
    ALTER TABLE public.game_sessions 
    ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
  END IF;
END $$;

-- Add ended_at column if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'game_sessions' 
    AND column_name = 'ended_at'
  ) THEN
    ALTER TABLE public.game_sessions 
    ADD COLUMN ended_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add xp_earned column if not exists (maps to xp_awarded)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'game_sessions' 
    AND column_name = 'xp_earned'
  ) THEN
    -- Check if xp_awarded exists and rename it
    IF EXISTS (
      SELECT 1 FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'game_sessions' 
      AND column_name = 'xp_awarded'
    ) THEN
      ALTER TABLE public.game_sessions RENAME COLUMN xp_awarded TO xp_earned;
    ELSE
      ALTER TABLE public.game_sessions 
      ADD COLUMN xp_earned INT DEFAULT 0 CHECK (xp_earned >= 0);
    END IF;
  END IF;
END $$;

-- Add created_at and updated_at if not exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'game_sessions' 
    AND column_name = 'created_at'
  ) THEN
    ALTER TABLE public.game_sessions 
    ADD COLUMN created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'game_sessions' 
    AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE public.game_sessions 
    ADD COLUMN updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
  END IF;
END $$;

-- Make duration_minutes nullable (session starts without duration)
ALTER TABLE public.game_sessions 
ALTER COLUMN duration_minutes DROP NOT NULL;

-- Drop the duration > 0 check if exists (allow 0 or null)
DO $$
BEGIN
  ALTER TABLE public.game_sessions DROP CONSTRAINT IF EXISTS game_sessions_duration_minutes_check;
  ALTER TABLE public.game_sessions ADD CONSTRAINT game_sessions_duration_minutes_check CHECK (duration_minutes >= 0 OR duration_minutes IS NULL);
EXCEPTION WHEN OTHERS THEN
  NULL;
END $$;

-- Create index on status for active session queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status) WHERE status = 'active';

-- Update RLS policies
DROP POLICY IF EXISTS "game_sessions_select_own" ON public.game_sessions;
CREATE POLICY "game_sessions_select_own" ON public.game_sessions 
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "game_sessions_insert_own" ON public.game_sessions;
CREATE POLICY "game_sessions_insert_own" ON public.game_sessions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "game_sessions_update_own" ON public.game_sessions;
CREATE POLICY "game_sessions_update_own" ON public.game_sessions 
  FOR UPDATE USING (auth.uid() = user_id);

-- Drop old combined policy if exists
DROP POLICY IF EXISTS "game_sessions_rw_own" ON public.game_sessions;

-- Make game_slug nullable and set default (old column from initial schema)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'game_sessions' 
    AND column_name = 'game_slug'
  ) THEN
    ALTER TABLE public.game_sessions ALTER COLUMN game_slug DROP NOT NULL;
    ALTER TABLE public.game_sessions ALTER COLUMN game_slug SET DEFAULT 'garden';
  END IF;
END $$;

RAISE NOTICE 'game_sessions schema updated successfully';
