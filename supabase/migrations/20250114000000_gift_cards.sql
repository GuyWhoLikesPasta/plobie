-- Gift Cards System
-- Supports Mother's Day promo: Spend $20 get $45 value

-- Gift card table
CREATE TABLE IF NOT EXISTS public.gift_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(20) UNIQUE NOT NULL,
  original_value_cents INT NOT NULL CHECK (original_value_cents > 0),
  current_balance_cents INT NOT NULL CHECK (current_balance_cents >= 0),
  purchased_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email VARCHAR(255),
  recipient_name VARCHAR(255),
  sender_name VARCHAR(255),
  personal_message TEXT,
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'redeemed', 'expired', 'cancelled')),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  redeemed_at TIMESTAMPTZ,
  stripe_payment_intent_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Gift card transactions (for partial redemptions)
CREATE TABLE IF NOT EXISTS public.gift_card_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gift_card_id UUID NOT NULL REFERENCES public.gift_cards(id) ON DELETE CASCADE,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  amount_cents INT NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'redemption', 'refund')),
  balance_after_cents INT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  notes TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gift_cards_code ON public.gift_cards(code);
CREATE INDEX IF NOT EXISTS idx_gift_cards_purchased_by ON public.gift_cards(purchased_by);
CREATE INDEX IF NOT EXISTS idx_gift_cards_redeemed_by ON public.gift_cards(redeemed_by);
CREATE INDEX IF NOT EXISTS idx_gift_cards_status ON public.gift_cards(status);
CREATE INDEX IF NOT EXISTS idx_gift_card_transactions_gift_card_id ON public.gift_card_transactions(gift_card_id);

-- RLS
ALTER TABLE public.gift_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gift_card_transactions ENABLE ROW LEVEL SECURITY;

-- Policies: Users can see gift cards they purchased or redeemed
DROP POLICY IF EXISTS "gift_cards_select_own" ON public.gift_cards;
CREATE POLICY "gift_cards_select_own" ON public.gift_cards 
  FOR SELECT USING (
    auth.uid() = purchased_by OR 
    auth.uid() = redeemed_by OR
    -- Allow checking if code exists (for redemption)
    status = 'active'
  );

-- Users can insert gift cards (purchase)
DROP POLICY IF EXISTS "gift_cards_insert" ON public.gift_cards;
CREATE POLICY "gift_cards_insert" ON public.gift_cards 
  FOR INSERT WITH CHECK (auth.uid() = purchased_by);

-- Users can update gift cards they're redeeming
DROP POLICY IF EXISTS "gift_cards_update" ON public.gift_cards;
CREATE POLICY "gift_cards_update" ON public.gift_cards 
  FOR UPDATE USING (
    auth.uid() = purchased_by OR 
    (status = 'active' AND redeemed_by IS NULL)
  );

-- Transaction policies
DROP POLICY IF EXISTS "gift_card_transactions_select_own" ON public.gift_card_transactions;
CREATE POLICY "gift_card_transactions_select_own" ON public.gift_card_transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.gift_cards gc 
      WHERE gc.id = gift_card_id 
      AND (gc.purchased_by = auth.uid() OR gc.redeemed_by = auth.uid())
    )
  );

DROP POLICY IF EXISTS "gift_card_transactions_insert" ON public.gift_card_transactions;
CREATE POLICY "gift_card_transactions_insert" ON public.gift_card_transactions
  FOR INSERT WITH CHECK (true); -- Controlled via API

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON public.gift_cards TO authenticated;
GRANT SELECT, INSERT ON public.gift_card_transactions TO authenticated;

-- Function to generate unique gift card code
CREATE OR REPLACE FUNCTION generate_gift_card_code()
RETURNS VARCHAR(20) AS $$
DECLARE
  chars VARCHAR(36) := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  code VARCHAR(20) := '';
  i INT;
BEGIN
  -- Format: XXXX-XXXX-XXXX (12 chars + 2 dashes)
  FOR i IN 1..4 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  code := code || '-';
  FOR i IN 1..4 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  code := code || '-';
  FOR i IN 1..4 LOOP
    code := code || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN code;
END;
$$ LANGUAGE plpgsql;

RAISE NOTICE 'Gift cards tables created successfully';
