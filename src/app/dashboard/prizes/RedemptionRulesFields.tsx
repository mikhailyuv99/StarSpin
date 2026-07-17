"use client";

import { useEffect, useRef, useState } from "react";
import { ui } from "@/components/ui/styles";
import { usePricingMarket } from "@/components/providers/PricingMarketProvider";
import {
  defaultRedeemCurrency,
  formatMinSpendInput,
  minSpendPlaceholder,
  normalizeRedeemCurrency,
  REDEEM_CURRENCIES,
  type RedeemCurrency,
} from "@/lib/redemption-rules";
import { useTranslations } from "@/i18n/client";

export type RedemptionFormState = {
  redeem_next_visit: boolean;
  redeem_min_spend: string;
  redeem_min_spend_currency: RedeemCurrency;
  redeem_valid_days: string;
};

export function emptyRedemptionForm(
  currency: RedeemCurrency = "VND",
): RedemptionFormState {
  return {
    redeem_next_visit: false,
    redeem_min_spend: "",
    redeem_min_spend_currency: currency,
    redeem_valid_days: "",
  };
}

export function redemptionFormFromPrize(
  prize: {
    redeem_next_visit?: boolean;
    redeem_min_spend_cents?: number | null;
    redeem_min_spend_currency?: string | null;
    redeem_valid_days?: number | null;
  },
  fallbackCurrency: RedeemCurrency = "VND",
): RedemptionFormState {
  const currency = normalizeRedeemCurrency(prize.redeem_min_spend_currency, fallbackCurrency);
  return {
    redeem_next_visit: Boolean(prize.redeem_next_visit),
    redeem_min_spend:
      prize.redeem_min_spend_cents != null && prize.redeem_min_spend_cents > 0
        ? formatMinSpendInput(prize.redeem_min_spend_cents, currency)
        : "",
    redeem_min_spend_currency: currency,
    redeem_valid_days:
      prize.redeem_valid_days != null && prize.redeem_valid_days > 0
        ? String(prize.redeem_valid_days)
        : "",
  };
}

function CurrencyDropdown({
  value,
  onChange,
  label,
}: {
  value: RedeemCurrency;
  onChange: (next: RedeemCurrency) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);
  const selected = REDEEM_CURRENCIES.find((c) => c.id === value) ?? REDEEM_CURRENCIES[0];

  useEffect(() => {
    if (!open) return;
    const onDocClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDocClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDocClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} className="relative w-[6.5rem] shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
        className={`${ui.input} flex w-full items-center justify-between gap-1 !px-3`}
      >
        <span className="font-extrabold">
          {selected.symbol} {selected.id}
        </span>
        <span aria-hidden className={`text-xs transition-transform ${open ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="absolute left-0 top-[calc(100%+4px)] z-20 w-full overflow-hidden rounded-[14px] border-2 border-black bg-white shadow-[3px_3px_0_0_#000]"
        >
          {REDEEM_CURRENCIES.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                role="option"
                aria-selected={c.id === value}
                onClick={() => {
                  onChange(c.id);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2 text-left text-sm font-bold text-ink hover:bg-[var(--c-cream)] ${
                  c.id === value ? "bg-[var(--c-cream)]" : ""
                }`}
              >
                <span className="w-4 text-center">{c.symbol}</span>
                <span>{c.id}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RedemptionRulesFields({
  value,
  onChange,
}: {
  value: RedemptionFormState;
  onChange: (next: RedemptionFormState) => void;
}) {
  const t = useTranslations();
  const market = usePricingMarket();
  const currency = normalizeRedeemCurrency(
    value.redeem_min_spend_currency,
    defaultRedeemCurrency(market),
  );

  return (
    <div className="rounded-[14px] border-2 border-black/15 bg-[var(--c-cream)]/60 p-4">
      <p className="text-sm font-extrabold text-ink">{t("dashboard.redeemRulesTitle")}</p>
      <p className={`mt-1 ${ui.muted}`}>{t("dashboard.redeemRulesHint")}</p>

      <label className="mt-4 flex items-start gap-3">
        <input
          type="checkbox"
          checked={value.redeem_next_visit}
          onChange={(e) => onChange({ ...value, redeem_next_visit: e.target.checked })}
          className="mt-1 h-4 w-4 accent-black"
        />
        <span className="text-sm font-semibold text-ink">{t("dashboard.redeemNextVisit")}</span>
      </label>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={ui.label}>{t("dashboard.redeemMinSpend")}</label>
          <div className="flex gap-2">
            <input
              type="text"
              inputMode="numeric"
              placeholder={minSpendPlaceholder(currency)}
              value={value.redeem_min_spend}
              onChange={(e) => onChange({ ...value, redeem_min_spend: e.target.value })}
              className={`${ui.input} min-w-0 flex-1`}
            />
            <CurrencyDropdown
              value={currency}
              label={t("dashboard.redeemCurrency")}
              onChange={(next) =>
                onChange({ ...value, redeem_min_spend_currency: next })
              }
            />
          </div>
          <p className="mt-1 text-xs font-medium text-muted">
            {t("dashboard.redeemMinSpendHint", { currency })}
          </p>
        </div>
        <div>
          <label className={ui.label}>{t("dashboard.redeemValidDays")}</label>
          <input
            type="number"
            min={1}
            max={365}
            placeholder="30"
            value={value.redeem_valid_days}
            onChange={(e) => onChange({ ...value, redeem_valid_days: e.target.value })}
            className={ui.input}
          />
        </div>
      </div>
    </div>
  );
}
