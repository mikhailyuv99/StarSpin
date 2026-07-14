"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import type { BillingPlan, PricingTier } from "@/lib/billing";
import { getStripePublishableKey } from "@/lib/stripe-client";
import { getStripeBrowser } from "@/lib/stripe-browser";

export function SubscribeButton({
  plan,
  tier = "solo",
  className = "",
  children,
}: {
  plan: BillingPlan;
  tier?: PricingTier;
  className?: string;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const base = tier === "multi" ? "/subscribe/multi-business" : "/subscribe/checkout";
  const href = `${base}?plan=${plan}`;

  useEffect(() => {
    router.prefetch(href);
    try {
      void getStripeBrowser(getStripePublishableKey());
    } catch {
      /* publishable key missing in some envs */
    }
  }, [router, href]);

  return (
    <div className="cadeo-subscribe-btn-wrap">
      <Link
        href={href}
        prefetch
        className={className}
        onMouseEnter={() => router.prefetch(href)}
        onFocus={() => router.prefetch(href)}
      >
        {children}
      </Link>
    </div>
  );
}
