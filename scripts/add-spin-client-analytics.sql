-- Run on production Supabase if migration 025 is not applied yet.
ALTER TABLE public.spins
  ADD COLUMN IF NOT EXISTS client_locale text,
  ADD COLUMN IF NOT EXISTS client_user_agent text,
  ADD COLUMN IF NOT EXISTS client_ip text;
