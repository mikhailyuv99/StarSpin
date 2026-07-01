import { IBM_Plex_Mono, IBM_Plex_Sans, Bricolage_Grotesque, DM_Sans } from "next/font/google";
import type { Metadata } from "next";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";
import { I18nProvider } from "@/i18n/client";
import { getMessages } from "@/i18n/get-messages";
import { getLocale, getTranslations } from "@/i18n/server";
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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("meta.title"),
    description: t("meta.description"),
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
      className={`${plexSans.variable} ${plexMono.variable} ${display.variable} ${bodyFont.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans [font-family:var(--font-body),var(--font-plex-sans),system-ui,sans-serif]">
        <I18nProvider locale={locale} messages={messages}>
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </I18nProvider>
      </body>
    </html>
  );
}
