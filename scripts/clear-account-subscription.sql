-- Wipe subscription billing for cancelled owner emails so they can subscribe fresh.
-- Run in Supabase SQL Editor (same tab is fine — replace the previous query and Run).
--
-- No open Stripe subscriptions needed for these accounts, but if a webhook later
-- writes active back, cancel any leftover Stripe sub first then re-run.

WITH target_emails AS (
  SELECT unnest(ARRAY[
    'uzbechkavietnam@gmail.com',
    'ondalounge25@gmail.com'
  ]) AS email
)
-- Preview what will be cleared:
SELECT
  u.email,
  a.id AS account_id,
  a.subscription_status,
  a.subscription_product,
  a.billing_plan,
  a.stripe_customer_id,
  a.stripe_subscription_id,
  a.multi_business_status,
  a.multi_business_stripe_subscription_id,
  a.multi_business_billing_plan
FROM merchant_accounts a
JOIN auth.users u ON u.id = a.owner_id
WHERE u.email IN (SELECT email FROM target_emails);

WITH target_emails AS (
  SELECT unnest(ARRAY[
    'uzbechkavietnam@gmail.com',
    'ondalounge25@gmail.com'
  ]) AS email
)
SELECT
  m.id,
  m.name,
  m.slug,
  m.subscription_status,
  m.billing_plan,
  m.stripe_customer_id,
  m.stripe_subscription_id
FROM merchants m
JOIN merchant_accounts a ON a.id = m.account_id
JOIN auth.users u ON u.id = a.owner_id
WHERE u.email IN (SELECT email FROM target_emails);

-- Clear account-level billing (source of truth):
WITH target_emails AS (
  SELECT unnest(ARRAY[
    'uzbechkavietnam@gmail.com',
    'ondalounge25@gmail.com'
  ]) AS email
)
UPDATE merchant_accounts a
SET
  subscription_status = 'cancelled',
  subscription_product = 'starspin',
  billing_plan = NULL,
  stripe_subscription_id = NULL,
  stripe_customer_id = NULL,
  multi_business_status = 'cancelled',
  multi_business_stripe_subscription_id = NULL,
  multi_business_billing_plan = NULL
FROM auth.users u
WHERE a.owner_id = u.id
  AND u.email IN (SELECT email FROM target_emails);

-- Clear merchant rows too (public pages / RLS / legacy reads):
WITH target_emails AS (
  SELECT unnest(ARRAY[
    'uzbechkavietnam@gmail.com',
    'ondalounge25@gmail.com'
  ]) AS email
)
UPDATE merchants m
SET
  subscription_status = 'cancelled',
  billing_plan = NULL,
  stripe_subscription_id = NULL,
  stripe_customer_id = NULL
FROM merchant_accounts a
JOIN auth.users u ON u.id = a.owner_id
WHERE m.account_id = a.id
  AND u.email IN (SELECT email FROM target_emails);

-- Verify:
WITH target_emails AS (
  SELECT unnest(ARRAY[
    'uzbechkavietnam@gmail.com',
    'ondalounge25@gmail.com'
  ]) AS email
)
SELECT
  u.email,
  a.subscription_status,
  a.subscription_product,
  a.billing_plan,
  a.stripe_customer_id,
  a.stripe_subscription_id,
  a.multi_business_status
FROM merchant_accounts a
JOIN auth.users u ON u.id = a.owner_id
WHERE u.email IN (SELECT email FROM target_emails);
