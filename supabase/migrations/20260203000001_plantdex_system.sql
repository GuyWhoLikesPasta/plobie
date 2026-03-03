-- ============================================
-- PLANTDEX SYSTEM
-- Plant encyclopedia and user plant collection
-- Created: February 3, 2026
-- ============================================

-- ============================================
-- 1. PLANTS TABLE (Encyclopedia)
-- All plant species available in the game
-- ============================================
CREATE TABLE IF NOT EXISTS public.plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL, -- e.g., "succulent_jade", "fern_boston"
  name TEXT NOT NULL, -- Display name: "Jade Plant"
  category TEXT NOT NULL DEFAULT 'other', -- succulent, fern, herb, flower, tree, other
  description TEXT,
  care_difficulty INT DEFAULT 1 CHECK (care_difficulty >= 1 AND care_difficulty <= 5),
  water_frequency TEXT DEFAULT 'weekly', -- daily, twice-weekly, weekly, biweekly, monthly
  sunlight TEXT DEFAULT 'partial', -- full, partial, shade
  image_url TEXT,
  icon TEXT, -- emoji or icon code
  xp_reward INT DEFAULT 100, -- XP for growing to maturity
  growth_stages INT DEFAULT 5, -- number of growth stages
  growth_time_hours INT DEFAULT 168, -- hours to reach maturity (default 1 week)
  is_premium BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_plants_key ON public.plants(key);
CREATE INDEX IF NOT EXISTS idx_plants_category ON public.plants(category);

-- ============================================
-- 2. USER_PLANTS TABLE (User Collection)
-- Plants owned/grown by users
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_plants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL, -- References auth.users.id
  plant_id UUID NOT NULL REFERENCES public.plants(id) ON DELETE CASCADE,
  pot_id UUID, -- linked physical pot (optional, no FK constraint)
  nickname TEXT, -- custom name
  growth_stage INT DEFAULT 1 CHECK (growth_stage >= 1),
  health INT DEFAULT 100 CHECK (health >= 0 AND health <= 100),
  water_level INT DEFAULT 100 CHECK (water_level >= 0 AND water_level <= 100),
  last_watered_at TIMESTAMPTZ DEFAULT NOW(),
  last_cared_at TIMESTAMPTZ DEFAULT NOW(),
  planted_at TIMESTAMPTZ DEFAULT NOW(),
  matured_at TIMESTAMPTZ, -- when plant reached final growth stage
  is_dead BOOLEAN DEFAULT FALSE,
  xp_earned INT DEFAULT 0, -- total XP earned from this plant
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_user_plants_user_id ON public.user_plants(user_id);
CREATE INDEX IF NOT EXISTS idx_user_plants_plant_id ON public.user_plants(plant_id);
CREATE INDEX IF NOT EXISTS idx_user_plants_pot_id ON public.user_plants(pot_id);

-- ============================================
-- 3. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.plants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_plants ENABLE ROW LEVEL SECURITY;

-- Plants: Everyone can read the encyclopedia
CREATE POLICY "plants_select_all" ON public.plants
  FOR SELECT USING (true);

-- Plants: Only admins can modify (check auth.users metadata or skip admin check for now)
CREATE POLICY "plants_insert_admin" ON public.plants
  FOR INSERT WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "plants_update_admin" ON public.plants
  FOR UPDATE USING (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "plants_delete_admin" ON public.plants
  FOR DELETE USING (
    auth.uid() IS NOT NULL
  );

-- User Plants: Users can only access their own plants
CREATE POLICY "user_plants_select_own" ON public.user_plants
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_plants_insert_own" ON public.user_plants
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "user_plants_update_own" ON public.user_plants
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "user_plants_delete_own" ON public.user_plants
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. UPDATED_AT TRIGGER
-- ============================================
-- First create the function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE TRIGGER user_plants_updated_at
  BEFORE UPDATE ON public.user_plants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. SEED DATA - Initial Plant Encyclopedia
-- ============================================
INSERT INTO public.plants (key, name, category, description, care_difficulty, water_frequency, sunlight, icon, xp_reward, growth_stages, growth_time_hours) VALUES
  -- Succulents (Easy)
  ('succulent_jade', 'Jade Plant', 'succulent', 'A classic succulent with thick, glossy leaves. Symbol of good luck and prosperity.', 1, 'biweekly', 'partial', '🪴', 100, 5, 336),
  ('succulent_aloe', 'Aloe Vera', 'succulent', 'Medicinal succulent with soothing gel. Great for beginners.', 1, 'biweekly', 'full', '🌵', 100, 5, 336),
  ('succulent_echeveria', 'Echeveria', 'succulent', 'Beautiful rosette-shaped succulent in various colors.', 2, 'biweekly', 'full', '🌸', 120, 5, 288),
  
  -- Ferns (Medium)
  ('fern_boston', 'Boston Fern', 'fern', 'Lush, feathery fronds that purify the air.', 3, 'twice-weekly', 'shade', '🌿', 150, 6, 240),
  ('fern_maidenhair', 'Maidenhair Fern', 'fern', 'Delicate, fan-shaped leaves on dark stems.', 4, 'daily', 'shade', '🍀', 200, 6, 288),
  
  -- Herbs (Easy-Medium)
  ('herb_basil', 'Basil', 'herb', 'Aromatic herb perfect for cooking. Harvest regularly for bushier growth.', 2, 'daily', 'full', '🌱', 80, 4, 168),
  ('herb_mint', 'Mint', 'herb', 'Fast-growing herb with refreshing flavor. Great for drinks and dishes.', 1, 'daily', 'partial', '🌿', 60, 4, 120),
  ('herb_rosemary', 'Rosemary', 'herb', 'Fragrant Mediterranean herb. Drought-tolerant once established.', 2, 'weekly', 'full', '🌲', 100, 5, 240),
  
  -- Flowers (Medium)
  ('flower_peace_lily', 'Peace Lily', 'flower', 'Elegant white blooms and air-purifying qualities.', 2, 'weekly', 'shade', '🤍', 150, 5, 336),
  ('flower_orchid', 'Orchid', 'flower', 'Exotic beauty with long-lasting blooms.', 4, 'weekly', 'partial', '🌺', 250, 7, 504),
  ('flower_african_violet', 'African Violet', 'flower', 'Compact flowering plant with velvety leaves.', 3, 'twice-weekly', 'partial', '💜', 120, 5, 240),
  
  -- Trees (Hard)
  ('tree_bonsai_ficus', 'Ficus Bonsai', 'tree', 'Miniature tree art. Requires patience and skill.', 5, 'twice-weekly', 'partial', '🌳', 500, 10, 720),
  ('tree_money_tree', 'Money Tree', 'tree', 'Braided trunk brings good fortune. Easy-care tree.', 2, 'weekly', 'partial', '💰', 200, 6, 504),
  
  -- Cacti (Easy)
  ('cactus_prickly_pear', 'Prickly Pear', 'succulent', 'Classic paddle-shaped cactus with edible fruit.', 1, 'monthly', 'full', '🌵', 80, 4, 480),
  ('cactus_barrel', 'Barrel Cactus', 'succulent', 'Round, ribbed cactus that stores water.', 1, 'monthly', 'full', '🏜️', 100, 5, 600)
ON CONFLICT (key) DO NOTHING;

-- ============================================
-- DONE
-- ============================================
