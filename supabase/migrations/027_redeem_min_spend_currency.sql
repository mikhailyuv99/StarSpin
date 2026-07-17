-- Min-spend currency for prize redemption rules (EUR / USD / VND).
ALTER TABLE prizes
  ADD COLUMN IF NOT EXISTS redeem_min_spend_currency TEXT;

ALTER TABLE prizes
  DROP CONSTRAINT IF EXISTS prizes_redeem_min_spend_currency_check;

ALTER TABLE prizes
  ADD CONSTRAINT prizes_redeem_min_spend_currency_check
  CHECK (
    redeem_min_spend_currency IS NULL
    OR redeem_min_spend_currency IN ('EUR', 'USD', 'VND')
  );

ALTER TABLE spins
  ADD COLUMN IF NOT EXISTS redeem_min_spend_currency TEXT;

ALTER TABLE spins
  DROP CONSTRAINT IF EXISTS spins_redeem_min_spend_currency_check;

ALTER TABLE spins
  ADD CONSTRAINT spins_redeem_min_spend_currency_check
  CHECK (
    redeem_min_spend_currency IS NULL
    OR redeem_min_spend_currency IN ('EUR', 'USD', 'VND')
  );

-- Keep the runtime ensure_* helper in sync for older deploys.
CREATE OR REPLACE FUNCTION public.ensure_prize_redemption_columns()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  ALTER TABLE prizes
    ADD COLUMN IF NOT EXISTS redeem_next_visit BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS redeem_min_spend_cents INTEGER,
    ADD COLUMN IF NOT EXISTS redeem_valid_days INTEGER,
    ADD COLUMN IF NOT EXISTS redeem_min_spend_currency TEXT;

  ALTER TABLE prizes DROP CONSTRAINT IF EXISTS prizes_redeem_min_spend_cents_check;
  ALTER TABLE prizes
    ADD CONSTRAINT prizes_redeem_min_spend_cents_check
    CHECK (redeem_min_spend_cents IS NULL OR redeem_min_spend_cents >= 0);

  ALTER TABLE prizes DROP CONSTRAINT IF EXISTS prizes_redeem_valid_days_check;
  ALTER TABLE prizes
    ADD CONSTRAINT prizes_redeem_valid_days_check
    CHECK (redeem_valid_days IS NULL OR (redeem_valid_days >= 1 AND redeem_valid_days <= 365));

  ALTER TABLE prizes DROP CONSTRAINT IF EXISTS prizes_redeem_min_spend_currency_check;
  ALTER TABLE prizes
    ADD CONSTRAINT prizes_redeem_min_spend_currency_check
    CHECK (
      redeem_min_spend_currency IS NULL
      OR redeem_min_spend_currency IN ('EUR', 'USD', 'VND')
    );

  ALTER TABLE spins
    ADD COLUMN IF NOT EXISTS redeem_next_visit BOOLEAN,
    ADD COLUMN IF NOT EXISTS redeem_min_spend_cents INTEGER,
    ADD COLUMN IF NOT EXISTS redeem_expires_at TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS redeem_min_spend_currency TEXT;

  ALTER TABLE spins DROP CONSTRAINT IF EXISTS spins_redeem_min_spend_currency_check;
  ALTER TABLE spins
    ADD CONSTRAINT spins_redeem_min_spend_currency_check
    CHECK (
      redeem_min_spend_currency IS NULL
      OR redeem_min_spend_currency IN ('EUR', 'USD', 'VND')
    );
END;
$$;

REVOKE ALL ON FUNCTION public.ensure_prize_redemption_columns() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.ensure_prize_redemption_columns() TO service_role;
