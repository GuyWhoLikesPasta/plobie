-- ==============================================
-- COMPLETE RESTORATION SQL
-- This adds ALL missing tables, policies, and features
-- Run this AFTER CLEAN_RESTORE.sql
-- ==============================================

-- ==============================================
-- PART 0: Clean up existing policies to avoid conflicts
-- ==============================================

-- Drop old tables that might have incompatible schemas (CASCADE will drop policies too)
DROP TABLE IF EXISTS public.audit_logs CASCADE;
DROP TABLE IF EXISTS public.stripe_events CASCADE;

-- Drop policies that we'll recreate (only for tables that exist)
DROP POLICY IF EXISTS "feature_flags_select_all" ON public.feature_flags;
DROP POLICY IF EXISTS "feature_flags_update_admin" ON public.feature_flags;
DROP POLICY IF EXISTS "reports_insert_own" ON public.reports;
DROP POLICY IF EXISTS "reports_select_own" ON public.reports;
DROP POLICY IF EXISTS "reports_select_admin" ON public.reports;
DROP POLICY IF EXISTS "reports_update_admin" ON public.reports;
DROP POLICY IF EXISTS "posts_delete_admin" ON public.posts;
DROP POLICY IF EXISTS "comments_delete_admin" ON public.comments;
DROP POLICY IF EXISTS "posts_update_admin" ON public.posts;
DROP POLICY IF EXISTS "products_select_all" ON public.products;
DROP POLICY IF EXISTS "product_variants_select_all" ON public.product_variants;
DROP POLICY IF EXISTS "orders_select_own" ON public.orders;
DROP POLICY IF EXISTS "orders_select_admin" ON public.orders;
DROP POLICY IF EXISTS "order_items_select_own" ON public.order_items;
DROP POLICY IF EXISTS "order_items_select_admin" ON public.order_items;

-- Drop triggers that we'll recreate
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
DROP TRIGGER IF EXISTS product_variants_updated_at ON public.product_variants;
DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
DROP TRIGGER IF EXISTS feature_flags_updated_at ON public.feature_flags;
DROP TRIGGER IF EXISTS reports_updated_at ON public.reports;

-- Drop functions that we'll recreate
DROP FUNCTION IF EXISTS public.apply_xp(UUID, TEXT, INT, TEXT, UUID);
DROP FUNCTION IF EXISTS public.notify_level_up();

-- ==============================================
-- PART 1: Missing Tables
-- ==============================================

-- Feature flags table
CREATE TABLE IF NOT EXISTS public.feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON public.feature_flags(key);

ALTER TABLE public.feature_flags ENABLE ROW LEVEL SECURITY;

-- Public can read feature flags
CREATE POLICY "feature_flags_select_all" ON public.feature_flags FOR SELECT USING (true);

-- Only admins can update feature flags (defined in admin section below)

