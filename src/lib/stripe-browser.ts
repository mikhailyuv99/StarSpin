import type { Stripe } from "@stripe/stripe-js";
import { loadStripe } from "@stripe/stripe-js";

const cache = new Map<string, Promise<Stripe | null>>();

/** Shared Stripe.js promise so subscribe → checkout reuses a warmed load. */
export function getStripeBrowser(publishableKey: string): Promise<Stripe | null> {
  let pending = cache.get(publishableKey);
  if (!pending) {
    pending = loadStripe(publishableKey);
    cache.set(publishableKey, pending);
  }
  return pending;
}
