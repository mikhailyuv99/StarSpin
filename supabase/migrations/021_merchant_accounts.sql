-- Multi-establishment accounts: one account per owner, many merchants per account.
-- Idempotent — safe to re-run in Supabase SQL Editor.

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

-- One account per existing owner.
INSERT INTO merchant_accounts (owner_id)
SELECT DISTINCT owner_id FROM merchants
ON CONFLICT (owner_id) DO NOTHING;

UPDATE merchants m
SET account_id = a.id
FROM merchant_accounts a
WHERE m.owner_id = a.owner_id
  AND m.account_id IS NULL;

-- Only enforce NOT NULL once every merchant is linked.
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
