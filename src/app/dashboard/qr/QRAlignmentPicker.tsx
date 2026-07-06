"use client";

import { ALIGNMENT_GRID, nearestGridIndex } from "@/lib/qr-design";
import { useTranslations } from "@/i18n/client";

export function QRAlignmentPicker({
  x,
  y,
  onPick,
}: {
  x: number;
  y: number;
  onPick: (x: number, y: number) => void;
}) {
  const t = useTranslations();
  const activeCol = nearestGridIndex(x);
  const activeRow = nearestGridIndex(y);

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-extrabold uppercase tracking-wide text-muted">
        {t("dashboard.qrAlignGrid")}
      </p>
      <div
        className="inline-grid grid-cols-3 gap-1 rounded-[12px] border-2 border-black bg-white p-1.5 shadow-[3px_3px_0_0_#0a0a0a]"
        role="group"
        aria-label={t("dashboard.qrAlignGrid")}
      >
        {ALIGNMENT_GRID.map((row, rowIdx) =>
          ALIGNMENT_GRID.map((col, colIdx) => {
            const isActive = rowIdx === activeRow && colIdx === activeCol;
            const isCenter = rowIdx === 1 && colIdx === 1;
            return (
              <button
                key={`${col}-${row}`}
                type="button"
                title={`${Math.round(col * 100)}% × ${Math.round(row * 100)}%`}
                onClick={() => onPick(col, row)}
                className={`flex h-8 w-8 items-center justify-center rounded-[8px] border-2 transition-colors ${
                  isActive
                    ? "border-black bg-[var(--c-yellow)]"
                    : "border-black/20 bg-[var(--c-cream)] hover:bg-[var(--c-lavender)]"
                }`}
              >
                <span
                  className={`rounded-full ${isCenter ? "h-3 w-3 bg-[#9b7fe8]" : "h-2 w-2 bg-black/30"}`}
                />
              </button>
            );
          }),
        )}
      </div>
    </div>
  );
}
