"use client";

import { ColorField } from "@/components/ui/ColorField";
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
      <ColorField
        label={t("dashboard.primaryColor")}
        value={primaryColor}
        fallback="#E85D04"
        onChange={onPrimaryChange}
        variant="field"
      />
      <ColorField
        label={t("dashboard.secondaryColor")}
        value={secondaryColor}
        fallback="#F5E08E"
        onChange={onSecondaryChange}
        variant="field"
      />
    </div>
  );
}
