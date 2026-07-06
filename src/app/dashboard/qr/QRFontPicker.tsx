"use client";

import { QR_FONT_CATEGORIES, QR_FONTS, type QRFontCategory } from "@/lib/qr-fonts";
import { ui } from "@/components/ui/styles";
import { useTranslations } from "@/i18n/client";

export function QRFontPicker({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (fontId: string) => void;
}) {
  const t = useTranslations();

  const grouped = QR_FONT_CATEGORIES.map((cat) => ({
    ...cat,
    fonts: QR_FONTS.filter((f) => f.category === cat.id),
  }));

  return (
    <div>
      <label className={ui.label} htmlFor={id}>
        {label}
      </label>
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${ui.input} font-medium`}
        style={{ fontFamily: QR_FONTS.find((f) => f.id === value)?.googleFamily }}
      >
        {grouped.map((group) => (
          <optgroup key={group.id} label={t(group.labelKey)}>
            {group.fonts.map((font) => (
              <option key={font.id} value={font.id} style={{ fontFamily: font.googleFamily }}>
                {font.label}
              </option>
            ))}
          </optgroup>
        ))}
      </select>
    </div>
  );
}

export function getCategoryLabelKey(category: QRFontCategory): string {
  return QR_FONT_CATEGORIES.find((c) => c.id === category)?.labelKey ?? "dashboard.qrFontCat_sans";
}
