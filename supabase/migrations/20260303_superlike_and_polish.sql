-- =====================================================
-- Superlike System + Polish Migration
-- =====================================================

-- 1. Superlike Balances (how many superlikes a user has)
CREATE TABLE IF NOT EXISTS public.superlike_balances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INT NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_purchased INT NOT NULL DEFAULT 0,
  total_used INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Superlike Transactions (audit trail)
CREATE TABLE IF NOT EXISTS public.superlike_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('purchase', 'send', 'refund')),
  amount INT NOT NULL,
  balance_after INT NOT NULL,
  stripe_session_id TEXT,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  recipient_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Creator Earnings (accumulated earnings from superlikes received)
CREATE TABLE IF NOT EXISTS public.creator_earnings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  balance_cents INT NOT NULL DEFAULT 0,
  lifetime_earned_cents INT NOT NULL DEFAULT 0,
  lifetime_paid_cents INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Creator Earning Events (individual earning records)
CREATE TABLE IF NOT EXISTS public.creator_earning_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID REFERENCES public.posts(id) ON DELETE SET NULL,
  amount_cents INT NOT NULL DEFAULT 85,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Expand post_reactions CHECK to allow 'superlike'
ALTER TABLE public.post_reactions DROP CONSTRAINT IF EXISTS post_reactions_reaction_type_check;
ALTER TABLE public.post_reactions ADD CONSTRAINT post_reactions_reaction_type_check
  CHECK (reaction_type IN ('like', 'superlike'));

-- 6. Update UNIQUE constraint to allow both like + superlike on same post
ALTER TABLE public.post_reactions DROP CONSTRAINT IF EXISTS post_reactions_post_id_user_id_key;
ALTER TABLE public.post_reactions ADD CONSTRAINT post_reactions_post_id_user_id_reaction_type_key
  UNIQUE (post_id, user_id, reaction_type);

-- 7. Expand notifications CHECK to include 'superlike'
-- First check if constraint exists, drop and recreate
DO $$
BEGIN
  -- Drop existing type check if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'notifications_type_check'
    AND table_name = 'notifications'
  ) THEN
    ALTER TABLE public.notifications DROP CONSTRAINT notifications_type_check;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL; -- Constraint might not exist, that's fine
END $$;

-- 8. Add updated_at to comments (for comment edit feature)
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ;

-- Trigger to set updated_at on comments
CREATE OR REPLACE FUNCTION public.update_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_comments_updated_at ON public.comments;
CREATE TRIGGER trigger_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.update_comments_updated_at();

-- 9. Add notification_prefs to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_prefs JSONB DEFAULT '{}';

-- 10. send_superlike() stored procedure (atomic operation)
CREATE OR REPLACE FUNCTION public.send_superlike(
  p_sender_id UUID,
  p_post_id UUID,
  p_recipient_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_balance INT;
  v_new_balance INT;
BEGIN
  -- Check sender balance
  SELECT balance INTO v_balance
  FROM public.superlike_balances
  WHERE user_id = p_sender_id
  FOR UPDATE;

  IF v_balance IS NULL OR v_balance < 1 THEN
    RETURN jsonb_build_object('success', false, 'error', 'INSUFFICIENT_BALANCE');
  END IF;

  -- Debit sender
  UPDATE public.superlike_balances
  SET balance = balance - 1,
      total_used = total_used + 1,
      updated_at = NOW()
  WHERE user_id = p_sender_id
  RETURNING balance INTO v_new_balance;

  -- Insert superlike reaction
  INSERT INTO public.post_reactions (post_id, user_id, reaction_type)
  VALUES (p_post_id, p_sender_id, 'superlike')
  ON CONFLICT (post_id, user_id, reaction_type) DO NOTHING;

  -- Record transaction
  INSERT INTO public.superlike_transactions (user_id, type, amount, balance_after, post_id, recipient_id)
  VALUES (p_sender_id, 'send', -1, v_new_balance, p_post_id, p_recipient_id);

  -- Credit creator earnings ($0.85 = 85 cents)
  INSERT INTO public.creator_earnings (user_id, balance_cents, lifetime_earned_cents)
  VALUES (p_recipient_id, 85, 85)
  ON CONFLICT (user_id) DO UPDATE SET
    balance_cents = creator_earnings.balance_cents + 85,
    lifetime_earned_cents = creator_earnings.lifetime_earned_cents + 85,
    updated_at = NOW();

  -- Record earning event
  INSERT INTO public.creator_earning_events (creator_id, sender_id, post_id, amount_cents)
  VALUES (p_recipient_id, p_sender_id, p_post_id, 85);

  RETURN jsonb_build_object('success', true, 'new_balance', v_new_balance);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- RLS Policies
-- =====================================================

-- Superlike Balances
ALTER TABLE public.superlike_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "superlike_balances_read_own" ON public.superlike_balances
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "superlike_balances_service_write" ON public.superlike_balances
  FOR ALL USING (true) WITH CHECK (true);
  -- Writes happen via service role (webhook + RPC)

-- Superlike Transactions
ALTER TABLE public.superlike_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "superlike_transactions_read_own" ON public.superlike_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Creator Earnings
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_earnings_read_own" ON public.creator_earnings
  FOR SELECT USING (auth.uid() = user_id);

-- Creator Earning Events
ALTER TABLE public.creator_earning_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "creator_earning_events_read_own" ON public.creator_earning_events
  FOR SELECT USING (auth.uid() = creator_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_superlike_balances_user ON public.superlike_balances(user_id);
CREATE INDEX IF NOT EXISTS idx_superlike_transactions_user ON public.superlike_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_user ON public.creator_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_creator_earning_events_creator ON public.creator_earning_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_post_reactions_type ON public.post_reactions(reaction_type);
