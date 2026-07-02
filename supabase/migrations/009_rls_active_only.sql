-- Public read only for merchants with paid Stripe subscription (active).
-- Legacy `trial` enum rows are no longer used for free access (see 008).

DROP POLICY IF EXISTS merchants_public_read ON merchants;
CREATE POLICY merchants_public_read ON merchants
  FOR SELECT TO anon, authenticated
  USING (subscription_status = 'active');

DROP POLICY IF EXISTS prizes_public_read ON prizes;
CREATE POLICY prizes_public_read ON prizes
  FOR SELECT TO anon, authenticated
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = prizes.merchant_id
        AND m.subscription_status = 'active'
    )
  );
