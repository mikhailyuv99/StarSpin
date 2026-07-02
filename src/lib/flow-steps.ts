import type { Merchant, SocialLinks } from "@/lib/types";

export type FlowActionStep =
  | "google_review"
  | "instagram"
  | "facebook"
  | "tiktok"
  | "tripadvisor";

export type FixedPublicStep = "wheel" | "claim" | "result";
export type PublicStep = FlowActionStep | FixedPublicStep;

export const FLOW_ACTION_STEPS: FlowActionStep[] = [
  "google_review",
  "instagram",
  "facebook",
  "tiktok",
  "tripadvisor",
];

export const DEFAULT_FLOW_STEPS: FlowActionStep[] = ["google_review"];

const FLOW_ACTION_SET = new Set<string>(FLOW_ACTION_STEPS);

export function isFlowActionStep(value: string): value is FlowActionStep {
  return FLOW_ACTION_SET.has(value);
}

export function normalizeFlowSteps(raw: unknown): FlowActionStep[] {
  if (!Array.isArray(raw)) return [...DEFAULT_FLOW_STEPS];
  const steps: FlowActionStep[] = [];
  for (const item of raw) {
    if (typeof item === "string" && isFlowActionStep(item) && !steps.includes(item)) {
      steps.push(item);
    }
  }
  return steps.length > 0 ? steps : [...DEFAULT_FLOW_STEPS];
}

export function socialUrlForStep(step: FlowActionStep, links: SocialLinks): string | null {
  if (step === "google_review") return null;
  const url = links[step as keyof SocialLinks];
  return url?.trim() ? url.trim() : null;
}

export function isStepConfigured(step: FlowActionStep, merchant: Merchant): boolean {
  if (step === "google_review") {
    return Boolean(merchant.google_review_link?.trim());
  }
  return Boolean(socialUrlForStep(step, merchant.social_links));
}

export function resolveActiveFlowSteps(merchant: Merchant): FlowActionStep[] {
  const configured = normalizeFlowSteps(merchant.flow_steps).filter((step) =>
    isStepConfigured(step, merchant),
  );
  return configured.length > 0 ? configured : [...DEFAULT_FLOW_STEPS];
}

export function buildPublicStepOrder(merchant: Merchant): PublicStep[] {
  return [...resolveActiveFlowSteps(merchant), "wheel", "claim", "result"];
}

export function isSocialFlowStep(step: FlowActionStep): boolean {
  return step !== "google_review";
}
