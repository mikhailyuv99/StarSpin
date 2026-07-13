import { SiteProviders } from "../load-site-css";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <SiteProviders>{children}</SiteProviders>;
}
