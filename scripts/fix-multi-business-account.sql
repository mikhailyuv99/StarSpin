-- Run in Supabase SQL Editor if Multi was enabled manually on merchant_accounts.
-- The app reads subscription_product (not multi_business_status alone).

-- Fix one account by email:
UPDATE merchant_accounts a
SET
  subscription_product = 'starspin_multi_business',
  subscription_status = COALESCE(NULLIF(a.subscription_status::text, 'cancelled'), 'active')::subscription_status,
  multi_business_status = 'active'
FROM auth.users u
WHERE a.owner_id = u.id
  AND u.email = 'mikhailyuv99@gmail.com';

-- Or fix every row where only the legacy column was set:
UPDATE merchant_accounts
SET subscription_product = 'starspin_multi_business'
WHERE multi_business_status = 'active'
  AND subscription_product = 'starspin';

-- Sync merchants for public pages / RLS:
UPDATE merchants m
SET subscription_status = a.subscription_status
FROM merchant_accounts a
WHERE m.account_id = a.id
  AND a.subscription_product = 'starspin_multi_business';
