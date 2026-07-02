import { OFFICIAL_SITE_URL } from "./brand";

/** Base app URL without trailing slash. */
export function getAppUrl(): string {
  const raw = process.env.NEXT_PUBLIC_APP_URL ?? "";
  const trimmed = raw.replace(/\/+$/, "");
  if (trimmed) return trimmed;
  if (process.env.NODE_ENV === "production") return OFFICIAL_SITE_URL;
  return "http://localhost:3000";
}

export function publicMerchantUrl(slug: string): string {
  return `${getAppUrl()}/${encodeURIComponent(slug)}`;
}

export function publicMerchantPath(slug: string): string {
  return `/${slug}`;
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
]);
