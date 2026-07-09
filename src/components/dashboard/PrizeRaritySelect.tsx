"use client";

import { PRIZE_RARITY_TIERS, type PrizeRarityTier } from "@/lib/prize-rarity";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";

const TIER_DOT: Record<PrizeRarityTier, string> = {
  common: "#22c55e",
  uncommon: "#3b82f6",
  rare: "#a855f7",
  epic: "#ef4444",
  jackpot: "#eab308",
};

export function PrizeRaritySelect({
  value,
  onChange,
  disabled,
}: {
  value: PrizeRarityTier;
  onChange: (tier: PrizeRarityTier) => void;
  disabled?: boolean;
}) {
  const t = useTranslations();

  return (
    <select
      value={value}
      disabled={disabled}
      onChange={(e) => onChange(e.target.value as PrizeRarityTier)}
      className={ui.input}
    >
      {PRIZE_RARITY_TIERS.map((tier) => (
        <option key={tier} value={tier}>
          {t(`dashboard.prizeRarity_${tier}`)}
        </option>
      ))}
    </select>
  );
}

export function PrizeRarityBadge({ tier }: { tier: PrizeRarityTier }) {
  const t = useTranslations();
  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wide text-muted">
      <span
        className="inline-block h-2.5 w-2.5 rounded-full border border-black/20"
        style={{ backgroundColor: TIER_DOT[tier] }}
        aria-hidden
      />
      {t(`dashboard.prizeRarity_${tier}`)}
    </span>
  );
}
