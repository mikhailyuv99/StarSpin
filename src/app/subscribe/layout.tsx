import Script from "next/script";
import { SiteProviders } from "../load-site-css";
import { getStripePublishableKey } from "@/lib/stripe-client";

export default function SubscribeLayout({ children }: { children: React.ReactNode }) {
  let publishableKey = "";
  try {
    publishableKey = getStripePublishableKey();
  } catch {
    publishableKey = "";
  }

  return (
    <SiteProviders>
      {publishableKey ? (
        <Script src="https://js.stripe.com/v3/" strategy="afterInteractive" />
      ) : null}
      {children}
    </SiteProviders>
  );
}
