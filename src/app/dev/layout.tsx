import { SiteProviders } from "../load-site-css";

export default function DevLayout({ children }: { children: React.ReactNode }) {
  return <SiteProviders>{children}</SiteProviders>;
}
