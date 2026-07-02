import type { BillingPlan } from "@/lib/billing";

export type CheckoutResult =
  | { ok: true; url: string }
  | { ok: false; status: number; error: string };

export async function startCheckoutSession(plan: BillingPlan): Promise<CheckoutResult> {
  const res = await fetch("/api/stripe/checkout", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });

  let data: { url?: string; error?: string } = {};
  try {
    data = (await res.json()) as { url?: string; error?: string };
  } catch {
    return { ok: false, status: res.status, error: "invalid_response" };
  }

  if (data.url) {
    return { ok: true, url: data.url };
  }

  return {
    ok: false,
    status: res.status,
    error: data.error ?? (res.status === 401 ? "unauthorized" : "checkout_failed"),
  };
}
