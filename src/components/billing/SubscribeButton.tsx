"use client";

import Link from "next/link";
import type { BillingPlan, PricingTier } from "@/lib/billing";

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
  const base = tier === "multi" ? "/subscribe/multi-business" : "/subscribe/checkout";
  const href = `${base}?plan=${plan}`;

  return (
    <div className="cadeo-subscribe-btn-wrap">
      <Link href={href} className={className}>
        {children}
      </Link>
    </div>
  );
}
