export type BillingPlan = "monthly" | "quarterly" | "annual";

export function isBillingPlan(value: string): value is BillingPlan {
  return value === "monthly" || value === "quarterly" || value === "annual";
}
