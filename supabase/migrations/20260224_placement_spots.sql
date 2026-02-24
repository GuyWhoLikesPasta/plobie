-- =============================================
-- Placement Spots: predefined garden positions
-- =============================================

CREATE TABLE IF NOT EXISTS public.placement_spots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL,
  slot_index INT NOT NULL CHECK (slot_index >= 0),
  label TEXT DEFAULT '',
  position_x FLOAT DEFAULT 0,
  position_y FLOAT DEFAULT 0,
  position_z FLOAT DEFAULT 0,
  rotation_y FLOAT DEFAULT 0,
  pot_id UUID,
  user_plant_id UUID REFERENCES public.user_plants(id) ON DELETE SET NULL,
  is_occupied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, slot_index)
);

ALTER TABLE public.placement_spots ENABLE ROW LEVEL SECURITY;

CREATE POLICY placement_spots_select ON public.placement_spots
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY placement_spots_insert ON public.placement_spots
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY placement_spots_update ON public.placement_spots
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY placement_spots_delete ON public.placement_spots
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_placement_spots_user
  ON public.placement_spots(user_id);

CREATE TRIGGER update_placement_spots_updated_at
  BEFORE UPDATE ON public.placement_spots
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
