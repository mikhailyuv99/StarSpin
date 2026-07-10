-- STARSPIN production schema (idempotent). Run once in Supabase → SQL Editor.
-- Or: set SUPABASE_DB_URL in .env.local and run: node scripts/apply-production-schema.mjs

-- Flow + CRM
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS flow_steps JSONB NOT NULL DEFAULT '["google_review"]'::jsonb;

ALTER TABLE spins
  ADD COLUMN IF NOT EXISTS completed_flow_steps JSONB NOT NULL DEFAULT '[]'::jsonb;

ALTER TABLE spins ALTER COLUMN phone_number DROP NOT NULL;

-- Prize icons + mechanics
ALTER TABLE prizes ADD COLUMN IF NOT EXISTS icon TEXT;

ALTER TABLE prizes
  ADD COLUMN IF NOT EXISTS prize_mechanic TEXT NOT NULL DEFAULT 'standard';

ALTER TABLE prizes DROP CONSTRAINT IF EXISTS prizes_prize_mechanic_check;
ALTER TABLE prizes
  ADD CONSTRAINT prizes_prize_mechanic_check
  CHECK (
    prize_mechanic IN (
      'standard', 'retry', 'no_win', 'near_miss',
      'mystery', 'double_or_nothing', 'social_unlock'
    )
  );

ALTER TABLE prizes
  ADD COLUMN IF NOT EXISTS social_unlock_platform TEXT;

ALTER TABLE prizes DROP CONSTRAINT IF EXISTS prizes_social_unlock_platform_check;
ALTER TABLE prizes
  ADD CONSTRAINT prizes_social_unlock_platform_check
  CHECK (
    social_unlock_platform IS NULL
    OR social_unlock_platform IN ('instagram', 'facebook', 'tiktok')
  );

ALTER TABLE spins
  ADD COLUMN IF NOT EXISTS resolved_prize_id UUID REFERENCES prizes(id) ON DELETE SET NULL;

-- Journey copy + QR (if missing)
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS customer_page_headline TEXT,
  ADD COLUMN IF NOT EXISTS customer_page_subtitle TEXT,
  ADD COLUMN IF NOT EXISTS spin_button_label TEXT,
  ADD COLUMN IF NOT EXISTS qr_fg_color TEXT,
  ADD COLUMN IF NOT EXISTS qr_bg_color TEXT,
  ADD COLUMN IF NOT EXISTS qr_design JSONB,
  ADD COLUMN IF NOT EXISTS journey_theme JSONB;

-- Billing quarterly
ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_billing_plan_check;
ALTER TABLE merchants
  ADD CONSTRAINT merchants_billing_plan_check
  CHECK (billing_plan IS NULL OR billing_plan IN ('monthly', 'quarterly', 'annual'));

-- Prize rarity (simple odds mode)
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS prize_odds_mode TEXT NOT NULL DEFAULT 'simple';

ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_prize_odds_mode_check;
ALTER TABLE merchants
  ADD CONSTRAINT merchants_prize_odds_mode_check
  CHECK (prize_odds_mode IN ('simple', 'advanced'));

ALTER TABLE prizes
  ADD COLUMN IF NOT EXISTS rarity_tier TEXT NOT NULL DEFAULT 'common';

ALTER TABLE prizes DROP CONSTRAINT IF EXISTS prizes_rarity_tier_check;
ALTER TABLE prizes
  ADD CONSTRAINT prizes_rarity_tier_check
  CHECK (rarity_tier IN ('common', 'uncommon', 'rare', 'epic', 'jackpot'));

-- Multi-establishment accounts
CREATE TABLE IF NOT EXISTS merchant_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  multi_business_status TEXT NOT NULL DEFAULT 'cancelled',
  multi_business_stripe_subscription_id TEXT,
  multi_business_billing_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE merchant_accounts DROP CONSTRAINT IF EXISTS merchant_accounts_multi_business_billing_plan_check;
