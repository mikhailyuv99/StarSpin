import { siteFontClassName } from "@/lib/site-fonts";

/** Wraps marketing/dashboard trees so next/font CSS never loads on QR journeys. */
export function SiteChrome({ children }: { children: React.ReactNode }) {
  return (
    <div
      className={`site-chrome ${siteFontClassName} min-h-dvh [font-family:var(--font-body),var(--font-plex-sans),system-ui,sans-serif]`}
    >
      {children}
    </div>
  );
}
