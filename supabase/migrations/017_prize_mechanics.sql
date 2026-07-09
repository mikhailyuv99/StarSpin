-- Per-slice game mechanics + literal win % stored in probability_weight (must sum to 100 per merchant active wheel).

ALTER TABLE prizes
  ADD COLUMN IF NOT EXISTS prize_mechanic TEXT NOT NULL DEFAULT 'standard';

ALTER TABLE prizes DROP CONSTRAINT IF EXISTS prizes_prize_mechanic_check;
ALTER TABLE prizes
  ADD CONSTRAINT prizes_prize_mechanic_check
  CHECK (
    prize_mechanic IN (
      'standard',
      'retry',
      'no_win',
      'near_miss',
      'mystery',
      'double_or_nothing',
      'social_unlock'
    )
  );

UPDATE prizes SET prize_mechanic = 'retry' WHERE icon = 'try_again' AND prize_mechanic = 'standard';
UPDATE prizes SET prize_mechanic = 'no_win' WHERE icon = 'no_prize' AND prize_mechanic = 'standard';

ALTER TABLE spins
  ADD COLUMN IF NOT EXISTS resolved_prize_id UUID REFERENCES prizes(id) ON DELETE SET NULL;

COMMENT ON COLUMN prizes.probability_weight IS 'Win chance percent 1–100; active wheel prizes for a merchant should sum to 100.';
COMMENT ON COLUMN prizes.prize_mechanic IS 'Slice behavior: standard, retry, near_miss, mystery, double_or_nothing, social_unlock, no_win.';
COMMENT ON COLUMN spins.resolved_prize_id IS 'Actual claimable prize when display slice uses mystery / double-or-nothing resolution.';
