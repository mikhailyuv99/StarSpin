-- Sync all establishment live status from the shared account subscription.
-- Run in Supabase SQL Editor after activating an account, or to repair
-- venues that were added while the account was already live.

-- One owner (preview):
SELECT
  u.email,
  m.name,
  m.slug,
  m.subscription_status AS merchant_status,
  a.subscription_status AS account_status
FROM merchants m
JOIN merchant_accounts a ON a.id = m.account_id
JOIN auth.users u ON u.id = a.owner_id
WHERE u.email = 'uzbechkavietnam@gmail.com';

-- Fix one owner:
UPDATE merchants m
SET subscription_status = a.subscription_status
FROM merchant_accounts a
JOIN auth.users u ON u.id = a.owner_id
WHERE m.account_id = a.id
  AND u.email = 'uzbechkavietnam@gmail.com';

-- Or fix every out-of-sync venue:
-- UPDATE merchants m
-- SET subscription_status = a.subscription_status
-- FROM merchant_accounts a
-- WHERE m.account_id = a.id
--   AND m.subscription_status IS DISTINCT FROM a.subscription_status;
