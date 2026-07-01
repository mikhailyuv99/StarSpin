ALTER TABLE spins
  ADD COLUMN IF NOT EXISTS claim_first_name TEXT,
  ADD COLUMN IF NOT EXISTS claim_email TEXT,
  ADD COLUMN IF NOT EXISTS prize_code TEXT,
  ADD COLUMN IF NOT EXISTS claim_notified_at TIMESTAMPTZ;

CREATE UNIQUE INDEX IF NOT EXISTS idx_spins_prize_code ON spins(prize_code) WHERE prize_code IS NOT NULL;
