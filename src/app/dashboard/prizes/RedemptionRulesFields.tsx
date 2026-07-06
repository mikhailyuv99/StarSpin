"use client";

import { ui } from "@/components/ui/styles";
import { formatMinSpendInput } from "@/lib/redemption-rules";
import { useTranslations } from "@/i18n/client";

export type RedemptionFormState = {
  redeem_next_visit: boolean;
  redeem_min_spend: string;
  redeem_valid_days: string;
};

export const emptyRedemptionForm = (): RedemptionFormState => ({
  redeem_next_visit: false,
  redeem_min_spend: "",
  redeem_valid_days: "",
});

export function redemptionFormFromPrize(prize: {
  redeem_next_visit?: boolean;
  redeem_min_spend_cents?: number | null;
  redeem_valid_days?: number | null;
}): RedemptionFormState {
  return {
    redeem_next_visit: Boolean(prize.redeem_next_visit),
    redeem_min_spend:
      prize.redeem_min_spend_cents != null && prize.redeem_min_spend_cents > 0
        ? formatMinSpendInput(prize.redeem_min_spend_cents)
        : "",
    redeem_valid_days:
      prize.redeem_valid_days != null && prize.redeem_valid_days > 0
        ? String(prize.redeem_valid_days)
        : "",
  };
}

export function RedemptionRulesFields({
  value,
  onChange,
}: {
  value: RedemptionFormState;
  onChange: (next: RedemptionFormState) => void;
}) {
  const t = useTranslations();

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
          <input
            type="text"
            inputMode="numeric"
            placeholder="500.000"
            value={value.redeem_min_spend}
            onChange={(e) => onChange({ ...value, redeem_min_spend: e.target.value })}
            className={ui.input}
          />
          <p className="mt-1 text-xs font-medium text-muted">{t("dashboard.redeemMinSpendHint")}</p>
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
