import { SiteProviders } from "../load-site-css";

export default function TermsLayout({ children }: { children: React.ReactNode }) {
  return <SiteProviders>{children}</SiteProviders>;
}
