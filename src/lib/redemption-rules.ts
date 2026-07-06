/** Minimum spend is stored as whole VND in `redeem_min_spend_cents` (legacy column name). */

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

export function formatMinSpendVnd(amount: number, locale: string): string {
  const loc = locale === "vi" ? "vi-VN" : locale;
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency: "VND",
    maximumFractionDigits: 0,
  }).format(amount);
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
        amount: formatMinSpendVnd(rules.redeem_min_spend_cents, locale),
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
  const digits = value.trim().replace(/[^\d]/g, "");
  if (!digits) return null;
  const vnd = Number.parseInt(digits, 10);
  if (Number.isNaN(vnd) || vnd < 0) return null;
  return vnd;
}

export function formatMinSpendInput(vnd: number | null | undefined): string {
  if (vnd == null || vnd <= 0) return "";
  return new Intl.NumberFormat("vi-VN").format(vnd);
}
