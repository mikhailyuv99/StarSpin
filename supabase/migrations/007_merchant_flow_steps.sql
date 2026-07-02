-- Configurable customer journey steps + CRM tracking on spins

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS flow_steps JSONB NOT NULL DEFAULT '["google_review"]'::jsonb;

ALTER TABLE spins
  ADD COLUMN IF NOT EXISTS completed_flow_steps JSONB NOT NULL DEFAULT '[]'::jsonb;

COMMENT ON COLUMN merchants.flow_steps IS
  'Ordered pre-spin steps: google_review, instagram, facebook, tiktok, tripadvisor';
