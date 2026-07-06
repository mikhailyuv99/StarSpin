-- QR colors + customer journey page copy
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS qr_fg_color TEXT NOT NULL DEFAULT '#0a0a0a';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS qr_bg_color TEXT NOT NULL DEFAULT '#ffffff';
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS customer_page_headline TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS customer_page_subtitle TEXT;
ALTER TABLE merchants ADD COLUMN IF NOT EXISTS spin_button_label TEXT;

NOTIFY pgrst, 'reload schema';
