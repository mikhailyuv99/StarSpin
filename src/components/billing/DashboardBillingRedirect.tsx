"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isBillingPlan } from "@/lib/billing";
import { startCheckoutSession } from "@/lib/billing-checkout";

/** After login, auto-start Stripe checkout when ?subscribe=monthly|annual is present. */
export function DashboardBillingRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const plan = searchParams.get("subscribe");
    if (!plan || !isBillingPlan(plan)) return;

    let cancelled = false;

    (async () => {
      const result = await startCheckoutSession(plan);
      if (cancelled) return;

      if (result.ok) {
        window.location.assign(result.url);
        return;
      }

      if (result.status === 401) {
        router.replace(`/login?redirect=/subscribe&plan=${plan}`);
        return;
      }

      router.replace("/subscribe?checkout=error");
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return null;
}
