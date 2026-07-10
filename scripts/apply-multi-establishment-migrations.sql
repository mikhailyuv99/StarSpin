-- Run this entire file once in Supabase → SQL Editor (New query → paste → Run).
-- Combines migrations 021 + 022. Safe to re-run.

-- ========== 021: merchant_accounts ==========

CREATE TABLE IF NOT EXISTS merchant_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  multi_business_status subscription_status NOT NULL DEFAULT 'cancelled',
  multi_business_stripe_subscription_id TEXT,
  multi_business_billing_plan TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE merchant_accounts DROP CONSTRAINT IF EXISTS merchant_accounts_multi_business_billing_plan_check;
ALTER TABLE merchant_accounts
  ADD CONSTRAINT merchant_accounts_multi_business_billing_plan_check
  CHECK (multi_business_billing_plan IS NULL OR multi_business_billing_plan IN ('monthly', 'quarterly', 'annual'));

CREATE INDEX IF NOT EXISTS idx_merchant_accounts_owner ON merchant_accounts(owner_id);

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS account_id UUID REFERENCES merchant_accounts(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_merchants_account ON merchants(account_id);

INSERT INTO merchant_accounts (owner_id)
SELECT DISTINCT owner_id FROM merchants
ON CONFLICT (owner_id) DO NOTHING;

UPDATE merchants m
SET account_id = a.id
FROM merchant_accounts a
WHERE m.owner_id = a.owner_id
  AND m.account_id IS NULL;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM merchants WHERE account_id IS NULL) THEN
    ALTER TABLE merchants ALTER COLUMN account_id SET NOT NULL;
  END IF;
END $$;

CREATE OR REPLACE FUNCTION owns_merchant_account(account_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM merchant_accounts
    WHERE id = account_uuid AND owner_id = auth.uid()
  );
$$;

ALTER TABLE merchant_accounts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS merchant_accounts_owner_all ON merchant_accounts;
CREATE POLICY merchant_accounts_owner_all ON merchant_accounts
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR is_admin())
  WITH CHECK (owner_id = auth.uid() OR is_admin());

-- ========== 022: account-level subscription ==========

ALTER TABLE merchant_accounts
  ADD COLUMN IF NOT EXISTS subscription_status subscription_status NOT NULL DEFAULT 'cancelled';

ALTER TABLE merchant_accounts
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

ALTER TABLE merchant_accounts
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

ALTER TABLE merchant_accounts
  ADD COLUMN IF NOT EXISTS billing_plan TEXT;

ALTER TABLE merchant_accounts
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
    (
      SELECT m.subscription_status
      FROM merchants m
      WHERE m.account_id = a.id
      ORDER BY m.created_at
      LIMIT 1
    ),
    CASE WHEN a.multi_business_status = 'active' THEN 'active'::subscription_status ELSE 'cancelled'::subscription_status END,
    'cancelled'::subscription_status
  ),
  stripe_customer_id = COALESCE(
    a.stripe_customer_id,
    (
      SELECT m.stripe_customer_id
      FROM merchants m
      WHERE m.account_id = a.id AND m.stripe_customer_id IS NOT NULL
      ORDER BY m.created_at
      LIMIT 1
    )
  ),
  stripe_subscription_id = COALESCE(
    a.stripe_subscription_id,
    (
      SELECT m.stripe_subscription_id
      FROM merchants m
      WHERE m.account_id = a.id AND m.stripe_subscription_id IS NOT NULL
      ORDER BY m.created_at
      LIMIT 1
    ),
    a.multi_business_stripe_subscription_id
  ),
  billing_plan = COALESCE(
    a.billing_plan,
    (
      SELECT m.billing_plan
      FROM merchants m
      WHERE m.account_id = a.id AND m.billing_plan IS NOT NULL
      ORDER BY m.created_at
      LIMIT 1
    ),
    a.multi_business_billing_plan
  ),
  subscription_product = CASE
    WHEN a.multi_business_status = 'active' THEN 'starspin_multi_business'
    ELSE COALESCE(a.subscription_product, 'starspin')
  END;

UPDATE merchants m
SET
  subscription_status = a.subscription_status,
  stripe_customer_id = COALESCE(m.stripe_customer_id, a.stripe_customer_id),
  stripe_subscription_id = COALESCE(m.stripe_subscription_id, a.stripe_subscription_id),
  billing_plan = COALESCE(m.billing_plan, a.billing_plan)
FROM merchant_accounts a
WHERE m.account_id = a.id;

CREATE OR REPLACE FUNCTION sync_merchants_subscription_from_account()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE merchants
  SET subscription_status = NEW.subscription_status
  WHERE account_id = NEW.id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS merchant_accounts_sync_subscription ON merchant_accounts;
CREATE TRIGGER merchant_accounts_sync_subscription
  AFTER UPDATE OF subscription_status ON merchant_accounts
  FOR EACH ROW
  WHEN (OLD.subscription_status IS DISTINCT FROM NEW.subscription_status)
  EXECUTE FUNCTION sync_merchants_subscription_from_account();
