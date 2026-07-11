"use client";

import { ColorField } from "@/components/ui/ColorField";
import { normalizeHex } from "@/lib/qr-design";

export function QRColorSwatch({
  label,
  value,
  fallback = "#ffffff",
  onChange,
}: {
  label: string;
  value: string;
  fallback?: string;
  onChange: (value: string) => void;
}) {
  const color = normalizeHex(value, fallback);

  return (
    <ColorField
      label={label}
      value={color}
      fallback={fallback}
      onChange={onChange}
      variant="swatch"
    />
  );
}
