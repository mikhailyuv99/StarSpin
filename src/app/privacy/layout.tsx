import { SiteProviders } from "../load-site-css";

export default function PrivacyLayout({ children }: { children: React.ReactNode }) {
  return <SiteProviders>{children}</SiteProviders>;
}
