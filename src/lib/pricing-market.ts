import { marketFromPriceId } from "@/lib/stripe";

export type PricingMarket = "vn" | "fr";

export function pricingMarketFromCountry(country: string | null | undefined): PricingMarket {
  return country?.toUpperCase() === "FR" ? "fr" : "vn";
}

/** Read country from CDN / platform geo headers (not client-controlled). */
export function countryFromPlatformHeaders(headers: Headers): string | null {
  const vercel = headers.get("x-vercel-ip-country");
  if (vercel) return vercel;

  const cf = headers.get("cf-ipcountry");
  if (cf && cf !== "XX") return cf;

  const netlify = headers.get("x-nf-country");
  if (netlify) return netlify;

  const nfGeo = headers.get("x-nf-geo");
  if (nfGeo) {
    try {
      const geo = JSON.parse(nfGeo) as { country?: { code?: string } };
      if (geo.country?.code) return geo.country.code;
    } catch {
      /* ignore malformed geo header */
    }
  }

  return null;
}

/** Platform geo, or country stamped by our middleware on the same request. */
export function countryFromHeaders(headers: Headers): string | null {
  const platform = countryFromPlatformHeaders(headers);
  if (platform) return platform;

  const forwarded = headers.get("x-starspin-country");
  if (forwarded) return forwarded;

  return null;
}

export function pricingMarketFromHeaders(headers: Headers): PricingMarket {
  return pricingMarketFromCountry(countryFromHeaders(headers));
}

export function pricingMarketFromRequest(request: Request): PricingMarket {
  return pricingMarketFromHeaders(request.headers);
}

/** Netlify middleware global — geo is only available here on Netlify deploys. */
export function countryFromNetlifyMiddleware(): string | null {
  try {
    const netlify = (
      globalThis as typeof globalThis & {
        Netlify?: { context?: { geo?: { country?: { code?: string } } } };
      }
    ).Netlify;
    return netlify?.context?.geo?.country?.code ?? null;
  } catch {
    return null;
  }
}

/** France geo always wins; otherwise keep an existing subscription on its price tier. */
export function pricingMarketForBilling(
  headers: Headers,
  subscriptionPriceId?: string | null,
): PricingMarket {
  const geoMarket = pricingMarketFromHeaders(headers);
  if (geoMarket === "fr") return "fr";

  if (subscriptionPriceId) {
    const subscriptionMarket = marketFromPriceId(subscriptionPriceId);
    if (subscriptionMarket) return subscriptionMarket;
  }

  return "vn";
}