-- Reports table (for community moderation)
CREATE TABLE IF NOT EXISTS public.reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('post', 'comment', 'profile')),
  entity_id UUID NOT NULL,
  reason TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'actioned', 'dismissed')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_entity ON public.reports(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.reports(reporter_id);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Users can create reports
CREATE POLICY "reports_insert_own" ON public.reports FOR INSERT WITH CHECK (auth.uid() = reporter_id);

-- Users can view their own reports
CREATE POLICY "reports_select_own" ON public.reports FOR SELECT USING (auth.uid() = reporter_id);

-- Admins can view all reports (defined below)

-- Audit logs table (for admin actions)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin ON public.audit_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs(action);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read audit logs (defined below)

-- System can insert audit logs
CREATE POLICY "audit_logs_insert_system" ON public.audit_logs FOR INSERT WITH CHECK (true);

-- Stripe events table (for webhook deduplication)
CREATE TABLE IF NOT EXISTS public.stripe_events (
  id TEXT PRIMARY KEY, -- stripe event.id
  type TEXT NOT NULL,
  processed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON public.stripe_events(type);
CREATE INDEX IF NOT EXISTS idx_stripe_events_processed ON public.stripe_events(processed_at DESC);

-- No RLS needed (service role only)

-- ==============================================
-- PART 1.5: Unity Game Integration Tables
-- ==============================================

-- Game Sessions Table (track Unity play sessions)
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_minutes INT CHECK (duration_minutes >= 0),
  xp_earned INT DEFAULT 0 CHECK (xp_earned >= 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_sessions_user_id ON public.game_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_started_at ON public.game_sessions(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_game_sessions_status ON public.game_sessions(status) WHERE status = 'active';

-- Game Progress Table (store Unity game state)
CREATE TABLE IF NOT EXISTS public.game_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  game_state JSONB NOT NULL DEFAULT '{}'::jsonb,
  version INT NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_game_progress_user_id ON public.game_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_game_progress_updated_at ON public.game_progress(updated_at DESC);

-- Enable RLS on game tables
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_progress ENABLE ROW LEVEL SECURITY;

-- Game Sessions Policies
DROP POLICY IF EXISTS "game_sessions_select_own" ON public.game_sessions;
CREATE POLICY "game_sessions_select_own" ON public.game_sessions FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "game_sessions_insert_own" ON public.game_sessions;
CREATE POLICY "game_sessions_insert_own" ON public.game_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "game_sessions_update_own" ON public.game_sessions;
CREATE POLICY "game_sessions_update_own" ON public.game_sessions FOR UPDATE USING (auth.uid() = user_id);

-- Game Progress Policies
DROP POLICY IF EXISTS "game_progress_select_own" ON public.game_progress;
CREATE POLICY "game_progress_select_own" ON public.game_progress FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "game_progress_insert_own" ON public.game_progress;
CREATE POLICY "game_progress_insert_own" ON public.game_progress FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "game_progress_update_own" ON public.game_progress;
CREATE POLICY "game_progress_update_own" ON public.game_progress FOR UPDATE USING (auth.uid() = user_id);

-- Game utility functions
CREATE OR REPLACE FUNCTION get_active_game_session(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  user_id UUID,
  started_at TIMESTAMPTZ,
  status TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    gs.id,
    gs.user_id,
    gs.started_at,
    gs.status,
    gs.metadata
  FROM public.game_sessions gs
  WHERE gs.user_id = p_user_id
    AND gs.status = 'active'
  ORDER BY gs.started_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION cleanup_abandoned_sessions()
RETURNS INT AS $$
DECLARE
  updated_count INT;
BEGIN
  UPDATE public.game_sessions
  SET 
    status = 'abandoned',
    ended_at = started_at + INTERVAL '4 hours',
    duration_minutes = 240
  WHERE 
    status = 'active'
    AND started_at < NOW() - INTERVAL '4 hours';
    
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.game_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.game_progress TO authenticated;
GRANT EXECUTE ON FUNCTION get_active_game_session(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION cleanup_abandoned_sessions() TO authenticated;

-- ==============================================
-- PART 2: Admin Features
-- ==============================================

-- Add is_admin index if not exists
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON public.profiles(is_admin) WHERE is_admin = true;

-- Admin-only policy for feature flags
CREATE POLICY "feature_flags_update_admin" ON public.feature_flags
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can view all reports
CREATE POLICY "reports_select_admin" ON public.reports
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can update report status
CREATE POLICY "reports_update_admin" ON public.reports
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can read audit logs
CREATE POLICY "audit_logs_select_admin" ON public.audit_logs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can delete any post (for moderation)
CREATE POLICY "posts_delete_admin" ON public.posts
  FOR DELETE
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can delete any comment (for moderation)
CREATE POLICY "comments_delete_admin" ON public.comments
  FOR DELETE
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Admins can update post visibility (hide/unhide)
CREATE POLICY "posts_update_admin" ON public.posts
  FOR UPDATE
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- ==============================================
-- PART 3: Storage Bucket for Images
-- ==============================================

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

-- Storage RLS policies (drop first, then create)
DROP POLICY IF EXISTS "post_images_insert_auth" ON storage.objects;
CREATE POLICY "post_images_insert_auth"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "post_images_select_public" ON storage.objects;
CREATE POLICY "post_images_select_public"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'post-images');

DROP POLICY IF EXISTS "post_images_update_own" ON storage.objects;
CREATE POLICY "post_images_update_own"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

DROP POLICY IF EXISTS "post_images_delete_own" ON storage.objects;
CREATE POLICY "post_images_delete_own"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'post-images' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- ==============================================
-- PART 4: Triggers and Helper Functions
-- ==============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS profiles_updated_at ON public.profiles;
CREATE TRIGGER profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS xp_balances_updated_at ON public.xp_balances;
CREATE TRIGGER xp_balances_updated_at
  BEFORE UPDATE ON public.xp_balances
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS feature_flags_updated_at ON public.feature_flags;
CREATE TRIGGER feature_flags_updated_at
  BEFORE UPDATE ON public.feature_flags
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS reports_updated_at ON public.reports;
CREATE TRIGGER reports_updated_at
  BEFORE UPDATE ON public.reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- PART 5: Performance Indexes
-- ==============================================

-- Posts indexes
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_hobby_created ON public.posts(hobby_group, created_at DESC) WHERE NOT COALESCE(hidden, false);

-- Comments indexes
CREATE INDEX IF NOT EXISTS idx_comments_created_at ON public.comments(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_author_created ON public.comments(author_id, created_at DESC);

-- XP indexes
CREATE INDEX IF NOT EXISTS idx_xp_balances_total_xp ON public.xp_balances(total_xp DESC);
CREATE INDEX IF NOT EXISTS idx_xp_events_created_at ON public.xp_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_xp_events_action_type ON public.xp_events(action_type);

-- Reactions indexes
CREATE INDEX IF NOT EXISTS idx_post_reactions_created_at ON public.post_reactions(created_at DESC);

-- Pot claims indexes
CREATE INDEX IF NOT EXISTS idx_pot_claims_user_id ON public.pot_claims(user_id);
CREATE INDEX IF NOT EXISTS idx_pot_claims_claimed_at ON public.pot_claims(claimed_at DESC);

-- ==============================================
-- PART 6: XP System Functions
-- ==============================================

-- Function to apply XP with daily caps and notifications
-- Uses UPSERT pattern to handle users without existing xp_balances record
CREATE OR REPLACE FUNCTION public.apply_xp(
  p_profile_id UUID,
  p_action_type TEXT,
  p_xp_amount INT,
  p_description TEXT DEFAULT NULL,
  p_reference_id UUID DEFAULT NULL
)
RETURNS TABLE (
  success BOOLEAN,
  xp_awarded INT,
  new_total_xp INT,
  new_daily_xp INT,
  level_before INT,
  level_after INT,
  capped BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_current_total_xp INT := 0;
  v_current_daily_xp INT := 0;
  v_last_reset_at TIMESTAMPTZ;
  v_level_before INT := 1;
  v_level_after INT;
  v_xp_to_add INT;
  v_capped BOOLEAN := false;
  v_daily_cap INT := 100;
BEGIN
  -- Get current XP balance (may not exist)
  SELECT xp_balances.total_xp, xp_balances.daily_xp, xp_balances.last_reset_at
  INTO v_current_total_xp, v_current_daily_xp, v_last_reset_at
  FROM public.xp_balances
  WHERE profile_id = p_profile_id;
  
  -- Handle case where no record exists
  IF v_current_total_xp IS NULL THEN
    v_current_total_xp := 0;
    v_current_daily_xp := 0;
    v_last_reset_at := NOW();
  END IF;
  
  -- Reset daily XP if it's a new day
  IF v_last_reset_at IS NULL OR v_last_reset_at < CURRENT_DATE THEN
    v_current_daily_xp := 0;
    v_last_reset_at := NOW();
  END IF;
  
  -- Calculate level before
  v_level_before := GREATEST(1, FLOOR(v_current_total_xp / 100.0) + 1);
  
  -- Check if daily cap would be exceeded
  IF v_current_daily_xp + p_xp_amount > v_daily_cap THEN
    v_xp_to_add := GREATEST(0, v_daily_cap - v_current_daily_xp);
    v_capped := true;
    
    -- Create XP cap notification (only if we have a notification function)
    BEGIN
      PERFORM public.create_notification(
        p_profile_id,
        'xp_cap',
        'Daily XP Cap Reached',
        'You''ve reached your daily XP cap of ' || v_daily_cap || ' XP. Come back tomorrow for more!',
        '/my-plants'
      );
    EXCEPTION WHEN OTHERS THEN
      -- Ignore notification errors
      NULL;
    END;
  ELSE
    v_xp_to_add := p_xp_amount;
  END IF;
  
  -- UPSERT XP balance (insert if not exists, update if exists)
  INSERT INTO public.xp_balances (profile_id, total_xp, daily_xp, last_reset_at, updated_at)
  VALUES (p_profile_id, v_xp_to_add, v_xp_to_add, v_last_reset_at, NOW())
  ON CONFLICT (profile_id) DO UPDATE
  SET 
    total_xp = xp_balances.total_xp + v_xp_to_add,
    daily_xp = CASE 
      WHEN xp_balances.last_reset_at < CURRENT_DATE THEN v_xp_to_add
      ELSE xp_balances.daily_xp + v_xp_to_add
    END,
    last_reset_at = v_last_reset_at,
    updated_at = NOW()
  RETURNING xp_balances.total_xp, xp_balances.daily_xp
  INTO v_current_total_xp, v_current_daily_xp;
  
  -- Log XP event
  INSERT INTO public.xp_events (profile_id, action_type, xp_amount, description)
  VALUES (p_profile_id, p_action_type, v_xp_to_add, p_description);
  
  -- Calculate level after
  v_level_after := GREATEST(1, FLOOR(v_current_total_xp / 100.0) + 1);
  
  -- Return results
  RETURN QUERY SELECT 
    true::BOOLEAN,
    v_xp_to_add,
    v_current_total_xp,
    v_current_daily_xp,
    v_level_before,
    v_level_after,
    v_capped;
END;
$$;

-- Grant execute on apply_xp function
GRANT EXECUTE ON FUNCTION public.apply_xp TO authenticated;

-- ==============================================
-- PART 7: Level Up Notification Trigger
-- ==============================================

-- Function to notify on level up
CREATE OR REPLACE FUNCTION public.notify_level_up()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_old_level INT;
  v_new_level INT;
BEGIN
  -- Calculate old and new levels
  v_old_level := FLOOR(OLD.total_xp / 100.0) + 1;
  v_new_level := FLOOR(NEW.total_xp / 100.0) + 1;
  
  -- Only notify if level increased
  IF v_new_level > v_old_level THEN
    PERFORM public.create_notification(
      (SELECT id FROM auth.users WHERE id = NEW.profile_id),
      'level_up',
      'Level Up!',
      'Congratulations! You''ve reached level ' || v_new_level || '!',
      '/my-plants',
      jsonb_build_object('level', v_new_level)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for level up notifications
DROP TRIGGER IF EXISTS level_up_notification_trigger ON public.xp_balances;
CREATE TRIGGER level_up_notification_trigger
  AFTER UPDATE OF total_xp ON public.xp_balances
  FOR EACH ROW
  WHEN (NEW.total_xp > OLD.total_xp)
  EXECUTE FUNCTION public.notify_level_up();

-- ==============================================
-- PART 8: Shop (Products & Orders)
-- ==============================================

-- Products table
CREATE TABLE IF NOT EXISTS public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  stripe_product_id TEXT,
  featured BOOLEAN DEFAULT false,
  category TEXT DEFAULT 'pottery',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_products_featured ON public.products(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products(category);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Public can view products
CREATE POLICY "products_select_all" ON public.products FOR SELECT USING (true);

-- Product variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
  sku TEXT UNIQUE NOT NULL,
  size TEXT,
  color TEXT,
  price_cents INT NOT NULL CHECK (price_cents > 0),
  stripe_price_id TEXT,
  stock_qty INT DEFAULT 0 CHECK (stock_qty >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);

ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;

-- Public can view product variants
CREATE POLICY "product_variants_select_all" ON public.product_variants FOR SELECT USING (true);

-- Order status enum
DO $$ BEGIN
  CREATE TYPE public.order_status AS ENUM ('pending', 'paid', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  stripe_session_id TEXT UNIQUE,
  stripe_payment_intent_id TEXT,
  status public.order_status DEFAULT 'pending',
  total_cents INT NOT NULL,
  shipping_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_stripe_session_id ON public.orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(created_at DESC);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "orders_select_own" ON public.orders FOR SELECT USING (auth.uid() = user_id);

-- Admins can view all orders
CREATE POLICY "orders_select_admin" ON public.orders
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Order items table
CREATE TABLE IF NOT EXISTS public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  variant_id UUID REFERENCES public.product_variants(id) ON DELETE SET NULL,
  quantity INT NOT NULL CHECK (quantity > 0),
  price_cents INT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Users can view their own order items
CREATE POLICY "order_items_select_own" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.orders
      WHERE orders.id = order_items.order_id
      AND orders.user_id = auth.uid()
    )
  );

-- Admins can view all order items
CREATE POLICY "order_items_select_admin" ON public.order_items
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.is_admin = true
    )
  );

-- Triggers for updated_at
DROP TRIGGER IF EXISTS products_updated_at ON public.products;
CREATE TRIGGER products_updated_at
  BEFORE UPDATE ON public.products
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS product_variants_updated_at ON public.product_variants;
CREATE TRIGGER product_variants_updated_at
  BEFORE UPDATE ON public.product_variants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS orders_updated_at ON public.orders;
CREATE TRIGGER orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ==============================================
-- PART 9: Analyze Tables for Query Optimization
-- ==============================================

ANALYZE public.profiles;
ANALYZE public.xp_balances;
ANALYZE public.xp_events;
ANALYZE public.posts;
ANALYZE public.comments;
ANALYZE public.post_reactions;
ANALYZE public.pots;
ANALYZE public.pot_claims;
ANALYZE public.notifications;
ANALYZE public.feature_flags;
ANALYZE public.reports;
ANALYZE public.audit_logs;
ANALYZE public.products;
ANALYZE public.product_variants;
ANALYZE public.orders;
ANALYZE public.order_items;

-- ==============================================
-- COMPLETE! Your database is now fully restored.
-- ==============================================

