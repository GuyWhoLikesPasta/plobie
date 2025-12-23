-- Clean Slate: Drop all existing tables to start fresh
-- Run this FIRST before running the initial_schema.sql

-- Drop existing tables (Connor's previous setup)
drop table if exists public.user_badges cascade;
drop table if exists public.badges cascade;
drop table if exists public.game_scores cascade;
drop table if exists public.transactions cascade;
drop table if exists public.plants cascade;
drop table if exists public.events cascade;
drop table if exists public.pots cascade;
drop table if exists public.profiles cascade;
drop table if exists public.products cascade;
drop table if exists public.users cascade;

-- Drop any existing types
drop type if exists public.order_status cascade;
drop type if exists public.audit_type cascade;

-- Drop any existing functions/triggers
drop function if exists public.handle_new_user cascade;
drop function if exists public.update_updated_at_column cascade;
drop function if exists public.apply_xp cascade;

-- Clean slate ready for fresh migration

-- Enable UUID extension
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- Enums
do $$ begin
  create type public.order_status as enum ('pending','paid','failed','refunded');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.audit_type as enum ('stripe_event','xp_award','login','admin_action','pot_claim','error');
exception when duplicate_object then null; end $$;

--------------------------------------------------------------------------------
-- Core Tables
--------------------------------------------------------------------------------

-- Users table (mirrors auth.users)
create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  created_at timestamptz default now()
);

-- Profiles
create table if not exists public.profiles (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade unique not null,
  username text unique not null,
  avatar_url text,
  xp_total int default 0 check (xp_total >= 0),
  is_admin boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_profiles_user_id on public.profiles(user_id);
create index if not exists idx_profiles_username on public.profiles(username);
create index if not exists idx_profiles_is_admin on public.profiles(is_admin) where is_admin = true;

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users(id, email)
  values (new.id, new.email)
  on conflict do nothing;
  
  insert into public.profiles(user_id, username)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email,'@',1)))
  on conflict do nothing;
  
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

--------------------------------------------------------------------------------
-- Pots and Claims
--------------------------------------------------------------------------------

create table if not exists public.pots (
  id uuid primary key default uuid_generate_v4(),
  code text unique not null check (length(code) >= 6),
  design text,
  size text,
  created_at timestamptz default now()
);

create index if not exists idx_pots_code on public.pots(code);

create table if not exists public.pot_claims (
  id uuid primary key default uuid_generate_v4(),
  pot_id uuid references public.pots(id) on delete cascade unique not null,
  user_id uuid references public.users(id) on delete cascade not null,
  xp_awarded int default 50,
  claimed_at timestamptz default now()
);

create index if not exists idx_pot_claims_user_id on public.pot_claims(user_id);
create unique index if not exists idx_pot_claims_pot_id_unique on public.pot_claims(pot_id);

--------------------------------------------------------------------------------
-- XP System
--------------------------------------------------------------------------------

create table if not exists public.xp_events (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  action_type text not null check (action_type in (
    'post_create', 'comment_create', 'learn_read', 'game_play_30m', 'pot_link', 'admin_adjust'
  )),
  amount int not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_xp_events_user_id on public.xp_events(user_id);
create index if not exists idx_xp_events_created_at on public.xp_events(created_at desc);
create index if not exists idx_xp_events_action_type on public.xp_events(action_type);

create table if not exists public.xp_balances (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade unique not null,
  balance int default 0 check (balance >= 0),
  updated_at timestamptz default now()
);

create index if not exists idx_xp_balances_user_id on public.xp_balances(user_id);

-- Stored procedure to apply XP (atomic operation with idempotency)
create or replace function public.apply_xp(
  p_user uuid,
  p_amount int,
  p_action text,
  p_metadata jsonb default '{}'::jsonb
)
returns void language plpgsql security definer as $$
begin
  -- Insert XP event
  insert into public.xp_events(user_id, amount, action_type, metadata)
  values (p_user, p_amount, p_action, p_metadata);
  
  -- Update balance
  insert into public.xp_balances(user_id, balance)
  values (p_user, greatest(0, p_amount))
  on conflict (user_id) do update
    set balance = public.xp_balances.balance + excluded.balance,
        updated_at = now();
  
  -- Update profile denormalized total
  update public.profiles
    set xp_total = (select balance from public.xp_balances where user_id = p_user)
    where user_id = p_user;
end $$;

--------------------------------------------------------------------------------
-- Products and Orders
--------------------------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  description text,
  stripe_product_id text,
  featured boolean default false,
  category text default 'pottery',
  created_at timestamptz default now()
);

create index if not exists idx_products_featured on public.products(featured) where featured = true;

create table if not exists public.product_variants (
  id uuid primary key default uuid_generate_v4(),
  product_id uuid references public.products(id) on delete cascade not null,
  sku text unique not null,
  size text,
  color text,
  price_cents int not null check (price_cents > 0),
  stripe_price_id text,
  stock_qty int default 0 check (stock_qty >= 0),
  created_at timestamptz default now()
);

