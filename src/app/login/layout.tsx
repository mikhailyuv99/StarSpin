import { SiteProviders } from "../load-site-css";

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return <SiteProviders>{children}</SiteProviders>;
}
