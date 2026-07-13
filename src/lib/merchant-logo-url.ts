/** Build a small CDN logo URL for fast LCP (64–128px display). */
export function merchantLogoDisplayUrl(
  logoUrl: string | null | undefined,
  size = 128,
): string | null {
  if (!logoUrl) return null;

  try {
    const url = new URL(logoUrl);
    // Supabase image transformation (falls back to original if project has it disabled).
    if (url.hostname.endsWith(".supabase.co") && url.pathname.includes("/object/public/")) {
      url.pathname = url.pathname.replace("/object/public/", "/render/image/public/");
      url.searchParams.set("width", String(size));
      url.searchParams.set("height", String(size));
      url.searchParams.set("resize", "cover");
      url.searchParams.set("quality", "70");
      return url.toString();
    }
  } catch {
    // keep original
  }

  return logoUrl;
}
