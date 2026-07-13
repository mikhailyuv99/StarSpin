import { SiteProviders } from "../load-site-css";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <SiteProviders>{children}</SiteProviders>;
}