ALTER TABLE merchant_accounts
  ADD CONSTRAINT merchant_accounts_multi_business_billing_plan_check
  CHECK (multi_business_billing_plan IS NULL OR multi_business_billing_plan IN ('monthly', 'quarterly', 'annual'));

CREATE INDEX IF NOT EXISTS idx_merchant_accounts_owner ON merchant_accounts(owner_id);

ALTER TABLE merchants ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES merchant_accounts(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_merchants_account ON merchants(account_id);

INSERT INTO merchant_accounts (owner_id)
SELECT DISTINCT owner_id FROM merchants
ON CONFLICT (owner_id) DO NOTHING;

UPDATE merchants m
SET account_id = a.id
FROM merchant_accounts a
WHERE m.owner_id = a.owner_id
  AND m.account_id IS NULL;

ALTER TABLE merchant_accounts ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'merchant_accounts_owner_all' AND tablename = 'merchant_accounts'
  ) THEN
    CREATE POLICY merchant_accounts_owner_all ON merchant_accounts
      FOR ALL TO authenticated
      USING (owner_id = auth.uid() OR is_admin())
      WITH CHECK (owner_id = auth.uid() OR is_admin());
  END IF;
END $$;

-- Account-level subscription (one sub covers all establishments)
ALTER TABLE merchant_accounts
  ADD COLUMN IF NOT EXISTS subscription_status TEXT NOT NULL DEFAULT 'cancelled',
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_plan TEXT,
  ADD COLUMN IF NOT EXISTS subscription_product TEXT NOT NULL DEFAULT 'starspin';

ALTER TABLE merchant_accounts DROP CONSTRAINT IF EXISTS merchant_accounts_billing_plan_check;
ALTER TABLE merchant_accounts
  ADD CONSTRAINT merchant_accounts_billing_plan_check
  CHECK (billing_plan IS NULL OR billing_plan IN ('monthly', 'quarterly', 'annual'));

ALTER TABLE merchant_accounts DROP CONSTRAINT IF EXISTS merchant_accounts_subscription_product_check;
ALTER TABLE merchant_accounts
  ADD CONSTRAINT merchant_accounts_subscription_product_check
  CHECK (subscription_product IN ('starspin', 'starspin_multi_business'));

UPDATE merchant_accounts a
SET
  subscription_status = COALESCE(
    (SELECT m.subscription_status::text FROM merchants m WHERE m.account_id = a.id ORDER BY m.created_at LIMIT 1),
    a.multi_business_status,
    'cancelled'
  ),
  stripe_customer_id = COALESCE(
    a.stripe_customer_id,
    (SELECT m.stripe_customer_id FROM merchants m WHERE m.account_id = a.id AND m.stripe_customer_id IS NOT NULL ORDER BY m.created_at LIMIT 1)
  ),
  stripe_subscription_id = COALESCE(
    a.stripe_subscription_id,
    (SELECT m.stripe_subscription_id FROM merchants m WHERE m.account_id = a.id AND m.stripe_subscription_id IS NOT NULL ORDER BY m.created_at LIMIT 1),
    a.multi_business_stripe_subscription_id
  ),
  billing_plan = COALESCE(
    a.billing_plan,
    (SELECT m.billing_plan FROM merchants m WHERE m.account_id = a.id AND m.billing_plan IS NOT NULL ORDER BY m.created_at LIMIT 1),
    a.multi_business_billing_plan
  ),
  subscription_product = CASE
    WHEN a.multi_business_status = 'active' THEN 'starspin_multi_business'
    ELSE COALESCE(a.subscription_product, 'starspin')
  END
WHERE a.subscription_status = 'cancelled' OR a.subscription_status IS NULL;

UPDATE merchants m
SET subscription_status = a.subscription_status::subscription_status
FROM merchant_accounts a
WHERE m.account_id = a.id
  AND a.subscription_status IS NOT NULL;
