import { OFFICIAL_SITE_URL } from "./brand";

/** Base app URL without trailing slash. */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const trimmed = raw.replace(/\/+$/, "");
  if (trimmed && !trimmed.includes("netlify.app")) return trimmed;
  if (process.env.NODE_ENV === "production") return OFFICIAL_SITE_URL;
  if (trimmed) return trimmed;
  return "http://localhost:3000";
}

export function publicMerchantUrl(slug: string): string {
  return `${getAppUrl()}/${encodeURIComponent(slug)}`;
}

export function publicMerchantPath(slug: string): string {
  return `/${slug}`;
}

export function publicMerchantPlayPath(slug: string): string {
  return `/${slug}/play`;
}

export function publicMerchantPlayUrl(slug: string): string {
  return `${getAppUrl()}${publicMerchantPlayPath(slug)}`;
}

export function publicMerchantMenuPath(slug: string): string {
  return `/${slug}/menu`;
}

export function publicMerchantMenuUrl(slug: string): string {
  return `${getAppUrl()}${publicMerchantMenuPath(slug)}`;
}

/** Slugs that collide with app routes — blocked at signup. */
export const RESERVED_SLUGS = new Set([
  "login",
  "setup",
  "dashboard",
  "admin",
  "auth",
  "api",
  "r",
  "subscribe",
  "checkout",
  "flow",
  "crm",
  "prizes",
  "reviews",
  "stats",
  "branding",
  "qr",
  "terms",
  "privacy",
  "billing",
]);

/** True for /{slug}, /{slug}/play, /{slug}/menu customer-facing routes. */
export function isPublicMerchantPath(pathname: string): boolean {
  const seg = pathname.split("/").filter(Boolean);
  if (seg.length === 0 || seg.length > 2) return false;
  if (RESERVED_SLUGS.has(seg[0])) return false;
  if (seg.length === 2 && seg[1] !== "play" && seg[1] !== "menu") return false;
  return true;
}