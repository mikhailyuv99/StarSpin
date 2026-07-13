-- Analytics fields on every spin (locale, UA, IP) for merchant CRM.
ALTER TABLE public.spins
  ADD COLUMN IF NOT EXISTS client_locale text,
  ADD COLUMN IF NOT EXISTS client_user_agent text,
  ADD COLUMN IF NOT EXISTS client_ip text;

COMMENT ON COLUMN public.spins.client_locale IS 'UI locale from customer journey request';
COMMENT ON COLUMN public.spins.client_user_agent IS 'Truncated User-Agent at spin time';
COMMENT ON COLUMN public.spins.client_ip IS 'Client IP (x-forwarded-for / x-real-ip) at spin time';
