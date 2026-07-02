"use client";

import Link from "next/link";
import type { BillingPlan } from "@/lib/billing";

export function SubscribeButton({
  plan,
  className = "",
  children,
}: {
  plan: BillingPlan;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="cadeo-subscribe-btn-wrap">
      <Link href={`/subscribe/checkout?plan=${plan}`} className={className}>
        {children}
      </Link>
    </div>
  );
}
