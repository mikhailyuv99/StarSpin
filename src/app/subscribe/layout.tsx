import { SiteProviders } from "../load-site-css";

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  return <SiteProviders>{children}</SiteProviders>;
}
