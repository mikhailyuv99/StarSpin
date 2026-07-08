-- Customer-journey visual theme (template id + optional accent override).
-- Stored as flexible jsonb like qr_design; defaults to the "pop" template.
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS journey_theme JSONB NOT NULL
  DEFAULT '{"v":1,"template":"pop","accent":null}'::jsonb;

COMMENT ON COLUMN merchants.journey_theme IS
  'Customer journey theme: { v, template: pop|arcade|luxe|candy|minimal, accent }';

NOTIFY pgrst, 'reload schema';
