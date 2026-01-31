-- ============================================
-- FIX: Create missing profiles for auth users
-- Run in: https://supabase.com/dashboard/project/puhblesoxhizcfuubphh/sql/new
-- ============================================

-- profiles: id, username, full_name, bio, avatar_url, is_admin, created_at, updated_at
-- xp_balances: profile_id, total_xp, daily_xp, last_reset_, created_at, updated_at

-- Step 1: Create missing profiles
INSERT INTO public.profiles (id, username, created_at, updated_at)
SELECT
    au.id,
    SPLIT_PART(au.email, '@', 1) as username,
    au.created_at,
    NOW()
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Step 2: Create missing xp_balances
INSERT INTO public.xp_balances (profile_id, total_xp, daily_xp, created_at, updated_at)
SELECT
    p.id as profile_id,
    0 as total_xp,
    0 as daily_xp,
    NOW(),
    NOW()
FROM public.profiles p
LEFT JOIN public.xp_balances xb ON p.id = xb.profile_id
WHERE xb.profile_id IS NULL
ON CONFLICT (profile_id) DO NOTHING;

-- Step 3: Show results
SELECT
    p.id,
    p.username,
    p.created_at,
    xb.total_xp,
    xb.daily_xp
FROM public.profiles p
LEFT JOIN public.xp_balances xb ON p.id = xb.profile_id
ORDER BY p.created_at DESC
LIMIT 20;
