import "./globals.css";
import { SiteChrome } from "@/components/SiteChrome";
import { SmoothScrollProvider } from "@/components/providers/SmoothScrollProvider";

export function SiteProviders({ children }: { children: React.ReactNode }) {
  return (
    <SiteChrome>
      <SmoothScrollProvider>{children}</SmoothScrollProvider>
    </SiteChrome>
  );
}
