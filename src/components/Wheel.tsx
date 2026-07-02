"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { Prize } from "@/lib/types";
import { useTranslations } from "@/i18n/client";
import { WheelPointer } from "@/components/WheelPointer";
import {
  contrastTextColor,
  describeSlice,
  pickWeightedPrize,
  polarToCartesian,
  prizeEqualSliceAngles,
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

const SLICE_COLORS = ["#f5e08e", "#d8ccf5", "#f48fb1", "#a8e6cf", "#b8cfe8", "#f4a89a"];

function wheelLabelFontSize(label: string, sliceCount: number): string {
  const sliceAngle = 360 / Math.max(sliceCount, 1);
  if (label.length > 16) return sliceAngle < 60 ? "3.8" : "4.2";
  if (label.length > 11) return sliceAngle < 60 ? "4.2" : "4.8";
  return "5.5";
}

export function Wheel({
  prizes,
  primaryColor,
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
  const slices = prizeEqualSliceAngles(prizes);

  const cx = 50;
  const cy = 50;
  const r = 44;
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
      : (() => {
          const picked = pickWeightedPrize(prizes);
          return picked
            ? (slices.find((s) => s.prize.id === picked.id) ?? slices[0])
            : slices[0];
        })();

    if (!target) {
      setSpinning(false);
      return;
    }

    const sliceMid = (target.start + target.end) / 2;
    const extraTurns = 5 * 360;
    const finalRotation = extraTurns + (360 - sliceMid);
    setRotation((prev) => prev + finalRotation);

    setTimeout(() => {
      setSpinning(false);
      onSpinComplete(target.prize);
    }, 4500);
  }, [spinning, slices, targetPrizeId, setSpinning, onSpinComplete, prizes]);

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

        <svg
          viewBox="0 0 100 100"
          width={wheelSize}
          height={wheelSize}
          className="marketing-wheel block"
          aria-hidden
        >
          <circle cx={cx} cy={cy} r={r + 3} fill="#fff" stroke="#0a0a0a" strokeWidth="2.5" />
          <g
            className="marketing-wheel__disc"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: "transform 4500ms cubic-bezier(0.15, 0.85, 0.25, 1)",
            }}
          >
            {slices.map((slice, i) => {
              const mid = (slice.start + slice.end) / 2;
              const labelPos = polarToCartesian(cx, cy, 26, mid);
              const labelRotation = sliceLabelRotation(mid);
              const fill = SLICE_COLORS[i % SLICE_COLORS.length]!;
              const label = slice.prize.label.trim();

              return (
                <g key={slice.prize.id}>
                  <path
                    d={describeSlice(cx, cy, r, slice.start, slice.end)}
                    fill={fill}
                    stroke="#0a0a0a"
                    strokeWidth="1.25"
                  />
                  <text
                    x={labelPos.x}
                    y={labelPos.y}
                    fill="#0a0a0a"
                    fontSize={wheelLabelFontSize(label, slices.length)}
                    fontWeight="800"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${labelRotation}, ${labelPos.x}, ${labelPos.y})`}
                    style={{ fontFamily: "var(--font-game), system-ui, sans-serif" }}
                  >
                    {label}
                  </text>
                </g>
              );
            })}
          </g>
          <circle cx={cx} cy={cy} r="9" fill="#fff" stroke="#0a0a0a" strokeWidth="2" />
          <circle cx={cx} cy={cy} r="3.5" fill="#f5e08e" stroke="#0a0a0a" strokeWidth="1.25" />
        </svg>
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
