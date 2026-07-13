import { SiteProviders } from "../load-site-css";

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <SiteProviders>{children}</SiteProviders>;
}
