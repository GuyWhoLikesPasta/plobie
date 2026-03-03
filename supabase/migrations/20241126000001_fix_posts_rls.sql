-- Fix posts RLS policy to handle NULL hidden values

DROP POLICY IF EXISTS "posts_read_visible" ON public.posts;

CREATE POLICY "posts_read_visible" ON public.posts
  FOR SELECT USING (
    COALESCE(hidden, false) = false OR auth.uid() = author_id
  );

