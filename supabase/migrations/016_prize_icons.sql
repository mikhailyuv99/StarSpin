-- Prize wheel icons (merchant-selected silhouette key per prize)
ALTER TABLE prizes
  ADD COLUMN IF NOT EXISTS icon TEXT;

COMMENT ON COLUMN prizes.icon IS 'Catalog key for the wheel silhouette (e.g. coffee, percent_10, try_again).';
