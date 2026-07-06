-- Allow deleting prizes that already have spins (wheel history keeps the spin row).
ALTER TABLE spins DROP CONSTRAINT IF EXISTS spins_prize_id_fkey;
ALTER TABLE spins ALTER COLUMN prize_id DROP NOT NULL;
ALTER TABLE spins
  ADD CONSTRAINT spins_prize_id_fkey
  FOREIGN KEY (prize_id) REFERENCES prizes(id) ON DELETE SET NULL;
