-- End free app-level trial: subscribe required, 7-day trial starts at checkout (Stripe trialing).

ALTER TABLE merchants
  ALTER COLUMN subscription_status SET DEFAULT 'cancelled';

UPDATE merchants
  SET subscription_status = 'cancelled'
  WHERE subscription_status = 'trial';
