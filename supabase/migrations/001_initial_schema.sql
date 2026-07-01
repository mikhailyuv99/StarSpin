-- Roue Fidélité — initial schema
-- Run in Supabase SQL Editor or via supabase db push

-- Enums
CREATE TYPE subscription_status AS ENUM ('active', 'trial', 'past_due', 'cancelled');
CREATE TYPE review_screenshot_status AS ENUM ('pending', 'verified', 'rejected');

-- Admins (super-admin access)
CREATE TABLE admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Merchants
CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  logo_url TEXT,
  primary_color TEXT NOT NULL DEFAULT '#E85D04',
  secondary_color TEXT NOT NULL DEFAULT '#F48C06',
  google_review_link TEXT,
  google_place_id TEXT,
  social_links JSONB NOT NULL DEFAULT '{}'::jsonb,
  subscription_status subscription_status NOT NULL DEFAULT 'trial',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT slug_format CHECK (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

CREATE INDEX idx_merchants_owner ON merchants(owner_id);
CREATE INDEX idx_merchants_slug ON merchants(slug);
CREATE INDEX idx_merchants_subscription ON merchants(subscription_status);

-- Prizes
CREATE TABLE prizes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  probability_weight INT NOT NULL DEFAULT 1 CHECK (probability_weight > 0),
  stock_remaining INT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_prizes_merchant ON prizes(merchant_id);
CREATE INDEX idx_prizes_active ON prizes(merchant_id, active);

-- OTP verifications
CREATE TABLE otp_verifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  phone_number TEXT NOT NULL,
  code TEXT NOT NULL,
  verified BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_otp_lookup ON otp_verifications(merchant_id, phone_number, verified);
CREATE INDEX idx_otp_expires ON otp_verifications(expires_at);

-- Spins
CREATE TABLE spins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  prize_id UUID NOT NULL REFERENCES prizes(id) ON DELETE RESTRICT,
  device_fingerprint TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  followed_social BOOLEAN NOT NULL DEFAULT false,
  review_screenshot_url TEXT,
  review_screenshot_status review_screenshot_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_spins_merchant ON spins(merchant_id);
CREATE INDEX idx_spins_phone ON spins(merchant_id, phone_number, created_at DESC);
CREATE INDEX idx_spins_fingerprint ON spins(merchant_id, device_fingerprint, created_at DESC);
CREATE INDEX idx_spins_created ON spins(merchant_id, created_at DESC);

-- Review count history (Places API cron)
CREATE TABLE review_counts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  count INT NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_review_counts_merchant ON review_counts_history(merchant_id, checked_at DESC);

-- Helper: is current user admin?
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM admins WHERE user_id = auth.uid()
  );
$$;

-- Helper: does user own merchant?
CREATE OR REPLACE FUNCTION owns_merchant(merchant_uuid UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM merchants
    WHERE id = merchant_uuid AND owner_id = auth.uid()
  );
$$;

-- RLS
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE otp_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE spins ENABLE ROW LEVEL SECURITY;
ALTER TABLE review_counts_history ENABLE ROW LEVEL SECURITY;

-- admins policies
CREATE POLICY admins_select_self ON admins
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY admins_manage ON admins
  FOR ALL TO authenticated
  USING (is_admin())
  WITH CHECK (is_admin());

-- merchants policies
CREATE POLICY merchants_public_read ON merchants
  FOR SELECT TO anon, authenticated
  USING (subscription_status IN ('active', 'trial'));

CREATE POLICY merchants_owner_all ON merchants
  FOR ALL TO authenticated
  USING (owner_id = auth.uid() OR is_admin())
  WITH CHECK (owner_id = auth.uid() OR is_admin());

-- prizes policies
CREATE POLICY prizes_public_read ON prizes
  FOR SELECT TO anon, authenticated
  USING (
    active = true
    AND EXISTS (
      SELECT 1 FROM merchants m
      WHERE m.id = prizes.merchant_id
        AND m.subscription_status IN ('active', 'trial')
    )
  );

CREATE POLICY prizes_owner_manage ON prizes
  FOR ALL TO authenticated
  USING (owns_merchant(merchant_id) OR is_admin())
  WITH CHECK (owns_merchant(merchant_id) OR is_admin());

-- spins: owners read & update review status, writes via service role only
CREATE POLICY spins_owner_read ON spins
  FOR SELECT TO authenticated
  USING (owns_merchant(merchant_id) OR is_admin());

CREATE POLICY spins_owner_update_review ON spins
  FOR UPDATE TO authenticated
  USING (owns_merchant(merchant_id) OR is_admin())
  WITH CHECK (owns_merchant(merchant_id) OR is_admin());

-- review_counts: merchants read own
CREATE POLICY review_counts_owner_read ON review_counts_history
  FOR SELECT TO authenticated
  USING (owns_merchant(merchant_id) OR is_admin());

-- Storage buckets (run in dashboard or here)
INSERT INTO storage.buckets (id, name, public)
VALUES
  ('merchant-logos', 'merchant-logos', true),
  ('review-screenshots', 'review-screenshots', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY merchant_logos_public_read ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'merchant-logos');

CREATE POLICY merchant_logos_owner_upload ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'merchant-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY merchant_logos_owner_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'merchant-logos'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY review_screenshots_owner_read ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'review-screenshots'
    AND (
      is_admin()
      OR EXISTS (
        SELECT 1 FROM merchants m
        WHERE m.owner_id = auth.uid()
          AND (storage.foldername(name))[1] = m.id::text
      )
    )
  );

-- Seed helper comment: add first admin after signup
-- INSERT INTO admins (user_id) VALUES ('your-auth-user-uuid');
