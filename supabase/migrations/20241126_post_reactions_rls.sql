-- Add RLS policies for post_reactions table

-- Enable RLS
ALTER TABLE public.post_reactions ENABLE ROW LEVEL SECURITY;

-- Anyone can read reactions
CREATE POLICY "reactions_read_all" ON public.post_reactions
  FOR SELECT USING (true);

-- Users can insert their own reactions
CREATE POLICY "reactions_insert_own" ON public.post_reactions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own reactions
CREATE POLICY "reactions_delete_own" ON public.post_reactions
  FOR DELETE USING (auth.uid() = user_id);

