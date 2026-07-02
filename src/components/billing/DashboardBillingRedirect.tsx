"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isBillingPlan } from "@/lib/billing";

/** Legacy ?subscribe= param → instant navigation to branded checkout. */
export function DashboardBillingRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const plan = searchParams.get("subscribe");
    if (!plan || !isBillingPlan(plan)) return;
    router.replace(`/subscribe/checkout?plan=${plan}`);
  }, [router, searchParams]);

  return null;
}
