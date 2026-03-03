-- Posts Table Compatibility Fix for Week 3
-- Adds missing columns to posts table for Week 3 features

-- Add profile_id to posts (alongside author_id for compatibility)
ALTER TABLE public.posts
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS hobby_group TEXT,
  ADD COLUMN IF NOT EXISTS title TEXT;

-- Backfill profile_id from author_id (user_id)
UPDATE public.posts po
SET profile_id = p.id
FROM public.profiles p
WHERE po.author_id = p.user_id AND po.profile_id IS NULL;

-- Backfill hobby_group from group_slug (convert to friendly name)
UPDATE public.posts
SET hobby_group = CASE group_slug
  WHEN 'indoor-plants' THEN 'Indoor Plants'
  WHEN 'succulents' THEN 'Succulents & Cacti'
  WHEN 'herbs' THEN 'Herbs & Edibles'
  WHEN 'orchids' THEN 'Orchids'
  WHEN 'bonsai' THEN 'Bonsai'
  WHEN 'propagation' THEN 'Propagation Tips'
  ELSE 'Indoor Plants'
END
WHERE hobby_group IS NULL;

-- Backfill title from first 50 chars of content
UPDATE public.posts
SET title = SUBSTRING(content, 1, 50)
WHERE title IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_posts_profile_id ON public.posts(profile_id);
CREATE INDEX IF NOT EXISTS idx_posts_hobby_group ON public.posts(hobby_group);

-- Add profile_id to comments (alongside author_id for compatibility)
ALTER TABLE public.comments
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Backfill profile_id from author_id
UPDATE public.comments c
SET profile_id = p.id
FROM public.profiles p
WHERE c.author_id = p.user_id AND c.profile_id IS NULL;

-- Create index
CREATE INDEX IF NOT EXISTS idx_comments_profile_id ON public.comments(profile_id);

-- Create post_reactions table (likes/reactions on posts)
CREATE TABLE IF NOT EXISTS public.post_reactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like' CHECK (reaction_type IN ('like')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(post_id, user_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_post_reactions_post_id ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_user_id ON public.post_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_profile_id ON public.post_reactions(profile_id);

