"use client";

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
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <div className="space-y-2">
        <label className={ui.label}>{t("dashboard.primaryColor")}</label>
        <input
          type="color"
          value={primaryColor}
          onChange={(e) => onPrimaryChange(e.target.value)}
          className="h-12 w-full min-w-0 cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
        />
      </div>
      <div className="space-y-2">
        <label className={ui.label}>{t("dashboard.secondaryColor")}</label>
        <input
          type="color"
          value={secondaryColor}
          onChange={(e) => onSecondaryChange(e.target.value)}
          className="h-12 w-full min-w-0 cursor-pointer rounded-[14px] border-2 border-black bg-white p-1"
        />
      </div>
    </div>
  );
}
