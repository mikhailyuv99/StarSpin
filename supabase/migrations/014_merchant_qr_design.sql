ALTER TABLE merchants ADD COLUMN IF NOT EXISTS qr_design JSONB NOT NULL DEFAULT '{}'::jsonb;

NOTIFY pgrst, 'reload schema';