create index if not exists idx_product_variants_product_id on public.product_variants(product_id);
create index if not exists idx_product_variants_sku on public.product_variants(sku);

create table if not exists public.orders (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  stripe_session_id text unique,
  stripe_payment_intent_id text,
  status public.order_status default 'pending',
  total_cents int not null,
  shipping_address jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_orders_user_id on public.orders(user_id);
create index if not exists idx_orders_stripe_session_id on public.orders(stripe_session_id);
create index if not exists idx_orders_status on public.orders(status);

create table if not exists public.order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references public.orders(id) on delete cascade not null,
  variant_id uuid references public.product_variants(id) on delete set null,
  quantity int not null check (quantity > 0),
  price_cents int not null,
  created_at timestamptz default now()
);

create index if not exists idx_order_items_order_id on public.order_items(order_id);

--------------------------------------------------------------------------------
-- Community (Hobbies)
--------------------------------------------------------------------------------

create table if not exists public.posts (
  id uuid primary key default uuid_generate_v4(),
  author_id uuid references public.users(id) on delete cascade not null,
  group_slug text not null,
  content text not null,
  image_url text,
  hidden boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_posts_group_slug on public.posts(group_slug);
create index if not exists idx_posts_author_id on public.posts(author_id);
create index if not exists idx_posts_created_at on public.posts(created_at desc);

create table if not exists public.comments (
  id uuid primary key default uuid_generate_v4(),
  post_id uuid references public.posts(id) on delete cascade not null,
  author_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  hidden boolean default false,
  created_at timestamptz default now()
);

create index if not exists idx_comments_post_id on public.comments(post_id);
create index if not exists idx_comments_author_id on public.comments(author_id);

create table if not exists public.reports (
  id uuid primary key default uuid_generate_v4(),
  reporter_id uuid references public.users(id) on delete cascade not null,
  entity_type text not null check (entity_type in ('post', 'comment', 'profile')),
  entity_id uuid not null,
  reason text not null,
  status text default 'pending' check (status in ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at timestamptz default now()
);

create index if not exists idx_reports_status on public.reports(status);
create index if not exists idx_reports_entity on public.reports(entity_type, entity_id);

--------------------------------------------------------------------------------
-- Games
--------------------------------------------------------------------------------

create table if not exists public.game_sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete cascade not null,
  game_slug text not null,
  duration_minutes int not null check (duration_minutes > 0),
  xp_awarded int default 0,
  started_at timestamptz default now()
);

create index if not exists idx_game_sessions_user_id on public.game_sessions(user_id);
create index if not exists idx_game_sessions_started_at on public.game_sessions(started_at desc);

--------------------------------------------------------------------------------
-- Feature Flags
--------------------------------------------------------------------------------

create table if not exists public.feature_flags (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  enabled boolean default false,
  description text,
  updated_at timestamptz default now()
);

create index if not exists idx_feature_flags_key on public.feature_flags(key);

--------------------------------------------------------------------------------
-- Audit Logs (includes Stripe event dedupe)
--------------------------------------------------------------------------------

create table if not exists public.audit_logs (
  id uuid primary key default uuid_generate_v4(),
  user_id uuid references public.users(id) on delete set null,
  action text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create index if not exists idx_audit_logs_user_id on public.audit_logs(user_id);
create index if not exists idx_audit_logs_action on public.audit_logs(action);
create index if not exists idx_audit_logs_created_at on public.audit_logs(created_at desc);

-- Stripe webhook event dedupe
create table if not exists public.stripe_events (
  id text primary key, -- stripe event.id
  type text not null,
  processed_at timestamptz default now()
);

create index if not exists idx_stripe_events_type on public.stripe_events(type);

--------------------------------------------------------------------------------
-- Triggers
--------------------------------------------------------------------------------

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Apply triggers
drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.update_updated_at_column();

drop trigger if exists orders_updated_at on public.orders;
create trigger orders_updated_at before update on public.orders
  for each row execute function public.update_updated_at_column();

drop trigger if exists xp_balances_updated_at on public.xp_balances;
create trigger xp_balances_updated_at before update on public.xp_balances
  for each row execute function public.update_updated_at_column();

drop trigger if exists feature_flags_updated_at on public.feature_flags;
create trigger feature_flags_updated_at before update on public.feature_flags
  for each row execute function public.update_updated_at_column();

--------------------------------------------------------------------------------
-- Row Level Security (RLS) Policies
--------------------------------------------------------------------------------

-- Enable RLS on all tables
alter table public.profiles enable row level security;
alter table public.pots enable row level security;
alter table public.pot_claims enable row level security;
alter table public.xp_events enable row level security;
alter table public.xp_balances enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reports enable row level security;
alter table public.game_sessions enable row level security;
alter table public.feature_flags enable row level security;
alter table public.audit_logs enable row level security;

--------------------------------------------------------------------------------
-- Profiles
--------------------------------------------------------------------------------

create policy "profiles_read_all" on public.profiles
  for select using (true);

create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- Pots and Claims
--------------------------------------------------------------------------------

create policy "pots_read_all" on public.pots
  for select using (true);

create policy "pot_claims_insert_unclaimed" on public.pot_claims
  for insert with check (
    auth.uid() = user_id
    and not exists (select 1 from public.pot_claims pc where pc.pot_id = pot_id)
  );

create policy "pot_claims_read_own" on public.pot_claims
  for select using (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- XP System
--------------------------------------------------------------------------------

create policy "xp_events_read_own" on public.xp_events
  for select using (auth.uid() = user_id);

create policy "xp_balances_read_own" on public.xp_balances
  for select using (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- Products (public read)
--------------------------------------------------------------------------------

create policy "products_read_all" on public.products
  for select using (true);

create policy "product_variants_read_all" on public.product_variants
  for select using (true);

--------------------------------------------------------------------------------
-- Orders
--------------------------------------------------------------------------------

create policy "orders_read_own" on public.orders
  for select using (auth.uid() = user_id);

create policy "orders_insert_own" on public.orders
  for insert with check (auth.uid() = user_id);

create policy "order_items_read_own" on public.order_items
  for select using (
    exists (select 1 from public.orders o where o.id = order_id and o.user_id = auth.uid())
  );

--------------------------------------------------------------------------------
-- Posts and Comments
--------------------------------------------------------------------------------

create policy "posts_read_visible" on public.posts
  for select using (not hidden or auth.uid() = author_id);

create policy "posts_insert_own" on public.posts
  for insert with check (auth.uid() = author_id);

create policy "posts_update_own" on public.posts
  for update using (auth.uid() = author_id);

create policy "comments_read_visible" on public.comments
  for select using (not hidden or auth.uid() = author_id);

create policy "comments_insert_own" on public.comments
  for insert with check (auth.uid() = author_id);

create policy "comments_update_own" on public.comments
  for update using (auth.uid() = author_id);

--------------------------------------------------------------------------------
-- Reports
--------------------------------------------------------------------------------

create policy "reports_insert_own" on public.reports
  for insert with check (auth.uid() = reporter_id);

create policy "reports_read_own_or_admin" on public.reports
  for select using (
    auth.uid() = reporter_id
    or exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true)
  );

--------------------------------------------------------------------------------
-- Game Sessions
--------------------------------------------------------------------------------

create policy "game_sessions_rw_own" on public.game_sessions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

--------------------------------------------------------------------------------
-- Feature Flags (public read, admin write)
--------------------------------------------------------------------------------

create policy "feature_flags_read_all" on public.feature_flags
  for select using (true);

create policy "feature_flags_write_admin" on public.feature_flags
  for all using (
    exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true)
  );

--------------------------------------------------------------------------------
-- Audit Logs (admin read only)
--------------------------------------------------------------------------------

create policy "audit_logs_read_admin" on public.audit_logs
  for select using (
    exists (select 1 from public.profiles p where p.user_id = auth.uid() and p.is_admin = true)
  );

-- Compatibility Fix for Week 3
-- This adds the missing columns and stored procedure needed for Week 3 features

-- Add profile_id to xp_events (alongside user_id for compatibility)
ALTER TABLE public.xp_events 
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS reference_type TEXT,
  ADD COLUMN IF NOT EXISTS reference_id UUID;

-- Backfill profile_id from user_id
UPDATE public.xp_events xe
SET profile_id = p.id
FROM public.profiles p
WHERE xe.user_id = p.user_id AND xe.profile_id IS NULL;

-- Add profile_id to xp_balances (alongside user_id for compatibility)
ALTER TABLE public.xp_balances
  ADD COLUMN IF NOT EXISTS profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS total_xp INT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS level INT DEFAULT 1;

-- Backfill profile_id and total_xp from user_id and balance
UPDATE public.xp_balances xb
SET 
  profile_id = p.id,
  total_xp = COALESCE(xb.balance, 0),
  level = GREATEST(1, FLOOR(COALESCE(xb.balance, 0) / 100.0) + 1)
FROM public.profiles p
WHERE xb.user_id = p.user_id AND xb.profile_id IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_xp_events_profile_id ON public.xp_events(profile_id);
CREATE INDEX IF NOT EXISTS idx_xp_balances_profile_id ON public.xp_balances(profile_id);

-- Drop old apply_xp if it exists
DROP FUNCTION IF EXISTS public.apply_xp CASCADE;

-- Create new apply_xp stored procedure for Week 3
CREATE OR REPLACE FUNCTION public.apply_xp(
  p_profile_id UUID,
  p_action_type TEXT,
  p_amount INT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS TABLE(
  success BOOLEAN,
  xp_awarded INT,
  new_total INT,
  new_level INT,
  reason TEXT
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_user_id UUID;
  v_current_total INT;
  v_new_total INT;
  v_new_level INT;
  v_daily_total INT;
  v_action_today INT;
  v_last_action TIMESTAMPTZ;
BEGIN
  -- Get user_id for the profile
  SELECT user_id INTO v_user_id FROM public.profiles WHERE id = p_profile_id;
  
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT FALSE, 0, 0, 0, 'Profile not found'::TEXT;
    RETURN;
  END IF;

  -- Check daily total cap (100 XP/day across all actions)
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_total
  FROM public.xp_events
  WHERE profile_id = p_profile_id
    AND created_at >= CURRENT_DATE;

  IF v_daily_total >= 100 THEN
    RETURN QUERY SELECT FALSE, 0, v_daily_total, 0, 'Daily XP cap reached (100 XP/day)'::TEXT;
    RETURN;
  END IF;

  -- Check for duplicate actions (idempotency)
  IF p_reference_id IS NOT NULL THEN
    IF EXISTS (
      SELECT 1 FROM public.xp_events
      WHERE profile_id = p_profile_id
        AND action_type = p_action_type
        AND reference_id = p_reference_id
    ) THEN
      RETURN QUERY SELECT FALSE, 0, v_daily_total, 0, 'Already completed this action'::TEXT;
      RETURN;
    END IF;
  END IF;

  -- Cap the XP if it would exceed daily limit
  IF v_daily_total + p_amount > 100 THEN
    p_amount := 100 - v_daily_total;
  END IF;

  -- Insert XP event
  INSERT INTO public.xp_events (
    user_id, profile_id, action_type, amount, reference_type, reference_id
  ) VALUES (
    v_user_id, p_profile_id, p_action_type, p_amount, p_reference_type, p_reference_id
  );

  -- Get current balance
  SELECT COALESCE(total_xp, 0) INTO v_current_total
  FROM public.xp_balances
  WHERE profile_id = p_profile_id;

  -- Calculate new totals
  v_new_total := v_current_total + p_amount;
  v_new_level := GREATEST(1, FLOOR(v_new_total / 100.0) + 1);

  -- Upsert balance
  INSERT INTO public.xp_balances (user_id, profile_id, balance, total_xp, level, updated_at)
  VALUES (v_user_id, p_profile_id, v_new_total, v_new_total, v_new_level, NOW())
  ON CONFLICT (user_id) DO UPDATE
    SET balance = v_new_total,
        total_xp = v_new_total,
        level = v_new_level,
        updated_at = NOW();

  -- Update profile xp_total (denormalized)
  UPDATE public.profiles
  SET xp_total = v_new_total
  WHERE id = p_profile_id;

  -- Return success
  RETURN QUERY SELECT TRUE, p_amount, v_new_total, v_new_level, 'XP awarded successfully'::TEXT;
END;
$$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.apply_xp TO authenticated;

-- Fix posts RLS policy to handle NULL hidden values

DROP POLICY IF EXISTS "posts_read_visible" ON public.posts;

CREATE POLICY "posts_read_visible" ON public.posts
  FOR SELECT USING (
    COALESCE(hidden, false) = false OR auth.uid() = author_id
  );

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

-- Reactions/Likes System
-- Users can like posts and comments

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  profile_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
  comment_id UUID REFERENCES comments(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL DEFAULT 'like', -- 'like', 'love', 'haha', etc (future)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Ensure user can only react once per post/comment
  CONSTRAINT unique_user_post_reaction UNIQUE (user_id, post_id),
  CONSTRAINT unique_user_comment_reaction UNIQUE (user_id, comment_id),
  
  -- Must have either post_id or comment_id, but not both
  CONSTRAINT check_reaction_target CHECK (
    (post_id IS NOT NULL AND comment_id IS NULL) OR
    (post_id IS NULL AND comment_id IS NOT NULL)
  )
);

-- Enable RLS
ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read reactions
CREATE POLICY "Public can view reactions"
ON reactions FOR SELECT
TO public
USING (true);

-- Allow authenticated users to create reactions
CREATE POLICY "Authenticated users can create reactions"
ON reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own reactions
CREATE POLICY "Users can delete own reactions"
ON reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_reactions_post_id ON reactions(post_id);
CREATE INDEX idx_reactions_comment_id ON reactions(comment_id);
CREATE INDEX idx_reactions_user_id ON reactions(user_id);
CREATE INDEX idx_reactions_profile_id ON reactions(profile_id);

-- Function to get reaction count for a post
CREATE OR REPLACE FUNCTION get_post_reaction_count(p_post_id UUID)
RETURNS INTEGER AS $$
BEGIN
  RETURN (
    SELECT COUNT(*)
    FROM reactions
    WHERE post_id = p_post_id
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check if user has reacted to a post
CREATE OR REPLACE FUNCTION user_has_reacted_to_post(p_user_id UUID, p_post_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM reactions
    WHERE user_id = p_user_id AND post_id = p_post_id
  );
END;
$$ LANGUAGE plpgsql;

-- Storage bucket for post images
-- Creates bucket and sets up RLS policies

-- Create storage bucket for post images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload images
CREATE POLICY "Authenticated users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public read access to images
CREATE POLICY "Public read access to images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');

-- Allow users to update their own images
CREATE POLICY "Users can update own images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow users to delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- XP System Implementation
-- Stored procedure for atomic XP awarding with caps and cooldowns

-- Function to apply XP atomically
CREATE OR REPLACE FUNCTION apply_xp(
  p_profile_id UUID,
  p_action_type TEXT,
  p_amount INTEGER,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
) RETURNS TABLE (
  success BOOLEAN,
  xp_awarded INTEGER,
  reason TEXT
) AS $$
DECLARE
  v_today_start TIMESTAMP;
  v_daily_total INTEGER;
  v_action_count INTEGER;
  v_action_daily_xp INTEGER;
  v_action_cap INTEGER;
  v_daily_cap_per_action INTEGER;
  v_new_balance INTEGER;
  v_cooldown_hours INTEGER;
  v_last_action TIMESTAMP;
BEGIN
  -- Get start of current day in UTC
  v_today_start := DATE_TRUNC('day', NOW() AT TIME ZONE 'UTC');

  -- Get total XP earned today across all actions
  SELECT COALESCE(SUM(amount), 0)
  INTO v_daily_total
  FROM xp_events
  WHERE profile_id = p_profile_id
    AND created_at >= v_today_start;

  -- Check daily total cap (100 XP)
  IF v_daily_total >= 100 THEN
    RETURN QUERY SELECT FALSE, 0, 'Daily XP cap of 100 reached';
    RETURN;
  END IF;

  -- Get action-specific limits
  CASE p_action_type
    WHEN 'post_create' THEN
      v_daily_cap_per_action := 5;  -- 5 posts per day
      v_action_cap := 3;            -- +3 XP per post
    WHEN 'comment_create' THEN
      v_daily_cap_per_action := 10; -- 10 comments per day
      v_action_cap := 1;            -- +1 XP per comment
    WHEN 'learn_read' THEN
      v_daily_cap_per_action := 5;  -- 5 articles per day
      v_action_cap := 1;            -- +1 XP per article
      v_cooldown_hours := 0;        -- No repeat reads of same article
    WHEN 'game_play_30m' THEN
      v_daily_cap_per_action := 4;  -- 4 sessions per day
      v_action_cap := 2;            -- +2 XP per 30min session
    WHEN 'pot_link' THEN
      v_daily_cap_per_action := NULL; -- No daily cap (one-time per pot)
      v_action_cap := 50;           -- +50 XP per pot
    WHEN 'admin_adjust' THEN
      v_daily_cap_per_action := NULL; -- No cap for admin adjustments
      v_action_cap := p_amount;     -- Use provided amount
    ELSE
      RETURN QUERY SELECT FALSE, 0, 'Invalid action type';
      RETURN;
  END CASE;

  -- Count actions of this type today
  SELECT COUNT(*)
  INTO v_action_count
  FROM xp_events
  WHERE profile_id = p_profile_id
    AND action_type = p_action_type
    AND created_at >= v_today_start;

  -- Check per-action daily cap
  IF v_daily_cap_per_action IS NOT NULL AND v_action_count >= v_daily_cap_per_action THEN
    RETURN QUERY SELECT FALSE, 0, 'Daily cap for ' || p_action_type || ' reached';
    RETURN;
  END IF;

  -- Check cooldown for specific reference (e.g., same article, same pot)
  IF p_reference_id IS NOT NULL THEN
    SELECT MAX(created_at)
    INTO v_last_action
    FROM xp_events
    WHERE profile_id = p_profile_id
      AND action_type = p_action_type
      AND reference_id = p_reference_id;

    IF v_last_action IS NOT NULL THEN
      -- For learn_read and pot_link, disallow duplicates entirely
      IF p_action_type IN ('learn_read', 'pot_link') THEN
        RETURN QUERY SELECT FALSE, 0, 'Already completed this action';
        RETURN;
      END IF;

      -- For other actions with cooldowns, check time elapsed
      IF v_cooldown_hours IS NOT NULL 
         AND v_last_action + (v_cooldown_hours || ' hours')::INTERVAL > NOW() THEN
        RETURN QUERY SELECT FALSE, 0, 'Cooldown period not elapsed';
        RETURN;
      END IF;
    END IF;
  END IF;

  -- Get XP to award (use action cap, or provided amount for admin)
  IF p_action_type = 'admin_adjust' THEN
    v_action_cap := p_amount;
  END IF;

  -- Cap XP to not exceed daily total limit
  IF v_daily_total + v_action_cap > 100 THEN
    v_action_cap := 100 - v_daily_total;
  END IF;

  -- Insert XP event
  INSERT INTO xp_events (
    profile_id,
    action_type,
    amount,
    reference_type,
    reference_id
  ) VALUES (
    p_profile_id,
    p_action_type,
    v_action_cap,
    p_reference_type,
    p_reference_id
  );

  -- Update or insert XP balance
  INSERT INTO xp_balances (profile_id, total_xp, level)
  VALUES (p_profile_id, v_action_cap, 1)
  ON CONFLICT (profile_id) DO UPDATE
  SET 
    total_xp = xp_balances.total_xp + v_action_cap,
    level = FLOOR((xp_balances.total_xp + v_action_cap) / 100) + 1,
    updated_at = NOW();

  -- Return success
  RETURN QUERY SELECT TRUE, v_action_cap, 'XP awarded successfully';
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users (service role will call this)
GRANT EXECUTE ON FUNCTION apply_xp TO authenticated, service_role;

-- Create index on xp_events for performance
CREATE INDEX IF NOT EXISTS idx_xp_events_profile_date 
  ON xp_events (profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_xp_events_profile_action_date 
  ON xp_events (profile_id, action_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_xp_events_reference 
  ON xp_events (profile_id, action_type, reference_id);

-- Admin Features Migration
-- Adds is_admin column to profiles and sets up admin-only policies

-- Add is_admin column to profiles if it doesn't exist
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT false;

-- Create index on is_admin for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- Grant admin access to auth.users via service role
-- (This is already handled by RLS, but we document it here)

-- Update RLS policy for feature_flags to allow admin writes
DROP POLICY IF EXISTS "flags_update_admin_only" ON public.feature_flags;

CREATE POLICY "flags_update_admin_only" ON public.feature_flags
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to delete any post (for moderation)
CREATE POLICY "posts_delete_admin" ON public.posts
  FOR DELETE
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to delete any comment (for moderation)
CREATE POLICY "comments_delete_admin" ON public.comments
  FOR DELETE
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow admins to update post visibility (hide/unhide)
CREATE POLICY "posts_update_admin" ON public.posts
  FOR UPDATE
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Create audit_logs table for tracking admin actions
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);

-- RLS for audit_logs (admins can read)
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_read_admin" ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Allow system to insert audit logs (via service role)
CREATE POLICY "audit_logs_insert_system" ON public.audit_logs
  FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE public.audit_logs IS 'Tracks admin actions for accountability';
COMMENT ON COLUMN public.profiles.is_admin IS 'Whether user has admin privileges';

-- Fix order_items RLS - Allow users to insert their own order items

-- Check if the insert policy exists, if not create it
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'order_items' 
        AND policyname = 'order_items_insert_own'
    ) THEN
        CREATE POLICY "order_items_insert_own" ON public.order_items
          FOR INSERT WITH CHECK (
            EXISTS (
              SELECT 1 FROM public.orders
              WHERE orders.id = order_items.order_id
              AND orders.user_id = auth.uid()
            )
          );
    END IF;
END $$;

-- Verify the policy exists
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd 
FROM pg_policies 
WHERE tablename = 'order_items';

-- Add level-up notification trigger to XP system
-- This trigger fires when a user levels up and creates a notification

CREATE OR REPLACE FUNCTION public.notify_level_up()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_new_level INT;
  v_old_level INT;
BEGIN
  -- Calculate old and new levels
  v_old_level := FLOOR(OLD.total_xp / 100) + 1;
  v_new_level := FLOOR(NEW.total_xp / 100) + 1;

  -- If level increased, send notification
  IF v_new_level > v_old_level THEN
    -- Get user_id from profile
    SELECT user_id INTO v_user_id
    FROM public.profiles
    WHERE id = NEW.profile_id;

    IF v_user_id IS NOT NULL THEN
      -- Create level-up notification
      PERFORM public.create_notification(
        v_user_id,
        'level_up',
        '🎉 Level Up!',
        format('Congratulations! You reached Level %s!', v_new_level),
        '/my-plants',
        jsonb_build_object(
          'old_level', v_old_level,
          'new_level', v_new_level,
          'total_xp', NEW.total_xp
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on xp_balances table
DROP TRIGGER IF EXISTS level_up_notification_trigger ON public.xp_balances;
CREATE TRIGGER level_up_notification_trigger
  AFTER UPDATE OF total_xp ON public.xp_balances
  FOR EACH ROW
  WHEN (NEW.total_xp > OLD.total_xp)
  EXECUTE FUNCTION public.notify_level_up();

-- Add XP cap notification to apply_xp function
-- This modifies the existing apply_xp function to send a notification when daily cap is reached

-- Drop existing function first (required to change return type)
DROP FUNCTION IF EXISTS public.apply_xp(UUID, TEXT, INT, TEXT, UUID);

CREATE OR REPLACE FUNCTION public.apply_xp(
  p_profile_id UUID,
  p_action_type TEXT,
  p_amount INT,
  p_reference_type TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS TABLE (
  xp_awarded INT,
  new_total_xp INT,
  daily_xp INT,
  cap_reached BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_daily_xp INT;
  v_daily_cap INT := 100;
  v_action_cap INT;
  v_action_count INT;
  v_xp_to_award INT := 0;
  v_new_total_xp INT;
  v_cap_reached BOOLEAN := false;
  v_user_id UUID;
BEGIN
  -- Get daily XP total
  SELECT COALESCE(SUM(amount), 0) INTO v_daily_xp
  FROM public.xp_events
  WHERE profile_id = p_profile_id
    AND created_at >= CURRENT_DATE;

  -- Check if daily cap reached
  IF v_daily_xp >= v_daily_cap THEN
    v_cap_reached := true;
    
    -- Get user_id for notification
    SELECT user_id INTO v_user_id FROM public.profiles WHERE id = p_profile_id;
    
    -- Send notification if cap just reached (only once per day)
    IF v_user_id IS NOT NULL AND NOT EXISTS (
      SELECT 1 FROM public.notifications
      WHERE user_id = v_user_id
        AND type = 'xp_cap'
        AND created_at >= CURRENT_DATE
    ) THEN
      PERFORM public.create_notification(
        v_user_id,
        'xp_cap',
        '⚠️ Daily XP Cap Reached',
        format('You''ve earned %s XP today! Come back tomorrow for more.', v_daily_cap),
        '/my-plants',
        jsonb_build_object('daily_xp', v_daily_xp, 'cap', v_daily_cap)
      );
    END IF;

    RETURN QUERY SELECT 0, 0, v_daily_xp, v_cap_reached;
    RETURN;
  END IF;

  -- Get action-specific cap
  v_action_cap := CASE p_action_type
    WHEN 'post_create' THEN 3
    WHEN 'comment_create' THEN 10
    WHEN 'article_read' THEN 5
    WHEN 'pot_claim' THEN 1
    WHEN 'game_session' THEN 4
    ELSE 999
  END;

  -- Count today's actions of this type
  SELECT COUNT(*) INTO v_action_count
  FROM public.xp_events
  WHERE profile_id = p_profile_id
    AND action_type = p_action_type
    AND created_at >= CURRENT_DATE;

  -- Check if action cap reached
  IF v_action_count >= v_action_cap THEN
    RETURN QUERY SELECT 0, 0, v_daily_xp, false;
    RETURN;
  END IF;

  -- Calculate XP to award (respecting daily cap)
  v_xp_to_award := LEAST(p_amount, v_daily_cap - v_daily_xp);

  IF v_xp_to_award > 0 THEN
    -- Insert XP event
    INSERT INTO public.xp_events (
      profile_id,
      action_type,
      amount,
      reference_type,
      reference_id
    ) VALUES (
      p_profile_id,
      p_action_type,
      v_xp_to_award,
      p_reference_type,
      p_reference_id
    );

    -- Update XP balance
    INSERT INTO public.xp_balances (profile_id, total_xp)
    VALUES (p_profile_id, v_xp_to_award)
    ON CONFLICT (profile_id)
    DO UPDATE SET
      total_xp = xp_balances.total_xp + v_xp_to_award,
      updated_at = NOW()
    RETURNING total_xp INTO v_new_total_xp;

    -- Update daily XP
    v_daily_xp := v_daily_xp + v_xp_to_award;

    -- Check if cap reached after this award
    IF v_daily_xp >= v_daily_cap THEN
      v_cap_reached := true;
      
      -- Get user_id for notification
      SELECT user_id INTO v_user_id FROM public.profiles WHERE id = p_profile_id;
      
      -- Send cap notification
      IF v_user_id IS NOT NULL THEN
        PERFORM public.create_notification(
          v_user_id,
          'xp_cap',
          '⚠️ Daily XP Cap Reached',
          format('You''ve earned %s XP today! Come back tomorrow for more.', v_daily_cap),
          '/my-plants',
          jsonb_build_object('daily_xp', v_daily_xp, 'cap', v_daily_cap)
        );
      END IF;
    END IF;
  END IF;

  RETURN QUERY SELECT v_xp_to_award, v_new_total_xp, v_daily_xp, v_cap_reached;
END;
$$;

COMMENT ON FUNCTION public.notify_level_up IS 'Trigger function that sends a notification when user levels up';
COMMENT ON TRIGGER level_up_notification_trigger ON public.xp_balances IS 'Sends notification when user levels up';

-- Notifications System Migration
-- Creates notifications table with RLS policies and triggers

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('comment', 'like', 'level_up', 'xp_cap', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Metadata for different notification types
  metadata JSONB DEFAULT '{}'::jsonb,
  
  -- Index for quick lookups
  CONSTRAINT notifications_user_id_created_at_idx UNIQUE (user_id, created_at, id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS notifications_user_id_idx ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS notifications_created_at_idx ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS notifications_read_idx ON public.notifications(read) WHERE read = false;
CREATE INDEX IF NOT EXISTS notifications_type_idx ON public.notifications(type);

-- Enable RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can read their own notifications
CREATE POLICY "notifications_read_own"
  ON public.notifications
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can update their own notifications (mark as read)
CREATE POLICY "notifications_update_own"
  ON public.notifications
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- System can insert notifications (via service role)
CREATE POLICY "notifications_insert_system"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);

-- Helper function to create notifications
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_message TEXT,
  p_link TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_notification_id UUID;
BEGIN
  -- Don't create duplicate notifications within 5 minutes
  IF EXISTS (
    SELECT 1 FROM public.notifications
    WHERE user_id = p_user_id
      AND type = p_type
      AND created_at > NOW() - INTERVAL '5 minutes'
      AND metadata = p_metadata
  ) THEN
    RETURN NULL;
  END IF;

  -- Insert notification
  INSERT INTO public.notifications (
    user_id,
    type,
    title,
    message,
    link,
    metadata
  ) VALUES (
    p_user_id,
    p_type,
    p_title,
    p_message,
    p_link,
    p_metadata
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

-- Function to clean up old read notifications (keep last 30 days)
CREATE OR REPLACE FUNCTION public.cleanup_old_notifications()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.notifications
  WHERE read = true
    AND created_at < NOW() - INTERVAL '30 days';
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.create_notification TO authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_old_notifications TO authenticated;

-- Comment
COMMENT ON TABLE public.notifications IS 'User notifications for app events';
COMMENT ON FUNCTION public.create_notification IS 'Create a new notification for a user (deduplicates within 5 minutes)';
COMMENT ON FUNCTION public.cleanup_old_notifications IS 'Delete read notifications older than 30 days';

-- Performance Optimization: Add missing indexes for common queries
-- This migration adds indexes to improve query performance across the application

-- Posts table indexes
CREATE INDEX IF NOT EXISTS posts_created_at_idx ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS posts_hobby_group_idx ON public.posts(hobby_group) WHERE NOT COALESCE(hidden, false);
CREATE INDEX IF NOT EXISTS posts_author_created_idx ON public.posts(author_id, created_at DESC);

-- Comments table indexes  
CREATE INDEX IF NOT EXISTS comments_post_created_idx ON public.comments(post_id, created_at DESC);
CREATE INDEX IF NOT EXISTS comments_author_idx ON public.comments(author_id);

-- Profiles table indexes
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- XP balances indexes (total_xp is in xp_balances, not profiles)
CREATE INDEX IF NOT EXISTS xp_balances_total_xp_idx ON public.xp_balances(total_xp DESC);

-- XP events indexes
CREATE INDEX IF NOT EXISTS xp_events_profile_date_idx ON public.xp_events(profile_id, created_at DESC);
CREATE INDEX IF NOT EXISTS xp_events_action_date_idx ON public.xp_events(action_type, created_at DESC);

-- Post reactions indexes
CREATE INDEX IF NOT EXISTS post_reactions_post_idx ON public.post_reactions(post_id);
CREATE INDEX IF NOT EXISTS post_reactions_user_post_idx ON public.post_reactions(user_id, post_id);

-- Orders table indexes (commented out: orders table doesn't exist yet)
-- CREATE INDEX IF NOT EXISTS orders_user_created_idx ON public.orders(user_id, created_at DESC);
-- CREATE INDEX IF NOT EXISTS orders_status_idx ON public.orders(status);

-- Pot claims indexes
CREATE INDEX IF NOT EXISTS pot_claims_user_idx ON public.pot_claims(user_id);
CREATE INDEX IF NOT EXISTS pot_claims_pot_idx ON public.pot_claims(pot_id);

-- Analyze tables to update statistics
ANALYZE public.posts;
ANALYZE public.comments;
ANALYZE public.profiles;
ANALYZE public.xp_events;
ANALYZE public.xp_balances;
ANALYZE public.post_reactions;
-- ANALYZE public.orders; -- Commented out: orders table doesn't exist yet
ANALYZE public.pot_claims;
ANALYZE public.notifications;

COMMENT ON INDEX posts_created_at_idx IS 'Speeds up recent posts queries';
COMMENT ON INDEX posts_hobby_group_idx IS 'Speeds up filtering by hobby group';
COMMENT ON INDEX comments_post_created_idx IS 'Speeds up fetching comments for a post';
COMMENT ON INDEX profiles_username_idx IS 'Speeds up profile lookups by username';
COMMENT ON INDEX xp_events_profile_date_idx IS 'Speeds up XP history queries';

