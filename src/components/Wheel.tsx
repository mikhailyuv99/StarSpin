"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Prize } from "@/lib/types";
import { useTranslations } from "@/i18n/client";
import { WheelPointer } from "@/components/WheelPointer";
import {
  contrastTextColor,
  describeSlice,
  polarToCartesian,
  prizeSliceAngles,
  sliceLabelRotation,
} from "@/lib/wheel";

interface WheelProps {
  prizes: Prize[];
  primaryColor: string;
  secondaryColor: string;
  onSpinComplete: (prize: Prize) => void;
  spinning: boolean;
  setSpinning: (v: boolean) => void;
  targetPrizeId?: string;
  hideSpinButton?: boolean;
}

const FALLBACK_SLICE_COLORS = ["#f5e08e", "#d8ccf5", "#f48fb1", "#b8cfe8", "#a8e6cf", "#f4a89a"];

function truncateLabel(label: string, sliceAngle: number): string {
  const maxChars = sliceAngle < 20 ? 5 : sliceAngle < 35 ? 8 : sliceAngle < 55 ? 12 : 16;
  if (label.length <= maxChars) return label;
  return `${label.slice(0, maxChars - 1)}…`;
}

export function Wheel({
  prizes,
  primaryColor,
  secondaryColor,
  onSpinComplete,
  spinning,
  setSpinning,
  targetPrizeId,
  hideSpinButton = false,
}: WheelProps) {
  const t = useTranslations();
  const [rotation, setRotation] = useState(0);
  const [wheelSize, setWheelSize] = useState(280);
  const spunRef = useRef<string | undefined>(undefined);
  const slices = prizeSliceAngles(prizes);

  const colors = [primaryColor, secondaryColor, ...FALLBACK_SLICE_COLORS];
  const cx = 50;
  const cy = 50;
  const r = 44;
  const hubSize = Math.round(wheelSize * 0.18);
  const pointerW = Math.round(wheelSize * 0.22);
  const pointerH = Math.round(wheelSize * 0.17);

  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      setWheelSize(Math.min(Math.max(w * 0.88, 300), 400));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const spin = useCallback(() => {
    if (spinning || slices.length === 0) return;
    setSpinning(true);

    const target = targetPrizeId
      ? (slices.find((s) => s.prize.id === targetPrizeId) ?? slices[0])
      : slices[Math.floor(Math.random() * slices.length)];

    const sliceMid = (target.start + target.end) / 2;
    const extraTurns = 5 * 360;
    const finalRotation = extraTurns + (360 - sliceMid);
    setRotation((prev) => prev + finalRotation);

    setTimeout(() => {
      setSpinning(false);
      onSpinComplete(target.prize);
    }, 4500);
  }, [spinning, slices, targetPrizeId, setSpinning, onSpinComplete]);

  useEffect(() => {
    if (targetPrizeId && !spinning && spunRef.current !== targetPrizeId) {
      spunRef.current = targetPrizeId;
      spin();
    }
  }, [targetPrizeId, spinning, spin]);

  if (slices.length === 0) {
    return <p className="text-center text-sm font-semibold text-muted">{t("public.wheelEmpty")}</p>;
  }

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="marketing-wheel-wrap" style={{ width: wheelSize, height: wheelSize }}>
        <div className="marketing-wheel-pointer" aria-hidden>
          <WheelPointer width={pointerW} height={pointerH} />
        </div>

        <div
          className="marketing-wheel transition-transform duration-[4500ms] ease-[cubic-bezier(0.15,0.85,0.25,1)]"
          style={{
            width: wheelSize,
            height: wheelSize,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <svg viewBox="0 0 100 100" width="100%" height="100%" className="block" aria-hidden>
            <circle cx={cx} cy={cy} r={r + 3} fill="#fff" stroke="#0a0a0a" strokeWidth="2.5" />
            {slices.map((slice, i) => {
              const sliceAngle = slice.end - slice.start;
              const mid = (slice.start + slice.end) / 2;
              const labelPos = polarToCartesian(cx, cy, 26, mid);
              const labelRotation = sliceLabelRotation(mid);
              const fill = colors[i % colors.length]!;
              const label = truncateLabel(slice.prize.label, sliceAngle);

              return (
                <g key={slice.prize.id}>
                  <path
                    d={describeSlice(cx, cy, r, slice.start, slice.end)}
                    fill={fill}
                    stroke="#0a0a0a"
                    strokeWidth="1.25"
                  />
                  {sliceAngle >= 14 && (
                    <text
                      x={labelPos.x}
                      y={labelPos.y}
                      fill="#0a0a0a"
                      fontSize={sliceAngle < 25 ? "4.2" : sliceAngle < 40 ? "4.8" : "5.5"}
                      fontWeight="800"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      transform={`rotate(${labelRotation}, ${labelPos.x}, ${labelPos.y})`}
                      style={{ fontFamily: "var(--font-game), system-ui, sans-serif" }}
                    >
                      {label}
                    </text>
                  )}
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r="9" fill="#fff" stroke="#0a0a0a" strokeWidth="2" />
          </svg>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="flex items-center justify-center rounded-full border-[2.5px] border-black bg-[var(--c-yellow)] text-[11px] font-extrabold uppercase tracking-wider text-black"
            style={{ width: hubSize, height: hubSize }}
          >
            {t("public.wheelGo")}
          </div>
        </div>
      </div>

      {!hideSpinButton && (
        <button
          type="button"
          onClick={spin}
          disabled={spinning}
          className="public-btn public-touch-target max-w-xs"
          style={{ backgroundColor: primaryColor, color: contrastTextColor(primaryColor) }}
        >
          {spinning ? t("public.wheelSpinning") : t("public.wheelSpin")}
        </button>
      )}
    </div>
  );
}
