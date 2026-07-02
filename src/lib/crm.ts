import type { Spin } from "@/lib/types";

export type CrmContact = {
  email: string;
  firstName: string | null;
  phone: string | null;
  spinCount: number;
  lastSpinAt: string;
  prizes: string[];
};

export type CrmFunnel = {
  totalSpins: number;
  withReview: number;
  withSocial: number;
  withEmail: number;
  withClaim: number;
};

export function aggregateCrmContacts(spins: Spin[]): CrmContact[] {
  const byEmail = new Map<string, CrmContact>();

  for (const spin of spins) {
    const email = spin.claim_email?.trim().toLowerCase();
    if (!email) continue;

    const prizeLabel = spin.prize?.label ?? "-";
    const existing = byEmail.get(email);
    if (!existing) {
      byEmail.set(email, {
        email,
        firstName: spin.claim_first_name ?? null,
        phone: spin.phone_number ?? spin.claim_phone ?? null,
        spinCount: 1,
        lastSpinAt: spin.created_at,
        prizes: [prizeLabel],
      });
      continue;
    }

    existing.spinCount += 1;
    if (spin.created_at > existing.lastSpinAt) {
      existing.lastSpinAt = spin.created_at;
      existing.firstName = spin.claim_first_name ?? existing.firstName;
      existing.phone = spin.phone_number ?? spin.claim_phone ?? existing.phone;
    }
    if (!existing.prizes.includes(prizeLabel)) {
      existing.prizes.push(prizeLabel);
    }
  }

  return [...byEmail.values()].sort((a, b) => b.lastSpinAt.localeCompare(a.lastSpinAt));
}

export function computeCrmFunnel(spins: Spin[]): CrmFunnel {
  return {
    totalSpins: spins.length,
    withReview: spins.filter((s) => Boolean(s.review_screenshot_url)).length,
    withSocial: spins.filter(
      (s) =>
        s.followed_social ||
        (Array.isArray(s.completed_flow_steps) &&
          s.completed_flow_steps.some((step) => step !== "google_review")),
    ).length,
    withEmail: spins.filter((s) => Boolean(s.claim_email?.trim())).length,
    withClaim: spins.filter((s) => Boolean(s.prize_code)).length,
  };
}
