import type { Merchant } from "@/lib/types";
import { isMerchantLive } from "@/lib/merchant-access";
import { publicMerchantPath } from "@/lib/app-url";

export type SetupStepId = "subscribe" | "journey" | "prizes" | "qr" | "test";

export type SetupStep = {
  id: SetupStepId;
  href: string;
  done: boolean;
  optional?: boolean;
};

export function computeSetupSteps(merchant: Merchant, activePrizeCount: number): SetupStep[] {
  const subscribed = isMerchantLive(merchant.subscription_status);
  const hasReviewLink = Boolean(merchant.google_review_link?.trim());
  const hasPrizes = activePrizeCount > 0;

  return [
    { id: "subscribe", href: "/subscribe", done: subscribed },
    { id: "journey", href: "/dashboard/flow", done: hasReviewLink },
    { id: "prizes", href: "/dashboard/prizes", done: hasPrizes },
    { id: "qr", href: "/dashboard/qr", done: false, optional: true },
    { id: "test", href: publicMerchantPath(merchant.slug), done: false, optional: true },
  ];
}

export function setupProgress(steps: SetupStep[]) {
  const required = steps.filter((step) => !step.optional);
  const doneCount = required.filter((step) => step.done).length;
  return {
    doneCount,
    total: required.length,
    complete: doneCount === required.length,
  };
}
