import { IBM_Plex_Mono, IBM_Plex_Sans, Bricolage_Grotesque, DM_Sans, Fredoka, Baloo_2, Nunito, Rubik, Comfortaa } from "next/font/google";
import type { Metadata } from "next";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { I18nProvider } from "@/i18n/client";
import { getMessages } from "@/i18n/get-messages";
import { getLocale, getTranslations } from "@/i18n/server";
import { OFFICIAL_SITE_URL } from "@/lib/brand";
import "./globals.css";

const plexSans = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-plex-sans",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plex-mono",
  preload: false,
});

const display = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-display",
});

const bodyFont = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-body",
});

const gameFont = Fredoka({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-game",
});

const gameFontCyrillic = Comfortaa({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["600", "700"],
  variable: "--font-game-cyrillic",
  preload: false,
});

const bodyRu = Nunito({
  subsets: ["latin", "cyrillic", "cyrillic-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body-ru",
  preload: false,
});

const displayRu = Rubik({
  subsets: ["latin", "cyrillic"],
  weight: ["600", "700", "800"],
  variable: "--font-display-ru",
  preload: false,
});

const bodyVi = Nunito({
  subsets: ["latin", "vietnamese", "latin-ext"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-body-vi",
  preload: false,
});

const displayVi = Baloo_2({
  subsets: ["latin", "vietnamese", "latin-ext"],
  weight: ["600", "700", "800"],
  variable: "--font-display-vi",
  preload: false,
});

const gameVi = Baloo_2({
  subsets: ["latin", "vietnamese"],
  weight: ["600", "700", "800"],
  variable: "--font-game-vi",
  preload: false,
});

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
  const messages = getMessages(locale);

  return (
    <html
      lang={locale}
      className={`locale-${locale} ${plexSans.variable} ${plexMono.variable} ${display.variable} ${bodyFont.variable} ${gameFont.variable} ${gameFontCyrillic.variable} ${bodyRu.variable} ${displayRu.variable} ${bodyVi.variable} ${displayVi.variable} ${gameVi.variable} antialiased`}
    >
      <body className="font-sans [font-family:var(--font-body),var(--font-plex-sans),system-ui,sans-serif]">
        <I18nProvider locale={locale} messages={messages}>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
