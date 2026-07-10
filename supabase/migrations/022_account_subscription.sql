-- Single subscription per account: all establishments share one billing status.

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

-- Backfill from per-merchant billing, then legacy multi_business columns.
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

-- Keep merchant rows in sync for RLS / public pages.
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
