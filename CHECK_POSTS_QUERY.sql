-- Run this in Supabase SQL Editor to check if posts exist

-- Check if posts table has data
SELECT 
  id,
  author_id,
  profile_id,
  group_slug,
  hobby_group,
  title,
  content,
  hidden,
  created_at
FROM public.posts
ORDER BY created_at DESC
LIMIT 10;

-- Check if the user's posts are visible
SELECT 
  p.id,
  p.title,
  p.hidden,
  p.author_id,
  p.profile_id,
  prof.username
FROM public.posts p
LEFT JOIN public.profiles prof ON p.author_id = prof.user_id
ORDER BY p.created_at DESC
LIMIT 10;

-- Check RLS policy by trying to read as anonymous
SET ROLE anon;
SELECT * FROM public.posts LIMIT 5;
RESET ROLE;

