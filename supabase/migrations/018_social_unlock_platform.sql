-- Which social follow is required when prize_mechanic = social_unlock.

ALTER TABLE prizes
  ADD COLUMN IF NOT EXISTS social_unlock_platform TEXT;

ALTER TABLE prizes DROP CONSTRAINT IF EXISTS prizes_social_unlock_platform_check;
ALTER TABLE prizes
  ADD CONSTRAINT prizes_social_unlock_platform_check
  CHECK (
    social_unlock_platform IS NULL
    OR social_unlock_platform IN ('instagram', 'facebook', 'tiktok')
  );

COMMENT ON COLUMN prizes.social_unlock_platform IS 'Required when prize_mechanic is social_unlock: which social link customers must follow before the wheel.';
