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
