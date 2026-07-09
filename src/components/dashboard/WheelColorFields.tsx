"use client";

import { contrastTextColor } from "@/lib/wheel";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";

export function WheelColorFields({
  primaryColor,
  secondaryColor,
  onPrimaryChange,
  onSecondaryChange,
}: {
  primaryColor: string;
  secondaryColor: string;
  onPrimaryChange: (value: string) => void;
  onSecondaryChange: (value: string) => void;
}) {
  const t = useTranslations();

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label className={ui.label}>{t("dashboard.primaryColor")}</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={primaryColor}
              onChange={(e) => onPrimaryChange(e.target.value)}
              className="h-12 w-full min-w-0 flex-1 cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
            />
            <span
              className="inline-flex h-12 min-w-[5.5rem] items-center justify-center rounded-[14px] border-2 border-black px-3 text-xs font-extrabold uppercase shadow-[3px_3px_0_0_#0a0a0a]"
              style={{ backgroundColor: primaryColor, color: contrastTextColor(primaryColor) }}
            >
              Primary
            </span>
          </div>
        </div>
        <div className="space-y-2">
          <label className={ui.label}>{t("dashboard.secondaryColor")}</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={secondaryColor}
              onChange={(e) => onSecondaryChange(e.target.value)}
              className="h-12 w-full min-w-0 flex-1 cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
            />
            <span
              className="inline-flex h-12 min-w-[5.5rem] items-center justify-center rounded-[14px] border-2 border-black px-3 text-xs font-extrabold uppercase shadow-[3px_3px_0_0_#0a0a0a]"
              style={{ backgroundColor: secondaryColor, color: contrastTextColor(secondaryColor) }}
            >
              Secondary
            </span>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-3">
        <span
          className="brutal-btn text-sm"
          style={{ backgroundColor: primaryColor, color: contrastTextColor(primaryColor) }}
        >
          Spin button preview
        </span>
        <span className="brutal-btn brutal-btn-white text-sm" style={{ borderColor: secondaryColor }}>
          Outline preview
        </span>
      </div>
    </div>
  );
}
