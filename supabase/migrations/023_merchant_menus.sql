-- Merchant digital menu: settings + ordered content nodes + media bucket

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS menu_enabled BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS menu_entry_mode TEXT NOT NULL DEFAULT 'off';

ALTER TABLE merchants DROP CONSTRAINT IF EXISTS merchants_menu_entry_mode_check;
ALTER TABLE merchants
  ADD CONSTRAINT merchants_menu_entry_mode_check
  CHECK (menu_entry_mode IN ('off', 'hub', 'separate'));

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS menu_style JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS menu_background JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS menu_info JSONB NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS menu_updated_at TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS menu_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  position INT NOT NULL DEFAULT 0,
  type TEXT NOT NULL,
  visible BOOLEAN NOT NULL DEFAULT true,
  section_id UUID REFERENCES menu_nodes(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT menu_nodes_type_check CHECK (
    type IN (
      'section',
      'item',
      'heading',
      'text',
      'divider',
      'image',
      'gallery',
      'scan_page'
    )
  )
);

CREATE INDEX IF NOT EXISTS idx_menu_nodes_merchant_position
  ON menu_nodes (merchant_id, position);

CREATE INDEX IF NOT EXISTS idx_menu_nodes_section
  ON menu_nodes (section_id);

ALTER TABLE menu_nodes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS menu_nodes_public_read ON menu_nodes;
CREATE POLICY menu_nodes_public_read ON menu_nodes
  FOR SELECT TO anon, authenticated
  USING (
    visible = true
    AND EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = menu_nodes.merchant_id
        AND m.subscription_status = 'active'
        AND m.menu_enabled = true
    )
  );

DROP POLICY IF EXISTS menu_nodes_owner_manage ON menu_nodes;
CREATE POLICY menu_nodes_owner_manage ON menu_nodes
  FOR ALL TO authenticated
  USING (owns_merchant(merchant_id) OR is_admin())
  WITH CHECK (owns_merchant(merchant_id) OR is_admin());

INSERT INTO storage.buckets (id, name, public)
VALUES ('menu-media', 'menu-media', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS menu_media_public_read ON storage.objects;
CREATE POLICY menu_media_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'menu-media');

DROP POLICY IF EXISTS menu_media_owner_upload ON storage.objects;
CREATE POLICY menu_media_owner_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'menu-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS menu_media_owner_update ON storage.objects;
CREATE POLICY menu_media_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'menu-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

DROP POLICY IF EXISTS menu_media_owner_delete ON storage.objects;
CREATE POLICY menu_media_owner_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'menu-media'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

NOTIFY pgrst, 'reload schema';
