import { NextResponse, NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";
import { isLocale, localeFromCountry, LOCALE_COOKIE } from "@/i18n/config";
import { isPublicMerchantPath } from "@/lib/app-url";
import {
  countryFromNetlifyMiddleware,
  countryFromPlatformHeaders,
  pricingMarketFromCountry,
} from "@/lib/pricing-market";

export async function middleware(request: NextRequest) {
  const country =
    countryFromNetlifyMiddleware() ?? countryFromPlatformHeaders(request.headers);
  const market = pricingMarketFromCountry(country);
  const geoLocale = localeFromCountry(country);

  const requestHeaders = new Headers(request.headers);
  if (country) {
    requestHeaders.set("x-starspin-country", country);
  }
  requestHeaders.set("x-starspin-pricing-market", market);
  if (isPublicMerchantPath(request.nextUrl.pathname)) {
    requestHeaders.set("x-starspin-public-journey", "1");
  }

  const enrichedRequest = new NextRequest(request.url, {
    headers: requestHeaders,
    method: request.method,
  });

  const response =
    (await updateSession(enrichedRequest)) ??
    NextResponse.next({
      request: { headers: requestHeaders },
    });

  if (country) {
    response.headers.set("x-starspin-country", country);
  }
  response.headers.set("x-starspin-pricing-market", market);

  // French IPs get French UI by default — only when the user hasn't chosen a locale yet.
  const existingLocale = request.cookies.get(LOCALE_COOKIE)?.value;
  if (geoLocale && (!existingLocale || !isLocale(existingLocale))) {
    response.cookies.set(LOCALE_COOKIE, geoLocale, {
      path: "/",
      maxAge: 60 * 60 * 24 * 365,
      sameSite: "lax",
    });
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
