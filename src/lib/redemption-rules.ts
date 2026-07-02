export type RedemptionRulesSnapshot = {
  redeem_next_visit: boolean;
  redeem_min_spend_cents: number | null;
  redeem_expires_at: string | null;
};

export type PrizeRedemptionConfig = {
  redeem_next_visit?: boolean;
  redeem_min_spend_cents?: number | null;
  redeem_valid_days?: number | null;
};

export function computeRedemptionExpiry(validDays: number | null | undefined): string | null {
  if (!validDays || validDays < 1) return null;
  const expires = new Date();
  expires.setDate(expires.getDate() + validDays);
  return expires.toISOString();
}

export function snapshotFromPrize(prize: PrizeRedemptionConfig): RedemptionRulesSnapshot {
  return {
    redeem_next_visit: Boolean(prize.redeem_next_visit),
    redeem_min_spend_cents: prize.redeem_min_spend_cents ?? null,
    redeem_expires_at: computeRedemptionExpiry(prize.redeem_valid_days),
  };
}

export function formatMoneyFromCents(cents: number, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: cents % 100 === 0 ? 0 : 2,
  }).format(cents / 100);
}

export function formatExpiryDate(iso: string, locale: string): string {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: "medium",
  }).format(new Date(iso));
}

type RuleTranslator = (key: string, vars?: Record<string, string | number>) => string;

export function formatRedemptionRuleLines(
  rules: RedemptionRulesSnapshot,
  t: RuleTranslator,
  locale: string,
): string[] {
  const lines: string[] = [];

  if (rules.redeem_next_visit) {
    lines.push(t("public.redeemNextVisit"));
  }

  if (rules.redeem_min_spend_cents != null && rules.redeem_min_spend_cents > 0) {
    lines.push(
      t("public.redeemMinSpend", {
        amount: formatMoneyFromCents(rules.redeem_min_spend_cents, locale),
      }),
    );
  }

  if (rules.redeem_expires_at) {
    lines.push(
      t("public.redeemExpiresOn", {
        date: formatExpiryDate(rules.redeem_expires_at, locale),
      }),
    );
  }

  return lines;
}

export function parseMinSpendInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const normalized = trimmed.replace(",", ".");
  const euros = Number.parseFloat(normalized);
  if (Number.isNaN(euros) || euros < 0) return null;
  return Math.round(euros * 100);
}

export function formatMinSpendInput(cents: number | null | undefined): string {
  if (cents == null || cents <= 0) return "";
  return (cents / 100).toFixed(cents % 100 === 0 ? 0 : 2);
}
