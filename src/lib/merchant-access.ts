/** Merchant subscription allows live public wheel (paid or Stripe trialing). */
export function isMerchantLive(status: string): boolean {
  return status === "active";
}

export function needsSubscription(status: string): boolean {
  return !isMerchantLive(status);
}
