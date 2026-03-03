-- ============================================
-- PLANTDEX SCHEMA V2
-- Connor's expanded requirements
-- Run in: https://supabase.com/dashboard/project/puhblesoxhizcfuubphh/sql/new
-- ============================================

-- ============================================
-- 1. EXPAND PLANTS TABLE (Encyclopedia)
-- Add Connor's plant categories
-- ============================================

-- Primary/Secondary Type (e.g., "Succulent", "Tropical")
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS primary_type TEXT;
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS secondary_type TEXT;

-- Light Class (e.g., "low", "medium", "bright-indirect", "direct")
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS light_class TEXT DEFAULT 'medium';

-- Water Rhythm (renamed from water_frequency for clarity)
-- Already have water_frequency, so this is just a note

-- Growth Habit (e.g., "upright", "trailing", "rosette", "climbing", "spreading")
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS growth_habit TEXT;

-- Toxicity (for pet/child safety)
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS toxicity TEXT DEFAULT 'safe'; -- safe, mild, toxic
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS toxic_to_pets BOOLEAN DEFAULT FALSE;
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS toxic_to_humans BOOLEAN DEFAULT FALSE;

-- Origin Biome (e.g., "tropical", "desert", "temperate", "mediterranean")
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS origin_biome TEXT;

-- Rarity (for gamification)
ALTER TABLE public.plants ADD COLUMN IF NOT EXISTS rarity TEXT DEFAULT 'common'; -- common, uncommon, rare, epic, legendary

-- ============================================
-- 2. EXPAND USER_PLANTS TABLE
-- Add Unity positioning + care tracking
-- ============================================

-- Unity 3D positioning
ALTER TABLE public.user_plants ADD COLUMN IF NOT EXISTS position_x FLOAT DEFAULT 0;
ALTER TABLE public.user_plants ADD COLUMN IF NOT EXISTS position_y FLOAT DEFAULT 0;
ALTER TABLE public.user_plants ADD COLUMN IF NOT EXISTS position_z FLOAT DEFAULT 0;
ALTER TABLE public.user_plants ADD COLUMN IF NOT EXISTS rotation_x FLOAT DEFAULT 0;
ALTER TABLE public.user_plants ADD COLUMN IF NOT EXISTS rotation_y FLOAT DEFAULT 0;
ALTER TABLE public.user_plants ADD COLUMN IF NOT EXISTS rotation_z FLOAT DEFAULT 0;
ALTER TABLE public.user_plants ADD COLUMN IF NOT EXISTS scale FLOAT DEFAULT 1.0;

-- Visibility/Placement state
ALTER TABLE public.user_plants ADD COLUMN IF NOT EXISTS is_placed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.user_plants ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT TRUE;

-- Additional care tracking
ALTER TABLE public.user_plants ADD COLUMN IF NOT EXISTS last_fertilized_at TIMESTAMPTZ;
ALTER TABLE public.user_plants ADD COLUMN IF NOT EXISTS last_potted_at TIMESTAMPTZ;

-- Rename pot_id to pot_instance_id for clarity (links to physical QR pot)
-- Note: pot_id already exists, just documenting it references pot_claims.pot_id

-- ============================================
-- 3. CREATE INDEXES for new columns
-- ============================================
CREATE INDEX IF NOT EXISTS idx_plants_primary_type ON public.plants(primary_type);
CREATE INDEX IF NOT EXISTS idx_plants_light_class ON public.plants(light_class);
CREATE INDEX IF NOT EXISTS idx_plants_toxicity ON public.plants(toxicity);
CREATE INDEX IF NOT EXISTS idx_plants_rarity ON public.plants(rarity);
CREATE INDEX IF NOT EXISTS idx_user_plants_is_placed ON public.user_plants(is_placed);

-- ============================================
-- 4. UPDATE EXISTING PLANTS with new attributes
-- (Basic defaults - Connor can refine later)
-- ============================================

-- Succulents
UPDATE public.plants SET 
  primary_type = 'Succulent',
  light_class = 'bright-indirect',
  growth_habit = 'rosette',
  toxicity = 'safe',
  toxic_to_pets = FALSE,
  origin_biome = 'desert',
  rarity = 'common'
WHERE category = 'succulent';

-- Ferns
UPDATE public.plants SET 
  primary_type = 'Fern',
  light_class = 'low',
  growth_habit = 'spreading',
  toxicity = 'safe',
  toxic_to_pets = FALSE,
  origin_biome = 'tropical',
  rarity = 'uncommon'
WHERE category = 'fern';

-- Herbs
UPDATE public.plants SET 
  primary_type = 'Herb',
  light_class = 'bright-indirect',
  growth_habit = 'upright',
  toxicity = 'safe',
  toxic_to_pets = FALSE,
  origin_biome = 'mediterranean',
  rarity = 'common'
WHERE category = 'herb';

-- Flowers
UPDATE public.plants SET 
  primary_type = 'Flowering',
  light_class = 'medium',
  growth_habit = 'upright',
  toxicity = 'mild',
  toxic_to_pets = TRUE,
  origin_biome = 'tropical',
  rarity = 'uncommon'
WHERE category = 'flower';

-- Trees
UPDATE public.plants SET 
  primary_type = 'Tree',
  light_class = 'bright-indirect',
  growth_habit = 'upright',
  toxicity = 'mild',
  toxic_to_pets = TRUE,
  origin_biome = 'tropical',
  rarity = 'rare'
WHERE category = 'tree';

-- Special rarity adjustments
UPDATE public.plants SET rarity = 'rare' WHERE key = 'flower_orchid';
UPDATE public.plants SET rarity = 'epic' WHERE key = 'tree_bonsai_ficus';
UPDATE public.plants SET rarity = 'rare' WHERE key = 'fern_staghorn';
UPDATE public.plants SET rarity = 'uncommon' WHERE key = 'foliage_monstera';

-- ============================================
-- DONE - Verify changes
-- ============================================
SELECT 
  name,
  primary_type,
  light_class,
  growth_habit,
  toxicity,
  toxic_to_pets,
  origin_biome,
  rarity
FROM public.plants
ORDER BY rarity DESC, name
LIMIT 10;
