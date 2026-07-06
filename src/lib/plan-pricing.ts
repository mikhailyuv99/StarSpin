import type { BillingPlan } from "@/lib/billing";

export type PlanPricing = { vnd: number; eur: number };

/** Google FX reference (Jul 2026): 1 EUR = 30,034 VND */
export const EUR_TO_VND = 30_034;

function eurToVnd(eur: number): number {
  return Math.round(eur * EUR_TO_VND);
}

/** Display prices (Stripe still charges EUR). */
export const PLAN_PRICING: Record<BillingPlan, PlanPricing> = {
  monthly: { eur: 34, vnd: eurToVnd(34) },
  quarterly: { eur: 76.5, vnd: eurToVnd(76.5) }, // 34€ × 3 mo, −25%
  annual: { eur: 244, vnd: eurToVnd(244) }, // −40% vs 34€ × 12
};

export function formatPlanVnd(amount: number): string {
  return new Intl.NumberFormat("vi-VN", {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPlanEur(amount: number): string {
  const formatted = Number.isInteger(amount)
    ? String(amount)
    : amount.toLocaleString("fr-FR", { maximumFractionDigits: 2 });
  return `${formatted}€`;
}
