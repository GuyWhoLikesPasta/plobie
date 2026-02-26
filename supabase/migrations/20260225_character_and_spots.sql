-- Character selection + placement spots scaling
-- Run in Supabase Dashboard SQL Editor

-- ==============================================
-- 1. Character model selection on profiles
-- ==============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS character_model_id TEXT;

-- ==============================================
-- 2. Placement spots scaling
-- ==============================================
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS max_placement_spots INT DEFAULT 6 CHECK (max_placement_spots >= 1);
