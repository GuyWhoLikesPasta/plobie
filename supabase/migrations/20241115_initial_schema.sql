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

