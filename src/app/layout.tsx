import { headers } from "next/headers";
import type { Metadata } from "next";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { PricingMarketProvider } from "@/components/providers/PricingMarketProvider";
import { I18nProvider } from "@/i18n/client";
import { getMessages, getPublicJourneyMessages } from "@/i18n/get-messages";
import { getLocale, getTranslations } from "@/i18n/server";
import { OFFICIAL_SITE_URL } from "@/lib/brand";
import { pricingMarketFromHeaders } from "@/lib/pricing-market";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    metadataBase: new URL(OFFICIAL_SITE_URL),
    title: t("meta.title"),
    description: t("meta.description"),
    alternates: {
      canonical: "/",
    },
    icons: {
      icon: [
        { url: "/icon.png", sizes: "512x512", type: "image/png" },
        { url: "/favicon.ico", sizes: "48x48" },
      ],
      apple: [{ url: "/apple-icon.png", sizes: "180x180", type: "image/png" }],
    },
    manifest: "/manifest.webmanifest",
    openGraph: {
      type: "website",
      url: OFFICIAL_SITE_URL,
      siteName: "STARSPIN",
      title: t("meta.title"),
      description: t("meta.description"),
      images: [
        {
          url: "/opengraph-image.png",
          width: 1200,
          height: 630,
          alt: "STARSPIN",
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: t("meta.title"),
      description: t("meta.description"),
      images: ["/twitter-image.png"],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const headerStore = await headers();
  const isPublicJourney = headerStore.get("x-starspin-public-journey") === "1";
  const messages = isPublicJourney ? getPublicJourneyMessages(locale) : getMessages(locale);
  const pricingMarket = pricingMarketFromHeaders(headerStore);

  return (
    <html lang={locale} className={`locale-${locale} antialiased`}>
      <body
        className={
          isPublicJourney
            ? "font-sans [font-family:system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif]"
            : "font-sans"
        }
      >
        <PricingMarketProvider market={pricingMarket}>
          <I18nProvider locale={locale} messages={messages}>
            {isPublicJourney ? children : <SmoothScrollProvider>{children}</SmoothScrollProvider>}
          </I18nProvider>
        </PricingMarketProvider>
      </body>
    </html>
  );
}
