-- Stripe billing fields on merchants
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
  ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS billing_plan TEXT CHECK (billing_plan IN ('monthly', 'annual'));

CREATE INDEX IF NOT EXISTS idx_merchants_stripe_customer ON merchants(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_merchants_stripe_subscription ON merchants(stripe_subscription_id);
