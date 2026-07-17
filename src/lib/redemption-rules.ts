/** Min spend amount stored as a whole major unit in `redeem_min_spend_cents` (legacy column name). */

import type { PricingMarket } from "@/lib/pricing-market";

export type RedeemCurrency = "EUR" | "USD" | "VND";

export const REDEEM_CURRENCIES: {
  id: RedeemCurrency;
  symbol: string;
  labelKey: string;
}[] = [
  { id: "EUR", symbol: "€", labelKey: "dashboard.redeemCurrencyEur" },
  { id: "USD", symbol: "$", labelKey: "dashboard.redeemCurrencyUsd" },
  { id: "VND", symbol: "₫", labelKey: "dashboard.redeemCurrencyVnd" },
];

export function isRedeemCurrency(value: string | null | undefined): value is RedeemCurrency {
  return value === "EUR" || value === "USD" || value === "VND";
}

/** France geo/market → EUR; everywhere else defaults to VND (legacy). */
export function defaultRedeemCurrency(market: PricingMarket | null | undefined): RedeemCurrency {
  return market === "fr" ? "EUR" : "VND";
}

export function normalizeRedeemCurrency(
  value: string | null | undefined,
  fallback: RedeemCurrency = "VND",
): RedeemCurrency {
  return isRedeemCurrency(value) ? value : fallback;
}

export type RedemptionRulesSnapshot = {
  redeem_next_visit: boolean;
  redeem_min_spend_cents: number | null;
  redeem_min_spend_currency?: RedeemCurrency | null;
  redeem_expires_at: string | null;
};

export type PrizeRedemptionConfig = {
  redeem_next_visit?: boolean;
  redeem_min_spend_cents?: number | null;
  redeem_min_spend_currency?: string | null;
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
    redeem_min_spend_currency: normalizeRedeemCurrency(prize.redeem_min_spend_currency, "VND"),
    redeem_expires_at: computeRedemptionExpiry(prize.redeem_valid_days),
  };
}

function localeForCurrency(currency: RedeemCurrency, locale: string): string {
  if (currency === "VND") return locale === "vi" ? "vi-VN" : locale;
  if (currency === "EUR") return locale === "fr" ? "fr-FR" : locale;
  if (currency === "USD") return locale === "en" ? "en-US" : locale;
  return locale;
}

export function formatMinSpendAmount(
  amount: number,
  locale: string,
  currency: RedeemCurrency = "VND",
): string {
  const loc = localeForCurrency(currency, locale);
  return new Intl.NumberFormat(loc, {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "VND" ? 0 : 2,
    minimumFractionDigits: 0,
  }).format(amount);
}

/** @deprecated Prefer formatMinSpendAmount with an explicit currency. */
export function formatMinSpendVnd(amount: number, locale: string): string {
  return formatMinSpendAmount(amount, locale, "VND");
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
    const currency = normalizeRedeemCurrency(rules.redeem_min_spend_currency, "VND");
    lines.push(
      t("public.redeemMinSpend", {
        amount: formatMinSpendAmount(rules.redeem_min_spend_cents, locale, currency),
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
  const amount = Number.parseInt(digits, 10);
  if (Number.isNaN(amount) || amount < 0) return null;
  return amount;
}

export function formatMinSpendInput(
  amount: number | null | undefined,
  currency: RedeemCurrency = "VND",
): string {
  if (amount == null || amount <= 0) return "";
  const locale = currency === "EUR" ? "fr-FR" : currency === "USD" ? "en-US" : "vi-VN";
  return new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount);
}

export function minSpendPlaceholder(currency: RedeemCurrency): string {
  if (currency === "EUR") return "15";
  if (currency === "USD") return "15";
  return "500.000";
}
