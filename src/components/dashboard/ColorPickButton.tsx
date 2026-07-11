"use client";

import { ColorField } from "@/components/ui/ColorField";

export function ColorPickButton({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <ColorField
      label={label}
      value={value}
      fallback={value || "#E85D04"}
      onChange={onChange}
      variant="fill"
    />
  );
}
