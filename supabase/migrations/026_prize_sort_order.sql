-- Merchant-controlled wheel slice order (dashboard ↑/↓ + public wheel).
ALTER TABLE prizes
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

WITH ranked AS (
  SELECT
    id,
    (ROW_NUMBER() OVER (PARTITION BY merchant_id ORDER BY created_at ASC) - 1)::integer AS rn
  FROM prizes
)
UPDATE prizes p
SET sort_order = ranked.rn
FROM ranked
WHERE p.id = ranked.id;

CREATE INDEX IF NOT EXISTS idx_prizes_merchant_sort
  ON prizes (merchant_id, sort_order);
