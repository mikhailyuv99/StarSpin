-- Per-prize redemption rules (configured by merchant)
ALTER TABLE prizes
  ADD COLUMN IF NOT EXISTS redeem_next_visit BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS redeem_min_spend_cents INTEGER,
  ADD COLUMN IF NOT EXISTS redeem_valid_days INTEGER;

ALTER TABLE prizes
  DROP CONSTRAINT IF EXISTS prizes_redeem_min_spend_cents_check;

ALTER TABLE prizes
  ADD CONSTRAINT prizes_redeem_min_spend_cents_check
  CHECK (redeem_min_spend_cents IS NULL OR redeem_min_spend_cents >= 0);

ALTER TABLE prizes
  DROP CONSTRAINT IF EXISTS prizes_redeem_valid_days_check;

ALTER TABLE prizes
  ADD CONSTRAINT prizes_redeem_valid_days_check
  CHECK (redeem_valid_days IS NULL OR (redeem_valid_days >= 1 AND redeem_valid_days <= 365));

-- Snapshot on spin at claim time (coupon stays valid even if prize rules change later)
ALTER TABLE spins
  ADD COLUMN IF NOT EXISTS redeem_next_visit BOOLEAN,
  ADD COLUMN IF NOT EXISTS redeem_min_spend_cents INTEGER,
  ADD COLUMN IF NOT EXISTS redeem_expires_at TIMESTAMPTZ;
