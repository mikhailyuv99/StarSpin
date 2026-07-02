export type BillingPlan = "monthly" | "annual";

export function isBillingPlan(value: string): value is BillingPlan {
  return value === "monthly" || value === "annual";
}
