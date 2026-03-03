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

