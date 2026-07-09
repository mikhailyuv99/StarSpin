ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS prize_odds_mode TEXT NOT NULL DEFAULT 'simple';

ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_prize_odds_mode_check;
ALTER TABLE merchants
  ADD CONSTRAINT merchants_prize_odds_mode_check
  CHECK (prize_odds_mode IN ('simple', 'advanced'));

ALTER TABLE prizes
  ADD COLUMN IF NOT EXISTS rarity_tier TEXT NOT NULL DEFAULT 'common';

ALTER TABLE prizes DROP CONSTRAINT IF EXISTS prizes_rarity_tier_check;
ALTER TABLE prizes
  ADD CONSTRAINT prizes_rarity_tier_check
  CHECK (rarity_tier IN ('common', 'uncommon', 'rare', 'epic', 'jackpot'));
