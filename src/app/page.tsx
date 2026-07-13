import { SiteProviders } from "./load-site-css";
import { LandingPage } from "@/components/marketing/LandingPage";

export default function HomePage() {
  return (
    <SiteProviders>
      <LandingPage />
    </SiteProviders>
  );
}
