"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { isBillingPlan } from "@/lib/billing";

/** After login, auto-start Stripe checkout when ?subscribe=monthly|annual is present. */
export function DashboardBillingRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const plan = searchParams.get("subscribe");
    if (!plan || !isBillingPlan(plan)) return;

    let cancelled = false;

    (async () => {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      });

      if (cancelled) return;

      const data = (await res.json()) as { url?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }

      router.replace("/dashboard");
    })();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  return null;
}
