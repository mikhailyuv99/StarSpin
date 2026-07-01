"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Prize } from "@/lib/types";
import { useTranslations } from "@/i18n/client";
import {
  contrastTextColor,
  describeSlice,
  labelFontSize,
  polarToCartesian,
  prizeSliceAngles,
  shouldShowSliceLabel,
  sliceLabelRadius,
  sliceLabelRotation,
  wheelSliceLabel,
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

  const cx = wheelSize / 2;
  const cy = wheelSize / 2;
  const r = wheelSize / 2 - 10;
  const hubSize = Math.round(wheelSize * 0.2);

  return (
    <div className="flex w-full flex-col items-center gap-4">
      <div className="relative" style={{ width: wheelSize, height: wheelSize }}>
        <div className="absolute -top-2 left-1/2 z-20 -translate-x-1/2" aria-hidden>
          <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
            <path d="M14 24L2 4h24L14 24z" fill="#0a0a0a" />
            <path d="M14 21L5 7h18L14 21z" fill="#f5e08e" />
          </svg>
        </div>

        <div
          className="rounded-full border-[3px] border-black shadow-[6px_6px_0_0_#0a0a0a] transition-transform duration-[4500ms] ease-[cubic-bezier(0.15,0.85,0.25,1)]"
          style={{
            width: wheelSize,
            height: wheelSize,
            transform: `rotate(${rotation}deg)`,
          }}
        >
          <svg
            width={wheelSize}
            height={wheelSize}
            viewBox={`0 0 ${wheelSize} ${wheelSize}`}
            className="block"
          >
            <circle cx={cx} cy={cy} r={r + 4} fill="#0a0a0a" />
            {slices.map((slice, i) => {
              const sliceAngle = slice.end - slice.start;
              const mid = (slice.start + slice.end) / 2;
              const labelR = sliceLabelRadius(r, sliceAngle);
              const textPos = polarToCartesian(cx, cy, labelR, mid);
              const fill = colors[i % colors.length]!;
              const showLabel = shouldShowSliceLabel(sliceAngle);
              const fontSize = labelFontSize(sliceAngle);
              const label = wheelSliceLabel(slice.prize.label, sliceAngle);
              const rotation = sliceLabelRotation(mid);
              const textFill = contrastTextColor(fill);

              return (
                <g key={slice.prize.id}>
                  <path
                    d={describeSlice(cx, cy, r, slice.start, slice.end)}
                    fill={fill}
                    stroke="#0a0a0a"
                    strokeWidth={2}
                  />
                  {showLabel && (
                    <text
                      x={textPos.x}
                      y={textPos.y}
                      transform={`rotate(${rotation}, ${textPos.x}, ${textPos.y})`}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={textFill}
                      fontSize={fontSize}
                      fontWeight={800}
                      style={{ fontFamily: "var(--font-game), system-ui, sans-serif" }}
                    >
                      {label}
                    </text>
                  )}
                </g>
              );
            })}
            <circle cx={cx} cy={cy} r={hubSize / 2 + 2} fill="#fff" stroke="#0a0a0a" strokeWidth={2.5} />
          </svg>
        </div>

        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <div
            className="flex items-center justify-center rounded-full border-[2.5px] border-black bg-[var(--c-yellow)] text-[11px] font-extrabold uppercase tracking-wider text-black shadow-[2px_2px_0_0_#0a0a0a]"
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
