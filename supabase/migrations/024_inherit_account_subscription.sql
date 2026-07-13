-- New establishments inherit live status from the shared account subscription.
-- Multi-business is one subscription for all venues; merchants.subscription_status
-- is a mirror used by public RLS / journey pages.

CREATE OR REPLACE FUNCTION merchants_inherit_account_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.account_id IS NOT NULL THEN
    SELECT a.subscription_status
    INTO NEW.subscription_status
    FROM merchant_accounts a
    WHERE a.id = NEW.account_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS merchants_inherit_account_subscription ON merchants;
CREATE TRIGGER merchants_inherit_account_subscription
  BEFORE INSERT ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION merchants_inherit_account_subscription();

-- Repair existing venues that were created while the account was already live.
UPDATE merchants m
SET subscription_status = a.subscription_status
FROM merchant_accounts a
WHERE m.account_id = a.id
  AND m.subscription_status IS DISTINCT FROM a.subscription_status;
