"use client";

import { useI18n } from "@/i18n/client";
import { formatRedemptionRuleLines, type RedemptionRulesSnapshot } from "@/lib/redemption-rules";

export function PrizeCoupon({
  prizeLabel,
  prizeCode,
  rules,
  compact = false,
}: {
  prizeLabel: string;
  prizeCode: string;
  rules: RedemptionRulesSnapshot | null;
  compact?: boolean;
}) {
  const { t, locale } = useI18n();
  const ruleLines = rules ? formatRedemptionRuleLines(rules, t, locale) : [];

  return (
    <div
      className={`brutal-card border-dashed bg-[var(--c-cream)] text-center ${
        compact ? "px-3 py-4" : "px-4 py-6"
      }`}
    >
      <p className="text-xs font-extrabold uppercase tracking-wider text-muted">{t("public.youWon")}</p>
      <p
        className={`mt-2 font-[family-name:var(--font-display)] font-extrabold uppercase leading-tight text-ink ${
          compact ? "text-lg" : "text-2xl sm:text-3xl"
        }`}
      >
        {prizeLabel}
      </p>
      <div className="mt-4 rounded-[12px] border-2 border-dashed border-black bg-white px-3 py-4">
        <p className="text-xs font-extrabold uppercase tracking-wider text-muted">{t("public.checkoutCode")}</p>
        <p className={`mt-2 font-mono font-extrabold tracking-wider text-ink ${compact ? "text-2xl" : "text-4xl"}`}>
          {prizeCode}
        </p>
      </div>
      {ruleLines.length > 0 && (
        <div className="mt-4 text-left">
          <p className="text-xs font-extrabold uppercase tracking-wider text-muted">{t("public.redeemRulesTitle")}</p>
          <ul className="mt-2 space-y-1.5">
            {ruleLines.map((line) => (
              <li key={line} className="flex items-start gap-2 text-sm font-semibold text-ink">
                <span className="mt-0.5 text-[var(--c-purple-deep)]" aria-hidden>
                  ✓
                </span>
                <span>{line}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
