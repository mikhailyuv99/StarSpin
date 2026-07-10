export type BillingPlan = "monthly" | "quarterly" | "annual";

/** Solo = 1 establishment; Multi = unlimited establishments on one subscription. */
export type PricingTier = "solo" | "multi";

/** Free trial length applied to every plan at subscription checkout. */
export const SUBSCRIPTION_TRIAL_DAYS = 7;

export function isBillingPlan(value: string): value is BillingPlan {
  return value === "monthly" || value === "quarterly" || value === "annual";
}
