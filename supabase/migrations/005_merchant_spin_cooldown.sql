-- Per-merchant spin cooldown (days between spins per device). 0 = no limit.
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS spin_cooldown_days INTEGER NOT NULL DEFAULT 0;

ALTER TABLE merchants
  DROP CONSTRAINT IF EXISTS merchants_spin_cooldown_days_check;

ALTER TABLE merchants
  ADD CONSTRAINT merchants_spin_cooldown_days_check
  CHECK (spin_cooldown_days >= 0 AND spin_cooldown_days <= 365);
