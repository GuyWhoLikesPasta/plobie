-- ============================================
-- FIX: post_reactions RLS to allow viewing all likes
-- Run in: https://supabase.com/dashboard/project/puhblesoxhizcfuubphh/sql/new
-- ============================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "post_reactions_select_own" ON public.post_reactions;
DROP POLICY IF EXISTS "Users can view their own reactions" ON public.post_reactions;

-- Create policy allowing everyone to SEE all reactions (for like counts)
CREATE POLICY "post_reactions_select_all" ON public.post_reactions
    FOR SELECT TO authenticated USING (true);

-- Policy for inserting your own reactions
DROP POLICY IF EXISTS "post_reactions_insert_own" ON public.post_reactions;
CREATE POLICY "post_reactions_insert_own" ON public.post_reactions
    FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Policy for deleting your own reactions
DROP POLICY IF EXISTS "post_reactions_delete_own" ON public.post_reactions;
CREATE POLICY "post_reactions_delete_own" ON public.post_reactions
    FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Grant necessary permissions
GRANT SELECT, INSERT, DELETE ON public.post_reactions TO authenticated;
