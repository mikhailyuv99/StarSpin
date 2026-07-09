-- App supports quarterly plans; extend billing_plan check.

ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_billing_plan_check;
ALTER TABLE merchants
  ADD CONSTRAINT merchants_billing_plan_check
  CHECK (billing_plan IS NULL OR billing_plan IN ('monthly', 'quarterly', 'annual'));
